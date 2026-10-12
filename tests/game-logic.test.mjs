import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame, startGame, moveBasket, getFallSpeed, stepGame} from '../game-logic.js';
const running = () => { const s = createGame(); startGame(s); return s; };
test('начало и повтор раунда сбрасывают состояние', () => {
 const s = createGame(); assert.equal(s.status, 'idle'); startGame(s);
 assert.equal(s.lives, 3); assert.equal(s.score, 0); assert.deepEqual(s.stars, []);
 s.score=10; s.lives=0; s.spawnElapsed=.8; s.stars.push({x:1,y:1,radius:12});
 startGame(s); assert.equal(s.score,0); assert.equal(s.lives,3); assert.equal(s.spawnElapsed,0); assert.deepEqual(s.stars,[]);
});
test('корзина ограничена полем и движется со скоростью 420', () => {
 const s=running(); moveBasket(s,-100); assert.equal(s.basket.x,0);
 moveBasket(s,900); assert.equal(s.basket.x,392);
 moveBasket(s,240); stepGame(s,.1,1); assert.equal(s.basket.x,238);
});
test('звезда появляется каждые 900 мс в допустимом диапазоне', () => {
 const s=running(); stepGame(s,.89,0,()=>.5); assert.equal(s.stars.length,0);
 stepGame(s,.01,0,()=>.5); assert.equal(s.stars.length,1); assert.equal(s.stars[0].x,240);
 const edge=running(); stepGame(edge,.9,0,()=>0); assert.equal(edge.stars[0].x,12);
});
test('скорость растёт каждые пять очков до предела', () => {
 assert.deepEqual([0,5,50,100].map(getFallSpeed),[150,170,350,350]);
 const s=running(); s.score=5; s.stars=[{x:12,y:10,radius:12}]; stepGame(s,.1); assert.equal(s.stars[0].y,27);
});
test('пойманная звезда даёт ровно одно очко и не отнимает жизнь', () => {
 const s=running(); s.stars=[{x:240,y:570,radius:12}]; stepGame(s,.1);
 assert.equal(s.score,1); assert.equal(s.lives,3); assert.equal(s.stars.length,0);
 stepGame(s,.1); assert.equal(s.score,1);
});
test('быстрое пересечение корзины засчитывается', () => {
 const s=running(); s.stars=[{x:240,y:500,radius:12}]; stepGame(s,1);
 assert.equal(s.score,1); assert.equal(s.lives,3);
});
test('три пропуска завершают игру и не дают отрицательных жизней', () => {
 const s=running(); s.stars=Array.from({length:4},()=>({x:12,y:650,radius:12}));
 stepGame(s,.1); assert.equal(s.lives,0); assert.equal(s.status,'over');
 const frozen=structuredClone(s); stepGame(s,1); assert.deepEqual(s,frozen);
});
test('после завершения в том же кадре очки не начисляются', () => {
 const s=running(); s.lives=1; s.stars=[{x:12,y:650,radius:12},{x:240,y:580,radius:12}];
 stepGame(s,.1); assert.equal(s.status,'over'); assert.equal(s.score,0);
});
test('один пропуск отнимает одну жизнь', () => {
 const s=running(); s.stars=[{x:12,y:650,radius:12}]; stepGame(s,.1);
 assert.equal(s.lives,2); assert.equal(s.stars.length,0); assert.equal(s.status,'running');
});
