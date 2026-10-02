"""Bundle each posting day into one folder: the 4 posts + a CAPTIONS.txt to copy from.

  python3 social/daily-posts/build.py <out_dir> [first] [last]   ->  <out_dir>/Dag-01 … (+ one zip per day)

A day = 1 "Guess the country" carousel, 1 funny Roviko video, 1 "Sounds fake" fact, 1 "Flag a Day" video.
Days 1-10 are complete (10 carousels, 10 funny videos, 10 facts, 30 flags).
"""
import shutil
import sys
import zipfile
from pathlib import Path

SOCIAL = Path(__file__).resolve().parent.parent
CAR = SOCIAL / 'roviko-carousels' / 'out'
SH = SOCIAL / 'roviko-shorts' / 'out'

# per day: (carousel post, funny short file, fun fact n, flag day) + the four captions
DAYS = [
    dict(post=1, funny='roviko-short-1-sydney.mp4', fact=1, flag=1,
         car=('Europe', """Only real Europe experts get #5 🇪🇺👀
5 countries. No borders. Every swipe gets harder.
✋ Rule: guess BEFORE you swipe. No googling.
🏆 Your rank is on the last slide.
Comment your score like this: 3/5
Tag the friend who thinks they know Europe 👇
#guessthecountry #geographyquiz #europe #mapchallenge #roviko""", "Which number got you? 1, 2, 3, 4 or 5? 👇"),
         fun=('POV: you\'re 100% sure it\'s Sydney', """The confidence was there. The geography was not 😎🇦🇺
Be honest: did you also say Sydney? 👇
5 minutes a day at roviko.app
#geography #geographyquiz #australia #quiztime #funfacts #learnontiktok #roviko""", "Answer: Canberra 🇦🇺 Sydney is just the famous one. Who else said Sydney? 🙋"),
         fact_c=('France\'s longest border is with Brazil', """France's longest border is NOT with Spain 👀
A, B or C? Comment before the reveal 👇
One "wait, really?!" fact a day 👉 play the daily geography quiz at roviko.app (link in bio). No account needed.
#geography #funfacts #france #brazil #didyouknow #geographyquiz""", "Answer: Brazil 🇧🇷. French Guiana in South America is part of France, and its border with Brazil is 730 km long. Did you get it? ✅ or ❌ (more of these at roviko.app)"),
         flag_c=('Japan, EASY', """Warm-up flag 🔥 3 seconds. Go.
Flag a Day · Day 1/30 🔥
✍️ Comment your answer before the timer hits 0.
Play with up to 12 friends at roviko.app
#flagquiz #guesstheflag #flags #geography #roviko""", "Which flag should we do tomorrow? 👇")),
    dict(post=2, funny='roviko-short-2-streak.mp4', fact=2, flag=2,
         car=('Africa', """#1 is easy. #5 is where it gets real 🌍🔥
Map challenge #2: Africa. 5 countries, no borders.
👀 Type your guess in the comments before you swipe to the answer.
Stuck? The hard ones come with a hint.
Made it to the last slide? Tell us your rank: Tourist, Backpacker, Explorer or Legend?
📌 Save it and test your friends tonight.
#guessthecountry #geographyquiz #africa #mapchallenge #roviko""", "Be honest: did you get #3 without the hint? 👀"),
         fun=('Me remembering my 47-day streak at 23:58', """23:59:59 and not a second later 😮‍💨🔥
What's your longest streak? Drop it below 👇
Daily Detour, every day at roviko.app
#streak #relatable #dailychallenge #geography #quiztime #brainteaser #roviko""", "What's your record? Drop it 👇 Let's find the real streak king 👑"),
         fact_c=('Sudan has the most pyramids', """The country with the most pyramids is NOT Egypt 🤯
Egypt, Mexico or Sudan? Comment A, B or C 👇
Think you'd know? Test yourself every day at roviko.app (link in bio).
#pyramids #sudan #egypt #history #funfacts #geography""", "Sudan 🇸🇩 has over 200 pyramids, about twice as many as Egypt (~120). And they're steeper: ~70° vs Giza's 52°. Your score? ✅ or ❌"),
         flag_c=('Brazil, EASY', """Easy one… or is it? 👀
Flag a Day · Day 2/30 🔥
✍️ Comment your answer before the timer hits 0.
Flags, maps and capitals at roviko.app
#flagquiz #guesstheflag #flags #geography #roviko""", "Got it before 2 or before 1? ⏱️")),
    dict(post=3, funny='roviko-short-3-gamenight.mp4', fact=3, flag=3,
         car=('Asia', """Can you beat Asia on Legend level? 🌏
5 countries. No borders. Harder with every swipe.
✍️ Keep count as you go. The answer is always one swipe away.
🏆 The last slide tells you if you're a Tourist or a Legend.
Drop your score: __/5
Send this to your quiz night partner 👀
#guessthecountry #geographyquiz #asia #mapchallenge #roviko""", "Write down your 5 guesses in order, no peeking 👇 Then check the last slide."),
         fun=('POV: your friend says he\'s "elite at geography"', """In his defence… it ALSO has a red circle 🇯🇵🇧🇩💀
Tag the Lucas in your group chat 👇
Game night for up to 12 friends at roviko.app
#gamenight #friends #geographyquiz #flags #quiztime #groupchat #roviko""", "Japan = red circle on white. Bangladesh = red circle on green. Lucas still says it's the same 😤"),
         fact_c=('Saudi Arabia has zero permanent rivers', """This country has ZERO permanent rivers 🏜️
Saudi Arabia, Australia or Mongolia? A, B or C 👇
Facts like this, as a 5-minute daily quiz 👉 roviko.app (link in bio)
#saudiarabia #desert #funfacts #didyouknow #geography #learnontiktok""", "Saudi Arabia 🇸🇦 is the biggest country without a permanent river, so it turns seawater into drinking water, more than any other country. ✅ or ❌?"),
         flag_c=('Canada, EASY', """If you miss this one, we need to talk 😅
Flag a Day · Day 3/30 🔥
✅ or ❌? Comment it and keep your streak going 🔥
Daily geography trips at roviko.app
#flagquiz #guesstheflag #flags #geography #roviko""", "What's your streak so far? 🔥")),
    dict(post=4, funny='roviko-short-4-greenland.mp4', fact=4, flag=4,
         car=('The Americas', """Everyone gets #1. But #5… 🌎😅
Map challenge #4: the Americas. 5 countries, no borders.
✋ Guess first, then swipe. No googling.
🏆 Your rank is waiting on the last slide.
Comment your score + the one that fooled you 👇
Send this to the friend who always wins quiz night.
#guessthecountry #geographyquiz #southamerica #mapchallenge #roviko""", "Which one fooled you? Wrong answers only 😂"),
         fun=('POV: you find out how big Greenland really is', """Greenland: "we're the same size as Africa" 😎
Africa: fits Greenland 14 times 💀
Flat maps stretch everything near the poles.
Which country should we shrink next? 👇
#geography #maps #greenland #africa #mapprojection #truesize #funfacts #roviko""", "Next one gets its own video. Russia? Canada? Antarctica? Vote below 👇"),
         fact_c=('Canada has more lakes than the rest of the world', """One country has more lakes than the rest of the world COMBINED 🌊
Finland, Canada or Russia? Comment A, B or C 👇
Play one geography quiz a day at roviko.app (link in bio). No account needed.
#canada #lakes #nature #funfacts #geography #didyouknow""", "Canada 🇨🇦: about 880,000 lakes, 62% of all lakes in the world (HydroLAKES, lakes from 10 hectares). It also has the world's longest coastline. Did you get it? ✅ or ❌"),
         flag_c=('Chad, TRAP', """TRAP 🪤 This flag has a twin. Which one is it?
Flag a Day · Day 4/30 🔥
✍️ Comment your answer before the timer hits 0.
Play with up to 12 friends at roviko.app
#flagquiz #guesstheflag #lookalike #flags #roviko""", "Team Chad or team Romania? 👇")),
    dict(post=5, funny='roviko-short-5-wronganswers.mp4', fact=5, flag=5,
         car=('Around the world', """The final boss of our map challenges 🌍👑
5 continents. 5 countries. 0 borders.
✋ Guess before you swipe. The last slide tells you if you're a Geography legend.
Did all 5 challenges? Comment your total: __/25
Missed one? They're all on our profile 🔁
Play with up to 12 friends at roviko.app
#guessthecountry #geographyquiz #worldmap #mapchallenge #roviko""", "Who got 25/25 over all five challenges? 👑 Show yourself."),
         fun=('Wrong answers only: capital of Brazil?', """Wrong answers only: what's the capital of Brazil? 🇧🇷
(Roviko is not ok after comment 3)
Your turn 👇 the funniest one gets pinned
#wronganswersonly #geography #brazil #capitals #geographyquiz #funny #roviko""", "Right answer: Brasília. Built from scratch, capital since 1960. Now give us your WRONG answers 😂"),
         fact_c=('Liechtenstein is double landlocked', """To reach the sea from this country, you must cross 2 borders 😳
Switzerland, Liechtenstein or Austria? A, B or C 👇
Fewer geography fails, starting today 👉 roviko.app (link in bio)
#liechtenstein #europe #funfacts #geographyquiz #didyouknow #geography""", "Liechtenstein 🇱🇮. Every neighbour (Switzerland, Austria) is landlocked too. The only other \"double landlocked\" country is Uzbekistan 🇺🇿. And Liechtenstein has no airport ✈️ ✅ or ❌?"),
         flag_c=('Nepal, MEDIUM', """Medium mode. 3 seconds. No pausing 👀
Flag a Day · Day 5/30 🔥
✍️ Comment your answer before the timer hits 0.
📌 Save this and test your friends.
Flags, maps and capitals at roviko.app
#flagquiz #guesstheflag #flags #geographyquiz #roviko""", "Got it before 2 or before 1? ⏱️")),
    dict(post=6, funny='roviko-short-6-austria.mp4', fact=6, flag=6,
         car=('Europe, round 2', """Round 2 🔁 Europe is back, and #5 is evil 😈🇪🇺
5 countries. No borders. Every swipe gets harder.
✋ Guess BEFORE you swipe. No googling.
🏆 Your rank is on the last slide.
Comment your score like this: 4/5
Tag the friend who failed round 1 👇
#guessthecountry #geographyquiz #europe #mapchallenge #roviko""", "Round 1 or round 2: which was harder? 👇"),
         fun=('Austria is not Australia', """"Have fun in Austria! Say hi to the kangaroos 🦘"
Austria: the Alps, Mozart and zero kangaroos.
The kangaroos live 15,900 km away.
Tag the friend who mixes them up 👇
Know where you're going 👉 roviko.app
#austria #australia #geography #kangaroo #travel #funny #geographyfails #roviko""", "Be honest: have you ever mixed them up? 🇦🇹 or 🇦🇺 👇"),
         fact_c=('Sweden has the most islands', """The country with the most islands is NOT Indonesia 🏝️
Indonesia, Philippines or Sweden? Comment A, B or C 👇
One "wait, really?!" fact a day 👉 roviko.app (link in bio). No account needed.
#sweden #islands #funfacts #didyouknow #geography #scandinavia""", "Sweden 🇸🇪: 267,570 islands (Statistics Sweden). Only 984 of them have people living on them. ✅ or ❌?"),
         flag_c=('Kenya, MEDIUM', """This one splits the comments every time 👀
Flag a Day · Day 6/30 🔥
✅ or ❌? Comment it and keep your streak going 🔥
Daily geography trips at roviko.app
#flagquiz #guesstheflag #flags #geographyquiz #roviko""", "What's your streak so far? 🔥")),
    dict(post=7, funny='roviko-short-7-stages.mp4', fact=7, flag=7,
         car=('Africa, round 2', """Most people get #1. Almost nobody gets #5 🌍👀
Map challenge #7: Africa. 5 countries, no borders.
👀 Type your guess in the comments before you swipe to the answer.
Stuck? The hard ones come with a hint.
Last slide = your rank. Tourist or Legend?
📌 Save it and test your friends tonight.
#guessthecountry #geographyquiz #africa #mapchallenge #roviko""", "#5 is the smallest of the five. Did you get it without the hint? 👀"),
         fun=('The 5 stages of a Legend-level question', """The 5 stages of a Legend-level question 😤
Denial. Anger. Bargaining. Rain cloud. Acceptance.
Which stage are you at? 1, 2, 3, 4 or 5 👇
Go through all 5 daily at roviko.app
#5stages #geography #quiz #kazakhstan #relatable #geographyquiz #funny #roviko""", "Capital of Kazakhstan = Astana. Almaty was the capital until 1997. Did you get it before Roviko? 👀"),
         fact_c=('France has the most time zones', """The country with the most time zones is NOT Russia ⏰
Russia, USA or France? A, B or C 👇
Test yourself every day at roviko.app (link in bio)
#france #timezones #funfacts #didyouknow #geography #geographyquiz""", "France 🇫🇷: 12 time zones, thanks to its overseas regions from the Pacific to the Indian Ocean. Russia and the USA: 11. China: just 1. Did you get it? ✅ or ❌"),
         flag_c=('South Korea, EASY', """Free point today. Don't blow it 👀
Flag a Day · Day 7/30 🔥
✍️ Comment your answer before the timer hits 0.
Send this to the friend who never gets flags right 👀
Play with up to 12 friends at roviko.app
#flagquiz #guesstheflag #flags #geography #roviko""", "Which flag should we do tomorrow? 👇")),
    dict(post=8, funny='roviko-short-8-moon.mp4', fact=8, flag=8,
         car=('Asia, round 2', """One of these is shaped like an elephant's head 🐘 Can you find it?
5 countries. No borders. Harder with every swipe.
✍️ Keep count as you go. The answer is always one swipe away.
🏆 The last slide tells you if you're a Tourist or a Legend.
Drop your score: __/5
Send this to your quiz night partner 👀
#guessthecountry #geographyquiz #asia #mapchallenge #roviko""", "Which number was the elephant? 🐘👇"),
         fun=('Australia is wider than the Moon', """A fact that sounds fake but is true:
Australia is wider than the Moon 🌕🇦🇺
Australia: about 4,000 km from west to east. The Moon: 3,475 km across.
Drop a fact that sounds fake but is true 👇 the best one becomes a video
More of these at roviko.app
#funfacts #didyouknow #australia #moon #space #geography #mindblown #roviko""", "Steep Point to Cape Byron is about 4,000 km. The Moon's diameter is 3,475 km (NASA). Now your turn 👇"),
         fact_c=('Mongolia is the emptiest country', """In this country, about 2 people share every km² 😳
Canada, Mongolia or Australia? Comment A, B or C 👇
Facts like this, as a 5-minute daily quiz 👉 roviko.app (link in bio)
#mongolia #population #funfacts #didyouknow #geography #netherlands""", "Mongolia 🇲🇳: about 2 people per km². The Netherlands: about 500. And almost half of all Mongolians live in one city, Ulaanbaatar. ✅ or ❌?"),
         flag_c=('Ireland, TRAP', """Careful… this one has a look-alike 👀
Flag a Day · Day 8/30 🔥
✍️ Comment your answer before the timer hits 0.
Flags, maps and capitals at roviko.app
#flagquiz #guesstheflag #lookalike #flags #roviko""", "Team Ireland or team Ivory Coast? 👇")),
    dict(post=9, funny='roviko-short-9-lobby.mp4', fact=9, flag=9,
         car=('The Americas, round 2', """#3 is an island. That's your only hint 🏝️🌎
Map challenge #9: the Americas. 5 countries, no borders.
✋ Guess first, then swipe. No googling.
🏆 Your rank is waiting on the last slide.
Comment your score + the one that fooled you 👇
Send this to the friend who always wins quiz night.
#guessthecountry #geographyquiz #latinamerica #mapchallenge #roviko""", "Be honest: did #5 fool you? 😅"),
         fun=('Every Roviko lobby has these 5 players', """Every Roviko lobby has these 5 players 🎮
The Googler, the Speed-Clicker, the "I knew that", the Silent Assassin and the Rage-Quitter.
Which one are you? Tag your squad 👇
Start a game for up to 12 friends at roviko.app
#gamenight #friends #quiz #geography #relatable #tagyourfriends #multiplayer #roviko""", "I'm a 3 and I'm not proud of it. Comment your number 👇"),
         fact_c=('Wellington is the southernmost capital', """The world's southernmost capital is NOT in Australia or Argentina 🧭
Canberra, Buenos Aires or Wellington? A, B or C 👇
Play one geography quiz a day at roviko.app (link in bio). No account needed.
#newzealand #wellington #capitals #funfacts #geography #geographyquiz""", "Wellington 🇳🇿 at 41.3°S. The northernmost is Reykjavik 🇮🇸 at 64.1°N: 105° apart. Did you get it? ✅ or ❌"),
         flag_c=('Mexico, EASY', """3 seconds is plenty for this one… right? ⏱️
Flag a Day · Day 9/30 🔥
✅ or ❌? Comment it and keep your streak going 🔥
Daily geography trips at roviko.app
#flagquiz #guesstheflag #flags #geography #roviko""", "What's your streak so far? 🔥")),
    dict(post=10, funny='roviko-short-10-uk.mp4', fact=10, flag=10,
         car=('Around the world, round 2', """The final boss, round 2 🌍👑
5 continents. 5 countries. 0 borders.
✋ Guess before you swipe. The last slide tells you if you're a Geography legend.
Did all 10 challenges? Comment your total: __/50
Missed one? They're all on our profile 🔁
Play with up to 12 friends at roviko.app
#guessthecountry #geographyquiz #worldmap #mapchallenge #roviko""", "Who got 50/50 over all ten challenges? 👑 Show yourself."),
         fun=('The UK explained', """England, Britain, the UK… explained in 10 seconds 🇬🇧
Great Britain = the island (England, Scotland, Wales)
United Kingdom = Great Britain + Northern Ireland
Ireland = a separate country
Got it? No? Same 😵‍💫
Now explain Holland vs the Netherlands 👇
#uk #greatbritain #england #ireland #geography #explained #learnontiktok #roviko""", "Best explanation of Holland vs the Netherlands gets pinned 🇳🇱👇"),
         fact_c=('Lake Baikal beats the Great Lakes', """ONE lake holds more water than all 5 Great Lakes combined 🌊
Lake Victoria, Lake Baikal or Lake Titicaca? Comment A, B or C 👇
Fewer geography fails, starting today 👉 roviko.app (link in bio)
#lakebaikal #russia #lakes #funfacts #didyouknow #geography""", "Lake Baikal 🇷🇺: about 23,600 km³ vs about 22,700 km³ for all 5 Great Lakes. It's also the deepest lake on Earth: 1,642 m, about 5 Eiffel Towers. ✅ or ❌?"),
         flag_c=('Bhutan, HARD', """Hard mode 😈 Only real flag nerds get this in 3 seconds
Flag a Day · Day 10/30 🔥
✍️ Comment your answer before the timer hits 0.
📌 Save this and test your friends.
Play with up to 12 friends at roviko.app
#flagquiz #vexillology #flags #geographyquiz #roviko""", "Did you get it in 3 seconds? Be honest 😅")),
]

