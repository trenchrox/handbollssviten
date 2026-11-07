/* Bygg webbsidorna för manualerna i manualer/.
 *
 *   npm i playwright            # engångsinstallation
 *   node manualer/bygg.cjs
 *
 * Varje manual blir en HTML-sida med en fast översta rad (Hem, Manualer, Ladda ner PDF),
 * som döljs vid utskrift. Källorna bor i apparnas repon och kopieras hit:
 *
 *   Tracker      ur appens hjälpvy (#vHelp). Texten ändras i Tracker-appen.
 *   Teambuilder  docs/handbok.html i teambuilder-handboll
 *   Playbook     docs/guide.html i playbook-handboll
 *   Matchanalys  docs/manual.html i match_summary
 *
 * Sökvägar kan anges som miljövariabler: TRACKER_HTML, TEAMBUILDER_HANDBOK, PLAYBOOK_GUIDE,
 * MATCHANALYS_MANUAL. Skriptet bygger också Trackers PDF. De andra PDF:erna byggs i sina egna
 * repon (se CLAUDE.md) och kopieras in som manualer/<namn>.pdf.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const HOME = '/home/user';
const SRC = {
  tracker: process.env.TRACKER_HTML || `${HOME}/handball_g_trk/handball_g_trk_ipad.html`,
  teambuilder: process.env.TEAMBUILDER_HANDBOK || `${HOME}/teambuilder-handboll/docs/handbok.html`,
  playbook: process.env.PLAYBOOK_GUIDE || `${HOME}/playbook-handboll/docs/guide.html`,
  matchanalys: process.env.MATCHANALYS_MANUAL || `${HOME}/match_summary/docs/manual.html`,
};
const PDF = { tracker: 'tracker-manual.pdf', teambuilder: 'teambuilder-handbok.pdf', playbook: 'playbook-guide.pdf', matchanalys: 'matchanalys-manual.pdf' };
const CHROMIUM = '/opt/pw-browsers/chromium';

const CSS = `
.mbar{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;gap:8px;align-items:center;background:#1c1c1e;padding:10px 14px;font:600 14px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.mbar a{color:#fff;text-decoration:none;border:1px solid #4a4b52;padding:8px 12px;white-space:nowrap}
.mbar a:hover{border-color:#ffd60a;color:#ffd60a}
.mbar .sp{flex:1}
.mbar a.dl{background:#ffd60a;color:#000;border-color:#ffd60a}
.mbar a.dl:hover{background:#fff;border-color:#fff;color:#000}
@media screen{
  body{box-sizing:border-box;max-width:900px;margin:0 auto!important;padding:66px 16px 48px}
  img,svg,table{max-width:100%}
}
@media screen and (max-width:640px){
  table{display:block;max-width:100%;overflow-x:auto}
  .cols,.two{grid-template-columns:1fr!important}
}
@media (max-width:480px){.mbar .long{display:none}.mbar{padding:8px 10px;gap:6px}.mbar a{padding:8px 10px}}
@media print{.mbar{display:none}}`;

function bar(pdf) {
  return `<div class="mbar"><a href="../index.html">⌂ Hem</a><a href="../manualer.html">← Manualer</a><span class="sp"></span><a class="dl" href="${pdf}" download><span class="long">⬇ Ladda ner </span>PDF</a></div>`;
}
function inject(html, pdf) {
  if (!/name="viewport"/.test(html)) html = html.replace('<head>', '<head>\n<meta name="viewport" content="width=device-width, initial-scale=1">');
  html = html.replace('</head>', `<style>${CSS}</style>\n</head>`);
  return html.replace(/<body([^>]*)>/, `<body$1>\n${bar(pdf)}`);
}

async function trackerHtml() {
  const browser = await chromium.launch(fs.existsSync(CHROMIUM) ? { executablePath: CHROMIUM } : {});
  const page = await browser.newPage({ viewport: { width: 1180, height: 820 } });
  await page.goto('file://' + path.resolve(SRC.tracker));
  await page.fill('#loginName', 'Manual');            // appen kräver ett lag för att visa menyn
  await page.click('#loginGo');
  await page.waitForTimeout(400);
  const { version, sections } = await page.evaluate(() => ({
    version: document.getElementById('appVersion').textContent,
    sections: [...document.querySelectorAll('#vHelp details.help-card')].map(d => ({
      h: d.querySelector('.help-h').textContent.trim(), body: d.querySelector('.help-body').innerHTML })),
  }));
  await browser.close();
  const esc = s => s.replace(/&/g, '&amp;');
  return `<!DOCTYPE html><html lang="sv"><head><meta charset="utf-8"><title>Handboll Tracker – manual</title>
<style>
  @page { size: A4; margin: 16mm 16mm 18mm; }
  :root { --accent: #b8860b; --ink: #1b1b1f; --grey: #5a5a63; --line: #e8dfc4; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; color: var(--ink); font: 400 10.5pt/1.5 "Inter", -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  header { border-bottom: 2px solid var(--accent); padding-bottom: 10px; margin-bottom: 14px; }
  .kicker { color: var(--accent); font-weight: 700; font-size: 9.5pt; letter-spacing: .1em; text-transform: uppercase; }
  h1 { margin: 2px 0; font-size: 26pt; line-height: 1.1; }
  header p { margin: 0; color: var(--grey); }
  section { break-inside: avoid-page; margin: 0 0 6px; }
  h2 { font-size: 14pt; color: var(--accent); margin: 18px 0 5px; break-after: avoid; }
  p { margin: 0 0 8px; } ol, ul { margin: 0 0 8px; padding-left: 20px; } li { margin: 3px 0; }
  b { font-weight: 700; }
  footer { margin-top: 22px; padding-top: 8px; border-top: 1px solid var(--line); color: var(--grey); font-size: 9pt; }
</style></head><body>
<header><div class="kicker">Handbollssviten</div><h1>Handboll Tracker</h1>
<p>Manual · appversion ${version} · samma text som hjälpvyn ”Så funkar appen” i appen.</p></header>
${sections.map(s => `<section><h2>${esc(s.h)}</h2>${s.body}</section>`).join('\n')}
<footer>Tips: lägg till appen på hemskärmen för helskärmsläge utan webbläsarens kontroller.</footer>
</body></html>`;
}

(async () => {
  const trk = await trackerHtml();
  // Trackers PDF byggs ur samma HTML (raden döljs vid utskrift).
  const withBar = inject(trk, PDF.tracker);
  const tmp = path.join(__dirname, '.tracker.tmp.html');
  fs.writeFileSync(tmp, withBar);
  const b2 = await chromium.launch(fs.existsSync(CHROMIUM) ? { executablePath: CHROMIUM } : {});
  const p2 = await b2.newPage();
  await p2.goto('file://' + tmp);
  await p2.pdf({ path: path.join(__dirname, PDF.tracker), preferCSSPageSize: true, printBackground: true });
  await b2.close();
  fs.unlinkSync(tmp);
  fs.writeFileSync(path.join(__dirname, 'tracker.html'), withBar);

  for (const k of ['teambuilder', 'playbook', 'matchanalys']) {
    fs.writeFileSync(path.join(__dirname, k + '.html'), inject(fs.readFileSync(SRC[k], 'utf8'), PDF[k]));
  }
  for (const k of Object.keys(PDF)) console.log(k + '.html', fs.statSync(path.join(__dirname, k + '.html')).size, 'byte');
})();
