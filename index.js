const chalk = require('chalk');
const util = require('util');

//
// handles logging events from the volante.Hub and renders them to
// console using color provided by the chalk module.
//
module.exports = {
  name: 'VolanteConsole',
  props: {
    timestamp: false,   // show timestamp column
    compact: true,      // option for util.inspect
    showStatus: true,   // show overall status as check or x
    level: 'any',       // level filter
    filter: null,       // string or RegExp filter for entire content
    exitOnError: false, // trigger $shutdown on error
    srcLen: 16,         // width of source (usually spoke name) column
  },
  init() {
    // print header
    console.log(chalk.bgBlue('  ____    ____  ')   + chalk.bold.blue(` Powered by Volante v${this.$hub.version}`));
    console.log(chalk.bgBlue('  \\\\\\\\\\  /////  ') + chalk.bold.blue(` ${(new Date).toISOString()}`));
    console.log(chalk.bgBlue('   \\\\\\\\\\/////   ') + chalk.bold.blue(' press q to shutdown'));
    console.log(chalk.bgBlue('    \\\\\\\\////    ')  + chalk.bold.blue(' press f to filter'));
    console.log(chalk.bgBlue('     \\\\\\///     ')   + chalk.bold.blue(' press t to toggle timestamps'));
    console.log(chalk.bgBlue('      \\\\//      ')    + chalk.bold.blue(' press c to toggle compact inspect'));
    console.log(chalk.bgBlue('       \\/       ')      + chalk.bold.blue(' press s to toggle status check'));
    console.log(chalk.bgBlue('                ')      + chalk.bold.blue(' press p to pause output'));

    // add keypress handler if tty
    if (Boolean(process.stdout.isTTY) && process.stdin.setRawMode){
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      readline.emitKeypressEvents(process.stdin);
      process.stdin.setRawMode(true);
      process.stdin.on('keypress', (str, key) => {
        // don't process keystrokes when waiting for input
        if (!this.waitForInput) {
          if ((key.ctrl && key.name === 'c') || key.name === 'q') {
            this.$shutdown();
          } else if (key.name === 't') {
            this.timestamp = !this.timestamp;
          } else if (key.name === 'c') {
            this.compact = !this.compact;
          } else if (key.name === 's') {
            this.showStatus = !this.showStatus;
          } else if (key.name === 'p') {
            if (!this.pauseOutput) {
              console.log(chalk.bold.bgMagenta('Pausing, press p again to un-pause'));
            }
            this.pauseOutput = !this.pauseOutput;
          } else if (key.name === 'f') {
            this.waitForInput = true;
            rl.clearLine();
            rl.question(chalk.bgMagenta('Enter new filter:'), (ans) => {
              if (ans.length > 0) {
                this.filter = new RegExp(ans, 'i');
                console.log(chalk.bgMagenta(`Filtering on ${ans}`));
              } else {
                console.log(chalk.bgMagenta('Continuing with no filtering'));
                this.filter = null;
              }
              this.waitForInput = false;
            });
          }
        }
      });
    }
    // timer to check for errors periodically
    setInterval(this.checkForErrors, 5000);
    this.$ready('console ready');
  },
  events: {
    'volante.log'(obj) {
      // force check of error count on error
      if (obj.lvl === 'error' || obj.lvl === 'ready') {
        this.checkForErrors();
      }
      this.render(obj);
      // exit if the option was set
      if (obj.lvl === 'error') {
        this.exitOnError && process.exit(1);
      }
    },
  },
  data() {
    return {
      waitForInput: false,
      pauseOutput: false,
      isErrored: false,
    };
  },
  methods: {
    //
    // main entry point for log rendering
    //
    render(obj) {
      // log if any filters match
      if (!this.waitForInput &&
          !this.pauseOutput &&
          obj &&
          obj.lvl &&
          this.checkFilter(obj) &&
          obj.ts &&
          obj.src &&
          obj.msg) {
        let header = '';
        if (this.showStatus) {
          if (this.isErrored) {
            if (obj.lvl === 'error') {
              header += '𐄂';
            } else {
              header += chalk.red('𐄂');
            }
          } else {
            header += '✓';
          }
          header += '|';
        }
        if (this.timestamp) {
          header += chalk.magenta(obj.ts.toISOString());
          header += ' | ';
        }
        // log level
        header += `${this.renderLevel(obj)}|`;
        // padded volante module name
        header += `${obj.src.padEnd(this.srcLen).substring(0, this.srcLen) }|`;
        // log content items
        let content = [];
        for (let m of obj.msg) {
          if (typeof(m) === 'object') {
            content.push(util.inspect(m, {
              colors: true,
              breakLength: Infinity,
              depth: null,
              compact: this.compact,
            }));
          } else {
            content.push(this.renderColor(obj.lvl, m));
          }
        }
        console.log(`${this.renderColor(obj.lvl, header)}${content.join(', ')}`);
      }
    },
    //
    // render the log level label
    //
    renderLevel(obj) {
      switch (obj.lvl) {
        case 'debug':
          return 'DBG';
        case 'error':
          return 'ERR';
        case 'warning':
          return 'WRN';
        case 'ready':
          return 'RDY';
        case 'log':
        default:
          return 'LOG';
      }
    },
    //
    // render the log level color
    //
    renderColor(lvl, str) {
      switch (lvl) {
        case 'debug':
          return chalk.cyan(str);
        case 'error':
          return chalk.bgRed(str);
        case 'warning':
          return chalk.yellow(str);
        case 'ready':
          return chalk.bgGreen(str);
        case 'log':
        default:
          return chalk.green(str);
      }
    },
    //
    // main entry point for log rendering
    //
    checkFilter(obj) {
      // check log level filtering if not 'any'
      if (this.level !== 'any') {
        if (obj.lvl !== this.level) {
          return false;
        }
      }
      // check string filter
      if (this.filter) {
        let stringified = JSON.stringify(obj);
        // see if string
        if (typeof(this.filter) === 'string') {
          return stringified.indexOf(this.filter) > -1;
        } else if (this.filter instanceof RegExp) {
          return this.filter.test(stringified);
        }
      } else {
        return true;
      }
    },
    //
    // query Hub for status and if errored spoke count > 0, set local flag
    //
    checkForErrors() {
      let status = this.$hub.getStatus();
      this.isErrored = status.statusCounts.error > 0;
    }
  }
};

if (require.main === module) {
  console.log('running test volante wheel');
  const volante = require('volante');

  let hub = new volante.Hub().debug();

  hub.attachAll().attachFromObject(module.exports);

  hub.attachFromObject({
    name: 'TestSpoke',
    init() {
      this.$log('example log msg');
      this.$debug('example debug msg');
      this.$warn('example warning msg');
      this.$error('example error msg');
      this.$log('example object', { testVal: 1, testString: 'hello'});
      this.$log('example with lots of arguments', 1, 2, 3, 4, 5, 'six');
      this.$shutdown();
    },
  });
}
