const fs = require('fs');
let pageContent = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

pageContent = pageContent.replace('return (  return () => {', '  return () => {');
fs.writeFileSync('src/app/dashboard/page.tsx', pageContent);

console.log('Fixed syntax error in dashboard/page.tsx');
