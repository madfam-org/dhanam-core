import { CELEBRATION_COLORS } from '@dhanam-core/shared';
import confetti from 'canvas-confetti';

export function fireConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.7 },
  });
}

export function fireGoalConfetti() {
  const duration = 1500;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: [...CELEBRATION_COLORS.goal],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: [...CELEBRATION_COLORS.goal],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
}

export function fireStreakCelebration(weeks: number) {
  // Bigger celebration for bigger milestones
  const intensity = weeks >= 52 ? 150 : weeks >= 24 ? 100 : weeks >= 12 ? 60 : 40;

  confetti({
    particleCount: intensity,
    spread: 100,
    origin: { y: 0.6 },
    colors: [...CELEBRATION_COLORS.streak],
  });
}
