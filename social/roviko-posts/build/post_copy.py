"""All post texts: Instagram captions and alt text, and X posts. build/package.py puts them next to the images."""

TAGS = '#geography #geographyquiz #dailypuzzle #roviko'

INSTAGRAM = [
    {'dir': 'post-01-meet-roviko', 'alt': 'Illustration of the smiling Roviko globe mascot on a warm cream background with the words “A small geography trip. Every day.”',
     'caption': 'Meet Roviko. 🌍\n\nA free daily geography game with flags, capitals, maps and a little trip around the world.\n\nA few curious minutes. Every day.\n\nPlay at roviko.app\n\n' + TAGS},
    {'dir': 'post-02-daily-detour', 'alt': 'Four-slide carousel introducing Roviko’s Daily Detour, a daily set of 20 mixed geography questions.',
     'caption': 'One Detour. Twenty questions. 🌍\n\nFlags, capitals, maps, neighbours and sizes — mixed into one daily trip.\n\nNo rush. Just see where the world takes you.\n\n' + TAGS},
    {'dir': 'post-03-guess-the-flag', 'alt': 'A horizontal flag with three equal bands of blue, black and white, presented as a country guessing game.',
     'caption': 'Three colours. One country. 🌍\n\nWhere are we?\n\nGuess it in the comments ↓\n\nAnswer tomorrow.\n\n#flags #geographyquiz #geography #roviko',
     'later': 'Reply after 24 hours: 🇪🇪 Estonia.'},
    {'dir': 'post-04-canada-or-australia', 'alt': 'Carousel asking whether Canada or Australia has the larger population, followed by 2024 World Bank population figures.',
     'caption': 'Big countries. Different populations.\n\nCanada or Australia — what was your first guess?\n\nPopulation, 2024.\nSource: World Bank, World Development Indicators.\n\n#geography #geographyquiz #worldfacts #roviko'},
    {'dir': 'post-05-rank-radar', 'alt': 'Roviko illustration for Rank Radar, a geography game about finding the subject where a country ranks highest in the world.',
     'caption': 'Some geography questions have one answer.\n\nRank Radar asks something trickier: where does this country rank highest in the world? 📡🌍\n\nPopulation? Forest? Coastline? Trust your radar.\n\n#geography #geographygame #dailypuzzle #roviko'},
    {'dir': 'post-06-country-inside-a-country', 'alt': 'Simple illustrated map showing Lesotho enclosed by South Africa.',
     'caption': 'Geography has some lovely little surprises.\n\nLesotho is completely surrounded by South Africa.\n\nThat makes tomorrow’s mental map just a little sharper. 🌍\n\nSource: South African Government, accessed 2026.\n\n#geography #worldfacts #learngeography #roviko'},
    {'dir': 'post-07-country-mosaic', 'alt': 'Roviko Country Mosaic illustration with rounded information tiles forming clues about a mystery country.',
     'caption': 'One country. A few pieces of information.\n\nCountry Mosaic is about spotting the pattern before the whole picture feels obvious. 🧩🌍\n\n#geographygame #geographyquiz #dailypuzzle #roviko'},
    {'dir': 'post-08-guess-the-country', 'alt': 'Dark green silhouette of a country on a cream background in a geography guessing game.',
     'caption': 'No flag. No capital. Just the shape.\n\nWhere are we? 🌍\n\nGuess it in the comments.\n\nAnswer tomorrow.\n\n#geography #mapquiz #geographyquiz #roviko',
     'later': 'Post ONE of the three images (pick a shape that is not in that day’s Daily Detour). Answers: shape-a = Iceland 🇮🇸, shape-b = Italy 🇮🇹, shape-c = Madagascar 🇲🇬.'},
    {'dir': 'post-09-better-together', 'alt': 'Roviko multiplayer illustration showing ways to play geography games with friends, another player or the computer.',
     'caption': 'A little geography rivalry?\n\nPlay Roviko with friends, a random player or the computer. 🌍\n\nJust for fun.\n\nroviko.app\n\n#geography #quizgame #multiplayer #roviko'},
]

X_PROFILE = {
    'name': 'Roviko',
    'bio': 'A small geography trip. Every day. 🌍 Six free daily games with flags, capitals, maps and more.',
    'website': 'roviko.app',
    'pinned': 'x-01',
}

