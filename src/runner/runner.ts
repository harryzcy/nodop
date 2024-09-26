import util from 'util'
import child_process from 'child_process'
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints.js'
import { getNewPagesFromDatabase, RateLimitedError } from '../notion/notion.js'
import { Configuration, ConfigurationIndex, Job } from '../utils/config.js'
import { evaluate } from '../expression/expr.js'
import { getIntFromEnv } from '../utils/env_setting.js'
import { getLogger } from '../utils/logger.js'
import * as notionCache from '../notion/cache.js'
import { RequestTimeoutError } from '@notionhq/client'
import { isHTTPResponseError } from '@notionhq/client/build/src/errors.js'

// exec is a function that executes a bash command
const exec = util.promisify(child_process.exec)

const CHECK_INTERVAL = getIntFromEnv('CHECK_INTERVAL', 30) // seconds

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
      const wait = await runOnce(index)
      counter = 0

      if (wait > 0) {
        // rate limited, wait for Retry-After seconds
        await sleep((wait - 1) * 1000)
      }
    }
    counter++
    await sleep(1000) // 1 second
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Runs the workflow once.
 * @param index The index of the configuration
 * @returns The number of seconds to wait before running the next time
 */
export async function runOnce(index: ConfigurationIndex): Promise<number> {
  getLogger().info('Running workflow')
  return await runWorkflow(index)
}

/**
 * Runs the workflow for the given configuration.
 * @param index The index of the configuration
 * @returns The number of seconds to wait before running the next time
 */
export async function runWorkflow(index: ConfigurationIndex): Promise<number> {
  for (const [databaseId, value] of Object.entries(index)) {
    const wait = await runWorkflowForDB(databaseId, value.on, value.configs)
    if (wait > 0) return wait
  }

  notionCache.cleanupPages()
  return 0
}

/**
 * Runs the workflow for the given database.
 * @param databaseId The database ID
 * @param on The event to run the workflow on
 * @param configs The configurations to run
 * @returns The number of seconds to wait before running the next time
 */
async function runWorkflowForDB(
  databaseId: string,
  on: Set<string>,
  configs: Configuration[]
): Promise<number> {
  try {
    const pages = await getNewPagesFromDatabase(databaseId, on)

    for (const config of configs) {
      for (const job of Object.values(config.jobs)) {
        for (const page of pages) {
          await runJobOnPage(page, job)
        }
      }
    }
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return error.getRetryAfter()
    }
    if (RequestTimeoutError.isRequestTimeoutError(error)) {
      getLogger().warn('request-timeout', { databaseId, error })
      return CHECK_INTERVAL
    }
    if (isHTTPResponseError(error)) {
      getLogger().warn('fetch-error', { databaseId, error })
      return CHECK_INTERVAL
    }

    throw error
  }
  return 0
}

async function runJobOnPage(page: PageObjectResponse, job: Job) {
  const condition = job.if ? await evaluate(page, job.if) : true
  if (!condition) return

  for (const step of job.steps) {
    const condition = step.if ? await evaluate(page, step.if) : true
    if (!condition) break

    if (step.lang === 'bash') {
      const commands = step.run.join('\\\n')
      const { stdout, stderr } = await exec(commands)
      getLogger().info('run-step', {
        pageId: page.id,
        jobId: job.name,
        step: step.name,
        lang: 'bash',
        stdout,
        stderr
      })
    } else {
      // 'builtin'
      for (const line of step.run) {
        await evaluate(page, line)
      }
      getLogger().info('run-step', {
        pageId: page.id,
        jobId: job.name,
        step: step.name,
        lang: 'builtin'
      })
    }
  }
}
