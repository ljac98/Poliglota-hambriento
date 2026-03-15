import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(20) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      display_name VARCHAR(20) NOT NULL,
      wins INT DEFAULT 0,
      games_played INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS game_history (
      id SERIAL PRIMARY KEY,
      room_code VARCHAR(10),
      winner_id INT REFERENCES users(id) ON DELETE SET NULL,
      winner_name VARCHAR(20) NOT NULL,
      player_count INT NOT NULL,
      difficulty VARCHAR(10) NOT NULL,
      players JSONB NOT NULL,
      finished_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('✅ Base de datos inicializada');
}

export default pool;
