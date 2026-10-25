"""Content week 2 (26 Oct - 1 Nov 2026): the 35 posts, their captions and banner texts, in one place.
Captions are ready to paste: English, and #fyp as the only hashtag (as asked)."""

DAYS = {
    1: ('ma-26-okt', 'MON 26 OCT'), 2: ('di-27-okt', 'TUE 27 OCT'), 3: ('wo-28-okt', 'WED 28 OCT'), 4: ('do-29-okt', 'THU 29 OCT'),
    5: ('vr-30-okt', 'FRI 30 OCT'), 6: ('za-31-okt', 'SAT 31 OCT'), 7: ('zo-1-nov', 'SUN 1 NOV'),
}
# kind: car (twins carousel), map (12-slide map challenge), reel; time = suggested posting time (local)
SLOTS = {'P1': ('Flag twins', 'car', '19:00'), 'P2': ('Map challenge', 'map', '15:00'), 'P3': ('Flag twins reel', 'reel', '12:30'),
         'P4': ('Guess the country in 3 facts', 'reel', '08:00'), 'P5': ('Map facts', 'reel', '21:00')}
MAPN = {1: 28, 2: 29, 3: 30, 4: 31, 5: 32, 6: 33, 7: 34}
MAPR = {28: 'Europe', 29: 'Africa', 30: 'Asia', 31: 'The Americas', 32: 'Islands only', 33: 'Europe', 34: 'Around the world'}
MAPE = {28: '🇪🇺', 29: '🌍', 30: '🌏', 31: '🌎', 32: '🏝️', 33: '🇪🇺', 34: '🌐'}

def map_caption(n):
    return (f"Map challenge #{n}: {MAPR[n]} {MAPE[n]}\n5 countries, no names, from Easy to Legend. Every answer comes with a fact.\n"
            f"Guess before you swipe, then comment your score: __/5 👇\n#fyp")

