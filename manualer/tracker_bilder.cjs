/* Exempeldata och skärmbilder för Trackers manual.
 *
 * Bygger en påhittad klubb ("Exempel IF P14", påhittade målvakter och motståndare),
 * lägger den i appens IndexedDB och tar skärmbilder av de vyer manualen visar.
 * Inga riktiga uppgifter används. Returnerar bilderna som data-URI:er.
 */
const path = require('path');

function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const POSITIONS = ['Vänster 9m', 'Höger 9m', 'Mitt 9m', 'Vänster kant', 'Höger kant', 'Linje', 'Kontring', 'Straff'];
const TYPES = ['Långskott', 'Hoppskott', 'Underarm', 'Lobb', 'Studs', 'Närkast'];
const ZONES = ['Övre V', 'Övre M', 'Övre H', 'Mitt V', 'Mitt M', 'Mitt H', 'Nedre V', 'Nedre M', 'Nedre H'];

function sampleRoot() {
  const r = rng(20261117), pick = a => a[Math.floor(r() * a.length)];
  let n = 0; const id = p => p + (++n);
  const color = ['#ffb627', '#2dd4a7', '#f0506e', '#4a9eff', '#b06bf0', '#ff8c42'];
  const goalies = [{ id: 'gk1', name: 'Alex Berg', photo: null, number: 1 }, { id: 'gk2', name: 'Kim Lund', photo: null, number: 12 }];
  const mkPlayers = list => list.map(([number, name, pos, hand, note, zones]) => ({
    id: id('pl'), number: String(number), name, pos, hand, note,
    placements: zones.map(z => ({ zone: z, pen: false, t: 1 })) }));
  const teams = [
    { id: 't1', name: 'Exempel HK', logo: null, color: color[0], own: false, players: mkPlayers([
      [7, 'Sam Ek', 'Vänster nia', 'R', 'Stark långskytt, skjuter gärna lågt mot bortre hörnet.', [6, 6, 7, 3, 6, 7, 6]],
      [9, 'Robin Strand', 'Linje', 'R', 'Snabb vändning, skjuter oftast högt.', [0, 1, 2, 1, 0]],
      [4, 'Jo Nord', 'Höger kant', 'L', 'Fintar gärna till vänster. Lobbar i kontring.', [2, 2, 5, 2, 1, 8]]]) },
    { id: 't2', name: 'Demo IK', logo: null, color: color[1], own: false, players: [] },
    { id: 't3', name: 'Test BK', logo: null, color: color[3], own: false, players: [] },
    { id: 't4', name: 'Prov SK', logo: null, color: color[4], own: false, players: [] },
  ];
  const mkShots = (count, gk, half) => {
    const shots = []; let clock = 40;
    for (let i = 0; i < count; i++) {
      clock += Math.floor(60 + r() * 90);
      const o = r(); const out = o > 0.9, saved = !out && o < 0.38;
      const s = { id: id('s'), t: 1700000000000 + i * 1000, zone: Math.floor(r() * 9), pos: pick(POSITIONS), type: pick(TYPES), saved, shotGk: gk, period: clock > 1800 ? 2 : 1, clock: Math.min(clock, 3500) };
      if (out) s.out = true;
      shots.push(s);
    }
    return shots;
  };
  const mk = (oppId, date, home, so, sp, shots, gk, gkName, extra) => Object.assign({ id: id('m'), oppId, date, gkId: gk, gk: gkName, shots, halfLen: 30, fullLen: 60, clockSec: 3600, clockRunning: false, gkInClock: 0, home, scoreOwn: so, scoreOpp: sp, kind: 'competitive', locked: true }, extra || {});
  const live = mk('t3', '2026-11-14', true, null, null, mkShots(23, 'gk1', 1), 'gk1', 'Alex Berg', { clockSec: 1470, locked: false, scoreOwn: null, scoreOpp: null, period: 1 });
  const seasons = [{ id: 'c1', name: 'Seriespel 2026/27', matches: [
    live,
    mk('t2', '2026-11-07', false, 24, 21, mkShots(38, 'gk2', 2), 'gk2', 'Kim Lund'),
    mk('t1', '2026-10-31', true, 27, 26, mkShots(41, 'gk1', 2), 'gk1', 'Alex Berg'),
    mk('t4', '2026-10-24', false, 22, 22, mkShots(35, 'gk1', 2), 'gk1', 'Alex Berg', { kind: 'training' }),
  ] }];
  const cups = [{ id: 'c2', name: 'Exempelcupen 2026', matches: [
    mk('t4', '2026-10-17', true, 19, 17, mkShots(30, 'gk2', 1), 'gk2', 'Kim Lund'),
    mk('t2', '2026-10-17', false, 15, 18, mkShots(33, 'gk2', 1), 'gk2', 'Kim Lund'),
  ] }];
  return { clubs: [{ id: 'club1', name: 'Exempel IF', logo: null, color: '#ffd60a', ageGroup: 'P14', profileId: null, goalies, teams, seasons, cups }], activeClubId: 'club1', theme: 'dark' };
}

