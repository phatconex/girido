// Ghép bản phác thành một file HTML: token + bundle của design system + mock.css + mock.js.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { buildTokensCss } from '../app/build.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url)), DS = path.join(path.dirname(HERE), 'giri-design-system', 'project');
const read = (p) => fs.readFileSync(p, 'utf8');
const css = read(path.join(DS, 'components', 'bundle.css')).replace(/@import\s+url\("[^"]*"\);\s*/g, '');
const html = '<title>Giri Garden Mockup</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@500;600;700;800&display=swap">\n' +
  `<style>\n${buildTokensCss(JSON.parse(read(path.join(DS, 'tokens.json'))), { lightOnly: true })}\n${css}\n${read(path.join(HERE, 'mock.css'))}\n</style>\n<div id="mock"></div>\n` +
  `<script>\n${read(path.join(DS, 'components', 'bundle.js'))}\n;\n${read(path.join(HERE, 'mock.js'))}\n</script>\n`;
fs.writeFileSync(path.join(HERE, 'dist', 'giri-mockup.html'), html);
console.log('giri-mockup.html', Math.round(html.length / 1024) + ' KB');

// bản thử 3D: thêm three.js (cdnjs, bản r128) và cảnh WebGL
const html3d = html.replace('<title>Giri Garden Mockup</title>', '<title>Giri Garden 3D</title>')
  .replace('\n</style>', '\n' + read(path.join(HERE, 'mock3d.css')) + '\n</style>')
  .replace('<script>\n', '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n<script>\n' + read(path.join(HERE, 'world3d.js')) + '\n;\n');
fs.writeFileSync(path.join(HERE, 'dist', 'giri-3d.html'), html3d);
console.log('giri-3d.html', Math.round(html3d.length / 1024) + ' KB');
