import { Scanner, Token, TokenType } from '../../src/expression/scanner'

function getAllTokens(s: string): Token[] {
  const scanner = new Scanner(s)
  const tokens: Token[] = []

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    const token = scanner.scan()
    if (token.type() === TokenType.EOT) {
      tokens.push(token)
      break
    }
    tokens.push(token)
  }
  return tokens
}

describe('Scanner', () => {
  it('literal, boolean', () => {
    const tokens = getAllTokens('true false')
    expect(tokens).toHaveLength(3)
    expect(tokens[0].type()).toBe(TokenType.BOOLEAN)
    expect(tokens[0].value()).toBe('true')
    expect(tokens[1].type()).toBe(TokenType.BOOLEAN)
    expect(tokens[1].value()).toBe('false')
    expect(tokens[2].type()).toBe(TokenType.EOT)
  })

  it('literal, number', () => {
    const tokens = getAllTokens('123 456')
    expect(tokens).toHaveLength(3)
    expect(tokens[0].type()).toBe(TokenType.NUM)
    expect(tokens[0].value()).toBe('123')
    expect(tokens[1].type()).toBe(TokenType.NUM)
    expect(tokens[1].value()).toBe('456')
    expect(tokens[2].type()).toBe(TokenType.EOT)
  })

  it('literal, string', () => {
    const tokens = getAllTokens('"foo" "bar"')
    expect(tokens).toHaveLength(3)
    expect(tokens[0].type()).toBe(TokenType.STRING)
    expect(tokens[0].value()).toBe('foo')
    expect(tokens[1].type()).toBe(TokenType.STRING)
    expect(tokens[1].value()).toBe('bar')
    expect(tokens[2].type()).toBe(TokenType.EOT)
  })

  it('literal, null', () => {
    const tokens = getAllTokens('null')
    expect(tokens).toHaveLength(2)
    expect(tokens[0].type()).toBe(TokenType.NULL)
    expect(tokens[0].value()).toBe('null')
    expect(tokens[1].type()).toBe(TokenType.EOT)
  })

  it('expression, boolean operator', () => {
    const tokens = getAllTokens('true && (123 == 456 || false)')
    expect(tokens).toHaveLength(10)
    expect(tokens[0].type()).toBe(TokenType.BOOLEAN)
    expect(tokens[0].value()).toBe('true')
    expect(tokens[1].type()).toBe(TokenType.AND)
    expect(tokens[1].value()).toBe('&&')
    expect(tokens[2].type()).toBe(TokenType.LEFT_PAREN)
    expect(tokens[2].value()).toBe('(')
    expect(tokens[3].type()).toBe(TokenType.NUM)
    expect(tokens[3].value()).toBe('123')
    expect(tokens[4].type()).toBe(TokenType.EQUAL)
    expect(tokens[4].value()).toBe('==')
    expect(tokens[5].type()).toBe(TokenType.NUM)
    expect(tokens[5].value()).toBe('456')
    expect(tokens[6].type()).toBe(TokenType.OR)
    expect(tokens[6].value()).toBe('||')
    expect(tokens[7].type()).toBe(TokenType.BOOLEAN)
    expect(tokens[7].value()).toBe('false')
    expect(tokens[8].type()).toBe(TokenType.RIGHT_PAREN)
    expect(tokens[8].value()).toBe(')')
    expect(tokens[9].type()).toBe(TokenType.EOT)
  })

  it('expression, nested call', () => {
    const tokens = getAllTokens("is_empty(property('Status'))")
    expect(tokens).toHaveLength(8)
    expect(tokens[0].type()).toBe(TokenType.IDENTIFIER)
    expect(tokens[0].value()).toBe('is_empty')
    expect(tokens[1].type()).toBe(TokenType.LEFT_PAREN)
    expect(tokens[2].type()).toBe(TokenType.IDENTIFIER)
    expect(tokens[2].value()).toBe('property')
    expect(tokens[3].type()).toBe(TokenType.LEFT_PAREN)
    expect(tokens[4].type()).toBe(TokenType.STRING)
    expect(tokens[4].value()).toBe('Status')
    expect(tokens[5].type()).toBe(TokenType.RIGHT_PAREN)
    expect(tokens[6].type()).toBe(TokenType.RIGHT_PAREN)
    expect(tokens[7].type()).toBe(TokenType.EOT)
  })

  it('expression, call with member access', () => {
    const tokens = getAllTokens("property('Status').name == 'foo'")
    expect(tokens).toHaveLength(9)
    expect(tokens[0].type()).toBe(TokenType.IDENTIFIER)
    expect(tokens[0].value()).toBe('property')
    expect(tokens[1].type()).toBe(TokenType.LEFT_PAREN)
    expect(tokens[2].type()).toBe(TokenType.STRING)
    expect(tokens[2].value()).toBe('Status')
    expect(tokens[3].type()).toBe(TokenType.RIGHT_PAREN)
    expect(tokens[4].type()).toBe(TokenType.DOT)
    expect(tokens[5].type()).toBe(TokenType.IDENTIFIER)
    expect(tokens[5].value()).toBe('name')
    expect(tokens[6].type()).toBe(TokenType.EQUAL)
    expect(tokens[6].value()).toBe('==')
    expect(tokens[7].type()).toBe(TokenType.STRING)
    expect(tokens[7].value()).toBe('foo')
    expect(tokens[8].type()).toBe(TokenType.EOT)
  })
})
