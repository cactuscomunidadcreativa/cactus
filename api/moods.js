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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Get moods by team and week, or team pulse
    if (req.method === 'GET') {
      const { teamId, weekStart, memberId, pulse } = req.query;

      if (!teamId) {
        return res.status(400).json({ error: 'teamId required' });
      }

      const week = weekStart || getWeekStart();

      // Get team pulse (average mood)
      if (pulse === 'true') {
        const result = await pool.query(
          `SELECT
            AVG(mood) as avg_mood,
            AVG(energy) as avg_energy,
            COUNT(*) as total_checkins
          FROM moods
          WHERE team_id = $1 AND week_start = $2`,
          [teamId, week]
        );

        const data = result.rows[0];
        res.json({
          avgMood: data.avg_mood ? parseFloat(data.avg_mood).toFixed(1) : null,
          avgEnergy: data.avg_energy ? parseFloat(data.avg_energy).toFixed(1) : null,
          totalCheckins: parseInt(data.total_checkins) || 0
        });
        return;
      }

      let query = 'SELECT * FROM moods WHERE team_id = $1 AND week_start = $2';
      let values = [teamId, week];

      if (memberId) {
        query += ' AND member_id = $3';
        values.push(memberId);
      }

      query += ' ORDER BY created_at';

      const result = await pool.query(query, values);
      res.json(result.rows);
    }

    // POST - Create or update mood
    if (req.method === 'POST') {
      const { teamId, memberId, mood, energy, note, emotion_data } = req.body;

      if (!teamId || !memberId || !mood || !energy) {
        return res.status(400).json({ error: 'teamId, memberId, mood, and energy required' });
      }

      const weekStart = getWeekStart();
      const moodId = generateId();

      // Upsert - update if exists, insert if not
      // emotion_data stores Plutchik wheel selection as JSON
      const result = await pool.query(
        `INSERT INTO moods (id, team_id, member_id, mood, energy, note, week_start, emotion_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (member_id, week_start)
         DO UPDATE SET mood = $4, energy = $5, note = $6, emotion_data = $8, created_at = NOW()
         RETURNING *`,
        [moodId, teamId, memberId, mood, energy, note || null, weekStart, emotion_data ? JSON.stringify(emotion_data) : null]
      );

      res.status(201).json(result.rows[0]);
    }

  } catch (error) {
    console.error('Moods API error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
