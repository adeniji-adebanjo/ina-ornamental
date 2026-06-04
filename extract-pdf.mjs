import { readFileSync } from 'fs';

const buf = readFileSync('public/INA.pdf');
const text = buf.toString('latin1');

// Extract text content between parentheses in BT/ET blocks
const btBlocks = [...text.matchAll(/BT\s([\s\S]*?)ET/g)];
const allText = [];

for (const block of btBlocks) {
  const content = block[1];
  // Extract text in parentheses (Tj operator)
  const tjMatches = [...content.matchAll(/\(([^)]*)\)\s*Tj/g)];
  for (const m of tjMatches) {
    allText.push(m[1]);
  }
  // Extract text from TJ arrays
  const tjArrayMatches = [...content.matchAll(/\[(.*?)\]\s*TJ/g)];
  for (const m of tjArrayMatches) {
    const parts = [...m[1].matchAll(/\(([^)]*)\)/g)];
    allText.push(parts.map(p => p[1]).join(''));
  }
}

console.log('=== Extracted Text ===');
console.log(allText.join('\n'));

// Also try to find color definitions
const colorMatches = [...text.matchAll(/(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(rg|RG)/g)];
console.log('\n=== Colors Found (RGB) ===');
const seen = new Set();
for (const c of colorMatches) {
  const key = `${c[1]} ${c[2]} ${c[3]}`;
  if (!seen.has(key)) {
    seen.add(key);
    const r = Math.round(parseFloat(c[1]) * 255);
    const g = Math.round(parseFloat(c[2]) * 255);
    const b = Math.round(parseFloat(c[3]) * 255);
    const hex = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
    console.log(`  RGB(${r}, ${g}, ${b}) = ${hex}`);
  }
}

// Look for font references
const fontMatches = [...text.matchAll(/\/BaseFont\s*\/([^\s/\]>]+)/g)];
console.log('\n=== Fonts Found ===');
const seenFonts = new Set();
for (const f of fontMatches) {
  if (!seenFonts.has(f[1])) {
    seenFonts.add(f[1]);
    console.log(`  ${f[1]}`);
  }
}
