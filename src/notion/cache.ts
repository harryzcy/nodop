import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

let cachedPages: Record<
  string,
  {
    page: PageObjectResponse
    ttl: number
  }
> = {}

export function getPage(pageId: string) {
  if (pageId in cachedPages) {
    const { page, ttl } = cachedPages[pageId]
    if (ttl === 0) return null
    return page
  }
  return null
}

export function putPage(page: PageObjectResponse) {
  cachedPages[page.id] = {
    page,
    ttl: 2 // count down to 0
  }
}

// cleanupPages removes pages with ttl === 0
// and decrements ttl for all other pages
export function cleanupPages() {
  for (const pageId in cachedPages) {
    if (cachedPages[pageId].ttl === 0) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete cachedPages[pageId]
    } else {
      cachedPages[pageId].ttl -= 1
    }
  }
}

export function clearPages() {
  cachedPages = {}
}
