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
  } catch (error) {
    return false
  }
}

interface Cache {
  running: boolean
  lastTimestamp: number
}

const cache: Cache = {
  running: false,
  lastTimestamp: 0
}

async function loadCache(cacheDir?: string) {
  if (!await isDirectory(cacheDir)) {
    return
  }

  try {
    const cachePath = path.join(cacheDir, 'cache.json')
    const cacheData = await fsPromises.readFile(cachePath, 'utf8')
    const cacheObj = JSON.parse(cacheData)

    cache.running = cacheObj.running
    cache.lastTimestamp = cacheObj.lastTimestamp
  } catch (error) {
    // ignore
  }
}

async function saveCache(cacheDir?: string) {
  if (!await isDirectory(cacheDir)) {
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

async function startRun(cacheDir: string) {
  await loadCache(cacheDir)
  cache.running = true
  await saveCache(cacheDir)
}

async function stopRun(cacheDir: string) {
  cache.running = false
  cache.lastTimestamp = Date.now()
  await saveCache(cacheDir)
}

export default {
  getLastTimestamp,
  startRun,
  stopRun
}
