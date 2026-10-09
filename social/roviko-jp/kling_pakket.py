# Build the Kling package: python3 social/roviko-jp/kling_pakket.py <out_dir>  ->  <out_dir>/Roviko-Kling(.zip)
import shutil, zipfile, sys
from pathlib import Path
SRC = Path('/home/user/claude/social/roviko-jp')
OUT = Path(sys.argv[1]); root = OUT / 'Roviko-Kling'
if root.exists(): shutil.rmtree(root)
(root / 'personage').mkdir(parents=True); (root / 'montage').mkdir()
names = {'portret-1.png': '1-gezicht-links.png', 'portret-2.png': '2-gezicht-rechts.png', 'vooraanzicht.png': '3-vooraanzicht.png', 'rondom.png': '4-rondom.png'}
for a, b in names.items(): shutil.copy(SRC / 'personage' / a, root / 'personage' / b)
for f in ['roviko-scherm-australie.mp4', 'roviko-eindkaart.mp4']: shutil.copy(SRC / 'out' / f, root / 'montage' / f)

CHAR = ("a 24-year-old woman with long straight honey-blonde hair with lighter highlights and darker roots, green-hazel eyes, "
        "light freckles across her nose and cheeks, a small beauty mark above the right side of her upper lip, small gold hoop earrings, "
        "natural makeup, friendly confident smile")
NEG = ("readable text on the phone screen, logos, watermark, subtitles, extra fingers, deformed hands, distorted face, face changing between frames, "
       "different hair color, blurry face, cartoon, 3d render, plastic skin, oversaturated")
LINE = "Oh shoot… do you think you can do this better? Download Roviko in the App Store and play now."
open(root / 'negatieve-prompt.txt', 'w').write(NEG + '\n')

VIDEOS = [
 ('video-1-kamer', 'Haar kamer, avond',
  f"{CHAR}, wearing an oversized light grey hoodie, sitting cross-legged on her bed in a cozy bedroom at night, warm fairy lights and a small bedside lamp, holding a smartphone in both hands, the screen faces her (not visible to the camera), vertical 9:16 smartphone video, filmed on an iPhone on a tripod at chest height, natural skin texture, realistic, shallow depth of field",
  [("A", "de vraag", 5, "She looks at her phone, smirks and rolls her eyes as if the question is far too easy, says \"What is the capital of Australia? …Too easy.\" and taps the screen confidently with her thumb. Static tripod shot, warm indoor light, realistic natural motion."),
   ("B", "de schrik", 5, "Her smile freezes. She slowly leans closer to her phone, eyebrows rise, she blinks twice in disbelief, mouth slightly open, then glances up. Slow subtle push-in on her face, warm indoor light."),
   ("C", "de zin in de camera", 5, f"She looks straight into the camera, embarrassed but laughing, points at the lens and says: \"{LINE}\" She shrugs at the end with a cheeky smile. Direct eye contact, natural lip movement, static tripod shot.")],
  "Easiest question ever, they said 😎🇦🇺\nThink you can do better? Download Roviko in the App Store 👇\n#fyp #foryou #geography #quiz #australia",
  "Be honest: did you also say Sydney? 🙋"),
 ('video-2-bushalte', 'Bushalte in de stad, herfst',
  f"{CHAR}, wearing a beige trench coat over a white t-shirt and white earbuds, standing at a city bus stop on a bright autumn afternoon, yellow leaves on the pavement, a red city bus parked slightly out of focus in the background, holding her phone at chest height, the screen faces her, vertical 9:16 selfie-style smartphone video, natural daylight, realistic",
  [("A", "de vraag", 5, "Selfie-style: she grins at the camera and says \"Bus is late, quick geography game… capital of Australia? Too easy,\" then looks down and taps her phone. A light breeze moves her hair, city ambience, handheld selfie framing."),
   ("B", "de schrik en de bus", 5, "She stares at her phone in shock, mouth open. Behind her the red bus closes its doors and drives away from the stop. She turns her head toward the leaving bus, then back to the phone in disbelief. Handheld selfie framing, daylight."),
   ("C", "de zin in de camera", 5, f"She looks into the camera, half laughing, and says: \"{LINE}\" She points at the camera on \"you\". Natural lip sync, autumn daylight, handheld selfie framing, the bus gone in the background.")],
  "Missed the bus AND the question 🚌💀\nCan you do better? Download Roviko in the App Store 👇\n#fyp #foryou #geography #funny #quiz",
  "Capital of Australia, first answer that comes to mind. Go 👇"),
 ('video-3-terras', 'Terras met een vriendin',
  f"{CHAR}, wearing a white t-shirt and a light denim jacket, sitting at a small round table on a sunny café terrace, a cappuccino in front of her, a friend's shoulder and hand holding a coffee cup in the blurred foreground (over-the-shoulder shot), holding her phone up proudly, the screen faces away from the camera, vertical 9:16 smartphone video, golden hour, realistic",
  [("A", "de vraag", 5, "She holds her phone up toward her friend like a challenge and says \"Watch this, I never miss. Capital of Australia,\" then taps the screen with a dramatic flourish. Over-the-shoulder framing, café ambience, golden hour."),
   ("B", "de schrik", 5, "Her friend in the foreground slowly puts the coffee cup down. She looks at her phone, then at her friend, and says \"…since when?\" with a confused, laughing expression. Over-the-shoulder framing, golden hour."),
   ("C", "de zin in de camera", 5, f"She turns to the camera, covers half her face with her hand for a second, then laughs and says: \"{LINE}\" Golden hour light, natural lip sync, medium close-up.")],
  "\"I never miss\" 🙃 (Canberra has been the capital since 1913)\nThink you can do better? Download Roviko in the App Store 👇\n#fyp #foryou #geography #friends #quiz",
  "Tag the friend who would also say Sydney 👇"),
]
for folder, title, start, shots, cap, pin in VIDEOS:
    d = root / folder; d.mkdir()
    open(d / '0-startbeeld-prompt.txt', 'w').write(start + '\n')
    for code, name, dur, p in shots:
        open(d / f'shot-{code}-{name.replace(" ", "-")}.txt', 'w').write(
            f"KLING · Image to Video (of Elements) · 9:16 · {dur} s · Professional/High quality\n"
            f"Startbeeld: 0-startbeeld (gemaakt met 0-startbeeld-prompt.txt) of de laatste frame van de vorige shot\n"
            f"Referenties (Elements): personage/1-gezicht-links.png, 2-gezicht-rechts.png, 3-vooraanzicht.png\n"
            f"Negatieve prompt: zie negatieve-prompt.txt\n\nPROMPT (kopieer alles hieronder):\n\n{CHAR}. {p}\n")
    open(d / 'stem-voor-lipsync.txt', 'w').write(
        "Alleen nodig als Kling de zin niet zelf inspreekt. Gebruik in Kling Lip Sync (of ElevenLabs) een vrolijke, jonge Engelstalige vrouwenstem, licht lachend.\n\n"
        f"Shot A: zie de zin tussen aanhalingstekens in shot-A.\nShot C:\n{LINE}\n")
    open(d / 'caption.txt', 'w').write(f"CAPTION:\n{cap}\n\nPIN (eerste reactie, vastzetten):\n{pin}\n")

