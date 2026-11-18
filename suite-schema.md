# Handbollssviten – gemensam ID- och datastandard

Version 1 · gäller Teambuilder, Tracker, Playbook, PracticePlanner och analysverktyget.

Tillägg 2026-11-18 (valfria fält, ingen ny version): målvaktsspår, planbilder (`dgm_`, `diagram@1`) och `extraDiagrams`. Se avsnitt 3 och 4.

Lägg den här filen i varje repo och hänvisa till den från CLAUDE.md, så att alla appar använder samma ID:n.

## 1. ID-regler

- Ett ID skapas **en gång** och ändras aldrig – inte heller om namnet ändras.
- Format: `prefix_` + en kort slumpad nyckel (8 tecken, a–z och 0–9), till exempel `plr_8f3k2m9q`.
- Undantag: inbyggda övningar använder kompendiets kod, till exempel `ex_FS11`.
- ID:n är gemener, utan mellanslag, å, ä eller ö.

| Prefix | Vad | Skapas i | Exempel |
|---|---|---|---|
| `team_` | lag eller årskull | Teambuilder | `team_f13a8k2m` |
| `plr_` | spelare | Teambuilder | `plr_8f3k2m9q` |
| `grp_` | träningsgrupp | Teambuilder | `grp_x4v9t2pa` |
| `ex_` | övning | PracticePlanner | `ex_FS11`, `ex_eg_4p9xk2m1` |
| `ses_` | träningspass | PracticePlanner | `ses_k29d8x1q` |
| `trk_` | spår i ett pass (nivå, plan eller målvakter) | PracticePlanner | `trk_a1b2c3d4` |
| `blk_` | övning inlagd i ett pass | PracticePlanner | `blk_9z8y7x6w` |
| `dgm_` | planbild på en övning | PracticePlanner | `dgm_7c5r2k9t` |
| `mat_` | match | Tracker / analys | `mat_2m4n6p8q` |
| `ssn_` | säsong | alla | `ssn_2026_27` |

## 2. Övningskoder

| Grupp | Kod | Källa |
|---|---|---|
| Fånga och passa | FP | Utespelarkompendiet |
| Skott | SK | Utespelarkompendiet |
| Hög arm | HA | Utespelarkompendiet |
| Lekar | LK | Utespelarkompendiet |
| Fart och fas 1–2 | FS | Utespelarkompendiet |
| Offensivt försvar | OF | Utespelarkompendiet |
| Reaktion, position, styrka, utkast, straff | RE, PO, ST, UK, SF | Målvaktskompendiet |
| Bas (FYS, dans, matchspel m.m.) | BAS | PracticePlanner |
| Egna övningar | EG | skapas av tränare |

Koder återanvänds aldrig. Tas en övning bort ur kompendiet (som SK3) står koden tom.

## 3. Dataformat

### Träningsgrupp (export från Teambuilder)
```json
{
  "schema": "handbollssviten/groups@1",
  "exportedAt": "2026-11-17T20:00:00Z",
  "groups": [
    { "id": "grp_x4v9t2pa", "name": "Victoria tis – nivå 1–2", "teamId": "team_f13a8k2m",
      "level": "1-2", "playerIds": ["plr_8f3k2m9q", "plr_2b7c5d1e"] }
  ]
}
```
**Följer aldrig med:** Teambuilders dolda nivåpoäng, PIN eller relationsregler. Bara gruppindelning och spelar-ID.

### Övning
```json
{ "id": "ex_FS11", "code": "FS11", "name": "Köpenhamn med M6", "group": "FS",
  "age": "11–14 år", "steps": ["…"], "trains": "…", "think": ["…"],
  "easier": "…", "harder": "…", "watch": "…", "goalkeeper": "…", "source": "utespelare" }
```
Valfria fält: `"gk": true` markerar en egen övning som målvaktsövning (läggs i målvaktsspåret). `"diagrams": [ … ]` på en egen övning innehåller dess planbilder (se avsnitt 4).

