const chalk = require('chalk');
const util = require('util');

//
// handles logging events from the volante.Hub and renders them to
// console using color provided by the chalk module.
//
module.exports = {
	name: 'VolanteConsole',
	init() {
		// print header
		console.log(chalk.bold.blue('____    ____ '));
		console.log(chalk.bold.blue(`\\   \\  /   / Powered by Volante v${this.$hub.version}`));
		console.log(chalk.bold.blue(` \\   \\/   /  ${(new Date).toISOString()}`));
		console.log(chalk.bold.blue('  \\      /   console logging powered by volante-console'));
		console.log(chalk.bold.blue('   \\    /    press q to shutdown'));
		console.log(chalk.bold.blue('    \\__/     '));

		// add q handler if tty
		if (Boolean(process.stdout.isTTY) && process.stdin.setRawMode){
			const readline = require('readline');
			readline.emitKeypressEvents(process.stdin);
			process.stdin.setRawMode(true);
			process.stdin.on('keypress', (str, key) => {
				if ((key.ctrl && key.name === 'c') || key.name === 'q') {
					this.$shutdown();
				}
			});
		}
	},
	events: {
		'volante.log'(obj) {
			this.render(obj);
			if (obj.lvl === 'error') {
				this.exitOnError && process.exit(1);
			}
		},
	},
	props: {
		timestamp: false,
		level: 'any',
		srcFilter: null,
		exitOnError: false,
		srcLen: 16,
	},
	methods: {
		//
		// main entry point for log rendering
		//
		render(obj) {
			// log if any filters match
			if (obj &&
			    obj.lvl &&
			    this.checkFilters(obj) &&
			    obj.ts &&
			    obj.src &&
			    obj.msg) {
				let header = '';
				if (this.timestamp) {
					header += chalk.magenta(obj.ts.toISOString());
					header += " | ";
				}
				// log level
				header += `${this.renderLevel(obj)} | `;
				// padded volante module name
				header += `${obj.src.padEnd(this.srcLen).substring(0, this.srcLen) } |`;
				// log content items
				let content = [];
				for (let m of obj.msg) {
					if (typeof(m) === 'object') {
						content.push(util.inspect(m, {
							colors: true,
							breakLength: Infinity,
						}));
					} else {
						content.push(this.renderColor(obj.lvl, m));
					}
				}
				console.log(this.renderColor(obj.lvl, header), content.join(', '));
			}
		},

		//
		// render the log level
		//
		renderLevel(obj) {
			switch (obj.lvl) {
				case 'debug':
					return "DBG";
				case 'error':
					return "ERR";
				case 'warning':
					return 'WRN';
				case 'log':
				default:
					return "LOG";
			}
		},

		renderColor(lvl, str) {
			switch (lvl) {
				case 'debug':
					return chalk.cyan(str);
				case 'error':
					return chalk.red(str);
				case 'warning':
					return chalk.yellow(str);
				case 'log':
				default:
					return chalk.green(str);
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
