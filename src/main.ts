import { getNewPagesFromDatabase, setPageProperty } from "./notion.js"

const databaseId = process.env.DATABASE_ID

async function main() {
  const pages = await getNewPagesFromDatabase(databaseId)
  for (const page of pages) {
    const statusProperty = page.properties['Status'];
    if (statusProperty.type == 'select' && statusProperty.select === null) {
      setPageProperty(page.id, 'Status', 'TODO')
    }
  }
}

main()
