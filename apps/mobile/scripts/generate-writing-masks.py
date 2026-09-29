"""Regenerate the bundled, low-resolution Gavino templates for local practice feedback."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/illustrations/baybayin/gavino"
TARGET = ROOT / "content/writingReferenceMasks.ts"
IDS = "a e_i o_u ba ka da_ra ga ha la ma na nga pa sa ta wa ya".split()
SIZE = 32
PADDING = 3

lines = [
    "/** Generated from bundled Gavino PNG alpha masks. Run scripts/generate-writing-masks.py after asset changes. */",
    "export const writingReferenceMasks: Readonly<Record<string, string>> = {",
]
for character_id in IDS:
    image = Image.open(SOURCE / f"{character_id}.png").convert("RGBA")
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        raise ValueError(f"Empty glyph: {character_id}")
    glyph = alpha.crop(bbox)
    glyph.thumbnail((SIZE - PADDING * 2, SIZE - PADDING * 2), Image.Resampling.LANCZOS)
    output = Image.new("L", (SIZE, SIZE), 0)
    output.paste(glyph, ((SIZE - glyph.width) // 2, (SIZE - glyph.height) // 2))
    mask = "".join("1" if pixel >= 48 else "0" for pixel in output.getdata())
    lines.append(f"  {character_id}: '{mask}',")
lines.append("};")
TARGET.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(TARGET)
