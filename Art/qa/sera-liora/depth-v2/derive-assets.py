from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter,ImageChops
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

# Post-wake bedding is a deterministic room-state overlay. It remains clipped
# to the exact authored right-bed silhouette. A displaced pillow, exposed sheet
# and blanket bunched to one side make the occupied bed read as unmade without
# replacing its authored frame or changing collision/depth geometry.
scale=4
unmade=Image.new('RGBA',(room.width*scale,room.height*scale))
draw=ImageDraw.Draw(unmade,'RGBA')
S=lambda points:[(round(x*scale),round(y*scale)) for x,y in points]
# A loose sheet crosses the mattress diagonally instead of retaining the made
# bed's straight horizontal edge. A blurred fixed shadow lets it inherit the
# room's painted softness without runtime randomness.
sheet=[(390,205),(399,198),(410,196),(421,200),(431,204),(442,201),
       (452,196),(463,200),(473,207),(480,216),(476,225),(469,231),
       (472,239),(464,246),(454,248),(444,245),(435,249),(426,254),
       (416,251),(409,245),(401,248),(394,241),(396,232),(391,224)]
sheetMask=Image.new('L',unmade.size);ImageDraw.Draw(sheetMask).polygon(S(sheet),fill=255)
sheetShadow=Image.new('RGBA',unmade.size,(0,0,0,0));sheetShadow.putalpha(sheetMask.filter(ImageFilter.GaussianBlur(2*scale)))
shadowTint=Image.new('RGBA',unmade.size,(87,47,62,52));shadowTint.putalpha(ImageChops.multiply(sheetShadow.getchannel('A'),Image.new('L',unmade.size,52)))
unmade.alpha_composite(shadowTint,(1*scale,2*scale))
draw=ImageDraw.Draw(unmade,'RGBA')
draw.polygon(S(sheet),fill=(239,224,196,238))
draw.line(S([(400,214),(416,208),(432,217),(449,206),(468,214)]),
          fill=(255,248,230,118),width=2*scale,joint='curve')
draw.line(S([(398,234),(417,227),(437,238),(459,228),(472,236)]),
          fill=(139,98,94,70),width=1*scale,joint='curve')
draw.line(S([(409,248),(424,242),(440,249),(456,243)]),
          fill=(135,93,90,58),width=1*scale,joint='curve')

# The rose blanket is gathered to one side in overlapping folds. Its broken,
# rounded silhouette is clear at native resolution but stays within the bed.
blanket=[(440,230),(450,225),(461,227),(469,233),(478,232),(486,239),
         (483,249),(476,255),(481,263),(475,271),(466,272),(459,279),
         (449,276),(445,269),(438,265),(441,255),(436,247)]
draw.polygon(S(blanket),fill=(166,92,111,218))
draw.line(S([(450,232),(459,240),(455,250),(467,258),(457,269)]),
          fill=(229,157,168,104),width=2*scale,joint='curve')
draw.line(S([(478,237),(469,248),(477,258),(466,269)]),
          fill=(96,49,68,82),width=1*scale,joint='curve')

# One pillow has been pushed askew against the head of the bed.
pillow=Image.new('RGBA',(68*scale,39*scale))
pd=ImageDraw.Draw(pillow,'RGBA')
pd.rounded_rectangle((4*scale,5*scale,63*scale,34*scale),radius=8*scale,
                     fill=(243,228,199,238))
pd.line(S([(12,23),(25,18),(38,22),(55,17)]),fill=(255,248,230,108),width=1*scale)
pillow=pillow.rotate(-9,resample=Image.Resampling.BICUBIC,expand=True)
unmade.alpha_composite(pillow,(401*scale,178*scale))
unmade=unmade.resize(room.size,Image.Resampling.LANCZOS)
bedMask=Image.new('L',room.size);ImageDraw.Draw(bedMask).polygon(polygons['right-bed'],fill=255)
unmade.putalpha(ImageChops.multiply(unmade.getchannel('A'),bedMask))
unmade.save(out/'right-bed-unmade.png')
print('Created versioned sources and eight runtime assets')
