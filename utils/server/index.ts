import { Message } from '@/types/chat';
import { OpenAIModel } from '@/types/openai';
import { getOpenApiKey, isPrivateKey } from './apikey';

import { AZURE_DEPLOYMENT_ID, OPENAI_API_HOST, OPENAI_API_TYPE, OPENAI_API_VERSION, OPENAI_ORGANIZATION } from '../app/const';

import {
  ParsedEvent,
  ReconnectInterval,
  createParser,
} from 'eventsource-parser';

export class OpenAIError extends Error {
  type: string;
  param: string;
  code: string;

  constructor(message: string, type: string, param: string, code: string) {
    super(message);
    this.name = 'OpenAIError';
    this.type = type;
    this.param = param;
    this.code = code;
  }
}

export const OpenAIStream = async (
  model: OpenAIModel,
  systemPrompt: string,
  temperature: number,
  key: string,
  messages: Message[],
) => {
  let url = `${OPENAI_API_HOST}/v1/chat/completions`;
  if (OPENAI_API_TYPE === 'azure') {
    url = `${OPENAI_API_HOST}/openai/deployments/${AZURE_DEPLOYMENT_ID}/chat/completions?api-version=${OPENAI_API_VERSION}`;
  }

  const apikey = key ? key : getOpenApiKey()
  const _isPrivateKey = isPrivateKey(apikey);
  const maxTokens = _isPrivateKey ? 0 : parseInt(process.env.OPENAI_MAX_TOKENS as string) || 0;

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(OPENAI_API_TYPE === 'openai' && {
        Authorization: `Bearer ${apikey}`
      }),
      ...(OPENAI_API_TYPE === 'azure' && {
        'api-key': `${apikey}`
      }),
      ...((OPENAI_API_TYPE === 'openai' && OPENAI_ORGANIZATION) && {
        'OpenAI-Organization': OPENAI_ORGANIZATION,
      }),
    },
    method: 'POST',
    body: JSON.stringify({
      ...(OPENAI_API_TYPE === 'openai' && { model: model.id }),
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messages,
      ],

      // 不定义max_tokens输出的效果更好，服务器如果定义了max_tokens，则也会进行限制
      // max_tokens: maxTokens,
      ...(maxTokens ? {
        max_tokens: maxTokens
      } : {}),

      temperature: temperature,
      stream: true,
    }),
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  if (res.status !== 200) {
    const result = await res.json();
    if (result.error) {
      throw new OpenAIError(
        result.error.message,
        result.error.type,
        result.error.param,
        result.error.code,
      );
    } else {
      throw new Error(
        `OpenAI API returned an error: ${decoder.decode(result?.value) || result.statusText
        }`,
      );
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data;

          try {
            const json = JSON.parse(data);
            if (json.choices[0].finish_reason != null) {
              if (!_isPrivateKey) {
                if (process.env.ALLOW_CONTINUOUS_CHAT === 'false') {
                  const notAllowContinuousChatTips = process.env.NOT_ALLOW_CONTINUOUS_CHAT_TIPS || '提示：资源受限，连续对话模式已关闭。';
                  controller.enqueue(encoder.encode(`\n\n=== ${notAllowContinuousChatTips} ===`));
                } else if (process.env.POWERED_BY_INFO) {
                  controller.enqueue(encoder.encode(`\n\n=== ${process.env.POWERED_BY_INFO} ===`));
                }
              }

              controller.close();
              return;
            }
            const text = json.choices[0].delta.content;
            const queue = encoder.encode(text);
            controller.enqueue(queue);

          } catch (e) {
            controller.error(e);
          }
        }
      };

      const parser = createParser(onParse);

      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return stream;
};
