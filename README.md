# Volante Console Logger Spoke

Volante Spoke module which handles logging Volante log events to console.

## Usage

```bash
npm install volante-console
```

Volante Spokes are automatically loaded and instanced if they are installed locally and `hub.attachAll()` is called.

## Props

Options are changed using the `VolanteConsole.props` event with an options object (shown with defaults):

```js
hub.emit('VolanteConsole.props', {
  timestamp: false, // write timestamp
  level: 'any',     // level filter ['any', 'normal', 'debug', 'warning', 'error']
  stringify: true,  // call JSON.stringify for Objects
  srcFilter: null   // filter src value by string match or regex
});
```

## License

ISC