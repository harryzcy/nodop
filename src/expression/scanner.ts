export enum TokenType {
  NUM, // [0-9]+
  BOOLEAN, // true or false
  STRING, // "string" or 'string'
  NULL, // null

  IDENTIFIER, // [a-zA-Z][a-zA-Z0-9_]*

  LESS_THAN, // <
  LESS_OR_EQUAL, // <=
  GREATER_THAN, // >
  GREATER_OR_EQUAL, // >=
  EQUAL, // ==
  NOT_EQUAL, // !=
  NOT, // !
  AND, // &&
  OR, // ||

  DOT, // .
  LEFT_PAREN, // (
  RIGHT_PAREN, // )
  LEFT_BRACKET, // [
  RIGHT_BRACKET, // ]
  COMMA, // ,

  EOT // end of token
}

export class Token {
  _type: TokenType
  _value: string

  constructor(type: TokenType, value: string) {
    this._type = type
    this._value = value
  }

  type(): TokenType {
    return this._type
  }

  value(): string {
    return this._value
  }
}

export class Scanner {
  source: string
  pos: number
  currentChar: string
  currentSpelling: string

  constructor(source: string) {
    this.source = source
    this.pos = 0
    this.currentChar = this.source[this.pos]
  }

  scan(): Token {
    while (this.isWhitespace()) {
      this.advance()
    }

    this.currentSpelling = ''
    const type = this.scanToken()
    return new Token(type, this.currentSpelling)
  }

  scanToken(): TokenType {
    if (this.isEOT()) {
      return TokenType.EOT
    }

    if (this.isOperator()) {
      return this.scanOperator()
    }

    if (this.isDigit()) {
      return this.scanNumber()
    }

    if (this.isQuote()) {
      return this.scanString()
    }

    if (this.isAlphabet()) {
      // identifier or boolean or null
      return this.scanIdentifierOrLiteral()
    }

    if (this.isDivider()) {
      return this.scanDivider()
    }

    throw new Error(`Invalid character: ${this.currentChar}`)
  }

  isTokenEnded(): boolean {
    return this.isEOT() || this.isWhitespace()
  }

  isEOT(): boolean {
    return this.currentChar === 'EOT'
  }

  isWhitespace(): boolean {
    return (
      this.currentChar === ' ' ||
      this.currentChar === '\t' ||
      this.currentChar === '\n'
    )
  }

  isDivider(): boolean {
    const c = this.currentChar
    return c == '(' || c == ')' || c == '[' || c == ']' || c == '.' || c == ','
  }

  scanDivider(): TokenType {
    switch (this.currentChar) {
      case '(':
        this.takeIt()
        return TokenType.LEFT_PAREN
      case ')':
        this.takeIt()
        return TokenType.RIGHT_PAREN
      case '[':
        this.takeIt()
        return TokenType.LEFT_BRACKET
      case ']':
        this.takeIt()
        return TokenType.RIGHT_BRACKET
      case '.':
        this.takeIt()
        return TokenType.DOT
      case ',':
        this.takeIt()
        return TokenType.COMMA
      default:
        throw new Error(`Invalid divider: ${this.currentChar}`)
    }
  }

  isOperator(): boolean {
    const char = this.currentChar
    return (
      char === '<' ||
      char === '>' ||
      char === '=' ||
      char === '!' ||
      char === '|' ||
      char === '&'
    )
  }

  scanOperator(): TokenType {
    const char = this.currentChar
    switch (char) {
      case '<':
        this.takeIt()
        if (this.currentChar === '=') {
          this.takeIt()
          return TokenType.LESS_OR_EQUAL
        }
        return TokenType.LESS_THAN
      case '>':
        this.takeIt()
        if (this.currentChar === '=') {
          this.takeIt()
          return TokenType.GREATER_OR_EQUAL
        }
        return TokenType.GREATER_THAN
      case '=':
        this.takeIt()
        if (this.currentChar === '=') {
          this.takeIt()
          return TokenType.EQUAL
        }
        throw new Error(`Invalid operator: =, maybe you meant ==?`)
      case '!':
        this.takeIt()
        if (this.currentChar === '=') {
          this.takeIt()
          return TokenType.NOT_EQUAL
        }
        return TokenType.NOT
      case '|':
        this.takeIt()
        if (this.currentChar === '|') {
          this.takeIt()
          return TokenType.OR
        }
        throw new Error(`Invalid operator: |, maybe you meant ||?`)
      case '&':
        this.takeIt()
        if (this.currentChar === '&') {
          this.takeIt()
          return TokenType.AND
        }
        throw new Error(`Invalid operator: &, maybe you meant &&?`)
      default:
        throw new Error(`Invalid operator: ${char}`)
    }
  }

  isDigit(): boolean {
    return this.currentChar >= '0' && this.currentChar <= '9'
  }

  scanNumber(): TokenType {
    this.takeIt()
    while (!this.isTokenEnded() || this.currentChar === '.') {
      // . is for floating point
      if (!this.isDigit()) {
        // must check isDigit before takeIt.
        throw new Error(`Invalid number: ${this.currentSpelling}`)
      }
      this.takeIt()
    }
    return TokenType.NUM
  }

  isQuote(): boolean {
    return this.currentChar === '"' || this.currentChar === "'"
  }

  scanString(): TokenType {
    const quote = this.currentChar
    this.advance() // skip quote
    while (
      this.currentChar !== quote &&
      !this.isEOT() &&
      this.currentChar !== '\n'
    ) {
      if (this.currentChar === '\\') {
        this.advance() // skip escape character
        this.takeIt() // take escaped character
      }
      this.takeIt()
    }
    if (this.currentChar !== quote) {
      throw new Error(`Invalid string: ${this.currentSpelling}`)
    }
    this.advance() // skip quote
    return TokenType.STRING
  }

  isAlphabet(): boolean {
    return (
      (this.currentChar >= 'a' && this.currentChar <= 'z') ||
      (this.currentChar >= 'A' && this.currentChar <= 'Z')
    )
  }

  scanIdentifierOrLiteral(): TokenType {
    this.takeIt()
    while (!this.isTokenEnded() && !this.isDivider()) {
      this.takeIt()
    }

    if (this.currentSpelling === 'true' || this.currentSpelling === 'false') {
      return TokenType.BOOLEAN
    }
    if (this.currentSpelling === 'null') {
      return TokenType.NULL
    }

    return TokenType.IDENTIFIER
  }

  takeIt(): void {
    this.currentSpelling += this.currentChar
    this.advance()
  }

  advance(): string {
    this.pos += 1
    if (this.pos >= this.source.length) {
      this.currentChar = 'EOT'
    } else {
      this.currentChar = this.source[this.pos]
    }
    return this.currentChar
  }
}
