# Volante Console Logger Spoke

Volante Spoke module which handles logging Volante log events to console.log.

## Usage

```bash
npm install volante-console
```

Volante Spokes are automatically loaded and instanced if they are installed locally and `hub.attachAll()` is called.

## Options

Options are changed using the `volante-console.options` event with an options object (shown with defaults):

```js
hub.emit('volante-console.options', {
  timestamp: false,
  level: 'any',
  stringify: true,
  srcFilter: null
});
```

## Events

### Handled

- `volante-console.options` - main options call
  ```js
  {
    timestamp: Boolean,         // write timestamp
    level: String,              // level filter ['any', 'normal', 'debug', 'error']
    stringify: Boolean,         // call JSON.stringify for Objects
    srcFilter: String or RegExp // filter src value by string match or regex
  }
  ```

## License

ISC