# Expression Syntax

## Examples

```js
page.get_property('Name').is_empty() // to test if property is empty

page.set_property('Status', 'TODO') // to set Status to 'TODO'
```

## Global Variables

- `page`: Page object

## Built-in Types

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
