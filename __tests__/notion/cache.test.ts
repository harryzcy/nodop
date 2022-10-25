import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints.js'
import { getPage, putPage, clearPages } from '../../src/notion/cache.js'

describe('cached pages operations', () => {
  it('put, get, clear, and get', () => {
    clearPages() // reset cache

    const page: PageObjectResponse = {
      object: 'page',
      parent: {
        type: 'database_id',
        database_id: ''
      },
      properties: undefined,
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
      created_by: {
        id: '',
        object: 'user'
      },
      last_edited_by: {
        id: '',
        object: 'user'
      },
      id: '',
      created_time: '',
      last_edited_time: '',
      archived: false,
      url: ''
    }

    putPage(page)
    expect(getPage(page.id)).toBe(page)
    clearPages()
    expect(getPage(page.id)).toBe(null)
  })
})
