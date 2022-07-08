import { homedir } from 'os'
import path from 'path'
import { loadConfig, getConfigIndex } from './config.js'
import { runOnce, runNonStop } from './runner.js'
import cache from './cache.js'

const configPath = process.env.CONFIG_PATH || path.join(homedir(), 'nodop')

await loadConfig(configPath)
const index = getConfigIndex()

await cache.startRun()

if (process.argv.includes('--daemon')) {
  await runNonStop(index)
} else {
  await runOnce(index)
}

await cache.stopRun()
