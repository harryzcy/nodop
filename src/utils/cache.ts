import * as fs from 'fs'
import path from 'path'

const fsPromises = fs.promises

export async function isDirectory(dir?: string): Promise<boolean> {
  if (!dir) {
    return false
  }
  try {
    const stats = await fsPromises.stat(dir)
    return stats.isDirectory()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return false
  }
}

interface Cache {
  running: boolean
  lastTimestamp: number
}

const cacheDir = process.env.CACHE_DIR
const cache: Cache = {
  running: false,
  lastTimestamp: 0
}

async function loadCache(cacheDir?: string) {
  if (!cacheDir) return
  if (!(await isDirectory(cacheDir))) {
    return
  }

  try {
    const cachePath = path.join(cacheDir, 'cache.json')
    const cacheData = await fsPromises.readFile(cachePath, 'utf8')
    const cacheObj = JSON.parse(cacheData) as Cache

    cache.running = cacheObj.running
    cache.lastTimestamp = cacheObj.lastTimestamp
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // ignore
  }
}

async function saveCache() {
  if (!cacheDir) return
  if (!(await isDirectory(cacheDir))) {
    return
  }
  const cachePath = path.join(cacheDir, 'cache.json')
  const cacheData = JSON.stringify({
    pid: cache.running ? process.pid : undefined,
    running: cache.running,
    lastTimestamp: cache.lastTimestamp
  })
  await fsPromises.writeFile(cachePath, cacheData, 'utf8')
}

function getLastTimestamp(): number {
  return cache.lastTimestamp
}

async function setLastTimestamp(timestamp: number) {
  cache.lastTimestamp = timestamp
  await saveCache()
}

async function startRun() {
  await loadCache(cacheDir)
  cache.running = true
  await saveCache()
}

async function stopRun() {
  cache.running = false
  await saveCache()
}

export default {
  getLastTimestamp,
  setLastTimestamp,
  startRun,
  stopRun
}
