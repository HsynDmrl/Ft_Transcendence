import { database } from './connection.js';

export async function runMigrations(): Promise<void> {
  console.log('Running database migrations...');
  
  try {
    // Users table
    await database.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        displayName TEXT UNIQUE,
        passwordHash TEXT NOT NULL,
        avatarUrl TEXT,
        isActive BOOLEAN DEFAULT 1,
        isOnline BOOLEAN DEFAULT 0,
        lastSeen DATETIME,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Friendships table
    await database.run(`
      CREATE TABLE IF NOT EXISTS friendships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        requesterId INTEGER NOT NULL,
        addresseeId INTEGER NOT NULL,
        status TEXT CHECK(status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (requesterId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (addresseeId) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(requesterId, addresseeId)
      )
    `);

    // Tournaments table
    await database.run(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        maxPlayers INTEGER NOT NULL DEFAULT 8,
        currentPlayers INTEGER DEFAULT 0,
        status TEXT CHECK(status IN ('registration', 'in_progress', 'finished', 'cancelled')) DEFAULT 'registration',
        startDate DATETIME NOT NULL,
        endDate DATETIME,
        winnerId INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (winnerId) REFERENCES users(id)
      )
    `);

    // Tournament participants table
    await database.run(`
      CREATE TABLE IF NOT EXISTS tournament_participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournamentId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tournamentId) REFERENCES tournaments(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(tournamentId, userId)
      )
    `);

    // Games table
    await database.run(`
      CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player1Id INTEGER NOT NULL,
        player2Id INTEGER NOT NULL,
        winner INTEGER,
        player1Score INTEGER DEFAULT 0,
        player2Score INTEGER DEFAULT 0,
        status TEXT CHECK(status IN ('waiting', 'in_progress', 'finished', 'cancelled')) DEFAULT 'waiting',
        startedAt DATETIME,
        endedAt DATETIME,
        tournamentId INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player1Id) REFERENCES users(id),
        FOREIGN KEY (player2Id) REFERENCES users(id),
        FOREIGN KEY (winner) REFERENCES users(id),
        FOREIGN KEY (tournamentId) REFERENCES tournaments(id)
      )
    `);

    // Create indexes for better performance
    await database.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await database.run(`CREATE INDEX IF NOT EXISTS idx_users_displayName ON users(displayName)`);
    await database.run(`CREATE INDEX IF NOT EXISTS idx_users_isActive ON users(isActive)`);
    await database.run(`CREATE INDEX IF NOT EXISTS idx_users_isOnline ON users(isOnline)`);
    
    await database.run(`CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requesterId)`);
    await database.run(`CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addresseeId)`);
    await database.run(`CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status)`);
    
    await database.run(`CREATE INDEX IF NOT EXISTS idx_games_player1 ON games(player1Id)`);
    await database.run(`CREATE INDEX IF NOT EXISTS idx_games_player2 ON games(player2Id)`);
    await database.run(`CREATE INDEX IF NOT EXISTS idx_games_status ON games(status)`);
    await database.run(`CREATE INDEX IF NOT EXISTS idx_games_tournament ON games(tournamentId)`);
    
    await database.run(`CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status)`);
    await database.run(`CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournamentId)`);
    await database.run(`CREATE INDEX IF NOT EXISTS idx_tournament_participants_user ON tournament_participants(userId)`);

    // Create triggers for updating updatedAt timestamp
    await database.run(`
      CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
      AFTER UPDATE ON users 
      BEGIN 
        UPDATE users SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id; 
      END
    `);

    await database.run(`
      CREATE TRIGGER IF NOT EXISTS update_friendships_timestamp 
      AFTER UPDATE ON friendships 
      BEGIN 
        UPDATE friendships SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id; 
      END
    `);

    await database.run(`
      CREATE TRIGGER IF NOT EXISTS update_tournaments_timestamp 
      AFTER UPDATE ON tournaments 
      BEGIN 
        UPDATE tournaments SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id; 
      END
    `);

    await database.run(`
      CREATE TRIGGER IF NOT EXISTS update_games_timestamp 
      AFTER UPDATE ON games 
      BEGIN 
        UPDATE games SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id; 
      END
    `);

    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

export async function dropAllTables(): Promise<void> {
  console.log('Dropping all tables...');
  
  try {
    await database.run(`DROP TABLE IF EXISTS tournament_participants`);
    await database.run(`DROP TABLE IF EXISTS games`);
    await database.run(`DROP TABLE IF EXISTS tournaments`);
    await database.run(`DROP TABLE IF EXISTS friendships`);
    await database.run(`DROP TABLE IF EXISTS users`);
    
    console.log('All tables dropped successfully');
  } catch (error) {
    console.error('Drop tables error:', error);
    throw error;
  }
} 