const { initDatabase } = require('./init-db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await initDatabase();
    res.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Init error:', error);
    res.status(500).json({ error: 'Failed to initialize database', details: error.message });
  }
};
