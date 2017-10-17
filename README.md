# Volante Console Logger

Volante module which handles logging volante log events to console.log.

## Usage

```bash
npm install volante-console
```

Volante modules are automatically loaded and instanced if they are installed locally and `hub.attachAll()` is called.

## Options

Options are changed using the `volante-console.options` event with an options object:

```js
hub.emit('volante-console.options', {
  timestamp: Boolean,         // default: false
  level: String,              // default: 'any'
  srcFilter: String or RegExp // default: null
});
```

## License

ISC