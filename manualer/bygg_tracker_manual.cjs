/* Bygg Trackers manual som PDF ur appens egen hjälpvy (#vHelp).
 *
 *   npm i playwright            # engångsinstallation
 *   node manualer/bygg_tracker_manual.cjs [sökväg till handball_g_trk_ipad.html]
 *
 * Hjälptexten bor i Tracker-appen (trenchrox/handball_g_trk). Det här skriptet
 * öppnar appen, hämtar hjälpvyns text och skriver ut den som en A4-PDF, så att
 * manualen på sviterepots startsida alltid följer appens hjälp. Kör om skriptet
 * när Trackers hjälp ändras.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const APP = path.resolve(process.argv[2] || '/home/user/handball_g_trk/handball_g_trk_ipad.html');
const OUT = path.join(__dirname, 'tracker-manual.pdf');
const CHROMIUM = '/opt/pw-browsers/chromium';

(async () => {
  const browser = await chromium.launch(fs.existsSync(CHROMIUM) ? { executablePath: CHROMIUM } : {});
  const page = await browser.newPage({ viewport: { width: 1180, height: 820 } });
  await page.goto('file://' + APP);
  await page.fill('#loginName', 'Manual');           // appen kräver ett lag för att visa menyn
  await page.click('#loginGo');
  await page.waitForTimeout(400);
  const { version, sections } = await page.evaluate(() => {
    const v = document.getElementById('appVersion').textContent;
    const secs = [...document.querySelectorAll('#vHelp details.help-card')].map(d => ({
      h: d.querySelector('.help-h').textContent.trim(),
      body: d.querySelector('.help-body').innerHTML,
    }));
    return { version: v, sections: secs };
  });
  await browser.close();

  const html = `<!DOCTYPE html><html lang="sv"><head><meta charset="utf-8"><title>Handboll Tracker – manual</title>
<style>
  @page { size: A4; margin: 16mm 16mm 18mm; }
  :root { --accent: #b8860b; --ink: #1b1b1f; --grey: #5a5a63; --line: #e8dfc4; --tint: #faf6e8; }
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
${sections.map(s => `<section><h2>${s.h.replace(/&/g, '&amp;')}</h2>${s.body}</section>`).join('\n')}
<footer>Tips: lägg till appen på hemskärmen för helskärmsläge utan webbläsarens kontroller.</footer>
</body></html>`;
  const tmp = path.join(__dirname, '.tracker-manual.tmp.html');
  fs.writeFileSync(tmp, html);
  const b2 = await chromium.launch(fs.existsSync(CHROMIUM) ? { executablePath: CHROMIUM } : {});
  const p2 = await b2.newPage();
  await p2.goto('file://' + tmp);
  await p2.pdf({ path: OUT, preferCSSPageSize: true, printBackground: true });
  await b2.close();
  fs.unlinkSync(tmp);
  console.log('Skrev', OUT, fs.statSync(OUT).size, 'byte,', sections.length, 'avsnitt, version', version);
})();
