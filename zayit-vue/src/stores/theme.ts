import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

/**
 * Theme Store - Manages light/dark mode
 * 
 * Icon Theming (handled automatically in theme.css):
 * 
 * 1. For image files (PNG/SVG as <img>):
 *    <img src="icon.png" class="themed-icon" />
 *    - Automatically inverts in dark mode
 * 
 * 2. For inline SVGs:
 *    <svg><path d="..."/></svg>
 *    - Automatically uses currentColor (inherits text color)
 *    - No class needed
 */
export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  function applyTheme(){
    if (isDark.value){
        document.documentElement.classList.add('dark')
    } else {
        document.documentElement.classList.remove('dark')
    }
  }

  function toggleTheme() {
    isDark.value = !isDark.value
  }

  function setTheme(dark:boolean) {
    isDark.value = dark
  }

  watch(isDark, () => {
    applyTheme()
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  })

  applyTheme()

  return {
    isDark,
    toggleTheme,
    setTheme
  }
})
