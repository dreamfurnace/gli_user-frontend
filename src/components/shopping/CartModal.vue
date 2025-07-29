<template>
  <div class="cart-modal-overlay" @click="$emit('close')">
    <div class="cart-modal" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">
          <span class="title-icon">🛒</span>
          {{ $t('shopping.viewCart') }}
        </h3>
        <button class="close-btn" @click="$emit('close')">
          <span>✕</span>
        </button>
      </div>

      <div class="modal-body">
        <div v-if="items.length === 0" class="empty-cart">
          <div class="empty-icon">🛒</div>
          <p>Your cart is empty</p>
        </div>

        <div v-else class="cart-items">
          <div 
            v-for="item in items" 
            :key="`${item.id}-${item.type}`"
            class="cart-item"
          >
            <div class="item-info">
              <h4 class="item-name">{{ item.name }}</h4>
              <p class="item-details" v-if="item.details">
                <span v-if="item.details.checkIn">
                  {{ item.details.checkIn }} - {{ item.details.checkOut }} ({{ item.details.nights }} nights)
                </span>
              </p>
            </div>
            <div class="item-controls">
              <div class="quantity-controls">
                <button @click="updateQuantity(item, item.quantity - 1)">-</button>
                <span>{{ item.quantity }}</span>
                <button @click="updateQuantity(item, item.quantity + 1)">+</button>
              </div>
              <div class="item-price">{{ formatPrice(item.price * item.quantity) }} GLI</div>
              <button class="remove-btn" @click="removeItem(item)">🗑️</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="items.length > 0" class="modal-footer">
        <div class="total-section">
          <div class="total-line">
            <span>Total: {{ formatPrice(total) }} GLI</span>
          </div>
        </div>
        <div class="footer-actions">
          <button class="continue-shopping-btn" @click="$emit('close')">
            Continue Shopping
          </button>
          <button class="checkout-btn" @click="$emit('checkout')">
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  items: any[]
  total: number
}>()

const emit = defineEmits(['close', 'checkout', 'remove-item', 'update-quantity'])

const removeItem = (item: any) => {
  emit('remove-item', item.id, item.type)
}

const updateQuantity = (item: any, quantity: number) => {
  emit('update-quantity', item.id, item.type, quantity)
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price)
}
</script>

<style scoped>
.cart-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.cart-modal {
  background: var(--bg-primary);
  border-radius: 1rem;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-btn:hover {
  background: var(--bg-secondary);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.empty-cart {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  gap: 1rem;
}

.item-info {
  flex: 1;
}

.item-name {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.item-details {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.item-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quantity-controls button {
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  border-radius: 0.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-price {
  font-weight: 600;
  color: var(--gli-blue);
  min-width: 80px;
  text-align: right;
}

.remove-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  color: var(--text-secondary);
}

.remove-btn:hover {
  color: var(--gli-red);
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.total-section {
  margin-bottom: 1rem;
}

.total-line {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-primary);
  text-align: right;
}

.footer-actions {
  display: flex;
  gap: 1rem;
}

.continue-shopping-btn,
.checkout-btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.continue-shopping-btn {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.checkout-btn {
  background: var(--gradient-primary);
  color: white;
  border: none;
}

.checkout-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}
</style>