/*eslint no-eval: "warning" */
const util = require('util');

//
// handles logging events from the volante.Hub and renders them to
// console using color provided by the chalk module.
//
module.exports = {
  name: 'VolanteConsole',
  props: {
    timestamp: false,        // show timestamp column
    compact: true,           // option for util.inspect
    level: 'any',            // level filter
    filter: null,            // string or RegExp filter for entire content
    exitOnError: false,      // trigger $shutdown on error
    srcLen: 16,              // width of source (usually spoke name) column
    statsDumpInterval: 2000, // ms interval for stats dump
    statsDumpFrom: [],       // name of spoke to dump stats, or 'all' for all stats from all modules
    monochrome: false,       // flag for no-color output
    allowEval: true,         // flag to allow eval function, might be good to disable for production
    catchUnhandled: true     // add handler to process to print out unhandledRejection events
                             // note that better
  },
  updated() {
    // clear any existing timer
    if (this.statsIntervalHandle) {
      clearInterval(this.statsIntervalHandle);
    }
    // start a new one if there is something to dump
    if (this.statsDumpFrom.length > 0) {
      setInterval(this.collectStats, this.statsDumpInterval);
    }
    if (this.catchUnhandled) {
      process.on('unhandledRejection', (reason, p) => {
        console.warn(this.colorz('\nUNHANDLED REJECTION\n', 'red'), p, reason, '\n');
      });
    }
  },
  stats: {
    numLines: 0,
  },
  init() {
    // print header
    console.log(this.colorz('  ____    ____  ', 'bg.blue')   + this.colorz(` ${this.getName()}Powered by Volante v${this.$hub.version}`, 'bold.blue'));
    console.log(this.colorz('  \\\\\\\\\\  /////  ', 'bg.blue') + this.colorz(` started on ${(new Date).toISOString()}`, 'bold.blue'));
    console.log(this.colorz('   \\\\\\\\\\/////   ', 'bg.blue') + this.colorz(' press q to shutdown', 'bold.blue'));
    console.log(this.colorz('    \\\\\\\\////    ', 'bg.blue')  + this.colorz(' press f to filter', 'bold.blue'));
    console.log(this.colorz('     \\\\\\///     ', 'bg.blue')   + this.colorz(' press t to toggle timestamps', 'bold.blue'));
    console.log(this.colorz('      \\\\//      ', 'bg.blue')    + this.colorz(' press c to toggle compact inspect', 'bold.blue'));
    console.log(this.colorz('       \\/       ', 'bg.blue')      + this.colorz(' press s to print status for the wheel', 'bold.blue'));
    console.log(this.colorz('                ', 'bg.blue')      + this.colorz(' press p to pause output', 'bold.blue'));
    console.log(this.colorz('                ', 'bg.blue')      + this.colorz(' press e to evaluate statement', 'bold.blue'));

    // add keypress handler if there is tty
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
            this.renderWheelStatus();
          } else if (key.name === 'p') {
            if (!this.pauseOutput) {
              console.log(this.colorz('Pausing, press p again to un-pause', 'bg.magenta'));
            }
            this.pauseOutput = !this.pauseOutput;
          } else if (key.name === 'e' && this.allowEval) {
            this.waitForInput = true;
            rl.clearLine();
            rl.question(this.colorz('Enter statement:', 'bg.magenta'), (ans) => {
              if (ans.length > 0) {
                try {
                  (function(){
          	        console.log(util.inspect(eval(ans), {
                      colors: !this.monochrome,
                      breakLength: Infinity,
                      depth: null,
                      compact: false,
                    }));
                  }).call(this);
                } catch (e) {
                  console.log(this.colorz(e, 'red'));
                }
              }
              this.waitForInput = false;
            });
          } else if (key.name === 'f') {
            this.waitForInput = true;
            rl.clearLine();
            rl.question(this.colorz('Enter new filter:', 'bg.magenta'), (ans) => {
              if (ans.length > 0) {
                this.filter = new RegExp(ans, 'i');
                console.log(this.colorz(`Filtering on ${ans}`, 'bg.magenta'));
              } else {
                console.log(this.colorz('Continuing with no filtering', 'bg.magenta'));
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
      statsIntervalHandle: null,
    };
  },
  methods: {
    colorz(str, color) {
      if (this.monochrome) {
        return str;
      }
      switch(color) {
        case 'bg.red':
          return `\x1b[41m${str}\x1b[0m`;
        case 'bg.green':
          return `\x1b[42m${str}\x1b[0m`;
        case 'bg.blue':
          return `\x1b[44m${str}\x1b[0m`;
        case 'bg.magenta':
          return `\x1b[45m${str}\x1b[0m`;
        case 'bold.blue':
          return `\x1b[34;1m${str}\x1b[0m`;
        case 'red':
          return `\x1b[31m${str}\x1b[0m`;
        case 'green':
          return `\x1b[32m${str}\x1b[0m`;
        case 'yellow':
          return `\x1b[33m${str}\x1b[0m`;
        case 'magenta':
          return `\x1b[35m${str}\x1b[0m`;
        case 'cyan':
          return `\x1b[36m${str}\x1b[0m`;
        default:
          console.warn(`not implemented color code ${color}`);
          return str;
      }
    },
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
        this.numLines++;
        let header = '';
        if (this.isErrored) {
          if (obj.lvl === 'error') {
            header += '𐄂';
          } else {
            header += this.colorz('𐄂', 'red');
          }
        } else {
          header += '✓';
        }
        header += '|';
        if (this.timestamp) {
          header += this.colorz(obj.ts.toISOString(), 'magenta');
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
              colors: !this.monochrome,
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
          return this.colorz(str, 'cyan');
        case 'error':
          return this.colorz(str, 'bg.red');
        case 'warning':
          return this.colorz(str, 'yellow');
        case 'ready':
          return this.colorz(str, 'bg.green');
        case 'log':
        default:
          return this.colorz(str, 'green');
      }
    },
    //
    // get the status of the Volante wheel from the Hub and print it out
    renderWheelStatus() {
      let st = this.$hub.getStatus();
      console.log(util.inspect(st, {
        colors: true,
        breakLength: Infinity,
        depth: null,
        compact: false,
      }));
    },
    //
    // called on a timer specified by statsDumpInterval, and dumps
    // the stats for modules called out in statsDumpFrom
    //
    collectStats() {
      if (!this.waitForInput) {
        let stats = this.$hub.getStatus();
        // 'all' takes precedence over any other spoke names so we don't double-log
        if (this.statsDumpFrom.indexOf('all') > -1) {
          // rendering all stats for all spokes
          for (let s of stats.spokes) {
            this.renderStats(s);
          }
        } else {
          for (let s of stats.spokes) {
            if (this.statsDumpFrom.indexOf(s.name) > -1) {
              this.renderStats(s);
            }
          }
        }
      }
    },
    //
    // render the stats for the given spoke
    //
    renderStats(spoke) {
      let values = [];
      for (let [k,v] of Object.entries(spoke.stats)) {
        values.push(`${k}:${v}`);
      }
      console.log(`STATS|${spoke.name.padEnd(this.srcLen).substring(0, this.srcLen) }|status: ${spoke.status.status}, ${values.join(', ')}`);
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
    },
    //
    // try to resolve name
    //
    getName() {
      if (this.$hub.name !== 'VolanteHub') {
        return `${this.$hub.name} - `;
      }
      return '';
    },
  }
};
