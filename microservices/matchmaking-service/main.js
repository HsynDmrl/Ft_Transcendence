import Fastify from 'fastify';

const app = Fastify({ logger: true });

// Matchmaking kuyruğu (kullanıcı ID'leri)
const queue = [];

// Kullanıcı kuyruğa katılır
app.post('/matchmaking/join', async (req, reply) => {
  const { userId } = req.body;
  if (!userId) {
    return reply.code(400).send({ error: 'userId is required' });
  }

  if (queue.includes(userId)) {
    return reply.code(400).send({ error: 'User already in queue' });
  }

  queue.push(userId);
  app.log.info(`User ${userId} joined matchmaking queue.`);
  reply.send({ message: 'Joined queue' });
});

// Kuyruktan çık
app.delete('/matchmaking/leave', async (req, reply) => {
  const { userId } = req.body;
  if (!userId) {
    return reply.code(400).send({ error: 'userId is required' });
  }

  const index = queue.indexOf(userId);
  if (index === -1) {
    return reply.code(404).send({ error: 'User not in queue' });
  }

  queue.splice(index, 1);
  app.log.info(`User ${userId} left matchmaking queue.`);
  reply.send({ message: 'Left queue' });
});

// Bir sonraki eşleşmeyi al
app.get('/matchmaking/next', async (req, reply) => {
  if (queue.length < 2) {
    return reply.send({ match: null, message: 'Not enough players in queue' });
  }

  // Basit FIFO mantığı ile eşleştirme
  const player1 = queue.shift();
  const player2 = queue.shift();

  app.log.info(`Match created: ${player1} vs ${player2}`);
  reply.send({ match: { player1, player2 } });
});

// Healthcheck
app.get('/health', async (req, reply) => {
  reply.send({ status: 'ok', queueLength: queue.length });
});

// Dinle
app.listen({ port: 3005, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
