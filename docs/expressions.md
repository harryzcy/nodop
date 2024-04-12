# Expression Syntax

## Examples

```js
page.get_property('Name').is_empty() // to test if property is empty

page.set_property('Status', 'TODO') // to set Status to 'TODO'
```

## Global Variables

- `page`: Page object

## Built-in Types

### Time

The Time object represent a date and time. It has the following properties and methods:

| Property  | Type   | Description                          |
| --------- | ------ | ------------------------------------ |
| `year`    | number | The year, e.g. 2022                  |
| `month`   | number | The month, (January = 1, …)          |
| `day`     | number | The day of the month                 |
| `weekday` | number | The day of the week, (Sunday = 0, …) |
| `hour`    | number | The hour                             |
| `minute`  | number | The minute                           |
| `second`  | number | The second                           |

| Method                       | Description                                                          |
| ---------------------------- | -------------------------------------------------------------------- |
| `is_before(other: Time)`     | Returns true if this time is before `other` time                     |
| `is_after(other: Time)`      | Returns true if this time is after `other` time                      |
| `is_same(other: Time)`       | Returns true if this time is the same as `other` time                |
| `is_same_year(other: Time)`  | Returns true if this time in the same year as `other` time           |
| `is_same_month(other: Time)` | Returns true if this time in the same year and month as `other` time |
| `is_same_day(other: Time)`   | Returns true if this time in the same day as `other` time            |

### Page

The Page object returned by Notion API, and all original fields can be accessed by dot syntax `page.<field_name>`.

Some additional addon methods are provided as below:

- `get_property(<property_name_as_string>)`: returns the property object in `page.properties`
- `set_property(<property_name_as_string>, <value>)`: set a property on Notion using its API

### Property

The Property object refers to a property in a Notion page. The original fields and addon methods can be accessed by dot syntax, e.g. `page.get_property('Name').type`.

Some additional addon methods are:

- `is_type(<expected_type_as_string>)`: returns a boolean
- `is_empty()`: returns a boolean indicating if property is empty
- `is_not_empty()`: returns a boolean indicating if property is not empty
