<template>
  <div v-if="isOpen" class="settings-overlay" @click="handleOverlayClick">
    <div class="settings-pane" @click.stop>
      <div class="settings-header">
        <button class="close-btn" @click="close">×</button>
        <button class="about-btn" @click="openAbout">
          אודות
          <svg class="about-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
            <path d="M8 7V12M8 5V5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
        <h2>הגדרות</h2>
      </div>

      <div class="settings-content">
        <!-- Theme Setting -->
        <div class="setting-group">
          <label class="setting-label">ערכת נושא</label>
          <div class="theme-toggle">
            <button 
              :class="{ active: !isDark }" 
              @click="setTheme(false)"
              class="theme-option"
            >
              בהיר
            </button>
            <button 
              :class="{ active: isDark }" 
              @click="setTheme(true)"
              class="theme-option"
            >
              כהה
            </button>
          </div>
        </div>

        <!-- Header Font -->
        <div class="setting-group">
          <label class="setting-label">גופן כותרות</label>
          <div class="custom-select" @click="toggleHeaderDropdown" tabindex="0">
            <div class="select-display">{{ getDisplayName(headerFont) }}</div>
            <div class="select-arrow">▼</div>
            <div v-if="isHeaderDropdownOpen" class="select-dropdown" @click.stop>
              <div 
                v-for="font in availableFonts" 
                :key="font" 
                class="select-option"
                :class="{ selected: headerFont.includes(font) }"
                @click="selectHeaderFont(font)"
              >
                {{ font }}
              </div>
            </div>
          </div>
        </div>

        <!-- Text Font -->
        <div class="setting-group">
          <label class="setting-label">גופן טקסט</label>
          <div class="custom-select" @click="toggleTextDropdown" tabindex="0">
            <div class="select-display">{{ getDisplayName(textFont) }}</div>
            <div class="select-arrow">▼</div>
            <div v-if="isTextDropdownOpen" class="select-dropdown" @click.stop>
              <div 
                v-for="font in availableFonts" 
                :key="font" 
                class="select-option"
                :class="{ selected: textFont.includes(font) }"
                @click="selectTextFont(font)"
              >
                {{ font }}
              </div>
            </div>
          </div>
        </div>

        <!-- Font Size -->
        <div class="setting-group">
          <label class="setting-label">
            גודל גופן
            <span class="setting-value">{{ fontSize }}%</span>
          </label>
          <input 
            type="range" 
            v-model.number="fontSize" 
            @input="applySettings"
            min="50" 
            max="200" 
            step="5"
            class="setting-slider"
          />
        </div>

        <!-- Line Padding -->
        <div class="setting-group">
          <label class="setting-label">
            ריווח שורות
            <span class="setting-value">{{ linePadding }}em</span>
          </label>
          <input 
            type="range" 
            v-model.number="linePadding" 
            @input="applySettings"
            min="0" 
            max="2" 
            step="0.1"
            class="setting-slider"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { hebrewFonts } from '../data/hebrewFonts'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  openAbout: []
}>()

// Settings state
const isDark = ref(false)
const headerFont = ref("'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif")
const textFont = ref("'Times New Roman', Times, serif")
const fontSize = ref(100)
const linePadding = ref(0.3)
const availableFonts = ref<string[]>([])
const isHeaderDropdownOpen = ref(false)
const isTextDropdownOpen = ref(false)

// Use imported font list
const fontsToCheck = hebrewFonts

// Function to check if a font is available
const isFontAvailable = (fontName: string): boolean => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return false

  const testString = 'אבגדהוזחטיכלמנסעפצקרשת'
  const baseFonts = ['monospace', 'sans-serif', 'serif']
  
  const testFont = (font: string, baseFont: string) => {
    context.font = `72px ${baseFont}`
    const baseWidth = context.measureText(testString).width
    
    context.font = `72px '${font}', ${baseFont}`
    const fontWidth = context.measureText(testString).width
    
    return baseWidth !== fontWidth
  }

  return baseFonts.some(baseFont => testFont(fontName, baseFont))
}

// Detect available fonts
const detectFonts = () => {
  const detected: string[] = []
  for (const font of fontsToCheck) {
    if (isFontAvailable(font)) {
      detected.push(font)
    }
  }
  availableFonts.value = detected.length > 0 ? detected : fontsToCheck
}

const close = () => emit('close')

const handleOverlayClick = () => {
  close()
}

const openAbout = () => {
  emit('openAbout')
}

const toggleHeaderDropdown = (event: MouseEvent) => {
  isHeaderDropdownOpen.value = !isHeaderDropdownOpen.value
  isTextDropdownOpen.value = false
  
  if (isHeaderDropdownOpen.value) {
    positionDropdown(event.currentTarget as HTMLElement, '.select-dropdown')
  }
}

const toggleTextDropdown = (event: MouseEvent) => {
  isTextDropdownOpen.value = !isTextDropdownOpen.value
  isHeaderDropdownOpen.value = false
  
  if (isTextDropdownOpen.value) {
    positionDropdown(event.currentTarget as HTMLElement, '.select-dropdown')
  }
}

