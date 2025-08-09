# App Icon Design (Minimalistic Option A – Bilingual Bridge)

This document records the rationale and production specs for the updated TranslNathan application icon.

## Concept
**Bilingual Bridge**: A single continuous geometric ribbon combining abstracted Hebrew *Aleph* and Latin *A* forms. Symbolizes transformation and equivalence between languages, not literal letterforms.

## Visual Language
- **Shape**: Rounded square container (macOS standard) with 112 px corner radius on a 512 px canvas (≈22% radius, matches Apple Human Interface Guidelines feel).
- **Glyph**: Faceted ribbon with two vertical pillars and an angled crossbeam; left pillar shorter onset (gesture toward RTL origin), right pillar taller (LTR destination). Bottom convergence implies stability and completion.
- **Style**: Modern flat with micro-depth (inner highlight + subtle outer contrast stroke) for Dock clarity.

## Color System
| Element | Values |
|---------|--------|
| Gradient Background | #585CFF → #7A54F4 → #8E52F6 |
| Glyph (top → bottom) | #FFFFFF (95%) → #F5F8FF (90%) |
| Accent Strokes | rgba(255,255,255,0.12) inner, rgba(0,0,0,0.20) inner shadow line |
| Focus Ring | rgba(255,255,255,0.08) |

Accessible contrast (glyph vs mid gradient ~7:1). Works on both light & dark macOS docks.

## Geometry / Padding
- Canvas: 512 × 512
- Safe inset used: 32 px (≈6.25%)
- Effective glyph bounding box: ~200–360 px region centered after translate(156,134).
- Minimum stroke weight visually: ~26 px outline (translates to >=1 px at 16×16 after scaling from master 1024 asset if doubled for hi-res pipeline).

## Export Guidance
Generate a 1024×1024 master by scaling uniformly 200%.

PNG sizes to export:
```
16, 32, 48, 64, 128, 256, 512, 1024
```

macOS ICNS generation (example):
```
mkdir icon.iconset
sips -z 16 16     icon_1024.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon_1024.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon_1024.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon_1024.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon_1024.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon_1024.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon_1024.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon_1024.png --out icon.iconset/icon_256x256@2x.png
cp icon_1024.png icon.iconset/icon_512x512.png
cp icon_1024.png icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset -o assets/icon.icns
```

(Adjust for actual master filename.)

## Integration Checklist
- Replace `assets/icon.svg` (done)
- Regenerate PNG + ICNS assets (pending manual export)
- Ensure `package.json` build.mac.icon points to `assets/icon.icns`
- Rebuild: `npm run dist-mac`
- Verify Dock + Finder small icon clarity

## Future Enhancements (Optional)
- Animated subtle gradient drift (not supported in static icon; could explore runtime overlays)
- Light mode alt palette (paler lavender background)
- Windows `.ico` multi-res pipeline when Windows build is added

---
Document updated: 2025-08-09
