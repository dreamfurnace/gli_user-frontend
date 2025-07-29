<template>
  <span class="spinner" :aria-label="ariaLabel" role="status">
    <svg viewBox="0 0 24 24" class="spinner-svg">
      <circle
        class="spinner-bg"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
        fill="none"
        opacity="0.2"
      />
      <circle
        class="spinner-fg"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
        fill="none"
        stroke-linecap="round"
        stroke-dasharray="60 40"
      />
    </svg>
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{ ariaLabel?: string }>()
</script>

<style scoped>
.spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.spinner-svg {
  width: 24px;
  height: 24px;
  animation: spinner-rotate 1s linear infinite;
}
.spinner-bg {
  stroke: currentColor;
}
.spinner-fg {
  stroke: currentColor;
  stroke-dasharray: 60 40;
  stroke-dashoffset: 0;
  animation: spinner-dash 1.2s ease-in-out infinite;
}
@keyframes spinner-rotate {
  100% {
    transform: rotate(360deg);
  }
}
@keyframes spinner-dash {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 60, 40;
    stroke-dashoffset: -124;
  }
}
</style>
