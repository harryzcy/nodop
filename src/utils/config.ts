import * as fs from 'fs'
import * as yaml from 'js-yaml'

const fsPromises = fs.promises

export type JobId = string

export interface ConfigYaml {
  name?: string
  target?: string[] | string
  on?: string[] | string
  jobs?: Record<
    JobId,
    {
      name?: string
      if?: string
      steps?: {
        name?: string
        if?: string
        lang?: string
        run?: string
      }[]
    }
  >
}

export interface Configuration {
  name: string
  target: string[]
  on: string[]
  jobs: Record<JobId, Job>
}

export interface Job {
  name?: string
  if: string
  steps: Step[]
}

export interface Step {
  name: string
  if?: string
  lang: string // bash or builtin
  run: string[]
}

export function validateConfig(src: ConfigYaml): {
  success: boolean
  errors: string
} {
  const errors: string[] = []
  if (src.name && typeof src.name !== 'string') {
    errors.push('name must be a string')
  }
  if (typeof src.target !== 'string' && !Array.isArray(src.target)) {
    errors.push('target must be a string or an array')
  }
  if (typeof src.on != 'string' && !Array.isArray(src.on)) {
    errors.push('on must be a string or an array')
  }
  if (typeof src.jobs !== 'object' || Array.isArray(src.jobs)) {
    errors.push('jobs must be a key-value object')
  }
  if (src.jobs) {
    for (const jobId in src.jobs) {
      const job = src.jobs[jobId]
      if (typeof job.if !== 'string') {
        errors.push('jobs.<job_id>.if must be a string')
      }
      if (!Array.isArray(job.steps)) {
        errors.push('jobs.<job_id>.steps must be an array')
      } else {
        for (let stepIdx = 0; stepIdx < job.steps.length; stepIdx++) {
          const step = job.steps[stepIdx]
          if (step.if !== undefined && typeof step.if !== 'string') {
            errors.push(
              `jobs.<job_id>.steps[${stepIdx.toString()}].if must be a string`
            )
          }
          if (step.lang) {
            if (step.lang !== 'bash' && step.lang !== 'builtin') {
              errors.push(
                `jobs.<job_id>.steps[${stepIdx.toString()}].lang must be either "bash" or "builtin"`
              )
            }
          }
          if (typeof step.run !== 'string') {
            errors.push(
              `jobs.<job_id>.steps[${stepIdx.toString()}].run must be a string`
            )
          }
        }
      }
    }
  }

  return {
    success: errors.length === 0,
    errors: errors.join(', ')
  }
}

export function parseConfig(filename: string, content: string): Configuration {
  const src: ConfigYaml = yaml.load(content) as ConfigYaml
  const { success, errors } = validateConfig(src)
  if (!success) {
    throw new Error(`Invalid config: ${errors}`)
  }

  const name = src.name ?? filename
  const target: string[] = []
  if (typeof src.target === 'string') {
    target.push(src.target)
  } else if (Array.isArray(src.target)) {
    target.push(...src.target)
  }

  const on: string[] = []
  if (typeof src.on === 'string') {
    on.push(src.on)
  } else if (Array.isArray(src.on)) {
    on.push(...src.on)
  }

  const jobs: Record<JobId, Job> = {}
  for (const jobId in src.jobs) {
    const job = src.jobs[jobId]
    const steps = [] as Step[]
    if (!job.steps) continue
    for (let stepIdx = 0; stepIdx < job.steps.length; stepIdx++) {
      const step = job.steps[stepIdx]
      steps.push({
        name: step.name ?? `Step ${(stepIdx + 1).toString()}`,
        if: step.if,
        lang: step.lang ?? 'builtin',
        run:
          step.run === undefined
            ? []
            : step.run
                .trim()
                .split('\n')
                .map((line) => line.trim())
      })
    }

    jobs[jobId] = {
      name: job.name,
      if: job.if ?? 'true',
      steps
    }
  }

  return {
    name,
    target,
    on,
    jobs
  }
}

export async function readConfigFile(filePath: string): Promise<Configuration> {
  const filename = filePath.split('/').pop()
  const content = await fsPromises.readFile(filePath, 'utf8')
  return parseConfig(filename ?? '', content)
}

const configurations: Configuration[] = []

/**
 * Load all config files from the given path.
 * @param path The path to the config file or directory
 */
export async function loadConfig(path: string) {
  const newConfigs: Configuration[] = []

  try {
    const stats = await fsPromises.lstat(path)
    if (stats.isFile()) {
      newConfigs.push(await readConfigFile(path))
    } else if (stats.isDirectory()) {
      const files = await fsPromises.readdir(path)
      for (const file of files) {
        if (!file.endsWith('.yml') && !file.endsWith('.yaml')) {
          // only load yml files
          continue
        }
        const filePath = `${path}/${file}`
        newConfigs.push(await readConfigFile(filePath))
      }
    } else {
      throw new Error('Invalid config path')
    }
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Invalid configuration: ${e}`)
  }

  configurations.splice(0, configurations.length) // clear
  configurations.push(...newConfigs) // add
}

export function getAllConfigs() {
  return configurations
}

export type DatabaseID = string
export type ConfigurationIndex = Record<
  DatabaseID,
  {
    on: Set<string>
    configs: Configuration[]
  }
>

export function getConfigIndex() {
  const index: ConfigurationIndex = {}
  for (const config of configurations) {
    for (const dbID of config.target) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!index[dbID]) {
        index[dbID] = {
          on: new Set(config.on),
          configs: [config]
        }
      } else {
        index[dbID].configs.push(config)
        for (const on of config.on) {
          index[dbID].on.add(on)
        }
      }
    }
  }
  return index
}
