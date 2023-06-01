import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const';
import { OpenAIError, OpenAIStream } from '@/utils/server';
import { getOpenApiKey, isPrivateKey } from '@/utils/server/apikey';
import { saveChat } from '@/utils/data/chatHelper';
import formatDate from '@/utils/helper/formatDate';

import { ChatBody, Message } from '@/types/chat';

// @ts-expect-error
import wasm from '../../node_modules/@dqbd/tiktoken/lite/tiktoken_bg.wasm?module';

import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json';
import { Tiktoken, init } from '@dqbd/tiktoken/lite/init';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  const msgDate = formatDate(Date.now(), 'yyyy-MM-dd HH:mm:ss SSS');
  const reqInfo: Record<string, any> = {}

  const realIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '0.0.0.0'
  // console.log(`[${msgDate}] [chat request]`, realIp)

  try {
    const { model, messages, key, prompt, temperature, uuid, deviceId } = (await req.json()) as ChatBody;
    const apikey = key ? key : getOpenApiKey();
    const _isPrivateKey = isPrivateKey(apikey);

    reqInfo['uuid'] = uuid
    reqInfo['deviceId'] = deviceId
    reqInfo['realIp'] = realIp
    reqInfo['model'] = model
    reqInfo['messages'] = messages
    reqInfo['key'] = key
    reqInfo['prompt'] = prompt
    reqInfo['temperature'] = temperature
    reqInfo['apikey'] = apikey
    reqInfo['isPrivateKey'] = _isPrivateKey

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
      const maxChatTimes = parseInt(process.env.OPENAI_MAX_CHAT_TIMES as string) || 0;
      const notAllowContinuousChat = process.env.ALLOW_CONTINUOUS_CHAT === 'false'

      if (lastMessage && lastMessage.role === 'user' && lastMessage.content.length > maxLen) {
        const maxLenTips = process.env.MAX_CHARACTER_SIZE_TIPS || `输入的内容长度超过了 ${maxLen} 个字符，请缩短内容长度后再发送。`
        return new Response(`${maxLenTips}`);
      }

      if (notAllowContinuousChat) {
        const userMessages = messagesToSend.filter(message => message.role === 'user')
        messagesToSend = [userMessages[userMessages.length - 1]];
      } else {
        if (maxChatTimes > 0 && messagesToSend.filter(message => message.role === 'assistant').length >= maxChatTimes) {
          const maxChatTimesTips = process.env.MAX_CHAT_TIMES_TIPS || `连续对话次数已超限，请新建聊天再进行对话。`
          return new Response(`${maxChatTimesTips}`);
        }
      }
    }

    if (process.env.DEBUG) {
      console.log(
        `[${msgDate}] [chat info]`,
        {
          messages: messagesToSend,
          apikey,
          tokenCount,
          realIp,
          isPrivateKey: _isPrivateKey,
        }
      );
    }

    const stream = await OpenAIStream(model, promptToSend, temperatureToUse, apikey, messagesToSend);

    try {
      saveChat(reqInfo as ChatBody)
    } catch (err) {
      console.error('[saveChat][error]', err)
    }

    return new Response(stream);
  } catch (error) {
    console.error(`[${msgDate}] [chat error]`, error);

    if (error instanceof OpenAIError) {
      // return new Response('Error', { status: 500, statusText: error.message });
      return new Response(`OpenAI错误 | OpenAI Error \n\n \`\`\`json\n${JSON.stringify(error, null, 2)}\n\`\`\``);
    } else {
      // return new Response('Error', { status: 500 });
      return new Response(`未知错误，请稍后再试。 | Unknown error, please try again later`);
    }
  }
};

export default handler;
