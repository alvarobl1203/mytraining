import confetti from 'canvas-confetti';

const BRAND_COLORS = ['#3b82f6', '#22d3ee', '#2563eb', '#67e8f9'];

/** Confetti azul-cian para celebrar un PR. */
export function firePRConfetti() {
  const duration = 1800;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: BRAND_COLORS,
      scalar: 0.9,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: BRAND_COLORS,
      scalar: 0.9,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

/** Confetti corto para celebraciones menores (racha, sesión completada). */
export function fireSmallConfetti() {
  confetti({
    particleCount: 40,
    spread: 70,
    origin: { y: 0.6 },
    colors: BRAND_COLORS,
    scalar: 0.8,
  });
}