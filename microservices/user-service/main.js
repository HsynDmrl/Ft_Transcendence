import Fastify from 'fastify';

const app = Fastify({ logger: true });

// Basit in-memory kullanıcı verisi
const users = {
  // id: { id, name, email, avatar, friends: [], stats: {}, history: [] }
};

// Profil getir
app.get('/users/:id', async (req, reply) => {
  const id = req.params.id;
  const user = users[id];
  if (!user) return reply.code(404).send({ error: 'User not found' });
  reply.send(user);
});

// Profil güncelle
app.put('/users/:id', async (req, reply) => {
  const id = req.params.id;
  const data = req.body;

  if (!users[id]) {
    users[id] = { id, friends: [], stats: {}, history: [] };
  }

  users[id] = { ...users[id], ...data };
  reply.send({ message: 'Profile updated', user: users[id] });
});

// Avatar yükle (simülasyon)
app.post('/users/:id/avatar', async (req, reply) => {
  const id = req.params.id;
  if (!users[id]) {
    users[id] = { id, friends: [], stats: {}, history: [] };
  }
  // Burada gerçek dosya yükleme işlemi yapılabilir
  users[id].avatar = `avatar-of-${id}.png`; // Simülasyon
  reply.send({ message: 'Avatar uploaded', avatar: users[id].avatar });
});

// Arkadaş ekle
app.post('/users/:id/friends', async (req, reply) => {
  const id = req.params.id;
  const { friendId } = req.body;

  if (!friendId) return reply.code(400).send({ error: 'friendId required' });
  if (!users[id]) users[id] = { id, friends: [], stats: {}, history: [] };
  if (!users[friendId]) users[friendId] = { id: friendId, friends: [], stats: {}, history: [] };

  if (!users[id].friends.includes(friendId)) {
    users[id].friends.push(friendId);
  }

  reply.send({ message: `Friend ${friendId} added to user ${id}`, friends: users[id].friends });
});

// Arkadaş sil
app.delete('/users/:id/friends/:fid', async (req, reply) => {
  const id = req.params.id;
  const fid = req.params.fid;

  if (!users[id]) return reply.code(404).send({ error: 'User not found' });

  users[id].friends = users[id].friends.filter(f => f !== fid);

  reply.send({ message: `Friend ${fid} removed from user ${id}`, friends: users[id].friends });
});

// Kullanıcı istatistikleri getir
app.get('/users/:id/stats', async (req, reply) => {
  const id = req.params.id;
  if (!users[id]) return reply.code(404).send({ error: 'User not found' });

  reply.send(users[id].stats || { wins: 0, losses: 0 });
});

// Kullanıcı oyun geçmişi getir
app.get('/users/:id/history', async (req, reply) => {
  const id = req.params.id;
  if (!users[id]) return reply.code(404).send({ error: 'User not found' });

  reply.send(users[id].history || []);
});

// Dinle
app.listen({ port: 3002, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
