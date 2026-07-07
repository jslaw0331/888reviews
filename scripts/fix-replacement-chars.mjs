/**
 * Fix U+FFFD replacement characters introduced by encoding corruption.
 * Run: node scripts/fix-replacement-chars.mjs
 */
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.resolve('public');

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules') continue;
      walk(p, out);
    } else if (/\.html$/.test(ent.name)) {
      out.push(p);
    }
  }
  return out;
}

function fixText(text) {
  let t = text;

  // --- Specific words / phrases (before generic rules) ---
  t = t.replace(/Cura\uFFFDao/g, 'Cura&ccedil;ao');
  t = t.replace(/Salon Priv\uFFFD/g, 'Salon Priv&eacute;');
  t = t.replace(/Priv\uFFFD/g, 'Priv&eacute;');
  t = t.replace(/caf\uFFFD/g, 'caf&eacute;');
  t = t.replace(/Touch \uFFFDn Go/g, 'Touch&rsquo;n Go');

  t = t.replace(/Malaysia\uFFFDs/g, 'Malaysia&rsquo;s');
  t = t.replace(/you\uFFFDve/g, 'you&rsquo;ve');
  t = t.replace(/that\uFFFDs/g, 'that&rsquo;s');
  t = t.replace(/it\uFFFDs/g, 'it&rsquo;s');
  t = t.replace(/we\uFFFDve/g, 'we&rsquo;ve');
  t = t.replace(/they\uFFFDre/g, 'they&rsquo;re');
  t = t.replace(/there\uFFFDs/g, 'there&rsquo;s');
  t = t.replace(/what\uFFFDs/g, 'what&rsquo;s');

  // Possessives / contractions
  t = t.replace(/operator\uFFFDs/g, 'operator&rsquo;s');
  t = t.replace(/brand\uFFFDs/g, 'brand&rsquo;s');
  t = t.replace(/others\uFFFD/g, 'others&rsquo;');
  t = t.replace(/can\uFFFDt/g, 'can&rsquo;t');
  t = t.replace(/don\uFFFDt/g, 'don&rsquo;t');
  t = t.replace(/you\uFFFDll/g, 'you&rsquo;ll');
  t = t.replace(/bonus\uFFFDs/g, 'bonus&rsquo;s');
  t = t.replace(/casino\uFFFDs/g, 'casino&rsquo;s');
  t = t.replace(/chosen casino\uFFFDs/g, 'chosen casino&rsquo;s');

  // Quoted terms
  t = t.replace(/\uFFFDTerms\uFFFD/g, '&ldquo;Terms&rdquo;');
  t = t.replace(/\uFFFDwe\uFFFD/g, '&ldquo;we&rdquo;');
  t = t.replace(/\uFFFDus\uFFFD/g, '&ldquo;us&rdquo;');
  t = t.replace(/\uFFFDour\uFFFD/g, '&ldquo;our&rdquo;');
  t = t.replace(/\uFFFDLast updated\uFFFD/g, '&ldquo;Last updated&rdquo;');
  t = t.replace(/\uFFFDas is\uFFFD/g, '&ldquo;as is&rdquo;');
  t = t.replace(/\uFFFDas available\uFFFD/g, '&ldquo;as available&rdquo;');
  t = t.replace(/\uFFFDClaim Bonus\uFFFD/g, '&ldquo;Claim Bonus&rdquo;');
  t = t.replace(/\uFFFDbest\uFFFD/g, '&ldquo;best&rdquo;');
  t = t.replace(/\uFFFDcasino bonus\uFFFD/g, '&ldquo;casino bonus&rdquo;');

  // Loading / placeholder states
  t = t.replace(/Loading review\uFFFD/g, 'Loading review&hellip;');
  t = t.replace(/Loading guides\uFFFD/g, 'Loading guides&hellip;');
  t = t.replace(/Loading headlines\uFFFD/g, 'Loading headlines&hellip;');
  t = t.replace(/Loading\uFFFD/g, 'Loading&hellip;');

  // Breadcrumb / inline nav separators
  t = t.replace(/<\/a> \uFFFD <a/g, '</a> &middot; <a');

  // Footer RG link separators
  t = t.replace(/<span aria-hidden="true"> \uFFFD <\/span>/g, '<span aria-hidden="true"> &middot; </span>');

  // HTML comments (arrows were also corrupted to ASCII ?)
  t = t.replace(
    /deferred scripts \uFFFD Lucide UMD \? layout components \? page bundle\(s\)\./g,
    'deferred scripts — Lucide UMD → layout components → page bundle(s).',
  );
  t = t.replace(
    /deferred scripts \uFFFD markdown \? Lucide UMD \? layout components \? page bundle\(s\)\./g,
    'deferred scripts — markdown → Lucide UMD → layout components → page bundle(s).',
  );

  // Wagering multiplier (not a range)
  t = t.replace(/(\d)\uFFFD rollover/g, '$1&times; rollover');

  // Numeric / currency ranges
  t = t.replace(/(\d)\uFFFD(\d)/g, '$1&ndash;$2');

  // Compound meta / prose without surrounding spaces
  t = t.replace(/briefings\uFFFDverify/g, 'briefings&mdash;verify');
  t = t.replace(/context\uFFFDeditorial/g, 'context&mdash;editorial');
  t = t.replace(/play\uFFFDclear/g, 'play&mdash;clear');
  t = t.replace(/site\uFFFDnot/g, 'site&mdash;not');
  t = t.replace(/policy\uFFFDsuch/g, 'policy&mdash;such');
  t = t.replace(/Malaysia \uFFFD sites/g, 'Malaysia &mdash; sites');

  // Skeleton operator rows
  t = t.replace(/<strong>\uFFFD<\/strong>/g, '<strong>&mdash;</strong>');
  t = t.replace(/<p>\uFFFD<\/p>/g, '<p>&mdash;</p>');
  t = t.replace(/(<li><i[^>]*><\/i>) \uFFFD(<\/li>)/g, '$1 &mdash;$2');

  // Kicker line breaks: "Malaysia ·\nOnline slots · 2026"
  t = t.replace(/(\w) \uFFFD\r?\n(\s*\w)/g, '$1 &middot;\n$2');
  t = t.replace(/(blackjack|baccarat|roulette|slots|casino|apps|Bonuses|Reviews|Mobile apps|E-wallets|Live casino) \uFFFD 2026/gi, '$1 &middot; 2026');

  // Provider / tag lists (Title Case · Title Case)
  t = t.replace(
    /(class="malaysia-provider-tags[^"]*">)([\s\S]*?)(<\/p>)/g,
    (full, open, body, close) => {
      const fixed = body.replace(/ \uFFFD /g, ' &middot; ');
      return open + fixed + close;
    },
  );
  t = t.replace(
    /(id="live-casino-provider-tags">)([\s\S]*?)(<\/p>)/g,
    (full, open, body, close) => {
      const fixed = body.replace(/ \uFFFD /g, ' &middot; ');
      return open + fixed + close;
    },
  );

  // Hero kickers on one line: Malaysia · Bonuses · 2026
  t = t.replace(/(gh-kicker[^>]*>[\s\S]*?) \uFFFD /g, (m) => {
    if (m.includes('casinos-hero__kicker') || m.includes('gh-kicker')) {
      return m.replace(/ \uFFFD /g, ' &middot; ');
    }
    return m;
  });
  // Re-apply within kicker paragraphs only
  t = t.replace(
    /(<p class="gh-kicker[^"]*">[\s\S]*?<\/p>)/g,
    (block) => block.replace(/ \uFFFD /g, ' &middot; '),
  );
  t = t.replace(
    /(<p class="gh-kicker casinos-hero__kicker"[^>]*>[\s\S]*?<\/p>)/g,
    (block) => block.replace(/ \uFFFD /g, ' &middot; '),
  );

  // Leading em dash in paragraph (ewallet intro)
  t = t.replace(/(<p[^>]*>)\s*\uFFFD /g, '$1&mdash; ');

  // Remaining spaced separators → em dash (prose)
  t = t.replace(/ \uFFFD /g, ' &mdash; ');

  // Any leftover replacement chars
  t = t.replace(/\uFFFD/g, '&mdash;');

  return t;
}

const files = walk(PUBLIC_DIR);
let totalFixed = 0;

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  if (!original.includes('\uFFFD')) continue;
  const before = (original.match(/\uFFFD/g) || []).length;
  const fixed = fixText(original);
  const after = (fixed.match(/\uFFFD/g) || []).length;
  if (fixed !== original) {
    fs.writeFileSync(file, fixed, 'utf8');
    totalFixed += before - after;
    console.log(`${path.relative(PUBLIC_DIR, file)}: ${before} → ${after} remaining`);
  }
}

console.log(`Done. Fixed ${totalFixed} replacement characters.`);
