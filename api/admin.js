const pool = require('./db');

// Admin password for accessing the panel (simple auth)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'cactus2024';
const MAX_TEAMS_LIMIT = 50; // Maximum number of teams allowed

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Simple password check
  const password = req.headers['x-admin-password'];
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // GET - List all teams with stats
    if (req.method === 'GET') {
      const result = await pool.query(`
        SELECT
          t.id,
          t.name,
          t.code,
          t.created_at,
          COUNT(DISTINCT m.id) as member_count,
          COUNT(DISTINCT tk.id) as task_count,
          (SELECT name FROM members WHERE team_id = t.id AND role = 'admin' LIMIT 1) as admin_name
        FROM teams t
        LEFT JOIN members m ON m.team_id = t.id
        LEFT JOIN tasks tk ON tk.team_id = t.id
        GROUP BY t.id, t.name, t.code, t.created_at
        ORDER BY t.created_at DESC
      `);

      // Get total counts
      const statsResult = await pool.query(`
        SELECT
          (SELECT COUNT(*) FROM teams) as total_teams,
          (SELECT COUNT(*) FROM members) as total_members,
          (SELECT COUNT(*) FROM tasks) as total_tasks,
          (SELECT COUNT(*) FROM moods) as total_moods
      `);

      return res.json({
        teams: result.rows,
        stats: statsResult.rows[0],
        limit: MAX_TEAMS_LIMIT,
        canCreateMore: parseInt(statsResult.rows[0].total_teams) < MAX_TEAMS_LIMIT
      });
    }

    // DELETE - Delete a team
    if (req.method === 'DELETE') {
      const { teamId } = req.query;

      if (!teamId) {
        return res.status(400).json({ error: 'Team ID required' });
      }

      // Delete team (cascade will delete members, tasks, moods, integrations)
      await pool.query('DELETE FROM teams WHERE id = $1', [teamId]);

      return res.json({ success: true, message: 'Team deleted' });
    }

    // POST - Check team limit before creation
    if (req.method === 'POST') {
      const { action } = req.body;

      if (action === 'check-limit') {
        const result = await pool.query('SELECT COUNT(*) as count FROM teams');
        const count = parseInt(result.rows[0].count);

        return res.json({
          currentCount: count,
          limit: MAX_TEAMS_LIMIT,
          canCreate: count < MAX_TEAMS_LIMIT
        });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Admin API error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
