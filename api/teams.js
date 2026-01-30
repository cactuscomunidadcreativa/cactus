const pool = require('./db');

const MAX_TEAMS_LIMIT = 50; // Maximum number of teams allowed

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - List teams or get by code
    if (req.method === 'GET') {
      const { code, id } = req.query;

      if (code) {
        const result = await pool.query(
          'SELECT * FROM teams WHERE code = $1',
          [code.toUpperCase()]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Team not found' });
        }
        return res.json(result.rows[0]);
      }

      if (id) {
        const result = await pool.query('SELECT * FROM teams WHERE id = $1', [id]);
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Team not found' });
        }
        return res.json(result.rows[0]);
      }

      return res.status(400).json({ error: 'Provide code or id' });
    }

    // POST - Create team
    if (req.method === 'POST') {
      const { name, creatorName, creatorEmail } = req.body;

      if (!name || !creatorName) {
        return res.status(400).json({ error: 'Name and creator name required' });
      }

      // Check team limit
      const countResult = await pool.query('SELECT COUNT(*) as count FROM teams');
      const teamCount = parseInt(countResult.rows[0].count);
      if (teamCount >= MAX_TEAMS_LIMIT) {
        return res.status(400).json({
          error: 'Team limit reached',
          message: `Maximum ${MAX_TEAMS_LIMIT} teams allowed. Contact admin to delete old teams.`
        });
      }

      const teamId = generateId();
      const code = generateCode();
      const memberId = generateId();
      const avatar = ['🌵', '🎨', '🚀', '⭐', '🌈', '🔥', '💎', '🌸'][Math.floor(Math.random() * 8)];

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Create team
        await client.query(
          'INSERT INTO teams (id, name, code, created_by, settings) VALUES ($1, $2, $3, $4, $5)',
          [teamId, name, code, memberId, JSON.stringify({})]
        );

        // Create admin member
        await client.query(
          'INSERT INTO members (id, team_id, name, email, role, avatar) VALUES ($1, $2, $3, $4, $5, $6)',
          [memberId, teamId, creatorName, creatorEmail || null, 'admin', avatar]
        );

        await client.query('COMMIT');

        res.status(201).json({
          team: { id: teamId, name, code },
          member: { id: memberId, name: creatorName, role: 'admin', avatar }
        });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    // PUT - Update team settings
    if (req.method === 'PUT') {
      const { id, settings, name } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Team id required' });
      }

      const updates = [];
      const values = [];
      let paramCount = 1;

      if (name) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }
      if (settings) {
        updates.push(`settings = $${paramCount++}`);
        values.push(JSON.stringify(settings));
      }

      values.push(id);

      await pool.query(
        `UPDATE teams SET ${updates.join(', ')} WHERE id = $${paramCount}`,
        values
      );

      res.json({ success: true });
    }

  } catch (error) {
    console.error('Teams API error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
