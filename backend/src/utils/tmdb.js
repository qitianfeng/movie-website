const axios = require('axios');
const tunnel = require('tunnel');

const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_PROXY = process.env.TMDB_PROXY || 'http://127.0.0.1:7890';

if (!TMDB_API_KEY) {
  console.warn('Warning: TMDB_API_KEY not set. TMDB integration will not work.');
}

// 解析代理地址
const proxyUrl = new URL(TMDB_PROXY);
const proxyConfig = {
  host: proxyUrl.hostname,
  port: parseInt(proxyUrl.port),
  proxyAuth: proxyUrl.username && proxyUrl.password 
    ? `${proxyUrl.username}:${proxyUrl.password}` 
    : undefined
};

// 创建 HTTPS Agent 使用 tunnel
const httpsAgent = tunnel.httpsOverHttp({
  proxy: proxyConfig
});

console.log(`[TMDB] Using proxy: ${proxyConfig.host}:${proxyConfig.port}`);

const tmdbClient = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
    language: 'zh-CN'
  },
  httpsAgent: httpsAgent,
  proxy: false,
  timeout: 60000
});

class TMDBService {
  async getPopularMovies(page = 1) {
    try {
      console.log(`[TMDB] Fetching popular movies page ${page}...`);
      const response = await tmdbClient.get('/movie/popular', {
        params: { page }
      });
      console.log(`[TMDB] Got ${response.data.results?.length || 0} movies`);
      return response.data;
    } catch (error) {
      console.error('TMDB getPopularMovies error:', error.message);
      throw error;
    }
  }

  async getTrendingMovies(timeWindow = 'week', page = 1) {
    try {
      console.log(`[TMDB] Fetching trending movies...`);
      const response = await tmdbClient.get(`/trending/movie/${timeWindow}`, {
        params: { page }
      });
      return response.data;
    } catch (error) {
      console.error('TMDB getTrendingMovies error:', error.message);
      throw error;
    }
  }

  async getMovieDetails(movieId) {
    try {
      console.log(`[TMDB] Fetching movie ${movieId} details...`);
      const response = await tmdbClient.get(`/movie/${movieId}`, {
        params: {
          append_to_response: 'credits,videos,images'
        }
      });
      return response.data;
    } catch (error) {
      console.error('TMDB getMovieDetails error:', error.message);
      throw error;
    }
  }

  async searchMovies(query, page = 1) {
    try {
      const response = await tmdbClient.get('/search/movie', {
        params: { query, page }
      });
      return response.data;
    } catch (error) {
      console.error('TMDB searchMovies error:', error.message);
      throw error;
    }
  }

  async getGenres() {
    try {
      console.log('[TMDB] Fetching genres...');
      const response = await tmdbClient.get('/genre/movie/list');
      console.log(`[TMDB] Got ${response.data.genres?.length || 0} genres`);
      return response.data;
    } catch (error) {
      console.error('TMDB getGenres error:', error.message);
      throw error;
    }
  }

  async getMoviesByGenre(genreId, page = 1) {
    try {
      const response = await tmdbClient.get('/discover/movie', {
        params: {
          with_genres: genreId,
          page,
          sort_by: 'popularity.desc'
        }
      });
      return response.data;
    } catch (error) {
      console.error('TMDB getMoviesByGenre error:', error.message);
      throw error;
    }
  }

  // 获取正在上映的电影
  async getNowPlaying(page = 1) {
    try {
      console.log('[TMDB] Fetching now playing movies...');
      const response = await tmdbClient.get('/movie/now_playing', {
        params: { page }
      });
      console.log(`[TMDB] Got ${response.data.results?.length || 0} now playing movies`);
      return response.data;
    } catch (error) {
      console.error('TMDB getNowPlaying error:', error.message);
      throw error;
    }
  }

  // 获取即将上映的电影
  async getUpcoming(page = 1) {
    try {
      console.log('[TMDB] Fetching upcoming movies...');
      const response = await tmdbClient.get('/movie/upcoming', {
        params: { page }
      });
      console.log(`[TMDB] Got ${response.data.results?.length || 0} upcoming movies`);
      return response.data;
    } catch (error) {
      console.error('TMDB getUpcoming error:', error.message);
      throw error;
    }
  }

  transformMovie(tmdbMovie) {
    return {
      tmdbId: tmdbMovie.id,
      title: tmdbMovie.title,
      originalTitle: tmdbMovie.original_title,
      overview: tmdbMovie.overview,
      posterPath: tmdbMovie.poster_path,
      backdropPath: tmdbMovie.backdrop_path,
      releaseDate: tmdbMovie.release_date ? new Date(tmdbMovie.release_date) : null,
      runtime: tmdbMovie.runtime,
      genres: tmdbMovie.genres || [],
      voteAverage: tmdbMovie.vote_average,
      voteCount: tmdbMovie.vote_count,
      popularity: tmdbMovie.popularity,
      originalLanguage: tmdbMovie.original_language,
      cast: tmdbMovie.credits?.cast?.slice(0, 10).map(c => ({
        id: c.id,
        name: c.name,
        character: c.character,
        profilePath: c.profile_path,
        order: c.order
      })) || [],
      crew: tmdbMovie.credits?.crew?.slice(0, 5).map(c => ({
        id: c.id,
        name: c.name,
        job: c.job,
        department: c.department
      })) || [],
      videos: tmdbMovie.videos?.results?.filter(v => v.site === 'YouTube').map(v => ({
        key: v.key,
        name: v.name,
        site: v.site,
        type: v.type
      })) || []
    };
  }
}

module.exports = new TMDBService();
