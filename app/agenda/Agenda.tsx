'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Evento } from '@/lib/eventos';
import { colunas, faixaHoras, minutos } from '@/lib/agenda-layout';
import { DESCRICAO_MAX, PARTICIPANTE_MAX, PARTICIPANTES_QTD_MAX, TITULO_MAX } from '@/lib/eventos-validar';

const HORA_PX = 56;
const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const SEMANA_LONGA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
/** Data como número de dias, sem fuso: evita o problema de UTC x horário local. */
const partes = (s: string) => ({ y: Number(s.slice(0, 4)), m: Number(s.slice(5, 7)) - 1, d: Number(s.slice(8, 10)) });
const utc = (s: string) => { const p = partes(s); return new Date(Date.UTC(p.y, p.m, p.d)); };
const somarDias = (s: string, n: number) => { const d = utc(s); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const diasNoMes = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
const dataBR = (s: string) => `${s.slice(8, 10)}/${s.slice(5, 7)}`;

function hojeLocal() {
  const d = new Date();
  return iso(d.getFullYear(), d.getMonth(), d.getDate());
}
const semAssinatura = () => () => {};

type Rascunho = { titulo: string; participantes: string[]; descricao: string; dia: string; inicio: string; fim: string };
type Painel = { evento: Evento | null; dados: Rascunho };

function maisUmaHora(h: string) {
  const m = Math.min(minutos(h) + 60, 23 * 60 + 59);
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

type Props = { usuario: string; diaInicial: string | null; eventoInicial: string | null };

export default function Agenda({ usuario, diaInicial, eventoInicial }: Props) {
  const router = useRouter();
  // Servidor não sabe a data do aparelho: renderiza vazio e o cliente preenche.
  const hoje = useSyncExternalStore(semAssinatura, hojeLocal, () => null);
  const [selEscolhido, setSel] = useState<string | null>(diaInicial);
  const [mesEscolhido, setMes] = useState<string | null>(null); // AAAA-MM
  const sel = selEscolhido ?? hoje;
  const mes = mesEscolhido ?? sel?.slice(0, 7) ?? null;

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState('');
  const [recarregar, setRecarregar] = useState(0);
  const [painel, setPainel] = useState<Painel | null>(null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [focarNovo, setFocarNovo] = useState(false);
  const [msg, setMsg] = useState('');
  const toastT = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abriuInicial = useRef(false);

  const sair401 = useCallback(() => router.replace('/login?voltar=/agenda'), [router]);

  useEffect(() => {
    if (!mes) return;
    const y = Number(mes.slice(0, 4));
    const m = Number(mes.slice(5, 7)) - 1;
    const de = iso(y, m, 1);
    const ate = iso(y, m, diasNoMes(y, m));
    let vivo = true;
    fetch(`/api/eventos?de=${de}&ate=${ate}`)
      .then(async r => {
        if (r.status === 401) { sair401(); return; }
        if (!r.ok) throw new Error();
        const lista: Evento[] = await r.json();
        if (!vivo) return;
        setEventos(lista);
        setErroLista('');
        // Vindo do cartão "Hoje na agenda": abre o evento uma vez.
        const alvo = !abriuInicial.current && eventoInicial ? lista.find(e => e.id === eventoInicial) : undefined;
        abriuInicial.current = true;
        if (alvo) abrirEvento(alvo);
      })
      .catch(() => { if (vivo) setErroLista('Não foi possível carregar a agenda. Verifique a conexão.'); })
      .finally(() => { if (vivo) setCarregando(false); });
    return () => { vivo = false; };
  }, [mes, recarregar, sair401, eventoInicial]);

  useEffect(() => {
    if (!painel) return;
    const fechar = (e: KeyboardEvent) => { if (e.key === 'Escape' && !salvando) setPainel(null); };
    window.addEventListener('keydown', fechar);
    return () => window.removeEventListener('keydown', fechar);
  }, [painel, salvando]);

  const porDia = useMemo(() => {
    const m = new Map<string, Evento[]>();
    for (const e of eventos) m.set(e.dia, [...(m.get(e.dia) ?? []), e]);
    return m;
  }, [eventos]);

  const doDia = useMemo(() => (sel ? porDia.get(sel) ?? [] : []), [porDia, sel]);
  const pos = useMemo(() => colunas(doDia), [doDia]);
  const faixa = useMemo(() => faixaHoras(doDia), [doDia]);

  function toast(t: string) {
    setMsg(t);
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setMsg(''), 2400);
  }

  function escolherDia(d: string) {
    setSel(d);
    if (d.slice(0, 7) !== mes) { setMes(d.slice(0, 7)); setCarregando(true); }
  }

  function mudarMes(delta: number) {
    if (!mes) return;
    const y = Number(mes.slice(0, 4));
    const m = Number(mes.slice(5, 7)) - 1 + delta;
    const ny = y + Math.floor(m / 12);
    const nm = ((m % 12) + 12) % 12;
    setMes(`${ny}-${pad(nm + 1)}`);
    setCarregando(true);
  }

  function irHoje() {
    if (!hoje) return;
    escolherDia(hoje);
  }

  function abrirNovo(inicio = '08:00') {
    if (!sel) return;
    setErro(''); setConfirmando(false); setFocarNovo(false);
    setPainel({ evento: null, dados: { titulo: '', participantes: [], descricao: '', dia: sel, inicio, fim: maisUmaHora(inicio) } });
  }

  function abrirEvento(e: Evento) {
    setErro(''); setConfirmando(false); setFocarNovo(false);
    setPainel({ evento: e, dados: { titulo: e.titulo, participantes: [...e.participantes], descricao: e.descricao, dia: e.dia, inicio: e.inicio, fim: e.fim } });
  }

  function campo<K extends keyof Rascunho>(k: K, v: Rascunho[K]) {
    setPainel(p => (p ? { ...p, dados: { ...p.dados, [k]: v } } : p));
  }

  function mudarParticipantes(f: (ps: string[]) => string[]) {
    setPainel(p => (p ? { ...p, dados: { ...p.dados, participantes: f(p.dados.participantes) } } : p));
  }
  const setParticipante = (i: number, v: string) => mudarParticipantes(ps => ps.map((x, j) => (j === i ? v : x)));
  const removerParticipante = (i: number) => mudarParticipantes(ps => ps.filter((_, j) => j !== i));
  function adicionarParticipante() {
    setFocarNovo(true);
    mudarParticipantes(ps => [...ps, '']);
  }

  async function salvar(ev: React.FormEvent) {
    ev.preventDefault();
    if (!painel) return;
    const d = painel.dados;
    if (!d.titulo.trim()) { setErro('Informe o título do evento.'); return; }
    if (!d.dia || !d.inicio || !d.fim) { setErro('Informe dia, início e fim.'); return; }
    if (d.fim <= d.inicio) { setErro('A hora de fim precisa ser depois da hora de início.'); return; }
    setSalvando(true); setErro('');
    try {
      const r = await fetch(painel.evento ? `/api/eventos/${painel.evento.id}` : '/api/eventos', {
        method: painel.evento ? 'PUT' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(d),
      });
      if (r.status === 401) { sair401(); return; }
      const corpo = await r.json().catch(() => ({}));
      if (!r.ok) { setErro(corpo.erro ?? 'Não foi possível salvar. Tente de novo.'); return; }
      const salvo = corpo as Evento;
      setEventos(xs => [...xs.filter(x => x.id !== salvo.id), salvo]);
      setPainel(null);
      escolherDia(salvo.dia);
      toast(painel.evento ? 'Evento atualizado' : 'Evento criado');
    } catch {
      setErro('Sem conexão. Tente de novo.');
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!painel?.evento) return;
    setSalvando(true); setErro('');
    try {
      const r = await fetch(`/api/eventos/${painel.evento.id}`, { method: 'DELETE' });
      if (r.status === 401) { sair401(); return; }
      if (!r.ok && r.status !== 404) throw new Error();
      const id = painel.evento.id;
      setEventos(xs => xs.filter(x => x.id !== id));
      setPainel(null);
      toast('Evento excluído');
    } catch {
      setErro('Não foi possível excluir. Tente de novo.');
    } finally {
      setSalvando(false);
    }
  }

  if (!hoje || !sel || !mes) return <Topo />;

  const ano = Number(mes.slice(0, 4));
  const mesIdx = Number(mes.slice(5, 7)) - 1;
  const primeiro = iso(ano, mesIdx, 1);
  const recuo = utc(primeiro).getUTCDay();
  const totalCelulas = Math.ceil((recuo + diasNoMes(ano, mesIdx)) / 7) * 7;
  const celulas = Array.from({ length: totalCelulas }, (_, i) => somarDias(primeiro, i - recuo));
  const horas = Array.from({ length: faixa.ate - faixa.de }, (_, i) => faixa.de + i);
  const diaSemana = SEMANA_LONGA[utc(sel).getUTCDay()];

  return (
    <>
      <Topo />
      <main className="ag-wrap ag">
        <section className="ag-mes" aria-label="Calendário do mês">
          <div className="ag-mes-topo">
            <button type="button" className="vc-btn vc-btn--sm vc-btn--ghost ag-seta" onClick={() => mudarMes(-1)} aria-label="Mês anterior">‹</button>
            <h2 className="ag-h2">{MESES[mesIdx]} <span className="ag-ano">{ano}</span></h2>
            <button type="button" className="vc-btn vc-btn--sm vc-btn--ghost ag-seta" onClick={() => mudarMes(1)} aria-label="Próximo mês">›</button>
          </div>
          <div className="ag-grade" role="grid">
            {SEMANA.map((s, i) => <div key={i} className="ag-sem" aria-hidden>{s}</div>)}
            {celulas.map(d => {
              const n = porDia.get(d)?.length ?? 0;
              const fora = d.slice(0, 7) !== mes;
              const cls = ['ag-dia', fora && 'ag-dia--fora', d === sel && 'ag-dia--sel', d === hoje && 'ag-dia--hoje'].filter(Boolean).join(' ');
              return (
                <button key={d} type="button" className={cls} onClick={() => escolherDia(d)}
                  aria-pressed={d === sel} aria-label={`${Number(d.slice(8))} de ${MESES[Number(d.slice(5, 7)) - 1]}${n ? `, ${n} ${n === 1 ? 'evento' : 'eventos'}` : ''}`}>
                  <span>{Number(d.slice(8))}</span>
                  {n > 0 && !fora && <i className="ag-ponto" aria-hidden />}
                </button>
              );
            })}
          </div>
          <button type="button" className="vc-btn vc-btn--sm ag-hoje" onClick={irHoje} disabled={sel === hoje && mes === hoje.slice(0, 7)}>Hoje</button>
          {carregando && <p className="t-caption">Carregando...</p>}
          {erroLista && (
            <div className="ag-aviso" role="alert">
              <span>{erroLista}</span>
              <button type="button" className="vc-btn vc-btn--sm" onClick={() => { setCarregando(true); setRecarregar(n => n + 1); }}>Tentar de novo</button>
            </div>
          )}
        </section>

        <section className="ag-dia-painel" aria-label={`Eventos de ${dataBR(sel)}`}>
          <div className="ag-dia-topo">
            <button type="button" className="vc-btn vc-btn--sm vc-btn--ghost ag-seta" onClick={() => escolherDia(somarDias(sel, -1))} aria-label="Dia anterior">‹</button>
            <div className="ag-dia-titulo">
              <h2 className="ag-h2">{diaSemana}, <span className="ag-num">{dataBR(sel)}</span></h2>
              <p className="t-caption">{doDia.length === 0 ? 'Nenhum evento' : `${doDia.length} ${doDia.length === 1 ? 'evento' : 'eventos'}`}</p>
            </div>
            <button type="button" className="vc-btn vc-btn--sm vc-btn--ghost ag-seta" onClick={() => escolherDia(somarDias(sel, 1))} aria-label="Próximo dia">›</button>
          </div>
          <button type="button" className="vc-btn vc-btn--primary ag-novo" onClick={() => abrirNovo()}>+ Evento</button>

          <div className="ag-linha" style={{ height: horas.length * HORA_PX }}>
            {horas.map((h, i) => (
              <button key={h} type="button" className="ag-hora" style={{ top: i * HORA_PX, height: HORA_PX }}
                onClick={() => abrirNovo(`${pad(h)}:00`)} aria-label={`Novo evento às ${pad(h)}:00`}>
                <span>{pad(h)}:00</span>
              </button>
            ))}
            <div className="ag-trilho">
              {doDia.map(e => {
                const p = pos.get(e.id) ?? { col: 0, total: 1 };
                const top = ((minutos(e.inicio) - faixa.de * 60) / 60) * HORA_PX;
                const alt = Math.max(((minutos(e.fim) - minutos(e.inicio)) / 60) * HORA_PX, 30);
                const tam = alt < 56 ? ' ag-ev--curto' : alt < 84 ? ' ag-ev--medio' : '';
                return (
                  <button key={e.id} type="button" className={`ag-ev${tam}`} onClick={() => abrirEvento(e)}
                    style={{ top, height: alt - 2, left: `calc(${(p.col / p.total) * 100}% + 2px)`, width: `calc(${100 / p.total}% - 4px)` }}>
                    <span className="ag-ev-l1">
                      <span className="ag-ev-hora">{e.inicio}–{e.fim}</span>
                      <span className="ag-ev-titulo">{e.titulo}</span>
                    </span>
                    {alt >= 56 && e.participantes.length > 0 && <span className="ag-ev-part">{e.participantes.join(', ')}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {painel && (
        <div className="ag-fundo" onClick={() => !salvando && setPainel(null)}>
          <form className="ag-form" onSubmit={salvar} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="ag-form-titulo">
            <div className="ag-form-topo">
              <h2 id="ag-form-titulo" className="ag-h2">{painel.evento ? 'Editar evento' : 'Novo evento'}</h2>
              <button type="button" className="vc-btn vc-btn--sm vc-btn--ghost" onClick={() => setPainel(null)} disabled={salvando}>Fechar</button>
            </div>
            {painel.evento && (
              <p className="t-small">
                Criado por <b>{painel.evento.autor.nome}</b>
                {painel.evento.atualizado_por && <> · editado por <b>{painel.evento.atualizado_por.nome}</b></>}
              </p>
            )}
            <label className="vc-field">
              <span className="vc-label">Título *</span>
              <input className="vc-input" value={painel.dados.titulo} maxLength={TITULO_MAX} autoFocus={!painel.evento}
                onChange={e => campo('titulo', e.target.value)} placeholder="Ex.: Coleta com pacientes" />
            </label>
            <fieldset className="ag-part">
              <legend className="vc-label">Participantes</legend>
              {painel.dados.participantes.map((p, i) => (
                <div key={i} className="ag-part-linha">
                  <input className="vc-input" value={p} maxLength={PARTICIPANTE_MAX} placeholder={`Participante ${i + 1}`}
                    aria-label={`Participante ${i + 1}`} onChange={e => setParticipante(i, e.target.value)}
                    autoFocus={focarNovo && i === painel.dados.participantes.length - 1} />
                  <button type="button" className="vc-btn vc-btn--sm ag-eu" onClick={() => setParticipante(i, usuario)}
                    aria-label={`Preencher participante ${i + 1} com ${usuario}`}>Eu</button>
                  <button type="button" className="vc-btn vc-btn--sm vc-btn--ghost ag-remover" onClick={() => removerParticipante(i)}
                    aria-label={`Remover participante ${i + 1}`}>×</button>
                </div>
              ))}
              {painel.dados.participantes.length < PARTICIPANTES_QTD_MAX && (
                <button type="button" className="vc-btn vc-btn--sm ag-add" onClick={adicionarParticipante}>+ Participante</button>
              )}
            </fieldset>
            <label className="vc-field">
              <span className="vc-label">Descrição <span className="ag-opc">(opcional)</span></span>
              <textarea className="vc-input ag-textarea" value={painel.dados.descricao} maxLength={DESCRICAO_MAX} rows={3}
                onChange={e => campo('descricao', e.target.value)} placeholder="Algo que os participantes precisam saber" />
            </label>
            <label className="vc-field">
              <span className="vc-label">Dia *</span>
              <input className="vc-input" type="date" value={painel.dados.dia} onChange={e => campo('dia', e.target.value)} required />
            </label>
            <div className="ag-horas">
              <label className="vc-field">
                <span className="vc-label">Início *</span>
                <input className="vc-input" type="time" step={300} value={painel.dados.inicio}
                  onChange={e => { const v = e.target.value; setPainel(p => p && { ...p, dados: { ...p.dados, inicio: v, fim: p.dados.fim > v ? p.dados.fim : maisUmaHora(v) } }); }} required />
              </label>
              <label className="vc-field">
                <span className="vc-label">Fim *</span>
                <input className="vc-input" type="time" step={300} value={painel.dados.fim} onChange={e => campo('fim', e.target.value)} required />
              </label>
            </div>
            {erro && <p className="login-erro" role="alert">{erro}</p>}
            <div className="ag-form-acoes">
              <button type="submit" className="vc-btn vc-btn--primary" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
              <button type="button" className="vc-btn" onClick={() => setPainel(null)} disabled={salvando}>Cancelar</button>
            </div>
            {painel.evento && !confirmando && (
              <button type="button" className="vc-btn vc-btn--ghost ag-excluir" onClick={() => setConfirmando(true)} disabled={salvando}>Excluir evento</button>
            )}
            {painel.evento && confirmando && (
              <div className="confirmar" role="alert">
                <span>Excluir &quot;{painel.evento.titulo}&quot;? Não dá para desfazer.</span>
                <div>
                  <button type="button" className="vc-btn vc-btn--sm vc-btn--ghost" onClick={() => setConfirmando(false)} disabled={salvando}>Cancelar</button>
                  <button type="button" className="vc-btn vc-btn--sm vc-btn--danger" onClick={excluir} disabled={salvando}>Excluir</button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}
      <div className={`toast${msg ? ' show' : ''}`} role="status">{msg}</div>
    </>
  );
}

function Topo() {
  return (
    <header className="topo">
      <div className="ag-wrap">
        <div className="topo-linha">
          <span className="eyebrow">TCC · Hipofunção vestibular</span>
          <Link className="vc-btn vc-btn--sm" href="/">Voltar às avaliações</Link>
        </div>
        <h1 className="t-display">Agenda</h1>
        <p className="t-small" style={{ marginTop: 6 }}>Compartilhada: todos veem os eventos de todos. Horários iguais ficam lado a lado.</p>
      </div>
    </header>
  );
}
