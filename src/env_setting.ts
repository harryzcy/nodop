export function getIntFromEnv(name: string, defaultValue: number): number {
  const value = process.env[name]
  if (value) {
    return parseInt(value, 10)
  }
  return defaultValue
}
