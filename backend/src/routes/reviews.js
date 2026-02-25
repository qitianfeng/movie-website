const express = require('express');
const Review = require('../models/Review');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get reviews for a movie
router.get('/movie/:movieId', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const { reviews, total } = await Review.findByMovieId(req.params.movieId, page, limit);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
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

// Add review
router.post('/', auth, async (req, res) => {
  try {
    const { movieId, rating, content } = req.body;

    const reviewId = await Review.create({
      movieId,
      userId: req.userId,
      rating,
      content
    });

    const review = await Review.findById(reviewId);

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Update review
router.put('/:id', auth, async (req, res) => {
  try {
    const { rating, content } = req.body;
    
    const review = await Review.findById(req.params.id);
    if (!review || review.user_id !== req.userId) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' }
      });
    }

    await Review.update(req.params.id, { rating, content });
    const updated = await Review.findById(req.params.id);

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Delete review
router.delete('/:id', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review || review.user_id !== req.userId) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' }
      });
    }

    await Review.delete(req.params.id);
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

module.exports = router;
