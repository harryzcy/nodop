import { notion, eventsContainsOnly } from '../../src/notion/notion.js'

describe('notion client', () => {
  it('notion client is valid', () => {
    expect(notion).toBeDefined()
  })
})

describe('eventsContainsOnly', () => {
  it('returns true if events contains only types', () => {
    expect(eventsContainsOnly(new Set(['create']), 'create', 'update')).toBe(
      true
    )

    expect(
      eventsContainsOnly(new Set(['create', 'update']), 'create', 'update')
    ).toBe(true)
  })

  it('returns false if events contains other types', () => {
    const events = new Set(['create', 'update', 'delete'])
    expect(eventsContainsOnly(events, 'create', 'update')).toBe(false)
  })

  it('returns true if events is empty', () => {
    expect(eventsContainsOnly(undefined, 'create', 'update')).toBe(true)
  })
})
