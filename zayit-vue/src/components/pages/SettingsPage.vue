<template>
    <div class="settings-page">
        <div class="settings-content">
            <!-- Header Font -->
            <div class="setting-group">
                <label class="setting-label">גופן כותרות</label>
                <div class="custom-select"
                     @click="toggleHeaderDropdown"
                     tabindex="0">
                    <div class="select-display">{{ getDisplayName(headerFont) }}</div>
                    <div class="select-arrow">▼</div>
                    <div v-if="isHeaderDropdownOpen"
                         class="select-dropdown"
                         @click.stop>
                        <div v-for="font in availableFonts"
                             :key="font"
                             class="select-option"
                             :class="{ selected: headerFont.includes(font) }"
                             @click="selectHeaderFont(font)">
                            {{ font }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Text Font -->
            <div class="setting-group">
                <label class="setting-label">גופן טקסט</label>
                <div class="custom-select"
                     @click="toggleTextDropdown"
                     tabindex="0">
                    <div class="select-display">{{ getDisplayName(textFont) }}</div>
                    <div class="select-arrow">▼</div>
                    <div v-if="isTextDropdownOpen"
                         class="select-dropdown"
                         @click.stop>
                        <div v-for="font in availableFonts"
                             :key="font"
                             class="select-option"
                             :class="{ selected: textFont.includes(font) }"
                             @click="selectTextFont(font)">
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
                <input type="range"
                       v-model.number="fontSize"
                       @input="applySettings"
                       min="50"
                       max="200"
                       step="5"
                       class="setting-slider" />
            </div>

            <!-- Line Padding -->
            <div class="setting-group">
                <label class="setting-label">
                    ריווח שורות
                    <span class="setting-value">{{ linePadding }}em</span>
                </label>
                <input type="range"
                       v-model.number="linePadding"
                       @input="applySettings"
                       min="0"
                       max="2"
                       step="0.1"
                       class="setting-slider" />
            </div>

            <!-- Divine Name Censoring -->
            <div class="setting-group">
                <label class="setting-label">כיסוי שם ה'</label>
                <div class="theme-toggle">
                    <button :class="{ active: !censorDivineNames }"
                            @click="setCensorDivineNames(false)"
                            class="theme-option">
                        כתיב מלא
                    </button>
                    <button :class="{ active: censorDivineNames }"
                            @click="setCensorDivineNames(true)"
                            class="theme-option">
                        כיסוי (ה→ק)
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { hebrewFonts } from '../../data/hebrewFonts'

// Settings state
const headerFont = ref("'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif")
const textFont = ref("'Times New Roman', Times, serif")
const fontSize = ref(100)
const linePadding = ref(0.3)
const censorDivineNames = ref(false)
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

const toggleHeaderDropdown = () => {
    isHeaderDropdownOpen.value = !isHeaderDropdownOpen.value
    isTextDropdownOpen.value = false
}

const toggleTextDropdown = () => {
    isTextDropdownOpen.value = !isTextDropdownOpen.value
    isHeaderDropdownOpen.value = false
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

const setCensorDivineNames = (censor: boolean) => {
    censorDivineNames.value = censor
    localStorage.setItem('zayit-censor-divine-names', censor ? 'true' : 'false')
    applyCensoring()
}

const applyCensoring = () => {
    const lineViewers = document.querySelectorAll('.line-viewer')
    lineViewers.forEach(viewer => {
        if (censorDivineNames.value) {
            censorDivineNamesInElement(viewer as HTMLElement)
        }
    })
}

const censorDivineNamesInElement = (element: HTMLElement) => {
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null
    )

    const textNodes: Text[] = []
    let node: Node | null
    while ((node = walker.nextNode())) {
        textNodes.push(node as Text)
    }

    // Diacritics pattern: matches any Hebrew diacritic or cantillation mark
    const D = '[\\u0591-\\u05C7]*'

    // Patterns for divine names - capture groups preserve all diacritics
    const patterns = [
        // יהוה → יקוק - capture each letter with its diacritics separately
        {
            regex: new RegExp(`(י${D})(ה${D})(ו${D})(ה${D})`, 'g'),
            replacement: (match: string, yud: string, heh1: string, vav: string, heh2: string) => {
                return yud + heh1.replace('ה', 'ק') + vav + heh2.replace('ה', 'ק')
            }
        },
        // אדני → אדנ-י
        {
            regex: new RegExp(`(א${D})(ד${D})(נ${D})(י${D})`, 'g'),
            replacement: '$1$2$3-$4'
        },
        // אלהים → אלקים (but NOT אלהים אחרים)
        {
            regex: new RegExp(`(א${D})(ל${D})(ה${D})(י${D})(ם${D})(?!\\s*א${D}ח${D}ר${D}י${D}ם)`, 'g'),
            replacement: (match: string, alef: string, lamed: string, heh: string, yud: string, mem: string) => {
                return alef + lamed + heh.replace('ה', 'ק') + yud + mem
            }
        },
        // אלוהים → אלוקים (but NOT אלוהים אחרים)
        {
            regex: new RegExp(`(א${D})(ל${D})(ו${D})(ה${D})(י${D})(ם${D})(?!\\s*א${D}ח${D}ר${D}י${D}ם)`, 'g'),
            replacement: (match: string, alef: string, lamed: string, vav: string, heh: string, yud: string, mem: string) => {
                return alef + lamed + vav + heh.replace('ה', 'ק') + yud + mem
            }
        },
        // אלהי → אלקי
        {
            regex: new RegExp(`(א${D})(ל${D})(ה${D})(י${D})`, 'g'),
            replacement: (match: string, alef: string, lamed: string, heh: string, yud: string) => {
                return alef + lamed + heh.replace('ה', 'ק') + yud
            }
        },
        // אלוה → אלוק (not followed by י or ם)
        {
            regex: new RegExp(`(א${D})(ל${D})(ו${D})(ה${D})(?![יםא])`, 'g'),
            replacement: (match: string, alef: string, lamed: string, vav: string, heh: string) => {
                return alef + lamed + vav + heh.replace('ה', 'ק')
            }
        },
    ]

    textNodes.forEach((textNode) => {
        if (!textNode.nodeValue) return
        let text = textNode.nodeValue

        patterns.forEach(({ regex, replacement }) => {
            if (typeof replacement === 'function') {
                text = text.replace(regex, replacement)
            } else {
                text = text.replace(regex, replacement)
            }
        })

        textNode.nodeValue = text
    })
}

const applySettings = () => {
    localStorage.setItem('zayit-settings', JSON.stringify({
        headerFont: headerFont.value,
        textFont: textFont.value,
        fontSize: fontSize.value,
        linePadding: linePadding.value,
        censorDivineNames: censorDivineNames.value
    }))

    // Apply font size to line viewer
    const lineViewers = document.querySelectorAll('.line-viewer')
    lineViewers.forEach(viewer => {
        (viewer as HTMLElement).style.fontSize = `${fontSize.value}%`
    })

    // Apply line padding to all book lines
    const lines = document.querySelectorAll('.book-line')
    lines.forEach(line => {
        if (line instanceof HTMLElement) {
            line.style.paddingBlockStart = `${linePadding.value}em`
            line.style.paddingBlockEnd = `${linePadding.value}em`
        }
    })

    // Apply fonts via CSS custom properties
    document.documentElement.style.setProperty('--header-font', headerFont.value)
    document.documentElement.style.setProperty('--text-font', textFont.value)
}

onMounted(() => {
    // Detect available fonts
    detectFonts()

    const savedSettings = localStorage.getItem('zayit-settings')
    if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings)
            headerFont.value = settings.headerFont || headerFont.value
            textFont.value = settings.textFont || textFont.value
            fontSize.value = settings.fontSize || fontSize.value
            linePadding.value = settings.linePadding || linePadding.value
            if (settings.censorDivineNames !== undefined) {
                censorDivineNames.value = settings.censorDivineNames
            }
        } catch (e) {
            console.error('Failed to parse settings:', e)
        }
    }
    applySettings()
    applyCensoring()
})

    // Expose function globally for use after book loads
    ; (window as any).applyZayitSettings = () => {
        const savedSettings = localStorage.getItem('zayit-settings')
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings)

                // Apply font size
                const lineViewers = document.querySelectorAll('.line-viewer')
                lineViewers.forEach(viewer => {
                    (viewer as HTMLElement).style.fontSize = `${settings.fontSize || 100}%`
                })

                // Apply line padding
                const lines = document.querySelectorAll('.book-line')
                lines.forEach(line => {
                    if (line instanceof HTMLElement) {
                        line.style.paddingBlockStart = `${settings.linePadding || 0.3}em`
                        line.style.paddingBlockEnd = `${settings.linePadding || 0.3}em`
                    }
                })

                // Apply censoring if enabled
                const savedCensoring = localStorage.getItem('zayit-censor-divine-names')
                if (savedCensoring === 'true') {
                    lineViewers.forEach(viewer => {
                        censorDivineNamesInElement(viewer as HTMLElement)
                    })
                }
            } catch (e) {
                console.error('Failed to apply settings:', e)
            }
        }
    }

watch([headerFont, textFont, fontSize, linePadding], () => {
    applySettings()
})
</script>

<style scoped>
.settings-page {
    background: var(--bg-primary);
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.settings-content {
    padding: 20px;
    overflow-y: auto;
    direction: rtl;
}

.setting-group {
    margin-bottom: 24px;
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

.select-display {
    flex: 1;
    color: var(--text-primary);
    font-size: 14px;
}

.select-arrow {
    font-size: 10px;
    color: var(--text-secondary);
    margin-left: 8px;
}

.select-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 1001;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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

.setting-slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    background: var(--accent-color);
    border-radius: 50%;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
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
