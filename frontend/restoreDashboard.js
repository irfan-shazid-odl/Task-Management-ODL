const fs = require('fs');
const hookContent = fs.readFileSync('src/app/dashboard/_hooks/useDashboardState.ts', 'utf8');
const pageContent = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

const originalPrefix = "'use client';\n\nimport React, { useEf";
const hookParts = hookContent.split('export function useDashboardState() {\n');
const originalMiddle = hookParts[1].slice(0, hookParts[1].indexOf('  return {\n    '));

const pageParts = pageContent.split('} = useDashboardState();\n\n');
const originalEnd = pageParts[1];

const originalFile = originalPrefix + originalMiddle + '  return (' + originalEnd;
fs.writeFileSync('src/app/dashboard/page.tsx', originalFile);

console.log('Restored dashboard/page.tsx completely.');
