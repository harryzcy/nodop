import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints"

let cachedPages: Record<string, PageObjectResponse> = {}

export function getPage(pageId: string) {
  if (pageId in cachedPages) {
    return cachedPages[pageId]
  }
  return null
}

export function putPage(page: PageObjectResponse) {
  cachedPages[page.id] = page
}

export function clearPages() {
  cachedPages = {}
}
