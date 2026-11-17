/* Bygg webbsidan och PDF:en för Korskörning ur Korskorning_utespelare_malvakter.md.
 *
 *   npm i playwright            # engångsinstallation
 *   node tools/bygg_korskorning.cjs
 *
 * Texten ändras i markdownfilen i repots rot. Skriptet gör om den till korskorning.html
 * (med en fast översta rad: Hem, Startsidan, Ladda ner PDF) och Korskorning_utespelare_malvakter.pdf.
 * Markdown-stödet är bara det filen använder: rubriker, stycken, punktlistor, tabeller, fet och kursiv.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MD = path.join(ROOT, 'Korskorning_utespelare_malvakter.md');
const HTML = path.join(ROOT, 'korskorning.html');
const PDF = 'Korskorning_utespelare_malvakter.pdf';
const CHROMIUM = '/opt/pw-browsers/chromium';

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = s => esc(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\*([^*]+)\*/g, '<i>$1</i>');

function md2html(md) {
  const lines = md.replace(/\r/g, '').split('\n');
  let out = '', i = 0, title = '';
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    let m;
    if ((m = /^(#{1,3})\s+(.*)$/.exec(l))) {
      const n = m[1].length; if (n === 1 && !title) title = m[2];
      out += `<h${n}>${inline(m[2])}</h${n}>\n`; i++; continue;
    }
    if (/^\s*[-*]\s+/.test(l)) {
      out += '<ul>\n';
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { out += `<li>${inline(lines[i].replace(/^\s*[-*]\s+/, ''))}</li>\n`; i++; }
      out += '</ul>\n'; continue;
    }
    if (l.trim().startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(lines[i].trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())); i++; }
      const head = rows[0], body = rows.slice(2);   // rad 2 är avgränsaren
      out += '<div class="tw"><table><thead><tr>' + head.map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>' +
        body.map(r => '<tr>' + r.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>\n';
      continue;
    }
    let p = l.trim(); i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|\s*[-*]\s|\|)/.test(lines[i])) { p += ' ' + lines[i].trim(); i++; }
    out += `<p>${inline(p)}</p>\n`;
  }
  return { body: out, title };
}

const { body, title } = md2html(fs.readFileSync(MD, 'utf8'));
const page = `<!DOCTYPE html>
<html lang="sv"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} – Handbollssviten</title>
<style>
  @page { size: A4 landscape; margin: 14mm 14mm 16mm; }
  :root { --accent: #be185d; --ink: #1b1b1f; --grey: #5a5a63; --line: #ecd3e1; --tint: #fdf2f8; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; color: var(--ink); font: 400 10.5pt/1.5 "Inter", -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  h1 { font-size: 26pt; line-height: 1.1; margin: 0 0 8px; padding-bottom: 8px; border-bottom: 3px solid #f472b6; }
  h2 { font-size: 15pt; color: var(--accent); margin: 22px 0 6px; break-after: avoid; }
  h3 { font-size: 12pt; margin: 14px 0 4px; break-after: avoid; }
  p { margin: 0 0 8px; max-width: 110ch; } ul { margin: 0 0 10px; padding-left: 20px; } li { margin: 3px 0; }
  b { font-weight: 700; }
  .tw { overflow-x: auto; margin: 6px 0 14px; }
  table { border-collapse: collapse; width: 100%; font-size: 9.2pt; }
  th { background: #fce7f3; color: var(--accent); text-align: left; padding: 6px 8px; border-bottom: 2px solid var(--accent); vertical-align: bottom; }
  td { padding: 5px 8px; border-bottom: 1px solid var(--line); vertical-align: top; }
  tr { break-inside: avoid; }
  tbody tr:nth-child(even) td { background: var(--tint); }
  .mbar { position: fixed; top: 0; left: 0; right: 0; z-index: 100; display: flex; gap: 8px; align-items: center; background: #1c1c1e; padding: 10px 14px; font: 600 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  .mbar a { color: #fff; text-decoration: none; border: 1px solid #4a4b52; padding: 8px 12px; white-space: nowrap; }
  .mbar a:hover { border-color: #f472b6; color: #f472b6; }
  .mbar .sp { flex: 1; }
  .mbar a.dl { background: #f472b6; color: #000; border-color: #f472b6; }
  .mbar a.dl:hover { background: #fff; border-color: #fff; color: #000; }
  @media screen { body { max-width: 1060px; margin: 0 auto; padding: 66px 16px 48px; } table { min-width: 720px; } }
  @media screen and (max-width: 640px) { .mbar .long { display: none; } .mbar { padding: 8px 10px; gap: 6px; } .mbar a { padding: 8px 10px; } }
  @media print { .mbar { display: none; } }
</style></head><body>
<div class="mbar"><a href="index.html">⌂ Hem</a><a href="utespelare.html">← Grunder och skott</a><span class="sp"></span><a class="dl" href="${PDF}" download><span class="long">⬇ Ladda ner </span>PDF</a></div>
${body}</body></html>
`;
fs.writeFileSync(HTML, page);

(async () => {
  const browser = await chromium.launch(fs.existsSync(CHROMIUM) ? { executablePath: CHROMIUM } : {});
  const p = await browser.newPage();
  await p.goto('file://' + HTML);
  await p.pdf({ path: path.join(ROOT, PDF), preferCSSPageSize: true, printBackground: true, displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="width:100%;font:8pt Arial,sans-serif;color:#777;padding:0 14mm;display:flex;justify-content:space-between"><span>Korskörning – utespelare och målvakter · LUGI Handboll</span><span class="pageNumber"></span></div>' });
  await browser.close();
  console.log('Skrev', HTML, fs.statSync(HTML).size, 'byte och', PDF, fs.statSync(path.join(ROOT, PDF)).size, 'byte');
})();
