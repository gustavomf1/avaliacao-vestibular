'use client';

import { useState } from 'react';

const BORDA = '1px solid #000';

function paraWord(origem: HTMLTableElement) {
  const t = origem.cloneNode(true) as HTMLTableElement;
  t.removeAttribute('class');
  t.removeAttribute('id');
  t.setAttribute('style', `border-collapse:collapse;font-family:'Times New Roman',serif;font-size:10pt;border-top:${BORDA};border-bottom:${BORDA}`);
  const cap = t.querySelector('caption');
  if (cap) cap.setAttribute('style', 'text-align:left;caption-side:top;padding-bottom:4pt');
  t.querySelectorAll('th').forEach(th => th.setAttribute('style', `border-bottom:${BORDA};padding:2pt 6pt;text-align:${th.cellIndex === 0 ? 'left' : 'center'};font-weight:bold`));
  t.querySelectorAll('tbody td').forEach(el => {
    const td = el as HTMLTableCellElement;
    const sub = td.classList.contains('sub');
    td.removeAttribute('class');
    td.setAttribute('style', `padding:1pt 6pt;text-align:${td.cellIndex === 0 ? 'left' : 'center'}${sub ? ';padding-left:16pt' : ''}`);
  });
  const ultima = t.querySelector('tbody tr:last-child');
  ultima?.querySelectorAll('td').forEach(td => td.setAttribute('style', `${td.getAttribute('style')};border-bottom:${BORDA}`));
  t.querySelectorAll('tfoot td').forEach(td => td.setAttribute('style', 'padding:2pt 0;font-size:9pt;text-align:left'));
  return t.outerHTML;
}

function paraTexto(t: HTMLTableElement) {
  return [...t.rows].map(r => [...r.cells].map(c => c.innerText.trim()).join('\t')).join('\n');
}

export default function Copiar({ alvo }: { alvo: string }) {
  const [estado, setEstado] = useState<'' | 'ok' | 'erro'>('');

  async function copiar() {
    const t = document.getElementById(alvo) as HTMLTableElement | null;
    if (!t) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([paraWord(t)], { type: 'text/html' }),
          'text/plain': new Blob([paraTexto(t)], { type: 'text/plain' }),
        }),
      ]);
      setEstado('ok');
    } catch {
      setEstado('erro');
    }
    setTimeout(() => setEstado(''), 2400);
  }

  return (
    <button type="button" className="vc-btn vc-btn--sm" onClick={copiar}>
      {estado === 'ok' ? 'Copiada, cole no Word' : estado === 'erro' ? 'Não deu, selecione e copie' : 'Copiar tabela'}
    </button>
  );
}
