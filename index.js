const volante = require('volante');
const chalk = require('chalk');

//
// Class which handles logging events from the volante.Hub and renders them to
// console using color provided by the chalk module.
//
class ConsoleLogger extends volante.Spoke {
  //
  // volante init()
  //
  init() {
    // default options
    this.options = {
      timestamp: false,
      level: 'any',
      stringify: true,
      srcFilter: null,
      exitOnError: false
    };

    this.hub.on('volante.log', (obj) => {
      this.render(obj);
    });
    this.hub.on('volante.debug', (obj) => {
      this.render(obj);
    });
    this.hub.on('error', (obj) => {
      this.render(obj);
      this.options.exitOnError && process.exit(1);
    });
    this.hub.on('volante-console.options', (opts) => {
      Object.assign(this.options, opts);
    });

    // print header
    console.log(chalk.blue(`Volante v${volante.version}`));
    console.log(chalk.blue(`console logging powered by volante-console`));
  }

  //
  // main entry point for log rendering
  //
  render(obj) {
    // log if any filters match
    if (this.checkFilters(obj)) {
      var line = "";
      if (this.options.timestamp) {
        line += chalk.magenta((new Date).toISOString() + " | ");
      }
      line += `${this.renderLevel(obj)} | ${obj.src} | `;
      // stringify objects
      if (this.options.stringify && typeof(obj.msg) === 'object') {
        line += JSON.stringify(obj.msg);
      } else {
        line += `${obj.msg}`;
      }
      console.log(line);
    }
  }

  //
  // render the log level
  //
  renderLevel(obj) {
    switch (obj.lvl) {
      case 'debug':
        return chalk.cyan("DBG");
      case 'error':
        return chalk.red("ERR");
      case 'log':
      default:
        return chalk.green("LOG");
    }
  }

  //
  // main entry point for log rendering
  //
  checkFilters(obj) {
    // check log level filtering if not 'any'
    if (this.options.level !== 'any') {
      if (obj.lvl !== this.options.level) {
        return false;
      }
    }
    // check src filter
    if (this.options.srcFilter) {
      // see if string
      if (typeof(this.options.srcFilter) === 'string') {
        if (obj.src !== this.options.srcFilter) {
          return false;
        }
      }
      if (this.options.srcFilter instanceof RegExp) {
        if (!obj.src.match(this.options.srcFilter)) {
          return false;
        }
      }
    }
    return true;
  }

}

//
// exports
//
module.exports = ConsoleLogger;