LINE = '=' * 60


def block(n, when, title, what, files, caption, pin):
    return f"""{LINE}
{n}. {title}  ({when})
{what}
Bestand(en): {files}
{LINE}

CAPTION (kopieer alles hieronder tot aan PIN):

{caption}

PIN (plaats als eerste reactie en zet hem vast):

{pin}

"""


def main(out, first=1, last=len(DAYS)):
    out = Path(out)
    for i, d in enumerate(DAYS, 1):
        if not first <= i <= last:
            continue
        day = out / f'Dag-{i:02d}'
        if day.exists():
            shutil.rmtree(day)
        car = day / '1-land-raden'
        for plat in ('tiktok', 'instagram'):
            shutil.copytree(CAR / f"post-{d['post']}" / plat, car / plat)
        shutil.copy(SH / d['funny'], day / '2-grappige-video.mp4')
        shutil.copy(SH / 'fun-facts' / f"fun-fact-{d['fact']}.mp4", day / '3-feitje.mp4')
        shutil.copy(SH / 'flag-a-day' / f"flag-a-day-{d['flag']:02d}.mp4", day / '4-vlag-raden.mp4')
        txt = f"""ROVIKO, DAG {i}: 4 posts
Dezelfde caption werkt op TikTok en Instagram. Laat minstens 3 uur tussen twee posts.
Voorstel: 1 om 09:00, 2 om 13:00, 3 om 17:00, 4 om 20:00.

"""
        txt += block(1, '09:00', f"LAND RADEN: {d['car'][0]}", 'Fotocarrousel, 12 slides op volgorde (01 → 12).',
                     '1-land-raden/tiktok/ (TikTok, 3:4)  ·  1-land-raden/instagram/ (Instagram, 4:5)', d['car'][1], d['car'][2])
        txt += block(2, '13:00', f"GRAPPIGE VIDEO: {d['fun'][0]}", 'Video, plaatsen met het eigen geluid.', '2-grappige-video.mp4', d['fun'][1], d['fun'][2])
        txt += block(3, '17:00', f"FEITJE: {d['fact_c'][0]}", 'Video, "Sounds fake, but it\'s true" #' + str(d['fact']) + '.', '3-feitje.mp4', d['fact_c'][1], d['fact_c'][2])
        txt += block(4, '20:00', f"VLAG RADEN: dag {d['flag']} (antwoord: {d['flag_c'][0]})", 'Video, Flag a Day.', '4-vlag-raden.mp4', d['flag_c'][1], d['flag_c'][2])
        (day / 'CAPTIONS.txt').write_text(txt)
        z = out / f'Roviko-Dag-{i:02d}.zip'
        with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as zf:
            for f in sorted(day.rglob('*')):
                if f.is_file():
                    zf.write(f, f.relative_to(out))
        print(z, round(z.stat().st_size / 1e6, 1), 'MB')


if __name__ == '__main__':
    main(sys.argv[1], *map(int, sys.argv[2:4]))
