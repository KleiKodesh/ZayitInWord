<template>
  <button 
  @click.stop="toggleTheme" class="theme-toggle" title="מצב כהה / בהיר">
    <theme-icon/>
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ThemeIcon from './icons/ThemeIcon.vue'

const isDark = ref(false)

const toggleTheme = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  isDark.value = savedTheme === 'dark'
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  }
})
</script>

<style scoped>

</style>
