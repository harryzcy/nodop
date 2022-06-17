import { Page } from '../notion/typing.js'
import { CallExpression, MemberExpression, BinaryExpression, UnaryExpression, Expression, Parser } from './parser.js'
import { TokenType } from './scanner.js'

export function evaluate(page: Page, s: string): boolean | null {
  const parser = new Parser(s)
  const expr = parser.parse()
  return evalExpression(page, expr)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function evalExpression(page: Page, e: Expression): any {
  if (e.type === 'call_expression') {
    return evalCallExpression(page, e)
  }

  if (e.type === 'member_expression') {
    return evalMemberExpression(page, e)
  }

  if (e.type === 'group_expression') {
    return evalExpression(page, e.expr)
  }

  if (e.type === 'binary_expression') {
    return evalBinaryExpression(page, e)
  }

  if (e.type === 'unary_expression') {
    return evalUnaryExpression(page, e)
  }

  if (e.type === 'boolean' || e.type === 'string' || e.type === 'number') {
    return e.value
  }

  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function evalCallExpression(page: Page, e: CallExpression): any {
  if (e.func === 'is_empty') {
    if (e.args.length !== 1) {
      throw new Error('is_empty takes exactly one argument')
    }
    const value = evalExpression(page, e.args[0])
    return value === null || value === ''
  }

  if (e.func === 'is_not_empty') {
    if (e.args.length !== 1) {
      throw new Error('is_not_empty takes exactly one argument')
    }
    const value = evalExpression(page, e.args[0])
    return value !== null && value !== ''
  }

  if (e.func === 'property') {
    if (e.args.length !== 1) {
      throw new Error('property takes exactly one argument')
    }
    const value = evalExpression(page, e.args[0])
    return page.properties[value]
  }

  throw new Error(`Unknown call expression: ${e.func}`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function evalMemberExpression(page: Page, e: MemberExpression): any {
  const value = evalExpression(page, e.expr)
  if (typeof value === 'object') {
    return value[e.member]
  }

  throw new Error(`Cannot access member of non-object: ${e.member}`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function evalBinaryExpression(page: Page, e: BinaryExpression): any {
  const left = evalExpression(page, e.left)
  const right = evalExpression(page, e.right)

  switch (e.operator) {
    case TokenType.AND:
      return left && right
    case TokenType.OR:
      return left || right
    case TokenType.LESS_THAN:
      return left < right
    case TokenType.LESS_OR_EQUAL:
      return left <= right
    case TokenType.GREATER_THAN:
      return left > right
    case TokenType.GREATER_OR_EQUAL:
      return left >= right
    case TokenType.EQUAL:
      return left === right
    case TokenType.NOT_EQUAL:
      return left !== right
  }

  throw new Error(`Unknown binary expression: ${e.operator}`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function evalUnaryExpression(page: Page, e: UnaryExpression): any {
  const expr = evalExpression(page, e.expr)
  if (e.operator === TokenType.NOT) {
    return !expr
  }

  throw new Error(`Unknown unary expression: ${e.operator}`)
}
