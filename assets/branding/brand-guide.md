# Splitly — Brand Identity & Design System

## 1. Brand Essence

**Splitly** is an open source, privacy-first media engineering utility designed to split videos by size and extract lightweight audio locally in the browser via WebAssembly.

The visual identity is engineered to communicate:
- **Precision**: Clean geometry, surgical timeline cuts, zero fluff.
- **Privacy**: Local, sovereign processing without external cloud dependencies.
- **Performance**: High contrast dark aesthetics, electric lime accents, responsive feedback.

---

## 2. Logo Concept & Geometry

The Splitly mark combines three core conceptual elements:
1. **The Divided Waveform / Timeline**: Representing the surgical splitting of multimedia streams.
2. **The Dynamic Play / Media Fragment**: A segmented media glyph split along an acute diagonal axis.
3. **The Stylized "S"**: Forming a recognizable monogram that remains sharp down to a 16×16 favicon.

### Internal Concept Evaluations
- **Concept A (Waveform Blocks)**: Pure horizontal bars. Clean, but lacked distinctive silhouette at favicon sizes.
- **Concept B (Fragmented Play Triangle)**: Distinctive media metaphor, but lacked strong letterform identity.
- **Concept C (Selected — Dynamic Split Monogram)**: Combines a precision diagonal cut, dual wave blocks, and central fulcrum dot. Highest mark recognition, scalable from 16px to billboard dimensions.

---

## 3. Color Palette

```
Dark Surface (Base)      Graphite Layer           Electric Lime (Accent)   Pure Off-White
#090a0d                  #15171c                  #a6ff4d                  #f5f7fa
RGB(9, 10, 13)           RGB(21, 23, 28)          RGB(166, 255, 77)        RGB(245, 247, 250)
Primary Background       Cards / Modals           Focus, Actions, Energy   Headings & Primary Text
```

### Functional Colors
- **Accent Interactive**: `#a6ff4d` (Hover: `#b5ff6c`, Ink text on accent: `#10170a`)
- **Muted Text**: `#9299a6` (Contrast ratio > 4.6:1 against `#090a0d`, WCAG AA compliant)
- **Subtle Muted**: `#6f7681` (Secondary metadata, borders)
- **Border Default**: `rgba(255, 255, 255, 0.09)`
- **Border Focused**: `rgba(166, 255, 77, 0.55)`
- **Error / Danger**: `#ff756e`
- **Warning / Alert**: `#ffd66b`

---

## 4. Typography

- **Headings & Display**: `Manrope` (Weights: 700, 800)
  - Letter-spacing: `-0.03em` to `-0.05em`
  - High geometric precision, round terminals, modern developer-tool aesthetic.
- **Body & Controls**: `DM Sans` (Weights: 400, 500, 700)
  - Highly legible at small sizes (10px - 14px), generous x-height.
- **Monospace & Code**: `ui-monospace`, `SFMono-Regular`, `Consolas`, monospace.

---

## 5. Logo Assets & File Hierarchy

| File | Format | Description |
|---|---|---|
| `assets/branding/icon.svg` | SVG | Square standalone brand icon with subtle gradient and glow |
| `assets/branding/logo.svg` | SVG | Canonical horizontal logo (icon + wordmark + version pill) |
| `assets/branding/logo-dark.svg` | SVG | Optimized for deep dark graphite backgrounds |
| `assets/branding/logo-light.svg` | SVG | Inverted version for light backgrounds / documentation |
| `assets/branding/wordmark.svg` | SVG | Standalone typographic wordmark |
| `public/favicon.svg` | SVG | Optimized 64×64 browser tab icon |
| `public/og-image.png` | PNG | 1200×630 Open Graph & social share card |

### Clear Space & Minimum Sizes
- **Minimum Digital Size**: 16×16px (favicon), 24×24px (UI icon).
- **Clear Space**: At least 50% of the mark's width on all four sides.
- **Unacceptable Usage**:
  - Do NOT distort or stretch the aspect ratio.
  - Do NOT combine with official third-party trademarks (e.g. Google or NotebookLM logos).
  - Do NOT apply drop shadows outside designated brand specifications.
