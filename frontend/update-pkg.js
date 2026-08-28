/* eslint-disable */
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.pnpm = {
  onlyBuiltDependencies: ['sharp', 'unrs-resolver']
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('Updated package.json');
