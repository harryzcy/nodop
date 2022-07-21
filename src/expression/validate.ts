import { Parser } from './parser.js'

export function evaluate(s: string): boolean {
  const parser = new Parser(s)

  let hasError = false
  try {
    parser.parse()
  } catch (error) {
    console.error(error)
    hasError = true
  }
  return hasError
}
