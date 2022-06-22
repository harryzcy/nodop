import { getNewPagesFromDatabase } from "./notion/notion.js"
import { Configuration, ConfigurationIndex, Job } from "./config.js"
import { Page } from "./notion/typing.js"
import { evaluate } from "./expression/expr.js"

export async function runWorkflow(index: ConfigurationIndex) {
  for (const [databaseId, value] of Object.entries(index)) {
    await runWorkflowForDB(databaseId, value.on, value.configs)
  }
}

async function runWorkflowForDB(databaseId: string, on: Set<string>, configs: Configuration[]) {
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
  if (condition) {
    for (const command of job.do) {
      await evaluate(page, command)
    }
  }
}
