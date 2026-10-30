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

## Förslag: gemensam profil (inte beslutat)

Status: förslag. Inget av detta är byggt, och inget i apparna ska ändras förrän det är beslutat.

### Mål
Man skapar eller väljer sitt lag en gång, på startsidan, och apparna använder det i stället för att var och en frågar efter lagnamn och logga. Det är ingen riktig inloggning: ingen kontrollerar vem man är.

### Vad förslaget är, och vad det inte är
- **Är:** en profil som sparas lokalt på enheten och läses av apparna. Inget konto, ingen server, ingen molnsynk.
- **Är inte:** konton med lösenord. De kräver en server eller extern tjänst (GitHub Pages kan inte kontrollera lösenord) och bryter mot principen "ingen server, inget konto". Teambuilder kallar den principen icke förhandlingsbar, eftersom appen hanterar uppgifter om barn. Konton är ett eget beslut och en betydligt större ändring.

### Hur det skulle fungera
Alla appar ligger på samma origin (`trenchrox.github.io`) och delar därför `localStorage`. Matchanalysen har redan förberett detta: den hämtar laget via `session.aktuelltLag()` och nämner nyckeln `svit_session`.

- **Nyckel:** `svit_session` i `localStorage`. Övriga nycklar ska fortsätta ha appens eget prefix (Matchanalys använder `match_summary.`).
- **Innehåll (förslag):** `{ version, lagId, namn, logga?, farg?, aldersgrupp? }`. `lagId` slumpas en gång. `logga` är en bild förminskad till högst 256 px, som i Tracker och Matchanalys.
- **Startsidan** skapar, byter och redigerar profilen.
- **Varje app** läser `svit_session` vid start. Finns profilen hoppar appen över sin egen inloggnings- eller välkomstruta och använder profilen. Saknas den fungerar appen som i dag, så att den förblir fristående.
- **Datan** ligger kvar i varje apps egen databas (`handball_gk`, `teambuilder`, `handball_playbook`, `match_summary`). Bara profilen delas.

### Vad varje app måste avgöra
- **Tracker:** har flera lag (`clubs[]`). En profil motsvarar ett lag. Behöver kopplas till ett befintligt lag, till exempel med ett fält som håller `lagId`, utan att något tappas.
- **Teambuilder:** har en trupp med `squadName` och `logo` men inget id. Profilen skulle fylla i dessa. `onboarded` ska bli sann när en profil finns.
- **Matchanalys:** har redan `lagId` och sessionsmodulen. Det är den minsta ändringen.
- **Playbook:** har ingen profil i dag. Ingen ändring behövs om man inte vill visa lagnamn och logga.

### Frågor som måste besvaras innan något byggs
1. **Installerade appar på iPad.** På en iPad kan varje app som läggs på hemskärmen få egen lagring, skild från Safari och från de andra apparna. Då syns inte en profil som skapats på startsidan i en installerad app. **Detta måste provas på en riktig iPad först.** Det avgör om förslaget räcker eller om profilen i stället måste föras över på annat sätt (till exempel en fil eller en länk).
2. **Befintlig data.** Vad händer med lag som redan finns på användarnas enheter? Kopplingen får aldrig tappa eller skriva över data.
3. **Flera lag.** Ska profilen vara ett lag eller en lista med ett aktivt lag, som Tracker har i dag?
4. **Rensad lagring.** Safari kan rensa lagring för sidor som inte används. Profilen ska gå att återskapa, till exempel via en backupfil.
5. **Backup.** Matchanalysens exporter är märkta med `lagId` och import till fel lag stoppas. Ska profilen följa med i apparnas backuper?
6. **Integritet.** Profilen innehåller bara lagnamn, logga och färg, inget om spelare. Det ska den fortsätta göra.

### Förslag på ordning
1. Prova på en iPad om en installerad app ser en profil som skapats i Safari (fråga 1).
2. Bestäm profilens form (fråga 3) och nyckelns format.
3. Lägg profilen på startsidan.
4. Ändra Matchanalys först (minst ändring), sedan Teambuilder och Tracker. Playbook sist, om alls.
5. Varje app får en ny version enligt sina egna versionsregler, och ändringen provas i en webbläsare och på en iPad.
