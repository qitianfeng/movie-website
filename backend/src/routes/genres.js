const express = require('express');
const Genre = require('../models/Genre');
const Movie = require('../models/Movie');

const router = express.Router();

// Get all genres
router.get('/', async (req, res) => {
  try {
    const genres = await Genre.findAll();
    res.json({ success: true, data: genres });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Get movies by genre
router.get('/:id/movies', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const { movies, total, totalPages } = await Movie.findWithFilters({
      genre: req.params.id, page, limit
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

module.exports = router;
