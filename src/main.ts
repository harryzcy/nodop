import { loadConfig, getConfigIndex } from './utils/config.js'
import { runOnce, runNonStop } from './runner/runner.js'
import cache from './utils/cache.js'

const configPath = process.env.CONFIG_PATH ?? 'nodop'

await loadConfig(configPath)
const index = getConfigIndex()

await cache.startRun()

if (process.argv.includes('--daemon')) {
  await runNonStop(index)
} else {
  await runOnce(index)
}

await cache.stopRun()
