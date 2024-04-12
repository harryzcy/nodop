import { Parser } from '../../src/expression/parser'
import { TokenType } from '../../src/expression/scanner'

describe('parser', () => {
  it('literal', () => {
    expect(new Parser('true').parse()).toStrictEqual({
      type: 'boolean',
      value: true
    })
    expect(new Parser('false').parse()).toStrictEqual({
      type: 'boolean',
      value: false
    })

    expect(new Parser('123').parse()).toStrictEqual({
      type: 'number',
      value: 123
    })

    expect(new Parser("'foo'").parse()).toStrictEqual({
      type: 'string',
      value: 'foo'
    })
  })

  it('boolean expressions', () => {
    expect(new Parser('true && false').parse()).toStrictEqual({
      type: 'binary_expression',
      left: {
        type: 'boolean',
        value: true
      },
      right: {
        type: 'boolean',
        value: false
      },
      operator: TokenType.AND
    })
    expect(new Parser('true || false').parse()).toStrictEqual({
      type: 'binary_expression',
      left: {
        type: 'boolean',
        value: true
      },
      right: {
        type: 'boolean',
        value: false
      },
      operator: TokenType.OR
    })
  })

  it('member expressions', () => {
    expect(new Parser('foo.bar').parse()).toStrictEqual({
      type: 'member_expression',
      object: {
        type: 'identifier',
        value: 'foo'
      },
      property: {
        type: 'identifier',
        value: 'bar'
      }
    })

    expect(new Parser('foo.bar()').parse()).toStrictEqual({
      type: 'member_expression',
      object: {
        type: 'identifier',
        value: 'foo'
      },
      property: {
        type: 'call_expression',
        func: 'bar',
        args: []
      }
    })

    expect(new Parser('foo.bar("arg1", "arg2")').parse()).toStrictEqual({
      type: 'member_expression',
      object: {
        type: 'identifier',
        value: 'foo'
      },
      property: {
        type: 'call_expression',
        func: 'bar',
        args: [
          { type: 'string', value: 'arg1' },
          { type: 'string', value: 'arg2' }
        ]
      }
    })
  })

  it('chained member expressions', () => {
    expect(new Parser('foo.bar.value').parse()).toStrictEqual({
      type: 'member_expression',
      object: {
        type: 'member_expression',
        object: {
          type: 'identifier',
          value: 'foo'
        },
        property: {
          type: 'identifier',
          value: 'bar'
        }
      },
      property: {
        type: 'identifier',
        value: 'value'
      }
    })

    expect(new Parser('foo.bar().value').parse()).toStrictEqual({
      type: 'member_expression',
      object: {
        type: 'member_expression',
        object: {
          type: 'identifier',
          value: 'foo'
        },
        property: {
          type: 'call_expression',
          func: 'bar',
          args: []
        }
      },
      property: {
        type: 'identifier',
        value: 'value'
      }
    })

    expect(
      new Parser('page.get_property("foo").is_empty()').parse()
    ).toStrictEqual({
      type: 'member_expression',
      object: {
        type: 'member_expression',
        object: {
          type: 'identifier',
          value: 'page'
        },
        property: {
          type: 'call_expression',
          func: 'get_property',
          args: [{ type: 'string', value: 'foo' }]
        }
      },
      property: {
        type: 'call_expression',
        func: 'is_empty',
        args: []
      }
    })
  })
})
