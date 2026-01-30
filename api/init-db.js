const pool = require('./db');

async function initDatabase() {
  const client = await pool.connect();

  try {
    await client.query(`
      -- Teams table
      CREATE TABLE IF NOT EXISTS teams (
        id VARCHAR(20) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(20) UNIQUE NOT NULL,
        created_by VARCHAR(20) NOT NULL,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Members table
      CREATE TABLE IF NOT EXISTS members (
        id VARCHAR(20) PRIMARY KEY,
        team_id VARCHAR(20) REFERENCES teams(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        role VARCHAR(20) DEFAULT 'member',
        avatar VARCHAR(10),
        joined_at TIMESTAMP DEFAULT NOW()
      );

      -- Tasks table
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(20) PRIMARY KEY,
        team_id VARCHAR(20) REFERENCES teams(id) ON DELETE CASCADE,
        member_id VARCHAR(20) REFERENCES members(id) ON DELETE CASCADE,
        section VARCHAR(50) NOT NULL,
        text TEXT NOT NULL,
        priority VARCHAR(20) DEFAULT 'normal',
        status VARCHAR(20) DEFAULT 'pending',
        week_start DATE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      );

      -- Moods table
      CREATE TABLE IF NOT EXISTS moods (
        id VARCHAR(20) PRIMARY KEY,
        team_id VARCHAR(20) REFERENCES teams(id) ON DELETE CASCADE,
        member_id VARCHAR(20) REFERENCES members(id) ON DELETE CASCADE,
        mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
        energy INTEGER NOT NULL CHECK (energy >= 1 AND energy <= 5),
        note TEXT,
        week_start DATE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(member_id, week_start)
      );

      -- Integration settings table
      CREATE TABLE IF NOT EXISTS integrations (
        id SERIAL PRIMARY KEY,
        team_id VARCHAR(20) REFERENCES teams(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        settings JSONB DEFAULT '{}',
        enabled BOOLEAN DEFAULT false,
        UNIQUE(team_id, type)
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_tasks_team_week ON tasks(team_id, week_start);
      CREATE INDEX IF NOT EXISTS idx_moods_team_week ON moods(team_id, week_start);
      CREATE INDEX IF NOT EXISTS idx_members_team ON members(team_id);
    `);

    console.log('Database initialized successfully!');
  } finally {
    client.release();
  }
}

module.exports = { initDatabase };
