import Fastify from 'fastify';

const app = Fastify({ logger: true });

// Geçici depolar
const conversations = {};  // userId -> [messages]
const blocks = {};         // userId -> [blockedUserIds]

// Yardımcı: blok kontrolü
function isBlocked(senderId, receiverId) {
  const blockedByReceiver = blocks[receiverId] || [];
  return blockedByReceiver.includes(senderId);
}

// Tüm konuşmalar
app.get('/chat/conversations', async (req, reply) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return reply.code(400).send({ error: 'Missing user ID' });

  const convos = Object.keys(conversations)
    .filter(k => k === userId || conversations[k].some(m => m.to === userId || m.from === userId));

  reply.send({ conversations: convos });
});

// Bir kullanıcıyla mesaj geçmişi
app.get('/chat/:userId/messages', async (req, reply) => {
  const myId = req.headers['x-user-id'];
  const otherId = req.params.userId;

  if (!myId) return reply.code(400).send({ error: 'Missing user ID' });

  const msgs = (conversations[myId] || []).filter(m => m.to === otherId || m.from === otherId);
  reply.send(msgs);
});

// Mesaj gönder
app.post('/chat/:userId/messages', async (req, reply) => {
  const from = req.headers['x-user-id'];
  const to = req.params.userId;
  const { text } = req.body;

  if (!from || !text) return reply.code(400).send({ error: 'Missing fields' });
  if (isBlocked(from, to)) return reply.code(403).send({ error: 'User has blocked you' });

  const message = { from, to, text, time: new Date().toISOString() };

  conversations[from] = conversations[from] || [];
  conversations[from].push(message);

  conversations[to] = conversations[to] || [];
  conversations[to].push(message);

  reply.send({ message: 'Sent' });
});

// Kullanıcıyı blokla
app.post('/chat/:userId/block', async (req, reply) => {
  const myId = req.headers['x-user-id'];
  const blockId = req.params.userId;

  if (!myId) return reply.code(400).send({ error: 'Missing user ID' });

  blocks[myId] = blocks[myId] || [];
  if (!blocks[myId].includes(blockId)) {
    blocks[myId].push(blockId);
  }

  reply.send({ message: `Blocked ${blockId}` });
});

// Blok kaldır
app.delete('/chat/:userId/block', async (req, reply) => {
  const myId = req.headers['x-user-id'];
  const unblockId = req.params.userId;

  if (!myId) return reply.code(400).send({ error: 'Missing user ID' });

  blocks[myId] = (blocks[myId] || []).filter(id => id !== unblockId);

  reply.send({ message: `Unblocked ${unblockId}` });
});

// Oyun daveti
app.post('/chat/:userId/invite', async (req, reply) => {
  const from = req.headers['x-user-id'];
  const to = req.params.userId;

  if (!from) return reply.code(400).send({ error: 'Missing user ID' });

  // Burada aslında game-service'e bir istek atılabilir (şimdilik simülasyon)
  reply.send({ message: `Game invite sent from ${from} to ${to}` });
});

// Listen
app.listen({ port: 3004, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
