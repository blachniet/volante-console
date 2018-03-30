const chalk = require('chalk');

//
// handles logging events from the volante.Hub and renders them to
// console using color provided by the chalk module.
//
module.exports = {
	name: 'ConsoleLogger',
  //
  // volante init()
  //
  init() {
    // print header
    console.log(chalk.blue(`Volante v${this.$hub.version}`));
    console.log(chalk.blue(`console logging powered by volante-console`));
  },
	events: {
    'volante.log'(obj) {
      this.render(obj);
    },
    'volante.debug'(obj) {
      this.render(obj);
    },
    error(obj) {
      this.render(obj);
      this.exitOnError && process.exit(1);
    },
	},
	props: {
    timestamp: false,
    level: 'any',
    stringify: true,
    srcFilter: null,
    exitOnError: false,
	},
	methods: {
	  //
	  // main entry point for log rendering
	  //
	  render(obj) {
	    // log if any filters match
	    if (this.checkFilters(obj)) {
	      var line = "";
	      if (this.timestamp) {
	        line += chalk.magenta((new Date).toISOString());
					line += " | ";
	      }
	      line += `${this.renderLevel(obj)} | ${obj.src} | `;
	      // stringify objects
	      if (this.stringify && typeof(obj.msg) === 'object') {
	        line += JSON.stringify(obj.msg);
	      } else {
	        line += `${obj.msg}`;
	      }
	      console.log(line);
	    }
	  },

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
	  },

	  //
	  // main entry point for log rendering
	  //
	  checkFilters(obj) {
	    // check log level filtering if not 'any'
	    if (this.level !== 'any') {
	      if (obj.lvl !== this.level) {
	        return false;
	      }
	    }
	    // check src filter
	    if (this.srcFilter) {
	      // see if string
	      if (typeof(this.srcFilter) === 'string') {
	        if (obj.src !== this.srcFilter) {
	          return false;
	        }
	      }
	      if (this.srcFilter instanceof RegExp) {
	        if (!obj.src.match(this.srcFilter)) {
	          return false;
	        }
	      }
	    }
	    return true;
	  },
	}
}

