// Turns the web export in dist-web/ into one self-contained HTML file
// (dist-web/stay-clean-demo.html): scripts inlined, assets as data: URIs.
// Run after `pnpm demo:web`. Useful for hosts that serve a single page.
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve(process.argv[2] ?? 'dist-web');
const out = path.join(dist, 'stay-clean-demo.html');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

const MIME = { '.png': 'image/png', '.ttf': 'font/ttf', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));
}

// Only assets the bundle actually mentions are embedded.
const assets = fs.existsSync(path.join(dist, 'assets')) ? walk(path.join(dist, 'assets')) : [];

const scripts = [...html.matchAll(/<script src="([^"]+)" defer><\/script>/g)].map((m) => m[1]);
let js = scripts.map((src) => fs.readFileSync(path.join(dist, src), 'utf8')).join('\n;\n');
let embedded = 0;
for (const file of assets) {
  const url = '/' + path.relative(dist, file).split(path.sep).join('/');
  if (!js.includes(url)) continue;
  const data = `data:${MIME[path.extname(file)] ?? 'application/octet-stream'};base64,${fs.readFileSync(file).toString('base64')}`;
  js = js.split(url).join(data);
  embedded++;
}
// Keep the inlined code from closing its own <script> tag early.
js = js.replace(/<\/script/gi, '<\\/script');

const styles = html.match(/<style id="expo-reset">[\s\S]*?<\/style>/)?.[0] ?? '';
const page = `<title>Stay Clean</title>
<meta name="description" content="Browser demo of the Stay Clean recovery companion app.">
${styles}
<style>html, body { background: #E4E8E6; margin: 0; }</style>
<div id="root"></div>
<script>
  // The app's router reads the page path; start it at the app's home.
  try { if (location.pathname !== '/') history.replaceState(null, '', '/'); } catch (e) {}
</script>
<script>
${js}
</script>
`;
fs.writeFileSync(out, page);
console.log(`Wrote ${path.relative(process.cwd(), out)} (${(page.length / 1e6).toFixed(1)} MB, ${scripts.length} scripts, ${embedded} assets embedded)`);
