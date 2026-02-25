const { pool } = require('../config/database');

class Genre {
  static async create(data) {
    const [result] = await pool.execute(
      `INSERT IGNORE INTO genres (tmdb_id, name) VALUES (?, ?)`,
      [data.id, data.name]
    );
    return result.insertId;
  }

  static async findAll() {
    const [genres] = await pool.execute(
      `SELECT g.id, g.tmdb_id as tmdbId, g.name, COUNT(mg.movie_id) as movieCount
       FROM genres g
       LEFT JOIN movie_genres mg ON g.id = mg.genre_id
       GROUP BY g.id
       ORDER BY g.name`
    );
    return genres;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT id, tmdb_id as tmdbId, name FROM genres WHERE id = ?`, [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  static async findByTmdbId(tmdbId) {
    const [rows] = await pool.execute(
      `SELECT id, tmdb_id as tmdbId, name FROM genres WHERE tmdb_id = ?`, [tmdbId]
    );
    return rows.length > 0 ? rows[0] : null;
  }
}

module.exports = Genre;
