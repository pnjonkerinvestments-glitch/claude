// Content week 5 (16-22 Nov 2026): the 7 explainers ("Roviko explains"), one a day, for src/w5-explain.js.
// Each scene: say (the line the voice reads), cam [lon0, lat0, lon1, lat1], hl (countries lit up), col, label, extras.
// Facts are well-known and checkable; areas and country lists from roviko.app data.
const CA7 = ['GTM', 'BLZ', 'HND', 'SLV', 'NIC', 'CRI', 'PAN'];
const CARIB = ['CUB', 'HTI', 'DOM', 'JAM', 'BHS', 'TTO', 'BRB', 'GRD', 'LCA', 'VCT', 'DMA', 'ATG', 'KNA'];
const SA12 = ['COL', 'VEN', 'GUY', 'SUR', 'ECU', 'PER', 'BRA', 'BOL', 'PRY', 'CHL', 'ARG', 'URY'];
const LATIN = ['MEX', 'GTM', 'HND', 'SLV', 'NIC', 'CRI', 'PAN', 'CUB', 'DOM', 'HTI', 'COL', 'VEN', 'ECU', 'PER', 'BRA', 'BOL', 'PRY', 'CHL', 'ARG', 'URY'];
const HISP = LATIN.filter(c => c !== 'BRA' && c !== 'HTI');
const AFRICA = ['DZA', 'AGO', 'BEN', 'BWA', 'BFA', 'BDI', 'CPV', 'CMR', 'CAF', 'TCD', 'COM', 'COG', 'COD', 'DJI', 'EGY', 'GNQ', 'ERI', 'SWZ', 'ETH', 'GAB', 'GMB', 'GHA', 'GIN', 'GNB', 'CIV', 'KEN', 'LSO', 'LBR', 'LBY', 'MDG', 'MWI', 'MLI', 'MRT', 'MUS', 'MAR', 'MOZ', 'NAM', 'NER', 'NGA', 'RWA', 'STP', 'SEN', 'SYC', 'SLE', 'SOM', 'ZAF', 'SSD', 'SDN', 'TZA', 'TGO', 'TUN', 'UGA', 'ZMB', 'ZWE'];
const OCEANIA = ['AUS', 'FJI', 'FSM', 'KIR', 'MHL', 'NRU', 'NZL', 'PLW', 'PNG', 'SLB', 'TON', 'TUV', 'VUT', 'WSM'];
const AMERICAS = [-130, -57, -30, 62], WORLD = [-170, -58, 180, 80];
window.W5EX = {
  1: { title: ['Latin America vs', 'South America?'], song: 'games-worldbeat', tempo: 115.993, scenes: [
    { say: 'North America. Central America. South America. Latin America. They are not the same thing. Here is the difference.', cam: AMERICAS },
    { say: 'North America is the whole top of the map: Canada, the United States and Mexico. As a continent, it also includes Central America and the Caribbean.', cam: [-150, 5, -50, 72],
      hl: ['CAN', 'USA', 'MEX', ...CA7, ...CARIB], col: '#5ED34F', label: 'NORTH AMERICA', at: [-100, 48] },
    { say: 'Central America is the thin bridge in between: seven countries, from Guatemala down to Panama.', cam: [-95, 5, -74, 20], hl: CA7, col: '#FFD60A', label: 'CENTRAL AMERICA', at: [-86, 17.5] },
    { say: 'South America starts at Colombia and runs all the way down to Cape Horn. Twelve countries.', cam: [-90, -57, -30, 14], hl: SA12, col: '#5AC8FA', label: 'SOUTH AMERICA', at: [-60, -12] },
    { say: 'Latin America is not about land at all. It is about language: the countries where Spanish, Portuguese or French is spoken, from Mexico to Argentina.', cam: [-120, -57, -32, 33], hl: LATIN, col: '#FF9F0A', label: 'LATIN AMERICA', at: [-62, -8] },
    { say: 'Hispanic America is only the Spanish-speaking part. So Brazil is in Latin America, but not in Hispanic America.', cam: [-120, -57, -32, 33], hl: HISP, col: '#FF6B9A', label: 'HISPANIC AMERICA', at: [-78, -20], grey: ['BRA'] },
    { say: 'And here is the twist. French Guiana is part of France. So the European Union reaches all the way to the Amazon.', cam: [-64, -6, -46, 10], hl: ['FRA'], col: '#0A84FF', label: 'FRENCH GUIANA', at: [-53, 4], fact: true },
    { say: 'Follow Roviko for a new map, explained, every day.', cam: AMERICAS, outro: true },
  ] },
  2: { title: ['Scandinavia vs the', 'Nordic countries?'], song: 'funkee-monkeee', tempo: 120.384, scenes: [
    { say: 'Scandinavia and the Nordic countries. Most people mix them up. Here is the difference.', cam: [-30, 50, 45, 72] },
    { say: 'Scandinavia is just three kingdoms: Denmark, Norway and Sweden. Their languages are so close that they can mostly understand each other.', cam: [0, 53, 32, 71.5],
      hl: ['DNK', 'NOR', 'SWE'], col: '#5AC8FA', label: 'SCANDINAVIA', at: [15, 63] },
    { say: 'The Nordic countries add two more: Finland and Iceland. Five countries in total.', cam: [-26, 53, 34, 71.5], hl: ['DNK', 'NOR', 'SWE', 'FIN', 'ISL'], col: '#5ED34F', label: 'THE NORDIC COUNTRIES', at: [10, 66] },
    { say: 'Finland is not Scandinavian. Finnish is not even related to Swedish. Its closest big relative is Estonian, and further away, Hungarian.', cam: [18, 57, 34, 71], hl: ['FIN'], col: '#BF5AF2', label: 'FINLAND', at: [26, 63] },
    { say: 'And Icelandic has changed so little that Icelanders can still read sagas written about eight hundred years ago.', cam: [-26, 62, -11, 67.5], hl: ['ISL'], col: '#FFD60A', label: 'ICELAND', at: [-18.5, 65] },
    { say: 'Fun fact: count every fjord and island, and Norway\'s coast is about one hundred thousand kilometres long. That is two and a half times around the Earth.', cam: [3, 57, 32, 72], hl: ['NOR'], col: '#FF9F0A', label: 'NORWAY', at: [12, 64], fact: true },
    { say: 'Follow Roviko for a new map, explained, every day.', cam: [-30, 50, 45, 72], outro: true },
  ] },
  3: { title: ['Where does Europe', 'end and Asia begin?'], song: 'mi-gente', tempo: 110.002, scenes: [
    { say: 'Where does Europe end and Asia begin? There is no ocean in between, so people drew a line.', cam: [5, 30, 95, 72] },
    { say: 'The usual line runs down the Ural Mountains, along the Ural River to the Caspian Sea, over the Caucasus, and through the Black Sea to Istanbul.', cam: [15, 33, 80, 72],
      line: [[66, 69], [60.5, 67.5], [59.3, 62], [59.5, 56], [59, 51.5], [55, 51.4], [52.5, 48.5], [51.8, 47], [49.6, 42.6], [47.5, 42.3], [43, 43.3], [39.8, 43.5], [37.6, 45.2], [33.5, 43.4], [29.2, 41.3], [26.4, 40.2]],
      labels: [['EUROPE', 35, 58, '#5AC8FA'], ['ASIA', 68, 52, '#FF9F0A']] },
    { say: 'Depending on where you draw it, the line cuts right through five countries: Russia, Kazakhstan, Georgia, Azerbaijan and Türkiye.', cam: [20, 33, 90, 72], hl: ['RUS', 'KAZ', 'GEO', 'AZE', 'TUR'], col: '#FF9F0A', label: 'ON TWO CONTINENTS', at: [50, 56], lineStay: true },
    { say: 'Most of Russia\'s land is in Asia. But most Russians live in Europe.', cam: [25, 40, 180, 78], hl: ['RUS'], col: '#BF5AF2', label: 'RUSSIA', at: [95, 62], lineStay: true },
    { say: 'And Istanbul sits on both sides of the Bosphorus. A ferry takes you from Europe to Asia in about twenty minutes.', cam: [22, 36.5, 36, 44.5], hl: ['TUR'], col: '#5ED34F', label: 'ISTANBUL', at: [29, 41.6], fact: true, ring: [29.0, 41.05] },
    { say: 'Follow Roviko for a new map, explained, every day.', cam: [5, 30, 95, 72], outro: true },
  ] },
  4: { title: ['Africa is way bigger', 'than you think'], song: 'ko-games', tempo: 110.992, scenes: [
    { say: 'Africa is way bigger than most people think. Let me show you.', cam: WORLD },
    { say: 'Its 54 countries cover about thirty million square kilometres.', cam: [-22, -37, 55, 38], hl: AFRICA, col: '#FF9F0A', label: 'AFRICA', at: [18, 5] },
    { say: 'Here is the United States, at the same scale.', cam: [-22, -37, 55, 38], hl: AFRICA, col: '#FF9F0A', dim: true, shapes: [['USA', 14, 18]] },
    { say: 'Add China.', cam: [-22, -37, 55, 38], hl: AFRICA, col: '#FF9F0A', dim: true, shapes: [['USA', 14, 18], ['CHN', 22, -12]] },
    { say: 'And India. All three fit inside Africa, and there is still room to spare.', cam: [-22, -37, 55, 38], hl: AFRICA, col: '#FF9F0A', dim: true, shapes: [['USA', 14, 18], ['CHN', 22, -12], ['IND', 38, 4]] },
    { say: 'So why does it look smaller? Most web maps stretch everything far from the equator. Countries in the north look much bigger than they really are.', cam: WORLD, hl: AFRICA, col: '#FF9F0A', fact: true, label: 'MAPS STRETCH THE NORTH', at: [10, 52] },
    { say: 'Follow Roviko for a new map, explained, every day.', cam: WORLD, outro: true },
  ] },
  5: { title: ['The 13 countries', 'on the equator'], song: 'take-this-higher', tempo: 124.01, scenes: [
    { say: 'The equator is about forty thousand kilometres long. It passes through just thirteen countries.', cam: [-95, -35, 180, 35], equator: true },
    { say: 'In South America: Ecuador, Colombia and Brazil. Ecuador is even named after it.', cam: [-84, -14, -32, 12], hl: ['ECU', 'COL', 'BRA'], col: '#5AC8FA', label: 'SOUTH AMERICA', at: [-58, -10], equator: true },
    { say: 'In Africa, seven: São Tomé and Príncipe, Gabon, the Republic of the Congo, DR Congo, Uganda, Kenya and Somalia.', cam: [2, -12, 52, 12], hl: ['STP', 'GAB', 'COG', 'COD', 'UGA', 'KEN', 'SOM'], col: '#FF9F0A', label: 'AFRICA', at: [26, -9], equator: true },
    { say: 'And across the Indian Ocean and the Pacific: the Maldives, Indonesia and Kiribati.', cam: [68, -14, 180, 12], hl: ['MDV', 'IDN', 'KIR'], col: '#5ED34F', label: 'ASIA AND THE PACIFIC', at: [125, 8], equator: true },
    { say: 'Fun fact: the highest point on the equator is on Cayambe, a volcano in Ecuador. It has snow, right on the equator.', cam: [-81.5, -3, -75, 2.5], hl: ['ECU'], col: '#FFFFFF', label: 'CAYAMBE', at: [-78, 1.2], fact: true, equator: true, ring: [-77.99, 0.03] },
    { say: 'Follow Roviko for a new map, explained, every day.', cam: [-95, -35, 180, 35], outro: true, equator: true },
  ] },
  6: { title: ['Australia, Australasia', 'or Oceania?'], song: 'light-it-up-boy', tempo: 118.998, scenes: [
    { say: 'Australia, Australasia, Oceania. Three names, three different things.', cam: [105, -50, 180, 5] },
    { say: 'Australia is a country. It is also a continent, and the only country that covers a whole continent.', cam: [108, -45, 158, -8], hl: ['AUS'], col: '#FF9F0A', label: 'AUSTRALIA', at: [134, -25] },
    { say: 'Australasia usually means Australia, New Zealand and New Guinea, with the islands nearby.', cam: [108, -50, 180, 0], hl: ['AUS', 'NZL', 'PNG'], col: '#5AC8FA', label: 'AUSTRALASIA', at: [140, -30] },
    { say: 'Oceania is the big one: fourteen countries spread across the Pacific, and most of them are islands.', cam: [105, -50, 180, 20], hl: OCEANIA, col: '#5ED34F', label: 'OCEANIA', at: [150, -28] },
    { say: 'Fun fact: Kiribati is the only country in all four hemispheres. North and south, east and west.', cam: [160, -12, 180, 8], hl: ['KIR'], col: '#FFD60A', label: 'KIRIBATI', at: [172.5, 4.5], fact: true, equator: true, ring: [173.0, 1.4] },
    { say: 'Follow Roviko for a new map, explained, every day.', cam: [105, -50, 180, 5], outro: true },
  ] },
  7: { title: ['Countries inside', 'other countries'], song: 'upbeat-jazz', tempo: 110.004, scenes: [
    { say: 'Only three countries in the world are completely surrounded by just one other country. Can you name them?', cam: [-25, -40, 60, 55] },
    { say: 'Number one: Lesotho, inside South Africa. It is the only country that lies entirely above one thousand metres.', cam: [14, -36, 34, -21], hl: ['LSO'], col: '#FF9F0A', label: 'LESOTHO', at: [28.2, -27.6], grey: ['ZAF'] },
    { say: 'Number two: San Marino, inside Italy. It is one of the oldest republics in the world.', cam: [6, 36.5, 19, 47.2], hl: ['SMR'], col: '#5AC8FA', label: 'SAN MARINO', at: [12.45, 44.6], grey: ['ITA'], ring: [12.46, 43.94] },
    { say: 'And number three: Vatican City, inside Rome. At just zero point four four square kilometres, it is the smallest country on Earth.', cam: [6, 36.5, 19, 47.2], hl: ['VAT'], col: '#FFD60A', label: 'VATICAN CITY', at: [12.45, 42.6], grey: ['ITA'], ring: [12.45, 41.9] },
    { say: 'So Italy completely surrounds two whole countries. Did you get all three?', cam: [6, 36.5, 19, 47.2], hl: ['SMR', 'VAT'], col: '#5ED34F', label: 'ITALY: TWO INSIDE', at: [12.5, 45.8], grey: ['ITA'], fact: true },
    { say: 'Follow Roviko for a new map, explained, every day.', cam: [-25, -40, 60, 55], outro: true },
  ] },
};
