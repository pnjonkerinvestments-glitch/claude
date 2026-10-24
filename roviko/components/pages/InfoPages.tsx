'use client';
import React from 'react';
import { ArrowRight, ArrowUpRight, Download, FileText, TriangleAlert } from 'lucide-react';
import { useApp } from '../app/context';
import { A } from '../app/shared';
import { PageHeader } from '../ds/States';
import { MosaicSources } from '../puzzles/MosaicSources';

/**
 * Privacy, terms and data credits. Facts only come from how Roviko actually works today.
 * Owner-supplied details live in OPERATOR and HOSTING. A section can still carry a visible
 * "to be completed" note (todo) for anything not yet decided, instead of inventing it.
 */
type L = { en: string; nl: string; es: string };
type Section = { id: string; title: L; body: L[]; todo?: L };
const l = (en: string, nl: string, es: string): L => ({ en, nl, es });

/** Details given by the owner (September 2026). Change them here only; both documents use them. */
/**
 * Since 16 October 2026 Roviko is offered by Jonker Studios. The owner chose to show only that name
 * (no personal name, no KVK number): add them to WHO only when the owner asks.
 * No postal address on the site (owner's home address): add one as ', <street>, <postcode> <city>' in `at` only when asked.
 */
const OPERATOR = { name: 'Jonker Studios', project: 'Roviko', at: '', email: 'support@roviko.app' };
const WHO = l(OPERATOR.name, OPERATOR.name, OPERATOR.name);
/** Current hosting. Update this line when the site moves (for example to Cloudflare). */
const HOSTING = l('Cloudflare', 'Cloudflare', 'Cloudflare');
export const LEGAL_UPDATED = '2026-10-24';

