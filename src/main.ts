import { loadConfig, getConfigIndex } from "./config.js"
import { runWorkflow } from "./runner.js"

const configPath = process.env.CONFIG_PATH || 'nodop'

async function main() {
  await loadConfig(configPath)
  const index = getConfigIndex()
  await runWorkflow(index)
}

main()
