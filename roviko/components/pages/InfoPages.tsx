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
/** Roviko is run privately by P. Jonker (owner's choice to show initials) (no registered company yet); add a KvK number here once registered. */
// No postal address yet: add one as ', <street>, <postcode> <city>' in `at` once it is really in use.
const OPERATOR = { name: 'P. Jonker', project: 'Roviko', at: '', email: 'support@roviko.app' };
/** Current hosting. Update this line when the site moves (for example to Cloudflare). */
const HOSTING = l('OpenAI (ChatGPT hosting)', 'OpenAI (ChatGPT-hosting)', 'OpenAI (alojamiento de ChatGPT)');
export const LEGAL_UPDATED = '2026-09-25';

const PRIVACY: Section[] = [
  { id: 'what-we-keep', title: l('What we keep', 'Wat we bewaren', 'Qué guardamos'), body: [
    l('Guest play stores a random session identifier, your chosen display name, results and progress. Accounts also store your email and a salted password hash. We never store your readable password.',
      'Bij gastspel bewaren we een willekeurige sessiecode, je gekozen spelersnaam, spelresultaten en voortgang. Bij een account komen daar je e-mailadres en een gezouten wachtwoordhash bij. We bewaren nooit je leesbare wachtwoord.',
      'Al jugar como invitado guardamos un identificador de sesión aleatorio, el nombre elegido, los resultados y el progreso. Una cuenta añade tu correo electrónico y un hash de contraseña con sal. Nunca guardamos la contraseña legible.')] },
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
      'Los amigos que has aceptado ven si tienes Roviko abierto ahora (en línea en los últimos 90 segundos) y pueden invitarte a su sala. Los invitados nunca comparten su estado en línea.')] },
  { id: 'choices', title: l('Your choices', 'Jouw keuzes', 'Tus decisiones'), body: [
    l('In your passport you can download your data and delete your account. Guest progress is tied to the session cookie. Sessions expire after 30 days. Rooms expire after 30 minutes without active players.',
      'In je paspoort kun je je gegevens downloaden en je account verwijderen. Gastvoortgang is verbonden aan de sessiecookie. Sessies verlopen na 30 dagen. Rooms verlopen na 30 minuten zonder actieve spelers.',
      'Desde tu pasaporte puedes descargar tus datos y eliminar la cuenta. El progreso de invitado está vinculado a la cookie de sesión. Las sesiones caducan a los 30 días y las salas tras 30 minutos sin jugadores activos.')] },
  { id: 'retention', title: l('How long we keep it', 'Hoe lang we het bewaren', 'Cuánto tiempo lo guardamos'), body: [
    l('Accounts and their results stay until you delete your account in your passport; everything is then removed at once. Guest progress is deleted automatically after 12 months without a game. Sign-in sessions expire after 30 days, game rooms 30 minutes after the last player leaves, and optional measurement events after 90 days.',
      'Accounts en hun resultaten blijven bewaard tot je je account verwijdert in je paspoort; dan verdwijnt alles in één keer. Gastvoortgang wordt automatisch verwijderd na 12 maanden zonder spel. Inlogsessies verlopen na 30 dagen, spelkamers 30 minuten nadat de laatste speler weg is, en optionele meetgegevens na 90 dagen.',
      'Las cuentas y sus resultados se conservan hasta que elimines la cuenta desde tu pasaporte; entonces se borra todo a la vez. El progreso de invitado se elimina automáticamente tras 12 meses sin jugar. Las sesiones caducan a los 30 días, las salas 30 minutos después de que salga el último jugador y las mediciones opcionales a los 90 días.')] },
  { id: 'hosting', title: l('Where it is stored', 'Waar het wordt opgeslagen', 'Dónde se guarda'), body: [
    l(`The website and its database are hosted by ${HOSTING.en}. If you choose to sign in with Google, Google confirms your email address to us. We do not sell data and share it with no one else.`,
      `De website en de database worden gehost door ${HOSTING.nl}. Kies je ervoor om met Google in te loggen, dan bevestigt Google je e-mailadres aan ons. We verkopen geen gegevens en delen ze met niemand anders.`,
      `El sitio web y su base de datos están alojados por ${HOSTING.es}. Si decides iniciar sesión con Google, Google nos confirma tu correo electrónico. No vendemos datos ni los compartimos con nadie más.`)] },
  { id: 'controller', title: l('Who is responsible', 'Wie is verantwoordelijk', 'Quién es responsable'), body: [
    l(`${OPERATOR.project} is a private project of ${OPERATOR.name}${OPERATOR.at}, who is responsible for your data. Questions, requests to see or correct your data, or complaints: ${OPERATOR.email}. You may also complain to the Dutch Data Protection Authority (Autoriteit Persoonsgegevens).`,
      `${OPERATOR.project} is een privéproject van ${OPERATOR.name}${OPERATOR.at}, die verantwoordelijk is voor je gegevens. Vragen, verzoeken om je gegevens in te zien of te verbeteren, of klachten: ${OPERATOR.email}. Je kunt ook een klacht indienen bij de Autoriteit Persoonsgegevens.`,
      `${OPERATOR.project} es un proyecto personal de ${OPERATOR.name}${OPERATOR.at}, responsable de tus datos. Preguntas, solicitudes de acceso o rectificación, o quejas: ${OPERATOR.email}. También puedes reclamar ante la autoridad neerlandesa de protección de datos (Autoriteit Persoonsgegevens).`)] },
];

