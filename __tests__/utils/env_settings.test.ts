import { getIntFromEnv } from '../../src/utils/env_setting.js'

describe('getIntFromEnv', () => {
  it('should return the default value if the env variable is not set', () => {
    expect(getIntFromEnv('__DEFAULT__', 2)).toBe(2)
  })

  it('should return the value', () => {
    process.env.__TEST__ = '3'
    expect(getIntFromEnv('__TEST__', 3)).toBe(3)
    process.env.__TEST__ = undefined
  })
})
