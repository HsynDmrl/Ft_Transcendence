import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const app = Fastify({ logger: true });
app.register(fastifyJwt, { secret: process.env.JWT_SECRET });

const users = []; // Database ????

// Yardımcı: Kullanıcı bul
function findUserByEmail(email) {
  return users.find(u => u.email === email);
}

// Register
app.post('/auth/register', async (req, reply) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return reply.code(400).send({ error: 'Email and password are required' });
  }
  if (findUserByEmail(email)) {
    return reply.code(409).send({ error: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: users.length + 1,
    email,
    password: hashedPassword
  };
  users.push(user);

  reply.send({ message: 'User registered successfully' });
});

// Login
app.post('/auth/login', async (req, reply) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return reply.code(400).send({ error: 'Email and password are required' });
  }

  const user = findUserByEmail(email);
  if (!user) {
    return reply.code(401).send({ error: 'Invalid credentials' });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return reply.code(401).send({ error: 'Invalid credentials' });
  }

  const token = app.jwt.sign(
  { id: user.id, email: user.email },
  { expiresIn: '1h' }
  );

  reply.send({ token });
});

// Me
app.get('/auth/me', async (req, reply) => {
  try {
    await req.jwtVerify();
    reply.send(req.user);
  } catch (err) {
    reply.code(401).send({ error: 'Invalid token' });
  }
});

// Verify
app.get('/auth/verify', async (req, reply) => {
  try {
    await req.jwtVerify();
    reply.send({ valid: true });
  } catch {
    reply.code(401).send({ valid: false });
  }
});

// (Opsiyonel) Logout - Blacklist mantığı simülasyonu
const blacklistedTokens = []; //Database ?? 

app.post('/auth/logout', async (req, reply) => {
  try {
    await req.jwtVerify();
    blacklistedTokens.push(req.raw.headers.authorization);
    reply.send({ message: 'Logged out' });
  } catch {
    reply.code(401).send({ error: 'Invalid token' });
  }
});

// Token geçersiz mi kontrolü için hook
app.addHook('onRequest', async (req, reply) => {
  const auth = req.raw.headers.authorization;
  if (auth && blacklistedTokens.includes(auth)) {
    return reply.code(401).send({ error: 'Token is blacklisted' });
  }
});

// Listen
app.listen({ port: 3001, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
