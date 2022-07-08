import { evaluate } from '../../src/expression/expr.js'
import { Page } from '../../src/notion/typing.js'
import * as notion from '../../src/notion/notion.js'

jest.mock('../../src/notion/notion.js')
const mockedNotion = notion as jest.Mocked<typeof notion>

describe('evaluate', () => {
  it('literal', async () => {
    expect(await evaluate(null, 'true')).toBe(true)
    expect(await evaluate(null, 'false')).toBe(false)
    expect(await evaluate(null, '123')).toBe(123)
    expect(await evaluate(null, "'foo'")).toBe('foo')
    expect(await evaluate(null, '"foo"')).toBe('foo')
  })

  it('boolean expressions', async () => {
    expect(await evaluate(null, 'true && false')).toBe(false)
    expect(await evaluate(null, 'true && (true || false)')).toBe(true)
    expect(await evaluate(null, 'true == false')).toBe(false)
    expect(await evaluate(null, '123 == 123 || 123 == 456')).toBe(true)
    expect(
      await evaluate(
        null,
        '123 == 123 && !false && (false || "foo" == \'foo\')',
      ),
    ).toBe(true)
  })

  it('call expressions', async () => {
    expect(await evaluate(null, 'is_empty("")')).toBe(true)
  })

  it('actual page', async () => {
    mockedNotion.getPageProperty.mockImplementation(async (_, propertyID) => {
      console.log(36, propertyID)
      if (propertyID == '1-title') {
        return {
          object: "property_item",
          id: propertyID,
          type: "title",
          title: {
            type: 'text',
            plain_text: 'example_title',
            annotations: null,
            text: null,
            href: null,
          },
        }
      }
      if (propertyID == '2-select' || propertyID == '3-select') {
        return {
          object: "property_item",
          id: propertyID,
          type: "select",
          select: null,
        }
      }
      throw new Error("property not found")
    })

    const page: Page = {
      parent: { type: 'database_id', database_id: '123' },
      properties: {
        title: {
          id: '1-title',
        },
        null_select: {
          id: '2-select',
        },
        Status: {
          id: '3-select',
        },
      },
      created_by: {
        id: 'foo',
        object: 'user',
      },
      last_edited_by: {
        id: 'foo',
        object: 'user',
      },
      object: 'page',
      id: '123',
      created_time: '2020-01-01T00:00:00.000Z',
      last_edited_time: '2020-01-01T00:00:00.000Z',
      archived: false,
      url: 'https://notion.so/example_title',
      icon: {
        type: 'emoji',
        emoji: '😀',
      },
      cover: {
        type: 'external',
        external: {
          url: '',
        },
      },
    }

    expect(await evaluate(page, 'page.get_property("null_select").is_empty()')).toBe(true)
    expect(await evaluate(page, 'page.get_property("Status").is_type("select")')).toBe(true)
    expect(await evaluate(page, 'page.get_property("title").is_type("select")')).toBe(false)
  })
})
