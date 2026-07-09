# Game Icons

Lahat ng characters at props ng laro ay gumagamit na ng **sariling
AI-generated asset packs** sa `icons/game/*` (na-extract mula sa
`moduleN_pack.png` gamit ang `tools/slice_packs.py` + `extract_named.py`).

Wala nang third-party icon sets (emoji, OpenMoji, Flaticon, atbp.) —
ang mga emoji sa level data ay **stable IDs lang** na nire-resolve ng
`src/data/iconOverrides.ts` papunta sa sariling assets.

## Pagdagdag/pagpalit ng icon

1. I-drop ang PNG sa `public/icons/game/`
2. I-register (o i-update) ang mapping sa `src/data/iconOverrides.ts`:

```ts
export const ICON_OVERRIDES: Record<string, string | string[]> = {
  "👨🏽‍🌾": "/icons/game/tatay-ben.png",
};
```

Kapag walang override ang isang emoji ID, ipapakita ito ng `GameIcon`
bilang plain text emoji — kaya laging i-register ang bagong characters.
