/* Bygg Trana_hemma.pdf ur kapitlet "Träna hemma" i kompendiet.
 *
 *   npm i playwright            # engångsinstallation
 *   node tools/bygg_trana_hemma.cjs
 *
 * Kompendiets utskriftslayout har ett läge (body.only-hemma) som bara skriver ut det
 * kapitlet. Skriptet öppnar sidan, slår på det läget och skriver ut till PDF. Kör om
 * skriptet när kapitlet ändras. Vill ni hellre använda en egen PDF, lägg den som
 * Trana_hemma.pdf i repots rot.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'malvaktskompendium_html_v1.html');
const OUT = path.join(ROOT, 'Trana_hemma.pdf');
const CHROMIUM = '/opt/pw-browsers/chromium';

(async () => {
  const browser = await chromium.launch(fs.existsSync(CHROMIUM) ? { executablePath: CHROMIUM } : {});
  const page = await browser.newPage();
  await page.goto('file://' + SRC);
  await page.evaluate(() => document.body.classList.add('only-hemma'));
  await page.pdf({ path: OUT, preferCSSPageSize: true, printBackground: true });
  await browser.close();
  console.log('Skrev', OUT, fs.statSync(OUT).size, 'byte');
})();
