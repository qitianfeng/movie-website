import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
})

export const useMovieStore = defineStore('movie', {
  state: () => ({
    movies: [],
    currentMovie: null,
    genres: [],
    popularMovies: [],
    trendingMovies: [],
    searchResults: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      totalPages: 1
    }
  }),

  actions: {
    async fetchMovies(params = {}) {
      this.loading = true
      try {
        const response = await api.get('/movies', { params })
        this.movies = response.data.data.movies
        this.pagination = response.data.data.pagination
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async fetchPopularMovies() {
      this.loading = true
      try {
        const response = await api.get('/movies/popular')
        this.popularMovies = response.data.data.movies
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async fetchTrendingMovies() {
      this.loading = true
      try {
        const response = await api.get('/movies/trending')
        this.trendingMovies = response.data.data.movies
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async fetchMovieDetail(id) {
      this.loading = true
      try {
        const response = await api.get(`/movies/${id}`)
        this.currentMovie = response.data.data
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async fetchGenres() {
      try {
        const response = await api.get('/genres')
        this.genres = response.data.data
      } catch (error) {
        this.error = error.message
      }
    },

    async searchMovies(query) {
      this.loading = true
      try {
        const response = await api.get('/movies/search', {
          params: { q: query }
        })
        this.searchResults = response.data.data.movies
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    }
  }
})
