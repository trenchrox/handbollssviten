/* Bygg webbsidan och PDF:en för Korskörning ur Korskorning_utespelare_malvakter.md.
 *
 *   npm i playwright            # engångsinstallation
 *   node tools/bygg_korskorning.cjs
 *
 * Texten ändras i markdownfilen i repots rot. Skriptet gör om den till korskorning.html i samma
 * utseende som målvaktskompendiet och Grunder och skott (vänsterspalt, kapitelark, kort) och bygger
 * Korskorning_utespelare_malvakter.pdf ur sidan. CSS, LUGI-märke, omslagsbild och skript hämtas ur
 * malvaktskompendium_html_v1.html respektive utespelare.html, så de följer med när de ändras.
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

// ---- mallar: CSS, märke och skript ur kompendiet, omslagsbild ur Grunder och skott
const mv = fs.readFileSync(path.join(ROOT, 'malvaktskompendium_html_v1.html'), 'utf8');
const ut = fs.readFileSync(path.join(ROOT, 'utespelare.html'), 'utf8');
const CSS = mv.slice(mv.indexOf('<style>'), mv.indexOf('</style>')) + `
.sheet.cover h1{font-size:44px}
.lead a,.card a{color:var(--red)}
.tw table{min-width:640px}
.tw td:first-child{font-weight:700}
.tw td:last-child{white-space:nowrap}
`;
const CREST = /<div class="brand"><img src="(data:[^"]+)"/.exec(mv)[1];
const COVER = /<section class="sheet cover" id="omslag">\s*(<img [^>]+>)/.exec(ut)[1];
const SCRIPT = /<script>\(function \(\) \{\n  var KEY.*?\}\)\(\);\n<\/script>/s.exec(mv)[0].replace(/var KEY = "[^"]+"/, 'var KEY = "lugi-korskorning-v1"');

// ---- markdown till avsnitt
function parse(md) {
  const lines = md.replace(/\r/g, '').split('\n');
  const secs = []; let title = '', cur = null, i = 0;
  const push = h => (cur ? cur.html += h : null);
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    let m;
    if ((m = /^(#{1,3})\s+(.*)$/.exec(l))) {
      if (m[1].length === 1) title = m[2];
      else if (m[1].length === 2) { cur = { h: m[2], html: '', lead: '' }; secs.push(cur); }
      else push(`<h3>${inline(m[2])}</h3>\n`);
      i++; continue;
    }
    if (/^\s*[-*]\s+/.test(l)) {
      let ul = '<ul class="sq">';
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { ul += `<li>${inline(lines[i].replace(/^\s*[-*]\s+/, ''))}</li>`; i++; }
      push(`<div class="card full">${ul}</ul></div>\n`); continue;
    }
    if (l.trim().startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(lines[i].trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())); i++; }
      const head = rows[0], body = rows.slice(2);
      push('<div class="tw"><table><thead><tr>' + head.map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>' +
        body.map(r => '<tr>' + r.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>\n');
      continue;
    }
    let p = l.trim(); i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|\s*[-*]\s|\|)/.test(lines[i])) { p += ' ' + lines[i].trim(); i++; }
    if (cur) cur.html += `<p>${inline(p)}</p>\n`; else secs.intro = (secs.intro || '') + `<p class="lead">${inline(p)}</p>\n`;
  }
  return { title, secs, intro: secs.intro || '' };
}

const { title, secs, intro } = parse(fs.readFileSync(MD, 'utf8'));
const slug = (s, n) => 'k' + (n + 1);
const nav = '<nav aria-label="Avsnitt"><ol>' + secs.map((s, n) =>
  `<li data-li="${slug(s, n)}"><div class="row"><a href="#${slug(s, n)}" data-ch="${slug(s, n)}"><span>${n + 1}</span>${esc(s.h)}</a></div></li>`).join('') + '</ol></nav>';
const sheets = secs.map((s, n) =>
  `<section class="sheet" id="${slug(s, n)}">\n<header class="ch-head"><span class="ch-num">${n + 1}</span><h2>${inline(s.h)}</h2></header>\n${s.html}</section>`).join('\n');

const page = `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)} – Handbollssviten</title>
<meta name="description" content="LUGI Handbollssviten: övningar där utespelare och målvakter tränar samtidigt.">
${CSS}</style>
</head>
<body>
<a class="skip" href="#innehall">Hoppa till innehållet</a>
<aside class="rail">
<div class="brand"><img src="${CREST}" width="240" height="224" alt="LUGI" decoding="async"><div><strong>Korskörning</strong><span>Handbollssviten</span></div></div>
${nav}
<div class="actions">
<a class="home" id="navHome" href="index.html">⌂ Hem</a>
<a class="pdf" id="dl-kors" href="${PDF}" download>Ladda ner PDF</a>
<a class="pdf" id="nav-ute" href="utespelare.html">Grunder och skott</a>
<a class="pdf" id="nav-mv" href="malvaktskompendium_html_v1.html">Målvaktskompendium</a>
</div>
<p class="ver">Utespelare och målvakter</p>
</aside>
<main id="innehall">
<section class="sheet cover" id="omslag">
${COVER}
<h1>Korskörning</h1>
<p class="cover-sub">Utespelare och målvakter tränar samtidigt</p>
<div class="cover-logos"><img src="${CREST}" width="240" height="224" alt="LUGI" decoding="async"></div>
</section>
<section class="sheet" id="intro">
<header class="ch-head"><h2>${esc(title.replace(/^Korskörning – /, 'Korskörning: '))}</h2></header>
${intro}</section>
${sheets}
</main>
${SCRIPT}</body>
</html>
`;
fs.writeFileSync(HTML, page);

(async () => {
  const browser = await chromium.launch(fs.existsSync(CHROMIUM) ? { executablePath: CHROMIUM } : {});
  const p = await browser.newPage();
  await p.goto('file://' + HTML);
  await p.pdf({ path: path.join(ROOT, PDF), preferCSSPageSize: true, printBackground: true, displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="width:100%;font:8pt Arial,sans-serif;color:#777;padding:0 14mm;display:flex;justify-content:space-between"><span>Korskörning – utespelare och målvakter · LUGI Handbollssviten</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>' });
  await browser.close();
  console.log('Skrev', HTML, fs.statSync(HTML).size, 'byte och', PDF, fs.statSync(path.join(ROOT, PDF)).size, 'byte');
})();
