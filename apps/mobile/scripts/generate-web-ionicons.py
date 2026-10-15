"""Generate font-independent SVG paths for the Ionicons used by AppIcon on web."""

import json
import re
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "components/ui/AppIcon.tsx"
GLYPHS = ROOT.parent.parent / "node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json"
FONT = ROOT.parent.parent / "node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf"
OUTPUT = ROOT / "components/ui/ioniconPaths.web.ts"

source = SOURCE.read_text(encoding="utf-8")
mapping = source.split("const iconNames = {", 1)[1].split("} satisfies", 1)[0]
names = sorted(set(re.findall(r"^\s+\w+: '([^']+)'", mapping, re.M)))
glyph_map = json.loads(GLYPHS.read_text(encoding="utf-8"))
font = TTFont(FONT)
cmap = font.getBestCmap()
glyphs = font.getGlyphSet()
units = font["head"].unitsPerEm

paths = {}
for name in names:
    pen = SVGPathPen(glyphs)
    glyphs[cmap[glyph_map[name]]].draw(pen)
    paths[name] = pen.getCommands()

OUTPUT.write_text(
    "// Generated from the installed Ionicons font by scripts/generate-web-ionicons.py.\n"
    f"export const ioniconUnits = {units};\n"
    f"export const ioniconBaseline = {font['hhea'].ascent};\n"
    "export const ioniconPaths: Record<string, string> = "
    + json.dumps(paths, ensure_ascii=False, indent=2)
    + ";\n",
    encoding="utf-8",
)
print(f"Wrote {len(paths)} SVG icon paths to {OUTPUT}")
