<template>
  <div class="modal-backdrop" @click.self="onCancel">
    <div class="modal-box">
      <div class="modal-title">다른 웹 세션이 이미 로그인되어 있습니다</div>
      <div class="modal-message">
        <span>기존 웹/모바일 세션 목록</span>
      </div>
      <table class="session-table" v-if="sessions && sessions.length">
        <thead>
          <tr>
            <th>디바이스</th>
            <th>IP</th>
            <th>장비 정보</th>
            <th>로그인 시간</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in sessions" :key="s.session_id">
            <td>{{ s.device_type }}</td>
            <td>{{ s.ip_address }}</td>
            <td>{{ s.user_agent }}</td>
            <td>{{ formatTime(s.created_at) }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="no-session">활성 세션 없음</div>
      <div class="modal-actions">
        <button class="modal-btn primary" @click="onForceLogout">
          기존 세션 로그아웃 후 로그인
        </button>
        <button class="modal-btn secondary" @click="onCancel">로그인 취소</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  onForceLogout: () => void
  onCancel: () => void
  sessions?: Array<{
    session_id: string
    device_type: string
    ip_address: string
    user_agent: string
    created_at: string
  }>
}>()

function formatTime(time: string) {
  if (!time) return ''
  try {
    const d = new Date(time)
    return d.toLocaleString('ko-KR', { hour12: false })
  } catch {
    return time
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-background-overlay);
  z-index: var(--z-index-modal-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: modalFadeIn var(--animation-duration-normal) var(--animation-easing-ease);
}
.modal-box {
  background: var(--color-background-primary);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-3xl) var(--spacing-2xl);
  min-width: 400px;
  max-width: 95vw;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.modal-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary-700);
  margin-bottom: var(--spacing-lg);
  text-align: center;
}
.modal-message {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
  text-align: center;
}
.session-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: var(--spacing-2xl);
  font-size: var(--font-size-sm);
  background: var(--color-background-tertiary);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.session-table th,
.session-table td {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-bottom: 1px solid var(--color-border-light);
  text-align: left;
}
.session-table th {
  background: var(--color-primary-50);
  color: var(--color-primary-700);
  font-weight: var(--font-weight-semibold);
}
.session-table tr:last-child td {
  border-bottom: none;
}
.no-session {
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-2xl);
  font-size: var(--font-size-sm);
}
.modal-actions {
  display: flex;
  gap: var(--spacing-lg);
  width: 100%;
  justify-content: center;
}
.modal-btn {
  min-width: 140px;
  padding: var(--spacing-sm) var(--spacing-xl);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  transition:
    background 0.2s,
    color 0.2s;
  box-shadow: var(--shadow-sm);
}
.modal-btn.primary {
  background: var(--color-primary-500);
  color: var(--color-text-inverse);
}
.modal-btn.primary:hover {
  background: var(--color-primary-600);
}
.modal-btn.secondary {
  background: var(--color-secondary-100);
  color: var(--color-primary-700);
}
.modal-btn.secondary:hover {
  background: var(--color-secondary-200);
}
</style>
