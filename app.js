import { createGame, startGame, moveBasket, stepGame, WIDTH, HEIGHT } from './game-logic.js';

export function readBest(storage) {
  try {
    const value = Number(storage?.getItem('catch-stars-best'));
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  } catch { return 0; }
}

export function saveBest(storage, currentBest, score) {
  const best = Math.max(currentBest, score);
  if (best > currentBest) {
    try { storage?.setItem('catch-stars-best', String(best)); } catch { /* Рекорд остаётся доступен в памяти. */ }
  }
  return best;
}

function getStorage() {
  try { return window.localStorage; } catch { return null; }
}

function drawBackdrop(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, '#0e1530');
  gradient.addColorStop(.6, '#171630');
  gradient.addColorStop(1, '#0a1930');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const nebula = ctx.createRadialGradient(390, 100, 10, 390, 100, 280);
  nebula.addColorStop(0, '#755bb025'); nebula.addColorStop(1, '#755bb000');
  ctx.fillStyle = nebula; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawPlanet(ctx);
  for (let i = 0; i < 95; i++) {
    const x = (i * 137.5 + 17) % WIDTH;
    const y = (i * 83.7 + 39) % HEIGHT;
    ctx.fillStyle = i % 6 === 0 ? '#c6c9f1bb' : '#9ca7d650';
    ctx.beginPath(); ctx.arc(x, y, i % 6 === 0 ? 1.5 : .8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = '#91f5ee0b'; ctx.lineWidth = 1;
  for (let x = 0; x < WIDTH; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 560); ctx.lineTo(x, HEIGHT); ctx.stroke();
  }
  for (let y = 560; y < HEIGHT; y += 20) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke();
  }
}

