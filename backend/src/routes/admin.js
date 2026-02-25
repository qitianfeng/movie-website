const express = require('express');
const { pool } = require('../config/database');
const Movie = require('../models/Movie');
const User = require('../models/User');
const Genre = require('../models/Genre');
const Review = require('../models/Review');
const { auth, adminOnly } = require('../middleware/auth');
const tmdbService = require('../utils/tmdb');

const router = express.Router();

// All routes require auth and admin access
router.use(auth, adminOnly);

// Get system stats
router.get('/stats', async (req, res) => {
  try {
    const [[movieStats]] = await pool.execute(`SELECT COUNT(*) as total FROM movies`);
    const [[userStats]] = await pool.execute(`SELECT COUNT(*) as total FROM users`);
    const [[reviewStats]] = await pool.execute(`SELECT COUNT(*) as total FROM reviews`);
    const [[genreStats]] = await pool.execute(`SELECT COUNT(*) as total FROM genres`);

    const todayViews = Math.floor(Math.random() * 1000);

    res.json({
      success: true,
      data: {
        totalMovies: movieStats.total,
        totalUsers: userStats.total,
        totalReviews: reviewStats.total,
        totalGenres: genreStats.total,
        todayViews
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Sync movies from TMDB
router.post('/sync', async (req, res) => {
  try {
    const { type = 'movies', page = 1, limit = 20, tmdbId } = req.body;
    console.log(`[SYNC] Starting sync: type=${type}, page=${page}, limit=${limit}, tmdbId=${tmdbId}`);

    // Helper to convert undefined to null
    const toNull = (val) => val === undefined ? null : val;

    // Single movie import/update
    if (type === 'single_movie' && tmdbId) {
      const details = await tmdbService.getMovieDetails(tmdbId);
      const transformed = tmdbService.transformMovie(details);
      const conn = await pool.getConnection();
      
      try {
        const existing = await Movie.findByTmdbId(transformed.tmdbId);
        
        if (existing) {
          // 完整更新已存在的电影
          console.log(`[SYNC] Single movie exists, full update: ${transformed.title}`);
          
          await conn.execute(
            `UPDATE movies SET 
              title=?, original_title=?, overview=?, poster_path=?, backdrop_path=?,
              release_date=?, runtime=?, vote_average=?, vote_count=?, popularity=?,
              original_language=?, tagline=?, is_popular=TRUE
            WHERE tmdb_id=?`,
            [
              toNull(transformed.title), toNull(transformed.originalTitle), toNull(transformed.overview),
              toNull(transformed.posterPath), toNull(transformed.backdropPath), toNull(transformed.releaseDate),
              toNull(transformed.runtime), toNull(transformed.voteAverage), toNull(transformed.voteCount),
              toNull(transformed.popularity), toNull(transformed.originalLanguage), toNull(transformed.tagline),
              transformed.tmdbId
            ]
          );

          // 更新 genres
          await conn.execute(`DELETE FROM movie_genres WHERE movie_id = ?`, [existing.id]);
          if (transformed.genres && transformed.genres.length > 0) {
            for (const genre of transformed.genres) {
              await conn.execute(
                `INSERT IGNORE INTO genres (tmdb_id, name) VALUES (?, ?)`,
                [genre.id, genre.name]
              );
              const [genreRows] = await conn.execute(
                `SELECT id FROM genres WHERE tmdb_id = ?`, [genre.id]
              );
              if (genreRows.length > 0) {
                await conn.execute(
                  `INSERT IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?, ?)`,
                  [existing.id, genreRows[0].id]
                );
              }
            }
          }

          // 更新 cast
          await conn.execute(`DELETE FROM movie_cast WHERE movie_id = ?`, [existing.id]);
          if (transformed.cast && transformed.cast.length > 0) {
            for (const cast of transformed.cast) {
              await conn.execute(
                `INSERT INTO movie_cast (movie_id, tmdb_id, name, character_name, profile_path, \`order\`)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [existing.id, toNull(cast.id), toNull(cast.name), toNull(cast.character), toNull(cast.profilePath), toNull(cast.order)]
              );
            }
          }

          // 更新 videos
          await conn.execute(`DELETE FROM movie_videos WHERE movie_id = ?`, [existing.id]);
          if (transformed.videos && transformed.videos.length > 0) {
            for (const video of transformed.videos) {
              await conn.execute(
                `INSERT INTO movie_videos (movie_id, video_key, name, site, type)
                 VALUES (?, ?, ?, ?, ?)`,
                [existing.id, toNull(video.key), toNull(video.name), toNull(video.site), toNull(video.type)]
              );
            }
          }

          const movie = await Movie.findById(existing.id);
          return res.json({
            success: true,
            data: { synced: 1, movie, updated: true, message: '电影已更新' }
          });
        }
        
        // 创建新电影
        const movieId = await Movie.create({ ...transformed, isPopular: true });
        const movie = await Movie.findById(movieId);
        
        return res.json({
          success: true,
          data: { synced: 1, movie, created: true }
        });
      } finally {
        conn.release();
      }
    }

    // Helper to convert undefined to null
    const toNull2 = (val) => val === undefined ? null : val;

    if (type === 'movies') {
      const data = await tmdbService.getPopularMovies(page);
      console.log(`[SYNC] Got ${data?.results?.length || 0} movies from TMDB`);
      
      if (!data || !data.results || data.results.length === 0) {
        return res.json({
          success: true,
          data: { synced: 0, movies: [], message: 'No movies returned from TMDB' }
        });
      }
      
      const syncedMovies = [];
      const conn = await pool.getConnection();

      try {
        for (const movieData of data.results.slice(0, limit)) {
          try {
            console.log(`[SYNC] Processing movie: ${movieData.title} (ID: ${movieData.id})`);
            const details = await tmdbService.getMovieDetails(movieData.id);
            const transformed = tmdbService.transformMovie(details);
            console.log(`[SYNC] Transformed: ${transformed.title}`);

            // Check if movie exists
            const existing = await Movie.findByTmdbId(transformed.tmdbId);
            
            if (existing) {
              // 完整更新已存在的电影
              console.log(`[SYNC] Movie exists, full update: ${transformed.title}`);
              
              await conn.execute(
                `UPDATE movies SET 
                  title=?, original_title=?, overview=?, poster_path=?, backdrop_path=?,
                  release_date=?, runtime=?, vote_average=?, vote_count=?, popularity=?,
                  original_language=?, tagline=?, is_popular=TRUE
                WHERE tmdb_id=?`,
                [
                  toNull2(transformed.title), toNull2(transformed.originalTitle), toNull2(transformed.overview),
                  toNull2(transformed.posterPath), toNull2(transformed.backdropPath), toNull2(transformed.releaseDate),
                  toNull2(transformed.runtime), toNull2(transformed.voteAverage), toNull2(transformed.voteCount),
                  toNull2(transformed.popularity), toNull2(transformed.originalLanguage), toNull2(transformed.tagline),
                  transformed.tmdbId
                ]
              );

              // 更新 genres
              await conn.execute(`DELETE FROM movie_genres WHERE movie_id = ?`, [existing.id]);
              if (transformed.genres && transformed.genres.length > 0) {
                for (const genre of transformed.genres) {
                  await conn.execute(
                    `INSERT IGNORE INTO genres (tmdb_id, name) VALUES (?, ?)`,
                    [genre.id, genre.name]
                  );
                  const [genreRows] = await conn.execute(
                    `SELECT id FROM genres WHERE tmdb_id = ?`, [genre.id]
                  );
                  if (genreRows.length > 0) {
                    await conn.execute(
                      `INSERT IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?, ?)`,
                      [existing.id, genreRows[0].id]
                    );
                  }
                }
              }

              // 更新 cast
              await conn.execute(`DELETE FROM movie_cast WHERE movie_id = ?`, [existing.id]);
              if (transformed.cast && transformed.cast.length > 0) {
                for (const cast of transformed.cast) {
                  await conn.execute(
                    `INSERT INTO movie_cast (movie_id, tmdb_id, name, character_name, profile_path, \`order\`)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [existing.id, toNull2(cast.id), toNull2(cast.name), toNull2(cast.character), toNull2(cast.profilePath), toNull2(cast.order)]
                  );
                }
              }

              // 更新 videos
              await conn.execute(`DELETE FROM movie_videos WHERE movie_id = ?`, [existing.id]);
              if (transformed.videos && transformed.videos.length > 0) {
                for (const video of transformed.videos) {
                  await conn.execute(
                    `INSERT INTO movie_videos (movie_id, video_key, name, site, type)
                     VALUES (?, ?, ?, ?, ?)`,
                    [existing.id, toNull2(video.key), toNull2(video.name), toNull2(video.site), toNull2(video.type)]
                  );
                }
              }

              syncedMovies.push({ ...existing, ...transformed, updated: true });
            } else {
              // 创建新电影
              console.log(`[SYNC] Creating new movie: ${transformed.title}`);
              const movieId = await Movie.create({ ...transformed, isPopular: true });
              console.log(`[SYNC] Created movie ID: ${movieId}`);
              syncedMovies.push({ id: movieId, ...transformed, created: true });
            }
          } catch (err) {
            console.error(`Error syncing movie ${movieData.id}:`, err.message);
          }
        }
      } finally {
        conn.release();
      }

      console.log(`[SYNC] Completed. Synced ${syncedMovies.length} movies`);
      res.json({
        success: true,
        data: { synced: syncedMovies.length, movies: syncedMovies }
      });
    } else if (type === 'genres') {
      const data = await tmdbService.getGenres();

      for (const genre of data.genres) {
        await Genre.create({ id: genre.id, name: genre.name });
      }

      res.json({
        success: true,
        data: { synced: data.genres.length }
      });
    } else if (type === 'banners' || type === 'now_playing') {
      // 同步正在上映的电影作为轮播
      const data = await tmdbService.getNowPlaying(page);
      console.log(`[SYNC] Got ${data?.results?.length || 0} now playing movies from TMDB`);
      
      if (!data || !data.results || data.results.length === 0) {
        return res.json({
          success: true,
          data: { synced: 0, message: 'No now playing movies returned from TMDB' }
        });
      }

      // 先清除所有轮播标记
      await pool.execute('UPDATE movies SET is_banner = FALSE, banner_order = 0');

      const syncedBanners = [];
      const limitVal = Math.min(limit, 5); // 轮播最多5个

      for (let i = 0; i < Math.min(data.results.length, limitVal); i++) {
        const movieData = data.results[i];
        try {
          console.log(`[SYNC] Processing banner movie: ${movieData.title} (ID: ${movieData.id})`);
          
          // 检查电影是否存在
          let movie = await Movie.findByTmdbId(movieData.id);
          
          if (!movie) {
            // 电影不存在，先获取详情并创建
            const details = await tmdbService.getMovieDetails(movieData.id);
            const transformed = tmdbService.transformMovie(details);
            const movieId = await Movie.create({ ...transformed, isPopular: true });
            movie = { id: movieId, ...transformed };
          }

          // 设置为轮播
          await pool.execute(
            'UPDATE movies SET is_banner = TRUE, banner_order = ? WHERE id = ?',
            [i + 1, movie.id]
          );

          syncedBanners.push({ ...movie, banner_order: i + 1 });
        } catch (err) {
          console.error(`Error syncing banner movie ${movieData.id}:`, err.message);
        }
      }

      console.log(`[SYNC] Completed. Synced ${syncedBanners.length} banner movies`);
      res.json({
        success: true,
        data: { synced: syncedBanners.length, banners: syncedBanners, message: `已同步 ${syncedBanners.length} 部正在上映电影作为轮播` }
      });
    } else {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_TYPE', message: 'Invalid sync type' }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Get all users (admin only)
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limitVal = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limitVal;

    // 直接查询包含 role_id
    const [users] = await pool.execute(`
      SELECT u.id, u.username, u.email, u.avatar, u.role, u.role_id, u.last_login, u.created_at,
             r.display_name as role_display_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.id DESC
      LIMIT ${limitVal} OFFSET ${offset}
    `);

    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) as total FROM users`);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit: limitVal,
          total,
          totalPages: Math.ceil(total / limitVal)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Create movie (manual add)
router.post('/movies', async (req, res) => {
  try {
    const { title, overview, posterPath, backdropPath, releaseDate, runtime, voteAverage, popularity, genres, isPopular, isTrending } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '电影标题不能为空' }
      });
    }

    // Generate a negative TMDB ID for manually added movies
    const [maxResult] = await pool.execute('SELECT MIN(tmdb_id) as minId FROM movies');
    const minId = maxResult[0]?.minId || 0;
    const fakeTmdbId = Math.min(minId, 0) - 1;

    const movieId = await Movie.create({
      tmdbId: fakeTmdbId,
      title,
      overview,
      posterPath,
      backdropPath,
      releaseDate,
      runtime: runtime ? parseInt(runtime) : null,
      voteAverage: voteAverage ? parseFloat(voteAverage) : 0,
      voteCount: 0,
      popularity: popularity ? parseFloat(popularity) : 0,
      genres: genres || [],
      isPopular: isPopular || false,
      isTrending: isTrending || false
    });

    const movie = await Movie.findById(movieId);
    res.json({ success: true, data: movie, message: '电影创建成功' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Delete movie
router.delete('/movies/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    
    if (!movie) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Movie not found' }
      });
    }

    await pool.execute(`DELETE FROM movies WHERE id = ?`, [req.params.id]);

    res.json({ success: true, message: 'Movie deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Update user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ROLE', message: 'Invalid role' }
      });
    }

    await User.updateRole(req.params.id, role);
    res.json({ success: true, message: 'User role updated' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }

    await User.delete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Update movie
router.put('/movies/:id', async (req, res) => {
  try {
    const { title, overview, posterPath, backdropPath, voteAverage, popularity, isPopular, isTrending, genres } = req.body;
    
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Movie not found' }
      });
    }

    // Helper to convert undefined to null
    const toNull = (val) => val === undefined ? null : val;

    await pool.execute(
      `UPDATE movies SET title=?, overview=?, poster_path=?, backdrop_path=?, vote_average=?, popularity=?, is_popular=?, is_trending=? WHERE id=?`,
      [toNull(title), toNull(overview), toNull(posterPath), toNull(backdropPath), toNull(voteAverage), toNull(popularity), isPopular ? 1 : 0, isTrending ? 1 : 0, req.params.id]
    );

    // Update genres if provided
    if (genres && Array.isArray(genres)) {
      // Delete existing genre associations
      await pool.execute(`DELETE FROM movie_genres WHERE movie_id = ?`, [req.params.id]);
      
      // Add new genre associations
      for (const genreId of genres) {
        // genreId can be tmdb_id or local id
        let localGenreId = genreId;
        
        // Check if it's a tmdb_id (larger number)
        const [genreByTmdb] = await pool.execute(`SELECT id FROM genres WHERE tmdb_id = ?`, [genreId]);
        if (genreByTmdb.length > 0) {
          localGenreId = genreByTmdb[0].id;
        }
        
        await pool.execute(
          `INSERT IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?, ?)`,
          [req.params.id, localGenreId]
        );
      }
    }

    const updated = await Movie.findById(req.params.id);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Get reviews with status filter (admin)
router.get('/reviews', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limitVal = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const offset = (page - 1) * limitVal;

    // Build query based on status filter
    let whereClause = '1=1';
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      whereClause += ` AND r.status = '${status}'`;
    }

    // Use pool.query for simpler parameter handling
    const [reviews] = await pool.query(
      `SELECT r.id, r.movie_id, r.user_id, r.rating, r.content, r.status, r.created_at,
              u.username, u.email, m.title as movie_title
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN movies m ON r.movie_id = m.id
       WHERE ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT ${limitVal} OFFSET ${offset}`
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM reviews r WHERE ${whereClause}`
    );

    // Get status counts
    const [statusCounts] = await pool.query(`
      SELECT status, COUNT(*) as count FROM reviews GROUP BY status
    `);

    const statusStats = { pending: 0, approved: 0, rejected: 0 };
    statusCounts.forEach(s => {
      if (s.status) statusStats[s.status] = s.count;
    });

    res.json({
      success: true,
      data: {
        reviews,
        statusStats,
        pagination: {
          page,
          limit: limitVal,
          total: countRows[0].total,
          totalPages: Math.ceil(countRows[0].total / limitVal)
        }
      }
    });
  } catch (error) {
    console.error('Reviews error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Approve review (admin)
router.put('/reviews/:id/approve', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' }
      });
    }

    await pool.execute(`UPDATE reviews SET status = 'approved' WHERE id = ?`, [req.params.id]);
    res.json({ success: true, message: 'Review approved successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Reject review (admin)
router.put('/reviews/:id/reject', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' }
      });
    }

    await pool.execute(`UPDATE reviews SET status = 'rejected' WHERE id = ?`, [req.params.id]);
    res.json({ success: true, message: 'Review rejected successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Delete review (admin)
router.delete('/reviews/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' }
      });
    }

    await Review.delete(req.params.id);
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Batch approve reviews (admin)
router.put('/reviews/batch/approve', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_IDS', message: 'Invalid review IDs' }
      });
    }

    const placeholders = ids.map(() => '?').join(',');
    await pool.execute(
      `UPDATE reviews SET status = 'approved' WHERE id IN (${placeholders})`,
      ids
    );
    res.json({ success: true, message: `${ids.length} reviews approved` });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Batch reject reviews (admin)
router.put('/reviews/batch/reject', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_IDS', message: 'Invalid review IDs' }
      });
    }

    const placeholders = ids.map(() => '?').join(',');
    await pool.execute(
      `UPDATE reviews SET status = 'rejected' WHERE id IN (${placeholders})`,
      ids
    );
    res.json({ success: true, message: `${ids.length} reviews rejected` });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Get rating distribution stats
router.get('/stats/ratings', async (req, res) => {
  try {
    // Rating distribution (0-2, 2-4, 4-6, 6-8, 8-10)
    const [ratingDist] = await pool.execute(`
      SELECT 
        CASE 
          WHEN vote_average < 2 THEN '0-2'
          WHEN vote_average < 4 THEN '2-4'
          WHEN vote_average < 6 THEN '4-6'
          WHEN vote_average < 8 THEN '6-8'
          ELSE '8-10'
        END as range_label,
        COUNT(*) as count
      FROM movies 
      WHERE vote_average IS NOT NULL
      GROUP BY range_label
      ORDER BY range_label
    `);

    // Genre distribution
    const [genreDist] = await pool.execute(`
      SELECT g.name, COUNT(mg.movie_id) as count
      FROM genres g
      LEFT JOIN movie_genres mg ON g.id = mg.genre_id
      GROUP BY g.id, g.name
      ORDER BY count DESC
      LIMIT 10
    `);

    // Average rating by genre
    const [avgByGenre] = await pool.execute(`
      SELECT g.name, AVG(m.vote_average) as avg_rating, COUNT(*) as movie_count
      FROM genres g
      JOIN movie_genres mg ON g.id = mg.genre_id
      JOIN movies m ON mg.movie_id = m.id
      WHERE m.vote_average IS NOT NULL
      GROUP BY g.id, g.name
      HAVING movie_count >= 1
      ORDER BY avg_rating DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        ratingDistribution: ratingDist,
        genreDistribution: genreDist,
        avgRatingByGenre: avgByGenre
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Get user activity stats
router.get('/stats/activity', async (req, res) => {
  try {
    // User registration trend (last 7 days)
    const [regTrend] = await pool.execute(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // Review activity trend (last 7 days)
    const [reviewTrend] = await pool.execute(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM reviews
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // Most active users
    const [activeUsers] = await pool.execute(`
      SELECT u.id, u.username, u.email,
             COUNT(DISTINCT r.id) as review_count,
             COUNT(DISTINCT f.movie_id) as favorite_count
      FROM users u
      LEFT JOIN reviews r ON u.id = r.user_id
      LEFT JOIN user_favorites f ON u.id = f.user_id
      GROUP BY u.id, u.username, u.email
      ORDER BY (review_count + favorite_count) DESC
      LIMIT 10
    `);

    // Top rated movies by users
    const [topUserRated] = await pool.execute(`
      SELECT m.id, m.title, m.poster_path, AVG(r.rating) as avg_user_rating, COUNT(r.id) as review_count
      FROM movies m
      JOIN reviews r ON m.id = r.movie_id
      GROUP BY m.id, m.title, m.poster_path
      HAVING review_count >= 1
      ORDER BY avg_user_rating DESC, review_count DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        registrationTrend: regTrend,
        reviewTrend: reviewTrend,
        activeUsers: activeUsers,
        topUserRated: topUserRated
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Get system logs (mock)
router.get('/logs', async (req, res) => {
  try {
    const logs = [
      { id: 1, action: '用户登录', user: 'admin', ip: '127.0.0.1', time: new Date().toISOString() },
      { id: 2, action: '同步电影数据', user: 'admin', ip: '127.0.0.1', time: new Date(Date.now() - 3600000).toISOString() },
      { id: 3, action: '删除评论', user: 'admin', ip: '127.0.0.1', time: new Date(Date.now() - 7200000).toISOString() }
    ];
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Search TMDB movies
router.get('/tmdb/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '搜索关键词不能为空' }
      });
    }

    const results = await tmdbService.searchMovies(query);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// ==================== 分类管理 API ====================

// Get all genres for admin
router.get('/genres', async (req, res) => {
  try {
    const [genres] = await pool.query(`
      SELECT g.*, COUNT(mg.movie_id) as movie_count
      FROM genres g
      LEFT JOIN movie_genres mg ON g.id = mg.genre_id
      GROUP BY g.id
      ORDER BY g.id
    `);
    res.json({ success: true, data: genres });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Create genre
router.post('/genres', async (req, res) => {
  try {
    const { name, tmdbId } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '分类名称不能为空' }
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO genres (name, tmdb_id) VALUES (?, ?)',
      [name, tmdbId || null]
    );

    res.json({ 
      success: true, 
      data: { id: result.insertId, name, tmdbId },
      message: '分类创建成功'
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        error: { code: 'DUPLICATE', message: '分类名称已存在' }
      });
    }
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Update genre
router.put('/genres/:id', async (req, res) => {
  try {
    const { name, tmdbId } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '分类名称不能为空' }
      });
    }

    await pool.execute(
      'UPDATE genres SET name = ?, tmdb_id = ? WHERE id = ?',
      [name, tmdbId || null, req.params.id]
    );

    res.json({ success: true, message: '分类更新成功' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        error: { code: 'DUPLICATE', message: '分类名称已存在' }
      });
    }
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Delete genre
router.delete('/genres/:id', async (req, res) => {
  try {
    // Check if genre has movies
    const [[{ count }]] = await pool.execute(
      'SELECT COUNT(*) as count FROM movie_genres WHERE genre_id = ?',
      [req.params.id]
    );

    if (count > 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'HAS_MOVIES', message: `该分类下有 ${count} 部电影，无法删除` }
      });
    }

    await pool.execute('DELETE FROM genres WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '分类删除成功' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// ==================== RBAC 角色管理 API ====================

// Get all roles
router.get('/roles', async (req, res) => {
  try {
    const [roles] = await pool.execute(`
      SELECT r.*, 
        (SELECT COUNT(*) FROM role_permissions rp WHERE rp.role_id = r.id) as permission_count,
        (SELECT COUNT(*) FROM users u WHERE u.role_id = r.id) as user_count
      FROM roles r
      ORDER BY r.id
    `);
    res.json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Get role by id with permissions
router.get('/roles/:id', async (req, res) => {
  try {
    const [roles] = await pool.execute('SELECT * FROM roles WHERE id = ?', [req.params.id]);
    if (roles.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '角色不存在' }
      });
    }

    const [permissions] = await pool.execute(`
      SELECT p.* FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `, [req.params.id]);

    res.json({ success: true, data: { ...roles[0], permissions } });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Create role
router.post('/roles', async (req, res) => {
  try {
    const { name, display_name, description, permissions } = req.body;
    
    if (!name || !display_name) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '角色名称和显示名称不能为空' }
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO roles (name, display_name, description) VALUES (?, ?, ?)',
      [name, display_name, description || null]
    );

    const roleId = result.insertId;

    // Assign permissions
    if (permissions && permissions.length > 0) {
      for (const permId of permissions) {
        await pool.execute(
          'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
          [roleId, permId]
        );
      }
    }

    res.json({ success: true, data: { id: roleId, name, display_name }, message: '角色创建成功' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        error: { code: 'DUPLICATE', message: '角色名称已存在' }
      });
    }
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Update role
router.put('/roles/:id', async (req, res) => {
  try {
    const { display_name, description, permissions } = req.body;
    
    const [roles] = await pool.execute('SELECT * FROM roles WHERE id = ?', [req.params.id]);
    if (roles.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '角色不存在' }
      });
    }

    if (roles[0].is_system) {
      return res.status(400).json({
        success: false,
        error: { code: 'SYSTEM_ROLE', message: '系统角色不能修改' }
      });
    }

    await pool.execute(
      'UPDATE roles SET display_name = ?, description = ? WHERE id = ?',
      [display_name, description || null, req.params.id]
    );

    // Update permissions
    if (permissions !== undefined) {
      await pool.execute('DELETE FROM role_permissions WHERE role_id = ?', [req.params.id]);
      for (const permId of permissions) {
        await pool.execute(
          'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
          [req.params.id, permId]
        );
      }
    }

    res.json({ success: true, message: '角色更新成功' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Delete role
router.delete('/roles/:id', async (req, res) => {
  try {
    const [roles] = await pool.execute('SELECT * FROM roles WHERE id = ?', [req.params.id]);
    if (roles.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '角色不存在' }
      });
    }

    if (roles[0].is_system) {
      return res.status(400).json({
        success: false,
        error: { code: 'SYSTEM_ROLE', message: '系统角色不能删除' }
      });
    }

    // Check if role has users
    const [[{ count }]] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE role_id = ?',
      [req.params.id]
    );

    if (count > 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'HAS_USERS', message: `该角色下有 ${count} 个用户，无法删除` }
      });
    }

    await pool.execute('DELETE FROM roles WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '角色删除成功' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// ==================== RBAC 权限管理 API ====================

// Get all permissions
router.get('/permissions', async (req, res) => {
  try {
    const [permissions] = await pool.execute(`
      SELECT p.*, 
        (SELECT COUNT(*) FROM role_permissions rp WHERE rp.permission_id = p.id) as role_count
      FROM permissions p
      ORDER BY p.module, p.id
    `);
    
    // Group by module
    const grouped = {};
    permissions.forEach(p => {
      if (!grouped[p.module]) {
        grouped[p.module] = [];
      }
      grouped[p.module].push(p);
    });
    
    res.json({ success: true, data: { permissions, grouped } });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// ==================== 用户角色分配 API ====================

// Update user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role_id } = req.body;
    
    // Verify role exists
    const [roles] = await pool.execute('SELECT id FROM roles WHERE id = ?', [role_id]);
    if (roles.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ROLE', message: '角色不存在' }
      });
    }

    await pool.execute('UPDATE users SET role_id = ? WHERE id = ?', [role_id, req.params.id]);
    res.json({ success: true, message: '用户角色更新成功' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Get user permissions (for current user)
router.get('/me/permissions', async (req, res) => {
  try {
    const userId = req.userId;
    
    const [users] = await pool.execute(`
      SELECT u.id, u.username, u.email, r.id as role_id, r.name as role_name, r.display_name as role_display_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [userId]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '用户不存在' }
      });
    }

    const user = users[0];

    // Get permissions
    let permissions = [];
    if (user.role_id) {
      const [perms] = await pool.execute(`
        SELECT p.name, p.display_name, p.module
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ?
      `, [user.role_id]);
      permissions = perms;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        role: user.role_id ? {
          id: user.role_id,
          name: user.role_name,
          display_name: user.role_display_name
        } : null,
        permissions: permissions.map(p => p.name)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// ==================== 轮播管理 API ====================

// Get banner movies
router.get('/banners', async (req, res) => {
  try {
    const [movies] = await pool.execute(`
      SELECT id, title, poster_path, backdrop_path, vote_average, release_date, is_banner, banner_order
      FROM movies 
      WHERE is_banner = TRUE 
      ORDER BY banner_order ASC, popularity DESC
    `);
    res.json({ success: true, data: movies });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Get all movies for banner selection (with banner status)
router.get('/banners/available', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limitVal = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limitVal;
    const search = req.query.search || '';

    let whereClause = '1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (title LIKE ? OR original_title LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [movies] = await pool.execute(`
      SELECT id, title, poster_path, backdrop_path, vote_average, release_date, popularity, is_banner, banner_order
      FROM movies 
      WHERE ${whereClause}
      ORDER BY is_banner DESC, banner_order ASC, popularity DESC
      LIMIT ${limitVal} OFFSET ${offset}
    `, params);

    const [[{ total }]] = await pool.execute(`
      SELECT COUNT(*) as total FROM movies WHERE ${whereClause}
    `, params);

    res.json({
      success: true,
      data: {
        movies,
        pagination: {
          page,
          limit: limitVal,
          total,
          totalPages: Math.ceil(total / limitVal)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Set movie as banner
router.post('/banners/:id', async (req, res) => {
  try {
    const { order } = req.body;
    const movieId = req.params.id;

    // Check if movie exists
    const [movies] = await pool.execute('SELECT id FROM movies WHERE id = ?', [movieId]);
    if (movies.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '电影不存在' }
      });
    }

    // Get max order
    let bannerOrder = order;
    if (bannerOrder === undefined) {
      const [[{ maxOrder }]] = await pool.execute('SELECT COALESCE(MAX(banner_order), 0) as maxOrder FROM movies WHERE is_banner = TRUE');
      bannerOrder = maxOrder + 1;
    }

    await pool.execute(
      'UPDATE movies SET is_banner = TRUE, banner_order = ? WHERE id = ?',
      [bannerOrder, movieId]
    );

    res.json({ success: true, message: '已设置为轮播电影' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Remove movie from banner
router.delete('/banners/:id', async (req, res) => {
  try {
    await pool.execute(
      'UPDATE movies SET is_banner = FALSE, banner_order = 0 WHERE id = ?',
      [req.params.id]
    );

    res.json({ success: true, message: '已移除轮播' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Update banner order
router.put('/banners/order', async (req, res) => {
  try {
    const { orders } = req.body; // [{ id: 1, order: 1 }, { id: 2, order: 2 }]

    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATA', message: '无效的排序数据' }
      });
    }

    const conn = await pool.getConnection();
    try {
      for (const item of orders) {
        await conn.execute(
          'UPDATE movies SET banner_order = ? WHERE id = ?',
          [item.order, item.id]
        );
      }
    } finally {
      conn.release();
    }

    res.json({ success: true, message: '轮播顺序已更新' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

module.exports = router;
