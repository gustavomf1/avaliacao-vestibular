import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarEvento } from './eventos-validar.ts';

const base = { titulo: 'Coleta', participantes: ['Ana'], descricao: '', dia: '2026-11-22', inicio: '08:00', fim: '09:30' };

test('aceita evento válido e apara o título', () => {
  const v = validarEvento({ ...base, titulo: '  Coleta  ' });
  assert.deepEqual(v, { ok: true, titulo: 'Coleta', participantes: ['Ana'], descricao: '', dia: '2026-11-22', inicio: '08:00', fim: '09:30' });
});

test('participantes e descrição são opcionais', () => {
  const v = validarEvento({ ...base, participantes: undefined, descricao: undefined });
  assert.equal(v.ok, true);
  if (v.ok) { assert.deepEqual(v.participantes, []); assert.equal(v.descricao, ''); }
});

test('participantes: apara nomes e descarta linhas vazias', () => {
  const v = validarEvento({ ...base, participantes: ['  Ana ', '', '   ', 'Bia'] });
  assert.equal(v.ok, true);
  if (v.ok) assert.deepEqual(v.participantes, ['Ana', 'Bia']);
});

test('descrição é aparada', () => {
  const v = validarEvento({ ...base, descricao: '  levar fichas  ' });
  assert.equal(v.ok, true);
  if (v.ok) assert.equal(v.descricao, 'levar fichas');
});

for (const [nome, corpo] of [
  ['título vazio', { ...base, titulo: '' }],
  ['título só espaços', { ...base, titulo: '   ' }],
  ['título com 121 caracteres', { ...base, titulo: 'a'.repeat(121) }],
  ['participantes que não é lista', { ...base, participantes: 'Ana, Bia' }],
  ['participante que não é texto', { ...base, participantes: [42] }],
  ['participante com 81 caracteres', { ...base, participantes: ['a'.repeat(81)] }],
  ['mais de 30 participantes', { ...base, participantes: Array.from({ length: 31 }, (_, i) => `P${i}`) }],
  ['descrição com 1001 caracteres', { ...base, descricao: 'a'.repeat(1001) }],
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
