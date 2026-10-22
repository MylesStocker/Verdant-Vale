from pathlib import Path
from PIL import Image,ImageDraw
import shutil,json
root=Path(__file__).resolve().parents[4]
out=root/'assets/sprites/cutaways/sera-liora/depth-v2';out.mkdir(exist_ok=True)
masters=root/'Art/generated/sera-liora'
sheet=Image.open(masters/'peer-walk-poses-v2-source.png').convert('RGBA')
# One uniform scale for the entire Sera animation, never fit per frame.
seraScale=144/371
frames=Image.new('RGBA',(384,576))
for row,(top,bottom,baseline) in enumerate([(0,384,382),(384,768,764),(768,1138,1135)]):
 for col,(left,right,foot) in enumerate([(0,350,210),(350,675,510),(675,1024,841)]):
  frame=sheet.crop((left,top,right,bottom));frame=frame.resize((round(frame.width*seraScale),round(frame.height*seraScale)),Image.Resampling.LANCZOS)
  canvas=Image.new('RGBA',(128,192));canvas.alpha_composite(frame,(round(64-(foot-left)*seraScale),round(184-(baseline-top)*seraScale)))
  frames.alpha_composite(canvas,(col*128,row*192))
frames.save(out/'sera-walk.png')
lioraScale=147/390
frame=sheet.crop((350,1138,675,1536));frame=frame.resize((round(frame.width*lioraScale),round(frame.height*lioraScale)),Image.Resampling.LANCZOS)
canvas=Image.new('RGBA',(128,192));canvas.alpha_composite(frame,(round(64-160*lioraScale),round(184-390*lioraScale)));canvas.save(out/'liora-standing.png')
poses=Image.open(masters/'liora-waking-poses-v2-source.png').convert('RGBA')
# Both wake poses share the same uniform source-pixel scale and head anchor.
# Crop boundaries isolate silhouettes; they never resize individual anatomy.
for name,box,hx,hy in [('lying',(0,0,812,1024),465,108),('sitting',(850,0,1536,1024),1180-850,140)]:
 frame=poses.crop(box);scale=.16;frame=frame.resize((round(frame.width*scale),round(frame.height*scale)),Image.Resampling.LANCZOS)
 canvas=Image.new('RGBA',(192,216));canvas.alpha_composite(frame,(round(96-hx*scale),round(28-hy*scale)));canvas.save(out/('liora-'+name+'.png'))
# Exact source pixels, never a regenerated room. Masks isolate existing furniture.
room=Image.open(root/'assets/backgrounds/cutaways/sera-liora/guest-room-redraw-v1-runtime.png').convert('RGBA')
polygons={
 'left-bed':[(0,180),(8,159),(37,153),(85,153),(114,169),(133,158),(141,174),(143,220),(121,274),(103,317),(91,349),(0,349)],
 'right-bed':[(369,175),(377,158),(391,170),(447,151),(489,161),(511,177),(511,368),(433,368),(406,318),(389,279),(371,224)],
 'right-cover':[(378,219),(405,215),(443,216),(475,212),(511,211),(511,368),(433,368),(406,318),(389,279)]
}
for name,points in polygons.items():
 mask=Image.new('L',room.size);ImageDraw.Draw(mask).polygon(points,fill=255)
 overlay=room.copy();overlay.putalpha(mask);overlay.save(out/(name+'.png'))
print('Created versioned sources and seven runtime assets')
