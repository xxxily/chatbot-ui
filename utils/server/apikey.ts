// import crypto from 'crypto';

const openApiKeyList: string[] = [];
const openApiKeys: Record<string, string> = {};

/* 初始化openApiKeys */
const keys = (process.env.OPENAI_API_KEY || '').split(';');
keys.forEach(key => {
  key = key.trim();
  openApiKeyList.push(key);
  // const keyhash = crypto.createHash('md5').update(key).digest('hex');
  // openApiKeys && (openApiKeys[keyhash] = key);
})

export const getOpenApiKey = (keyHash?: string) => {
  if (keyHash && openApiKeys[keyHash]) {
    return openApiKeys[keyHash];
  } else {
    return openApiKeyList[0] || '';
  }
}

export const isPrivateKey = (key: string) => {
  return !openApiKeyList.includes(key);
}
