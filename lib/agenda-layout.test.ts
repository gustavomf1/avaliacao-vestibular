import { test } from 'node:test';
import assert from 'node:assert/strict';
import { colunas, faixaHoras } from './agenda-layout.ts';

const e = (id: string, inicio: string, fim: string) => ({ id, inicio, fim });
const obj = (m: Map<string, { col: number; total: number }>) => Object.fromEntries(m);

test('dois eventos sobrepostos ficam lado a lado', () => {
  assert.deepEqual(obj(colunas([e('a', '08:00', '10:00'), e('b', '09:00', '11:00')])), {
    a: { col: 0, total: 2 }, b: { col: 1, total: 2 },
  });
});

test('evento que começa quando outro termina não sobrepõe', () => {
  assert.deepEqual(obj(colunas([e('a', '10:00', '11:00'), e('b', '11:00', '12:00')])), {
    a: { col: 0, total: 1 }, b: { col: 0, total: 1 },
  });
});

test('cadeia reaproveita coluna livre e o grupo inteiro tem 2 colunas', () => {
  assert.deepEqual(obj(colunas([e('c', '10:30', '12:00'), e('a', '08:00', '10:00'), e('b', '09:00', '11:00')])), {
    a: { col: 0, total: 2 }, b: { col: 1, total: 2 }, c: { col: 0, total: 2 },
  });
});

test('três ao mesmo tempo viram três colunas', () => {
  const m = colunas([e('a', '08:00', '09:00'), e('b', '08:00', '09:00'), e('c', '08:30', '09:30')]);
  assert.deepEqual([...m.values()].map(v => v.total), [3, 3, 3]);
  assert.deepEqual(new Set([...m.values()].map(v => v.col)), new Set([0, 1, 2]));
});

test('sem eventos, mapa vazio', () => {
  assert.equal(colunas([]).size, 0);
});

test('faixa padrão 7 a 19', () => {
  assert.deepEqual(faixaHoras([]), { de: 7, ate: 19 });
  assert.deepEqual(faixaHoras([e('a', '09:00', '10:00')]), { de: 7, ate: 19 });
});

test('faixa se estende para eventos cedo e tarde', () => {
  assert.deepEqual(faixaHoras([e('a', '06:00', '07:00'), e('b', '21:00', '21:30')]), { de: 6, ate: 22 });
  assert.deepEqual(faixaHoras([e('a', '05:45', '06:00'), e('b', '22:00', '23:59')]), { de: 5, ate: 24 });
});
