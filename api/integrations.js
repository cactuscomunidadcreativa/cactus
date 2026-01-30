const pool = require('./db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Get integrations by team
    if (req.method === 'GET') {
      const { teamId, type } = req.query;

      if (!teamId) {
        return res.status(400).json({ error: 'teamId required' });
      }

      let query = 'SELECT * FROM integrations WHERE team_id = $1';
      let values = [teamId];

      if (type) {
        query += ' AND type = $2';
        values.push(type);
      }

      const result = await pool.query(query, values);
      res.json(result.rows);
    }

    // POST/PUT - Save integration settings
    if (req.method === 'POST' || req.method === 'PUT') {
      const { teamId, type, settings, enabled } = req.body;

      if (!teamId || !type) {
        return res.status(400).json({ error: 'teamId and type required' });
      }

      const result = await pool.query(
        `INSERT INTO integrations (team_id, type, settings, enabled)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (team_id, type)
         DO UPDATE SET settings = $3, enabled = $4
         RETURNING *`,
        [teamId, type, JSON.stringify(settings || {}), enabled !== false]
      );

      res.json(result.rows[0]);
    }

  } catch (error) {
    console.error('Integrations API error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
