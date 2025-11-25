<template>
  <div v-if="showLoading" class="loading-container">
      <BookIcon class="book-icon" />
      <span v-if="message" class="loading-message">{{ message }}</span>
      <div class="loading-dots">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BookIcon from '../icons/BookIcon.vue'

const props = withDefaults(defineProps<{
  message?: string
  delay?: number
}>(), {
  message: 'טוען',
  delay: 300
})

const showLoading = ref(false)

onMounted(() => {
  setTimeout(() => {
    showLoading.value = true
  }, props.delay)
})
</script>

<style scoped>
/* Loading animation container - centered vertically and horizontally */
.loading-container {
  display: flex; /* Flexbox layout */
  flex-direction: column; /* Stack items vertically */
  align-items: center; /* Center horizontally */
  justify-content: center; /* Center vertically */
  gap: 16px; /* Space between icon, message, and dots */
  height: 100%; /* Fill parent height */
  width: 100%; /* Fill parent width */
  font-weight: 600; /* Bold text for loading message */
}

/* Book icon with pulse animation */
.book-icon {
  width: 3rem; /* Icon width */
  height: 3rem; /* Icon height */
  color: var(--accent-color); /* Use accent color */
  animation: pulse 1.5s ease-in-out infinite; /* Continuous pulsing animation */
}

/* Container for animated dots */
.loading-dots {
  display: flex; /* Horizontal layout */
  gap: 0.5rem; /* Space between dots */
}

/* Individual animated dot */
.dot {
  width: 0.75rem; /* Dot width */
  height: 0.75rem; /* Dot height */
  border-radius: 50%; /* Make it circular */
  background: var(--accent-color); /* Use accent color */
  animation: bounce 1.4s ease-in-out infinite; /* Continuous bouncing animation */
}

/* Second dot - delayed animation for wave effect */
.dot:nth-child(2) {
  animation-delay: 0.2s; /* Start animation 0.2s later */
}

/* Third dot - more delayed animation for wave effect */
.dot:nth-child(3) {
  animation-delay: 0.4s; /* Start animation 0.4s later */
}

/* Pulse animation for book icon - fade and scale */
@keyframes pulse {
  0%, 100% {
    opacity: 0.4; /* Faded at start and end */
    transform: scale(1); /* Normal size */
  }
  50% {
    opacity: 1; /* Fully visible at middle */
    transform: scale(1.1); /* Slightly larger */
  }
}

/* Bounce animation for dots - scale up and down */
@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0); /* Invisible/tiny at start, near end, and end */
    opacity: 0.5; /* Semi-transparent */
  }
  40% {
    transform: scale(1); /* Full size at middle */
    opacity: 1; /* Fully visible */
  }
}
</style>
