import {
  MultiSelectPropertyItemObjectResponse,
  PageObjectResponse,
  PropertyItemObjectResponse,
  TitlePropertyItemObjectResponse
} from '@notionhq/client/build/src/api-endpoints.js'
import { getPageProperty, setPageProperty } from '../notion/notion.js'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class CustomValue {}

export class NotionValue extends CustomValue {}

export class PageValue extends NotionValue {
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
    return new PropertyValue(propertyObject.id, value)
  }

  async set_property(name: string, value: string): Promise<void> {
    await setPageProperty(this.value.id, name, value)
    return
  }
}

export class PropertyValue extends NotionValue {
  type: 'property'
  id: string
  property_type: string
  property_value: PropertyItemObjectResponse | PropertyItemObjectResponse[]

  constructor(
    id: string,
    property: PropertyItemObjectResponse | PropertyItemObjectResponse[]
  ) {
    super()
    this.type = 'property'
    this.id = id
    this.property_value = property
    if (Array.isArray(property)) {
      this.property_type = property[0].type
    } else {
      this.property_type = property.type
    }
  }

  is_type(expectedType: string): boolean {
    return this.property_type === expectedType
  }

  is_empty(): boolean {
    if (Array.isArray(this.property_value)) {
      return this.property_value.length === 0
    }

    return (
      this.property_value[this.property_value.type] === null ||
      this.property_value[this.property_value.type] === ''
    )
  }

  is_not_empty(): boolean {
    return !this.is_empty()
  }

  get_value(): string {
    if (Array.isArray(this.property_value)) {
      return this.property_value
        .map((item) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return item[item.type]
        })
        .join('')
    }

    if (this.is_empty()) return ''
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.property_value[this.property_value.type]
  }

  contains(value: string): boolean {
    if (this.is_empty()) return false

    if (this.property_type === 'multi_select') {
      return (
        this.property_value as MultiSelectPropertyItemObjectResponse
      ).multi_select.some(
        (select: { id: string; name: string; color: string }) => {
          return select.name === value
        }
      )
    }

    if (this.property_type === 'title') {
      const fullTitle = (
        this.property_value as TitlePropertyItemObjectResponse[]
      )
        .map((result: { title: { plain_text: string } }) => {
          return result.title.plain_text
        })
        .join('')
      return fullTitle.includes(value)
    }
    throw new Error(
      `contains is not implemented for property type ${this.property_type}`
    )
  }

  not_contains(value: string): boolean {
    return !this.contains(value)
  }
}

export class TimeValue extends CustomValue {
  type: 'time'
  time: Date

  constructor(time: Date) {
    super()
    this.type = 'time'
    this.time = time
  }

  get year(): number {
    return this.time.getFullYear()
  }

  get month(): number {
    // months are 1-indexed, so add 1
    return this.time.getMonth() + 1
  }

  get day(): number {
    return this.time.getDate()
  }

  get weekday(): number {
    return this.time.getDay()
  }

  get hour(): number {
    return this.time.getHours()
  }

  get minute(): number {
    return this.time.getMinutes()
  }

  get second(): number {
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
    return this.year === other.year
  }

  is_same_month(other: TimeValue): boolean {
    return this.year === other.year && this.month === other.month
  }

  is_same_day(other: TimeValue): boolean {
    return (
      this.year === other.year &&
      this.month === other.month &&
      this.day === other.day
    )
  }
}

export class ObjectValue {
  type: 'object'
  value: string | null

  constructor(value: string) {
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
