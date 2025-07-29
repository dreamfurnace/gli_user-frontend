<template>
  <svg
    :class="className"
    viewBox="0 0 108 108"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="phantomGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#AB9FF2" />
        <stop offset="100%" style="stop-color:#7B5AFF" />
      </linearGradient>
    </defs>
    <path
      d="M89.2 19.8C82.4 13.1 73.3 9.3 63.6 9.3c-19.5 0-35.8 15.4-37.1 34.8-1.5 22.4 16.4 41.1 38.5 41.1 10.1 0 19.5-4.1 26.2-10.7 6.7-6.6 10.6-15.7 10.6-25.4V21.9c0-.7-.6-1.3-1.3-1.3-.7 0-1.3.6-1.3 1.3v27.2c0 8.7-3.5 16.9-9.8 22.9-6.3 6-14.7 9.3-23.5 9.3-19.8 0-35.8-16.7-34.4-37 1.2-17.4 15.7-31.2 33.2-31.2 8.7 0 16.9 3.5 22.9 9.8 6 6.3 9.3 14.7 9.3 23.5v27.2c0 .7.6 1.3 1.3 1.3.7 0 1.3-.6 1.3-1.3V49.1c0-10.7-4.3-20.4-11.9-27.3z"
      fill="url(#phantomGradient)"
    />
    <circle cx="75" cy="40" r="3" fill="currentColor" />
    <circle cx="85" cy="40" r="3" fill="currentColor" />
  </svg>
</template>

<script setup lang="ts">
interface Props {
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: 'w-6 h-6'
})
</script>