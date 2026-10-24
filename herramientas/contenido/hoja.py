import sys
from PIL import Image
out=sys.argv[1]; files=sys.argv[2:]; cols=int(__import__('os').environ.get('COLS','4'))
ims=[Image.open(f).convert('RGB') for f in files]
w=int(__import__('os').environ.get('W','480')); h=int(ims[0].height*w/ims[0].width)
rows=(len(ims)+cols-1)//cols
S=Image.new('RGB',(cols*w+(cols-1)*10,rows*h+(rows-1)*10),'#888')
for i,im in enumerate(ims):
    S.paste(im.resize((w,h),Image.LANCZOS),((i%cols)*(w+10),(i//cols)*(h+10)))
S.save(out)