# Each X post: image(s), text (max 280; a link counts as 23), alt text, and optional replies.
X = [
    {'id': 'x-01', 'images': ['01-meet-roviko.png'], 'alt': INSTAGRAM[0]['alt'],
     'text': 'Meet Roviko 🌍\n\nA free daily geography game: flags, capitals, maps and a little trip around the world.\n\nA few curious minutes. Every day.\n\nroviko.app'},
    {'id': 'x-02', 'images': ['02-daily-detour.png'], 'alt': 'Roviko’s Daily Detour: 20 mixed geography questions about flags, capitals, the map, neighbours and sizes.',
     'text': 'One Detour. Twenty questions. ✈️\n\nFlags, capitals, the map, neighbours and sizes, mixed into one daily trip. Everyone gets the same one.\n\nHow far around the world can you get?\n\nroviko.app'},
    {'id': 'x-03', 'images': ['03-guess-the-flag.png'], 'alt': INSTAGRAM[2]['alt'],
     'text': 'Three colours. One country. 👀\n\nGuess the flag in the replies. Answer tomorrow.\n\n#flags #geography',
     'replies': ['(next day, as a reply) 🇪🇪 Estonia! Blue, black and white. Did you get it?']},
    {'id': 'x-04', 'images': ['04a-which-has-more-people.png'], 'alt': 'Which has more people: Canada or Australia? Two country shapes side by side.',
     'text': 'Which has more people: Canada 🇨🇦 or Australia 🇦🇺?\n\nReply with your first guess. Answer in the thread ↓',
     'replies': ['[image 04b-answer-canada.png] Canada: 41.3 million. Australia: 27.2 million (2024).\n\nNot always the one that looks bigger on the map. 🌍\n\nSource: World Bank, World Development Indicators'],
     'note': 'Alternative without an image: an X poll with the options Canada / Australia, and the answer image as a reply after 24 hours.'},
    {'id': 'x-05', 'images': ['05-rank-radar.png'], 'alt': INSTAGRAM[4]['alt'],
     'text': 'Some geography questions have one answer. Rank Radar asks something trickier 📡\n\nOne country. Four subjects. Where does it rank highest in the world?\n\nTrust your radar: roviko.app'},
    {'id': 'x-06', 'images': ['06-lesotho.png'], 'alt': INSTAGRAM[5]['alt'],
     'text': 'A country inside a country? 🌍\n\nLesotho is completely surrounded by South Africa.\n\nOne little geography detail worth keeping.\n\nSource: South African Government'},
    {'id': 'x-07', 'images': ['07-country-mosaic.png'], 'alt': INSTAGRAM[6]['alt'],
     'text': 'A country, piece by piece. 🧩\n\nCountry Mosaic hides four countries in tiles: names, flags, shapes and facts. Can you spot which pieces belong together?\n\nroviko.app'},
    {'id': 'x-08', 'images': ['08-guess-the-country-shape-a.png | -b | -c (pick one)'], 'alt': INSTAGRAM[7]['alt'],
     'text': 'No flag. No capital. Just the shape. 👀\n\nWhere are we? Guess in the replies. Answer tomorrow.\n\n#mapquiz #geography',
     'replies': ['(next day) Iceland 🇮🇸 / Italy 🇮🇹 / Madagascar 🇲🇬, depending on the image you posted. Did you get it?']},
    {'id': 'x-09', 'images': ['09-better-together.png'], 'alt': INSTAGRAM[8]['alt'],
     'text': 'Geography is better together 🌍\n\nPlay Roviko with friends, a random player or the computer. Just for fun.\n\nroviko.app'},
]

# Text-only posts between the image posts: quick questions that invite replies. Facts checked against
# roviko/public/data/countries.json (195 countries).
X_TEXT = [
    {'id': 'x-t1', 'text': 'Quick one: only one country’s name starts with Q. Which one? 👀',
     'replies': ['(later) Qatar 🇶🇦']},
    {'id': 'x-t2', 'text': 'Your geography superpower? 🌍', 'poll': ['Flags', 'Capitals', 'Maps', 'Neighbours']},
    {'id': 'x-t3', 'text': 'Which capital do you always forget? 👀\n\n(No judgement. We all have one.)'},
    {'id': 'x-t4', 'text': 'China shares a land border with how many countries? 🗺️\n\nGuess first, then check the replies.',
     'replies': ['14: Afghanistan, Bhutan, India, Kazakhstan, Kyrgyzstan, Laos, Mongolia, Myanmar, Nepal, North Korea, Pakistan, Russia, Tajikistan and Vietnam.']},
    {'id': 'x-t5', 'text': 'Africa has 54 countries. How many can you name in one minute? ⏱️\n\nReply with your score.'},
]
