import { ChatBody, Message } from '@/types/chat';

const apiUrl = process.env.STRAPI_URL
const apiToken = process.env.STRAPI_TOKEN

export async function saveChat(data: ChatBody) {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Authorization", `Bearer ${apiToken}`);

  if (!apiUrl || !apiToken) {
    // console.error('[saveChat][error] 未定义后端接口信息，无法执行saveChat操作')
    return
  }

  if (!data.messages || !data.messages.length) {
    console.error('[saveChat][error] 确实相关字段')
    return
  }

  const result = {
    title: (data.title || data.messages[0]?.content || '').slice(0, 260),
    uuid: data.uuid,
    ip: data.realIp || data.id || '',
    apikey: data.key || data.apikey,
    deviceId: data.deviceId || '',
    isPrivateKey: data.isPrivateKey || false,
    data: data.messages,
    userAgent: data.userAgent || '',
    referer: data.referer || '',
  }

  // console.log('----------[saveChat][result]----------', result)

  if (data.uuid) {
    const res = await (await fetch(`${apiUrl}/chats?filters[uuid][$eq]=${data.uuid}`, {
      method: 'GET',
      headers: myHeaders
    })).json() as any

    /* 更新数据 */
    if (res.data && res.data.length) {
      const id = res.data[0].id

      const updateRes = await (await fetch(`${apiUrl}/chats/${id}`, {
        method: 'PUT',
        headers: myHeaders,
        body: JSON.stringify({
          data: result
        }),
      })).json() as any

      // console.log('----------[saveChat][updateRes]----------', updateRes)

      return
    }
  }

  /* 新增数据 */
  const res = await (await fetch(`${apiUrl}/chats`, {
    method: 'POST',
    headers: myHeaders,
    body: JSON.stringify({
      data: result,
    }),
  })).json() as any

  // console.log('----------[saveChat][res]----------', res)
}