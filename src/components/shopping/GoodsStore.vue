<template>
  <div class="goods-store">
    <div class="section-header">
      <h2 class="section-title">
        <span class="title-icon">🛍️</span>
        {{ $t('shopping.tabs.goods') }}
      </h2>
      <p class="section-subtitle">Premium GLI merchandise and exclusive items</p>
    </div>

    <div class="coming-soon">
      <div class="coming-soon-icon">🚧</div>
      <h3>Coming Soon</h3>
      <p>The goods store is currently under development. Stay tuned for premium GLI merchandise!</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const emit = defineEmits(['add-to-cart', 'buy-now'])
</script>

<style scoped>
.goods-store {
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

.coming-soon {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-secondary);
}

.coming-soon-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.coming-soon h3 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: 1rem;
}
</style>