from PIL import Image, ImageDraw, ImageFont
import os

# Facebook cover photo dimensions
W, H = 1640, 624
img = Image.new('RGB', (W, H))
draw = ImageDraw.Draw(img)

# Background gradient
for y in range(H):
    r = int(27 + (46 - 27) * y / H)
    g = int(94 + (142 - 94) * y / H)
    b = int(32 + (60 - 32) * y / H)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# Decorative circles
overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
odraw = ImageDraw.Draw(overlay)
odraw.ellipse([W-400, -200, W+100, 400], fill=(255, 255, 255, 10))
odraw.ellipse([-200, H-300, 400, H+200], fill=(0, 0, 0, 20))
img.paste(Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB'))
draw = ImageDraw.Draw(img)

def get_font(size, bold=False):
    paths = [
        "/System/Library/Fonts/SFPro-Bold.otf" if bold else "/System/Library/Fonts/SFPro-Regular.otf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except:
            continue
    return ImageFont.load_default()

font_big = get_font(52, bold=True)
font_sub = get_font(24, bold=False)
font_url = get_font(22, bold=False)
font_tagline = get_font(20, bold=True)
font_sep = get_font(20, bold=False)

# Center everything
cx = W // 2

# Main headline
headline = "Buy & Sell Land in Cebu"
hw = draw.textlength(headline, font=font_big)
draw.text((cx - hw/2, 120), headline, fill=(255, 255, 255), font=font_big)

# Subtitle
sub = "Affordable Lots, Land & Homes — Document Verified"
sw = draw.textlength(sub, font=font_sub)
draw.text((cx - sw/2, 195), sub, fill=(200, 230, 201), font=font_sub)

# Separator line
draw.line([(cx - 60, 250), (cx + 60, 250)], fill=(255, 213, 79), width=2)

# Direct from owners
direct = "Direct from Owners — No Agents — No Middlemen"
dw = draw.textlength(direct, font=font_sub)
draw.text((cx - dw/2, 275), direct, fill=(255, 213, 79), font=font_sub)

# Website URL - THE CORRECT ONE
url = "cebulandmarket.com"
uw = draw.textlength(url, font=font_url)
draw.text((cx - uw/2, 330), url, fill=(200, 230, 201), font=font_url)

# Tagline at bottom
tagline = "Your Trusted Property Listing Platform in Cebu"
tw = draw.textlength(tagline, font=font_tagline)
draw.text((cx - tw/2, 510), tagline, fill=(255, 255, 255), font=font_tagline)

# DTI badge
dti_font = get_font(14, bold=True)
dti = "DTI REGISTERED"
dti_w = draw.textlength(dti, font=dti_font) + 24
dti_x = cx - dti_w/2
draw.rounded_rectangle([dti_x, 555, dti_x + dti_w, 578], radius=10, fill=(56, 120, 56))
draw.text((dti_x + 12, 559), dti, fill=(200, 230, 201), font=dti_font)

out_path = os.path.expanduser("~/Desktop/cebulandmarket-cover.jpg")
img.save(out_path, "JPEG", quality=95)
print(f"Saved to {out_path}")
