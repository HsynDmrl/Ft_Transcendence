import Fastify from 'fastify';
import fastifyHttpProxy from '@fastify/http-proxy';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
// import fastifyWebsocket from '@fastify/websocket';
import dotenv from 'dotenv';

dotenv.config();

const app = Fastify({
  logger: {
    level: 'info', 
    transport: {
      target: 'pino-pretty'
    }
  }
});

// // WebSocket desteği
// app.register(fastifyWebsocket);

// CORS
app.register(fastifyCors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
});

// Rate limit
app.register(fastifyRateLimit, {
  max: 100,
  timeWindow: '1 minute'
});

// JWT
app.register(fastifyJwt, { secret: process.env.JWT_SECRET });

// Sağlık kontrolü
app.get('/health', async () => {
  return { status: 'ok', time: new Date().toISOString() };
});

// JWT kontrolü (auth ve health hariç)
app.addHook('onRequest', async (req, reply) => {
  if (req.raw.url.startsWith('/auth') || req.raw.url.startsWith('/health') || req.raw.url.startsWith('/ws')) {
    return;
  }
  try {
    await req.jwtVerify();
    req.log.info(`Authenticated user: ${JSON.stringify(req.user)}`);
  } catch (err) {
    req.log.warn(`Auth failed: ${err.message}`);
    return reply.code(401).send({ error: 'Unauthorized' });
  }
});

// Proxy config helper
function registerProxy(prefix, upstream) {
  app.register(fastifyHttpProxy, {
    upstream,
    prefix,
    rewritePrefix: prefix,
    http2: false,
    replyOptions: {
      rewriteRequestHeaders: (originalReq, headers) => {
        headers['x-user-id'] = originalReq.user ? originalReq.user.id : '';
        return headers;
      }
    }
  });
}

// Mikroservis proxy'leri
registerProxy('/auth', 'http://auth-service:3001');
registerProxy('/users', 'http://user-service:3002');
registerProxy('/game', 'http://game-service:3003');
registerProxy('/chat', 'http://chat-service:3004');
registerProxy('/matchmaking', 'http://matchmaking-service:3005');

// WebSocket endpointleri
// app.get('/ws/game', { websocket: true }, (connection /*, req*/) => {
//   connection.socket.on('message', message => {
//     app.log.info(`Received WS game message: ${message}`);
//     // Burada mesajı game-service'e iletecek bir client oluşturabilirsin (ör: WebSocket client)
//     connection.socket.send(`Game echo: ${message}`);
//   });
// });

// app.get('/ws/chat', { websocket: true }, (connection /*, req*/) => {
//   connection.socket.on('message', message => {
//     app.log.info(`Received WS chat message: ${message}`);
//     connection.socket.send(`Chat echo: ${message}`);
//   });
// });

// Global hata yakalama
app.setErrorHandler((error, req, reply) => {
  req.log.error(error);
  reply.code(500).send({ error: 'Internal Server Error' });
});

// Dinle
app.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
