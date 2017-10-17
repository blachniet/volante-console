# Volante Console Logger

Volante module which handles logging volante log events to console.log.

## Usage

```bash
npm install volante-console
```

Volante modules are automatically loaded if they are found in the `node_modules` directory.

## Options

Options are changed using the `volante-console` event with an options object:

```js
{
  timestamp: Boolean,         // default: false
  level: String,              // default: 'any'
  srcFilter: String or RegExp // default: null
}
```