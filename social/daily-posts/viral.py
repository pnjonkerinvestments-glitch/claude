"""Bundle the five real-app films and the three real-screen posts (roviko.app 1.24) into one folder + CAPTIONS.txt.

  python3 social/daily-posts/viral.py <out_dir>   ->  <out_dir>/Roviko-Viraal (+ Roviko-Viraal.zip)

These show the real site, so they are the best ones to pin on the profile or to put money behind.
Post one a day next to the daily posts (suggested days below), at the time your account gets the most views.
"""
import shutil
import sys
import zipfile
from pathlib import Path

SOCIAL = Path(__file__).resolve().parent.parent
FILMS = SOCIAL / 'roviko-shorts' / 'out' / 'viral'
POSTS = SOCIAL / 'roviko-posts' / 'real'

ITEMS = [
    ('film', 1, 'Dag 11', 'This site makes you better at geography in 5 minutes a day', """This website makes you better at geography in 5 minutes a day 🌍
6 tiny games every day: flags, maps, neighbours, rankings, and game night with friends.
Free, no account needed 👉 roviko.app (link in bio)
Which game would you play first? 👇
#fyp #foryou #geography #quiz #learnontiktok""", "Tell us your score after your first trip 👇 We read every comment 🌍"),
    ('post', 1, 'Dag 12', 'The 6 daily games, explained (8 slides)', """6 games. 5 minutes. Every day. 🌍
Swipe to see all six daily games on roviko.app 👉
Up to 1,000 points per game, a new trip every day, no account needed.
Which one is your favourite? 👇
#fyp #foryou #geography #quiz #dailychallenge""", "Rank Radar or Side by Side? Fight in the comments 👇"),
    ('film', 2, 'Dag 13', 'POV: you get it wrong and it shows you exactly where', """POV: you get a geography question wrong… and it shows you EXACTLY where 🗺️
Next Door on roviko.app now shows the whole continent after every answer.
Name all 5 of Bolivia's neighbours 👇
#fyp #foryou #geography #maps #quiz""", "Answer: Brazil, Paraguay, Argentina, Chile and Peru 🇧🇴 How many did you get? 👇"),
    ('film', 3, 'Dag 15', 'Guess the flag before I do (I got 1/4)', """Guess the flag before I do 🏳️ (I'm bad at this)
Pause, guess, then watch me fail.
Your score? /4 👇 (beat my 1/4)
Flags every day at roviko.app
#fyp #foryou #flags #quiz #geography""", "Norway, Greece, Ghana, Sweden. Comment your score 👇"),
    ('post', 2, 'Dag 16', 'Wrong answer? Now you see the whole map (5 slides)', """Wrong answer? Now you see the WHOLE map 🗺️
New on roviko.app: after a neighbour question you get the whole continent, with your pick, the answer and every border.
Name all 5 of Switzerland's neighbours 👇
#fyp #foryou #geography #maps #learnontiktok""", "Answer: France, Germany, Austria, Liechtenstein and Italy 🇨🇭 Did you get Liechtenstein? 👀"),
    ('film', 4, 'Dag 17', 'Game night idea: a geography battle', """Game night idea: a geography battle 🎮
Up to 12 friends in one room. Everyone answers at once, and everyone sees who picked what 👀
Tag your game night crew 👇
Start a room at roviko.app
#fyp #foryou #gamenight #friends #quiz""", "Who's the Lucas of your group? 😂 Tag them 👇"),
    ('film', 5, 'Dag 19', 'Where does Austria rank highest? I said forest. #52.', """Where does Austria rank highest in the world? 🇦🇹
I picked forest cover. #52 😭
What would YOU pick for Austria? 👇
Rank Radar: a new country every day at roviko.app
#fyp #foryou #geography #quiz #austria""", "Play today's Rank Radar and tell us your best pick 👇"),
    ('post', 3, 'Dag 20', 'Game night for up to 12 friends: how it works (6 slides)', """A geography battle for up to 12 friends 🎮
Make a room, share the code, and see who picked what after every round 👀
No friends online? Play the computer 🤖
Tag your game night crew 👇
#fyp #foryou #gamenight #friends #geography""", "Save this for your next game night 📌"),
]
POST_DIRS = {1: 'post-1-six-games', 2: 'post-2-whole-map', 3: 'post-3-game-night'}
LINE = '=' * 60


def main(out):
    out = Path(out)
    root = out / 'Roviko-Viraal'
    if root.exists():
        shutil.rmtree(root)
    root.mkdir(parents=True)
    txt = """ROVIKO VIRAAL: 5 filmpjes en 3 posts met de echte site (roviko.app 1.24)
Plaats er één per dag naast de vaste 4 posts (voorstel: om 18:30), op de dag die erbij staat.
Dezelfde caption werkt op TikTok en Instagram. Deze zijn het beste om vast te pinnen op je profiel.

"""
    for i, (kind, n, day, title, cap, pin) in enumerate(ITEMS, 1):
        if kind == 'film':
            name = f'{i}-film-{n}.mp4'
            shutil.copy(FILMS / f'roviko-real-{n}.mp4', root / name)
            what = 'Video, plaatsen met het eigen geluid.'
        else:
            name = f'{i}-post-{n}'
            for plat in ('tiktok', 'instagram'):
                shutil.copytree(POSTS / POST_DIRS[n] / plat, root / name / plat)
            what = 'Fotocarrousel, slides op volgorde (01, 02, …). tiktok/ = 3:4, instagram/ = 4:5.'
        txt += f"""{LINE}
{i}. {title}  ({day}, 18:30)
{what}
Bestand(en): {name}
{LINE}

CAPTION (kopieer alles hieronder tot aan PIN):

{cap}

PIN (plaats als eerste reactie en zet hem vast):

{pin}

"""
    (root / 'CAPTIONS.txt').write_text(txt)
    z = out / 'Roviko-Viraal.zip'
    with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as zf:
        for f in sorted(root.rglob('*')):
            if f.is_file():
                zf.write(f, f.relative_to(out))
    print(z, round(z.stat().st_size / 1e6, 1), 'MB')


if __name__ == '__main__':
    main(sys.argv[1])