async function skarmbilder(browser, appPath) {
  const root = sampleRoot();
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1.25 });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + path.resolve(appPath));
  await page.waitForTimeout(400);
  // Lägg exempeldatan i appens egen databas och ladda om.
  await page.evaluate(r => new Promise((res, rej) => {
    const q = indexedDB.open('handball_gk', 1);
    q.onupgradeneeded = () => { if (!q.result.objectStoreNames.contains('kv')) q.result.createObjectStore('kv'); };
    q.onsuccess = () => { const tx = q.result.transaction('kv', 'readwrite'); tx.objectStore('kv').put(r, 'root'); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); };
    q.onerror = () => rej(q.error);
  }), root);
  await page.reload(); await page.waitForTimeout(700);
  const out = {};
  const shot = async (name, opts) => { const buf = await page.screenshot(Object.assign({ type: 'jpeg', quality: 78 }, opts || {})); out[name] = 'data:image/jpeg;base64,' + buf.toString('base64'); };
  const go = async fn => { await page.evaluate(fn); await page.waitForTimeout(450); };
  const clickNav = id => go(i => document.querySelector('[data-nav="' + i + '"]').click().valueOf, id).catch(() => {});
  // Målvakter
  await page.evaluate(() => document.querySelector('[data-nav="vStats"]').click()); await page.waitForTimeout(500);
  await shot('malvakter');
  // Målvaktens sida
  await page.setViewportSize({ width: 1180, height: 1180 });
  await page.evaluate(() => openGoalie('gk1')); await page.waitForTimeout(700);
  await shot('malvakt');
  await page.setViewportSize({ width: 1180, height: 820 }); await page.waitForTimeout(200);
  // Säsonger och en säsong
  await page.evaluate(() => document.querySelector('[data-nav="vSeasons"]').click()); await page.waitForTimeout(400);
  await shot('sasonger');
  await page.evaluate(() => openComp('season', 'c1')); await page.waitForTimeout(500);
  await shot('sasong');
  // Ny match-dialogen
  await page.evaluate(() => document.getElementById('addMatch').click()); await page.waitForTimeout(500);
  await shot('nymatch');
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.offsetParent && /Avbryt/.test(x.textContent)); if (b) b.click(); }); await page.waitForTimeout(300);
  // Matchvyn med ett påbörjat skott (zon + läge valda) och rutor att märka
  await page.evaluate(() => openMatch(curComp().matches[0].id)); await page.waitForTimeout(800);
  await page.evaluate(() => { const z = document.querySelectorAll('#goalGrid > *'); if (z[1]) z[1].click(); }); await page.waitForTimeout(250);
  await page.evaluate(() => { const f = document.querySelector('#shotFan .fanw[data-pos="Mitt 9m"]'); if (f) f.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await page.waitForTimeout(300);
  await shot('match');
  const boxes = await page.evaluate(() => {
    const b = id => { const e = document.getElementById(id); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
    return { goal: b('goalGrid'), fan: b('shotFan'), commit: b('btnSave'), commitAll: (() => { const s = document.getElementById('btnSave').getBoundingClientRect(), o = document.getElementById('btnOut').getBoundingClientRect(); return { x: s.x, y: s.y, w: o.right - s.x, h: s.height }; })(),
      clock: b('clockTime'), period: b('periodSeg'), list: b('showShotList'), gk: b('bGk'), assist: b('bAssist'), undo: b('undoBtn'), lock: b('lockBtn'), totals: (() => { const e = document.querySelector('.totals-bar'); const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })() };
  });
  out._boxes = boxes; out._vp = { w: 1180, h: 820 };
  // Skottlista
  await page.evaluate(() => document.getElementById('showShotList').click()); await page.waitForTimeout(600);
  await shot('skottlista');
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.offsetParent && /Stäng|OK|Klar/.test(x.textContent)); if (b) b.click(); }); await page.waitForTimeout(300);
  // Låst match
  await page.evaluate(() => openMatch(curComp().matches[1].id)); await page.waitForTimeout(700);
  await shot('lastmatch');
  // Lagbank + scouting
  await page.evaluate(() => document.querySelector('[data-nav="vBank"]').click()); await page.waitForTimeout(500);
  await shot('lagbank');
  await page.evaluate(() => openScout('t1')); await page.waitForTimeout(700);
  await shot('scout');
  await page.evaluate(() => openScoutPlayer(db.teams.find(t => t.id === 't1').players[0].id)); await page.waitForTimeout(700);
  await shot('scoutspelare');
  // Meny
  await page.evaluate(() => document.querySelector('[data-nav="vStats"]').click()); await page.waitForTimeout(400);
  await shot('meny', { clip: { x: 0, y: 0, width: 250, height: 820 } });
  out._version = await page.evaluate(() => document.getElementById('appVersion').textContent);
  out._sections = await page.evaluate(() => [...document.querySelectorAll('#vHelp details.help-card')].map(d => ({ h: d.querySelector('.help-h').textContent.trim(), body: d.querySelector('.help-body').innerHTML })));
  await ctx.close();
  out._errors = errs;
  return out;
}
module.exports = { sampleRoot, skarmbilder };
