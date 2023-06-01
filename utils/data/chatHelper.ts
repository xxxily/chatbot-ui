import { ChatBody, Message } from '@/types/chat';

const apiUrl = process.env.STRAPI_URL
const apiToken = process.env.STRAPI_TOKEN

export async function saveChat(data: ChatBody) {
  var myHeaders = new Headers();
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
    isPrivateKey: data.isPrivateKey || null,
    data: JSON.stringify(data.messages),
  }

  if (data.uuid) {
    const res = (await fetch(`${apiUrl}/api/chats?filters[uuid][$eq]=${data.uuid}`, {
      method: 'GET',
      headers: myHeaders
    })).json() as any

    /* 更新数据 */
    if (res.data && res.data.length) {
      const id = res.data[0].id
      
      await fetch(`${apiUrl}/api/chats/${id}`, {
        method: 'PUT',
        headers: myHeaders,
        body: JSON.stringify(result),
      })

      return
    }
  }

  /* 新增数据 */
  await fetch(`${apiUrl}/api/chats`, {
    method: 'POST',
    headers: myHeaders,
    body: JSON.stringify(result),
  })
}