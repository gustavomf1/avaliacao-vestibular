'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ItemLista } from '@/lib/avaliacoes';
import type { Sessao } from '@/lib/sessao';

type Tag = { texto: string; tom: string | null };

const dataBR = (d: string | null) => (d ? d.split('-').reverse().join('/') : 'sem data');
const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function tags(e: ItemLista['escores']): Tag[] {
  const t: Tag[] = [];
  t.push({ texto: `10-CS ${e.cs10.total}/10${e.cs10.classificacao ? ' · ' + e.cs10.classificacao : ''}`, tom: e.cs10.tom });
  t.push({ texto: e.ipaq.classificacao ? `IPAQ · ${e.ipaq.classificacao}` : `IPAQ ${e.ipaq.total_min_semana} min/sem`, tom: e.ipaq.tom });
  if (e.dhi.aplicavel === false) t.push({ texto: 'DHI não aplicável', tom: null });
  else if (e.dhi.total !== null) t.push({ texto: `DHI ${e.dhi.total}/100 · ${e.dhi.classificacao}`, tom: e.dhi.tom });
  else t.push({ texto: 'DHI não respondido', tom: null });
  t.push({ texto: `MiniBEST ${e.minibest.total}/28`, tom: null });
  return t;
}

export default function Lista({ usuario, itensIniciais }: { usuario: Sessao; itensIniciais: ItemLista[] }) {
  const [itens, setItens] = useState(itensIniciais);
  const [busca, setBusca] = useState('');
  const [avaliador, setAvaliador] = useState('');
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [msg, setMsg] = useState('');
  const router = useRouter();
  const toastT = useRef<ReturnType<typeof setTimeout>>(undefined);

  const avaliadores = useMemo(() => {
    const m = new Map<number, string>();
    itens.forEach(i => m.set(i.autor.id, i.autor.nome));
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));
  }, [itens]);

  const visiveis = useMemo(() => {
    const b = semAcento(busca.trim());
    return itens.filter(i => (!b || semAcento(i.paciente_nome).includes(b)) && (!avaliador || String(i.autor.id) === avaliador));
  }, [itens, busca, avaliador]);

  function toast(t: string) {
    setMsg(t);
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setMsg(''), 2400);
  }

  async function sair() {
    await fetch('/api/logout', { method: 'POST' }).catch(() => {});
    router.replace('/login');
    router.refresh();
  }

  async function excluir(i: ItemLista) {
    setExcluindo(true);
    try {
      const r = await fetch(`/api/avaliacoes/${i.id}`, { method: 'DELETE' });
      if (r.status === 401) { router.replace('/login'); return; }
      if (!r.ok && r.status !== 404) throw new Error();
      setItens(xs => xs.filter(x => x.id !== i.id));
      setConfirmando(null);
      toast(`Avaliação de ${i.paciente_nome} excluída`);
    } catch {
      toast('Não foi possível excluir. Tente de novo.');
    }
    setExcluindo(false);
  }

  return (
    <>
      <header className="topo">
        <div className="wrap">
          <div className="topo-linha">
            <span className="eyebrow">TCC · Hipofunção vestibular</span>
            <div className="usuario">
              <b>{usuario.nome}</b>
              <button type="button" className="vc-btn vc-btn--sm" onClick={sair}>Sair</button>
            </div>
          </div>
          <h1 className="t-display">Avaliações</h1>
        </div>
      </header>

      <main className="wrap">
        <div className="acoes">
          <a className="vc-btn vc-btn--primary" href="/avaliacao">Nova avaliação</a>
          <a className="vc-btn" href="/api/backup" download>Gerar backup (JSON)</a>
        </div>

        {itens.length > 0 && (
          <div className="filtros">
            <label className="vc-field">
              <span className="vc-label">Buscar paciente</span>
              <input className="vc-input" type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Nome do paciente" />
            </label>
            <label className="vc-field">
              <span className="vc-label">Avaliador</span>
              <select className="vc-input" value={avaliador} onChange={e => setAvaliador(e.target.value)}>
                <option value="">Todos</option>
                {avaliadores.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
              </select>
            </label>
          </div>
        )}

        {itens.length === 0 ? (
          <div className="vazio">
            <p style={{ margin: '0 0 12px' }}>Nenhuma avaliação salva ainda.</p>
            <a className="vc-btn vc-btn--primary" href="/avaliacao">Começar a primeira</a>
          </div>
        ) : (
          <>
            <p className="contagem">{visiveis.length === itens.length ? `${itens.length} ${itens.length === 1 ? "avaliação" : "avaliações"}` : `${visiveis.length} de ${itens.length} avaliações`}</p>
            {visiveis.length === 0 && <div className="vazio">Nenhuma avaliação encontrada com esse filtro.</div>}
            <ul className="lista">
              {visiveis.map(i => (
                <li key={i.id} className="vc-record">
                  <div>
                    <div className="vc-record-code">{dataBR(i.data_avaliacao)}</div>
                    <h2 className="vc-record-name">{i.paciente_nome}</h2>
                    <div className="vc-record-meta">
                      {i.paciente_idade} anos · avaliada por <b>{i.autor.nome}</b>
                      {i.atualizado_por && i.atualizado_por.id !== i.autor.id && <> · editada por {i.atualizado_por.nome}</>}
                    </div>
                    <div className="vc-record-tags">
                      {tags(i.escores).map(t => (
                        <span key={t.texto} className={`vc-tag${t.tom ? ' vc-tag--' + t.tom : ''}`}>{t.texto}</span>
                      ))}
                    </div>
                  </div>
                  <div className="vc-record-actions">
                    <a className="vc-btn vc-btn--sm" href={`/avaliacao?id=${i.id}`}>Abrir</a>
                    <button type="button" className="vc-btn vc-btn--sm vc-btn--ghost" onClick={() => setConfirmando(i.id)}>Excluir</button>
                  </div>
                  {confirmando === i.id && (
                    <div className="confirmar" role="alert">
                      <span>Excluir a avaliação de {i.paciente_nome}? Não dá para desfazer.</span>
                      <div>
                        <button type="button" className="vc-btn vc-btn--sm vc-btn--ghost" onClick={() => setConfirmando(null)} disabled={excluindo}>Cancelar</button>
                        <button type="button" className="vc-btn vc-btn--sm vc-btn--danger" onClick={() => excluir(i)} disabled={excluindo}>Excluir</button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
      <div className={`toast${msg ? ' show' : ''}`} role="status">{msg}</div>
    </>
  );
}
