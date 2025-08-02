<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :class="className"
  >
    <!-- 얼굴 윤곽 -->
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="2"
      fill="none"
    />
    
    <!-- 왼쪽 눈 -->
    <circle
      cx="9"
      cy="9"
      r="1"
      fill="currentColor"
    />
    
    <!-- 오른쪽 눈 -->
    <circle
      cx="15"
      cy="9"
      r="1"
      fill="currentColor"
    />
    
    <!-- 코 -->
    <path
      d="M12 11v2"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    />
    
    <!-- 입 -->
    <path
      d="M9 16c1 1 2.5 1 3 1s2-0 3-1"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      fill="none"
    />
    
    <!-- 얼굴 인식 랜드마크 포인트들 -->
    <g v-if="showLandmarks" opacity="0.6">
      <!-- 이마 -->
      <circle cx="12" cy="6" r="0.5" fill="currentColor" />
      
      <!-- 턱 -->
      <circle cx="12" cy="18" r="0.5" fill="currentColor" />
      
      <!-- 왼쪽 뺨 -->
      <circle cx="6" cy="12" r="0.5" fill="currentColor" />
      
      <!-- 오른쪽 뺨 -->
      <circle cx="18" cy="12" r="0.5" fill="currentColor" />
      
      <!-- 왼쪽 귀 -->
      <circle cx="5" cy="10" r="0.5" fill="currentColor" />
      
      <!-- 오른쪽 귀 -->
      <circle cx="19" cy="10" r="0.5" fill="currentColor" />
    </g>
    
    <!-- 스캔 애니메이션 -->
    <g v-if="scanning">
      <defs>
        <linearGradient id="scanGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:currentColor;stop-opacity:0" />
          <stop offset="50%" style="stop-color:currentColor;stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:currentColor;stop-opacity:0" />
        </linearGradient>
      </defs>
      
      <rect
        x="2"
        y="2"
        width="20"
        height="2"
        fill="url(#scanGradient)"
        rx="1"
      >
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; 0,16; 0,0"
          dur="2s"
          repeatCount="indefinite"
        />
      </rect>
    </g>
  </svg>
</template>

<script setup lang="ts">
interface Props {
  size?: number | string
  className?: string
  showLandmarks?: boolean
  scanning?: boolean
}

withDefaults(defineProps<Props>(), {
  size: 24,
  className: '',
  showLandmarks: false,
  scanning: false
})
</script>

<style scoped>
svg {
  transition: all 0.3s ease;
}

.scanning {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}
</style>