open(root / 'montage' / 'MONTAGE.txt', 'w').write("""MONTAGE (CapCut of Premiere), per video, 9:16, 1080x1920, ± 14 s

0,0 – 3,5 s   Shot A  (knip af direct nadat ze tikt)
3,5 – 6,0 s   roviko-scherm-australie.mp4, vanaf 1,6 s in de clip, zodat de tik op Sydney (2,6 s) op ± 4,5 s valt.
              Volledig beeld, of als picture-in-picture over shot A. Fout-geluid ("bwomp") precies als Sydney rood wordt.
6,0 – 8,5 s   Shot B  (0,5 s stilte vóór ze iets zegt: dat is de grap)
8,5 – 13,0 s  Shot C  (de zin in de camera)
13,0 – 18,0 s roviko-eindkaart.mp4 (heeft eigen muziek)

Tekst bovenin 0–3 s: "Easiest question ever 😎"
Bij het posten: zet het AI-label aan (TikTok: AI-generated content; Instagram: AI-label). Verplicht voor realistische AI-video.
""")
open(root / '00-LEES-MIJ.txt', 'w').write(f"""ROVIKO × AI-PERSONAGE · 3 reclamevideo's voor Kling

Wat ze doet: ze speelt Roviko, krijgt "What is the capital of Australia?", kiest Sydney (fout, het is Canberra) en zegt in de camera:
"{LINE}"

MAPPEN
  personage/          4 referentiebeelden (gebruik 1, 2 en 3 als Elements/referentie in elke shot)
  video-1-kamer/      startbeeld-prompt, shot A/B/C, stem, caption
  video-2-bushalte/   idem
  video-3-terras/     idem
  montage/            echte Roviko-schermvideo, eindkaart, MONTAGE.txt
  negatieve-prompt.txt

STAPPEN PER VIDEO
 1. Startbeeld: maak het in Kling (Image Generation, met de referentiebeelden als karakterreferentie) of in Midjourney/Gemini,
    met 0-startbeeld-prompt.txt. Kies het beeld waarop ze het meest op de referentie lijkt.
 2. Shots: Kling > Image to Video, startbeeld erin, prompt uit shot-A.txt, 9:16, 5 s, hoogste kwaliteit, negatieve prompt erbij.
    Shot B en C: begin met de laatste frame van de vorige shot (of het startbeeld), dan blijven kamer en kleding gelijk.
    Maak per shot 3–4 versies en kies de beste.
 3. Stem: zegt ze de zin niet (goed) in de clip, gebruik Kling Lip Sync met de tekst uit stem-voor-lipsync.txt.
 4. Monteer volgens montage/MONTAGE.txt. Het telefoonscherm altijd uit roviko-scherm-australie.mp4 (AI maakt van schermtekst onzin).
 5. Post met caption.txt en zet het AI-label aan.

LET OP
 - In de echte app staan bij deze vraag alleen hoofdsteden als keuze; "Sydney" is voor deze reclame in het scherm gezet.
 - Canberra is de hoofdstad sinds 1913. Roviko staat in de App Store (apps.apple.com/app/id6816171629) en speelt ook op roviko.app.
""")
z = OUT / 'Roviko-Kling.zip'
with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as zf:
    for f in sorted(root.rglob('*')):
        if f.is_file(): zf.write(f, f.relative_to(OUT))
print(z, round(z.stat().st_size / 1e6, 1), 'MB')
