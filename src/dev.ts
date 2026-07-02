/* ============================================================
   DEVELOPMENT OPTIONS
   ============================================================ */

/** Unlock every module and every level (for testing/demos).
    Two ways to enable:
    1. Set the flag below to `true`, or
    2. Open the game with `?dev` in the URL — no code change needed:
         http://localhost:5173/?dev
    Progress/coins still save normally; this only bypasses locks. */
const FORCE_UNLOCK_ALL = false;

export const UNLOCK_ALL_LEVELS =
  FORCE_UNLOCK_ALL || new URLSearchParams(window.location.search).has("dev");
