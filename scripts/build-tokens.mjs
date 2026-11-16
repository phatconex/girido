// Đọc src/styles/tokens.json và sinh src/styles/tokens.css. App luôn dùng bảng màu sáng.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'styles');
const t = JSON.parse(fs.readFileSync(path.join(dir, 'tokens.json'), 'utf8'));
const out = [];
for (const fam of ['color', 'spacing', 'radius', 'shadow', 'duration', 'easing']) {
  for (const tok of (t[fam] && t[fam].tokens) || []) {
    out.push(`  --${tok.name}: ${typeof tok.value === 'string' ? tok.value : tok.value.light};`);
  }
}
for (const [key, stack] of Object.entries((t.type && t.type.families) || {})) out.push(`  --font-${key}: ${stack};`);
const css = `/* File sinh tự động từ tokens.json bằng \`npm run tokens\`. Đừng sửa tay. */\n:root {\n${out.join('\n')}\n  color-scheme: light;\n}\n`;
fs.writeFileSync(path.join(dir, 'tokens.css'), css);
console.log('tokens.css', out.length, 'biến');
