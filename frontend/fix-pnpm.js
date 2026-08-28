const fs = require('fs');
let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
delete pkg.pnpm;
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));

const npmrcContent = "ignore-scripts=false\n";
fs.writeFileSync('.npmrc', npmrcContent);
console.log('Fixed pnpm configuration');