# post id -> (caption, banner line 1, banner line 2)
POSTS = {
    'D1P1': ("Last time it was Monaco, Indonesia and Poland. Now it’s 4 flags 😈\nRomania, Andorra, Chad or Moldova: name all 4 before you swipe.\nComment your score: 0, 1, 2, 3 or 4 👇\n#fyp",
             '4 flags, 1 colour scheme.', 'Can you name all 4?'),
    'D1P3': ("These two countries found out at the Olympics that they had the same flag 😳\nWhich one is Liechtenstein: A or B?\n#fyp",
             'Same flag until 1936.', 'Which one is Liechtenstein?'),
    'D1P4': ("3 clues, 1 country. Clue 1 is the hard one 🌍\nWhen did you get it: clue 1, 2 or 3? 👇\n#fyp",
             '3 clues. 1 country.', 'Got it on clue 1?'),
    'D1P5': ("Roviko says number 2. Trust him? 😅\nWhich number is Uruguay? Lock in your answer before the reveal.\n#fyp",
             'Which number', 'is Uruguay?'),
    'D2P1': ("Ivory Coast, Italy or Ireland? Name all 3 🇨🇮🇮🇹🇮🇪\nSlide 4: what Ireland’s colours actually mean.\nComment your score 👇\n#fyp",
             'Ivory Coast, Italy', 'or Ireland? Name all 3'),
    'D2P3': ("Red and white with a zigzag. One is Qatar, one is Bahrain 👀\nHint: count the points. A or B?\n#fyp",
             'Red, white, zigzag.', 'Which one is Qatar?'),
    'D2P4': ("Hard clues first 🗾\nDid you know clue 1? Comment when you got it: 1, 2 or 3 👇\n#fyp",
             'Hard clues first.', 'When did you get it?'),
    'D2P5': ("France or Madagascar: which one is bigger? 🗺️\nYour map has been lying to you.\n#fyp",
             'France or Madagascar:', 'which one is bigger?'),
    'D3P1': ("Venezuela, Colombia or Ecuador? Name all 3 🇻🇪🇨🇴🇪🇨\nSlide 4 explains why they look so alike.\nComment your score 👇\n#fyp",
             'Venezuela, Colombia', 'or Ecuador? Name all 3'),
    'D3P3': ("Blue, white, blue. One is Honduras, one is Nicaragua 🤔\nA or B? Comment before the reveal.\n#fyp",
             'Blue, white, blue.', 'Which one is Honduras?'),
    'D3P4': ("Only 3 clues. Can you name it before clue 3? 🚀\nComment the clue that gave it away 👇\n#fyp",
             'Only 3 clues.', 'Name this country'),
    'D3P5': ("Roviko is very sure it’s number 3 😎\nWhich number is Malawi? Comment yours 👇\n#fyp",
             'Which number', 'is Malawi?'),
    'D4P1': ("Iceland, Denmark or Norway? Name all 3 🇮🇸🇩🇰🇳🇴\nSame cross, different colours. Swipe for how to tell.\nComment your score 👇\n#fyp",
             'Iceland, Denmark', 'or Norway? Name all 3'),
    'D4P3': ("Red flag, crescent and a star. One is Türkiye, one is Tunisia 🔍\nWhich one is Tunisia: A or B?\n#fyp",
             'Red, crescent, star.', 'Which one is Tunisia?'),
    'D4P4': ("Easy? Prove it 🇮🇹\nClue 1 is about two countries hiding inside this one. Can you name both? 👇\n#fyp",
             'Easy? Prove it.', 'Name it in 3 clues'),
    'D4P5': ("UK or Ecuador: which one is bigger? 🇬🇧🇪🇨\nHint: it’s all about how web maps work.\n#fyp",
             'UK or Ecuador:', 'which one is bigger?'),
    'D5P1': ("Luxembourg, Paraguay or the Netherlands? Name all 3 🇱🇺🇵🇾🇳🇱\nSlide 4: the flag with a different picture on each side.\nComment your score 👇\n#fyp",
             'Luxembourg, Paraguay', 'or Netherlands? Name all 3'),
    'D5P3': ("Same colours, one star. Which one is Cameroon? ⭐\nA or B? No cheating.\n#fyp",
             'Same colours, one star.', 'Which one is Cameroon?'),
    'D5P4': ("Guess the country before clue 3 🇧🇷\nBonus: name the two South American countries it doesn’t border 👇\n#fyp",
             'Guess the country', 'before clue 3'),
    'D5P5': ("Austria or Australia? Roviko still mixes them up 🦘\nWhich number is Austria? Comment yours 👇\n#fyp",
             'Which number', 'is Austria?'),
    'D6P1': ("Slovakia, Russia or Slovenia? Name all 3 🇸🇰🇷🇺🇸🇮\nOne of them is about 840 times bigger than another. Swipe.\nComment your score 👇\n#fyp",
             'Slovakia, Russia', 'or Slovenia? Name all 3'),
    'D6P3': ("Same three colours, different order 🇱🇹🇧🇴\nWhich one is Lithuania: A or B?\n#fyp",
             'Same three colours.', 'Which one is Lithuania?'),
    'D6P4': ("Halloween special 🎃 Name this country in 3 clues.\nClue 3 gives it away. Did you need it? 👇\n#fyp",
             'Halloween special:', 'name this country'),
    'D6P5': ("Happy Halloween 👻 5 real places with terrifying names.\nWhich one would you visit? Comment the number 👇\n#fyp",
             'Real places with', 'terrifying names'),
    'D7P1': ("New Zealand, Tuvalu, Australia or Fiji? Name all 4 🇳🇿🇹🇻🇦🇺🇫🇯\nSlide 4: the time New Zealand voted on a new flag.\nComment your score 👇\n#fyp",
             'Four blue flags.', 'Can you name all 4?'),
    'D7P3': ("Red, white, red. One is Austria, one is Latvia 🇦🇹🇱🇻\nWhich one is Latvia: A or B?\n#fyp",
             'Red, white, red.', 'Which one is Latvia?'),
    'D7P4': ("Week finale 🏁 Name it before clue 3.\nHow many did you get right this week? Comment your total 👇\n#fyp",
             'Week finale.', 'Name it before clue 3'),
    'D7P5': ("Roviko says number 2. Is he right? 🤔\nWhich number is Bosnia and Herzegovina? Comment yours 👇\n#fyp",
             'Which number is', 'Bosnia and Herzegovina?'),
}
for d, n in MAPN.items():
    POSTS[f'D{d}P2'] = (map_caption(n), f'Map challenge #{n}:', f'{MAPR[n]}. Score __/5')
