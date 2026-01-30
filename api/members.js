const pool = require('./db');

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Get members by team OR lookup by email
    if (req.method === 'GET') {
      const { teamId, email } = req.query;

      // Lookup all teams for an email
      if (email) {
        const result = await pool.query(`
          SELECT
            m.id as member_id,
            m.name as member_name,
            m.role,
            m.avatar,
            t.id as team_id,
            t.name as team_name,
            t.code as team_code
          FROM members m
          JOIN teams t ON t.id = m.team_id
          WHERE LOWER(m.email) = LOWER($1)
          ORDER BY m.joined_at DESC
        `, [email]);

        return res.json(result.rows);
      }

      if (!teamId) {
        return res.status(400).json({ error: 'teamId or email required' });
      }

      const result = await pool.query(
        'SELECT * FROM members WHERE team_id = $1 ORDER BY joined_at',
        [teamId]
      );

      res.json(result.rows);
    }

    // POST - Join team (create member)
    if (req.method === 'POST') {
      const { teamId, name, email } = req.body;

      if (!teamId || !name) {
        return res.status(400).json({ error: 'teamId and name required' });
      }

      // Verify team exists
      const teamCheck = await pool.query('SELECT id FROM teams WHERE id = $1', [teamId]);
      if (teamCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Team not found' });
      }

      const memberId = generateId();
      const avatar = ['🌵', '🎨', '🚀', '⭐', '🌈', '🔥', '💎', '🌸'][Math.floor(Math.random() * 8)];

      await pool.query(
        'INSERT INTO members (id, team_id, name, email, role, avatar) VALUES ($1, $2, $3, $4, $5, $6)',
        [memberId, teamId, name, email || null, 'member', avatar]
      );

      res.status(201).json({
        id: memberId,
        team_id: teamId,
        name,
        email,
        role: 'member',
        avatar
      });
    }

    // PUT - Update member
    if (req.method === 'PUT') {
      const { id, name, email, avatar, role } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Member id required' });
      }

      const updates = [];
      const values = [];
      let paramCount = 1;

      if (name) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }
      if (email !== undefined) {
        updates.push(`email = $${paramCount++}`);
        values.push(email);
      }
      if (avatar) {
        updates.push(`avatar = $${paramCount++}`);
        values.push(avatar);
      }
      if (role) {
        updates.push(`role = $${paramCount++}`);
        values.push(role);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'Nothing to update' });
      }

      values.push(id);

      await pool.query(
        `UPDATE members SET ${updates.join(', ')} WHERE id = $${paramCount}`,
        values
      );

      res.json({ success: true });
    }

    // DELETE - Remove member
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Member id required' });
      }

      await pool.query('DELETE FROM members WHERE id = $1', [id]);
      res.json({ success: true });
    }

  } catch (error) {
    console.error('Members API error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
