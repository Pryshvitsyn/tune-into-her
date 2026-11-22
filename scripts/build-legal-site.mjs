import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const routes = { 'PRIVACY.md': '/privacy/', 'TERMS.md': '/terms/', 'SUPPORT.md': '/support/' };
export function renderLegal(markdown) {
  const inline = text => escape(text).replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    const target = routes[url] ?? (/^https:\/\//.test(url) ? url : null);
    return target ? `<a href="${target}">${label}</a>` : label;
  }).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return markdown.split(/\n\s*\n/).map(block => {
    const heading = /^(#{1,3}) (.*)$/.exec(block);
    if (heading) return `<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`;
    return `<p>${inline(block.replaceAll('\n', ' '))}</p>`;
  }).join('\n');
}

export async function buildLegalSite({ output, publish = false }) {
  const brand = JSON.parse(await readFile('src/config/brand.json', 'utf8'));
  const readiness = JSON.parse(await readFile('release/readiness.json', 'utf8'));
  const pages = await Promise.all(Object.keys(routes).map(async file => ({ file, markdown: await readFile(file, 'utf8') })));
  const missing = [];
  if (!brand.publisherName?.trim()) missing.push('publisherName');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brand.supportEmail ?? '')) missing.push('monitored support/privacy contact');
  for (const field of ['privacyUrl', 'termsUrl']) {
    try { const url = new URL(brand[field]); if (url.protocol !== 'https:' || url.username || url.password || /(^|\.)(example\.com|invalid)$/.test(url.hostname)) missing.push(field); } catch { missing.push(field); }
  }
  if (readiness.legalCopyApproved !== true) missing.push('legalCopyApproved evidence');
  if (pages.some(p => /REPLACE_WITH_[A-Z_]+/.test(p.markdown))) missing.push('unresolved canonical legal placeholders');
  if (publish && missing.length) throw new Error('Public legal export blocked: ' + missing.join(', '));
  await mkdir(output, { recursive: true });
  for (const { file, markdown } of pages) {
    const route = routes[file]; const dir = path.join(output, route); await mkdir(dir, { recursive: true });
    const body = renderLegal(markdown);
    const banner = publish ? '' : '<aside>Draft for owner and legal review. Not published or approved.</aside>';
    await writeFile(path.join(dir, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(brand.displayName)} — ${file.replace('.md', '')}</title><style>body{margin:auto;max-width:48rem;padding:2rem;font:1.05rem/1.7 system-ui;color:#243b4b;background:#edf1f4}a{color:#234f6c}nav{display:flex;gap:1.5rem;flex-wrap:wrap}aside{padding:1rem;border:1px solid #6c7d8b;margin:1rem 0}h1,h2{line-height:1.25}footer{margin-top:3rem}</style><nav><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/support/">Support</a></nav>${banner}<main>${body}</main><footer>${escape(brand.displayName)}</footer></html>`);
  }
  await writeFile(path.join(output, 'index.html'), '<!doctype html><meta charset="utf-8"><title>Tune Into Her</title><a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a> · <a href="/support/">Support</a>');
  await writeFile(path.join(output, 'robots.txt'), publish ? 'User-agent: *\nAllow: /\n' : 'User-agent: *\nDisallow: /\n');
  await writeFile(path.join(output, '_headers'), "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'\n" + (publish ? '' : '  X-Robots-Tag: noindex, nofollow\n'));
  const result = { status: publish ? 'APPROVED_EXPORT_ONLY_NOT_DEPLOYED' : 'DRAFT_ONLY_NOT_PUBLIC', routes: Object.values(routes), missing, deploymentPerformed: false };
  await writeFile(path.join(output, 'export-status.json'), JSON.stringify(result, null, 2) + '\n');
  return result;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = process.argv.find(arg => arg.startsWith('--out='))?.slice(6) ?? 'build/legal-site';
  buildLegalSite({ output, publish: process.argv.includes('--public-export') }).then(result => console.log(JSON.stringify(result, null, 2))).catch(error => { console.error(error.message); process.exitCode = 1; });
}
