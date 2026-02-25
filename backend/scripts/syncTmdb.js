const Movie = require('../src/models/Movie');
const Genre = require('../src/models/Genre');
const tmdbService = require('../src/utils/tmdb');
require('dotenv').config();

// Connect to database
const connectDB = require('../src/config/database');

// Sync genres from TMDB
const syncGenres = async () => {
  console.log('🔄 Syncing genres from TMDB...');
  
  try {
    const data = await tmdbService.getGenres();
    
    for (const genre of data.genres) {
      await Genre.findOneAndUpdate(
        { id: genre.id },
        {
          id: genre.id,
          name: genre.name,
          nameEn: genre.name
        },
        { upsert: true, new: true }
      );
    }
    
    console.log(`✅ Synced ${data.genres.length} genres`);
  } catch (error) {
    console.error('❌ Error syncing genres:', error.message);
  }
};

// Sync popular movies
const syncPopularMovies = async (pages = 5) => {
  console.log(`🔄 Syncing popular movies (${pages} pages)...`);
  
  let syncedCount = 0;
  
  for (let page = 1; page <= pages; page++) {
    try {
      console.log(`  Fetching page ${page}...`);
      const data = await tmdbService.getPopularMovies(page);
      
      for (const movieData of data.results) {
        try {
          // Get full movie details
          const details = await tmdbService.getMovieDetails(movieData.id);
          const transformed = tmdbService.transformMovie(details);
          
          await Movie.findOneAndUpdate(
            { tmdbId: transformed.tmdbId },
            { ...transformed, isPopular: true },
            { upsert: true, new: true }
          );
          
          syncedCount++;
          process.stdout.write(`\r  Progress: ${syncedCount} movies synced`);
        } catch (err) {
          console.error(`\n  Error syncing movie ${movieData.id}:`, err.message);
        }
      }
      
      // Rate limiting - wait 1 second between pages
      if (page < pages) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`\n  Error fetching page ${page}:`, error.message);
    }
  }
  
  console.log(`\n✅ Synced ${syncedCount} popular movies`);
};

// Sync trending movies
const syncTrendingMovies = async (timeWindow = 'week', pages = 3) => {
  console.log(`🔄 Syncing trending movies (${timeWindow}, ${pages} pages)...`);
  
  let syncedCount = 0;
  
  for (let page = 1; page <= pages; page++) {
    try {
      console.log(`  Fetching page ${page}...`);
      const data = await tmdbService.getTrendingMovies(timeWindow, page);
      
      for (const movieData of data.results) {
        try {
          const existing = await Movie.findOne({ tmdbId: movieData.id });
          
          if (existing) {
            // Update existing movie
            existing.isTrending = true;
            await existing.save();
            syncedCount++;
          } else {
            // Fetch full details and create new
            const details = await tmdbService.getMovieDetails(movieData.id);
            const transformed = tmdbService.transformMovie(details);
            
            await Movie.create({
              ...transformed,
              isTrending: true
            });
            syncedCount++;
          }
          
          process.stdout.write(`\r  Progress: ${syncedCount} movies synced`);
        } catch (err) {
          console.error(`\n  Error syncing movie ${movieData.id}:`, err.message);
        }
      }
      
      if (page < pages) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`\n  Error fetching page ${page}:`, error.message);
    }
  }
  
  console.log(`\n✅ Synced ${syncedCount} trending movies`);
};

// Main sync function
const syncAll = async () => {
  console.log('🚀 Starting TMDB sync...\n');
  
  try {
    await connectDB();
    console.log('✅ Database connected\n');
    
    // Sync genres first
    await syncGenres();
    console.log('');
    
    // Sync popular movies
    await syncPopularMovies(3);
    console.log('');
    
    // Sync trending movies
    await syncTrendingMovies('week', 2);
    console.log('');
    
    console.log('🎉 Sync completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  syncAll();
}

module.exports = {
  syncGenres,
  syncPopularMovies,
  syncTrendingMovies,
  syncAll
};