function drawPlanet(ctx) {
  ctx.save();
  ctx.translate(396, 110); ctx.rotate(-.4);
  ctx.strokeStyle = '#a294d733'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.ellipse(0, 0, 98, 27, 0, 0, Math.PI * 2); ctx.stroke();
  const gradient = ctx.createRadialGradient(-20, -22, 3, 12, 8, 64);
  gradient.addColorStop(0, '#8276ae'); gradient.addColorStop(.45, '#423861'); gradient.addColorStop(1, '#151b36');
  ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(0, 0, 58, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#bca3e74d'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(0, 0, 98, 27, 0, 0, Math.PI); ctx.stroke();
  ctx.restore();
}

function drawStar(ctx, star) {
  ctx.save(); ctx.translate(star.x, star.y);
  ctx.shadowColor = '#ffda82'; ctx.shadowBlur = 18; ctx.fillStyle = '#ffe2a1';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = i * Math.PI / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? star.radius : star.radius * .45;
    const x = Math.cos(angle) * r, y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath(); ctx.fill(); ctx.restore();
}

function drawShip(ctx, basket) {
  ctx.save(); ctx.translate(basket.x, basket.y);
  ctx.shadowColor = '#91f5ee'; ctx.shadowBlur = 16;
  ctx.fillStyle = '#93e7e9'; ctx.beginPath();
  ctx.moveTo(0, 21); ctx.lineTo(12, 8); ctx.lineTo(31, 11); ctx.lineTo(44, 0);
  ctx.lineTo(57, 11); ctx.lineTo(76, 8); ctx.lineTo(88, 21); ctx.lineTo(44, 24);
  ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = '#384567'; ctx.beginPath();
  ctx.moveTo(34, 15); ctx.lineTo(44, 5); ctx.lineTo(54, 15); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#b9a0ff'; ctx.fillRect(15, 23, 9, 6); ctx.fillRect(64, 23, 9, 6);
  ctx.restore();
}

function createSession(canvas, ctx) {
  const ids = ['score', 'lives', 'best', 'start', 'overlay', 'message', 'start-label',
    'overlay-title', 'overlay-label', 'overlay-hint', 'flight-status', 'playfield'];
  const storage = getStorage();
  return {
    canvas, ctx, storage, state: createGame(), best: readBest(storage),
    lastTime: null, keys: new Set(),
    ui: Object.fromEntries(ids.map(id => [id, document.getElementById(id)])),
  };
}

function updateStats(session) {
  const { state, ui, best } = session;
  ui.score.textContent = String(state.score).padStart(2, '0');
  ui.best.textContent = String(best).padStart(2, '0');
  ui.lives.textContent = Array.from({ length: 3 }, (_, i) => i < state.lives ? '♥' : '♡').join(' ');
  ui.lives.setAttribute('aria-label', `Осталось жизней: ${state.lives}`);
}

function finishRound(session) {
  const { state, ui } = session;
  session.best = saveBest(session.storage, session.best, state.score);
  ui.overlay.hidden = false;
  ui.playfield.classList.remove('running');
  ui['overlay-label'].textContent = 'МИССИЯ ЗАВЕРШЕНА';
  ui['overlay-title'].textContent = 'Отличный полёт!';
  ui.message.textContent = `Собрано звёзд: ${state.score}. Твой рекорд: ${session.best}. Ещё одна попытка?`;
  ui['start-label'].textContent = 'Играть снова';
  ui['flight-status'].textContent = 'Готовы к новой миссии';
  session.keys.clear();
  updateStats(session);
  ui.start.focus({ preventScroll: true });
}

function beginRound(session) {
  startGame(session.state);
  session.keys.clear();
  session.lastTime = null;
  session.ui.overlay.hidden = true;
  session.ui.playfield.classList.add('running');
  session.ui['flight-status'].textContent = 'Полёт проходит нормально';
  updateStats(session);
  session.canvas.focus({ preventScroll: true });
}

function renderFrame(session, time, nextFrame) {
  const { state, ctx, keys } = session;
  if (!document.hidden && state.status === 'running') {
    const dt = session.lastTime === null ? 0 : Math.min(.05, (time - session.lastTime) / 1000);
    const direction = Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft'));
    stepGame(state, dt, direction);
    if (state.status === 'over') finishRound(session);
    else updateStats(session);
  }
  session.lastTime = document.hidden ? null : time;
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawBackdrop(ctx);
  state.stars.forEach(star => drawStar(ctx, star));
  drawShip(ctx, state.basket);
  requestAnimationFrame(nextFrame);
}

function pointShip(session, event) {
  if (session.state.status !== 'running') return;
  if (event.pointerType === 'touch' && event.type !== 'pointerdown' && event.buttons === 0) return;
  const rect = session.canvas.getBoundingClientRect();
  moveBasket(session.state, (event.clientX - rect.left) / rect.width * WIDTH);
  if (event.type === 'pointerdown') {
    session.canvas.focus({ preventScroll: true });
    session.canvas.setPointerCapture(event.pointerId);
  }
}

function keyInput(session, event) {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || session.state.status !== 'running') return;
  event.preventDefault();
  if (event.type === 'keydown') session.keys.add(event.key);
  else session.keys.delete(event.key);
}

function resetInput(session) {
  session.keys.clear();
  session.lastTime = null;
}

function bindControls(session) {
  session.ui.start.addEventListener('click', () => beginRound(session));
  session.canvas.addEventListener('pointerdown', event => pointShip(session, event));
  session.canvas.addEventListener('pointermove', event => pointShip(session, event));
  window.addEventListener('keydown', event => keyInput(session, event));
  window.addEventListener('keyup', event => keyInput(session, event));
  window.addEventListener('blur', () => resetInput(session));
  document.addEventListener('visibilitychange', () => {
    resetInput(session);
    if (session.state.status === 'running') {
      session.ui['flight-status'].textContent = document.hidden ? 'Полёт на паузе' : 'Полёт проходит нормально';
    }
  });
}

function bootGame() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    document.getElementById('message').textContent = 'Ваш браузер не поддерживает Canvas.';
    return;
  }
  const session = createSession(canvas, ctx);
  bindControls(session);
  updateStats(session);
  const frame = time => renderFrame(session, time, frame);
  requestAnimationFrame(frame);
}

if (typeof document !== 'undefined') bootGame();
