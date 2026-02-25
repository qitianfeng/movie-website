const express = require('express');
const Movie = require('../models/Movie');
const { pool } = require('../config/database');

const router = express.Router();

// Get banner movies (公开API，无需认证)
router.get('/banners', async (req, res) => {
  try {
    const [movies] = await pool.execute(`
      SELECT id, title, poster_path, backdrop_path, vote_average, release_date, overview
      FROM movies 
      WHERE is_banner = TRUE 
      ORDER BY banner_order ASC, popularity DESC
      LIMIT 5
    `);
    res.json({ success: true, data: movies });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Get all movies with pagination and filters
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { genre, sort, year, keyword } = req.query;

    const { movies, total, totalPages } = await Movie.findWithFilters({
      genre, sort, year, keyword, page, limit
    });

    res.json({
      success: true,
      data: {
        movies,
        pagination: { page, limit, total, totalPages }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Get popular movies
router.get('/popular', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const { movies, total, totalPages } = await Movie.findPopular(page, limit);

    res.json({
      success: true,
      data: {
        movies,
        pagination: { page, limit, total, totalPages }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Get trending movies
router.get('/trending', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const { movies } = await Movie.findTrending(page, limit);

    res.json({
      success: true,
      data: { movies, pagination: { page, limit } }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Search movies
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Search query is required' }
      });
    }

    const { movies, total, totalPages } = await Movie.findWithFilters({
      keyword: q, page, limit
    });

    res.json({
      success: true,
      data: {
        movies,
        pagination: { page, limit, total, totalPages }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Get movie recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const movieId = req.query.movieId ? parseInt(req.query.movieId) : null;
    const limitVal = parseInt(req.query.limit) || 10;

    let recommendations = [];

    // Get popular movies first
    const [popular] = await pool.query(
      `SELECT id, title, poster_path as posterPath, vote_average as voteAverage, 
              release_date as releaseDate, popularity
       FROM movies
       WHERE is_popular = 1
       ORDER BY vote_average DESC, popularity DESC
       LIMIT ?`,
      [limitVal]
    );
    recommendations = popular;

    // Transform to match expected format
    const formatted = recommendations.map(m => ({
      id: m.id,
      title: m.title,
      posterPath: m.posterPath || m.poster_path,
      voteAverage: m.voteAverage || m.vote_average,
      releaseDate: m.releaseDate || m.release_date,
      popularity: m.popularity
    }));

    res.json({
      success: true,
      data: { recommendations: formatted }
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Get movie by ID
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    
    if (!movie) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Movie not found' }
      });
    }

    res.json({ success: true, data: movie });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

module.exports = router;
