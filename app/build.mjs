// Ghép design system và mã nguồn app thành một file HTML duy nhất cho artifact.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const APP = path.dirname(fileURLToPath(import.meta.url));
const DS = path.join(path.dirname(APP), 'giri-design-system', 'project');
const FONTS = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@500;600;700;800&display=swap';
const SCRIPTS = ['logic.js', 'store.js', 'world.js', 'shell.js'];

export function buildTokensCss(t, opts) {
  const light = [], dark = [];
  for (const fam of ['color', 'spacing', 'radius', 'shadow', 'duration', 'easing']) {
    for (const tok of (t[fam] && t[fam].tokens) || []) {
      if (typeof tok.value === 'string') light.push(`--${tok.name}:${tok.value};`);
      else {
        light.push(`--${tok.name}:${tok.value.light};`);
        if (tok.value.dark !== undefined) dark.push(`--${tok.name}:${tok.value.dark};`);
      }
    }
  }
  for (const [key, stack] of Object.entries((t.type && t.type.families) || {})) light.push(`--font-${key}:${stack};`);
  if (opts && opts.lightOnly) return `:root{${light.join('')}color-scheme:light}`;   // app luôn sáng, không theo chế độ tối của Claude
  const d = dark.join('');
  return `:root{${light.join('')}}\n` +
    `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${d}color-scheme:dark}}\n` +
    `:root[data-theme="dark"]{${d}color-scheme:dark}\n:root[data-theme="light"]{color-scheme:light}`;
}

const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');

export async function build() {
  const tokens = JSON.parse(read(path.join(DS, 'tokens.json')));
  const bundleCss = read(path.join(DS, 'components', 'bundle.css')).replace(/@import\s+url\("[^"]*"\);\s*/g, '');
  const src = path.join(APP, 'src');
  const screens = fs.readdirSync(src).filter((f) => /^screen-.*\.js$/.test(f)).sort();
  const js = [read(path.join(DS, 'components', 'bundle.js'))]
    .concat([...SCRIPTS, ...screens].map((f) => read(path.join(src, f))))
    .concat(['GGShell.start();']).join('\n;\n');
  const html = '<title>Giri Garden</title>\n' +
    '<meta name="claude:viewport-fit-sides" content="cover">\n' +
    `<link rel="stylesheet" href="${FONTS}">\n` +
    `<style>\n${buildTokensCss(tokens, { lightOnly: true })}\nbody{margin:0;background:var(--bg)}\n${bundleCss}\n${read(path.join(src, 'app.css'))}\n</style>\n` +
    '<div id="app"></div>\n' +
    `<script>\n${js}\n</script>\n`;
  fs.mkdirSync(path.join(APP, 'dist'), { recursive: true });
  fs.writeFileSync(path.join(APP, 'dist', 'giri-garden.html'), html);
  return html;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  build().then((html) => console.log('giri-garden.html', Math.round(html.length / 1024) + ' KB'));
}
