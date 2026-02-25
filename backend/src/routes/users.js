const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Review = require('../models/Review');

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }

    // Get favorite movies details
    const favoriteMovies = [];
    for (const movieId of user.favorites.slice(0, 20)) {
      const movie = await Movie.findById(movieId);
      if (movie) {
        favoriteMovies.push({
          id: movie.id,
          title: movie.title,
          posterPath: movie.poster_path,
          voteAverage: movie.vote_average
        });
      }
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        favorites: favoriteMovies,
        watchlist: user.watchlist
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Add to favorites
router.post('/favorites', auth, async (req, res) => {
  try {
    const { movieId } = req.body;
    await User.addFavorite(req.userId, movieId);

    res.json({ success: true, message: 'Added to favorites' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Remove from favorites
router.delete('/favorites/:movieId', auth, async (req, res) => {
  try {
    await User.removeFavorite(req.userId, req.params.movieId);

    res.json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Add to watchlist
router.post('/watchlist', auth, async (req, res) => {
  try {
    const { movieId } = req.body;
    await User.addToWatchlist(req.userId, movieId);

    res.json({ success: true, message: 'Added to watchlist' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Remove from watchlist
router.delete('/watchlist/:movieId', auth, async (req, res) => {
  try {
    await User.removeFromWatchlist(req.userId, req.params.movieId);

    res.json({ success: true, message: 'Removed from watchlist' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { avatar } = req.body;
    await User.updateProfile(req.userId, { avatar });
    
    const user = await User.findById(req.userId);
    res.json({ 
      success: true, 
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Change password
router.put('/password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    const user = await User.findByEmail(req.userEmail || '');
    if (!user) {
      // Get user by ID instead
      const [rows] = await require('../config/database').pool.execute(
        `SELECT * FROM users WHERE id = ?`, [req.userId]
      );
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' }
        });
      }
      const fullUser = rows[0];
      
      const isMatch = await User.comparePassword(fullUser, oldPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_PASSWORD', message: 'Old password is incorrect' }
        });
      }
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await require('../config/database').pool.execute(
        `UPDATE users SET password = ? WHERE id = ?`, [hashedPassword, req.userId]
      );
    }
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Get user's reviews
router.get('/reviews', auth, async (req, res) => {
  try {
    const reviews = await Review.findByUserId(req.userId);
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

module.exports = router;
