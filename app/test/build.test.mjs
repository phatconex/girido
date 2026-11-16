import test from 'node:test'; import assert from 'node:assert/strict';
import { buildTokensCss, build } from '../build.mjs';
const tokens = { color: { tokens: [
  { name: 'bg', value: { light: '#f1f8fd', dark: '#0e1b2a' } }, { name: 'water-500', value: '#9dd2f8' } ] },
  type: { families: { display: '"Baloo 2", sans-serif' } },
  spacing: { tokens: [{ name: 'space-4', value: '16px' }] }, radius: { tokens: [] },
  shadow: { tokens: [{ name: 'press-water', value: { light: '0 4px 0 #3d8fd6', dark: '0 4px 0 #3a86c8' } }] },
  duration: { tokens: [] }, easing: { tokens: [] } };
test('ba khối theme', () => {
  const css = buildTokensCss(tokens);
  assert.match(css, /:root\{[^}]*--bg:#f1f8fd;[^}]*--water-500:#9dd2f8;[^}]*--space-4:16px;[^}]*--font-display:"Baloo 2", sans-serif;/);
  assert.match(css, /@media \(prefers-color-scheme: dark\)\{:root:not\(\[data-theme="light"\]\)\{[^}]*--bg:#0e1b2a;[^}]*--press-water:0 4px 0 #3a86c8;[^}]*color-scheme:dark/);
  assert.match(css, /:root\[data-theme="dark"\]\{[^}]*--bg:#0e1b2a;/);
  assert.doesNotMatch(css.split('@media')[1], /--water-500/);
});
test('trang ghép đúng khung', async () => {
  const html = await build();
  assert.ok(html.startsWith('<title>Giri Garden</title>'));
  assert.doesNotMatch(html, /<!doctype|<html|<body|@import/i);
  assert.match(html, /<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2\?family=Baloo\+2/);
  assert.match(html, /claude:viewport-fit-sides/);
  assert.match(html, /window\.Giri = /);
  assert.match(html, /\.gg-btn \{/);
  assert.doesNotMatch(html, /<style>[\s\S]*display=swap[\s\S]*<\/style>/);   // dòng @import phải bị bỏ trọn vẹn, kể cả các dấu ; trong URL
  assert.match(html, /\n\.gg \{ font-family: var\(--font-body\)/);
  assert.doesNotMatch(html.replace(/<script>[\s\S]*?<\/script>/g, m => m.slice(8, -9)), /<\/script/i);
});
test('chỉ một bảng màu sáng khi lightOnly', async () => {
  const css = buildTokensCss(tokens, { lightOnly: true });
  assert.match(css, /^:root\{[^}]*--bg:#f1f8fd;[^}]*color-scheme:light\}$/);
  assert.doesNotMatch(css, /prefers-color-scheme|data-theme|#0e1b2a/);
  const html = await build();
  assert.doesNotMatch(html, /prefers-color-scheme: dark|data-theme="dark"\]\{/);   // app luôn sáng, kể cả khi Claude đang ở chế độ tối
});
