from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1080, 1080
img = Image.new('RGB', (W, H))
draw = ImageDraw.Draw(img)

# Background gradient (simulate with rectangles)
for y in range(H):
    r = int(27 + (46 - 27) * y / H)
    g = int(94 + (142 - 94) * y / H)
    b = int(32 + (60 - 32) * y / H)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# Decorative circles
overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
odraw = ImageDraw.Draw(overlay)
odraw.ellipse([580, -100, 1180, 500], fill=(255, 255, 255, 10))
odraw.ellipse([-100, 580, 500, 1180], fill=(0, 0, 0, 20))
img.paste(Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB'))
draw = ImageDraw.Draw(img)

# Try to load fonts
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

font_brand = get_font(32, bold=True)
font_headline = get_font(72, bold=True)
font_headline_sm = get_font(68, bold=True)
font_feature = get_font(27, bold=False)
font_feature_b = get_font(27, bold=True)
font_tag = get_font(20, bold=True)
font_url = get_font(40, bold=True)
font_contact = get_font(20, bold=False)
font_dti = get_font(14, bold=True)

x_pad = 70
y = 65

# Brand
draw.text((x_pad, y), "CebuLandMarket", fill=(255, 255, 255), font=font_brand)

# DTI badge
dti_text = "DTI REGISTERED"
dti_x = x_pad + draw.textlength("CebuLandMarket", font=font_brand) + 20
dti_w = draw.textlength(dti_text, font=font_dti) + 24
draw.rounded_rectangle([dti_x, y + 6, dti_x + dti_w, y + 30], radius=12, fill=(255, 255, 255, 40))
draw.text((dti_x + 12, y + 9), dti_text, fill=(200, 230, 201), font=font_dti)

y = 190

# Headline
draw.text((x_pad, y), "Sell Your Property", fill=(255, 255, 255), font=font_headline)
y += 85
draw.text((x_pad, y), "in ", fill=(255, 255, 255), font=font_headline_sm)
cebu_x = x_pad + draw.textlength("in ", font=font_headline_sm)
draw.text((cebu_x, y), "Cebu", fill=(255, 213, 79), font=font_headline_sm)

y = 420

# Features
features = [
    ("$", "List for only P500 — Full refund if not approved"),
    ("i", "Documents verified before posting"),
    ("=", "Direct from owners — No middlemen"),
    ("v", "Listing stays active until sold"),
]
icons = ["💰", "📋", "🤝", "✅"]
icon_labels = ["P", "D", "O", "OK"]

for i, (icon, text) in enumerate(features):
    # Icon box
    box_x, box_y = x_pad, y
    draw.rounded_rectangle([box_x, box_y, box_x + 50, box_y + 50], radius=14, fill=(56, 120, 56))
    draw.text((box_x + 12, box_y + 10), icon_labels[i], fill=(200, 230, 201), font=font_tag)
    # Text
    draw.text((box_x + 66, box_y + 10), text, fill=(232, 245, 233), font=font_feature)
    y += 68

y = 730

# Property type tags
types = ["Lots & Land", "House & Lot", "Condominium", "Farm Land", "Commercial", "Beach Property"]
tx = x_pad
for t in types:
    tw = draw.textlength(t, font=font_tag) + 40
    draw.rounded_rectangle([tx, y, tx + tw, y + 42], radius=21, fill=(56, 120, 56))
    draw.text((tx + 20, y + 10), t, fill=(255, 255, 255), font=font_tag)
    tx += tw + 12
    if tx > W - 200:
        tx = x_pad
        y += 52

y = max(y + 80, 900)

# Bottom section
draw.text((x_pad, y), "cebulandmarket.com", fill=(255, 213, 79), font=font_url)

# Contact
contact = "Message us on Facebook"
cw = draw.textlength(contact, font=font_contact)
draw.text((W - x_pad - cw, y + 10), contact, fill=(200, 230, 201), font=font_contact)

# Save
out_path = os.path.expanduser("~/Desktop/cebulandmarket-promo.jpg")
img.save(out_path, "JPEG", quality=95)
print(f"Saved to {out_path}")
