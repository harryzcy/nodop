import { notion } from '../src/notion/notion.js'

describe('notion client', () => {
  it('notion client is valid', () => {
    expect(notion).toBeDefined()
  })
})
