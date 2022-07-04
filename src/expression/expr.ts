import { Page } from '../notion/typing.js'
import {
  CallExpression,
  MemberExpression,
  BinaryExpression,
  UnaryExpression,
  Expression,
  Parser,
  Identifier,
} from './parser.js'
import { TokenType } from './scanner.js'
import { setPageProperty } from '../notion/notion.js'

export async function evaluate(page: Page, s: string): Promise<boolean | null> {
  const parser = new Parser(s)
  const expr = parser.parse()
  return await evalExpression(page, expr)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function evalExpression(page: Page, e: Expression): Promise<any> {
  if (e.type === 'call_expression') {
    return await evalCallExpression(page, e)
  }

  if (e.type === 'member_expression') {
    return await evalMemberExpression(page, e)
  }

  if (e.type === 'group_expression') {
    return await evalExpression(page, e.expr)
  }

  if (e.type === 'binary_expression') {
    return await evalBinaryExpression(page, e)
  }

  if (e.type === 'unary_expression') {
    return await evalUnaryExpression(page, e)
  }

  if (e.type === 'identifier') {
    return evalIdentifier(page, e)
  }

  if (e.type === 'boolean' || e.type === 'string' || e.type === 'number') {
    return e.value
  }

  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function evalCallExpression(page: Page, e: CallExpression): Promise<any> {
  if (e.func === 'property') {
    if (e.args.length !== 1) {
      throw new Error('property takes exactly one argument')
    }
    const value = await evalExpression(page, e.args[0])
    return page.properties[value]
  }

  if (e.func === 'is_type') {
    if (e.args.length !== 2) {
      throw new Error('is_type takes exactly two arguments')
    }
    const property = await evalExpression(page, e.args[0])
    const expectedType = await evalExpression(page, e.args[1])
    return property.type === expectedType
  }

  if (e.func === 'is_empty') {
    if (e.args.length !== 1) {
      throw new Error('is_empty takes exactly one argument')
    }
    const property = await evalExpression(page, e.args[0])

    // check if the value for page property is empty
    if (typeof property === 'object') {
      if (property === null) return true
      if ('type' in property) {
        return (
          property[property.type] === null || property[property.type] === ''
        )
      }
    }
    return property === null || property === ''
  }

  if (e.func === 'is_not_empty') {
    if (e.args.length !== 1) {
      throw new Error('is_not_empty takes exactly one argument')
    }
    const value = await evalExpression(page, e.args[0])
    return value !== null && value !== ''
  }

  if (e.func === 'set_property') {
    if (e.args.length !== 2) {
      throw new Error('set_property takes exactly two arguments')
    }
    const property = await evalExpression(page, e.args[0])
    const value = await evalExpression(page, e.args[1])
    await setPageProperty(page.id, property, value)
    return null
  }

  throw new Error(`Unknown call expression: ${e.func}`)
}

async function evalMemberExpression(
  page: Page,
  e: MemberExpression,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const value = await evalExpression(page, e.object)
  if (typeof value === 'object') {
    if (e.property.type === 'string') {
      return value[e.property.value]
    }
    throw new Error('invalid member expression')
  }

  throw new Error(`Cannot access member of non-object: ${e.object}`)
}

async function evalBinaryExpression(
  page: Page,
  e: BinaryExpression,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const left = await evalExpression(page, e.left)
  const right = await evalExpression(page, e.right)

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

async function evalUnaryExpression(
  page: Page,
  e: UnaryExpression,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const expr = await evalExpression(page, e.expr)
  if (e.operator === TokenType.NOT) {
    return !expr
  }

  throw new Error(`Unknown unary expression: ${e.operator}`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function evalIdentifier(page: Page, iden: Identifier): any {
  if (iden.value === 'page') {
    return new ExprPage(page)
  }
  throw new Error(`Unknown identifier: ${iden.value}`)
}

class ExprPage {
  type: 'page'
  page: Page

  constructor(page: Page) {
    this.type = 'page'
    this.page = page
  }
}
