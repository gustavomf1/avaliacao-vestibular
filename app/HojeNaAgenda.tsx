'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import type { Evento } from '@/lib/eventos';
import { participa, resumoHoje, situacao } from '@/lib/agenda-hoje';

const pad = (n: number) => String(n).padStart(2, '0');
const MOSTRAR = 3;

/** "AAAA-MM-DD|minuto do dia" no horário do aparelho; muda a cada 30 s. */
function relogio() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}|${d.getHours() * 60 + d.getMinutes()}`;
}
function assinarRelogio(avisar: () => void) {
  const t = setInterval(avisar, 30_000);
  const voltar = () => { if (document.visibilityState === 'visible') avisar(); };
  document.addEventListener('visibilitychange', voltar);
  return () => { clearInterval(t); document.removeEventListener('visibilitychange', voltar); };
}

export default function HojeNaAgenda({ usuario }: { usuario: string }) {
  const agoraStr = useSyncExternalStore(assinarRelogio, relogio, () => null);
  const hoje = agoraStr?.split('|')[0] ?? null;
  const agora = agoraStr ? Number(agoraStr.split('|')[1]) : 0;
  const [eventos, setEventos] = useState<{ dia: string; lista: Evento[] } | null>(null);

  useEffect(() => {
    if (!hoje) return;
    let vivo = true;
    fetch(`/api/eventos?de=${hoje}&ate=${hoje}`)
      .then(r => (r.ok ? r.json() : null))
      .then((lista: Evento[] | null) => { if (vivo && lista) setEventos({ dia: hoje, lista }); })
      .catch(() => {});
    return () => { vivo = false; };
  }, [hoje]);

  if (!hoje || !eventos || eventos.dia !== hoje || eventos.lista.length === 0) return null;

  const { proximos, passaram } = resumoHoje(eventos.lista, agora);
  const total = eventos.lista.length;
  const visiveis = proximos.slice(0, MOSTRAR);
  const restantes = proximos.length - visiveis.length;

  return (
    <section className="hoje" aria-label="Hoje na agenda">
      <div className="hoje-topo">
        <span className="hoje-titulo">Hoje na agenda</span>
        <Link className="hoje-ver" href={`/agenda?dia=${hoje}`}>Ver agenda ›</Link>
      </div>
      {proximos.length === 0 ? (
        <p className="hoje-fim">{total === 1 ? 'O evento de hoje já terminou.' : `Os ${total} eventos de hoje já terminaram.`}</p>
      ) : (
        <ul className="hoje-lista">
          {visiveis.map(e => {
            const s = situacao(e, agora);
            const voce = participa(e.participantes, usuario);
            return (
              <li key={e.id}>
                <Link className={`hoje-ev hoje-ev--${s.tipo}`} href={`/agenda?dia=${hoje}&evento=${e.id}`}>
                  <span className="hoje-quando">{s.texto}</span>
                  <span className="hoje-info">
                    <span className="hoje-linha">
                      <span className="hoje-hora">{e.inicio}–{e.fim}</span>
                      <b className="hoje-nome">{e.titulo}</b>
                      {voce && <span className="hoje-voce">Você está</span>}
                    </span>
                    {e.participantes.length > 0 && <span className="hoje-part">{e.participantes.join(', ')}</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {(restantes > 0 || (proximos.length > 0 && passaram > 0)) && (
        <p className="hoje-fim">
          {restantes > 0 && <Link className="hoje-mais" href={`/agenda?dia=${hoje}`}>+ {restantes} mais tarde</Link>}
          {restantes > 0 && passaram > 0 && ' · '}
          {proximos.length > 0 && passaram > 0 && (passaram === 1 ? '1 já terminou' : `${passaram} já terminaram`)}
        </p>
      )}
    </section>
  );
}
