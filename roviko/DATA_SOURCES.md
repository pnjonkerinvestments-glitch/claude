# Data sources and rights

Import date: **2026-09-08**. The build uses pinned package versions and ships source/licence files with the app. No competitor pages, question banks, databases, code, icons or screenshots were scraped or copied.

| Asset/data | Source/version | Licence | Attribution / treatment |
|---|---|---|---|
| 195-country catalog: ISO codes, names, Dutch names, capitals, area, region/subregion, coordinates, currencies, languages and land neighbours | [mledoze/countries](https://github.com/mledoze/countries), npm `world-countries` **5.1.0** | ODbL 1.0 | Mohammed Le Doze and contributors. Attribution at `/sources`; derived catalog downloadable at `/data/countries.json`; full licence at `/licenses/countries-ODbL.txt`. The derived geographic database is made available under ODbL 1.0. |
| Per-country GeoJSON geometries | Same `world-countries` 5.1.0 package, `data/*.geo.json` | Package data licence, ODbL 1.0 | Retained as local downloadable data in `/shapes/`. Included in the derived geographic database obligations; not relabelled as proprietary. |
| Simplified global map | Natural Earth through [world-atlas](https://github.com/topojson/world-atlas) **2.0.2**, `countries-110m.json` | Natural Earth data: public domain; world-atlas software: ISC | [Natural Earth terms](https://www.naturalearthdata.com/about/terms-of-use/). Made with Natural Earth. Michael Bostock ISC notice shipped under `/licenses/`. Converted deterministically to SVG paths by our own importer. |
| Country flag SVGs | [flag-icons](https://github.com/lipis/flag-icons) **7.5.0** | MIT | © Panayiotis Lipiridis. MIT notice shipped and linked. These specific vector assets use that licence; no blanket claim that every national emblem is unrestricted in every jurisdiction. |
| Interface icons | [Lucide](https://lucide.dev/), version in lockfile | ISC | Lucide contributors; licence included in `/licenses/lucide-ISC.txt`. |
| Fonts (since 1.14 only Fredoka and Manrope) | `@fontsource-variable/fredoka` 5.x, `@fontsource-variable/manrope` **5.3.0** | SIL Open Font License 1.1 | Self-hosted WOFF2 files; licences in `public/fonts/*-LICENSE`. No runtime font tracking requests. DM Sans, Space Grotesk, Nunito and Outfit were removed in 1.14. |
| Brand mark | Original SVG written for this project | Project original | `public/favicon.svg`; no existing logo was used as a reference. |
| Decorative globe | One original built-in image generation | Generated original asset | Stored as a compressed WebP. Decorative only; not a factual quiz map. |
| Sounds | Web Audio oscillators synthesized by project code | Project original | No downloaded recordings. Off by default. |
| Question templates and interface copy | Written for this project | Project original | No imported quiz bank or competitor copy. |

## Definition and caveats

The 195-country set uses `unMember` plus Vatican City and Palestine. This is a reproducible content convention, not a sovereignty claim. Other ISO territories in the upstream 250-record source are excluded from V1 questions. Sensitive Israel/Palestine capital questions and selected Russia/Ukraine/Israel/Palestine border questions are excluded centrally. The world basemap retains the Natural Earth source boundaries; they are not endorsements and may reflect different territorial conventions from the country roster.

The 1:110m rendered basemap contains 177 geometries and does not visibly depict every microstate. Full source geometry files are provided for all 195 records. New Pinpoint sessions use derived country polygons with an explicit 25 km boundary tolerance; countries of 25 km² or less and centrally excluded sensitive targets are omitted. Legacy sessions retain their representative-coordinate rule, now explained. This is educational geometry, not a navigation service.

The explicit capital handling retains all three South African capitals; Sri Jayawardenepura Kotte is used for Sri Lanka. Capital questions acknowledge multiple source capitals. Common alternate spellings are conservatively accepted. Geographic edits remain reviewable through reports and the source import.

The country catalog itself has no population or highest-point observations. Side by Side separately uses the verified 2023 World Bank snapshot documented below. Mosaic now uses the separately documented country-metrics snapshot for highest points and other numerical facts. Size Shuffle uses catalog area. No observation is labelled with its import year as if that were its reference year.

Native emoji are rendered as Unicode text using each device’s emoji font. No competitor icons, screenshots, illustrations or font assets were imported for the 1.1 interface update.


## September 9, 2026 puzzle datasets

| Dataset | Source | Licence | Import and changes |
|---|---|---|---|
| Ten statistical indicators, 1,884 country observations | [The World Bank: World Development Indicators](https://datacatalog.worldbank.org/search/dataset/0037712/world-development-indicators), official V2 API | CC BY 4.0 with [World Bank additional terms](https://www.worldbank.org/ext/en/legal/terms-conditions/datasets); each selected indicator’s official page independently displays CC BY-4.0 | Imported 2026-09-09. Reference year **2023** for every observation. Filtered to the country roster; missing observations omitted, no interpolation. Only presentation values are rounded. |
| 195 derived silhouettes | Pinned `world-countries` 5.1.0 per-country geometry above | ODbL 1.0 | Derived 2026-09-09 by `scripts/prepare-silhouettes.py`. Retains components at least 2.5% of the largest ring’s coordinate-plane area, omits remote components, unwraps the date line, applies local longitude scaling, simplifies and normalizes to a north-up SVG path. They are educational main-landmass silhouettes, not complete territorial outlines. |

Both snapshots are downloadable under `/data/`; per-country original geometry remains under `/shapes/`. All indicator metadata retain the exact provider credit, API URL, provider definition, source update date, licence metadata URL, licence-check date, reference year and source ID. Each country value inherits the explicit year/source metadata of its indicator; no unlabelled live value is used.

| Subject | WDI indicator | 2023 country coverage |
|---|---|---|
| Population | SP.POP.TOTL | 194 |
| Urban population share | SP.URB.TOTL.IN.ZS | 194 |
| Life expectancy at birth | SP.DYN.LE00.IN | 194 |
| Fertility | SP.DYN.TFRT.IN | 194 |
| GDP per capita, current US dollars | NY.GDP.PCAP.CD | 188 |
| GDP, current US dollars | NY.GDP.MKTP.CD | 188 |
| Forest area share | AG.LND.FRST.ZS | 194 |
| Agricultural land share | AG.LND.AGRI.ZS | 193 |
| Exports relative to GDP | NE.EXP.GNFS.ZS | 166 |
| Individuals using the internet | IT.NET.USER.ZS | 179 |

Attribution: **The World Bank: World Development Indicators**. Original providers include national statistical offices, UN Population Division, Eurostat, OECD, FAO and ITU, with exact credits retained per indicator in `/data/comparisons.json`. The site’s source page repeats this attribution and links both the snapshot and licence terms. No energy dataset with a noncommercial restriction is used. The importer stops if a selected indicator’s licence metadata changes.

Four additional comparison subjects are derived only from the separately licensed country catalog: total area, land-neighbour count, latitude and distance of the representative point from the equator. Comparisons use the same metric and reference year on both sides, omit equal/visually rounded-tied values, and show definitions that distinguish GDP from salary, percentages from totals and representative points from borders. Sensitive border comparisons and country-mosaic exclusions are configured in `GEOGRAPHY_POLICY.puzzleSensitiveCountries`.


## 1.3 visual assets (2026-09-09)
- Manrope variable and Outfit variable: self-hosted Latin WOFF2 files from the corresponding `@fontsource-variable` packages, SIL Open Font License 1.1. Original licenses included in `public/fonts/*-LICENSE`.
- Nunito variable and Fredoka variable (added in the playful visual refresh): self-hosted Latin and Latin Extended WOFF2 files from `@fontsource-variable/nunito` 5.x and `@fontsource-variable/fredoka` 5.x, SIL Open Font License 1.1. Original licenses included in `public/fonts/nunito-LICENSE` and `public/fonts/fredoka-LICENSE`; linked from `/sources`.
- Friendly globe mark: original image generated for Roviko, 2026-09-09; local transparent WebP and PNG derivatives. Decorative stylized continents, never used as factual quiz geometry. No competitor visual assets used.

## September 10 country-boundary derivative

`public/data/boundaries.json` is derived from all 195 existing world-countries 5.1.0 geometry files, under ODbL 1.0 with the existing attribution. `scripts/prepare-boundaries.py` preserves each polygon and ring, applies 0.025-degree Douglas–Peucker simplification (retaining original tiny rings when necessary), and rounds coordinates to five decimals. It is downloadable from the sources page under the same licence. The disclosed 25 km tolerance accounts for simplified boundaries and touch input, rather than a hidden distance to a centre. Dataset release identifier: `atlas-2026-09-10-r2`. No additional external data was imported for this derivative.


## September 11, 2026 travel atelier

- Three original decorative SVG illustrations are authored in `components/atelier/GameArtwork.tsx`: a stamped travel document, two landscape cards and four clue tiles. They use simple project-native vectors requested in the brief. The abstract land forms are not factual quiz geometry. No image or vector is traced from a competitor.
- Country stamps, region seals, layout, motion and bilingual microcopy are original project work. They reuse the existing MIT flag files and existing ODbL country names. The discovery map reuses the credited Natural Earth/world-atlas SVG-path data; the full country-stamp list includes countries not visible at 1:110m.
- Existing generated globe WebP, original oscillators, bundled flag/icons, geometry snapshots and self-hosted OFL font files were retained. No new third-party data or downloadable audio was added. Existing licence notices remain shipped; `/sources` now links Manrope, Outfit and Lucide notices explicitly.
- Contrast checking identified and corrected low-contrast secondary text on the lavender light card and turquoise dark card. See `docs/QA_1_6.md` for measured pairs and limits.
- Existing source-page Pinpoint text incorrectly described all games as centre-distance questions; corrected to disclose the new boundary rule and preserved legacy rule.
- Brand-name availability and jurisdiction-specific emblem restrictions are not cleared by this asset provenance review.

## September 21, 2026: curated Mosaic clues and game covers

| Material | Source / licence | Import and modifications |
|---|---|---|
| 80 bilingual Mosaic clues, 40 country/property records | [UNESCO World Heritage Centre](https://whc.unesco.org/en/list/), individual property descriptions under [CC BY-SA 3.0 IGO](https://creativecommons.org/licenses/by-sa/3.0/igo/). The source’s [licence metadata](https://whc.unesco.org/en/licenses/6) was checked. | 2026-09-21. Short original English paraphrases, Dutch translations, and a learning explanation per property. No photos, emblems or separately credited third-party material. Each property retains its exact title, URL and verification date in `lib/data/mosaic-facts.json`, identically downloadable at `/data/mosaic-facts.json`. Adaptations by Roviko, offered under the same licence; no UNESCO endorsement implied. |
| Three daily game covers | Original image generation for Roviko, 2026-09-21 | Travel document, two landscape postcards and four abstract clue tiles. Decorative only, separate from factual flags/silhouettes. Generation prompts are recorded in `docs/ARTWORK_1_7.md`. Local 480px and 960px WebP exports total approximately 101 KB. They replace the earlier SVG covers in the interface. No competitor artwork was supplied or imitated. |

The local authoring/export source is `scripts/content/prepare-mosaic-facts.py`; it never scrapes a site. Run it to regenerate both identical JSON files. All property-derived clue/explanation text in this script and the JSON exports is under CC BY-SA 3.0 IGO with the above attribution; this does not relicense unrelated game code. The catalogue-wide licence and attribution apply to every record. Each newly generated fact tile retains its selected variant, explanation, source provider, licence and check date. Sources appear in the solved-country disclosure and sources page.

Normal four- and five-clue Mosaic boards use this verified 40-country collection, with two variants per country. Three-clue boards retain the broader eligible shape collection. Targeted practice from older sessions can include a country outside the curated collection; its area/border clue is generated from the separately credited ODbL country catalogue and is labelled accordingly. No regional filler is used for new normal boards. Already stored daily boards and sessions are immutable and keep their original facts. New dataset release: `atlas-2026-09-21-r3`.


## 1.8 numerical country facts (imported 2026-09-21)

`lib/data/country-metrics.json` and the identical public download add 731 archived observations: 188 highest points, 188 coastline lengths, 162 mean elevations and 193 median ages. The importer is `scripts/content/import-country-metrics.py`. It downloads the pinned `factbook/factbook.json` revision `144d6977b2b01ac1cbd220de754c0a005616760b`, whose repository releases its data under CC0 1.0. The complete licence is shipped at `/licenses/factbook-CC0.txt`.

- Source archive: https://github.com/factbook/factbook.json/tree/144d6977b2b01ac1cbd220de754c0a005616760b
- Original publisher: CIA, The World Factbook. The CIA discontinued the publication in February 2026. This is an explicitly archived source, not a claim of current/live statistics.
- Country mapping uses source GEC/FIPS identifiers, not guessed ISO codes. The exact mapping, source profile URL, raw measurement, year (when supplied), estimate marker and import date are retained in the JSON.
- Only unambiguous single numerical observations are imported. Missing fields and ranges are omitted; zero coastline is not used as a clue. Geography with no stated reference year displays “Archived source”; the import date is never substituted for a reference year.
- The Netherlands' highest point is omitted because the examined sources disagree. The German highest point is corrected to **2,962 m**, the factual observation published by the mountain operator, Bayerische Zugspitzbahn: https://zugspitze.de/en/Our-mountain-worlds/The-areas/Zugspitze. It has its own source ID and URL. No copyrighted descriptive passage is imported from that page.
- **Median age** is the middle age of the population, not its arithmetic mean and not life expectancy. **Coastline length** depends on the measuring method and source territorial convention. **GDP per person** is not personal income. These distinctions appear in the learning explanation.

The Mosaic fact engine combines these observations with the existing ten WDI indicators (reference year 2023) and catalogue area. This provides 15 subject categories and at least two available categories for each of the 195 countries. One numerical clue is shown for each country on a four/five-clue board. Its subject advances with the UTC date; duplicate displayed clues within a board are avoided. Three-clue boards have no fact tile. Country-selection exclusions remain in `GEOGRAPHY_POLICY`.

The earlier UNESCO catalogue remains available under its original CC BY-SA 3.0 IGO terms for attribution and historical inspection. It no longer supplies new Mosaic clues.

### Native app derivatives

`node scripts/prepare-ios-assets.mjs` rasterizes the project's existing MIT flag SVGs into 480px PNGs for native iOS rendering and the optional `/api/flag/<opaque-question-id>?format=png` endpoint. It also resizes the original Roviko globe and game-cover artwork. These operations introduce no external artwork. The native bundle includes country data, country outlines and country boundaries under **ODbL 1.0**, with downloadable counterparts and full licence notices. Native SwiftUI maps use these country boundaries, not the separately licensed Natural Earth display map. SF Symbols and system emoji are rendered through Apple's platform APIs rather than copied into a proprietary icon pack.


## Rank Radar derivatives — 2026-09-22

Rank Radar derives ordered positions from the **existing** licensed country catalog, 2023 World Bank snapshot and Factbook archive described above. No competitor question bank, ranking dataset or assets were imported. The derivation filters to the 195-country roster, removes missing observations, assigns competition ranks, retains source years and displays observation coverage. Median age is consistently the 2025 estimate. Source-specific corrections (including the Zugspitze operator's numeric fact) retain their own source label and URL. Unknown geographic years are explicitly unstated. See `GAME_RULES.md` for normalization and tie handling.

`public/art/rank-radar-{480,960}.webp` is original generated decorative artwork created for Roviko on 2026-09-22: a blue/white globe, ascending rounded columns and a small compass on an apricot background. It is not geographic quiz data and includes no competitor references, logos or assets. The native `Rank.imageset` is a resized PNG derivative. Creation prompt and review are recorded in `docs/ARTWORK_1_9.md`.

## Spanish localization — 2026-09-23

`i18n/countries-es.json` is derived from Spanish common names in the already licensed `world-countries` 5.1.0 snapshot (ODbL 1.0, Mohammed Le Doze and contributors). `i18n/terms-es.json` renders the existing ISO currency/language identifiers with the runtime’s Spanish ICU/CLDR display names. Capital exonyms and interface/template translations are authored for Roviko. No geographic observations or source years were changed.

The 40 heritage records (80 clues plus explanations) in both copies of `mosaic-facts.json` now include Spanish adaptations by Roviko, 2026-09-23. These adaptations retain CC BY-SA 3.0 IGO, all original property URLs, attribution and no-endorsement notice. The `/sources` page is also available in Spanish.

## 1.11 daily competition

Daily scores/ranks use first-party gameplay records; no external leaderboard or competitor data is imported. Clue Trail reuses the existing licensed country/capital/border catalog. The Clue Trail card's compass-and-path SVG in `components/atelier/GameCover.tsx` was authored for Roviko in this release and uses no external image asset. Existing flag, geometry, metric, font and illustration attributions remain unchanged.

## Flag optimisation (1.15.1)

Nine flag-icons flags with detailed coats of arms (bo, do, es, gt, hr, me, mx, rs, sv) are served as a 640×480 WebP rendering of the original flag-icons 7.5.0 SVG, wrapped in an SVG with the same viewBox (`scripts/optimize-flags.mjs`). The artwork is unchanged; the MIT licence of flag-icons continues to apply.

## Illustrations 1.16

Since 1.16 the game covers, page-header scenes, explore postcards, region landscapes and friends artwork in `public/art/` come from design mockups the owner supplied for Roviko (September 2026; a flat cartoon style with the Roviko globe). They were cut out, cleaned and exported as WebP. No new third-party or competitor artwork was added. They are decorative only. The flags drawn inside the region landscapes are illustration, not quiz data. Every flag or shape used in questions and answers still comes from the licensed data above. The earlier clay-style covers (see `docs/ARTWORK_1_7.md` and `docs/ARTWORK_1_9.md`) are replaced in the interface.
