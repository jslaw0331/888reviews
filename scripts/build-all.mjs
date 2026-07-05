/**
 * Full production build pipeline.
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function run(label, script) {
  console.log(`\n— ${label} —`);
  const r = spawnSync(process.execPath, [path.join(__dirname, script)], {
    cwd: root,
    stdio: 'inherit',
  });
  if (r.status !== 0) {
    process.exit(r.status || 1);
  }
}

run('Vercel config', 'generate-vercel-config.mjs');
run('CSS bundles', 'build-css.mjs');
run('JS bundles', 'build-js.mjs');
run('Self-host fonts', 'setup-fonts.mjs');
run('Local Lucide', 'setup-lucide.mjs');
run('Inline components', 'inline-components.mjs');
run('Pre-render hubs', 'prerender-hubs.mjs');
run('Update HTML asset refs', 'update-html-assets.mjs');
run('Defer GTM', 'defer-gtm.mjs');
run('Performance baseline', 'record-baseline.mjs');
console.log('\nBuild complete.');
