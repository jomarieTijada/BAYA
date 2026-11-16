from PIL import Image,ImageDraw
from pathlib import Path
root=Path('docs/verification/compliance-02')
for screen in ['welcome','bayani-permission-pending','bayani-story','name-origin','baya','dismissed']:
 rows=[]
 for w,h in [(667,375),(844,390),(915,412),(1024,768),(1366,768)]:
  imgs=[]
  for lang in ['en','tl']:
   im=Image.open(root/f'{lang}-{screen}-{w}x{h}.png').convert('RGB');im.thumbnail((667,768))
   tile=Image.new('RGB',(683,im.height+30),'#dedede');tile.paste(im,(8,26));ImageDraw.Draw(tile).text((8,8),f'{lang} | {screen} | {w}x{h}',fill='black');imgs.append(tile)
  row=Image.new('RGB',(1366,max(i.height for i in imgs)),'white')
  for n,im in enumerate(imgs):row.paste(im,(n*683,0))
  rows.append(row)
 sheet=Image.new('RGB',(1366,sum(r.height for r in rows)),'white');y=0
 for row in rows:sheet.paste(row,(0,y));y+=row.height
 sheet.save(root/f'review-{screen}.jpg',quality=88)
