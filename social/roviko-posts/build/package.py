"""Writes x/POSTS.md and a ready-to-post zip: every image next to its text.

Run from social/roviko-posts/ after rendering: `python3 build/package.py [out.zip]`.
"""
import glob, os, re, sys, zipfile
from post_copy import INSTAGRAM, X, X_PROFILE, X_TEXT

def x_length(text):
    """X's count: a link is 23, emoji and other wide characters count as 2."""
    text = re.sub(r'\b[\w-]+\.app\b', 'x' * 23, text)
    return sum(2 if ord(c) > 0x2000 and c not in '’—–·' else 1 for c in text)

def x_block(p):
    out = [f"## {p['id']}", '']
    if p.get('images'): out += [f"**Image:** {', '.join(p['images'])}", '']
    out += ['```', p['text'], '```', f"({x_length(p['text'])}/280)", '']
    if p.get('poll'): out += [f"**Poll:** {' / '.join(p['poll'])}", '']
    if p.get('alt'): out += [f"**Alt text:** {p['alt']}", '']
    for r in p.get('replies', []): out += ['**Reply:**', '```', r, '```', '']
    if p.get('note'): out += [f"_{p['note']}_", '']
    return out

def posts_md():
    out = ['# X posts for Roviko', '', 'Images: `x/*.png` (1600×900; the header is 1500×500). Texts are generated from `build/post_copy.py`.', '',
           '## Profile', '', f"- **Name:** {X_PROFILE['name']}", f"- **Bio:** {X_PROFILE['bio']} ({x_length(X_PROFILE['bio'])}/160)",
           f"- **Website:** {X_PROFILE['website']}", '- **Profile picture:** `x/profile-picture.png`',
           '- **Header:** `x/profile-header.png`', f"- **Pinned post:** {X_PROFILE['pinned']}", '',
           '# Image posts', '']
    for p in X: out += x_block(p)
    out += ['# Text posts (in between)', '']
    for p in X_TEXT: out += x_block(p)
    return '\n'.join(out)

for p in X + X_TEXT:
    for t in [p['text']] + p.get('replies', []):
        assert x_length(t) <= 280, p['id']

if __name__ == '__main__':
    open('x/POSTS.md', 'w').write(posts_md())
    out = sys.argv[1] if len(sys.argv) > 1 else 'Roviko-ready-to-post.zip'
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        for post in INSTAGRAM:
            base = f"Instagram/Feed/{post['dir']}/"
            for f in sorted(glob.glob(post['dir'] + '/*.png')):
                z.write(f, base + os.path.basename(f))
            txt = f"CAPTION\n\n{post['caption']}\n\nALT TEXT\n\n{post['alt']}\n" + (f"\nNOTE\n\n{post['later']}\n" if post.get('later') else '')
            z.writestr(base + 'caption.txt', txt)
        for f in sorted(glob.glob('stories/*/*.png')):
            if not f.endswith('overview.png'):
                z.write(f, 'Instagram/Stories/' + f.split('/', 1)[1])
        z.write('stories/overview.png', 'Instagram/Stories/overview.png')
        for f in sorted(glob.glob('x/*.png')):
            z.write(f, 'X/' + os.path.basename(f))
        z.write('x/POSTS.md', 'X/POSTS.md')
        z.write('README.md', 'README.md')
        # Share image without "no ads" (replaces 01-logo/deelafbeelding-1200x630.png in the brand kit).
        z.write('../../roviko/public/og/roviko-1200x630.png', 'Brand-kit-update/deelafbeelding-1200x630.png')
    print(out, sum(1 for _ in zipfile.ZipFile(out).namelist()), 'files')
