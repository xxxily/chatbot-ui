import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const';
import { OpenAIError, OpenAIStream } from '@/utils/server';
import { getOpenApiKey, isPrivateKey } from '@/utils/server/apikey';

import { ChatBody, Message } from '@/types/chat';

// @ts-expect-error
import wasm from '../../node_modules/@dqbd/tiktoken/lite/tiktoken_bg.wasm?module';

import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json';
import { Tiktoken, init } from '@dqbd/tiktoken/lite/init';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const { model, messages, key, prompt, temperature } = (await req.json()) as ChatBody;
    const apikey = key ? key : getOpenApiKey();
    const _isPrivateKey = isPrivateKey(apikey);

    await init((imports) => WebAssembly.instantiate(wasm, imports));
    const encoding = new Tiktoken(
      tiktokenModel.bpe_ranks,
      tiktokenModel.special_tokens,
      tiktokenModel.pat_str,
    );

    let promptToSend = prompt;
    if (!promptToSend) {
      promptToSend = DEFAULT_SYSTEM_PROMPT;
    }

    /* 公key强制使用默认的系统提示 */
    if (!_isPrivateKey) {
      promptToSend = DEFAULT_SYSTEM_PROMPT || ''
    }

    let temperatureToUse = temperature;
    if (temperatureToUse == null) {
      temperatureToUse = DEFAULT_TEMPERATURE;
    }

    const prompt_tokens = encoding.encode(promptToSend);

    let tokenCount = prompt_tokens.length;
    let messagesToSend: Message[] = [];

    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const tokens = encoding.encode(message.content);

      if (tokenCount + tokens.length + 1000 > model.tokenLimit) {
        break;
      }
      tokenCount += tokens.length;
      messagesToSend = [message, ...messagesToSend];
    }

    encoding.free();

    /* 防止服务侧的apikey被过渡消耗 */
    if (!_isPrivateKey && messagesToSend) {
      const lastMessage = messagesToSend[messagesToSend.length - 1];
      const maxLen = parseInt(process.env.MAX_CHARACTER_SIZE as string) || 200;

      if (lastMessage && lastMessage.role === 'user' && lastMessage.content.length > maxLen) {
        return new Response(`输入的内容长度超过了 ${maxLen} 个字符，请缩短内容长度后再发送。  \n\n[使用私人的apikey不受此限制](https://hello-ai.anzz.top/home/buy.html)`);
      }
    }

    if (process.env.DEBUG) {
      console.log({
        messages: messagesToSend,
        apikey,
        tokenCount,
        isPrivateKey: _isPrivateKey,
      });
    }

    const stream = await OpenAIStream(model, promptToSend, temperatureToUse, key, messagesToSend);

    return new Response(stream);
  } catch (error) {
    console.error(error);
    if (error instanceof OpenAIError) {
      return new Response('Error', { status: 500, statusText: error.message });
    } else {
      return new Response('Error', { status: 500 });
    }
  }
};

export default handler;
