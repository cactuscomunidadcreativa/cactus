const pool = require('./db');

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Get tasks by team and week
    if (req.method === 'GET') {
      const { teamId, weekStart, memberId, section, includePending } = req.query;

      if (!teamId) {
        return res.status(400).json({ error: 'teamId required' });
      }

      const week = weekStart || getWeekStart();
      let query = 'SELECT * FROM tasks WHERE team_id = $1 AND week_start = $2';
      let values = [teamId, week];
      let paramCount = 3;

      if (memberId) {
        query += ` AND member_id = $${paramCount++}`;
        values.push(memberId);
      }

      if (section) {
        query += ` AND section = $${paramCount++}`;
        values.push(section);
      }

      query += ' ORDER BY created_at';

      let result = await pool.query(query, values);
      let tasks = result.rows;

      // Include pending tasks from previous weeks (carryover)
      if (includePending === 'true') {
        const pendingQuery = `
          SELECT * FROM tasks
          WHERE team_id = $1 AND week_start < $2 AND status = 'pending'
          ORDER BY week_start, created_at
        `;
        const pendingResult = await pool.query(pendingQuery, [teamId, week]);
        tasks = [...pendingResult.rows.map(t => ({ ...t, carryover: true })), ...tasks];
      }

      res.json(tasks);
    }

    // POST - Create task
    if (req.method === 'POST') {
      const { teamId, memberId, section, text, priority } = req.body;

      if (!teamId || !memberId || !section || !text) {
        return res.status(400).json({ error: 'teamId, memberId, section, and text required' });
      }

      const taskId = generateId();
      const weekStart = getWeekStart();

      await pool.query(
        `INSERT INTO tasks (id, team_id, member_id, section, text, priority, status, week_start)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [taskId, teamId, memberId, section, text, priority || 'normal', 'pending', weekStart]
      );

      res.status(201).json({
        id: taskId,
        team_id: teamId,
        member_id: memberId,
        section,
        text,
        priority: priority || 'normal',
        status: 'pending',
        week_start: weekStart
      });
    }

    // PUT - Update task
    if (req.method === 'PUT') {
      const { id, text, priority, status } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Task id required' });
      }

      const updates = [];
      const values = [];
      let paramCount = 1;

      if (text) {
        updates.push(`text = $${paramCount++}`);
        values.push(text);
      }
      if (priority) {
        updates.push(`priority = $${paramCount++}`);
        values.push(priority);
      }
      if (status) {
        updates.push(`status = $${paramCount++}`);
        values.push(status);
        if (status === 'completed') {
          updates.push(`completed_at = NOW()`);
        }
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'Nothing to update' });
      }

      values.push(id);

      await pool.query(
        `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramCount}`,
        values
      );

      res.json({ success: true });
    }

    // DELETE - Remove task
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Task id required' });
      }

      await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
      res.json({ success: true });
    }

  } catch (error) {
    console.error('Tasks API error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
