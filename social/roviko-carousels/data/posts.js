// The five carousel posts. Facts are checked against roviko/public/data/countries.json (capital, neighbours, area).
// view: span = degrees of longitude across the 1080 px frame (smaller = closer)
window.LEVELS = [
  { label: 'Easy', bg: '#1F806B', fg: '#FFFFFF' },
  { label: 'Medium', bg: '#36B3F5', fg: '#06224F' },
  { label: 'Hard', bg: '#F6B84B', fg: '#163B32' },
  { label: 'Very hard', bg: '#E5484D', fg: '#FFFFFF' },
  { label: 'Legend', bg: '#06224F', fg: '#F6B84B' },
];
window.POSTS = [
  { n: 1, region: 'Europe', next: 'Africa', countries: [
    { id: 'PRT', name: 'Portugal', flag: 'pt', span: 24, fact: 'Capital: Lisbon · its only neighbour is Spain' },
    { id: 'POL', name: 'Poland', flag: 'pl', span: 28, fact: 'Capital: Warsaw · 7 land neighbours' },
    { id: 'HUN', name: 'Hungary', flag: 'hu', span: 26, hint: 'Landlocked', fact: 'Capital: Budapest, on the Danube' },
    { id: 'LVA', name: 'Latvia', flag: 'lv', span: 24, hint: 'On the Baltic Sea', fact: 'Capital: Riga · the middle Baltic state' },
    { id: 'MDA', name: 'Moldova', flag: 'md', span: 22, hint: 'Landlocked, only 2 neighbours', fact: 'Capital: Chișinău · between Romania and Ukraine' },
  ] },
  { n: 2, region: 'Africa', next: 'Asia', countries: [
    { id: 'EGY', name: 'Egypt', flag: 'eg', span: 40, fact: 'Capital: Cairo · the Nile runs right through it' },
    { id: 'MDG', name: 'Madagascar', flag: 'mg', span: 40, fact: 'Capital: Antananarivo · the 4th-largest island on Earth' },
    { id: 'NGA', name: 'Nigeria', flag: 'ng', span: 36, hint: 'Africa’s most populous country', fact: 'Capital: Abuja (not Lagos)' },
    { id: 'ZMB', name: 'Zambia', flag: 'zm', span: 36, hint: 'Landlocked, with 8 neighbours', fact: 'Capital: Lusaka · shares Victoria Falls with Zimbabwe' },
    { id: 'BFA', name: 'Burkina Faso', flag: 'bf', span: 32, hint: 'Landlocked, in West Africa', fact: 'Capital: Ouagadougou · 6 land neighbours' },
  ] },
  { n: 3, region: 'Asia', next: 'the Americas', countries: [
    { id: 'JPN', name: 'Japan', flag: 'jp', span: 36, fact: 'Capital: Tokyo · made of thousands of islands' },
    { id: 'VNM', name: 'Vietnam', flag: 'vn', span: 36, fact: 'Capital: Hanoi · shaped like the letter S' },
    { id: 'KAZ', name: 'Kazakhstan', flag: 'kz', span: 64, hint: 'The world’s largest landlocked country', fact: 'Capital: Astana · 5 land neighbours' },
    { id: 'LAO', name: 'Laos', flag: 'la', span: 30, hint: 'Southeast Asia’s only landlocked country', fact: 'Capital: Vientiane · on the Mekong' },
    { id: 'KGZ', name: 'Kyrgyzstan', flag: 'kg', span: 32, hint: 'Landlocked, in Central Asia', fact: 'Capital: Bishkek · over 90% mountains' },
  ] },
  { n: 4, region: 'The Americas', next: 'the whole world', countries: [
    { id: 'CHL', name: 'Chile', flag: 'cl', span: 56, fact: 'Capital: Santiago · about 4,300 km long' },
    { id: 'PER', name: 'Peru', flag: 'pe', span: 40, fact: 'Capital: Lima · home of Machu Picchu' },
    { id: 'PRY', name: 'Paraguay', flag: 'py', span: 36, hint: 'Landlocked, in South America', fact: 'Capital: Asunción · one of only 2 landlocked countries in South America' },
    { id: 'GUY', name: 'Guyana', flag: 'gy', span: 30, hint: 'English is its official language', fact: 'Capital: Georgetown · South America’s only English-speaking country' },
    { id: 'BLZ', name: 'Belize', flag: 'bz', span: 22, hint: 'On the Caribbean coast', fact: 'Capital: Belmopan (not Belize City)' },
  ] },
  { n: 5, region: 'Around the world', next: null, countries: [
    { id: 'NOR', name: 'Norway', flag: 'no', span: 36, fact: 'Capital: Oslo · famous for its fjords' },
    { id: 'MNG', name: 'Mongolia', flag: 'mn', span: 52, fact: 'Capital: Ulaanbaatar · between Russia and China' },
    { id: 'NAM', name: 'Namibia', flag: 'na', span: 36, hint: 'On Africa’s Atlantic coast', fact: 'Capital: Windhoek · home of the Namib Desert' },
    { id: 'URY', name: 'Uruguay', flag: 'uy', span: 30, hint: 'Squeezed between two giants', fact: 'Capital: Montevideo · between Brazil and Argentina' },
    { id: 'TJK', name: 'Tajikistan', flag: 'tj', span: 32, hint: 'Landlocked, over 90% mountains', fact: 'Capital: Dushanbe · 4 land neighbours' },
  ] },
];
