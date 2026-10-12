export const WIDTH = 480;
export const HEIGHT = 640;

export function createGame() {
  return {
    status: 'idle', score: 0, lives: 3, stars: [], spawnElapsed: 0,
    basket: { x: 196, y: 588, width: 88, height: 24 },
  };
}

export function startGame(state) {
  Object.assign(state, createGame(), { status: 'running' });
}

export function moveBasket(state, centerX) {
  const half = state.basket.width / 2;
  state.basket.x = Math.max(0, Math.min(WIDTH - half * 2, centerX - half));
}

export function getFallSpeed(score) {
  return Math.min(350, 150 + Math.floor(score / 5) * 20);
}

function isCaught(star, previousY, basket) {
  // Проверяем весь путь звезды за кадр, чтобы быстрые звёзды не пролетали сквозь корабль.
  return star.x + star.radius >= basket.x
    && star.x - star.radius <= basket.x + basket.width
    && previousY - star.radius <= basket.y + basket.height
    && star.y + star.radius >= basket.y;
}

function advanceStars(state, dt) {
  const speed = getFallSpeed(state.score);
  const remaining = [];
  for (const star of state.stars) {
    const previousY = star.y;
    star.y += speed * dt;
    if (isCaught(star, previousY, state.basket)) {
      state.score += 1;
    } else if (star.y - star.radius > HEIGHT) {
      state.lives -= 1;
      if (state.lives === 0) {
        state.status = 'over';
        state.stars = [];
        return;
      }
    } else {
      remaining.push(star);
    }
  }
  state.stars = remaining;
}

export function stepGame(state, dtSeconds, direction = 0, random = Math.random) {
  if (state.status !== 'running') return;
  const dt = Math.max(0, dtSeconds);
  moveBasket(state, state.basket.x + state.basket.width / 2 + direction * 420 * dt);
  advanceStars(state, dt);
  if (state.status !== 'running') return;
  state.spawnElapsed += dt;
  while (state.spawnElapsed + 1e-10 >= 0.9) {
    state.spawnElapsed = Math.max(0, state.spawnElapsed - 0.9);
    state.stars.push({ x: 12 + random() * (WIDTH - 24), y: -12, radius: 12 });
  }
}
