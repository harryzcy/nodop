import { Client, APIErrorCode } from '@notionhq/client'
import { Page, PartialPage } from './typing.js'
import cache from '../cache.js'

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
): Promise<Array<Page>> {
  // TODO: use an in-memory store to avoid duplicates

  let nextCursor: string | null | undefined = undefined
  let filter = null
  if (eventsContainsOnly(events, 'create', 'update')) {
    filter = {
      timestamp: 'last_edited_time',
      last_edited_time: {
        on_or_after: await getLastISOTime(),
      },
    }
  }

  const pages: Array<PartialPage> = []
  while (nextCursor !== null) {
    try {
      const response = await notion.databases.query({
        database_id: databaseId,
        filter,
        start_cursor: nextCursor,
      })

      nextCursor = response.next_cursor
      pages.push(...response.results)
    } catch (error) {
      if (error.code === APIErrorCode.RateLimited) {
        // rate limited, raise error
        // returning pages so far doesn't make sense because any subsequent API calls will fail
        const retryAfter = Number(error.headers['Retry-After'])
        throw new RateLimitedError(retryAfter)
      }
      throw error
    }
  }

  return pages.filter((page: PartialPage): page is Page => {
    return 'url' in page
  })
}

export async function getPageProperty(pageId: string, propertyID: string) {
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
