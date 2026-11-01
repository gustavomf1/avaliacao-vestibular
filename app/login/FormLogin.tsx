'use client';

import { useState } from 'react';

export default function FormLogin({ voltar }: { voltar: string }) {
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setErro('');
    setEnviando(true);
    try {
      const r = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: f.get('email'), senha: f.get('senha') }),
      });
      if (r.ok) { window.location.assign(voltar); return; }
      const j = await r.json().catch(() => ({}));
      setErro(j.erro || 'Não foi possível entrar. Tente de novo.');
    } catch {
      setErro('Sem conexão com o servidor. Confira a internet e tente de novo.');
    }
    setEnviando(false);
  }

  return (
    <form className="login-card" onSubmit={entrar} noValidate>
      <div>
        <span className="eyebrow">TCC · Hipofunção vestibular</span>
        <h1 className="t-display">Avaliação Vestibular</h1>
        <p className="t-small">Entre para ver e registrar avaliações.</p>
      </div>
      {erro && <p className="login-erro" role="alert">{erro}</p>}
      <label className="vc-field">
        <span className="vc-label">E-mail</span>
        <input className="vc-input" name="email" type="email" autoComplete="username" inputMode="email" required autoFocus />
      </label>
      <label className="vc-field">
        <span className="vc-label">Senha</span>
        <input className="vc-input" name="senha" type="password" autoComplete="current-password" required />
      </label>
      <button className="vc-btn vc-btn--primary" type="submit" disabled={enviando}>
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