const PRIVACY: Section[] = [
  { id: 'what-we-keep', title: l('What we keep', 'Wat we bewaren', 'Qué guardamos'), body: [
    l('Guest play stores a random session identifier, your chosen display name, results and progress. Accounts also store your email and a salted password hash. We never store your readable password. We also note per day whether you play on the website, the iPhone app or the Android app, for counts of how Roviko grows.',
      'Bij gastspel bewaren we een willekeurige sessiecode, je gekozen spelersnaam, spelresultaten en voortgang. Bij een account komen daar je e-mailadres en een gezouten wachtwoordhash bij. We bewaren nooit je leesbare wachtwoord. Ook noteren we per dag of je speelt via de website, de iPhone-app of de Android-app, om bij te houden hoe Roviko groeit.',
      'Al jugar como invitado guardamos un identificador de sesión aleatorio, el nombre elegido, los resultados y el progreso. Una cuenta añade tu correo electrónico y un hash de contraseña con sal. Nunca guardamos la contraseña legible. También anotamos cada día si juegas en la web, la app de iPhone o la app de Android, para contar cómo crece Roviko.')] },
  { id: 'storage', title: l('Essential storage and optional measurement', 'Functionele opslag en optionele metingen', 'Almacenamiento necesario y mediciones opcionales'), body: [
    l('An essential cookie keeps your session signed in. Theme, language and sound preferences, and small bits of daily progress (such as the mystery country and crowns), stay in your browser. There are no advertising trackers.',
      'Een functionele cookie houdt je ingelogd. Thema, taal, geluid en kleine stukjes dagvoortgang (zoals het mysterieland en kronen) blijven in je browser. Er zijn geen advertentietrackers.',
      'Una cookie necesaria mantiene tu sesión. El tema, el idioma, el sonido y pequeños datos de progreso diario (como el país misterioso y las coronas) se guardan en tu navegador. No hay rastreadores publicitarios.'),
    l('You can switch on optional product measurement in your passport. It stores event types and pseudonymous digests, without your name, email, IP address or answers. Its preference cookie contains only on or off.',
      'Je kunt in je paspoort optionele productmetingen aanzetten. Die bewaren gebeurtenistypen en afgeschermde identificaties, zonder je naam, e-mailadres, IP-adres of antwoorden. De voorkeurcookie bevat alleen aan of uit.',
      'Puedes activar mediciones opcionales en tu pasaporte: tipos de eventos e identificadores seudonimizados, sin nombre, correo, dirección IP ni respuestas. La cookie de preferencia solo indica si están activadas.')] },
  { id: 'visible', title: l('What others can see', 'Wat anderen zien', 'Qué ven los demás'), body: [
    l('Display names and scores appear in game rooms and rankings. In your passport you can hide yourself from friend requests; hidden players appear as "Explorer" in the daily rankings.',
      'Spelersnamen en scores verschijnen in spelrooms en ranglijsten. In je paspoort kun je vriendschapsverzoeken uitzetten; wie niet vindbaar is, staat als "Explorer" in de dagranglijst.',
      'Los nombres y las puntuaciones aparecen en salas y clasificaciones. En tu pasaporte puedes ocultarte de las solicitudes de amistad; quien no es visible aparece como «Explorer» en la clasificación diaria.'),
    l('Friends you have accepted can see whether you have Roviko open right now (online in the last 90 seconds) and can invite you to their room. Guests never share an online status.',
      'Vrienden die je hebt geaccepteerd zien of je Roviko nu open hebt (online in de afgelopen 90 seconden) en kunnen je uitnodigen in hun kamer. Gasten delen nooit een online-status.',
      'Los amigos que has aceptado ven si tienes Roviko abierto ahora (en línea en los últimos 90 segundos) y pueden invitarte a su sala. Los invitados nunca comparten su estado en línea.'),
    l('If you report a player, we store who reported whom, the reason, the room code and the time, to review it. If you block a player, we store that block so you are never matched again. The reported player never sees who reported them. Reports about you are deleted with your account.',
      'Meld je een speler, dan bewaren we wie wie meldde, de reden, de kamercode en het tijdstip, om de melding te bekijken. Blokkeer je een speler, dan bewaren we die blokkade zodat jullie nooit meer aan elkaar gekoppeld worden. De gemelde speler ziet nooit wie de melding deed. Meldingen over jou worden verwijderd samen met je account.',
      'Si denuncias a un jugador, guardamos quién denunció a quién, el motivo, el código de sala y la hora, para revisarlo. Si bloqueas a un jugador, guardamos ese bloqueo para que nunca más os emparejemos. El jugador denunciado nunca ve quién lo denunció. Las denuncias sobre ti se eliminan con tu cuenta.')] },
  { id: 'choices', title: l('Your choices', 'Jouw keuzes', 'Tus decisiones'), body: [
    l('In your passport you can download your data and delete your account. Guest progress is tied to the session cookie. You stay signed in for 60 days after your last visit. Rooms expire after 30 minutes without active players.',
      'In je paspoort kun je je gegevens downloaden en je account verwijderen. Gastvoortgang is verbonden aan de sessiecookie. Je blijft ingelogd tot 60 dagen na je laatste bezoek. Rooms verlopen na 30 minuten zonder actieve spelers.',
      'Desde tu pasaporte puedes descargar tus datos y eliminar la cuenta. El progreso de invitado está vinculado a la cookie de sesión. La sesión sigue abierta hasta 60 días después de tu última visita, y las salas caducan tras 30 minutos sin jugadores activos.')] },
  { id: 'retention', title: l('How long we keep it', 'Hoe lang we het bewaren', 'Cuánto tiempo lo guardamos'), body: [
    l('Accounts and their results stay until you delete your account in your passport; everything is then removed at once. Guest progress is deleted automatically after 12 months without a game. Sign-in sessions end 60 days after your last visit, game rooms 30 minutes after the last player leaves, and optional measurement events after 90 days.',
      'Accounts en hun resultaten blijven bewaard tot je je account verwijdert in je paspoort; dan verdwijnt alles in één keer. Gastvoortgang wordt automatisch verwijderd na 12 maanden zonder spel. Inlogsessies stoppen 60 dagen na je laatste bezoek, spelkamers 30 minuten nadat de laatste speler weg is, en optionele meetgegevens na 90 dagen.',
      'Las cuentas y sus resultados se conservan hasta que elimines la cuenta desde tu pasaporte; entonces se borra todo a la vez. El progreso de invitado se elimina automáticamente tras 12 meses sin jugar. Las sesiones terminan 60 días después de tu última visita, las salas 30 minutos después de que salga el último jugador y las mediciones opcionales a los 90 días.')] },
  { id: 'basis', title: l('Why we may use it', 'Waarom we het mogen gebruiken', 'Por qué podemos usarlos'), body: [
    l('We use your data to run the games and your account you asked for (performance of a contract), to keep Roviko safe and fair, for example against cheating and abuse (legitimate interest), and only with your consent for optional measurement, which you can switch off at any time.',
      'We gebruiken je gegevens om de spellen en het account te laten werken waar je om vraagt (uitvoering van een overeenkomst), om Roviko veilig en eerlijk te houden, bijvoorbeeld tegen valsspelen en misbruik (gerechtvaardigd belang), en alleen met jouw toestemming voor optionele metingen, die je altijd weer uit kunt zetten.',
      'Usamos tus datos para que funcionen los juegos y la cuenta que pides (ejecución de un contrato), para que Roviko sea seguro y justo, por ejemplo contra trampas y abusos (interés legítimo), y solo con tu consentimiento para las mediciones opcionales, que puedes desactivar cuando quieras.'),
    l('Roviko is meant for players aged 13 and up. If you are younger than 16, ask a parent or guardian before you create an account.',
      'Roviko is bedoeld voor spelers vanaf 13 jaar. Ben je jonger dan 16, vraag dan een ouder of verzorger voordat je een account maakt.',
      'Roviko es para jugadores a partir de 13 años. Si tienes menos de 16, pide permiso a tu padre, madre o tutor antes de crear una cuenta.')] },
  { id: 'hosting', title: l('Where it is stored', 'Waar het wordt opgeslagen', 'Dónde se guarda'), body: [
    l(`The website and its database are hosted by ${HOSTING.en}. Emails we send you (welcome, confirming your address, a new password) go through Resend, which only receives your email address and the message. If you choose to sign in with Google, Google confirms your email address to us. Cloudflare and Resend process data only on our instructions; where data leaves the EU, it is covered by the EU–US Data Privacy Framework or the EU standard contractual clauses. We do not sell data and share it with no one else.`,
      `De website en de database worden gehost door ${HOSTING.nl}. E-mails die we je sturen (welkom, je adres bevestigen, een nieuw wachtwoord) gaan via Resend, dat alleen je e-mailadres en het bericht krijgt. Kies je ervoor om met Google in te loggen, dan bevestigt Google je e-mailadres aan ons. Cloudflare en Resend verwerken gegevens alleen in onze opdracht; waar gegevens de EU verlaten, valt dat onder het EU-VS-gegevensprivacykader of de standaardcontractbepalingen van de EU. We verkopen geen gegevens en delen ze met niemand anders.`,
      `El sitio web y su base de datos están alojados por ${HOSTING.es}. Los correos que te enviamos (bienvenida, confirmar tu dirección, una contraseña nueva) pasan por Resend, que solo recibe tu correo electrónico y el mensaje. Si decides iniciar sesión con Google, Google nos confirma tu correo electrónico. Cloudflare y Resend tratan los datos solo por encargo nuestro; cuando los datos salen de la UE, lo cubre el Marco de Privacidad de Datos UE-EE. UU. o las cláusulas contractuales tipo de la UE. No vendemos datos ni los compartimos con nadie más.`)] },
  { id: 'controller', title: l('Who is responsible', 'Wie is verantwoordelijk', 'Quién es responsable'), body: [
    l(`${OPERATOR.project} is made by ${WHO.en}${OPERATOR.at}, which is responsible for your data. Questions, requests to see or correct your data, or complaints: ${OPERATOR.email}. You may also complain to the Dutch Data Protection Authority (Autoriteit Persoonsgegevens).`,
      `${OPERATOR.project} wordt gemaakt door ${WHO.nl}${OPERATOR.at}, dat verantwoordelijk is voor je gegevens. Vragen, verzoeken om je gegevens in te zien of te verbeteren, of klachten: ${OPERATOR.email}. Je kunt ook een klacht indienen bij de Autoriteit Persoonsgegevens.`,
      `${OPERATOR.project} lo hace ${WHO.es}${OPERATOR.at}, responsable de tus datos. Preguntas, solicitudes de acceso o rectificación, o quejas: ${OPERATOR.email}. También puedes reclamar ante la autoridad neerlandesa de protección de datos (Autoriteit Persoonsgegevens).`)] },
];

