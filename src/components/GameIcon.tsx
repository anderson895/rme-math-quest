import { useState } from "react";
import { ICON_OVERRIDES } from "../data/iconOverrides";

/** Sources registered for an emoji, in priority order. */
export function iconSources(icon: string): string[] {
  const v = ICON_OVERRIDES[icon];
  return !v ? [] : Array.isArray(v) ? v : [v];
}

/** Renders the first override image that loads successfully; if an image
    is missing/broken it falls through to the next source, and finally
    back to the emoji placeholder. */
export default function GameIcon({
  icon,
  size = 40,
  alt,
}: {
  icon: string;
  size?: number;
  alt?: string;
}) {
  const sources = iconSources(icon);
  const [idx, setIdx] = useState(0);

  if (idx >= sources.length) {
    return <span style={{ fontSize: size, lineHeight: 1 }}>{icon}</span>;
  }
  return (
    <img
      src={sources[idx]}
      width={size}
      height={size}
      alt={alt ?? icon}
      onError={() => setIdx((i) => i + 1)}
      style={{ verticalAlign: "middle", objectFit: "contain" }}
    />
  );
}
