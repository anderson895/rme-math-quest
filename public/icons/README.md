# Custom Icons Folder

I-drop dito ang mga icon image files (PNG/SVG) na papalit sa emoji placeholders,
tapos i-register sa `src/data/iconOverrides.ts`:

```ts
export const ICON_OVERRIDES: Record<string, string> = {
  "👨🏽‍🌾": "/icons/farmer.png",
};
```

## ⚠️ Licensing — basahin muna bago mag-download

| Source | License | Puwede? |
|---|---|---|
| **Kenney.nl** (game assets: buildings, characters, UI) | CC0 — public domain | ✅ Pinakaligtas, walang attribution na kailangan |
| **OpenMoji** (openmoji.org) | CC BY-SA 4.0 | ✅ Ilagay lang ang credit |
| **game-icons.net** | CC BY 3.0 | ✅ Ilagay lang ang credit |
| **SVG Repo** (svgrepo.com) | per-icon (maraming CC0) | ✅ I-check bawat icon |
| **Flaticon** | Sariling license | ⚠️ Mag-download gamit ang SARILI MONG account. Free tier = kailangan ng attribution (hal. "Icons by Freepik — Flaticon" sa credits/About screen ng game). Bawal i-redistribute ang raw files. |

Para sa thesis na ipapakita sa publiko, inirerekomenda ang CC0 (Kenney)
para walang licensing na iisipin.

## Icon ni Tatay Ben (Flaticon)

1. Buksan ang napili mong "old farmer" icon page sa flaticon.com gamit ang
   account mo, i-click ang **Download → PNG 512px** (libre).
2. I-save/i-rename ang file bilang: `public/icons/farmer-ben.png`
3. Wala nang ibang kailangan — naka-wire na sa `iconOverrides.ts` na may
   fallback sa OpenMoji habang wala pa ang file.
4. **Attribution (required ng Flaticon free license):** tingnan ang pangalan
   ng author sa icon page at idagdag sa credits ng game/thesis, hal.:
   > Farmer icon created by [author] — Flaticon (flaticon.com)
