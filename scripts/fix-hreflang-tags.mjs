import fs from 'fs';
import path from 'path';

function walk(dir, out = []) {
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) {
            if (name === 'assets' || name === 'components') continue;
            walk(full, out);
        } else if (name.endsWith('.html')) out.push(full);
    }
    return out;
}

let n = 0;
for (const file of walk('public')) {
    const html = fs.readFileSync(file, 'utf8');
    const next = html
        .replace(
            /<link rel="canonical" href="([^"]+)"(\r?\n\s*<link rel="alternate")/g,
            '<link rel="canonical" href="$1">$2',
        )
        .replace(/(hreflang="x-default" href="[^"]+")>>/g, '$1>');
    if (next !== html) {
        fs.writeFileSync(file, next);
        n += 1;
    }
}
console.log('fixed', n);
