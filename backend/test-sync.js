require('dotenv').config();
const tmdbService = require('./src/utils/tmdb');
const Movie = require('./src/models/Movie');
const { pool } = require('./src/config/database');

async function test() {
  try {
    console.log('1. Testing TMDB...');
    const data = await tmdbService.getPopularMovies(1);
    console.log('Got', data.results.length, 'movies');
    
    const movieData = data.results[0];
    console.log('2. Getting details for:', movieData.title, 'ID:', movieData.id);
    
    const details = await tmdbService.getMovieDetails(movieData.id);
    console.log('Details got:', details.title);
    
    const transformed = tmdbService.transformMovie(details);
    console.log('3. Transformed:', transformed.title);
    
    console.log('4. Checking if exists...');
    const existing = await Movie.findByTmdbId(transformed.tmdbId);
    console.log('Existing:', existing);
    
    if (!existing) {
      console.log('5. Creating new movie...');
      const movieId = await Movie.create({ ...transformed, isPopular: true });
      console.log('Created with ID:', movieId);
    } else {
      console.log('Movie already exists with ID:', existing.id);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
  
  await pool.end();
  process.exit(0);
}

test();
