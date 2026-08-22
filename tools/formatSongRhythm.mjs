import fs from 'node:fs';

const fileName = process.argv[2];
if (!fileName) {
  throw new Error('Missing song file path');
}

const source = fs.readFileSync(fileName, 'utf8');
const song = Function(`return (${source})`)();

function compactValue(value) {
  if (Array.isArray(value)) {
    let end = value.length;
    while (end && !(end - 1 in value))
      --end;
    const values = [];
    for (let i = 0; i < end; ++i)
      values.push(i in value ? compactValue(value[i]) : '');
    return `[${values.join(',')}]`;
  }
  if (value && typeof value == 'object')
    return JSON.stringify(value);
  if (typeof value == 'number')
    return Number.isInteger(value) ? String(value) : String(value);
  return String(value ?? '');
}

function rhythmValue(value) {
  return value == undefined ? '  ' : String(value).padStart(2, ' ');
}

function rhythmRow(row, indent) {
  const values = [];
  for (let i = 0; i < row.length; ++i)
    values.push(i in row ? rhythmValue(row[i]) : '  ');
  return `${indent}[${values.join(',')}]`;
}

function formatPatterns(patterns) {
  return `[\n${patterns.map(pattern => {
    if (pattern.length == 1)
      return `  [${rhythmRow(pattern[0], '')}]`;
    return `  [\n${pattern.map(row => rhythmRow(row, '    ')).join(',\n')}\n  ]`;
  }).join(',\n')}\n]`;
}

const output = `[${
  compactValue(song[0])
},\n${
  formatPatterns(song[1])
},${
  compactValue(song[2])
},${
  compactValue(song[3])
},${
  compactValue(song[4])
}]\n`;

fs.writeFileSync(fileName, output);
