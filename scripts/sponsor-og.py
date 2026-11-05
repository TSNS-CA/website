# /sponsorlar paylaşım görseli (1200×630) üretir: public/sponsor-logos/og-<sezon>.jpg
# Kullanım: pip install pillow && python3 scripts/sponsor-og.py
# Inter fontu gerekir (https://rsms.me/inter); yeri INTER_DIR ile verilebilir.
# Logo listesi aşağıda elle; src/content/sponsors.js değişince burayı da güncelleyin.
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
R=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public')
W,H=1200,630
CREAM=(240,238,230); NAVY=(15,39,71); GOLD=(255,210,0); SLATE=(100,116,139); RED=(200,16,46)
F=os.environ.get('INTER_DIR', '/usr/share/fonts/opentype/inter/')
def font(w,s): return ImageFont.truetype(F+f'Inter-{w}.otf',s)
img=Image.new('RGB',(W,H),CREAM); d=ImageDraw.Draw(img)
d.rectangle([0,0,W,10],fill=GOLD)
# header
logo=Image.open(R+'/tsns.jpeg').convert('RGB'); logo.thumbnail((64,64))
img.paste(logo,(48,40))
d.text((126,48),"Nova Scotia Türk Derneği",font=font('Bold',26),fill=NAVY)
d.text((126,80),"Turkish Society of Nova Scotia",font=font('Medium',18),fill=SLATE)
d.text((48,120),"2026–2027 Sponsorlarımız",font=font('ExtraBold',52),fill=(15,23,42))

def card(box,path,bg=(255,255,255),pad=14,border=None):
    x0,y0,x1,y1=box
    sh=Image.new('RGBA',(W,H),(0,0,0,0)); ds=ImageDraw.Draw(sh)
    ds.rounded_rectangle([x0,y0+6,x1,y1+6],18,fill=(2,6,23,40)); sh=sh.filter(ImageFilter.GaussianBlur(8))
    img.paste(sh,(0,0),sh)
    d.rounded_rectangle(box,18,fill=bg,outline=border or (226,232,240),width=3 if border else 1)
    lg=Image.open(R+path).convert('RGBA'); lg.thumbnail((x1-x0-2*pad,y1-y0-2*pad),Image.LANCZOS)
    img.paste(lg,(x0+(x1-x0-lg.width)//2,y0+(y1-y0-lg.height)//2),lg)

def label(x,y,text,dot):
    d.ellipse([x,y+5,x+10,y+15],fill=dot)
    d.text((x+18,y),text,font=font('Bold',16),fill=SLATE)

top=205
label(48,top,"GOLD SPONSOR",GOLD)
card((48,top+30,560,top+368),'/sponsor-logos/john-atacan.webp',border=GOLD)
label(600,top,"SILVER SPONSOR",(148,163,184))
card((600,top+30,1152,top+130),'/sponsor-logos/bosphorus.webp',pad=10)
label(600,top+150,"BRONZE SPONSORLAR",(176,112,60))
bronze=[('/sponsor-logos/abaci-cleaning.webp',(253,252,247)),('/sponsor-logos/ata-painting.webp',None),('/sponsor-logos/craig-spicer.webp',None),('/sponsor-logos/emin-gulenc.webp',None),
        ('/sponsor-logos/er-construction.webp',None),('/sponsor-logos/nikki-jafari.webp',None),('/sponsor-logos/tonys.webp',None)]
# 4 sütun: 8 yere kadar sığar. Daha fazlası için ch/satır sayısını değiştirin.
cols=4; gap=12; cw=(552-(cols-1)*gap)//cols; ch=89; bx,by=600,top+178
for i,(p,bg) in enumerate(bronze):
    c,r=i%cols,i//cols
    x=bx+c*(cw+gap); y=by+r*(ch+gap)
    card((x,y,x+cw,y+ch),p,bg=bg or (255,255,255),pad=8)
d.text((W-48,58),"tsns.ca/sponsorlar",font=font('SemiBold',22),fill=RED,anchor='ra')
out=R+'/sponsor-logos/og-2026-2027.jpg'
img.save(out,'JPEG',quality=86,optimize=True,progressive=True)
import os; print(os.path.getsize(out)//1024,'KB')
