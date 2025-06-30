import Fastify from 'fastify';

const app = Fastify({ logger: true });

// Geçici bellek yapıları
const games = {};         // gameId -> {id, players, moves, state, result}
const tournaments = {};   // tournamentId -> {id, players, matches, currentMatch}

// Oyun başlat
app.post('/game/start', async (req, reply) => {
  const { players } = req.body;
  if (!players || players.length !== 2) {
    return reply.code(400).send({ error: 'Exactly two players required' });
  }

  const id = Date.now().toString();
  games[id] = {
    id,
    players,
    moves: [],
    state: 'in_progress',
    result: null
  };

  reply.send({ gameId: id, message: 'Game started' });
});

// Oyuncu hamlesi gönder
app.post('/game/move', async (req, reply) => {
  const { gameId, playerId, move } = req.body;
  const game = games[gameId];

  if (!game) return reply.code(404).send({ error: 'Game not found' });
  if (!game.players.includes(playerId)) return reply.code(403).send({ error: 'Invalid player' });
  if (game.state !== 'in_progress') return reply.code(400).send({ error: 'Game is not active' });

  game.moves.push({ playerId, move, time: new Date().toISOString() });

  reply.send({ message: 'Move accepted' });
});

// Oyun durumu sorgula
app.get('/game/status/:gameId', async (req, reply) => {
  const game = games[req.params.gameId];
  if (!game) return reply.code(404).send({ error: 'Game not found' });
  reply.send({
    id: game.id,
    players: game.players,
    movesCount: game.moves.length,
    state: game.state
  });
});

// Oyun sonucu döndür
app.get('/game/result/:gameId', async (req, reply) => {
  const game = games[req.params.gameId];
  if (!game) return reply.code(404).send({ error: 'Game not found' });

  if (!game.result) {
    // Simülasyon: sonucu üret
    game.result = {
      winner: game.players[Math.floor(Math.random() * 2)],
      score: '10-8'
    };
    game.state = 'finished';
  }

  reply.send(game.result);
});

// Turnuva başlat
app.post('/game/tournament/start', async (req, reply) => {
  const { players } = req.body;
  if (!players || players.length < 2) {
    return reply.code(400).send({ error: 'At least two players required' });
  }

  const id = Date.now().toString();
  tournaments[id] = {
    id,
    players,
    matches: [],
    currentMatch: null
  };

  reply.send({ tournamentId: id, message: 'Tournament started' });
});

// Turnuva bilgisi
app.get('/game/tournament/:id', async (req, reply) => {
  const t = tournaments[req.params.id];
  if (!t) return reply.code(404).send({ error: 'Tournament not found' });
  reply.send(t);
});

// Sonraki maç bilgisi
app.get('/game/tournament/:id/next', async (req, reply) => {
  const t = tournaments[req.params.id];
  if (!t) return reply.code(404).send({ error: 'Tournament not found' });

  if (!t.currentMatch && t.players.length >= 2) {
    const p1 = t.players.shift();
    const p2 = t.players.shift();
    t.currentMatch = { p1, p2, status: 'pending' };
    t.matches.push(t.currentMatch);
  }

  reply.send({ nextMatch: t.currentMatch });
});

// Listen
app.listen({ port: 3003, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
