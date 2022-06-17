import {evaluate} from '../../src/expression/expr.js'

describe('evaluate', () => {
  it('literal', () => {
    expect(evaluate(null, 'true')).toBe(true)
    expect(evaluate(null, 'false')).toBe(false)
    expect(evaluate(null, '123')).toBe(123)
    expect(evaluate(null, "'foo'")).toBe('foo')
    expect(evaluate(null, '"foo"')).toBe('foo')
  })

  it('boolean expressions', () => {
    expect(evaluate(null, 'true && false')).toBe(false)
    expect(evaluate(null, 'true && (true || false)')).toBe(true)
    expect(evaluate(null, 'true == false')).toBe(false)
    expect(evaluate(null, '123 == 123 || 123 == 456')).toBe(true)
    expect(evaluate(null, '123 == 123 && !false && (false || "foo" == \'foo\')')).toBe(true)
  })

  it('call expressions', () => {
    expect(evaluate(null, 'is_empty("")')).toBe(true)
  })
})
