/* ============================================================
   SackIcon — a tied harvest rice sack drawn in SVG.
   The asset packs have no sack image (🌾 maps to palay.png, a
   rice stalk), so the ordering/weighing levels draw their own:
   a bulgy burlap bag, rope-tied neck, rice grains peeking out.
   ============================================================ */

export default function SackIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ verticalAlign: "middle" }}>
      {/* rice grains peeking from the mouth */}
      <ellipse cx="13.4" cy="5.6" rx="1.6" ry="2.4" fill="#fff8e1" stroke="#d7b98a" strokeWidth="0.7" transform="rotate(-16 13.4 5.6)" />
      <ellipse cx="16.2" cy="4.9" rx="1.6" ry="2.4" fill="#fffde7" stroke="#d7b98a" strokeWidth="0.7" />
      <ellipse cx="18.9" cy="5.7" rx="1.6" ry="2.4" fill="#fff8e1" stroke="#d7b98a" strokeWidth="0.7" transform="rotate(15 18.9 5.7)" />
      {/* bulgy burlap body */}
      <path
        d="M10.5 10.5 C6 13.5 4.5 20 6.5 25 C8 28.6 24 28.6 25.5 25 C27.5 20 26 13.5 21.5 10.5 Z"
        fill="#cf9e63" stroke="#7a5230" strokeWidth="1.7" strokeLinejoin="round"
      />
      {/* gathered neck */}
      <path
        d="M12 6.8 C12 5.2 20 5.2 20 6.8 L21.5 10.5 C18 12.6 14 12.6 10.5 10.5 Z"
        fill="#b98850" stroke="#7a5230" strokeWidth="1.5" strokeLinejoin="round"
      />
      {/* rope tie + knot */}
      <path d="M10.2 10.4 Q16 13.4 21.8 10.4" fill="none" stroke="#5d4037" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="21.6" cy="10.9" r="1.4" fill="#5d4037" />
      {/* burlap fold + highlight */}
      <path d="M9.6 15 Q8.4 20 9.8 24.4" fill="none" stroke="#a97845" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M22.6 15 Q23.6 19.6 22.4 24" fill="none" stroke="#e5bc86" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
