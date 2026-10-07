/** Dutch names of capitals that have their own Dutch form (Wenen, not Vienna). Everything else keeps the
 * catalogue name, which is also the Dutch one (Madrid, Nairobi, Canberra …). Spellings follow Dutch Wikipedia.
 * Typed answers accept the Dutch, English and Spanish name (see `aliases` in questions.ts). */
const capitals: Record<string, string> = {
  'Kabul': 'Kaboel', 'Yerevan': 'Jerevan', 'Vienna': 'Wenen', 'Baku': 'Bakoe', 'Brussels': 'Brussel',
  'Brasília': 'Brasilia', 'Beijing': 'Peking', 'Prague': 'Praag', 'Berlin': 'Berlijn', 'Copenhagen': 'Kopenhagen',
  'Cairo': 'Caïro', 'Addis Ababa': 'Addis Abeba', 'Paris': 'Parijs', 'London': 'Londen', 'Athens': 'Athene',
  'Guatemala City': 'Guatemala-Stad', 'Tehran': 'Teheran', 'Baghdad': 'Bagdad', 'Tokyo': 'Tokio', 'Bishkek': 'Bisjkek',
  'South Tarawa': 'Zuid-Tarawa', 'Kuwait City': 'Koeweit-Stad', 'Beirut': 'Beiroet', 'Luxembourg': 'Luxemburg',
  'Mexico City': 'Mexico-Stad', 'Ulan Bator': 'Ulaanbaatar', 'Panama City': 'Panama-Stad', 'Warsaw': 'Warschau',
  'Lisbon': 'Lissabon', 'Bucharest': 'Boekarest', 'Moscow': 'Moskou', 'Riyadh': 'Riyad', 'Khartoum': 'Khartoem',
  'Belgrade': 'Belgrado', 'Dushanbe': 'Doesjanbe', 'Ashgabat': 'Asjchabad', 'Tashkent': 'Tasjkent',
  'Vatican City': 'Vaticaanstad', "Sana'a": 'Sanaa', 'Cape Town': 'Kaapstad',
};
export const dutchCapital = (name: string) => capitals[name] ?? name;
