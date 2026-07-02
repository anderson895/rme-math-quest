import { useEffect, useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import FullscreenRoundedIcon from "@mui/icons-material/FullscreenRounded";
import FullscreenExitRoundedIcon from "@mui/icons-material/FullscreenExitRounded";
import { sfxClick } from "../sound";

/** Toggles browser fullscreen — essential on mobile so the game uses
    the whole screen without the address bar. */
export default function FullscreenButton({ sx }: { sx?: object }) {
  const [fs, setFs] = useState<boolean>(!!document.fullscreenElement);

  useEffect(() => {
    const onChange = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = () => {
    sfxClick();
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen().catch(() => {
        /* some browsers (iOS Safari) don't support it — ignore */
      });
    }
  };

  return (
    <Tooltip title={fs ? "Exit fullscreen" : "Fullscreen"}>
      <IconButton onClick={toggle} sx={sx}>
        {fs ? <FullscreenExitRoundedIcon /> : <FullscreenRoundedIcon />}
      </IconButton>
    </Tooltip>
  );
}
