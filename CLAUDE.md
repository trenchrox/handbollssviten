# Handbollssviten

Repot för allt som gäller sviten som helhet: det som är gemensamt för Tracker, Teambuilder och Playbook, och arbetet med att slå ihop dem till en app.

Varje app bor kvar i sitt eget repo och har sin egen CLAUDE.md. Det som bara gäller en app hör hemma där, inte här.

| App | Repo |
| --- | --- |
| Tracker (målvakt) | `trenchrox/handball_g_trk` |
| Teambuilder | `trenchrox/teambuilder-handboll` |
| Playbook | `trenchrox/playbook-handboll` |

Detaljerna om varje apps inloggning och lagring står under "Inloggning" i respektive repos CLAUDE.md. Jämförelsen nedan bygger på dem.

## Jämförelse mellan apparna: inloggning och lagring

| | Tracker | Teambuilder | Playbook |
| --- | --- | --- | --- |
| Inloggning | Profil (lagnamn) | Välkomstruta (valfria fält) | Ingen |
| Konto/server | Nej | Nej | Nej |
| IndexedDB-namn | `handball_gk` | `teambuilder` | `handball_playbook` |
| Store / nyckel | `kv` / `root` | `kv` / `root` | `kv` / `root` |
| localStorage | Bara `handball_gk_v3` (legacy, läses/rensas) | Används inte | Används inte |
| Datamodell | `{clubs[], activeClubId, theme}`, flera lag | En trupp, enda root | En bank, enda root |
| Utloggning | Finns inte (bara "Nollställ allt") | Finns inte ("Lås" gäller bara PIN) | Finns inte |
| Service worker-cache | `handboll-tracker-v1` | Ingen SW | `handboll-playbook-v1` |

**Lika:** allt lokalt, ingen server. Samma IndexedDB-mönster (`idbOpen/idbGet/idbSet/idbClear`, store `kv`, nyckel `root`, version 1). Inget riktigt konto: den som har enheten har datan. Backup som JSON-export/import. Nollställ allt = `idbClear()`.

**Skiljer:** bara Tracker har en profil som måste skapas före appen kan användas, och bara den hanterar flera lag. Teambuilder har valfri välkomstruta och en PIN som låser delar av appen, inte appen. Playbook har inget alls. Teambuilder saknar service worker och manifest.

**Skulle krocka på samma webbadress med delad lagring:**
- Samma origin delar IndexedDB och localStorage. De tre databasnamnen är olika, så IndexedDB-datan krockar *inte* idag. Det gäller bara så länge nya namn inte återanvänds.
- `idbOpen` anropar `indexedDB.open(NAMN, 1)` med version 1 och skapar store `kv` i `onupgradeneeded`. Läggs en app till som öppnar en befintlig databas med högre version, eller byter store-namn, går det inte att öppna den på ett säkert sätt.
- localStorage: bara Tracker använder `handball_gk_v3`. Nyckeln är unik idag, men det finns inget prefix som skyddar nya nycklar.
- Service workers: `sw.js` i samma mapp/scope registreras av flera sidor. En `sw.js` per app på samma origin och scope ersätter den andra. Cache-namnen är olika (`handboll-tracker-v1`, `handboll-playbook-v1`), men `activate` i varje SW raderar **alla** cachar som inte har dess eget namn, så den ena appens SW tömmer den andras cache.
- `manifest.json` har `start_url` per app. Två manifest på samma origin kan inte bägge vara "appen" för installation.
- "Nollställ allt" rensar bara appens egen databas, men Trackers rensar även localStorage-nyckeln. En gemensam sviteinloggning måste bestämma vad utloggning betyder, eftersom ingen app har något utloggningsbegrepp idag.
- Profil: Trackers `clubs` är en egen lagmodell. Teambuilders `squadName`/`logo` och Trackers klubbnamn/logga är separata kopior av samma sak, utan koppling.
- Onboarding: Trackers `#login` täcker hela skärmen tills profil finns. Teambuilders `#welcome` visas om `root.onboarded` är falsk. Delar apparna ett skal måste en gemensam ingång avgöra vilken som gäller.
