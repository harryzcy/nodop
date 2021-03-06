import {
  Client,
  APIErrorCode,
  isFullPage,
  collectPaginatedAPI,
} from '@notionhq/client'
import {
  PageObjectResponse,
  PartialPageObjectResponse,
} from '@notionhq/client/build/src/api-endpoints.js'
import cache from '../utils/cache.js'

export const notion = new Client({ auth: process.env.NOTION_KEY })

export function eventsContainsOnly(events: Set<string>, ...types: string[]) {
  if (events === null) {
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

export async function getNewPagesFromDatabase(
  databaseId: string,
  events: Set<string> = null,
): Promise<Array<PageObjectResponse>> {
  // TODO: use an in-memory store to avoid duplicates

  let filter = null
  if (eventsContainsOnly(events, 'create', 'update')) {
    filter = {
      timestamp: 'last_edited_time',
      last_edited_time: {
        on_or_after: await getLastISOTime(),
      },
    }
  }

  let pages: Array<PartialPageObjectResponse>
  try {
    pages = await collectPaginatedAPI(notion.databases.query, {
      database_id: databaseId,
      filter,
    })
  } catch (error) {
    if (error.code === APIErrorCode.RateLimited) {
      // rate limited, raise error
      // returning pages so far doesn't make sense because any subsequent API calls will fail
      const retryAfter = Number(error.headers['Retry-After'])
      throw new RateLimitedError(retryAfter)
    }
    throw error
  }

  return pages.filter((page): page is PageObjectResponse => {
    return isFullPage(page)
  })
}

export async function getPageProperty(pageId: string, propertyID: string) {
  // TODO: support getting paginated results
  return await notion.pages.properties.retrieve({
    page_id: pageId,
    property_id: propertyID,
  })
}

export async function setPageProperty(
  pageId: string,
  propertyName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
) {
  await notion.pages.update({
    page_id: pageId,
    properties: {
      [propertyName]: {
        select: {
          name: value,
        },
      },
    },
  })
}
