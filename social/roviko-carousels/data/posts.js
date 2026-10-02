// The carousel posts (1-5, then round 2: 6-10). Facts are checked against roviko/public/data/countries.json (capital, neighbours, area).
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
  { n: 6, region: 'Europe', next: 'Africa', countries: [
    { id: 'GRC', name: 'Greece', flag: 'gr', span: 24, fact: 'Capital: Athens · about 6,000 islands' },
    { id: 'HRV', name: 'Croatia', flag: 'hr', span: 22, fact: 'Capital: Zagreb · shaped like a croissant' },
    { id: 'CHE', name: 'Switzerland', flag: 'ch', span: 20, hint: 'Landlocked, in the Alps', fact: 'Capital: Bern · 4 national languages' },
    { id: 'LTU', name: 'Lithuania', flag: 'lt', span: 22, hint: 'The southernmost Baltic state', fact: 'Capital: Vilnius · 4 land neighbours' },
    { id: 'MKD', name: 'North Macedonia', flag: 'mk', span: 18, hint: 'Landlocked, in the Balkans', fact: 'Capital: Skopje · 4 land neighbours' },
  ] },
  { n: 7, region: 'Africa', next: 'Asia', countries: [
    { id: 'MAR', name: 'Morocco', flag: 'ma', span: 36, fact: 'Capital: Rabat (not Marrakesh)' },
    { id: 'SOM', name: 'Somalia', flag: 'so', span: 36, fact: 'Capital: Mogadishu · on the Horn of Africa' },
    { id: 'MLI', name: 'Mali', flag: 'ml', span: 40, hint: 'Landlocked, with 7 neighbours', fact: 'Capital: Bamako · home of Timbuktu' },
    { id: 'MWI', name: 'Malawi', flag: 'mw', span: 26, hint: 'Landlocked, along a giant lake', fact: 'Capital: Lilongwe · Lake Malawi covers about a fifth of it' },
    { id: 'SWZ', name: 'Eswatini', flag: 'sz', span: 18, hint: 'Almost surrounded by South Africa', fact: 'Capitals: Mbabane and Lobamba · formerly Swaziland' },
  ] },
  { n: 8, region: 'Asia', next: 'the Americas', countries: [
    { id: 'IND', name: 'India', flag: 'in', span: 44, fact: 'Capital: New Delhi · 6 land neighbours' },
    { id: 'THA', name: 'Thailand', flag: 'th', span: 30, fact: 'Capital: Bangkok · shaped like an elephant’s head' },
    { id: 'IRN', name: 'Iran', flag: 'ir', span: 36, hint: 'Between the Caspian and the Gulf', fact: 'Capital: Tehran · 7 land neighbours' },
    { id: 'KHM', name: 'Cambodia', flag: 'kh', span: 22, hint: 'Between Thailand and Vietnam', fact: 'Capital: Phnom Penh · home of Angkor Wat' },
    { id: 'TKM', name: 'Turkmenistan', flag: 'tm', span: 36, hint: 'On the Caspian Sea, in Central Asia', fact: 'Capital: Ashgabat · the Karakum Desert covers about 70% of it' },
  ] },
  { n: 9, region: 'The Americas', next: 'the world', countries: [
    { id: 'MEX', name: 'Mexico', flag: 'mx', span: 50, fact: 'Capital: Mexico City · 3 land neighbours' },
    { id: 'ARG', name: 'Argentina', flag: 'ar', span: 50, fact: 'Capital: Buenos Aires · the 8th-largest country on Earth' },
    { id: 'CUB', name: 'Cuba', flag: 'cu', span: 26, hint: 'The largest island in the Caribbean', fact: 'Capital: Havana · no land neighbours' },
    { id: 'BOL', name: 'Bolivia', flag: 'bo', span: 34, hint: 'Landlocked, in the Andes', fact: 'Capital: Sucre (the government sits in La Paz)' },
    { id: 'NIC', name: 'Nicaragua', flag: 'ni', span: 18, hint: 'The largest country in Central America', fact: 'Capital: Managua · between Honduras and Costa Rica' },
  ] },
  { n: 10, region: 'Around the world', next: null, countries: [
    { id: 'NZL', name: 'New Zealand', flag: 'nz', span: 30, fact: 'Capital: Wellington (not Auckland)' },
    { id: 'ISL', name: 'Iceland', flag: 'is', span: 26, fact: 'Capital: Reykjavik · the world’s northernmost capital' },
    { id: 'LKA', name: 'Sri Lanka', flag: 'lk', span: 14, hint: 'An island just south of India', fact: 'Capital: Sri Jayawardenepura Kotte' },
    { id: 'PNG', name: 'Papua New Guinea', flag: 'pg', span: 30, hint: 'Shares an island with Indonesia', fact: 'Capital: Port Moresby · over 800 languages' },
    { id: 'OMN', name: 'Oman', flag: 'om', span: 28, hint: 'On the Arabian Peninsula', fact: 'Capital: Muscat · 3 land neighbours' },
  ] },
];
