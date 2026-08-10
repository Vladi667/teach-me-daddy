# Teach me Daddy — design system

Dark, opaque, typographic. The Hebrew glyphs are the only ornament.

## Theme

Dark, because the scene forces it: phone, short bursts, often at night, five
months of daily use. Quiet dark, not glowing dark. No blur, no fog, no glow.

## Color

Strategy: **Restrained.** Tinted neutrals plus one accent that never exceeds
roughly a tenth of any screen.

Every neutral is tinted toward the accent hue (~190°) at very low chroma, so
the greys read as a family rather than as dead slate.

| Token | OKLCH | Role |
| --- | --- | --- |
| `--canvas` | `oklch(0.17 0.008 195)` | Page. Never `#000`. Not named `base`: it would collide with the `text-base` type step. |
| `--surface` | `oklch(0.215 0.009 195)` | Panels, rows, inputs. |
| `--surface-2` | `oklch(0.255 0.010 195)` | Raised: sheets, the tab bar. |
| `--line` | `oklch(0.32 0.010 195)` | Hairline borders. |
| `--line-strong` | `oklch(0.42 0.012 195)` | Focus rings, active edges. |
| `--ink` | `oklch(0.97 0.004 195)` | Primary text. |
| `--ink-2` | `oklch(0.78 0.008 195)` | Secondary text. |
| `--ink-3` | `oklch(0.62 0.008 195)` | Labels, meta. |
| `--accent` | `oklch(0.72 0.13 190)` | Tiffany. Primary action, selection, progress. |
| `--accent-ink` | `oklch(0.20 0.03 195)` | Text on a filled accent surface. |
| `--good` | `oklch(0.78 0.17 145)` | Correct, mastered. |
| `--warn` | `oklch(0.80 0.14 75)` | Due soon, over cap. |
| `--bad` | `oklch(0.68 0.19 20)` | Wrong, lapsed. |

Accent is for primary actions, the current tab, progress fills, and the active
selection. Never for decoration, never on an inactive state.

## Typography

One family: the platform UI sans. No rounded variant — rounded reads as a toy.

```
-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI Variable Text",
"Segoe UI", Inter, system-ui, sans-serif
```

Fixed rem scale, ratio ~1.15–1.2. No arbitrary pixel values in components.

| Step | Size | Use |
| --- | --- | --- |
| `--t-xs` | 0.6875rem / 11px | Meta, units, tab labels |
| `--t-sm` | 0.8125rem / 13px | Labels, secondary |
| `--t-base` | 0.9375rem / 15px | Body, list rows |
| `--t-md` | 1.0625rem / 17px | Card titles |
| `--t-lg` | 1.3125rem / 21px | Screen titles |
| `--t-xl` | 1.75rem / 28px | The one number that matters |
| `--t-2xl` | 2.5rem / 40px | Wordmark |

Weights 400 / 500 / 600 / 700 only. Numerals are tabular everywhere they can
change. Headings tighten to -0.02em; small text never goes below -0.005em.

Hebrew sets in Noto Sans Hebrew at a larger optical size than its Latin
neighbour, because it carries the screen.

## Layout

4px base grid. Spacing steps: 4, 8, 12, 16, 20, 24, 32, 48.

- Screen gutter 20px. Content column caps at 480px.
- Rhythm is deliberately uneven: 8px inside a group, 16px between groups, 32px
  between sections. Uniform padding everywhere was the old monotony.
- Lists beat cards. A card only appears when a thing is genuinely a separate
  object you can act on. Never a card inside a card.
- Section headers are small, uppercase-tracked labels in `--ink-3`, sitting on
  the page rather than inside a container.

## Radii and elevation

Radii: 8px controls, 12px rows, 16px panels, 20px sheets, 999px pills.
The old 22–28px everywhere read as bubble-gum.

No shadows on the dark canvas; depth comes from surface lightness and hairlines.
One exception: the sheet, which lifts off a scrim.

## Motion

150–200ms, `ease-out-quart`. State changes only: press, selection, reveal,
progress. No entrance choreography, no staggered lists, no drifting background.

`prefers-reduced-motion` collapses everything to instant.

## Components

Every interactive element defines default, hover, focus-visible, active,
disabled. Focus-visible is a 2px `--accent` ring at 2px offset, everywhere,
never removed.

- **Button.** Pill. Primary is filled accent with `--accent-ink`. Secondary is
  `--surface` with a hairline. Minimum 44px tall.
- **Row.** The default container: 12px radius, `--surface`, hairline, 12/16
  padding, content left, value or chevron right.
- **Stat.** Number in `--t-xl` tabular, label in `--t-xs` `--ink-3` beneath.
  Never boxed unless it sits in a group of them.
- **Tab bar.** `--surface-2`, hairline top, active tab marked by accent icon and
  label, not by a filled pill.

## Banned in this codebase

Glass and backdrop blur as a surface treatment. Gradient text. Drifting colour
fog. Glow shadows. Staggered entrance animations. Cards whose only job is to
hold one line of text.
