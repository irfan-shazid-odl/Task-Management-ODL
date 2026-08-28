const fs = require('fs');
const content = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

const compStartStr = 'export default function Dashboard() {';
const compStart = content.indexOf(compStartStr);
const endState = content.indexOf('  return (', compStart);

const stateBlock = content.slice(compStart + compStartStr.length, endState);

const vars = new Set();
const lines = stateBlock.split('\n');

for (const line of lines) {
  let m;
  if ((m = line.match(/^  (?:const|let|var) \[([a-zA-Z0-9_]+), ([a-zA-Z0-9_]+)\] =/))) {
    vars.add(m[1]); vars.add(m[2]);
  } else if ((m = line.match(/^  (?:const|let|var) ([a-zA-Z0-9_]+)\s*=/))) {
    vars.add(m[1]);
  } else if ((m = line.match(/^  function ([a-zA-Z0-9_]+)/))) {
    vars.add(m[1]);
  }
}
if (vars.has('currentUser')) {
    vars.delete('currentUser'); // injected from useUser inside the hook
}
const varsList = Array.from(vars);

let hookContent = `import { useState, useEffect, useMemo, useRef } from 'react';\n`;
hookContent += `import { useRouter } from 'next/navigation';\n`;
hookContent += `import { api, subscribeToChanges } from '@/lib/api';\n`;
hookContent += `import { useUser } from '@/components/UserContext';\n`;
hookContent += `import { Task, Project } from '@/lib/types';\n`;
hookContent += `import { generateProjectReport } from '@/lib/generateProjectReport';\n\n`;
hookContent += `export function useDashboardState() {\n`;
hookContent += stateBlock;
hookContent += `  return {\n    ` + varsList.join(',\n    ') + `\n  };\n}\n`;

fs.writeFileSync('src/app/dashboard/_hooks/useDashboardState.ts', hookContent);

let newPage = content.slice(0, compStart + compStartStr.length) + '\n';
newPage += `  const {\n    ` + varsList.join(',\n    ') + `\n  } = useDashboardState();\n\n`;
newPage += content.slice(endState);

newPage = newPage.replace(/import { useState, useEffect, useMemo, useRef } from 'react';\n/, "import { useDashboardState } from './_hooks/useDashboardState';\n");

fs.writeFileSync('src/app/dashboard/page.tsx', newPage);

console.log('Refactored dashboard/page.tsx');