const positionDropdown = (selectElement: HTMLElement, dropdownSelector: string) => {
  setTimeout(() => {
    const dropdown = selectElement.querySelector(dropdownSelector) as HTMLElement
    if (!dropdown) return
    
    const rect = selectElement.getBoundingClientRect()
    const padding = 20 // padding from viewport edge
    const spaceBelow = window.innerHeight - rect.bottom - padding
    const spaceAbove = rect.top - padding
    
    // Determine position and max height
    if (spaceBelow >= 200) {
      // Open downward
      dropdown.style.top = `${rect.bottom + 4}px`
      dropdown.style.bottom = 'auto'
      dropdown.style.maxHeight = `${spaceBelow - 4}px`
    } else if (spaceAbove >= 200) {
      // Open upward
      dropdown.style.top = 'auto'
      dropdown.style.bottom = `${window.innerHeight - rect.top + 4}px`
      dropdown.style.maxHeight = `${spaceAbove - 4}px`
    } else {
      // Use whichever has more space
      if (spaceBelow > spaceAbove) {
        dropdown.style.top = `${rect.bottom + 4}px`
        dropdown.style.bottom = 'auto'
        dropdown.style.maxHeight = `${spaceBelow - 4}px`
      } else {
        dropdown.style.top = 'auto'
        dropdown.style.bottom = `${window.innerHeight - rect.top + 4}px`
        dropdown.style.maxHeight = `${spaceAbove - 4}px`
      }
    }
    
    dropdown.style.left = `${rect.left}px`
    dropdown.style.width = `${rect.width}px`
  }, 0)
}

const selectHeaderFont = (font: string) => {
  headerFont.value = `'${font}', sans-serif`
  isHeaderDropdownOpen.value = false
  applySettings()
}

const selectTextFont = (font: string) => {
  textFont.value = `'${font}', serif`
  isTextDropdownOpen.value = false
  applySettings()
}

const getDisplayName = (fontValue: string): string => {
  const match = fontValue.match(/'([^']+)'/)
  return match && match[1] ? match[1] : fontValue
}

const setTheme = (dark: boolean) => {
  isDark.value = dark
  document.documentElement.classList.toggle('dark', dark)
  localStorage.setItem('zayit-theme', dark ? 'dark' : 'light')
}

const applySettings = () => {
  // Save to localStorage
  localStorage.setItem('zayit-settings', JSON.stringify({
    headerFont: headerFont.value,
    textFont: textFont.value,
    fontSize: fontSize.value,
    linePadding: linePadding.value
  }))

  // Apply font size to all content containers
  const contentContainers = document.querySelectorAll('.content-container')
  contentContainers.forEach(container => {
    (container as HTMLElement).style.fontSize = `${fontSize.value}%`
  })

  // Apply line padding to all line elements
  const lines = document.querySelectorAll('line')
  lines.forEach(line => {
    if (line instanceof HTMLElement) {
      line.style.paddingBlockStart = `${linePadding.value}em`
    }
  })

  // Apply fonts via CSS custom properties
  document.documentElement.style.setProperty('--header-font', headerFont.value)
  document.documentElement.style.setProperty('--text-font', textFont.value)
}

// Load settings on mount
onMounted(() => {
  // Detect available fonts
  detectFonts()

  // Load theme
  const savedTheme = localStorage.getItem('zayit-theme')
  isDark.value = savedTheme === 'dark'

  // Load other settings
  const savedSettings = localStorage.getItem('zayit-settings')
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings)
      headerFont.value = settings.headerFont || headerFont.value
      textFont.value = settings.textFont || textFont.value
      fontSize.value = settings.fontSize || fontSize.value
      linePadding.value = settings.linePadding || linePadding.value
    } catch (e) {
      console.error('Failed to parse settings:', e)
    }
  }

  // Apply settings immediately
  applySettings()
})

// Watch for settings changes
watch([headerFont, textFont, fontSize, linePadding], () => {
  applySettings()
})
</script>

<style scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-primary);
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.settings-pane {
  background: var(--bg-primary);
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.settings-header {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
  min-height: 40px;
  flex-shrink: 0;
  gap: 8px;
}

.settings-header h2 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
  text-align: right;
  line-height: 1;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  color: var(--text-secondary);
  cursor: pointer;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
  line-height: 1;
  padding: 0;
  flex-shrink: 0;
}

.close-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.about-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  font-size: 12px;
  color: var(--text-primary);
  cursor: pointer;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  flex-shrink: 0;
  height: 28px;
  line-height: 1;
}

.about-btn:hover {
  background: var(--hover-bg);
  border-color: var(--accent-color);
  color: var(--accent-color);
}

.about-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.settings-content {
  padding: 20px;
  overflow-y: auto;
  direction: rtl;
}

.setting-group {
  margin-bottom: 24px;
}

.setting-group:last-child {
  margin-bottom: 0;
}

.setting-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.setting-value {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 400;
}

.custom-select {
  position: relative;
  width: 100%;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  direction: rtl;
  height: 38px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  user-select: none;
}

.custom-select:hover {
  border-color: var(--accent-color);
}

.custom-select:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-bg);
}

.select-display {
  flex: 1;
  color: var(--text-primary);
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-arrow {
  font-size: 10px;
  color: var(--text-secondary);
  margin-left: 8px;
  flex-shrink: 0;
}

.select-dropdown {
  position: fixed;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow-y: auto;
  z-index: 1001;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 200px;
}

.select-option {
  padding: 8px 12px;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.1s ease;
}

.select-option:hover {
  background: var(--hover-bg);
}

.select-option.selected {
  background: var(--accent-bg);
  color: var(--accent-color);
  font-weight: 500;
}

.setting-slider {
  width: 100%;
  height: 6px;
  background: var(--bg-secondary);
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.setting-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: var(--accent-color);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.setting-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.setting-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: var(--accent-color);
  border-radius: 50%;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.setting-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
}

.theme-toggle {
  display: flex;
  gap: 8px;
}

.theme-option {
  flex: 1;
  padding: 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-option:hover {
  background: var(--hover-bg);
  border-color: var(--accent-color);
}

.theme-option.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}
</style>
