const { pool } = require('../config/database');

// Helper to convert undefined to null
const toNull = (val) => val === undefined ? null : val;

class Movie {
  static async create(data) {
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.execute(
        `INSERT INTO movies (tmdb_id, title, original_title, overview, poster_path, 
         backdrop_path, release_date, runtime, vote_average, vote_count, popularity, 
         original_language, status, tagline, is_popular, is_trending)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [toNull(data.tmdbId), toNull(data.title), toNull(data.originalTitle), toNull(data.overview), toNull(data.posterPath),
         toNull(data.backdropPath), toNull(data.releaseDate), toNull(data.runtime), toNull(data.voteAverage), toNull(data.voteCount),
         toNull(data.popularity), toNull(data.originalLanguage), toNull(data.status), toNull(data.tagline), 
         data.isPopular || false, data.isTrending || false]
      );
      
      const movieId = result.insertId;
      
      // Insert genres
      if (data.genres && data.genres.length > 0) {
        for (const genre of data.genres) {
          // First ensure genre exists
          await conn.execute(
            `INSERT IGNORE INTO genres (tmdb_id, name) VALUES (?, ?)`,
            [genre.id, genre.name]
          );
          // Get genre id
          const [genreRows] = await conn.execute(
            `SELECT id FROM genres WHERE tmdb_id = ?`, [genre.id]
          );
          if (genreRows.length > 0) {
            await conn.execute(
              `INSERT IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?, ?)`,
              [movieId, genreRows[0].id]
            );
          }
        }
      }
      
      // Insert cast
      if (data.cast && data.cast.length > 0) {
        for (const cast of data.cast) {
          await conn.execute(
            `INSERT INTO movie_cast (movie_id, tmdb_id, name, character_name, profile_path, \`order\`)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [movieId, toNull(cast.id), toNull(cast.name), toNull(cast.character), toNull(cast.profilePath), toNull(cast.order)]
          );
        }
      }
      
      // Insert videos
      if (data.videos && data.videos.length > 0) {
        for (const video of data.videos) {
          await conn.execute(
            `INSERT INTO movie_videos (movie_id, video_key, name, site, type)
             VALUES (?, ?, ?, ?, ?)`,
            [movieId, toNull(video.key), toNull(video.name), toNull(video.site), toNull(video.type)]
          );
        }
      }
      
      return movieId;
    } finally {
      conn.release();
    }
  }

  static async findById(id) {
    const conn = await pool.getConnection();
    try {
      const [movies] = await conn.execute(
        `SELECT * FROM movies WHERE id = ?`, [id]
      );
      if (movies.length === 0) return null;
      
      const movie = movies[0];
      
      // Get genres
      const [genres] = await conn.execute(
        `SELECT g.tmdb_id as id, g.name FROM genres g
         JOIN movie_genres mg ON g.id = mg.genre_id
         WHERE mg.movie_id = ?`, [id]
      );
      movie.genres = genres;
      
      // Get cast
      const [cast] = await conn.execute(
        `SELECT tmdb_id as id, name, character_name as \`character\`, profile_path as profilePath, \`order\`
         FROM movie_cast WHERE movie_id = ? ORDER BY \`order\` LIMIT 20`, [id]
      );
      movie.cast = cast;
      
      // Get videos
      const [videos] = await conn.execute(
        `SELECT video_key as \`key\`, name, site, type FROM movie_videos WHERE movie_id = ?`, [id]
      );
      movie.videos = videos;
      
      return movie;
    } finally {
      conn.release();
    }
  }

  static async findByTmdbId(tmdbId) {
    const [rows] = await pool.execute(
      `SELECT * FROM movies WHERE tmdb_id = ?`, [tmdbId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  static async findWithFilters({ genre, year, keyword, sort, page = 1, limit = 20 }) {
    const conn = await pool.getConnection();
    try {
      let whereClause = 'WHERE 1=1';
      const params = [];
      
      if (genre) {
        whereClause += ` AND EXISTS (SELECT 1 FROM movie_genres mg JOIN genres g ON mg.genre_id = g.id WHERE mg.movie_id = m.id AND g.tmdb_id = ?)`;
        params.push(parseInt(genre));
      }
      
      if (year) {
        whereClause += ` AND YEAR(m.release_date) = ?`;
        params.push(parseInt(year));
      }
      
      if (keyword) {
        whereClause += ` AND MATCH(m.title, m.overview) AGAINST(? IN BOOLEAN MODE)`;
        params.push(`*${keyword}*`);
      }
      
      let sortClause = 'ORDER BY m.popularity DESC';
      if (sort === 'release_date') sortClause = 'ORDER BY m.release_date DESC';
      if (sort === 'vote_average') sortClause = 'ORDER BY m.vote_average DESC';
      
      const offset = (page - 1) * limit;
      
      // Get total count
      const [countRows] = await conn.execute(
        `SELECT COUNT(DISTINCT m.id) as total FROM movies m ${whereClause}`, params
      );
      const total = countRows[0].total;
      
      // Get movies with genres (LIMIT/OFFSET must be inlined for MySQL2 compatibility)
      const safeLimit = Math.max(1, Math.min(100, parseInt(limit) || 20));
      const safeOffset = Math.max(0, parseInt(offset) || 0);
      const [movies] = await conn.execute(
        `SELECT DISTINCT m.id, m.title, m.poster_path as posterPath, m.vote_average as voteAverage, 
                m.release_date as releaseDate, m.popularity
         FROM movies m ${whereClause} ${sortClause} LIMIT ${safeLimit} OFFSET ${safeOffset}`,
        params
      );
      
      // Get genres for each movie
      for (const movie of movies) {
        const [genres] = await conn.execute(
          `SELECT g.tmdb_id as id, g.name FROM genres g
           JOIN movie_genres mg ON g.id = mg.genre_id WHERE mg.movie_id = ?`, [movie.id]
        );
        movie.genres = genres;
      }
      
      return { movies, total, totalPages: Math.ceil(total / limit) };
    } finally {
      conn.release();
    }
  }

  static async findPopular(page = 1, limit = 20) {
    const conn = await pool.getConnection();
    try {
      const safeLimit = Math.max(1, Math.min(100, parseInt(limit) || 20));
      const safeOffset = Math.max(0, (parseInt(page) - 1) * safeLimit || 0);
      
      const [countRows] = await conn.execute(
        `SELECT COUNT(*) as total FROM movies WHERE is_popular = TRUE`
      );
      
      const [movies] = await conn.execute(
        `SELECT id, title, poster_path as posterPath, vote_average as voteAverage, 
                release_date as releaseDate, popularity
         FROM movies WHERE is_popular = TRUE ORDER BY popularity DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`
      );
      
      for (const movie of movies) {
        const [genres] = await conn.execute(
          `SELECT g.tmdb_id as id, g.name FROM genres g
           JOIN movie_genres mg ON g.id = mg.genre_id WHERE mg.movie_id = ?`, [movie.id]
        );
        movie.genres = genres;
      }
      
      return { movies, total: countRows[0].total, totalPages: Math.ceil(countRows[0].total / safeLimit) };
    } finally {
      conn.release();
    }
  }

  static async findTrending(page = 1, limit = 20) {
    const conn = await pool.getConnection();
    try {
      const safeLimit = Math.max(1, Math.min(100, parseInt(limit) || 20));
      const safeOffset = Math.max(0, (parseInt(page) - 1) * safeLimit || 0);
      
      const [movies] = await conn.execute(
        `SELECT id, title, poster_path as posterPath, vote_average as voteAverage, 
                release_date as releaseDate, popularity
         FROM movies WHERE is_trending = TRUE ORDER BY popularity DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`
      );
      
      for (const movie of movies) {
        const [genres] = await conn.execute(
          `SELECT g.tmdb_id as id, g.name FROM genres g
           JOIN movie_genres mg ON g.id = mg.genre_id WHERE mg.movie_id = ?`, [movie.id]
        );
        movie.genres = genres;
      }
      
      return { movies };
    } finally {
      conn.release();
    }
  }

  static async countDocuments(filter = {}) {
    let query = 'SELECT COUNT(*) as count FROM movies';
    const [rows] = await pool.execute(query);
    return rows[0].count;
  }
}

module.exports = Movie;
