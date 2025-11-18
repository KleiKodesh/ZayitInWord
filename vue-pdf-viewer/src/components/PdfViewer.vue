<template>
  <div class="pdf-viewer" ref="containerRef">
    <canvas ref="canvasRef" class="pdf-canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'

const props = defineProps<{
  src: string
  initialPage?: number
}>()

const containerRef = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()
let pdfDoc: any = null
let currentPage = ref(props.initialPage || 1)
let rendering = false

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

onMounted(async () => {
  await loadPdf()
  window.addEventListener('wheel', handleScroll, { passive: false })
})

onUnmounted(() => {
  window.removeEventListener('wheel', handleScroll)
})

async function loadPdf() {
  try {
    // Fetch the blob URL and convert to ArrayBuffer
    const response = await fetch(props.src)
    const arrayBuffer = await response.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    pdfDoc = await loadingTask.promise
    await renderPage(currentPage.value)
  } catch (error) {
    console.error('Error loading PDF:', error)
  }
}

async function renderPage(pageNum: number) {
  if (!pdfDoc || rendering) return
  
  rendering = true
  
  try {
    const page = await pdfDoc.getPage(pageNum)
    const canvas = canvasRef.value
    if (!canvas) return
    
    const context = canvas.getContext('2d')
    if (!context) return
    
    const container = containerRef.value
    if (!container) return
    
    const containerWidth = container.clientWidth
    const viewport = page.getViewport({ scale: 1 })
    const scale = containerWidth / viewport.width
    const scaledViewport = page.getViewport({ scale })
    
    canvas.height = scaledViewport.height
    canvas.width = scaledViewport.width
    
    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport
    }
    
    await page.render(renderContext).promise
  } catch (error) {
    console.error('Error rendering page:', error)
  } finally {
    rendering = false
  }
}

function handleScroll(e: WheelEvent) {
  if (!pdfDoc) return
  
  if (e.deltaY > 0) {
    // Scroll down - next page
    if (currentPage.value < pdfDoc.numPages) {
      currentPage.value++
      renderPage(currentPage.value)
      e.preventDefault()
    }
  } else {
    // Scroll up - previous page
    if (currentPage.value > 1) {
      currentPage.value--
      renderPage(currentPage.value)
      e.preventDefault()
    }
  }
}

watch(() => props.src, () => {
  loadPdf()
})

</script>

<style scoped>
.pdf-viewer {
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: #525252;
  padding: 20px;
}

.pdf-canvas {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  background: white;
}
</style>
