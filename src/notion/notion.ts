import {
  Client,
  APIErrorCode,
  isFullPage,
  collectPaginatedAPI
} from '@notionhq/client'
import {
  PageObjectResponse,
  PartialDatabaseObjectResponse,
  PartialPageObjectResponse,
  PropertyItemListResponse,
  PropertyItemObjectResponse
} from '@notionhq/client/build/src/api-endpoints.js'
import cache from '../utils/cache.js'
import * as notionCache from './cache.js'

export const notion = new Client({ auth: process.env.NOTION_KEY })

export function eventsContainsOnly(
  events?: Set<string> | null,
  ...types: string[]
) {
  if (events === null || events === undefined) {
    return true
  }
  let hasOthers = false
  for (const event of events) {
    if (!types.includes(event)) {
      hasOthers = true
      break
    }
  }
  return !hasOthers
}

let lastTimestamp = cache.getLastTimestamp()
if (lastTimestamp === 0) {
  lastTimestamp = Date.now()
}

async function getLastISOTime() {
  const iso = new Date(lastTimestamp).toISOString()

  lastTimestamp = Date.now()
  await cache.setLastTimestamp(lastTimestamp)

  return iso
}

export class RateLimitedError extends Error {
  retryAfter: number

  constructor(retryAfter: number) {
    super('Rate limited')
    this.retryAfter = retryAfter
  }

  getRetryAfter() {
    return this.retryAfter
  }
}

type QueryDatabaseBodyParameters = Parameters<typeof notion.databases.query>[0]

export async function getNewPagesFromDatabase(
  databaseId: string,
  events?: Set<string>
): Promise<PageObjectResponse[]> {
  let filter: QueryDatabaseBodyParameters['filter']
  if (events && eventsContainsOnly(events, 'create', 'update')) {
    filter = {
      timestamp: 'last_edited_time',
      last_edited_time: {
        on_or_after: await getLastISOTime()
      }
    }
  }

  let pages: (PartialPageObjectResponse | PartialDatabaseObjectResponse)[]
  try {
    pages = await collectPaginatedAPI(notion.databases.query, {
      database_id: databaseId,
      filter
    })
  } catch (error) {
    const err = error as { code: APIErrorCode; headers: Record<string, string> }
    if (err.code === APIErrorCode.RateLimited) {
      // rate limited, raise error
      // returning pages so far doesn't make sense because any subsequent API calls will fail
      const retryAfter = Number(err.headers['Retry-After'])
      throw new RateLimitedError(retryAfter)
    }
    throw error
  }

  const pageResponse = pages.filter((page): page is PageObjectResponse => {
    if (page.object != 'page' || !isFullPage(page)) return false

    const cachedPage = notionCache.getPage(page.id)
    if (
      cachedPage !== null &&
      cachedPage.last_edited_time === page.last_edited_time
    ) {
      // page hasn't changed from last query
      return false
    }

    notionCache.putPage(page)
    return true
  })

  return pageResponse
}

export async function getPageProperty(
  pageId: string,
  propertyId: string
): Promise<PropertyItemObjectResponse | PropertyItemObjectResponse[]> {
  const propertyItem = await notion.pages.properties.retrieve({
    page_id: pageId,
    property_id: propertyId
  })
  if (propertyItem.object === 'property_item') {
    return propertyItem
  }

  // Property is paginated.
  let nextCursor = propertyItem.next_cursor
  const results = propertyItem.results

  while (nextCursor !== null) {
    // assert PropertyItemListResponse type
    const propertyItem = (await notion.pages.properties.retrieve({
      page_id: pageId,
      property_id: propertyId,
      start_cursor: nextCursor
    })) as PropertyItemListResponse

    nextCursor = propertyItem.next_cursor
    results.push(...propertyItem.results)
  }

  return results
}

export async function setPageProperty(
  pageId: string,
  propertyName: string,
  value: string
) {
  const page = await notion.pages.update({
    page_id: pageId,
    properties: {
      [propertyName]: {
        select: {
          name: value
        }
      }
    }
  })

  if (isFullPage(page)) {
    notionCache.putPage(page)
  }
}