const TERMS: Section[] = [
  { id: 'fair-play', title: l('Play fairly', 'Speel eerlijk', 'Juega limpio'), body: [
    l('Choose a friendly display name. Do not manipulate scores, automate ranking entries or disrupt other players’ rooms. Serious abuse may result in an account being blocked.',
      'Gebruik een vriendelijke spelersnaam. Manipuleer geen scores, automatiseer geen ranglijstinzendingen en verstoor geen rooms van anderen. Accounts bij ernstige overtredingen kunnen worden geblokkeerd.',
      'Elige un nombre respetuoso. No manipules puntuaciones, automatices envíos a clasificaciones ni interrumpas salas ajenas. El abuso grave puede conllevar el bloqueo de la cuenta.')] },
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
    l(`Roviko is offered privately by ${OPERATOR.name}${OPERATOR.at}. Contact: ${OPERATOR.email}. Dutch law applies to these terms.`,
      `Roviko wordt als privéproject aangeboden door ${OPERATOR.name}${OPERATOR.at}. Contact: ${OPERATOR.email}. Op deze voorwaarden is Nederlands recht van toepassing.`,
      `Roviko lo ofrece a título personal ${OPERATOR.name}${OPERATOR.at}. Contacto: ${OPERATOR.email}. Estas condiciones se rigen por la legislación neerlandesa.`)] },
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
    usedFor: l('Highest point, mean elevation, coastline and median age in Country Mosaic and Rank Radar. Archived observations, not live measurements.', 'Hoogste punt, gemiddelde hoogte, kustlijn en mediane leeftijd in Country Mosaic en Rank Radar. Gearchiveerde waarnemingen, geen live metingen.', 'Punto más alto, altitud media, costa y edad mediana en Country Mosaic y Rank Radar. Observaciones archivadas, no mediciones en directo.'),
    downloads: [{ label: l('Observations and exceptions', 'Gegevens en uitzonderingen', 'Datos y excepciones'), href: '/data/country-metrics.json' }] },
  { name: 'UNESCO World Heritage Centre', provider: 'UNESCO', year: '—', licence: 'CC BY-SA 3.0 IGO', href: 'https://whc.unesco.org/en/list/', licenceHref: 'https://creativecommons.org/licenses/by-sa/3.0/igo/',
    usedFor: l('Mystery country clues and stories, shortened and translated by Roviko and shared under the same licence. No endorsement by UNESCO.', 'Hints en verhalen van het mysterieland, ingekort en vertaald door Roviko en gedeeld onder dezelfde licentie. Geen goedkeuring door UNESCO.', 'Pistas e historias del país misterioso, abreviadas y traducidas por Roviko y compartidas con la misma licencia. Sin respaldo de UNESCO.'),
    downloads: [{ label: l('Clues and original sources', 'Hints en oorspronkelijke bronnen', 'Pistas y fuentes originales'), href: '/data/mosaic-facts.json' }] },
  { name: 'Natural Earth · world-atlas 2.0.2', provider: 'Natural Earth · Michael Bostock', year: '—', licence: 'Public domain · ISC', href: 'https://www.naturalearthdata.com/about/terms-of-use/', licenceHref: '/licenses/world-atlas-ISC.txt',
    usedFor: l('The world map in Pinpoint and your passport. Simplified geometry; very small countries may not be visible.', 'De wereldkaart in Pinpoint en in je paspoort. Vereenvoudigd; zeer kleine landen zijn niet altijd zichtbaar.', 'El mapa de Pinpoint y de tu pasaporte. Geometría simplificada; los países muy pequeños pueden no verse.'), downloads: [] },
  { name: 'flag-icons 7.5.0', provider: 'Panayiotis Lipiridis', year: '—', licence: 'MIT', href: 'https://github.com/lipis/flag-icons', licenceHref: '/licenses/flags-MIT.txt',
    usedFor: l('Flag images in the games and on country cards.', 'Vlaggen in de spellen en op de landenkaarten.', 'Banderas en los juegos y en las tarjetas de países.'), downloads: [] },
];

function Toc({ sections, t, locale }: { sections: Section[]; t: (k: string) => string; locale: 'en' | 'nl' | 'es' }) {
  return <nav className="doc-toc" aria-label={t('legalToc')}><p>{t('legalToc')}</p><ol>{sections.map(s => <li key={s.id}><a href={'#' + s.id}>{s.title[locale]}</a></li>)}</ol></nav>;
}

function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const { t, locale } = useApp();
  const L = locale as 'en' | 'nl' | 'es';
  const sections = kind === 'privacy' ? PRIVACY : TERMS;
  return <div className="page doc-page">
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
  return <div className="page doc-page">
    <PageHeader back={t('backLabel')} kicker={t('sourcesKicker')} title={t('sourceTitle')} lead={t('sourcesLead')}/>
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

export function InfoPage({ kind }: { kind: string }) {
  return kind === 'sources' ? <SourcesPage/> : <LegalPage kind={kind === 'terms' ? 'terms' : 'privacy'}/>;
}
