import { getNewPagesFromDatabase } from "./notion/notion.js"
import { Configuration, ConfigurationIndex, Job } from "./config.js"
import { Page } from "./notion/typing.js"
import { evaluate } from "./expression/expr.js"

const CHECK_INTERVAL = 30 // seconds

let shouldStop = false
const stopDaemon = () => {
  shouldStop = true
}

process.on('SIGINT', stopDaemon)
process.on('SIGQUIT', stopDaemon)
process.on('SIGTERM', stopDaemon)

export async function runNonStop(index: ConfigurationIndex) {
  // every second, it's yielded to check if it should stop

  let counter = 0
  while (!shouldStop) {
    if (counter % CHECK_INTERVAL === 0) {
      runOnce(index)
      counter == 0
    }
    counter++
    await sleep(1000) // 1 second
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function runOnce(index: ConfigurationIndex) {
  console.log(`[${new Date().toISOString()}] Running once...`)
  await runWorkflow(index)
}

export async function runWorkflow(index: ConfigurationIndex) {
  for (const [databaseId, value] of Object.entries(index)) {
    await runWorkflowForDB(databaseId, value.on, value.configs)
  }
}

async function runWorkflowForDB(databaseId: string, on: Set<string>, configs: Configuration[]) {
  // TODO: handle rate limit
  const pages = await getNewPagesFromDatabase(databaseId, on)

  for (const config of configs) {
    for (const job of Object.values(config.jobs)) {
      for (const page of pages) {
        await runJobOnPage(page, job)
      }
    }
  }
}

async function runJobOnPage(page: Page, job: Job) {
  const condition = await evaluate(page, job.if)
  if (!condition) return

  for (const step of job.steps) {
    const condition = step.if ? await evaluate(page, step.if) : true
    if (!condition) break

    for (const line of step.run) {
      await evaluate(page, line)
    }
  }
}
