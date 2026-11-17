/* Sidmall för Trackers manual: skärmbilder, numrerade markeringar och appens hjälptext.
 *
 * Texten kommer ur appens hjälpvy (#vHelp) och byggs ihop efter rubrik. Rubriker som
 * inte finns i KAPITEL läggs sist under "Mer i appen", så ny hjälptext aldrig tappas.
 */
const KAPITEL = [
  { id: 'lag', kicker: 'Kom igång', titel: 'Lag och målvakter', rubriker: ['Dina lag & ålderskullar', 'Målvakter'], bilder: ['malvakt', 'meny'], layout: 'par' },
  { id: 'sasong', kicker: 'Planera', titel: 'Säsonger, cuper och matcher', rubriker: ['Säsonger och cuper'], bilder: ['sasong', 'nymatch'] },
  { id: 'match', kicker: 'Under matchen', titel: 'Registrera skott', rubriker: ['Matchklockan', 'Registrera skott under match', 'Målvaktsbyte & speltid'], annoterad: true },
  { id: 'efter', kicker: 'Efter matchen', titel: 'Skottlista, resultat och lås', rubriker: ['Skottlista & matchöversikt', 'Lås match & resultat'], bilder: ['skottlista', 'lastmatch'] },
  { id: 'scout', kicker: 'Motståndare', titel: 'Lagbank och scouting', rubriker: ['Lagbank & scoutingrapport'], bilder: ['lagbank', 'scout', 'scoutspelare'] },
  { id: 'backup', kicker: 'Trygghet', titel: 'Backup, lagring och utseende', rubriker: ['Säkerhetskopiering & lagring', 'Mörkt / ljust läge'], bilder: [] },
];
const TEXTER = {
  malvakt: 'Målvaktens sida: nyckeltal och heatmap över målet.',
  meny: 'Menyn till vänster.',
  sasong: 'En säsong med dess matcher.',
  nymatch: 'Dialogen Ny match.',
  skottlista: 'Skottlistan med 10-minutersöversikt.',
  lastmatch: 'En låst match med slutresultat.',
  lagbank: 'Lagbanken med motståndarlag.',
  scout: 'Scoutingrapport för ett lag.',
  scoutspelare: 'En spelare: var hen sätter bollen.',
};
const MARKORER = [
  ['Zonen i målet dit skottet gick.'],
  ['Skottläget i solfjädern, eller Kontring, Straff, Lobb och Studs.'],
  ['<b>RÄDDNING</b>, <b>MÅL</b> eller <b>UTANFÖR</b>.'],
  ['Matchklockan: <b>▶ Starta</b> / <b>⏸ Paus</b> och <b>Justera tid</b>.'],
  ['Halvlek: <b>1:a</b>, <b>2:a</b>, <b>Förl.</b> eller <b>Straff</b>.'],
  ['<b>☰ Skottlista</b> för en genomgång av matchen.'],
  ['<b>⇄ Byt målvakt</b> och <b>+ Assist</b>.'],
  ['<b>↩ Ångra senaste</b> om du registrerar fel.'],
  ['<b>Lås match</b> när matchen är klar.'],
];

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
function fig(b, k) { return `<figure><img src="${b[k]}" alt="${esc(TEXTER[k] || k)}"><figcaption>${esc(TEXTER[k] || '')}</figcaption></figure>`; }

