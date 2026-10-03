"""Recolor the existing SCOPE artwork; preserve its alpha/geometry.
Run: python tools/render_brand.py /path/to/original-high-resolution.png
No generated or replacement emblem is used.
"""
from pathlib import Path
import sys
import numpy as np
from PIL import Image, ImageFilter

root = Path(__file__).resolve().parents[1]
original = Image.open(sys.argv[1]).convert('RGBA')
# Crop only transparent margin; retain every visible pixel of the real artwork.
bounds = original.getchannel('A').point(lambda a: 255 if a > 96 else 0).getbbox()
source = original.crop(bounds)
p = np.array(source).astype(float)
h, w = p.shape[:2]
y, x = np.mgrid[:h, :w]
lum = (p[:,:,0]*.2126+p[:,:,1]*.7152+p[:,:,2]*.0722)/255
# Warm metal with a gentle diagonal highlight and original artwork shading.
shine = .5+.5*np.cos((y/h*.9+x/w*.35)*np.pi*3)
strength = np.clip(.64+.23*lum+.13*shine,0,1)
low = np.array([159,111,43]); high = np.array([255,231,155])
p[:,:,:3] = low+(high-low)*strength[:,:,None]
gold = Image.fromarray(p.astype('uint8'),'RGBA')
gold.quantize(colors=128, method=Image.Quantize.FASTOCTREE).save(root/'scope-emblem-gold.png', optimize=True)
for size in [180,192,512]:
    canvas = np.zeros((size,size,4),dtype='uint8')
    yy,xx=np.mgrid[:size,:size];rr=np.sqrt(((xx-size*.45)/size)**2+((yy-size*.3)/size)**2)
    t=np.clip(1-rr*1.8,0,1)
    for ch,a,b in [(0,4,15),(1,12,36),(2,26,58)]:canvas[:,:,ch]=a+(b-a)*t
    canvas[:,:,3]=255
    icon=Image.fromarray(canvas,'RGBA')
    art=gold.copy();art.thumbnail((round(size*.76),round(size*.78)),Image.Resampling.LANCZOS)
    position=((size-art.width)//2,(size-art.height)//2)
    halo=Image.new('RGBA',(size,size));halo.paste((52,150,210,38),position,art.getchannel('A'));halo=halo.filter(ImageFilter.GaussianBlur(size*.028));icon=Image.alpha_composite(icon,halo)
    icon.alpha_composite(art,position);icon.convert('RGB').save(root/f'scope-icon-{size}.png',optimize=True)
print('Gold emblem and 180/192/512 icons rendered from original artwork.')