const TERMS: Section[] = [
  { id: 'fair-play', title: l('Play fairly', 'Speel eerlijk', 'Juega limpio'), body: [
    l('Choose a friendly display name. Offensive names, cheating and disrupting other players’ rooms are not allowed. Names are filtered, every player can report or block another player, and we review reports within 24 hours. Offensive names are reset and serious abuse leads to a blocked account.',
      'Gebruik een vriendelijke spelersnaam. Aanstootgevende namen, valsspelen en het verstoren van kamers van anderen zijn niet toegestaan. Namen worden gefilterd, elke speler kan een andere speler melden of blokkeren, en we bekijken meldingen binnen 24 uur. Aanstootgevende namen worden gereset en bij ernstig misbruik wordt een account geblokkeerd.',
      'Elige un nombre respetuoso. No se permiten nombres ofensivos, trampas ni interrumpir salas ajenas. Los nombres se filtran, cualquier jugador puede denunciar o bloquear a otro y revisamos las denuncias en menos de 24 horas. Los nombres ofensivos se restablecen y el abuso grave conlleva el bloqueo de la cuenta.')] },
  { id: 'open-mind', title: l('Learn with an open mind', 'Leer met een open blik', 'Aprende con mente abierta'), body: [
    l('Geographic knowledge can change. Report a question if you spot an error. Maps are simplified and boundaries do not express a position on sovereignty.',
      'Geografische kennis kan veranderen. Meld een vraag als je een fout ziet. Kaarten zijn vereenvoudigd; landsgrenzen geven geen standpunt over soevereiniteit weer.',
      'Los datos geográficos pueden cambiar. Informa de una pregunta si ves un error. Los mapas son simplificados y las fronteras no expresan una postura sobre soberanía.')] },
  { id: 'free', title: l('Free to play', 'Gratis spelen', 'Juega gratis'), body: [
    l('The current games are free. There are no payments or purchasable answer advantages. Source licences continue to apply to geographic data and open assets.',
      'De huidige spellen zijn gratis. Er zijn geen betalingen of koopbare kennisvoordelen. Bronlicenties blijven van toepassing op de geografische data en gebruikte open assets.',
      'Los juegos actuales son gratuitos. No hay pagos ni ventajas de conocimiento comprables. Las licencias de las fuentes siguen aplicándose a los datos geográficos y recursos abiertos.')] },
  { id: 'age', title: l('Age', 'Leeftijd', 'Edad'), body: [
    l('Anyone can play as a guest. You need to be 16 or older to create an account; younger players need permission from a parent or guardian.',
      'Iedereen kan als gast spelen. Voor een account moet je 16 jaar of ouder zijn; jongere spelers hebben toestemming nodig van een ouder of verzorger.',
      'Cualquiera puede jugar como invitado. Para crear una cuenta debes tener 16 años o más; los menores necesitan permiso de un padre, madre o tutor.')] },
  { id: 'liability', title: l('Liability and changes', 'Aansprakelijkheid en wijzigingen', 'Responsabilidad y cambios'), body: [
    l('Roviko is a free learning game, offered as it is. We do our best to keep it available and the facts correct, but cannot guarantee either. We are not liable for indirect damage, except in case of intent or gross negligence. We announce changes to these terms on this page, with the date; important changes are also shown in the game.',
      'Roviko is een gratis leerspel en wordt aangeboden zoals het is. We doen ons best om het beschikbaar en de feiten juist te houden, maar kunnen dat niet garanderen. We zijn niet aansprakelijk voor indirecte schade, behalve bij opzet of grove nalatigheid. Wijzigingen in deze voorwaarden maken we op deze pagina bekend, met de datum; belangrijke wijzigingen tonen we ook in het spel.',
      'Roviko es un juego educativo gratuito, ofrecido tal cual. Hacemos lo posible por mantenerlo disponible y los datos correctos, pero no podemos garantizarlo. No somos responsables de daños indirectos, salvo dolo o negligencia grave. Anunciamos los cambios de estas condiciones en esta página, con la fecha; los cambios importantes también se muestran en el juego.')] },
  { id: 'operator', title: l('Who runs Roviko', 'Wie Roviko aanbiedt', 'Quién ofrece Roviko'), body: [
    l(`Roviko is offered by ${WHO.en}${OPERATOR.at}. Contact: ${OPERATOR.email}. Dutch law applies to these terms.`,
      `Roviko wordt aangeboden door ${WHO.nl}${OPERATOR.at}. Contact: ${OPERATOR.email}. Op deze voorwaarden is Nederlands recht van toepassing.`,
      `Roviko lo ofrece ${WHO.es}${OPERATOR.at}. Contacto: ${OPERATOR.email}. Estas condiciones se rigen por la legislación neerlandesa.`)] },
];

