// Debug MIAL parsing
const { MialLexer } = require('./src/parser/MialLexer');

const lexer = new MialLexer();
const code = `let x = 42;
console.log(x);`;

console.log('Tokenizing:', code);
const tokens = lexer.tokenize(code);
console.log('Tokens:', tokens);