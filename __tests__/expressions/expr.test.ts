import { evaluate } from '../../src/expression/expr.js'
import { Page } from '../../src/notion/typing.js'

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

  it('actual page', () => {
    const page: Page = {
      parent: { type: 'database_id', database_id: '123' },
      properties: {
        title: {
          id: '123',
          type: 'title',
          title: [
            { type: 'text', plain_text: 'example_title', annotations: null, text: null, href: null },
          ],
        },
        'null_select': {
          id: '123',
          type: 'select',
          select: null,
        },
        'Status': {
          id: '123',
          type: 'select',
          select: null,
        }
      },
      created_by: {
        id: 'foo',
        object: "user",
      },
      last_edited_by: {
        id: 'foo',
        object: "user",
      },
      object: "page",
      id: '123',
      created_time: '2020-01-01T00:00:00.000Z',
      last_edited_time: '2020-01-01T00:00:00.000Z',
      archived: false,
      url: 'https://notion.so/example_title',
      icon: {
        type: 'emoji',
        emoji: '😀'
      },
      cover: {
        type: 'external',
        external: {
          url: ''
        }
      }
    }

    expect(evaluate(page, 'is_empty(property("null_select"))')).toBe(true)
    expect(evaluate(page, 'is_type(property("null_select"), "select")')).toBe(true)
    expect(evaluate(page, 'is_type(property("title"), "select")')).toBe(false)
  })
})
