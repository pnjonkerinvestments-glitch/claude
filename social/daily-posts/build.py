"""Bundle each posting day into one folder: the 4 posts + a CAPTIONS.txt to copy from.

  python3 social/daily-posts/build.py <out_dir> [first] [last]   ->  <out_dir>/Dag-01 … (+ one zip per day)

A day = 1 "Guess the country" carousel, 1 funny Roviko video, 1 "Sounds fake" fact, 1 "Flag a Day" video.
Days 1-20 are complete (20 carousels, 20 funny videos, 20 facts, 30 flags). The five real-app films and three real-screen posts
are bundled separately with viral.py.
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
         car=('Europe, round 2', """Round 2 🔁 Europe is back, and number 5 is evil 😈🇪🇺
5 countries. Every swipe gets harder.
✋ Guess BEFORE you swipe. No googling.
🏆 Your rank is on the last slide.
Comment your score like this: 4/5
Tag the friend who failed round 1 👇
#fyp #foryou #geography #quiz #guessthecountry""", "Round 1 or round 2: which was harder? 👇"),
         fun=('Austria is not Australia', """"Have fun in Austria! Say hi to the kangaroos 🦘"
Austria: the Alps, Mozart and zero kangaroos.
The kangaroos live 15,900 km away.
Tag the friend who mixes them up 👇
Know where you're going 👉 roviko.app
#fyp #foryou #funny #geography #austria""", "Be honest: have you ever mixed them up? 🇦🇹 or 🇦🇺 👇"),
         fact_c=('Sweden has the most islands', """The country with the most islands is NOT Indonesia 🏝️
Indonesia, Philippines or Sweden? Comment A, B or C 👇
One "wait, really?!" fact a day 👉 roviko.app (link in bio). No account needed.
#fyp #foryou #didyouknow #funfacts #geography""", "Sweden 🇸🇪: 267,570 islands (Statistics Sweden). Only 984 of them have people living on them. ✅ or ❌?"),
         flag_c=('Kenya, MEDIUM', """This one splits the comments every time 👀
Flag a Day · Day 6/30 🔥
✅ or ❌? Comment it and keep your streak going 🔥
Daily geography trips at roviko.app
#fyp #foryou #flags #quiz #geography""", "What's your streak so far? 🔥")),
    dict(post=7, funny='roviko-short-7-stages.mp4', fact=7, flag=7,
         car=('Africa, round 2', """Most people get number 1. Almost nobody gets number 5 🌍👀
Map challenge 7: Africa. 5 countries.
👀 Type your guess in the comments before you swipe to the answer.
Stuck? The hard ones come with a hint.
Last slide = your rank. Tourist or Legend?
📌 Save it and test your friends tonight.
#fyp #foryou #geography #quiz #guessthecountry""", "Number 5 is the smallest of the five. Did you get it without the hint? 👀"),
         fun=('The 5 stages of a Legend-level question', """The 5 stages of a Legend-level question 😤
Denial. Anger. Bargaining. Rain cloud. Acceptance.
Which stage are you at? 1, 2, 3, 4 or 5 👇
Go through all 5 daily at roviko.app
#fyp #foryou #funny #geography #relatable""", "Capital of Kazakhstan = Astana. Almaty was the capital until 1997. Did you get it before Roviko? 👀"),
         fact_c=('France has the most time zones', """The country with the most time zones is NOT Russia ⏰
Russia, USA or France? A, B or C 👇
Test yourself every day at roviko.app (link in bio)
#fyp #foryou #didyouknow #funfacts #geography""", "France 🇫🇷: 12 time zones, thanks to its overseas regions from the Pacific to the Indian Ocean. Russia and the USA: 11. China: just 1. Did you get it? ✅ or ❌"),
         flag_c=('South Korea, EASY', """Free point today. Don't blow it 👀
Flag a Day · Day 7/30 🔥
✍️ Comment your answer before the timer hits 0.
Send this to the friend who never gets flags right 👀
Play with up to 12 friends at roviko.app
#fyp #foryou #flags #quiz #geography""", "Which flag should we do tomorrow? 👇")),
    dict(post=8, funny='roviko-short-8-moon.mp4', fact=8, flag=8,
         car=('Asia, round 2', """One of these is shaped like an elephant's head 🐘 Can you find it?
5 countries. Harder with every swipe.
✍️ Keep count as you go. The answer is always one swipe away.
🏆 The last slide tells you if you're a Tourist or a Legend.
Drop your score: __/5
Send this to your quiz night partner 👀
#fyp #foryou #geography #quiz #guessthecountry""", "Which number was the elephant? 🐘👇"),
         fun=('Australia is wider than the Moon', """A fact that sounds fake but is true:
Australia is wider than the Moon 🌕🇦🇺
Australia: about 4,000 km from west to east. The Moon: 3,475 km across.
Drop a fact that sounds fake but is true 👇 the best one becomes a video
More of these at roviko.app
#fyp #foryou #funny #geography #space""", "Steep Point to Cape Byron is about 4,000 km. The Moon's diameter is 3,475 km (NASA). Now your turn 👇"),
         fact_c=('Mongolia is the emptiest country', """In this country, about 2 people share every km² 😳
Canada, Mongolia or Australia? Comment A, B or C 👇
Facts like this, as a 5-minute daily quiz 👉 roviko.app (link in bio)
#fyp #foryou #didyouknow #funfacts #geography""", "Mongolia 🇲🇳: about 2 people per km². The Netherlands: about 500. And almost half of all Mongolians live in one city, Ulaanbaatar. ✅ or ❌?"),
         flag_c=('Ireland, TRAP', """Careful… this one has a look-alike 👀
Flag a Day · Day 8/30 🔥
✍️ Comment your answer before the timer hits 0.
Flags, maps and capitals at roviko.app
#fyp #foryou #flags #quiz #geography""", "Team Ireland or team Ivory Coast? 👇")),
    dict(post=9, funny='roviko-short-9-lobby.mp4', fact=9, flag=9,
         car=('The Americas, round 2', """number 3 is an island. That's your only hint 🏝️🌎
Map challenge 9: the Americas. 5 countries.
✋ Guess first, then swipe. No googling.
🏆 Your rank is waiting on the last slide.
Comment your score + the one that fooled you 👇
Send this to the friend who always wins quiz night.
#fyp #foryou #geography #quiz #guessthecountry""", "Be honest: did number 5 fool you? 😅"),
         fun=('Every Roviko lobby has these 5 players', """Every Roviko lobby has these 5 players 🎮
The Googler, the Speed-Clicker, the "I knew that", the Silent Assassin and the Rage-Quitter.
Which one are you? Tag your squad 👇
Start a game for up to 12 friends at roviko.app
#fyp #foryou #funny #geography #gaming""", "I'm a 3 and I'm not proud of it. Comment your number 👇"),
         fact_c=('Wellington is the southernmost capital', """The world's southernmost capital is NOT in Australia or Argentina 🧭
Canberra, Buenos Aires or Wellington? A, B or C 👇
Play one geography quiz a day at roviko.app (link in bio). No account needed.
#fyp #foryou #didyouknow #funfacts #geography""", "Wellington 🇳🇿 at 41.3°S. The northernmost is Reykjavik 🇮🇸 at 64.1°N: 105° apart. Did you get it? ✅ or ❌"),
         flag_c=('Mexico, EASY', """3 seconds is plenty for this one… right? ⏱️
Flag a Day · Day 9/30 🔥
✅ or ❌? Comment it and keep your streak going 🔥
Daily geography trips at roviko.app
#fyp #foryou #flags #quiz #geography""", "What's your streak so far? 🔥")),
    dict(post=10, funny='roviko-short-10-uk.mp4', fact=10, flag=10,
         car=('Around the world, round 2', """The final boss, round 2 🌍👑
5 continents. 5 countries. 1 legend.
✋ Guess before you swipe. The last slide tells you if you're a Geography legend.
Did all 10 challenges? Comment your total: __/50
Missed one? They're all on our profile 🔁
Play with up to 12 friends at roviko.app
#fyp #foryou #geography #quiz #guessthecountry""", "Who got 50/50 over all ten challenges? 👑 Show yourself."),
         fun=('The UK explained', """England, Britain, the UK… explained in 10 seconds 🇬🇧
Great Britain = the island (England, Scotland, Wales)
United Kingdom = Great Britain + Northern Ireland
Ireland = a separate country
Got it? No? Same 😵‍💫
Now explain Holland vs the Netherlands 👇
#fyp #foryou #funny #geography #uk""", "Best explanation of Holland vs the Netherlands gets pinned 🇳🇱👇"),
         fact_c=('Lake Baikal beats the Great Lakes', """ONE lake holds more water than all 5 Great Lakes combined 🌊
Lake Victoria, Lake Baikal or Lake Titicaca? Comment A, B or C 👇
Fewer geography fails, starting today 👉 roviko.app (link in bio)
#fyp #foryou #didyouknow #funfacts #geography""", "Lake Baikal 🇷🇺: about 23,600 km³ vs about 22,700 km³ for all 5 Great Lakes. It's also the deepest lake on Earth: 1,642 m, about 5 Eiffel Towers. ✅ or ❌?"),
         flag_c=('Bhutan, HARD', """Hard mode 😈 Only real flag nerds get this in 3 seconds
Flag a Day · Day 10/30 🔥
✍️ Comment your answer before the timer hits 0.
📌 Save this and test your friends.
Play with up to 12 friends at roviko.app
#fyp #foryou #flags #quiz #geography""", "Did you get it in 3 seconds? Be honest 😅")),
    # ------------------------------------------------------------------ days 11-20 (round 3 and 4 map challenges, funny shorts 11-20, facts 11-20, flags 11-20)
    dict(post=11, funny='roviko-short-11-groupchat.mp4', fact=11, flag=11,
         car=('Europe, round 3', """Europe round 3 🇪🇺 Number 5 is smaller than Wales 👀
5 countries. Every swipe gets harder.
✋ Guess BEFORE you swipe. No googling.
🏆 Your rank is on the last slide.
Comment your score like this: 4/5
#fyp #foryou #geography #quiz #guessthecountry""", "Did number 5 get you? Be honest 👀"),
         fun=('If countries had a group chat', """If countries had a group chat 💬
Canada says sorry, Switzerland stays neutral and the Netherlands wants to split the bill 🧾
Which country are YOU in the group chat? 👇
Meet them all at roviko.app
#fyp #foryou #funny #geography #countries""", "Which country should join the chat next? Best idea gets its own message 👇"),
         fact_c=('Canada shares a land border with Denmark', """Canada has a land border with… DENMARK? 🇨🇦🇩🇰
Only the USA, USA & Denmark, or USA & Russia? Comment A, B or C 👇
One "wait, really?!" fact a day 👉 roviko.app (link in bio). No account needed.
#fyp #foryou #didyouknow #funfacts #geography""", "B 🇩🇰 In 2022 Canada and Denmark (Greenland) split tiny Hans Island in half, so now they share a land border. Before that they 'fought' over it for decades by leaving bottles of whisky and schnapps on the island 🥃 ✅ or ❌?"),
         flag_c=('Portugal, EASY', """Quick one before your coffee ☕
Flag a Day · Day 11/30 🔥
✍️ Comment your answer before the timer hits 0.
Flags, maps and capitals at roviko.app
#fyp #foryou #flags #quiz #geography""", "Got it before 2 or before 1? ⏱️")),
    dict(post=12, funny='roviko-short-12-nolabels.mp4', fact=12, flag=12,
         car=('Africa, round 3', """Africa round 3 🌍 Number 5 is the "land of a thousand hills"
5 countries. Harder with every swipe.
👀 Type your guess in the comments before you swipe.
Stuck? The hard ones come with a hint.
Last slide = your rank. Tourist or Legend?
#fyp #foryou #geography #quiz #guessthecountry""", "Which number fooled you? 1, 2, 3, 4 or 5? 👇"),
         fun=('Me vs a map without labels', """Me: "I'm really good at geography" 😎
Also me, the same map without labels: 💀
Did you get it before Roviko? 👇
Maps without labels, every day at roviko.app
#fyp #foryou #funny #geography #relatable""", "It was Chad 🇹🇩 Which country do YOU always mix up on a blank map? 👇"),
         fact_c=('Russia and the USA are 4 km apart', """Russia and the USA are only ___ apart 😳
4 km, 80 km or 800 km? Comment A, B or C 👇
Think you'd know? Test yourself every day at roviko.app (link in bio)
#fyp #foryou #didyouknow #funfacts #geography""", "A: about 4 km (3.8 km) 🇷🇺🇺🇸 Big Diomede (Russia) and Little Diomede (USA) sit in the Bering Strait, with the date line between them. Nicknames: Tomorrow Island and Yesterday Isle 🗓️ ✅ or ❌?"),
         flag_c=('Indonesia, TRAP', """Two countries, almost the same flag. Which one is THIS? 🪤
Flag a Day · Day 12/30 🔥
✅ or ❌? Comment it and keep your streak going 🔥
Daily geography trips at roviko.app
#fyp #foryou #flags #quiz #geography""", "Team Indonesia or team Monaco? 👇")),
    dict(post=13, funny='roviko-short-13-italy.mp4', fact=13, flag=13,
         car=('Asia, round 3', """Asia round 3 🌏 One of these is double landlocked 👀
5 countries. Harder with every swipe.
✍️ Keep count as you go. The answer is always one swipe away.
🏆 The last slide tells you if you're a Tourist or a Legend.
Drop your score: __/5
#fyp #foryou #geography #quiz #guessthecountry""", "Which one is double landlocked? Comment the number 👇"),
         fun=('Italy has 2 countries inside it', """Italy has 2 countries INSIDE it 🇮🇹🤯
San Marino 🇸🇲 and Vatican City 🇻🇦, a country inside a city.
Name the 3rd country that sits completely inside another one 👇
Geography is weird. Play it daily at roviko.app
#fyp #foryou #funny #geography #italy""", "Answer: Lesotho 🇱🇸, completely surrounded by South Africa. Who got it? 🙋"),
         fact_c=('In Ethiopia it is still 2019', """In one country it's still 2019 right now 📅
Ethiopia, Japan or Nepal? A, B or C 👇
Facts like this, as a 5-minute daily quiz 👉 roviko.app (link in bio)
#fyp #foryou #didyouknow #funfacts #geography""", "Ethiopia 🇪🇹 uses its own calendar, about 7 to 8 years behind. Its year has 12 months of 30 days plus a mini month of 5 or 6 days, and New Year is on 11 September 🎉 ✅ or ❌?"),
         flag_c=('Argentina, EASY', """Easy one… or is it? 👀
Flag a Day · Day 13/30 🔥
✍️ Comment your answer before the timer hits 0.
Play with up to 12 friends at roviko.app
#fyp #foryou #flags #quiz #geography""", "What's your streak so far? 🔥")),
    dict(post=14, funny='roviko-short-14-twinflags.mp4', fact=14, flag=14,
         car=('The Americas, round 3', """The Americas round 3 🌎 Number 5 speaks Dutch 👀
5 countries. Every swipe gets harder.
✋ Guess first, then swipe. No googling.
🏆 Your rank is waiting on the last slide.
Comment your score + the one that fooled you 👇
#fyp #foryou #geography #quiz #guessthecountry""", "Did you know number 5 speaks Dutch? 🇸🇷👇"),
         fun=('Flags that are basically the same flag', """Flags that are basically the same flag 😵‍💫
Chad vs Romania. Indonesia vs Monaco. Ireland vs Ivory Coast. Australia vs New Zealand.
Which pair gets you every time? 👇
Spot the difference daily at roviko.app
#fyp #foryou #funny #flags #geography""", "Chad and Romania: the blue is just a tiny bit darker on Chad's flag. Did you know? 👀"),
         fact_c=('South Africa has 3 capitals', """One country has THREE capital cities 🏛️🏛️🏛️
South Africa, Bolivia or the Netherlands? A, B or C 👇
Play one geography quiz a day at roviko.app (link in bio). No account needed.
#fyp #foryou #didyouknow #funfacts #geography""", "South Africa 🇿🇦: Pretoria (government), Cape Town (parliament) and Bloemfontein (courts). Bonus: the Dutch government and parliament sit in The Hague, not in the capital Amsterdam 🇳🇱 ✅ or ❌?"),
         flag_c=('Sri Lanka, HARD', """Hard mode 😈 Only real flag nerds get this in 3 seconds
Flag a Day · Day 14/30 🔥
✍️ Comment your answer before the timer hits 0.
📌 Save this and test your friends.
#fyp #foryou #flags #quiz #geography""", "Did you get it in 3 seconds? Be honest 😅")),
    dict(post=15, funny='roviko-short-15-memory.mp4', fact=15, flag=15,
         car=('Around the world, round 3', """Around the world, round 3 🌍 Number 5 is completely surrounded by one country
5 continents. 5 countries. 1 legend.
✋ Guess before you swipe. The last slide tells you if you're a Geography legend.
Comment your total: __/5
#fyp #foryou #geography #quiz #guessthecountry""", "Who got 5/5? 👑 Show yourself."),
         fun=('I drew Europe from memory', """I drew Europe from memory ✏️ 10/10, no notes.
Then I checked the real map… 💀
Rate my Europe 1 to 10 👇 (be nice)
Learn the real map at roviko.app
#fyp #foryou #funny #geography #europe""", "Try it yourself: draw Europe from memory and post it. Tag us, we'll rate it 😅"),
         fact_c=('Only 2 countries do not border Brazil', """Brazil borders every South American country except TWO 🇧🇷
Chile & Ecuador, Peru & Chile, or Colombia & Ecuador? A, B or C 👇
Fewer geography fails, starting today 👉 roviko.app (link in bio)
#fyp #foryou #didyouknow #funfacts #geography""", "A: Chile 🇨🇱 and Ecuador 🇪🇨. Brazil has 10 neighbours, and one of them is France, through French Guiana 🇫🇷 ✅ or ❌?"),
         flag_c=('Türkiye, EASY', """Free point today. Don't blow it 👀
Flag a Day · Day 15/30 🔥
✅ or ❌? Comment it and keep your streak going 🔥
Daily geography trips at roviko.app
#fyp #foryou #flags #quiz #geography""", "Halfway there! What's your streak? 🔥")),
    dict(post=16, funny='roviko-short-16-bigger.mp4', fact=16, flag=16,
         car=('Europe, round 4', """Europe round 4 🇪🇺 The final Europe challenge. Number 5 is evil 😈
5 countries. Every swipe gets harder.
✋ Guess BEFORE you swipe. No googling.
🏆 Your rank is on the last slide.
Comment your score like this: 3/5
#fyp #foryou #geography #quiz #guessthecountry""", "Round 1, 2, 3 or 4: which Europe round was hardest? 👇"),
         fun=('Roviko is very sure which one is bigger', """Roviko is VERY sure which one is bigger 😎
Japan or Germany? Brazil or Australia? Mongolia or Iran?
Did you beat Roviko? Comment your score /3 👇
Play Side by Side daily at roviko.app
#fyp #foryou #funny #geography #quiz""", "Roviko got 0/3. Which one surprised you most? 👇"),
         fact_c=('Nepal has the only non-rectangular flag', """Only ONE country's flag is not a rectangle 🚩
Nepal, Switzerland or Bhutan? A, B or C 👇
One "wait, really?!" fact a day 👉 roviko.app (link in bio)
#fyp #foryou #didyouknow #funfacts #flags""", "Nepal 🇳🇵: two stacked triangles. And 8 of the world's 10 highest mountains are in Nepal, including Everest (8,849 m) ✅ or ❌?"),
         flag_c=('Mongolia, MEDIUM', """Medium mode. 3 seconds. No pausing 👀
Flag a Day · Day 16/30 🔥
✍️ Comment your answer before the timer hits 0.
Flags, maps and capitals at roviko.app
#fyp #foryou #flags #quiz #geography""", "Got it before 2 or before 1? ⏱️")),
    dict(post=17, funny='roviko-short-17-africa.mp4', fact=17, flag=17,
         car=('Africa, round 4', """Africa round 4 🌍 Number 5 has the same name as its capital
5 countries. Harder with every swipe.
👀 Type your guess in the comments before you swipe.
Last slide = your rank. Tourist or Legend?
#fyp #foryou #geography #quiz #guessthecountry""", "Name another country with the same name as its capital 👇"),
         fun=('POV: your friend has been to Africa', """POV: your friend has "been to Africa" 🌍✈️
"Which country?" "…Africa." 💀
Africa is 54 countries. Name 5 that aren't Egypt 👇
All 54, every day at roviko.app
#fyp #foryou #funny #geography #africa""", "54 countries, and we want to see all of them in the comments. Go 👇"),
         fact_c=('Istanbul lies on two continents', """One city lies on TWO continents 🌉
Cairo, Istanbul or Moscow? A, B or C 👇
Facts like this, as a 5-minute daily quiz 👉 roviko.app (link in bio)
#fyp #foryou #didyouknow #funfacts #geography""", "Istanbul 🇹🇷: the Bosphorus splits it between Europe and Asia. Bonus: it's not the capital, Ankara is ✅ or ❌?"),
         flag_c=('Australia, TRAP', """TRAP 🪤 This flag has a twin. Which one is it?
Flag a Day · Day 17/30 🔥
✍️ Comment your answer before the timer hits 0.
Play with up to 12 friends at roviko.app
#fyp #foryou #flags #quiz #geography""", "Team Australia or team New Zealand? 👇")),
    dict(post=18, funny='roviko-short-18-pronounce.mp4', fact=18, flag=18,
         car=('Asia, round 4', """Asia round 4 🌏 One of these has a capital most people get wrong 👀
5 countries. Harder with every swipe.
✍️ Keep count as you go. The answer is always one swipe away.
Drop your score: __/5
#fyp #foryou #geography #quiz #guessthecountry""", "Which capital did you get wrong? 👇"),
         fun=("Countries you've been pronouncing wrong", """Countries you've been pronouncing wrong 🗣️
Kiribati = KIRR-i-bass. Lesotho = leh-SOO-too. Niger = nee-ZHAIR. Nauru = nah-OO-roo.
Which one did you say wrong? 👇
Know them, say them right at roviko.app
#fyp #foryou #funny #geography #learnontiktok""", "Kiribati got me for years 😅 Which country name should we do next? 👇"),
         fact_c=('Europe and Africa are 14 km apart', """Europe and Africa are only ___ apart 😳
14 km, 140 km or 400 km? Comment A, B or C 👇
Play one geography quiz a day at roviko.app (link in bio). No account needed.
#fyp #foryou #didyouknow #funfacts #geography""", "A: about 14 km, across the Strait of Gibraltar 🇪🇸🇲🇦 On a clear day you can see Morocco from Spain. Bonus: Spain has two cities in Africa, Ceuta and Melilla ✅ or ❌?"),
         flag_c=('Jamaica, MEDIUM', """This one splits the comments every time 👀
Flag a Day · Day 18/30 🔥
✅ or ❌? Comment it and keep your streak going 🔥
Daily geography trips at roviko.app
#fyp #foryou #flags #quiz #geography""", "What's your streak so far? 🔥")),
    dict(post=19, funny='roviko-short-19-onegame.mp4', fact=19, flag=19,
         car=('The Americas, round 4', """The Americas round 4 🌎 Number 3 connects two continents
5 countries. Every swipe gets harder.
✋ Guess first, then swipe. No googling.
Comment your score + the one that fooled you 👇
#fyp #foryou #geography #quiz #guessthecountry""", "Be honest: did number 5 fool you? 😅"),
         fun=('Me at 20:00: just ONE quick game', """Me at 20:00: "just ONE quick game" 😌
Me at 02:47: 💀
Tag the friend who always says "one more game" 👇
Six games a day at roviko.app (then stop. maybe.)
#fyp #foryou #funny #relatable #gaming""", "What time did YOU stop last night? 🕒👇"),
         fact_c=("Algeria is Africa's biggest country", """Africa's biggest country is NOT DR Congo or Nigeria 🌍
Nigeria, DR Congo or Algeria? A, B or C 👇
Test yourself every day at roviko.app (link in bio)
#fyp #foryou #didyouknow #funfacts #geography""", "Algeria 🇩🇿: about 2.38 million km², number 1 since Sudan split in 2011. That's more than 4 times mainland France 🇫🇷 ✅ or ❌?"),
         flag_c=('Vietnam, EASY', """3 seconds is plenty for this one… right? ⏱️
Flag a Day · Day 19/30 🔥
✍️ Comment your answer before the timer hits 0.
Send this to the friend who never gets flags right 👀
#fyp #foryou #flags #quiz #geography""", "Which flag should we do tomorrow? 👇")),
    dict(post=20, funny='roviko-short-20-illegal.mp4', fact=20, flag=20,
         car=('Around the world, round 4', """The final boss, round 4 🌍👑
5 continents. 5 countries. 1 legend.
✋ Guess before you swipe. The last slide tells you if you're a Geography legend.
Did all 20 challenges? Comment your total: __/100
#fyp #foryou #geography #quiz #guessthecountry""", "Who did all 20 map challenges? 👑 Drop your total."),
         fun=('Map facts that feel illegal', """Map facts that feel illegal 🚨
Rome is further north than New York. Reno is further west than Los Angeles. And from Detroit, Canada is to the SOUTH.
Drop a map fact that feels illegal 👇
#fyp #foryou #funny #geography #maps""", "Best illegal map fact in the comments gets its own video 👀👇"),
         fact_c=('The highest mountain of the Netherlands is a volcano', """The highest mountain in the Netherlands is… 🇳🇱
A dune, a volcano or a hill in Limburg? Comment A, B or C 👇
One "wait, really?!" fact a day 👉 roviko.app (link in bio)
#fyp #foryou #didyouknow #funfacts #netherlands""", "B: a volcano 🌋 Mount Scenery (887 m) on Saba in the Caribbean, part of the Netherlands since 2010. In Europe the Dutch top is the Vaalserberg: 322 m ✅ or ❌?"),
         flag_c=('Kazakhstan, MEDIUM', """Medium mode 👀 Gold on blue. 3 seconds. Go.
Flag a Day · Day 20/30 🔥
✍️ Comment your answer before the timer hits 0.
📌 Save this and test your friends.
#fyp #foryou #flags #quiz #geography""", "Got it before 2 or before 1? ⏱️")),
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
