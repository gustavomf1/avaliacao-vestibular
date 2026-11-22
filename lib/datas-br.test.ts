import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mascaraData, brParaIso, isoParaBr, opcoesMinuto, fimAoMudarInicio } from './datas-br.ts';

test('mascaraData coloca as barras enquanto digita e ignora letras', () => {
  assert.equal(mascaraData('2'), '2');
  assert.equal(mascaraData('22'), '22');
  assert.equal(mascaraData('221'), '22/1');
  assert.equal(mascaraData('2211'), '22/11');
  assert.equal(mascaraData('22112'), '22/11/2');
  assert.equal(mascaraData('22112026'), '22/11/2026');
  assert.equal(mascaraData('22/11/2026999'), '22/11/2026');
  assert.equal(mascaraData('2a2/1b1'), '22/11');
  assert.equal(mascaraData(''), '');
});

test('brParaIso converte data válida', () => {
  assert.equal(brParaIso('22/11/2026'), '2026-11-22');
  assert.equal(brParaIso('01/01/2027'), '2027-01-01');
  assert.equal(brParaIso('29/02/2028'), '2028-02-29');
});

test('brParaIso recusa data incompleta ou inexistente', () => {
  assert.equal(brParaIso('22/11/26'), null);
  assert.equal(brParaIso('31/04/2026'), null);
  assert.equal(brParaIso('29/02/2026'), null);
  assert.equal(brParaIso('00/11/2026'), null);
  assert.equal(brParaIso(''), null);
});

test('isoParaBr', () => {
  assert.equal(isoParaBr('2026-11-22'), '22/11/2026');
});

test('opcoesMinuto: de 5 em 5 e inclui minuto fora do passo já salvo', () => {
  assert.equal(opcoesMinuto('00').length, 12);
  assert.deepEqual(opcoesMinuto('30').slice(0, 3), ['00', '05', '10']);
  assert.deepEqual(opcoesMinuto('07'), ['00', '05', '07', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']);
});

test('fimAoMudarInicio mantém a duração', () => {
  assert.equal(fimAoMudarInicio('08:00', '09:00', '14:00'), '15:00');
  assert.equal(fimAoMudarInicio('14:00', '15:00', '14:30'), '15:30');
  assert.equal(fimAoMudarInicio('09:00', '11:15', '10:00'), '12:15');
});

test('fimAoMudarInicio: duração inválida vira 1 hora e não passa de 23:59', () => {
  assert.equal(fimAoMudarInicio('10:00', '09:00', '12:00'), '13:00');
  assert.equal(fimAoMudarInicio('08:00', '10:00', '23:00'), '23:59');
});
