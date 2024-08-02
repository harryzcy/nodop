/**
 * Grammar
 *
 * Expression ::= Identifier ( ArgumentList? ) // CallExpression
 *               | ( Expression )               // GroupExpression
 *              | Expression biop Expression   // BinaryExpression
 *              | uniop Expression             // UnaryExpression
 *              | Expression.Identifier        // MemberExpression
 *              | Literal
 * ArgumentList ::= Expression (, Expression)*
 * Identifier ::= [a-z_]
 * biop ::= && | ||
 * Literal ::= String | boolean | number
 * String ::= ".*"
 */

import { Scanner, Token, TokenType } from './scanner.js'

export type Expression =
  | CallExpression
  | MemberExpression
  | GroupExpression
  | BinaryExpression
  | UnaryExpression
  | Identifier
  | Literal

export interface CallExpression {
  type: 'call_expression'
  func: string
  args: Expression[]
}

export interface MemberExpression {
  type: 'member_expression'
  object: Expression
  property: Expression
}

export interface GroupExpression {
  type: 'group_expression'
  expr: Expression
}

export interface BinaryExpression {
  type: 'binary_expression'
  left: Expression
  right: Expression
  operator: TokenType // &&, ||
}

export interface UnaryExpression {
  type: 'unary_expression'
  operator: TokenType // !
  expr: Expression
}

export type Literal =
  | {
      type: 'string'
      value: string
    }
  | {
      type: 'boolean'
      value: boolean
    }
  | {
      type: 'number'
      value: number
    }

export interface Identifier {
  type: 'identifier'
  value: string
}

export class Parser {
  scanner: Scanner
  currentToken: Token

  constructor(source: string) {
    this.scanner = new Scanner(source)
  }

  parse(): Expression {
    this.currentToken = this.scanner.scan()
    return this.parseExpression()
  }

  parseExpression(): Expression {
    return this.parseDisjunctionExpression()
  }

  parseDisjunctionExpression(): Expression {
    let e = this.parseConjunctionExpression()
    while (this.currentToken.type() === TokenType.OR) {
      const op = this.takeIt()
      const right = this.parseConjunctionExpression()
      e = {
        type: 'binary_expression',
        left: e,
        right: right,
        operator: op.type()
      }
    }
    return e
  }

  parseConjunctionExpression(): Expression {
    let e = this.parseEqualityExpression()
    while (this.currentToken.type() === TokenType.AND) {
      const op = this.takeIt()
      const right = this.parseEqualityExpression()
      e = {
        type: 'binary_expression',
        left: e,
        right: right,
        operator: op.type()
      }
    }
    return e
  }

  parseEqualityExpression(): Expression {
    let e = this.parseRelationalExpression()
    while (
      this.currentToken.type() === TokenType.EQUAL ||
      this.currentToken.type() === TokenType.NOT_EQUAL
    ) {
      const op = this.takeIt()
      const right = this.parseRelationalExpression()
      e = {
        type: 'binary_expression',
        left: e,
        right: right,
        operator: op.type()
      }
    }
    return e
  }

  parseRelationalExpression(): Expression {
    let e = this.parseUnaryExpression()
    while (
      this.currentToken.type() === TokenType.LESS_THAN ||
      this.currentToken.type() === TokenType.LESS_OR_EQUAL ||
      this.currentToken.type() === TokenType.GREATER_THAN ||
      this.currentToken.type() === TokenType.GREATER_OR_EQUAL
    ) {
      const op = this.takeIt()
      const right = this.parseUnaryExpression()
      e = {
        type: 'binary_expression',
        left: e,
        right: right,
        operator: op.type()
      }
    }
    return e
  }

  parseUnaryExpression(): Expression {
    if (this.currentToken.type() === TokenType.NOT) {
      const op = this.takeIt()
      const expr = this.parseUnaryExpression()
      return {
        type: 'unary_expression',
        expr,
        operator: op.type()
      }
    } else {
      return this.parseMemberExpression()
    }
  }

  parseMemberExpression(): Expression {
    let expr = this.parseUnitExpression()
    while (this.currentToken.type() === TokenType.DOT) {
      this.takeIt()
      const property = this.parseUnitExpression()
      expr = {
        type: 'member_expression',
        object: expr,
        property
      }
    }
    return expr
  }

  parseUnitExpression(): Expression {
    let iden: string // identifier for call expression or member expression
    let args: Expression[] // used for call expression
    let expr: Expression // used for group expression or member expression

    switch (this.currentToken.type()) {
      // literal
      case TokenType.BOOLEAN:
        return {
          type: 'boolean',
          value: this.takeIt().value() === 'true'
        }
      case TokenType.NUM:
        return {
          type: 'number',
          value: parseFloat(this.takeIt().value())
        }
      case TokenType.STRING:
        return {
          type: 'string',
          value: this.takeIt().value()
        }
      // identifier
      case TokenType.IDENTIFIER:
        iden = this.takeIt().value()

        // call expression
        if (this.currentToken.type() === TokenType.LEFT_PAREN) {
          this.takeIt()
          args = this.parseArgumentList()
          this.take(TokenType.RIGHT_PAREN)
          return {
            type: 'call_expression',
            func: iden,
            args
          }
        } else {
          return {
            type: 'identifier',
            value: iden
          }
        }
      // group expression
      case TokenType.LEFT_PAREN:
        this.takeIt()
        expr = this.parseExpression()
        this.take(TokenType.RIGHT_PAREN)
        return {
          type: 'group_expression',
          expr: expr
        }
      default:
        throw new Error('Unknown token type')
    }
  }

  parseArgumentList(): Expression[] {
    const args: Expression[] = []
    if (this.currentToken.type() !== TokenType.RIGHT_PAREN) {
      args.push(this.parseExpression())
      while (this.currentToken.type() === TokenType.COMMA) {
        this.takeIt()
        args.push(this.parseExpression())
      }
    }
    return args
  }

  takeIt(): Token {
    const t = this.currentToken
    this.currentToken = this.scanner.scan()
    return t
  }

  take(expected: TokenType): Token {
    if (this.currentToken.type() !== expected) {
      throw new Error(
        `Expected ${TokenType[expected]}, but got ${
          TokenType[this.currentToken.type()]
        }`
      )
    }
    return this.takeIt()
  }
}
