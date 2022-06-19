import * as fs from 'fs'
import {
  ConfigYaml, validateConfig,
  parseConfig,
  readConfigFile,
  loadConfig,
  getAllConfigs,
  getConfigIndex, Configuration
} from '../src/config.js'

describe('validateConfig', () => {
  it('valid config, one db', () => {
    const config: ConfigYaml = {
      name: 'config',
      target: 'databaseId',
      on: ['create', 'update'],
      jobs: {
        job1: { name: 'job1', if: 'if1', do: 'command1' },
        job2: { name: 'job2', if: 'if2', do: 'command2\ncommand3' }
      }
    }
    const { success, errors } = validateConfig(config)

    expect(success).toBe(true)
    expect(errors).toBe('')
  })

  it('valid config, multiple db', () => {
    const config: ConfigYaml = {
      name: 'config',
      target: ['databaseId1', 'databaseId2'],
      on: ['create', 'update'],
      jobs: { job1: { name: 'job1', if: 'if1', do: 'command1' } }
    }
    const { success, errors } = validateConfig(config)
    expect(success).toBe(true)
    expect(errors).toBe('')
  })

  it('valid config, single on', () => {
    const config: ConfigYaml = {
      name: 'config',
      target: ['databaseId1', 'databaseId2'],
      on: 'create',
      jobs: { job1: { name: 'job1', if: 'if1', do: 'command1' } }
    }
    const { success, errors } = validateConfig(config)
    expect(success).toBe(true)
    expect(errors).toBe('')
  })

  it('valid config, no name', () => {
    const config: ConfigYaml = {
      target: ['databaseId1', 'databaseId2'],
      on: 'create',
      jobs: { job1: { name: 'job1', if: 'if1', do: 'command1' } }
    }
    const { success, errors } = validateConfig(config)
    expect(success).toBe(true)
    expect(errors).toBe('')
  })

  it('valid config, no job name', () => {
    const config: ConfigYaml = {
      target: ['databaseId1', 'databaseId2'],
      on: 'create',
      jobs: { job1: { if: 'if1', do: 'command1' } }
    }
    const { success, errors } = validateConfig(config)
    expect(success).toBe(true)
    expect(errors).toBe('')
  })

  it('invalid config, non string name', () => {
    const config: ConfigYaml = {
      name: 1,
      target: ['databaseId1', 'databaseId2'],
      on: 'create',
      jobs: { job1: { if: 'if1', do: 'command1' } }
    }
    const { success, errors } = validateConfig(config)
    expect(success).toBe(false)
    expect(errors).toBe('name must be a string')
  })

  it('invalid config, no db', () => {
    const config: ConfigYaml = {
      on: 'create',
      jobs: { job1: { name: 'job1', if: 'if1', do: 'command1' } }
    }
    const { success, errors } = validateConfig(config)
    expect(success).toBe(false)
    expect(errors).toBe('target must be a string or an array')
  })

  it('invalid config, no on', () => {
    const config: ConfigYaml = {
      target: ['databaseId1', 'databaseId2'],
      jobs: { job1: { name: 'job1', if: 'if1', do: 'command1' } }
    }
    const { success, errors } = validateConfig(config)
    expect(success).toBe(false)
    expect(errors).toBe('on must be a string or an array')
  })

  it('invalid config, no jobs', () => {
    const config: ConfigYaml = {
      target: ['databaseId1', 'databaseId2'],
      on: 'create',
    }
    const { success, errors } = validateConfig(config)
    expect(success).toBe(false)
    expect(errors).toBe('jobs must be a key-value object')
  })

  it('invalid config, invalid job.if and job.do', () => {
    const config: ConfigYaml = {
      target: ['databaseId1', 'databaseId2'],
      on: 'create',
      jobs: { job1: {} }
    }
    const { success, errors } = validateConfig(config)
    expect(success).toBe(false)
    expect(errors).toBe('jobs.<job_id>.if must be a string, jobs.<job_id>.do must be a string or an array')
  })
})

describe('parseConfig', () => {
  it('valid config, strings', () => {
    const content = `
      name: config
      target: databaseId
      on: create
      jobs:
        job1:
          name: job1
          if: if1
          do: command1`

    const config = parseConfig('filename', content)
    expect(config).toEqual({
      name: 'config',
      target: ['databaseId'],
      on: ['create'],
      jobs: { job1: { name: 'job1', if: 'if1', do: ['command1'] } }
    })
  })

  it('valid config, arrays', () => {
    const content = `
      name: config
      target:
        - databaseId1
        - databaseId2
      on: [create, update]
      jobs:
        job1:
          name: job_name1
          if: if1
          do: command1
        job2:
          name: job_name2
          if: if2
          do: |
            command2
            command3 --arg value`

    const config = parseConfig('filename', content)
    expect(config).toEqual({
      name: 'config',
      target: ['databaseId1', 'databaseId2'],
      on: ['create', 'update'],
      jobs: {
        job1: { name: 'job_name1', if: 'if1', do: ['command1'] },
        job2: { name: 'job_name2', if: 'if2', do: ['command2', 'command3 --arg value'] }
      }
    })
  })

  it('invalid config', () => {
    const content = `
      target: databaseId
      on: create`

    const t = () => parseConfig('filename', content)
    expect(t).toThrowError('Invalid config: jobs must be a key-value object')
  })
})

