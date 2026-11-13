import { redirect } from 'next/navigation';
import { sessaoAtual } from '@/lib/sessao';
import { carregarPacientes, montarTabelas, type Tabela } from '@/lib/relatorios';
import Link from 'next/link';
import Copiar from './Copiar';
import { COLUNAS, GUIA_BRUTAS } from '@/lib/colunas';

export const dynamic = 'force-dynamic';

function rotulo(t: Tabela, col: number) {
  if (!t.grupos) return t.colunas[col];
  let fim = 0;
  for (const g of t.grupos) {
    fim += g.span;
    if (col < fim) return g.texto ? `${g.curto ?? g.texto}: ${t.colunas[col]}` : t.colunas[col];
  }
  return t.colunas[col];
}

function TabelaArtigo({ t }: { t: Tabela }) {
  return (
    <table className={`artigo${t.grupos ? ' artigo--empilha' : ''}`} id={t.id}>
      <caption><b>Tabela {t.numero}</b> – {t.titulo}</caption>
      <thead>
        {t.grupos && (
          <tr>
            {t.grupos.map((g, i) => <th key={i} colSpan={g.span} className={g.texto ? 'grupo' : ''}>{g.texto}</th>)}
          </tr>
        )}
        <tr>{t.colunas.map((c, i) => <th key={i}>{c}</th>)}</tr>
      </thead>
      <tbody>
        {t.linhas.map((l, i) => (
          <tr key={i}>
            <td className={`${l.nivel ? 'sub' : ''}${l.titulo ? ' tit' : ''}`}>{l.rotulo}</td>
            {l.celulas.map((c, j) => <td key={j} data-rotulo={rotulo(t, j + 1)}>{c.negrito ? <b>{c.texto}</b> : c.texto}</td>)}
          </tr>
        ))}
      </tbody>
      <tfoot>
        {t.nota.map((n, i) => <tr key={i}><td colSpan={t.colunas.length}>{n}</td></tr>)}
      </tfoot>
    </table>
  );
}

export default async function Relatorios() {
  if (!(await sessaoAtual())) redirect('/login?voltar=/relatorios');
  const ps = await carregarPacientes();
  const tabelas = montarTabelas(ps);
  const quedas = ps.filter(p => p.caiu === 1).length;

  return (
    <>
      <header className="topo">
        <div className="wrap">
          <div className="topo-linha">
            <span className="eyebrow">TCC · Hipofunção vestibular</span>
            <Link className="vc-btn vc-btn--sm" href="/">Voltar às avaliações</Link>
          </div>
          <h1 className="t-display">Relatórios</h1>
          <p className="t-small" style={{ marginTop: 6 }}>{ps.length} {ps.length === 1 ? 'avaliação' : 'avaliações'} · {quedas} com queda nos últimos 6 meses</p>
        </div>
      </header>

      <main className="wrap rel">
        <section className="rel-card">
          <h2 className="rel-h2">Extração bruta (Excel)</h2>
          <p className="t-small">Uma planilha com os dados de todos os participantes, já sem nome, endereço, telefone e datas. Cada paciente vira um código (P01, P02...). Serve para mandar ao orientador ou rodar a estatística em outro programa.</p>
          <ul className="rel-lista">
            <li><b>Variáveis e escores:</b> uma linha por paciente, com as variáveis codificadas (1 = sim, 0 = não) e os escores de cada instrumento.</li>
            <li><b>Dicionário:</b> o que significa cada coluna.</li>
            <li><b>Tabela 1, 2 e 3:</b> as mesmas tabelas desta página.</li>
            <li><b>Respostas brutas:</b> tudo o que foi preenchido na ficha, campo por campo.</li>
          </ul>
          <a className="vc-btn vc-btn--primary" href="/api/relatorios/planilha" download>Baixar planilha (.xlsx)</a>
          <details className="rel-exp">
            <summary>O que tem em cada coluna</summary>
            <h3>Aba &quot;Variáveis e escores&quot;</h3>
            <p>É a aba pronta para análise: uma linha por paciente, uma coluna por variável. Sim/não vira 1/0, e célula vazia quer dizer que a informação não foi preenchida ou que o instrumento ficou incompleto.</p>
            <div className="rel-rolagem">
              <table className="dic">
                <thead><tr><th>Coluna</th><th>O que é</th></tr></thead>
                <tbody>{COLUNAS.map(c => <tr key={c.titulo}><td><code>{c.titulo}</code></td><td>{c.descricao}</td></tr>)}</tbody>
              </table>
            </div>
            <h3>Aba &quot;Respostas brutas&quot;</h3>
            <p>Tudo o que foi preenchido na ficha, exatamente como foi salvo, uma coluna por campo do formulário. Os nomes das colunas seguem os grupos abaixo. Quando um campo aceita várias opções, elas aparecem na mesma célula separadas por &quot;;&quot;.</p>
            <div className="rel-rolagem">
              <table className="dic">
                <thead><tr><th>Colunas</th><th>O que é</th></tr></thead>
                <tbody>{GUIA_BRUTAS.map(g => <tr key={g.campos}><td><code>{g.campos}</code></td><td>{g.descricao}</td></tr>)}</tbody>
              </table>
            </div>
          </details>
          <p className="aviso" style={{ margin: '14px 0 0' }}>São dados de saúde. Mesmo sem nome, não mande a planilha por canais abertos nem cole os dados em ferramentas de IA; para isso, use só as tabelas prontas abaixo, que trazem apenas números agregados.</p>
        </section>

        {tabelas.map(t => (
          <section className="rel-card" key={t.id}>
            <div className="rel-topo">
              <h2 className="rel-h2">Tabela {t.numero}</h2>
              <div className="rel-botoes">
                <a className="vc-btn vc-btn--sm" href={`/api/relatorios/tabela/${t.numero}`} download>Baixar Excel</a>
                <Copiar alvo={t.id} />
              </div>
            </div>
            {t.aviso && <p className="aviso">{t.aviso}</p>}
            <div className="rel-rolagem"><TabelaArtigo t={t} /></div>
            <details className="rel-exp">
              <summary>Como esta tabela foi calculada</summary>
              {t.explicacao.map(e => (
                <div key={e.titulo}>
                  <h3>{e.titulo}</h3>
                  {e.texto.map((p, i) => <p key={i}>{p}</p>)}
                </div>
              ))}
            </details>
          </section>
        ))}

        <p className="t-caption" style={{ margin: '0 0 48px' }}>
          Pontos ainda a confirmar com a orientação, porque mudam números destas tabelas: cortes da escala visual analógica, regra do lado com menor nota nos itens 3 e 6 do MiniBESTest e o critério &quot;moderada e/ou caminhada&quot; do IPAQ.
        </p>
      </main>
    </>
  );
}
