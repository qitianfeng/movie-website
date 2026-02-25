require('dotenv').config();
const tmdbService = require('./src/utils/tmdb');

async function test() {
  try {
    console.log('Testing TMDB service...');
    const data = await tmdbService.getPopularMovies(1);
    console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500));
    console.log('Results count:', data?.results?.length);
    if (data?.results?.[0]) {
      console.log('First movie:', data.results[0].title);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

test();
