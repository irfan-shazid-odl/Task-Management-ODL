const fs = require('fs');
let content = fs.readFileSync('src/app/admin/tasks/page.tsx', 'utf8');

// The appended block starts with "  return (\n    <div className="p-6 max-w-[1600px] mx-auto">" 
// which is around line 249. Let's find it.
const appendStart = content.lastIndexOf('  return (\n    <div className="p-6 max-w-[1600px] mx-auto">');
if (appendStart !== -1) {
  content = content.slice(0, appendStart);
  fs.writeFileSync('src/app/admin/tasks/page.tsx', content);
  console.log('Removed appended block');
} else {
  console.log('Not found');
}
