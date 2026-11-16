import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function applyAnalytics(target, templateRoot = root) {
  const asset = 'swim-analytics.js';
  fs.copyFileSync(path.join(templateRoot, 'templates', asset), path.join(target, asset));
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, {withFileTypes:true})) {
      if (entry.name.startsWith('.')) continue;
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.name.endsWith('.html')) {
        let html = fs.readFileSync(file, 'utf8');
        if (!/<\/head\s*>/i.test(html)) continue;
        const relative = path.relative(directory, path.join(target, asset)).split(path.sep).join('/');
        if (html.includes(`<script src="${relative}" defer></script>`)) continue;
        html = html.replace(/<script\b[^>]*src=["'][^"']*swim-analytics\.js[^"']*["'][^>]*>\s*<\/script>/gi, '');
        html = html.replace(/<\/head\s*>/i, `<script src="${relative}" defer></script>\n</head>`);
        fs.writeFileSync(file, html);
      }
    }
  }
  visit(target);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw Error('Informe a pasta pública.');
  applyAnalytics(path.resolve(process.argv[2]));
}
