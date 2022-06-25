import { isDirectory } from '../src/cache'

describe('isDirectory', () => {
  it('should return true if path is directory', async () => {
    expect(await isDirectory('.')).toBe(true)
  })

  it('should return false if path is not directory', async () => {
    expect(await isDirectory('__tests__/cache.test.ts')).toBe(false)
  })

  it('should return false if path is not exists', async () => {
    expect(await isDirectory('invalid-file')).toBe(false)
  })

  it('should return false if path is undefined', async () => {
    expect(await isDirectory(undefined)).toBe(false)
  })
})
