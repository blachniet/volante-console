
module.exports = {
  name: 'TestSpoke',
  init() {
    this.$log('example log msg');
    this.$ready('example ready msg');
    this.$debug('example debug msg');
    this.$warn('example warning msg');
    this.$error('example error msg');
    this.$log('example object', { testVal: 1, testString: 'hello'});
    this.$log('example with lots of arguments', 1, 2, 3, 4, 5, 'six');
    setInterval(this.incrementCounter, 1000);
  },
  stats: {
    exampleCounter: 0,
    exampleCounter2: 0,
  },
  methods: {
    helloWorld() {
      console.log('HELLO WORLD');
    },
    incrementCounter() {
      this.exampleCounter++;
      this.exampleCounter2 += 2;
    },
  },
};