function annoterad(b) {
  const x = b._boxes, W = b._vp.w, H = b._vp.h;
  const pos = [
    [x.goal.x + 22, x.goal.y + 22],
    [x.fan.x + x.fan.w / 2, x.fan.y + x.fan.h * 0.5],
    [x.commitAll.x - 16, x.commitAll.y + x.commitAll.h / 2],
    [x.clock.x - 13, x.clock.y + x.clock.h / 2],
    [x.period.x - 13, x.period.y + x.period.h / 2],
    [x.list.x + x.list.w + 11, x.list.y + x.list.h / 2],
    [x.gk.x - 14, x.gk.y + x.gk.h / 2],
    [x.undo.x - 14, x.undo.y + x.undo.h / 2],
    [x.lock.x + 12, x.lock.y + x.lock.h / 2],
  ];
  const mk = pos.map((p, i) => `<span class="mk" style="left:${(p[0] / W * 100).toFixed(2)}%;top:${(p[1] / H * 100).toFixed(2)}%">${i + 1}</span>`).join('');
  const lg = MARKORER.map((m, i) => `<li><span class="mk s">${i + 1}</span><span>${m[0]}</span></li>`).join('');
  return `<div class="annwrap"><figure class="annot"><div class="ann"><img src="${b.match}" alt="Matchvyn med numrerade markeringar">${mk}</div><figcaption>Matchvyn. Numren förklaras till höger.</figcaption></figure><ol class="legend">${lg}</ol></div>`;
}

