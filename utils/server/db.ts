import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync } from 'fs'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'

export interface LowdbData {
  [prop: string | number | symbol]: any
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootPath = join(process.cwd(), './.db')
// const rootPath = join(__dirname, '../../../.db')

/* 确保rootPath文件的存在 */
mkdirSync(rootPath, { recursive: true })

function getDayId() {
  const curTime = new Date()
  return `${curTime.getFullYear()}-${curTime.getMonth() + 1}-${curTime.getDate()}`
}

const dbList: Record<string, any> = {}

interface DatabaseOpts {
  dir?: string
  name?: string
  useDayId?: boolean
}

export async function getDatabase(opts: DatabaseOpts = {
  dir: './',
  name: 'db',
  useDayId: true,
}, autoCache = true) {
  const { dir, name, useDayId } = opts
  const dayId = getDayId()
  const dbDir = join(rootPath, dir || '')
  const dbName = useDayId ? `${name}_${dayId}` : `${name}`
  const dbId = dir + dbName

  if (dbList[dbId] && dbList[dbId].db && dbList[dbId].db.data)
    return dbList[dbId].db

  /* 移除旧的基于日期递增的数据库文件，防止内存堆积 */
  for (const key in dbList) {
    const dbInfo = dbList[key]
    if (dbInfo.useDayId && !key.includes(dayId))
      delete dbList[dbId]

    else if (dbInfo.lastSaveTime && (Date.now() - dbInfo.lastSaveTime) > 1000 * 60 * 60 * 24)
      delete dbList[dbId]
  }

  /* 创建json db文件 */
  mkdirSync(dbDir, { recursive: true })
  const file = join(dbDir, `${dbName}.json`)
  const db = new Low(new JSONFile<LowdbData>(file), {})
  await db.read()

  /* 缓存起来方便快速访问 */
  if (autoCache) {
    dbList[dbId] = {
      db,
      useDayId,
      saveing: false,
      saveQueue: [],
      name: dbName,
      dir: dbDir,
      lastSaveTime: Date.now(),
    }
  }

  return db
}

export async function saveDatabase(opts: DatabaseOpts = {
  dir: './',
  name: 'db',
  useDayId: true,
}) {
  const { dir, name, useDayId } = opts
  const dayId = getDayId()
  const dbName = useDayId ? `${name}_${dayId}` : `${name}`
  const dbId = dir + dbName

  const dbInfo = dbList[dbId]
  if (!dbInfo || !dbInfo.db) {
    console.error(`[saveDatabase][${dbId}]`, 'db not found')
    return
  }

  if (dbInfo.saveing) {
    const savePromise = new Promise((resolve, reject) => {
      dbInfo.saveQueue.push({ resolve, reject })
    })

    return savePromise
  }

  const saveQueue = dbInfo.saveQueue
  dbInfo.saveQueue = []
  dbInfo.saveing = true

  try {
    const db = dbInfo.db
    await db.write()

    for (const { resolve } of saveQueue)
      resolve()

    dbInfo.lastSaveTime = Date.now()
  }
  catch (e) {
    for (const { reject } of saveQueue)
      reject(e)

    console.error(`[saveDatabase][${dbId}]`, e)
  }

  dbInfo.saveing = false

  /* 检查是否有新的保存请求 */
  if (dbInfo.saveQueue.length > 0)
    saveDatabase(opts)
}

const JSON_DB = {
  get: getDatabase,
  save: saveDatabase,
}

export default JSON_DB
