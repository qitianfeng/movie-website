const { pool } = require('../config/database');

class Review {
  static async create({ movieId, userId, rating, content }) {
    const [result] = await pool.execute(
      `INSERT INTO reviews (movie_id, user_id, rating, content) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), content = VALUES(content), updated_at = NOW()`,
      [movieId, userId, rating, content]
    );
    return result.insertId;
  }

  static async findByMovieId(movieId, page = 1, limit = 10) {
    const safeLimit = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const safeOffset = Math.max(0, (parseInt(page) - 1) * safeLimit || 0);
    
    const [reviews] = await pool.query(
      `SELECT r.id, r.movie_id as movieId, r.user_id as userId, r.rating, r.content, 
              r.created_at as createdAt, r.updated_at as updatedAt,
              u.username, u.avatar
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.movie_id = ? AND r.status = 'approved'
       ORDER BY r.created_at DESC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      [movieId]
    );
    
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM reviews WHERE movie_id = ? AND status = 'approved'`, [movieId]
    );
    
    return { reviews, total: countRows[0].total };
  }

  static async findByUserId(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const [reviews] = await pool.execute(
      `SELECT r.id, r.movie_id as movieId, r.rating, r.content, 
              r.created_at as createdAt,
              m.title, m.poster_path as posterPath
       FROM reviews r
       JOIN movies m ON r.movie_id = m.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    
    return reviews;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT r.*, u.username, u.avatar 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.id = ?`, [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  static async update(id, { rating, content }) {
    await pool.execute(
      `UPDATE reviews SET rating = ?, content = ? WHERE id = ?`,
      [rating, content, id]
    );
  }

  static async delete(id) {
    await pool.execute(`DELETE FROM reviews WHERE id = ?`, [id]);
  }

  static async getAverageRating(movieId) {
    const [rows] = await pool.execute(
      `SELECT AVG(rating) as avgRating, COUNT(*) as count FROM reviews WHERE movie_id = ?`,
      [movieId]
    );
    return {
      avgRating: rows[0].avgRating || 0,
      count: rows[0].count || 0
    };
  }
}

module.exports = Review;
