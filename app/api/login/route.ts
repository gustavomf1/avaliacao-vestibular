import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { COOKIE, criarToken, opcoesCookie } from '@/lib/sessao';

const HASH_FALSO = '$2b$12$X1no8To89bE9aAadd1B3C.Zn9eoJBa/.bfEEfJ2Pwl0ERI27OsmZO';

export async function POST(req: Request) {
  let email = '', senha = '';
  try {
    const corpo = await req.json();
    email = String(corpo?.email ?? '').trim().toLowerCase();
    senha = String(corpo?.senha ?? '');
  } catch {
    return NextResponse.json({ erro: 'Requisição inválida.' }, { status: 400 });
  }
  if (!email || !senha) return NextResponse.json({ erro: 'Informe e-mail e senha.' }, { status: 400 });

  const { rows } = await db().query<{ id: number; nome: string; senha_hash: string }>(
    'select id, nome, senha_hash from usuarios where email = $1',
    [email]
  );
  const u = rows[0];
  const ok = await bcrypt.compare(senha, u ? u.senha_hash : HASH_FALSO);
  if (!u || !ok) return NextResponse.json({ erro: 'E-mail ou senha incorretos.' }, { status: 401 });

  const res = NextResponse.json({ nome: u.nome });
  res.cookies.set(COOKIE, await criarToken({ id: u.id, nome: u.nome }), opcoesCookie());
  return res;
}
