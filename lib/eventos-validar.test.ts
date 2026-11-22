import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarEvento } from './eventos-validar.ts';

const base = { titulo: 'Coleta', participantes: 'Ana', dia: '2026-11-22', inicio: '08:00', fim: '09:30' };

test('aceita evento válido e apara o título', () => {
  const v = validarEvento({ ...base, titulo: '  Coleta  ' });
  assert.deepEqual(v, { ok: true, titulo: 'Coleta', participantes: 'Ana', dia: '2026-11-22', inicio: '08:00', fim: '09:30' });
});

test('participantes é opcional', () => {
  const v = validarEvento({ ...base, participantes: undefined });
  assert.equal(v.ok, true);
  if (v.ok) assert.equal(v.participantes, '');
});

for (const [nome, corpo] of [
  ['título vazio', { ...base, titulo: '' }],
  ['título só espaços', { ...base, titulo: '   ' }],
  ['título com 121 caracteres', { ...base, titulo: 'a'.repeat(121) }],
  ['participantes com 501 caracteres', { ...base, participantes: 'a'.repeat(501) }],
  ['fim igual ao início', { ...base, fim: '08:00' }],
  ['fim antes do início', { ...base, fim: '07:00' }],
  ['dia inexistente', { ...base, dia: '2026-02-30' }],
  ['hora inválida', { ...base, inicio: '25:00' }],
  ['corpo não é objeto', null],
] as const) {
  test(`recusa ${nome}`, () => {
    const v = validarEvento(corpo);
    assert.equal(v.ok, false);
    if (!v.ok) assert.ok(v.erro.length > 0);
  });
}
