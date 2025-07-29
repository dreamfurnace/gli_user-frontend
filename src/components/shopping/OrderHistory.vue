<template>
  <div class="order-history">
    <div class="section-header">
      <h2 class="section-title">
        <span class="title-icon">📋</span>
        {{ $t('shopping.tabs.orders') }}
      </h2>
      <p class="section-subtitle">Track your bookings, purchases, and reservations</p>
    </div>

    <div class="empty-state">
      <div class="empty-icon">📦</div>
      <h3>No Orders Yet</h3>
      <p>Your order history will appear here once you make your first purchase or booking.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.order-history {
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 2rem;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.title-icon {
  font-size: 2.5rem;
}

.section-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: 1rem;
}
</style>