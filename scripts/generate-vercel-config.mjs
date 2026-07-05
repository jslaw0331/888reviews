/**
 * Merges vercel-redirects.json into vercel.json (run before deploy).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const base = JSON.parse(fs.readFileSync(path.join(root, 'vercel.base.json'), 'utf8'));
const redirects = JSON.parse(fs.readFileSync(path.join(root, 'vercel-redirects.json'), 'utf8'));
base.redirects = redirects;
fs.writeFileSync(path.join(root, 'vercel.json'), `${JSON.stringify(base, null, 2)}\n`);
console.log(`vercel.json updated (${redirects.length} redirects)`);