type Dataset = { name: string; provider: string; year: string; licence: string; usedFor: L; href: string; downloads: { label: L; href: string }[]; licenceHref: string };
const DATASETS: Dataset[] = [
  { name: 'World countries 5.1.0', provider: 'Mohammed Le Doze & contributors', year: '2026', licence: 'ODbL 1.0', href: 'https://github.com/mledoze/countries', licenceHref: '/licenses/countries-ODbL.txt',
    usedFor: l('Country names, capitals, regions, borders, languages, currencies, area and silhouettes. 193 UN member states and two observer states.', 'Landnamen, hoofdsteden, regio’s, grenzen, talen, munten, oppervlakte en silhouetten. 193 VN-lidstaten en twee waarnemersstaten.', 'Nombres de países, capitales, regiones, fronteras, idiomas, monedas, superficie y siluetas. 193 miembros de la ONU y dos Estados observadores.'),
    downloads: [{ label: l('Countries', 'Landen', 'Países'), href: '/data/countries.json' }, { label: l('Boundaries', 'Grenzen', 'Fronteras'), href: '/data/boundaries.json' }, { label: l('Silhouettes', 'Silhouetten', 'Siluetas'), href: '/data/silhouettes.json' }] },
  { name: 'World Development Indicators', provider: 'The World Bank', year: '2023', licence: 'CC BY 4.0', href: 'https://datacatalog.worldbank.org/search/dataset/0037712/world-development-indicators', licenceHref: 'https://www.worldbank.org/ext/en/legal/terms-conditions/datasets',
    usedFor: l('Side by Side, Rank Radar and World Duel: population, cities, life expectancy, fertility, GDP, forest, agriculture, exports and internet use. Missing values are omitted, never invented.', 'Side by Side, Rank Radar en Wereldduel: bevolking, steden, levensverwachting, vruchtbaarheid, bbp, bos, landbouw, export en internet. Ontbrekende waarden worden weggelaten, nooit verzonnen.', 'Side by Side, Rank Radar y Duelo mundial: población, ciudades, esperanza de vida, fecundidad, PIB, bosques, agricultura, exportaciones e internet. Los valores ausentes se omiten, nunca se inventan.'),
    downloads: [{ label: l('Indicators and providers', 'Indicatoren en bronnen', 'Indicadores y fuentes'), href: '/data/comparisons.json' }] },
  { name: 'The World Factbook (archive)', provider: 'CIA, via factbook.json', year: '—', licence: 'Public domain · CC0', href: 'https://github.com/factbook/factbook.json', licenceHref: '/licenses/factbook-CC0.txt',
    usedFor: l('Highest point, coastline, military spending (as a share of GDP), alcohol, airports and railways in Side by Side, Rank Radar and World Duel; mean elevation and median age in Country Mosaic. The military budget is that share times World Bank GDP, an estimate. Archived observations, not live measurements.', 'Hoogste punt, kustlijn, defensie-uitgaven (als deel van het bbp), alcohol, vliegvelden en spoorwegen in Side by Side, Rank Radar en Wereldduel; gemiddelde hoogte en mediane leeftijd in Country Mosaic. Het defensiebudget is dat deel maal het bbp van de Wereldbank, een schatting. Gearchiveerde waarnemingen, geen live metingen.', 'Punto más alto, costa, gasto militar (como parte del PIB), alcohol, aeropuertos y ferrocarriles en Side by Side, Rank Radar y Duelo mundial; altitud media y edad mediana en Country Mosaic. El gasto militar es esa parte por el PIB del Banco Mundial, una estimación. Observaciones archivadas, no mediciones en directo.'),
    downloads: [{ label: l('Observations and exceptions', 'Gegevens en uitzonderingen', 'Datos y excepciones'), href: '/data/country-metrics.json' }, { label: l('Military, alcohol, airports and railways', 'Defensie, alcohol, vliegvelden en spoorwegen', 'Ejército, alcohol, aeropuertos y ferrocarriles'), href: '/data/fun-metrics.json' }] },
  { name: 'UNESCO World Heritage Centre', provider: 'UNESCO', year: '—', licence: 'CC BY-SA 3.0 IGO', href: 'https://whc.unesco.org/en/list/', licenceHref: 'https://creativecommons.org/licenses/by-sa/3.0/igo/',
    usedFor: l('Mystery country clues and stories, shortened and translated by Roviko and shared under the same licence. No endorsement by UNESCO.', 'Hints en verhalen van het mysterieland, ingekort en vertaald door Roviko en gedeeld onder dezelfde licentie. Geen goedkeuring door UNESCO.', 'Pistas e historias del país misterioso, abreviadas y traducidas por Roviko y compartidas con la misma licencia. Sin respaldo de UNESCO.'),
    downloads: [{ label: l('Clues and original sources', 'Hints en oorspronkelijke bronnen', 'Pistas y fuentes originales'), href: '/data/mosaic-facts.json' }] },
  { name: 'Natural Earth · world-atlas 2.0.2', provider: 'Natural Earth · Michael Bostock', year: '—', licence: 'Public domain · ISC', href: 'https://www.naturalearthdata.com/about/terms-of-use/', licenceHref: '/licenses/world-atlas-ISC.txt',
    usedFor: l('The world map in Pinpoint and your passport. Simplified geometry; very small countries may not be visible.', 'De wereldkaart in Pinpoint en in je paspoort. Vereenvoudigd; zeer kleine landen zijn niet altijd zichtbaar.', 'El mapa de Pinpoint y de tu pasaporte. Geometría simplificada; los países muy pequeños pueden no verse.'), downloads: [] },
  { name: 'svg-country-flags 1.2.10', provider: 'Wikipedia · Hampus Nilsson', year: '—', licence: 'Public domain', href: 'https://github.com/hjnilsson/country-flags', licenceHref: '/licenses/flags-PD.txt',
    usedFor: l('Flag images in the games and on country cards.', 'Vlaggen in de spellen en op de landenkaarten.', 'Banderas en los juegos y en las tarjetas de países.'), downloads: [] },
];

