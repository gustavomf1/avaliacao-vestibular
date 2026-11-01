import type { Metadata } from 'next';
import FormLogin from './FormLogin';

export const metadata: Metadata = { title: 'Entrar · Avaliação Vestibular' };

function destinoSeguro(x: unknown) {
  if (typeof x !== 'string' || !x.startsWith('/') || x.includes('\\')) return '/';
  try {
    const u = new URL(x, 'http://interno');
    return u.origin === 'http://interno' ? u.pathname + u.search : '/';
  } catch {
    return '/';
  }
}

export default async function Login({ searchParams }: PageProps<'/login'>) {
  const q = await searchParams;
  const v = destinoSeguro(q.voltar);
  return (
    <main className="login">
      <FormLogin voltar={v} />
    </main>
  );
}
