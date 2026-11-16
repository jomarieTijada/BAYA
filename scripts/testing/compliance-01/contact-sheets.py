from PIL import Image,ImageDraw
from pathlib import Path
root=Path('docs/verification/compliance-01')
sizes=[(667,375),(844,390),(915,412),(1024,768),(1366,768)]
for screen in ['welcome','home','lesson','writing','workspaces','mentor-login','settings','mentor-dashboard-fixture','join-modal']:
 rows=[]
 for w,h in sizes:
  imgs=[]
  for lang in ['en','tl']:
   im=Image.open(root/f'{lang}-{screen}-{w}x{h}.png').convert('RGB');im.thumbnail((667,768))
   tile=Image.new('RGB',(683,im.height+32),'#dedede');tile.paste(im,(8,26));ImageDraw.Draw(tile).text((8,8),f'{lang.upper()} | {screen} | {w} x {h}',fill='black');imgs.append(tile)
  row=Image.new('RGB',(1366,max(im.height for im in imgs)),'white')
  for i,im in enumerate(imgs):row.paste(im,(683*i,0))
  rows.append(row)
 sheet=Image.new('RGB',(1366,sum(im.height for im in rows)),'white');y=0
 for im in rows:sheet.paste(im,(0,y));y+=im.height
 sheet.save(root/f'review-{screen}.jpg',quality=88)