function Toc({ sections, t, locale }: { sections: Section[]; t: (k: string) => string; locale: 'en' | 'nl' | 'es' }) {
  return <nav className="doc-toc" aria-label={t('legalToc')}><p>{t('legalToc')}</p><ol>{sections.map(s => <li key={s.id}><a href={'#' + s.id}>{s.title[locale]}</a></li>)}</ol></nav>;
}

function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const { t, locale } = useApp();
  const L = locale as 'en' | 'nl' | 'es';
  const sections = kind === 'privacy' ? PRIVACY : TERMS;
  return <div className="page doc-page trip-page">
    <PageHeader back={t('backLabel')} kicker={t(kind === 'privacy' ? 'privacy' : 'terms')} title={t(kind === 'privacy' ? 'privacyTitle' : 'termsTitle')}/>
    <div className="doc-layout">
      <Toc sections={sections} t={t} locale={L}/>
      <article className="doc-body">
        <p className="doc-updated muted">{t('legalUpdated').replace('{date}', new Date(LEGAL_UPDATED + 'T12:00:00Z').toLocaleDateString(L, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }))}</p>
        {sections.map(s => <section key={s.id} id={s.id} aria-labelledby={s.id + '-title'}>
          <h2 id={s.id + '-title'}>{s.title[L]}</h2>
          {s.body.map((p, i) => <p key={i}>{p[L]}</p>)}
          {s.todo && <div className="doc-todo" role="note"><TriangleAlert size={18} aria-hidden="true"/><div><strong>{t('legalTodo')}</strong><p>{s.todo[L]}</p></div></div>}
        </section>)}
        {kind === 'privacy' ? <A href="/profile" className="btn secondary">{t('navPassport')}<ArrowRight size={16} aria-hidden="true"/></A> : <A href="/sources" className="text-link">{t('sourcesKicker')}<ArrowRight size={16} aria-hidden="true"/></A>}
      </article>
    </div>
  </div>;
}

