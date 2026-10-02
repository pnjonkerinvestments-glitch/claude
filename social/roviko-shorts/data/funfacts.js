// "Sounds fake, but it's true": 10 country facts as a quiz. Every fact is checked (sources in FUN-FACTS-CAPTIONS.md).
// q: question lines; opts: A/B/C; right: index of the true answer; out: order the wrong ones are knocked out
// (the tempting one goes last); fact / bonus: caption lines (<b> green); scene: the explainer drawn in fun-fact.html.
window.FUN_FACTS = [
  { scene: 'border', q: ['France’s longest land border', 'is with which country?'], opts: ['Spain', 'Belgium', 'Brazil'], right: 2, out: [1, 0],
    fact: ['France’s longest border', 'is with <b>Brazil</b>'], bonus: ['<b>Bonus:</b> France also borders', 'the <b>Netherlands</b>'] },
  { scene: 'pyramids', q: ['Which country has', 'the most pyramids?'], opts: ['Egypt', 'Mexico', 'Sudan'], right: 2, out: [1, 0],
    fact: ['<b>Sudan</b> has about twice', 'as many pyramids as Egypt'], bonus: ['<b>Bonus:</b> Sudan’s pyramids', 'are way <b>steeper</b>'] },
  { scene: 'rivers', q: ['Which country has', 'zero permanent rivers?'], opts: ['Saudi Arabia', 'Australia', 'Mongolia'], right: 0, out: [2, 1],
    fact: ['<b>Saudi Arabia</b> has', '<b>zero</b> permanent rivers'], bonus: ['<b>Bonus:</b> so it drinks', 'the <b>sea</b> instead'] },
  { scene: 'lakes', q: ['Which country has more lakes than', 'the rest of the world combined?'], opts: ['Finland', 'Canada', 'Russia'], right: 1, out: [2, 0],
    fact: ['<b>Canada</b>: more lakes than', 'the rest of the world'], bonus: ['<b>Bonus:</b> it also has the', 'world’s <b>longest coastline</b>'] },
  { scene: 'landlocked', q: ['Which country needs to cross', '<b>2 borders</b> to reach the sea?'], opts: ['Switzerland', 'Liechtenstein', 'Austria'], right: 1, out: [2, 0],
    fact: ['<b>Liechtenstein:</b> 2 borders', 'between it and the sea'], bonus: ['<b>Bonus:</b> Liechtenstein', 'has <b>no airport</b>'] },
  { scene: 'islands', q: ['Which country has', 'the most islands?'], opts: ['Indonesia', 'Philippines', 'Sweden'], right: 2, out: [1, 0],
    fact: ['<b>Sweden</b> has', '<b>267,570</b> islands'], bonus: ['<b>Bonus:</b> only <b>984</b> of', 'them have people on them'] },
  { scene: 'timezones', q: ['Which country has', 'the most time zones?'], opts: ['Russia', 'USA', 'France'], right: 2, out: [1, 0],
    fact: ['<b>France</b> has', '<b>12</b> time zones'], bonus: ['<b>Bonus:</b> China uses', 'just <b>one</b>'] },
  { scene: 'density', q: ['Which country has the', 'fewest people per km²?'], opts: ['Canada', 'Mongolia', 'Australia'], right: 1, out: [0, 2],
    fact: ['<b>Mongolia:</b> about', '<b>2 people</b> per km²'], bonus: ['<b>Bonus:</b> almost half', 'live in <b>one city</b>'] },
  { scene: 'capital', q: ['Which is the world’s', 'southernmost capital?'], opts: ['Canberra', 'Buenos Aires', 'Wellington'], right: 2, out: [1, 0],
    fact: ['<b>Wellington</b> is the', 'southernmost capital'], bonus: ['<b>Bonus:</b> the northernmost', 'is <b>Reykjavik</b>'] },
  { scene: 'baikal', q: ['Which lake holds more water', 'than all 5 Great Lakes combined?'], opts: ['Lake Victoria', 'Lake Baikal', 'Lake Titicaca'], right: 1, out: [2, 0],
    fact: ['<b>Lake Baikal</b> beats all', '5 Great Lakes combined'], bonus: ['<b>Bonus:</b> it’s also the', '<b>deepest</b> lake on Earth'] },
];
// French Guiana (part of France) is not in the app's boundaries; Natural Earth 1:110m, from the launch film's map
window.FRENCH_GUIANA = [[-51.66, 4.154], [-52.25, 3.244], [-52.556, 2.506], [-52.942, 2.124], [-53.42, 2.052], [-53.557, 2.336], [-53.78, 2.376], [-54.09, 2.106], [-54.526, 2.311], [-54.27, 2.732], [-54.184, 3.19], [-54.007, 3.618], [-54.4, 4.212], [-54.479, 4.896], [-53.96, 5.756], [-53.618, 5.648], [-52.884, 5.411], [-51.826, 4.565], [-51.66, 4.154]];
