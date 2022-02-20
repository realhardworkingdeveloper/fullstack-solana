const fs = require('fs');
const idl = require('./target/idl/fullstack_solana.json');

fs.writeFileSync('./app/src/idl.json', JSON.stringify(idl));