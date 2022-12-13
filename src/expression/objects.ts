import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints.js'
import { getPageProperty, setPageProperty } from '../notion/notion.js'

export class CustomValue {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any

  get_field(name: string) {
    return this.value[name]
  }
}

export class PageValue extends CustomValue {
  type: 'page'
  declare value: PageObjectResponse

  constructor(page: PageObjectResponse) {
    super()
    this.type = 'page'
    this.value = page
  }

  async get_property(name: string): Promise<PropertyValue> {
    const propertyObject = this.value.properties[name]
    const value = await getPageProperty(this.value.id, propertyObject.id)
    return new PropertyValue(value)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async set_property(name: string, value: any): Promise<void> {
    await setPageProperty(this.value.id, name, value)
    return null
  }
}

export class PropertyValue extends CustomValue {
  type: 'property'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(property: any) {
    super()
    this.type = 'property'
    this.value = property
  }

  is_type(expectedType: string): boolean {
    return (
      this.value && 'type' in this.value && this.value.type === expectedType
    )
  }

  is_empty(): boolean {
    if (this.value && 'type' in this.value) {
      return (
        this.value[this.value.type] === null ||
        this.value[this.value.type] === ''
      )
    }
    return false
  }

  is_not_empty(): boolean {
    return !this.is_empty()
  }

  get_value(): string {
    if (this.is_empty()) return ''
    if (!this.value || !('type' in this.value)) return ''

    return this.value[this.value.type]
  }

  contains(value: string): boolean {
    if (this.is_empty()) return false
    if (!this.value || !('type' in this.value)) return false

    if (this.value.type === 'multi_select') {
      return this.value.multi_select.some(
        (select: { id: string; name: string; color: string }) => {
          return select.name === value
        },
      )
    }
    if (this.value.type === 'property_item') {
      if (this.value.property_item.type === 'title') {
        const fullTitle = this.value.results
          .map((result: { title: { plain_text: string } }) => {
            return result.title.plain_text
          })
          .join('')
        return fullTitle.includes(value)
      }
    }
    throw new Error(
      `contains is not implemented for property type ${this.value.type}`,
    )
  }

  not_contains(value: string): boolean {
    return !this.contains(value)
  }
}

export class TimeValue {
  type: 'time'
  time: Date

  constructor(time: Date) {
    this.type = 'time'
    this.time = time
  }

  year(): number {
    return this.time.getFullYear()
  }

  month(): number {
    // months are 1-indexed, so add 1
    return this.time.getMonth() + 1
  }

  day(): number {
    return this.time.getDate()
  }

  weekday(): number {
    return this.time.getDay()
  }

  hour(): number {
    return this.time.getHours()
  }

  minute(): number {
    return this.time.getMinutes()
  }

  second(): number {
    return this.time.getSeconds()
  }

  is_before(other: TimeValue): boolean {
    return this.time < other.time
  }

  is_after(other: TimeValue): boolean {
    return this.time > other.time
  }

  is_same(other: TimeValue): boolean {
    return this.time.getTime() === other.time.getTime()
  }

  is_same_year(other: TimeValue): boolean {
    return this.year() === other.year()
  }

  is_same_month(other: TimeValue): boolean {
    return (
      this.year() === other.year() && this.month() === other.month()
    )
  }

  is_same_day(other: TimeValue): boolean {
    return (
      this.year() === other.year() &&
      this.month() === other.month() &&
      this.day() === other.day()
    )
  }
}

export class ObjectValue {
  type: 'object'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(value: any) {
    if (typeof value !== 'object') {
      throw new Error('ObjectValue must be initialized with an object')
    }

    this.type = 'object'
    this.value = value
  }

  is_empty(): boolean {
    if (this.value === null) return true

    return false
  }
}