function trackerSida(b) {
  const sek = new Map(b._sections.map(s => [s.h, s.body]));
  const använda = new Set();
  const sektion = h => { använda.add(h); return `<section><h3>${esc(h)}</h3>${sek.get(h) || ''}</section>`; };
  let kap = '';
  for (const k of KAPITEL) {
    const har = k.rubriker.filter(h => sek.has(h));
    if (!har.length) continue;
    let bilder = '';
    if (k.annoterad) bilder = annoterad(b);
    else if (k.layout === 'par') bilder = `<div class="par">${fig(b, k.bilder[0])}${fig(b, k.bilder[1])}</div>`;
    else if (k.bilder && k.bilder.length) bilder = `<div class="g${k.bilder.length}">${k.bilder.map(n => fig(b, n)).join('')}</div>`;
    kap += `<article class="kap"><div class="kick">${esc(k.kicker)}</div><h2>${esc(k.titel)}</h2>${bilder}${har.map(sektion).join('')}</article>`;
  }
  const rest = b._sections.filter(s => !använda.has(s.h));
  if (rest.length) kap += `<article class="kap"><div class="kick">Mer</div><h2>Mer i appen</h2>${rest.map(s => sektion(s.h)).join('')}</article>`;
  return `<!DOCTYPE html><html lang="sv"><head><meta charset="utf-8"><title>Handboll Tracker – manual</title>
<style>
  @page { size: A4; margin: 15mm 15mm 18mm; }
  :root { --accent: #b8860b; --ink: #1b1b1f; --grey: #5a5a63; --line: #e6dcc0; --tint: #faf6e8; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; color: var(--ink); font: 400 10.2pt/1.5 "Inter", -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  .cover { text-align: left; }
  .bar { height: 5px; background: #ffd60a; margin-bottom: 14px; }
  .kicker { color: var(--accent); font-weight: 700; font-size: 9.5pt; letter-spacing: .12em; text-transform: uppercase; }
  h1 { margin: 2px 0 2px; font-size: 32pt; line-height: 1.05; }
  .sub { font-size: 13pt; margin: 0 0 2px; }
  .meta { color: var(--grey); font-size: 9pt; margin: 0 0 14px; }
  .kap { break-before: page; }
  .kick { color: var(--accent); font-weight: 700; font-size: 9pt; letter-spacing: .12em; text-transform: uppercase; }
  h2 { font-size: 21pt; line-height: 1.1; color: var(--ink); margin: 2px 0 10px; padding-bottom: 6px; border-bottom: 3px solid #ffd60a; }
  h3 { font-size: 12.5pt; color: var(--accent); margin: 14px 0 4px; break-after: avoid; }
  section { margin: 0 0 4px; }
  p { margin: 0 0 8px; } ol, ul { margin: 0 0 8px; padding-left: 20px; } li { margin: 3px 0; }
  figure { margin: 8px 0 12px; break-inside: avoid; }
  figure img { display: block; width: 100%; height: auto; border: 1px solid #cfcfd4; }
  figcaption { color: var(--grey); font-size: 8.5pt; margin-top: 4px; }
  .par { display: flex; gap: 14px; align-items: flex-start; }
  .par figure:first-child { flex: 1 1 0; min-width: 0; }
  .par figure:last-child { flex: 0 0 19%; }
  .annwrap { display: grid; grid-template-columns: 64% 1fr; gap: 14px; align-items: start; margin: 6px 0 4px; }
  .annwrap .annot { max-width: none; margin: 0; }
  .annwrap .legend { grid-template-columns: 1fr; gap: 7px; margin: 8px 0 0; }
  .par figure:first-child img { width: 72%; }
  .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; }
  .g3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; align-items: start; }
  .g2 figure, .g3 figure { margin: 8px 0; }
  .g3 figcaption { font-size: 8pt; }
  .steps { list-style: none; padding: 0; counter-reset: s; margin: 10px 0 0; }
  .steps li { counter-increment: s; position: relative; padding-left: 32px; margin: 7px 0; }
  .steps li::before { content: counter(s); position: absolute; left: 0; top: 0; width: 22px; height: 22px; background: #ffd60a; color: #000; font-weight: 800; font-size: 10pt; text-align: center; line-height: 22px; }
  .note { background: var(--tint); border-left: 4px solid #ffd60a; padding: 8px 12px; margin: 12px 0; }
  .ann { position: relative; }
  .mk { position: absolute; transform: translate(-50%, -50%); width: 18px; height: 18px; border-radius: 50%; background: #ffd60a; color: #000; font: 800 10px/18px Arial, sans-serif; text-align: center; box-shadow: 0 0 0 1.5px #000; }
  .mk.s { position: static; transform: none; flex: none; box-shadow: none; border: 1px solid #000; width: 20px; height: 20px; line-height: 18px; font-size: 11px; }
  .legend { list-style: none; padding: 0; margin: 4px 0 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 18px; }
  .legend li { display: flex; gap: 8px; align-items: flex-start; margin: 0; font-size: 9.2pt; }
  b { font-weight: 700; }
  footer { margin-top: 18px; padding-top: 8px; border-top: 1px solid var(--line); color: var(--grey); font-size: 9pt; }
  @media screen and (max-width: 640px) { .g2, .g3, .legend { grid-template-columns: 1fr; } .par { flex-direction: column; } .par figure:first-child, .par figure:last-child { flex: none; width: 100%; } .annwrap { grid-template-columns: 1fr; } .par figure:first-child img { width: 100%; } }
</style></head><body>
<article class="cover">
  <div class="bar"></div>
  <div class="kicker">Handbollssviten</div>
  <h1>Handboll Tracker</h1>
  <p class="sub">Registrera skott, scouta motståndare och läs statistik</p>
  <p class="meta">Manual · appversion ${esc(b._version)} · skärmbilderna visar påhittad exempeldata</p>
  <figure><img src="${b.malvakter}" alt="Startvyn Målvakter"><figcaption>Startvyn Målvakter. Menyn ligger till vänster, och ditt lag och din ålderskull överst.</figcaption></figure>
  <h3>Kom igång i fyra steg</h3>
  <ol class="steps">
    <li><b>Skapa ditt lag.</b> Första gången anger du lagnamn och ålderskull. Du kan ha flera lag, till exempel ett per ålderskull.</li>
    <li><b>Lägg in målvakterna.</b> Tryck på ✎ på profilkortet och lägg till namn, nummer och foto.</li>
    <li><b>Skapa en säsong eller cup och en match.</b> Under <b>Säsonger</b> eller <b>Cuper</b> trycker du <b>+ Ny match</b> och väljer motståndare, datum och målvakt.</li>
    <li><b>Registrera skotten.</b> Tryck zon, skottläge och utfall för varje skott under matchen. Statistiken uppdateras direkt.</li>
  </ol>
  <div class="note"><b>Allt sparas på din enhet.</b> Inget skickas någonstans. Exportera en backup då och då, särskilt innan du byter enhet.</div>
</article>
${kap}
<footer>Tips: lägg till appen på hemskärmen för helskärmsläge utan webbläsarens kontroller.</footer>
</body></html>`;
}
module.exports = { trackerSida };
