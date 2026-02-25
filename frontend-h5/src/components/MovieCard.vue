<template>
  <div class="movie-card" @click="goToDetail">
    <div class="poster-wrapper">
      <img 
        :src="posterUrl" 
        :alt="movie.title"
        class="poster"
        loading="lazy"
      >
      <div class="rating" v-if="movie.voteAverage">
        {{ Number(movie.voteAverage).toFixed(1) }}
      </div>
    </div>
    <h4 class="title">{{ movie.title }}</h4>
    <p class="info">{{ formatDate(movie.releaseDate) }}</p>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'MovieCard',
  props: {
    movie: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const router = useRouter()

    const posterUrl = computed(() => {
      return props.movie.posterPath 
        ? `https://image.tmdb.org/t/p/w342${props.movie.posterPath}`
        : '/placeholder.jpg'
    })

    const goToDetail = () => {
      router.push(`/movie/${props.movie.id}`)
    }

    const formatDate = (date) => {
      if (!date) return ''
      return new Date(date).getFullYear()
    }

    return {
      posterUrl,
      goToDetail,
      formatDate
    }
  }
}
</script>

<style scoped>
.movie-card {
  width: 100%;
  cursor: pointer;
  scroll-snap-align: start;
}

.poster-wrapper {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 2/3;
  margin-bottom: 8px;
}

.poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.movie-card:hover .poster {
  transform: scale(1.05);
}

.rating {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(229, 9, 20, 0.9);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.info {
  font-size: 12px;
  color: rgba(255,255,255,0.6);
}
</style>
