import fs from 'fs';
import path from 'path';

function walk(dir, out = []) {
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) {
            if (name === 'assets') continue;
            walk(full, out);
        } else if (name.endsWith('.html')) out.push(full);
    }
    return out;
}

const needle = '<li><a href="/online-casino-malaysia-legal">Casino law in Malaysia</a></li>';
let n = 0;
for (const file of walk('public').concat([path.join('public', 'components', 'footer.html')])) {
    let html = fs.readFileSync(file, 'utf8');
    if (html.includes('href="/responsible-gambling-malaysia"') || !html.includes(needle)) continue;
    const indent = (html.match(new RegExp(`([ \\t]*)${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)) || ['', '                    '])[1];
    html = html.replace(
        needle,
        `${needle}\n${indent}<li><a href="/responsible-gambling-malaysia">Responsible gambling</a></li>`,
    );
    fs.writeFileSync(file, html);
    n += 1;
}
console.log('footer links', n);