### Träningspass
```json
{
  "id": "ses_k29d8x1q", "name": "Victoria tis – nr 1", "date": "2026-11-18",
  "venue": "Victoria", "lengthMin": 90,
  "levelSplit": true, "doubleCourt": true,
  "tracks": [
    { "id": "trk_a1b2c3d4", "name": "Nivå 1–2", "court": "A", "groupId": "grp_x4v9t2pa" },
    { "id": "trk_e5f6g7h8", "name": "Nivå 2–3", "court": "B", "groupId": null },
    { "id": "trk_m1n2p3q4", "name": "Målvakter", "court": "G", "kind": "gk", "groupId": null }
  ],
  "blocks": [
    { "id": "blk_9z8y7x6w", "exerciseId": "ex_BAS1", "trackId": "all", "startMin": 0, "durMin": 30 },
    { "id": "blk_1q2w3e4r", "exerciseId": "ex_FS9", "trackId": "trk_a1b2c3d4", "startMin": 40, "durMin": 15 }
  ]
}
```
`trackId: "all"` betyder att övningen gäller alla spår, till exempel FYS innan gruppen delar sig. Det gäller även målvaktsspåret.

Målvaktsspåret är ett vanligt spår med det valfria fältet `"kind": "gk"` (högst ett per pass, alltid sist). Läsare som inte känner till `kind` ska behandla det som ett vanligt spår.

### Fil för export och import
```json
{ "schema": "handbollssviten/planner@1", "exercises": [], "sessions": [], "groups": [],
  "extraDiagrams": { "ex_FS9": [ { "id": "dgm_7c5r2k9t", "caption": "Variant 1: två bollar", "diagram": { } } ] } }
```
`extraDiagrams` (valfritt) innehåller planbilder som tränaren lagt på **inbyggda** övningar, per övnings-id. Planbilder på egna övningar ligger i övningens `diagrams`. Äldre filer utan fältet läses som förut.

## 4. Planbild (`handbollssviten/diagram@1`)

En ritad övningsbild sparas som data, inte som bild. Den ritas i Playbook och visas i PracticePlanner. Formen är densamma som Playbooks mönster:

```json
{ "schema": "handbollssviten/diagram@1", "court": "half", "defense": "none",
  "tokens": [ { "id": "k1", "kind": "att", "label": "M9", "x": 10, "y": 10.4, "attachedTo": null },
              { "id": "k2", "kind": "ball", "label": "", "x": 10, "y": 10.4, "attachedTo": "k1" } ],
  "paths":  [ { "id": "p1", "tokenId": "k1", "step": 1, "type": "pass", "pts": [[10,10.4],[14.6,9.6]] } ] }
```
- **Plan:** `court: "half"`, en halvplan på 20 × 20 meter med mållinjen vid y = 0 (målburen uppåt, laget anfaller uppåt). x går från vänster sidlinje (0) till höger (20).
- **Brickor:** `kind` är `att` (anfallare, `label` = position eller nummer), `def` (försvarare, nummer 1–6 eller MV) eller `ball`. En boll med `attachedTo` följer den brickan.
- **Banor:** `type` är `run` (löpväg), `pass` (passning), `dribble` (löpväg med boll) eller `shot` (skott). `step` är 1–7. `pts` är minst två punkter i meter.
- **`defense`:** `none`, `6-0`, `5-1`, `3-2-1` eller `3-3`.
- **Aldrig personuppgifter:** brickor märks med position eller nummer, aldrig med namn.
- **Mottagare ska rensa:** okända fält bort, högst 60 brickor, 120 banor och 400 punkter per bana, `label` högst fyra tecken.
- **I en lista** får varje bild ett eget `dgm_`-id: `{ "id": "dgm_7c5r2k9t", "caption": "…", "diagram": { … } }`.

**Meddelanden mellan Playbook och en annan app** (Playbook öppnad i en iframe, `playbook.html?embed=1`, version 1, bara samma adress):
- Playbook → förälder `{ "type": "svit:ready" }`
- Förälder → Playbook `{ "type": "svit:load", "theme": "dark", "title": "FS9 Polska vågor", "diagram": { … } }` (`diagram` är valfri)
- Playbook → förälder `{ "type": "svit:diagram", "diagram": { … } }` eller `{ "type": "svit:cancel" }`

Alla meddelanden har `version: 1`. Båda sidor kontrollerar `origin` och avsändare.

## 5. Lagring

- Varje app sparar lokalt (IndexedDB eller localStorage) och kan **exportera och importera** JSON enligt formaten ovan.
- Ligger apparna under **samma webbadress** (samma domän) kan de på sikt dela en gemensam databas, `handbollssviten`, i webbläsaren.
- Ändras formatet höjs versionen i `schema`, till exempel `handbollssviten/groups@2`, och apparna läser äldre versioner.