function SourcesPage() {
  const { t, locale } = useApp();
  const L = locale as 'en' | 'nl' | 'es';
  const choices = l('A map is a learning tool, not a political statement. Disputed capital questions and selected sensitive border questions are excluded. Pinpoint uses simplified country boundaries with a 25 km tolerance. Comparison questions use 2023 observations. Silhouettes show simplified main landmasses; small and remote islands may be omitted.',
    'Een kaart is een leermiddel, geen politieke uitspraak. Omstreden hoofdstadvragen en een selectie gevoelige grensvragen zijn uitgesloten. Pinpoint toetst aan vereenvoudigde landsgrenzen, met 25 km tolerantie. Vergelijkingsvragen gebruiken cijfers uit 2023. Silhouetten tonen vereenvoudigde hoofdlandmassa’s; kleine en verafgelegen eilanden kunnen ontbreken.',
    'Un mapa sirve para aprender, no expresa una postura política. Excluimos preguntas sobre capitales disputadas y algunas fronteras sensibles. Pinpoint usa fronteras simplificadas con 25 km de tolerancia. Las comparaciones usan datos de 2023. Las siluetas muestran las principales masas terrestres y pueden omitir islas pequeñas o remotas.');
  const design = l('Original product design, copy, question generator, game illustrations, passport stamps and the Roviko globe. The globe is decorative and never used as a quiz map. Icons: Lucide (ISC). Fonts: Fredoka and Manrope (SIL Open Font License 1.1), self-hosted.',
    'Eigen productontwerp, teksten, vraaggenerator, spelillustraties, paspoortstempels en de Roviko-wereldbol. De wereldbol is decoratief en wordt nooit als quizkaart gebruikt. Iconen: Lucide (ISC). Lettertypen: Fredoka en Manrope (SIL Open Font License 1.1), zelf gehost.',
    'Diseño, textos, generador de preguntas, ilustraciones de los juegos, sellos del pasaporte y el globo de Roviko son originales. El globo es decorativo y nunca se usa como mapa de preguntas. Iconos: Lucide (ISC). Fuentes: Fredoka y Manrope (SIL Open Font License 1.1), alojadas por Roviko.');
  return <div className="page doc-page trip-page">
    <PageHeader back={t('backLabel')} kicker={t('sourcesKicker')} title={t('sourceTitle')} lead={t('pgSourcesLead')}/>
    <div className="dataset-grid">{DATASETS.map(d => <article key={d.name} className="dataset-card">
      <header><span className="dataset-icon" aria-hidden="true"><FileText size={20}/></span><div><h2>{d.name}</h2><p>{d.provider}</p></div></header>
      <dl>
        <div><dt>{t('sourceUsedFor')}</dt><dd>{d.usedFor[L]}</dd></div>
        <div className="dataset-meta"><div><dt>{t('sourceYear')}</dt><dd>{d.year}</dd></div><div><dt>{t('sourceLicence')}</dt><dd><a href={d.licenceHref}>{d.licence}</a></dd></div></div>
      </dl>
      <footer><a className="text-link" href={d.href} target="_blank" rel="noreferrer">{t('sourceVisit')}<ArrowUpRight size={15} aria-hidden="true"/></a>{d.downloads.map(x => <a key={x.href} className="text-link" href={x.href} download><Download size={15} aria-hidden="true"/>{x.label[L]}</a>)}</footer>
    </article>)}</div>
    <details className="doc-more"><summary>Country Mosaic</summary><MosaicSources locale={L}/></details>
    <section className="page-section doc-body"><h2>{({ en: 'Geographic choices', nl: 'Geografische keuzes', es: 'Criterios geográficos' })[L]}</h2><p>{choices[L]}</p>
      <h2>{({ en: 'Design and code', nl: 'Vormgeving en code', es: 'Diseño y código' })[L]}</h2><p>{design[L]}</p>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- plain licence files, not pages */}
      <p className="doc-links"><a href="/fonts/fredoka-LICENSE">Fredoka · OFL 1.1</a><a href="/fonts/manrope-LICENSE">Manrope · OFL 1.1</a><a href="/licenses/lucide-ISC.txt">Lucide · ISC</a></p></section>
  </div>;
}

