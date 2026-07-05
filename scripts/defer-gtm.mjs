/**
 * Defer Google Tag Manager until after load / idle.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

const gtmLoader = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-TS95HFR5');`;

const gtmDeferred = `<script>
(function(){
  function loadGtm(){${gtmLoader}}
  if('requestIdleCallback' in window){requestIdleCallback(loadGtm,{timeout:3000});}
  else{window.addEventListener('load',loadGtm,{once:true});}
})();
</script>`;

let count = 0;
for (const file of fs.readdirSync(publicDir).filter((f) => f.endsWith('.html'))) {
  let html = fs.readFileSync(path.join(publicDir, file), 'utf8');
  if (!html.includes('GTM-TS95HFR5')) continue;
  const replaced = html.replace(
    /<script>\(function\s*\(\s*w,\s*d,\s*s,\s*l,\s*i\s*\)\s*\{[\s\S]*?GTM-TS95HFR5[\s\S]*?<\/script>/,
    gtmDeferred,
  );
  if (replaced !== html) {
    fs.writeFileSync(path.join(publicDir, file), replaced);
    count++;
  }
}
console.log(`Deferred GTM on ${count} HTML files`);
