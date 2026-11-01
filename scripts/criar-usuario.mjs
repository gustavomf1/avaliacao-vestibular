import pg from 'pg';
import bcrypt from 'bcryptjs';

const [nome, email, senha, perfil = 'avaliador'] = process.argv.slice(2);
if (!nome || !email || !senha) {
  console.error('Uso: npm run usuario -- "Nome" email@exemplo.com "senha" [avaliador|admin]');
  process.exit(1);
}
if (senha.length < 8) { console.error('A senha precisa ter pelo menos 8 caracteres.'); process.exit(1); }
if (!['avaliador', 'admin'].includes(perfil)) { console.error('Perfil deve ser avaliador ou admin.'); process.exit(1); }

const url = process.env.DATABASE_URL;
if (!url) { console.error('Defina DATABASE_URL (veja .env.example).'); process.exit(1); }

const hash = await bcrypt.hash(senha, 12);
const client = new pg.Client({ connectionString: url });
await client.connect();
const { rows } = await client.query(
  `insert into usuarios (nome, email, senha_hash, perfil) values ($1, lower($2), $3, $4)
   on conflict (email) do update set nome = excluded.nome, senha_hash = excluded.senha_hash, perfil = excluded.perfil
   returning id, nome, email, perfil`,
  [nome.trim(), email.trim(), hash, perfil]
);
await client.end();
console.log('Usuário pronto:', rows[0]);
