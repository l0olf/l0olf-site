import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const site = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(site, 'dist');
const output = path.join(site, 'netlify-publish');
const backup = path.join(site, 'review', 'before-netlify-publication');
const siteUrl = process.argv[2] || process.env.URL;
const origin = siteUrl ? new URL(siteUrl).origin : '';
const hasSocialCover = fs.existsSync(path.join(source, 'assets/social-cover.png'));
if (origin && !origin.startsWith('https://')) throw new Error('Use the confirmed HTTPS site URL.');
const read = file => fs.readFileSync(path.join(source, file), 'utf8');
function update(file, content) {
  const saved = path.join(backup, file);
  if (!fs.existsSync(saved)) {
    fs.mkdirSync(path.dirname(saved), { recursive: true });
    fs.copyFileSync(path.join(source, file), saved);
  }
  fs.writeFileSync(path.join(source, file), content);
}

let home = read('index.html').replace('content="noindex,nofollow"', 'content="index,follow"');
let privacy = read('privacidade/index.html')
  .replace('content="noindex,nofollow"', 'content="index,follow"')
  .replace('<div class="review">VERSÃO PARA REVISÃO ANTES DA PUBLICAÇÃO</div>', '')
  .replace('<p class="notice">Esta versão está disponível apenas para revisão local. A hospedagem pública e seu tratamento de registros técnicos serão confirmados antes da publicação.</p>', '');

function withoutPublicationTags(html) {
  return html.replace(/\s*<link rel="canonical"[^>]*>/g, '')
    .replace(/\s*<meta (?:property|name)="(?:og:url|og:image(?::\w+)?|og:locale|og:site_name|twitter:card|twitter:image)"[^>]*>/g, '');
}
if (origin) {
  home = withoutPublicationTags(home).replace('</head>', `    <link rel="canonical" href="${origin}/">
    <meta property="og:url" content="${origin}/">
    <meta property="og:site_name" content="L0olf">
    <meta property="og:locale" content="pt_BR">
${hasSocialCover ? `    <meta property="og:image" content="${origin}/assets/social-cover.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="L0olf — Clique é só o começo. Tráfego, performance e automações.">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="${origin}/assets/social-cover.png">` : ''}
</head>`);
  privacy = withoutPublicationTags(privacy).replace('</head>', `<link rel="canonical" href="${origin}/privacidade/"></head>`);
  fs.writeFileSync(path.join(source, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url><url><loc>${origin}/privacidade/</loc></url></urlset>\n`);
}
update('index.html', home);
update('privacidade/index.html', privacy);
update('_headers', read('_headers').replace(/\s*X-Robots-Tag: noindex, nofollow\s*/g, '\n'));
update('robots.txt', `User-agent: *\nAllow: /\n${origin ? `\nSitemap: ${origin}/sitemap.xml\n` : ''}`);

// Only the approved public pages and their assets are included. Review material stays local.
const files = ['index.html', 'privacidade/index.html', '404.html', '_headers', 'robots.txt',
  'brand.css', 'ember.css', 'intro.css', 'style.css', 'brand.js', 'intro.js', 'intro-field.js',
  'vendor/lenis.min.js', 'vendor/LENIS-LICENSE.txt',
  'assets/brand/l0olf-principal.svg', 'assets/brand/l0olf-avatar.svg', 'assets/favicon.svg',
  ...fs.readdirSync(path.join(source, 'assets/fonts')).map(file => `assets/fonts/${file}`)];
if (hasSocialCover) files.push('assets/social-cover.png');
if (origin) files.push('sitemap.xml');
for (const file of files) {
  const dest = path.join(output, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(source, file), dest);
}
const missing = [];
for (const file of files.filter(file => /\.(html|css)$/.test(file))) {
  const content = fs.readFileSync(path.join(output, file), 'utf8');
  for (const match of content.matchAll(/(?:src=["']|href=["']|url\(["']?)(\/[^"')\s>]+)/g)) {
    let target = decodeURIComponent(match[1].split(/[?#]/)[0]);
    if (target.endsWith('/')) target += 'index.html';
    if (!fs.existsSync(path.join(output, target))) missing.push(`${file}: ${target}`);
  }
}
if (missing.length) throw new Error(`Missing public files:\n${missing.join('\n')}`);
const bytes = files.reduce((sum, file) => sum + fs.statSync(path.join(output, file)).size, 0);
console.log(JSON.stringify({ output, files: files.length, bytes, origin: origin || 'pending Netlify URL', localReferences: 'OK' }));
