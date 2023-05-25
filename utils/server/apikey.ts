// import crypto from 'crypto';

const openApiKeyList: string[] = [];
const openApiKeys: Record<string, string> = {};

function keyGenerator(keys: string, spliter: string = ';') {
  const splitKeys = keys.split(spliter).map(key => key.trim()).filter(Boolean);
  // const uniqueKeys = [...new Set(splitKeys)];
  const uniqueKeys = Array.from(new Set(splitKeys));
  let index = 0;

  return function getNextKey() {
    const key = uniqueKeys[index];
    index = (index + 1) % uniqueKeys.length;
    return key;
  }
}

/* 支持多key轮询使用 */
const getNextAipKey = keyGenerator(process.env.OPENAI_API_KEY || '', ';');

/* 初始化openApiKeys */
export const keys = (process.env.OPENAI_API_KEY || '').split(';');
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
    return getNextAipKey() || '';
  }
}

export const isPrivateKey = (key: string) => {
  return !openApiKeyList.includes(key);
}