describe('readConfigFile', () => {
  it('should pass', async () => {
    const config = await readConfigFile('__tests__/testdata/conf.yaml')
    expect(config).toEqual({
      name: 'config',
      target: ['443f14fe1a63a1724a1dc63ce0e4d202'],
      on: ['create', 'update'],
      jobs: {
        job1: { name: 'job1', if: 'if_statement', do: ['echo "job1"'] },
      }
    })
  })
})

describe('loadConfig', () => {
  it('file path', async () => {
    await loadConfig('__tests__/testdata/conf.yaml')
    const configs = await getAllConfigs()

    expect(configs).toHaveLength(1)
    expect(configs[0]).toEqual({
      name: 'config',
      target: ['443f14fe1a63a1724a1dc63ce0e4d202'],
      on: ['create', 'update'],
      jobs: {
        job1: { name: 'job1', if: 'if_statement', do: ['echo "job1"'] },
      }
    })
  })

  it('directory path', async () => {
    await loadConfig('__tests__/testdata')
    const configs = await getAllConfigs()

    expect(configs).toHaveLength(1)
    expect(configs[0]).toEqual({
      name: 'config',
      target: ['443f14fe1a63a1724a1dc63ce0e4d202'],
      on: ['create', 'update'],
      jobs: {
        job1: { name: 'job1', if: 'if_statement', do: ['echo "job1"'] },
      }
    })
  })

  it('error, no file', async () => {
    const t = async () => await loadConfig('__tests__/testdata/not-exist')
    await expect(t).rejects.toThrowError('Invalid config path')
  })

  it('error, not file or directory', async () => {
    const filename = '__tests__/testdata/symlink'
    await fs.promises.symlink('conf.yaml', filename)

    const t = async () => await loadConfig(filename)
    await expect(t).rejects.toThrowError('Invalid config path')
    await fs.promises.rm(filename)
  })
})

describe('getConfigIndex', () => {
  const setConfigs = (configs: Configuration[]) => {
    const globalConfig = getAllConfigs()
    globalConfig.splice(0, globalConfig.length)
    globalConfig.push(...configs)
  }

  it('single config', () => {
    const configs = [
      {
        name: 'config',
        target: ['443f14fe1a63a1724a1dc63ce0a5d202'],
        on: ['create', 'update'],
        jobs: {
          set_todo: {
            name: 'set_todo',
            if: "is_empty(property('Status'))",
            do: ["set_property('Status', 'TODO')"]
          },
        }
      }
    ]
    setConfigs(configs)

    const index = getConfigIndex()
    expect(Object.keys(index)).toHaveLength(1)
    expect(index['443f14fe1a63a1724a1dc63ce0a5d202'].on).toEqual(new Set(['create', 'update']))
    expect(index['443f14fe1a63a1724a1dc63ce0a5d202'].configs).toHaveLength(1)
    expect(index['443f14fe1a63a1724a1dc63ce0a5d202'].configs).toEqual(configs)
  })

  it('multiple configs', () => {
    const configs = [
      {
        name: 'config',
        target: ['443f14fe1a63a1724a1dc63ce0a5d202'],
        on: ['create', 'update'],
        jobs: {
          set_todo: {
            name: 'set_todo',
            if: "is_empty(property('Status'))",
            do: ["set_property('Status', 'TODO')"]
          },
        }
      },
      {
        name: 'config-2',
        target: ['443f14fe1a63a1724a1dc63ce0a5d202', '443f14fe1a63a1724a1dc63ce0a5d203'],
        on: ['create'],
        jobs: {
          set_todo: {
            name: 'set_todo',
            if: "is_empty(property('Field'))",
            do: ["set_property('Field', 'foo')"]
          },
        }
      }
    ]
    setConfigs(configs)

    const index = getConfigIndex()
    expect(Object.keys(index)).toHaveLength(2)
    expect(index['443f14fe1a63a1724a1dc63ce0a5d202'].on).toEqual(new Set(['create', 'update']))
    expect(index['443f14fe1a63a1724a1dc63ce0a5d203'].on).toEqual(new Set(['create']))

    expect(index['443f14fe1a63a1724a1dc63ce0a5d202'].configs).toHaveLength(2)
    expect(index['443f14fe1a63a1724a1dc63ce0a5d202'].configs).toContainEqual(configs[0])
    expect(index['443f14fe1a63a1724a1dc63ce0a5d202'].configs).toContainEqual(configs[1])

    expect(index['443f14fe1a63a1724a1dc63ce0a5d203'].configs).toHaveLength(1)
    expect(index['443f14fe1a63a1724a1dc63ce0a5d203'].configs).toContainEqual(configs[1])
    expect(index['443f14fe1a63a1724a1dc63ce0a5d203'].configs).not.toContainEqual(configs[0])
  })
})
