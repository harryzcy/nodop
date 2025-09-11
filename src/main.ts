import { loadConfig, getConfigIndex } from './utils/config'
import { runOnce, runNonStop } from './runner/runner'
import cache from './utils/cache'

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
