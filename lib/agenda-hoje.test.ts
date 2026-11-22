import { test } from 'node:test';
import assert from 'node:assert/strict';
import { situacao, resumoHoje, participa } from './agenda-hoje.ts';

const e = (id: string, inicio: string, fim: string, participantes: string[] = []) => ({ id, inicio, fim, participantes });

test('situacao: em andamento, inclusive no minuto de início', () => {
  assert.deepEqual(situacao(e('a', '09:00', '11:00'), 9 * 60), { tipo: 'agora', texto: 'Agora' });
  assert.deepEqual(situacao(e('a', '09:00', '11:00'), 10 * 60 + 59), { tipo: 'agora', texto: 'Agora' });
});

test('situacao: no minuto do fim já terminou', () => {
  assert.equal(situacao(e('a', '09:00', '11:00'), 11 * 60).tipo, 'passou');
});

test('situacao: começa em menos de 1 hora mostra minutos', () => {
  assert.deepEqual(situacao(e('a', '10:30', '12:00'), 10 * 60 + 5), { tipo: 'logo', texto: 'em 25 min' });
  assert.deepEqual(situacao(e('a', '10:30', '12:00'), 10 * 60 + 29), { tipo: 'logo', texto: 'em 1 min' });
});

test('situacao: começa em 1 hora ou mais mostra horas e minutos', () => {
  assert.deepEqual(situacao(e('a', '14:00', '15:00'), 13 * 60), { tipo: 'depois', texto: 'em 1h' });
  assert.deepEqual(situacao(e('a', '13:00', '14:00'), 10 * 60 + 5), { tipo: 'depois', texto: 'em 2h55' });
  assert.deepEqual(situacao(e('a', '21:00', '21:30'), 10 * 60 + 5), { tipo: 'depois', texto: 'em 10h55' });
});

test('resumoHoje: separa próximos (ordenados) e conta os que já passaram', () => {
  const evs = [e('c', '14:00', '15:00'), e('p1', '07:00', '08:00'), e('a', '09:00', '11:00'), e('p2', '08:00', '09:00'), e('b', '10:30', '12:00')];
  const r = resumoHoje(evs, 10 * 60);
  assert.deepEqual(r.proximos.map(x => x.id), ['a', 'b', 'c']);
  assert.equal(r.passaram, 2);
});

test('participa: compara nome sem acento e sem maiúsculas', () => {
  assert.equal(participa(['Ana', 'joão silva '], 'João Silva'), true);
  assert.equal(participa(['Ana'], 'João Silva'), false);
  assert.equal(participa([], 'Ana'), false);
});
