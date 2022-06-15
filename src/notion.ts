import { Client } from "@notionhq/client"
import { isFullPage, iteratePaginatedAPI, asyncIterableToArray, Page } from '@jitl/notion-api'

export const notion = new Client({ auth: process.env.NOTION_KEY })


export async function getNewPagesFromDatabase(databaseId: string): Promise<Array<Page>> {
  const resultsWithPartialPages = await asyncIterableToArray(
    iteratePaginatedAPI(notion.databases.query, {
      database_id: databaseId,
      filter: {
        timestamp: 'last_edited_time',
        last_edited_time: {
          on_or_after: '2022-06-13T00:00:00+00:00',
        },
      }
    })
  )

  return resultsWithPartialPages.filter(isFullPage)
}

export async function setPageProperty(pageId: string, propertyName: string, value: any) {
  await notion.pages.update({
    page_id: pageId,
    properties: {
      [propertyName]: {
        select: {
          name: value,
        }
      }
    }
  })
}
