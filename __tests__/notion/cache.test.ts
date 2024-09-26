import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints.js'
import {
  getPage,
  putPage,
  clearPages,
  cleanupPages
} from '../../src/notion/cache.js'

const page: PageObjectResponse = {
  object: 'page',
  parent: {
    type: 'database_id',
    database_id: ''
  },
  properties: {},
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
  url: '',
  public_url: '',
  in_trash: false
}

describe('cached pages operations', () => {
  it('put, get, clear, and get', () => {
    clearPages() // reset cache

    putPage(page)
    expect(getPage(page.id)).toBe(page)
    clearPages()
    expect(getPage(page.id)).toBe(null)
  })

  it('cleanup', () => {
    clearPages() // reset cache

    putPage(page)
    expect(getPage(page.id)).toBe(page)

    // cleanupPages decrements ttl
    // and removes pages with ttl === 0
    // so the page should be removed
    // after two calls to cleanupPages
    cleanupPages()
    expect(getPage(page.id)).toBe(page)
    cleanupPages()
    expect(getPage(page.id)).toBe(null)
  })
})
