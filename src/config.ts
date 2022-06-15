import * as fs from 'fs'
import * as yaml from 'js-yaml'

const fsPromises = fs.promises

export type JobId = string

export interface ConfigYaml {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  name?: any
  databases?: string[] | string
  on?: string[] | string
  jobs?: Record<JobId, {
    name?: string
    if?: string
    do?: string
  }>
}

export interface Configuration {
  name: string;
  databases: string[];
  on: string[];
  jobs: Record<JobId, Job>;
}

export interface Job {
  name?: string;
  if: string;
  do: string[];
}

export function validateConfig(src: ConfigYaml): { success: boolean, errors: string } {
  const errors = []
  if (src.name && typeof src.name !== 'string') {
    errors.push('name must be a string')
  }
  if (typeof src.databases !== 'string' && !Array.isArray(src.databases)) {
    errors.push('databases must be a string or an array')
  }
  if (typeof src.on != 'string' && !Array.isArray(src.on)) {
    errors.push('on must be a string or an array')
  }
  if (typeof src.jobs !== 'object' || Array.isArray(src.jobs) || src.jobs === null) {
    errors.push('jobs must be a key-value object')
  }
  if (src.jobs) {
    for (const jobId in src.jobs) {
      const job = src.jobs[jobId]
      if (typeof job.if !== 'string') {
        errors.push('jobs.<job_id>.if must be a string')
      }
      if (typeof job.do !== 'string' && !Array.isArray(job.do)) {
        errors.push('jobs.<job_id>.do must be a string or an array')
      }
    }
  }

  return {
    success: errors.length === 0,
    errors: errors.join(', ')
  }
}

export function parseConfig(filename: string, content: string): Configuration {
  const src: ConfigYaml = yaml.load(content)
  const { success, errors } = validateConfig(src)
  if (!success) {
    throw new Error(`Invalid config: ${errors}`)
  }

  const name = src.name || filename
  const databases: string[] = []
  if (typeof src.databases === 'string') {
    databases.push(src.databases)
  } else {
    databases.push(...src.databases)
  }

  const on: string[] = []
  if (typeof src.on === 'string') {
    on.push(src.on)
  } else {
    on.push(...src.on)
  }

  const jobs: Record<JobId, Job> = {}
  for (const jobId in src.jobs) {
    const job = src.jobs[jobId]
    jobs[jobId] = {
      name: job.name,
      if: job.if,
      do: job.do.trim().split('\n').map(line => line.trim())
    }
  }

  return {
    name,
    databases,
    on,
    jobs
  }
}

export async function readConfigFile(filePath: string): Promise<Configuration> {
  const filename = filePath.split('/').pop()
  const content = await fsPromises.readFile(filePath, 'utf8')
  return parseConfig(filename, content)
}

const configurations = []

/**
 * Load all config files from the given path.
 * @param path The path to the config file or directory
 */
export async function loadConfig(path: string) {
  const newConfigs = []

  try {
    const stats = await fsPromises.lstat(path)
    if (stats.isFile()) {
      newConfigs.push(await readConfigFile(path))
    } else if (stats.isDirectory()) {
      const files = await fsPromises.readdir(path)
      for (const file of files) {
        if (!file.endsWith('.yml') && !file.endsWith('.yaml')) { // only load yml files
          continue
        }
        const filePath = `${path}/${file}`
        newConfigs.push(await readConfigFile(filePath))
      }
    } else {
      throw new Error('Invalid config path')
    }
  } catch (e) {
    throw new Error('Invalid config path')
  }

  configurations.splice(0, configurations.length) // clear
  configurations.push(...newConfigs) // add
}

export function getAllConfigs() {
  return configurations
}
