const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create({ username, email, password }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
      [username, email, hashedPassword]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT id, username, email, avatar, role, created_at, updated_at FROM users WHERE id = ?`,
      [id]
    );
    if (rows.length === 0) return null;
    
    const user = rows[0];
    
    // Get favorites
    const [favorites] = await pool.execute(
      `SELECT movie_id FROM user_favorites WHERE user_id = ?`, [id]
    );
    user.favorites = favorites.map(f => f.movie_id);
    
    // Get watchlist
    const [watchlist] = await pool.execute(
      `SELECT movie_id FROM user_watchlist WHERE user_id = ?`, [id]
    );
    user.watchlist = watchlist.map(w => w.movie_id);
    
    return user;
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute(
      `SELECT * FROM users WHERE email = ?`, [email]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  static async findByUsername(username) {
    const [rows] = await pool.execute(
      `SELECT * FROM users WHERE username = ?`, [username]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  static async findOne(conditions) {
    const { $or } = conditions;
    if ($or) {
      const email = $or.find(c => c.email)?.email;
      const username = $or.find(c => c.username)?.username;
      
      const [rows] = await pool.execute(
        `SELECT * FROM users WHERE email = ? OR username = ?`,
        [email || '', username || '']
      );
      return rows.length > 0 ? rows[0] : null;
    }
    
    if (conditions.email) {
      return this.findByEmail(conditions.email);
    }
    if (conditions.username) {
      return this.findByUsername(conditions.username);
    }
    
    return null;
  }

  static async comparePassword(user, candidatePassword) {
    return bcrypt.compare(candidatePassword, user.password);
  }

  static async updateLastLogin(userId) {
    await pool.execute(
      `UPDATE users SET last_login = NOW() WHERE id = ?`, [userId]
    );
  }

  static async updateProfile(userId, { avatar }) {
    await pool.execute(
      `UPDATE users SET avatar = ? WHERE id = ?`, [avatar, userId]
    );
  }

  static async addFavorite(userId, movieId) {
    await pool.execute(
      `INSERT IGNORE INTO user_favorites (user_id, movie_id) VALUES (?, ?)`,
      [userId, movieId]
    );
  }

  static async removeFavorite(userId, movieId) {
    await pool.execute(
      `DELETE FROM user_favorites WHERE user_id = ? AND movie_id = ?`,
      [userId, movieId]
    );
  }

  static async addToWatchlist(userId, movieId) {
    await pool.execute(
      `INSERT IGNORE INTO user_watchlist (user_id, movie_id) VALUES (?, ?)`,
      [userId, movieId]
    );
  }

  static async removeFromWatchlist(userId, movieId) {
    await pool.execute(
      `DELETE FROM user_watchlist WHERE user_id = ? AND movie_id = ?`,
      [userId, movieId]
    );
  }

  static async getAll(limit = 20, offset = 0) {
    const safeLimit = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const safeOffset = Math.max(0, parseInt(offset) || 0);
    
    const [users] = await pool.query(
      `SELECT id, username, email, avatar, role, created_at FROM users ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`
    );
    
    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM users`);
    
    return { users, total: countRows[0].total };
  }

  static async updateRole(userId, role) {
    await pool.execute(
      `UPDATE users SET role = ? WHERE id = ?`, [role, userId]
    );
  }

  static async delete(userId) {
    await pool.execute(`DELETE FROM users WHERE id = ?`, [userId]);
  }
}

module.exports = User;
