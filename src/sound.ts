/* ============================================================
   Tiny WebAudio sound engine — placeholder for real musical
   scores listed in the Design Matrix. Replace with <audio>
   tracks per module later without touching game logic.
   ============================================================ */

let ctx: AudioContext | null = null;
let muted = false;
let musicTimer: number | null = null;

const ac = (): AudioContext => {
  ctx = ctx || new (window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  return ctx;
};

function tone(freq: number, at: number, dur: number, gainV = 0.12, type: OscillatorType = "triangle") {
  if (muted) return;
  try {
    const a = ac();
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gainV, a.currentTime + at);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + at + dur);
    o.connect(g).connect(a.destination);
    o.start(a.currentTime + at);
    o.stop(a.currentTime + at + dur);
  } catch {
    /* audio optional */
  }
}

export const sfxClick = () => tone(440, 0, 0.06);
export const sfxCorrect = () => [523, 659, 784].forEach((f, i) => tone(f, i * 0.12, 0.14));
export const sfxWrong = () => [220, 175].forEach((f, i) => tone(f, i * 0.14, 0.16, 0.1, "sawtooth"));
export const sfxCoin = () => [988, 1319].forEach((f, i) => tone(f, i * 0.08, 0.1, 0.08, "square"));
export const sfxFanfare = () =>
  [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.15, 0.2));

/* gentle looping arpeggio as placeholder background music */
const PAD = [262, 330, 392, 494, 392, 330];
export function setMusic(on: boolean) {
  if (musicTimer !== null) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  if (on) {
    let i = 0;
    musicTimer = window.setInterval(() => {
      tone(PAD[i % PAD.length], 0, 0.5, 0.03, "sine");
      i++;
    }, 600);
  }
}

export function setMuted(m: boolean) {
  muted = m;
  if (m) setMusic(false);
}
export const isMuted = () => muted;
