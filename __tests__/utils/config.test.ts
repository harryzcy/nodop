import * as fs from 'fs'
import {
  ConfigYaml,
  validateConfig,
  parseConfig,
  readConfigFile,
  loadConfig,
  getAllConfigs,
  getConfigIndex,
  Configuration
} from '../../src/utils/config.js'

describe('validateConfig', () => {
  it('valid config, one db', () => {
    const config: ConfigYaml = {
      name: 'config',
      target: 'databaseId',
      on: ['create', 'update'],
      jobs: {
        job1: { name: 'job1', if: 'if1', steps: [{ run: 'command1' }] },
        job2: {
          name: 'job2',
          if: 'if2',
          steps: [{ run: 'command2\ncommand3' }]
        }
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
      jobs: { job1: { name: 'job1', if: 'if1', steps: [{ run: 'command1' }] } }
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
      jobs: { job1: { name: 'job1', if: 'if1', steps: [{ run: 'command1' }] } }
    }
    const { success, errors } = validateConfig(config)
    expect(success).toBe(true)
    expect(errors).toBe('')
  })

  it('valid config, no name', () => {
    const config: ConfigYaml = {
      target: ['databaseId1', 'databaseId2'],
      on: 'create',
      jobs: { job1: { name: 'job1', if: 'if1', steps: [{ run: 'command1' }] } }
    }
    const { success, errors } = validateConfig(config)
    expect(success).toBe(true)
    expect(errors).toBe('')
  })

  it('valid config, no job name', () => {
    const config: ConfigYaml = {
      target: ['databaseId1', 'databaseId2'],
      on: 'create',
      jobs: { job1: { if: 'if1', steps: [{ run: 'command1' }] } }
    }
    const { success, errors } = validateConfig(config)
    expect(success).toBe(true)
    expect(errors).toBe('')
  })

  it('valid config, with lang', () => {
    const config: ConfigYaml = {
      target: ['databaseId1', 'databaseId2'],
      on: 'create',
      jobs: {
        job1: {
          if: 'if1',
          steps: [
            { lang: 'bash', run: 'command1' },
            { lang: 'builtin', run: 'command2' }
          ]
        }
      }
    }
    const { success, errors } = validateConfig(config)
    expect(success).toBe(true)
    expect(errors).toBe('')
  })

  it('invalid config, no db', () => {
    const config: ConfigYaml = {
      on: 'create',
      jobs: { job1: { name: 'job1', if: 'if1', steps: [{ run: 'command1' }] } }
    }
    const { success, errors } = validateConfig(config)
    expect(success).toBe(false)
    expect(errors).toBe('target must be a string or an array')
  })

  it('invalid config, no on', () => {
    const config: ConfigYaml = {
      target: ['databaseId1', 'databaseId2'],
      jobs: { job1: { name: 'job1', if: 'if1', steps: [{ run: 'command1' }] } }
    }
    const { success, errors } = validateConfig(config)
    expect(success).toBe(false)
    expect(errors).toBe('on must be a string or an array')
  })

  it('invalid config, no jobs', () => {
    const config: ConfigYaml = {
      target: ['databaseId1', 'databaseId2'],
      on: 'create'
    }
    const { success, errors } = validateConfig(config)
    expect(success).toBe(false)
    expect(errors).toBe('jobs must be a key-value object')
  })

  it('invalid config, invalid job.steps[*].lang', () => {
    const config: ConfigYaml = {
      target: ['databaseId1', 'databaseId2'],
      on: 'create',
      jobs: {
        job1: {
          name: 'job1',
          if: 'if1',
          steps: [{ lang: 'invalid', run: 'command1' }]
        }
      }
    }
    const { success, errors } = validateConfig(config)
    expect(success).toBe(false)
    expect(errors).toBe(
      'jobs.<job_id>.steps[0].lang must be either "bash" or "builtin"'
    )
  })

  it('invalid config, invalid job.if and job.do', () => {
    const config: ConfigYaml = {
      target: ['databaseId1', 'databaseId2'],
      on: 'create',
      jobs: { job1: {} }
    }
    const { success, errors } = validateConfig(config)
    expect(success).toBe(false)
    expect(errors).toBe(
      'jobs.<job_id>.if must be a string, jobs.<job_id>.steps must be an array'
    )
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
          steps:
            - name: step1
              run: command1`

    const config = parseConfig('filename', content)
    expect(config).toEqual({
      name: 'config',
      target: ['databaseId'],
      on: ['create'],
      jobs: {
        job1: {
          name: 'job1',
          if: 'if1',
          steps: [
            {
              name: 'step1',
              if: undefined,
              lang: 'builtin',
              run: ['command1']
            }
          ]
        }
      }
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
          steps:
            - name: step1
              run: command1
        job2:
          name: job_name2
          if: if2
          steps:
            - run: |
                command2
                command3
            - run: command4 --arg value`

    const config = parseConfig('filename', content)
    expect(config).toEqual({
      name: 'config',
      target: ['databaseId1', 'databaseId2'],
      on: ['create', 'update'],
      jobs: {
        job1: {
          name: 'job_name1',
          if: 'if1',
          steps: [
            {
              name: 'step1',
              lang: 'builtin',
              run: ['command1']
            }
          ]
        },
        job2: {
          name: 'job_name2',
          if: 'if2',
          steps: [
            {
              name: 'Step 1',
              lang: 'builtin',
              run: ['command2', 'command3']
            },
            {
              name: 'Step 2',
              lang: 'builtin',
              run: ['command4 --arg value']
            }
          ]
        }
      }
    })
  })

  it('invalid config', () => {
    const content = `
      target: databaseId
      on: create`

    const t = () => parseConfig('filename', content)
    expect(t).toThrow('Invalid config: jobs must be a key-value object')
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
        job1: {
          name: 'job1',
          if: 'if_statement',
          steps: [
            {
              name: 'step1',
              if: 'if_in_step1',
              lang: 'builtin',
              run: ['echo "step1"']
            }
          ]
        }
      }
    })
  })
})

