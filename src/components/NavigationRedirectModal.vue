<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-body">
        <div class="modal-icon">🔄</div>
        <p class="modal-message">로그인 페이지로 이동합니다</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 16px;
  padding: 0;
  max-width: 300px;
  width: 90%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-color);
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

.modal-body {
  padding: 2rem;
  text-align: center;
}

.modal-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  animation: rotate 2s linear infinite;
}

.modal-message {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 500;
  line-height: 1.5;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>