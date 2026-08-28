const fs = require('fs');
let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.pnpm = {
  approvedBuilds: ['sharp', 'unrs-resolver']
};
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('Added pnpm.approvedBuilds to package.json');
