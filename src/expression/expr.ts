import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints.js'
import {
  CallExpression,
  MemberExpression,
  BinaryExpression,
  UnaryExpression,
  Expression,
  Parser,
  Identifier
} from './parser.js'
import { TokenType } from './scanner.js'
import {
  CustomValue,
  NotionValue,
  ObjectValue,
  PageValue,
  TimeValue
} from './objects.js'

export async function evaluate(
  page: PageObjectResponse | null,
  s: string
): Promise<boolean | null> {
  const parser = new Parser(s)
  const expr = parser.parse()
  return (await evalExpression(page, expr)) as boolean | null
}

async function evalExpression(
  page: PageObjectResponse | null,
  e: Expression
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
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

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (e.type === 'boolean' || e.type === 'string' || e.type === 'number') {
    return e.value
  }

  return null
}

async function evalCallExpression(
  page: PageObjectResponse | null,
  e: CallExpression
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  if (e.func === 'is_type') {
    if (e.args.length !== 2) {
      throw new Error('is_type takes exactly two arguments')
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const property = await evalExpression(page, e.args[0])
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const expectedType = await evalExpression(page, e.args[1])
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return property.type === expectedType
  }

  if (e.func === 'is_empty') {
    if (e.args.length !== 1) {
      throw new Error('is_empty takes exactly one argument')
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const value = await evalExpression(page, e.args[0])
    return value === null || value === ''
  }

  if (e.func === 'is_not_empty') {
    if (e.args.length !== 1) {
      throw new Error('is_not_empty takes exactly one argument')
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const value = await evalExpression(page, e.args[0])
    return value !== null && value !== ''
  }

  if (e.func === 'now') {
    if (e.args.length !== 0) {
      throw new Error('now takes no argument')
    }
    return new TimeValue(new Date())
  }

  throw new Error(`Unknown call expression: ${e.func}`)
}

async function evalMemberExpression(
  page: PageObjectResponse | null,
  e: MemberExpression
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  let value = await evalExpression(page, e.object)
  if (typeof value === 'object') {
    if (e.property.type === 'string') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return value[e.property.value]
    }

    if (e.property.type === 'identifier') {
      if (value instanceof NotionValue) {
        throw new Error(
          `Cannot access member of NotionValue: ${e.property.value}`
        )
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return value[e.property.value]
    }

    if (e.property.type === 'call_expression') {
      const args = await Promise.all(
        e.property.args.map(async (arg) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return await evalExpression(page, arg)
        })
      )

      // default to ObjectValue type
      if (typeof value === 'object' && !(value instanceof CustomValue)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        value = new ObjectValue(value)
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (value[e.property.func] instanceof AsyncFunction) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        return await value[e.property.func](...args)
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return value[e.property.func](...args)
    }

    throw new Error('invalid member expression')
  }

  // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-template-expressions
  throw new Error(`Cannot access member of non-object: ${e.object}`)
}

async function evalBinaryExpression(
  page: PageObjectResponse | null,
  e: BinaryExpression
): Promise<boolean> {
  const left = Boolean(await evalExpression(page, e.left))
  const right = Boolean(await evalExpression(page, e.right))

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

  throw new Error(`Unknown binary expression: ${e.operator.toString()}`)
}

async function evalUnaryExpression(
  page: PageObjectResponse | null,
  e: UnaryExpression
): Promise<boolean> {
  const expr = Boolean(await evalExpression(page, e.expr))
  if (e.operator === TokenType.NOT) {
    return !expr
  }

  throw new Error(`Unknown unary expression: ${e.operator.toString()}`)
}

function evalIdentifier(
  page: PageObjectResponse | null,
  iden: Identifier
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  if (page === null) {
    throw new Error('Page is null')
  }
  if (iden.value === 'page') {
    return new PageValue(page)
  }
  throw new Error(`Unknown identifier: ${iden.value}`)
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const AsyncFunction = (async () => {}).constructor