/** Support (1.41.3): the questions players actually ask, how to reach us and who runs Roviko. Linked from the stores. */
const SUPPORT: { q: L; a: L }[] = [
  { q: l('What is Roviko?', 'Wat is Roviko?', '¿Qué es Roviko?'),
    a: l('A daily geography game: short games about flags, capitals, the map and countries, the same puzzles for everyone. New ones arrive every day at midnight (UTC).', 'Een dagelijks aardrijkskundespel: korte spellen over vlaggen, hoofdsteden, de kaart en landen, voor iedereen dezelfde puzzels. Elke dag om middernacht (UTC) staan er nieuwe klaar.', 'Un juego diario de geografía: juegos cortos sobre banderas, capitales, el mapa y países, los mismos retos para todos. Cada día a medianoche (UTC) llegan nuevos.') },
  { q: l('Do I need an account?', 'Heb ik een account nodig?', '¿Necesito una cuenta?'),
    a: l('No, you can play as a guest. A free account keeps your streak and points on every device and unlocks friends and the weekly league.', 'Nee, je kunt als gast spelen. Met een gratis account bewaar je je reeks en punten op elk apparaat en speel je met vrienden en in de wekelijkse liga.', 'No, puedes jugar como invitado. Con una cuenta gratuita guardas tu racha y tus puntos en todos tus dispositivos y juegas con amigos y en la liga semanal.') },
  { q: l('I lost my progress or have a new phone', 'Ik ben mijn voortgang kwijt of heb een nieuwe telefoon', 'He perdido mi progreso o tengo un móvil nuevo'),
    a: l('Sign in with your account and everything comes back. Guest progress is stored in this browser or app only; create an account to keep it safe.', 'Log in met je account, dan is alles terug. Gastvoortgang staat alleen in deze browser of app; maak een account om hem veilig te bewaren.', 'Inicia sesión con tu cuenta y vuelve todo. El progreso de invitado solo se guarda en este navegador o app; crea una cuenta para conservarlo.') },
  { q: l('I forgot my password', 'Ik ben mijn wachtwoord vergeten', 'He olvidado mi contraseña'),
    a: l('Choose Sign in and then "Forgot password?". You get an email with a link to choose a new one.', 'Kies Inloggen en daarna "Wachtwoord vergeten?". Je krijgt een e-mail met een link om een nieuw wachtwoord te kiezen.', 'Elige Iniciar sesión y luego "¿Has olvidado tu contraseña?". Recibirás un correo con un enlace para elegir una nueva.') },
  { q: l('How do I delete my account?', 'Hoe verwijder ik mijn account?', '¿Cómo borro mi cuenta?'),
    a: l('Go to Passport and choose "Delete my account". Everything is removed at once. You can also email us and we will do it for you.', 'Ga naar Paspoort en kies "Verwijder mijn account". Alles wordt in één keer verwijderd. Je kunt ons ook mailen, dan doen wij het voor je.', 'Ve a Pasaporte y elige "Borrar mi cuenta". Se borra todo de una vez. También puedes escribirnos y lo hacemos por ti.') },
  { q: l('A question or answer is wrong', 'Een vraag of antwoord klopt niet', 'Una pregunta o respuesta está mal'),
    a: l('Tap "Report an issue" below the question. We check every report and fix the data.', 'Tik op "Meld een fout" onder de vraag. We bekijken elke melding en passen de gegevens aan.', 'Toca "Informar de un error" debajo de la pregunta. Revisamos cada aviso y corregimos los datos.') },
  { q: l('My friend\u2019s invite does not arrive', 'De uitnodiging van mijn vriend komt niet aan', 'No me llega la invitación de mi amigo'),
    a: l('Both of you need an account and must be friends. Keep Roviko open: an invite shows up within a few seconds and stays for 30 minutes, as long as the room is still waiting. You can also join with the room code.', 'Jullie hebben allebei een account nodig en moeten vrienden zijn. Houd Roviko open: een uitnodiging verschijnt binnen een paar seconden en blijft 30 minuten staan, zolang de kamer nog wacht. Je kunt ook meedoen met de kamercode.', 'Los dos necesitáis una cuenta y ser amigos. Mantén Roviko abierto: la invitación aparece en unos segundos y dura 30 minutos, mientras la sala espere. También puedes unirte con el código de la sala.') },
  { q: l('How do I turn the daily reminder on or off?', 'Hoe zet ik de dagelijkse herinnering aan of uit?', '¿Cómo activo o desactivo el recordatorio diario?'),
    a: l('In the app, go to Settings and use the reminder switch. You can also turn notifications off for Roviko in your phone\u2019s settings.', 'Ga in de app naar Instellingen en gebruik de knop bij Herinnering. Je kunt meldingen voor Roviko ook uitzetten in de instellingen van je telefoon.', 'En la app, ve a Ajustes y usa el interruptor del recordatorio. También puedes desactivar las notificaciones de Roviko en los ajustes del móvil.') },
  { q: l('Someone behaves badly', 'Iemand gedraagt zich vervelend', 'Alguien se porta mal'),
    a: l('Tap the ⋯ next to the player to report or block them. A blocked player is never matched with you again.', 'Tik op de ⋯ naast de speler om hem te melden of te blokkeren. Een geblokkeerde speler wordt nooit meer aan je gekoppeld.', 'Toca ⋯ junto al jugador para informar o bloquearlo. Un jugador bloqueado no volverá a coincidir contigo.') },
];
function SupportPage() {
  const { t, locale } = useApp();
  const L = locale as 'en' | 'nl' | 'es';
  const text = { kicker: l('Help', 'Hulp', 'Ayuda'), title: l('How can we help?', 'Waarmee kunnen we helpen?', '¿En qué podemos ayudarte?'), lead: l('Answers to the most common questions. Still stuck? Email us and we reply within a few working days.', 'Antwoorden op de meest gestelde vragen. Kom je er niet uit? Mail ons, we antwoorden binnen een paar werkdagen.', 'Respuestas a las preguntas más frecuentes. ¿Sigues con dudas? Escríbenos y te respondemos en unos días laborables.'),
    contact: l('Contact', 'Contact', 'Contacto'), mail: l('Email us', 'Mail ons', 'Escríbenos'), who: l(`Roviko is made by ${WHO.en}.`, `Roviko wordt gemaakt door ${WHO.nl}.`, `Roviko lo hace ${WHO.es}.`), faq: l('Frequently asked questions', 'Veelgestelde vragen', 'Preguntas frecuentes') };
  return <div className="page doc-page trip-page support-page">
    <PageHeader back={t('backLabel')} kicker={text.kicker[L]} title={text.title[L]} lead={text.lead[L]}/>
    <section className="support-contact t-card" aria-labelledby="support-contact">
      <div><h2 id="support-contact">{text.contact[L]}</h2><p><a href={'mailto:' + OPERATOR.email}>{OPERATOR.email}</a></p><p className="muted">{text.who[L]}</p></div>
      <a className="btn primary" href={'mailto:' + OPERATOR.email}>{text.mail[L]}<ArrowRight size={16} aria-hidden="true"/></a>
    </section>
    <section className="doc-body support-faq" aria-labelledby="support-faq">
      <h2 id="support-faq">{text.faq[L]}</h2>
      {SUPPORT.map((x, i) => <details key={i} className="support-q"><summary>{x.q[L]}</summary><p>{x.a[L]}</p></details>)}
      <p className="doc-links"><A href="/how-to-play">{t('howTo')}</A><A href="/privacy">{t('privacy')}</A><A href="/terms">{t('terms')}</A></p>
    </section>
  </div>;
}

export function InfoPage({ kind }: { kind: string }) {
  return kind === 'sources' ? <SourcesPage/> : kind === 'support' ? <SupportPage/> : <LegalPage kind={kind === 'terms' ? 'terms' : 'privacy'}/>;
}
