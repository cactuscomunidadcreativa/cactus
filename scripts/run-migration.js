require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function runMigration(filename) {
  const filepath = path.join(__dirname, '..', 'supabase', 'migrations', filename);

  if (!fs.existsSync(filepath)) {
    console.log(`⚠️  File not found: ${filename}`);
    return;
  }

  const sql = fs.readFileSync(filepath, 'utf-8');

  console.log(`\n📦 Running migration: ${filename}`);
  console.log('─'.repeat(50));

  // Execute entire SQL file at once using postgrest
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      console.log('  ⚠️  Direct RPC not available, showing SQL to run manually');
      console.log('\n  Copy this SQL to Supabase SQL Editor:\n');
      console.log('─'.repeat(50));
      console.log(sql);
      console.log('─'.repeat(50));
    } else {
      console.log('  ✅ Migration executed successfully');
    }
  } catch (e) {
    console.log('  ⚠️  Cannot execute via API, showing SQL to run manually');
    console.log('\n  Copy this SQL to Supabase SQL Editor:\n');
    console.log('─'.repeat(50));
    console.log(sql);
    console.log('─'.repeat(50));
  }
}

async function main() {
  console.log('🚀 Supabase Migrations for Ramona');
  console.log('='.repeat(50));
  console.log(`URL: ${supabaseUrl}`);

  const migrations = process.argv.slice(2);

  if (migrations.length === 0) {
    // Run all pending migrations
    await runMigration('007_ramona_batch.sql');
    await runMigration('008_ramona_video.sql');
  } else {
    for (const m of migrations) {
      await runMigration(m);
    }
  }

  console.log('\n✨ Done!');
}

main().catch(console.error);
