import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints.js'
import { evaluate } from '../../src/expression/expr.js'
import { TimeValue } from '../../src/expression/objects.js'
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
        '123 == 123 && !false && (false || "foo" == \'foo\')'
      )
    ).toBe(true)
  })

  it('multi line', async () => {
    expect(
      await evaluate(
        null,
        `true 
        && false`
      )
    ).toBe(false)
    expect(
      await evaluate(
        null,
        `(true 
        && false)`
      )
    ).toBe(false)
  })

  it('call expressions', async () => {
    expect(await evaluate(null, 'is_empty("")')).toBe(true)
    expect(await evaluate(null, 'is_not_empty("foo")')).toBe(true)
  })

  it('call expressions: time', async () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2022-01-01 00:00:00'))

    expect(await evaluate(null, 'now()')).toBeInstanceOf(TimeValue)
    expect(await evaluate(null, 'now().year')).toBe(2022)
    expect(await evaluate(null, 'now().month')).toBe(1)
    expect(await evaluate(null, 'now().day')).toBe(1)
    expect(await evaluate(null, 'now().hour')).toBe(0)
    expect(await evaluate(null, 'now().minute')).toBe(0)
    expect(await evaluate(null, 'now().second')).toBe(0)
    expect(await evaluate(null, 'now().weekday')).toBe(6)

    jest.useRealTimers()
  })

  it('actual page', async () => {
    // eslint-disable-next-line @typescript-eslint/require-await
    mockedNotion.getPageProperty.mockImplementation(async (_, propertyID) => {
      if (propertyID == '1-title') {
        return [
          {
            object: 'property_item',
            type: 'title',
            id: 'title',
            title: {
              type: 'text',
              plain_text: 'example_title',
              annotations: {
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
                color: 'default'
              },
              text: {
                content: '',
                link: null
              },
              href: null
            }
          }
        ]
      }
      if (propertyID == '2-select') {
        return {
          object: 'property_item',
          id: propertyID,
          type: 'select',
          select: null
        }
      }
      if (propertyID == '3-select') {
        return {
          object: 'property_item',
          id: propertyID,
          type: 'select',
          select: {
            id: '64190ec9-e963-47cb-bc37-6a71d6b71206',
            name: 'Option 1',
            color: 'orange'
          }
        }
      }
      if (propertyID == '4-multi_select') {
        return {
          object: 'property_item',
          id: propertyID,
          type: 'multi_select',
          multi_select: [
            {
              id: '91e6959e-7690-4f55-b8dd-d3da9debac45',
              name: 'A',
              color: 'orange'
            },
            {
              id: '2f998e2d-7b1c-485b-ba6b-5e6a815ec8f5',
              name: 'B',
              color: 'purple'
            }
          ]
        }
      }

      throw new Error('property not found')
    })

    const page: PageObjectResponse = {
      parent: { type: 'database_id', database_id: '123' },
      properties: {
        title: {
          type: 'title',
          title: [],
          id: '1-title'
        },
        null_select: {
          type: 'select',
          select: null,
          id: '2-select'
        },
        Status: {
          type: 'select',
          select: null,
          id: '3-select'
        },
        multi_select: {
          type: 'multi_select',
          multi_select: [],
          id: '4-multi_select'
        }
      },
      created_by: {
        id: 'foo',
        object: 'user'
      },
      last_edited_by: {
        id: 'foo',
        object: 'user'
      },
      object: 'page',
      id: '123',
      created_time: '2020-01-01T00:00:00.000Z',
      last_edited_time: '2020-01-01T00:00:00.000Z',
      archived: false,
      url: 'https://notion.so/example_title',
      public_url: 'https://notion.so/example_title',
      icon: {
        type: 'emoji',
        emoji: '😀'
      },
      cover: {
        type: 'external',
        external: {
          url: ''
        }
      },
      in_trash: false
    }

    // is_empty
    expect(
      await evaluate(page, 'page.get_property("null_select").is_empty()')
    ).toBe(true)
    // is_not_empty
    expect(
      await evaluate(page, 'page.get_property("Status").is_not_empty()')
    ).toBe(true)

    // is_type
    expect(
      await evaluate(page, 'page.get_property("Status").is_type("select")')
    ).toBe(true)
    expect(
      await evaluate(page, 'page.get_property("title").is_type("select")')
    ).toBe(false)

    // get_value
    expect(
      await evaluate(
        page,
        'page.get_property("Status").get_value().name == "Option 1"'
      )
    ).toBe(true)

    // contains
    expect(
      await evaluate(page, 'page.get_property("title").contains("example")')
    ).toBe(true)
    expect(
      await evaluate(page, 'page.get_property("multi_select").contains("A")')
    ).toBe(true)
    expect(
      await evaluate(page, 'page.get_property("multi_select").contains("B")')
    ).toBe(true)
    expect(
      await evaluate(page, 'page.get_property("multi_select").contains("C")')
    ).toBe(false)
    // not_contains
    expect(
      await evaluate(
        page,
        'page.get_property("multi_select").not_contains("A")'
      )
    ).toBe(false)
  })
})