describe('loadConfig', () => {
  it('file path', async () => {
    await loadConfig('__tests__/testdata/conf.yaml')
    const configs = getAllConfigs()

    expect(configs).toHaveLength(1)
    expect(configs[0]).toEqual({
      name: 'config',
      target: ['443f14fe1a63a1724a1dc63ce0e4d202'],
      on: ['create', 'update'],
      jobs: {
        job1: {
          name: 'job1',
          if: 'if_statement',
          steps: [
            {
              name: 'step1',
              if: 'if_in_step1',
              lang: 'builtin',
              run: ['echo "step1"']
            }
          ]
        }
      }
    })
  })

  it('directory path', async () => {
    await loadConfig('__tests__/testdata')
    const configs = getAllConfigs()

    expect(configs).toHaveLength(1)
    expect(configs[0]).toEqual({
      name: 'config',
      target: ['443f14fe1a63a1724a1dc63ce0e4d202'],
      on: ['create', 'update'],
      jobs: {
        job1: {
          name: 'job1',
          if: 'if_statement',
          steps: [
            {
              name: 'step1',
              if: 'if_in_step1',
              lang: 'builtin',
              run: ['echo "step1"']
            }
          ]
        }
      }
    })
  })

  it('error, no file', async () => {
    const t = async () => {
      await loadConfig('__tests__/testdata/not-exist')
    }
    await expect(t).rejects.toThrow('Invalid configuration')
  })

  it('error, not file or directory', async () => {
    const filename = '__tests__/testdata/symlink'
    await fs.promises.symlink('conf.yaml', filename)

    const t = async () => {
      await loadConfig(filename)
    }
    await expect(t).rejects.toThrow('Invalid configuration')
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
            steps: [
              {
                name: 'set_todo',
                lang: 'builtin',
                run: ["set_property('Status', 'TODO')"]
              }
            ]
          }
        }
      }
    ]
    setConfigs(configs)

    const index = getConfigIndex()
    expect(Object.keys(index)).toHaveLength(1)
    expect(index['443f14fe1a63a1724a1dc63ce0a5d202'].on).toEqual(
      new Set(['create', 'update'])
    )
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
            steps: [
              {
                name: 'step 1',
                lang: 'builtin',
                run: ["set_property('Status', 'TODO')"]
              }
            ]
          }
        }
      },
      {
        name: 'config-2',
        target: [
          '443f14fe1a63a1724a1dc63ce0a5d202',
          '443f14fe1a63a1724a1dc63ce0a5d203'
        ],
        on: ['create'],
        jobs: {
          set_todo: {
            name: 'set_todo',
            if: "is_empty(property('Field'))",
            steps: [
              {
                name: 'step 1',
                lang: 'builtin',
                run: ["set_property('Field', 'foo')"]
              }
            ]
          }
        }
      }
    ]
    setConfigs(configs)

    const index = getConfigIndex()
    expect(Object.keys(index)).toHaveLength(2)
    expect(index['443f14fe1a63a1724a1dc63ce0a5d202'].on).toEqual(
      new Set(['create', 'update'])
    )
    expect(index['443f14fe1a63a1724a1dc63ce0a5d203'].on).toEqual(
      new Set(['create'])
    )

    expect(index['443f14fe1a63a1724a1dc63ce0a5d202'].configs).toHaveLength(2)
    expect(index['443f14fe1a63a1724a1dc63ce0a5d202'].configs).toContainEqual(
      configs[0]
    )
    expect(index['443f14fe1a63a1724a1dc63ce0a5d202'].configs).toContainEqual(
      configs[1]
    )

    expect(index['443f14fe1a63a1724a1dc63ce0a5d203'].configs).toHaveLength(1)
    expect(index['443f14fe1a63a1724a1dc63ce0a5d203'].configs).toContainEqual(
      configs[1]
    )
    expect(
      index['443f14fe1a63a1724a1dc63ce0a5d203'].configs
    ).not.toContainEqual(configs[0])
  })
})
