<template>
  <div v-if="showMonitor" class="performance-monitor">
    <div class="monitor-header">
      <h3>성능 모니터</h3>
      <button @click="toggleMonitor" class="close-btn">×</button>
    </div>
    <div class="monitor-content">
      <div class="metric">
        <span class="label">메모리 사용량:</span>
        <span class="value">{{ memoryUsage.used }}MB / {{ memoryUsage.total }}MB</span>
      </div>
      <div class="metric">
        <span class="label">네트워크:</span>
        <span class="value">{{ networkInfo.effectiveType }} ({{ networkInfo.downlink }}Mbps)</span>
      </div>
      <div class="metric">
        <span class="label">페이지 로드 시간:</span>
        <span class="value">{{ pageLoadTime }}ms</span>
      </div>
      <div class="metric">
        <span class="label">FPS:</span>
        <span class="value">{{ fps }}</span>
      </div>
    </div>
  </div>
  <button v-else @click="toggleMonitor" class="monitor-toggle">📊</button>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getMemoryUsage, getNetworkInfo } from '@/utils/performance'

const showMonitor = ref(false)
const memoryUsage = ref({ used: 0, total: 0, limit: 0 })
const networkInfo = ref({ effectiveType: 'unknown', downlink: 0, rtt: 0 })
const pageLoadTime = ref(0)
const fps = ref(0)

let fpsInterval: number | null = null
let frameCount = 0
let lastTime = performance.now()

const toggleMonitor = () => {
  showMonitor.value = !showMonitor.value
}

const updateMetrics = () => {
  // 메모리 사용량 업데이트
  const memory = getMemoryUsage()
  if (memory) {
    memoryUsage.value = {
      used: Math.round(memory.used / 1024 / 1024),
      total: Math.round(memory.total / 1024 / 1024),
      limit: Math.round(memory.limit / 1024 / 1024),
    }
  }

  // 네트워크 정보 업데이트
  const network = getNetworkInfo()
  if (network) {
    networkInfo.value = network
  }

  // 페이지 로드 시간 업데이트
  if (performance.timing) {
    const timing = performance.timing
    pageLoadTime.value = timing.loadEventEnd - timing.navigationStart
  }
}

const updateFPS = () => {
  frameCount++
  const currentTime = performance.now()

  if (currentTime - lastTime >= 1000) {
    fps.value = Math.round((frameCount * 1000) / (currentTime - lastTime))
    frameCount = 0
    lastTime = currentTime
  }

  if (showMonitor.value) {
    requestAnimationFrame(updateFPS)
  }
}

onMounted(() => {
  // 초기 메트릭 업데이트
  updateMetrics()

  // 주기적 업데이트
  const interval = setInterval(updateMetrics, 1000)

  // FPS 모니터링 시작
  updateFPS()

  onUnmounted(() => {
    clearInterval(interval)
    if (fpsInterval) {
      cancelAnimationFrame(fpsInterval)
    }
  })
})
</script>

<style scoped>
.performance-monitor {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15px;
  border-radius: 8px;
  font-family: monospace;
  font-size: 12px;
  z-index: 9999;
  min-width: 250px;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.monitor-header h3 {
  margin: 0;
  font-size: 14px;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.monitor-content {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  color: #ccc;
}

.value {
  font-weight: bold;
  color: #fff;
}

.monitor-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 16px;
  cursor: pointer;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.monitor-toggle:hover {
  background: rgba(0, 0, 0, 0.9);
}
</style>
