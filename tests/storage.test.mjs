import test from 'node:test';
import assert from 'node:assert/strict';
import {readBest, saveBest} from '../app.js';
test('некорректный рекорд заменяется нулём',()=> {
 for(const value of [null,'','-1','2.5','abc','Infinity']) {
  assert.equal(readBest({getItem:()=>value}),0);
 }
 assert.equal(readBest(null),0);
 assert.equal(readBest({getItem:()=> '12'}),12);
});
test('недоступное чтение не мешает игре',()=> {
 assert.equal(readBest({getItem(){throw Error('blocked');}}),0);
});
test('сохраняется только наибольший результат',()=> {
 const storage={value:'12',getItem(){return this.value;},setItem(key,value){assert.equal(key,'catch-stars-best');this.value=value;}};
 assert.equal(saveBest(storage,12,5),12); assert.equal(storage.value,'12');
 assert.equal(saveBest(storage,12,17),17); assert.equal(storage.value,'17');
});
test('ошибка записи сохраняет рекорд в памяти',()=> {
 assert.equal(saveBest({setItem(){throw Error('blocked');}},5,10),10);
 assert.equal(saveBest(null,5,10),10);
});
