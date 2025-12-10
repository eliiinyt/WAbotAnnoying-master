const bcrypt = require('bcrypt');


const pass = '262144';

const saltRounds = 10;

console.log('Generando hash para:', pass);

const hash = bcrypt.hashSync(pass, saltRounds);

console.log('\n¡Hash generado!\n');
console.log(`PASSWORD_HASH=${hash}`);