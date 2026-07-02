/* ============================================================
   ICON OVERRIDES — every character/prop resolves to the game's
   own AI-generated asset packs (public/icons/game/*), extracted
   from moduleN_pack.png by tools/slice_packs.py + extract_named.py.
   No emoji, Flaticon, or OpenMoji assets are used anymore; the
   emoji keys below are just stable IDs used in the level data.
   ============================================================ */

export const ICON_OVERRIDES: Record<string, string | string[]> = {
  // main characters
  "👨🏽‍🌾": "/icons/game/tatay-ben.png",
  "👩🏽‍💼": "/icons/game/manang-lalay.png",
  "🕺🏽": "/icons/game/kuya-onyok.png",

  // player avatars
  "👦🏽": "/icons/game/bunso.png",
  "👧🏽": "/icons/game/girl.png",
  "🎒": "/icons/game/bunso.png",

  // townsfolk (customers, helpers)
  "🧒🏽": "/icons/game/boy.png",
  "👵🏽": "/icons/game/lola.png",
  "👷🏽": "/icons/game/worker.png",

  // props
  "🐃": "/icons/game/cart.png",
  "🌾": "/icons/game/palay.png",
};
