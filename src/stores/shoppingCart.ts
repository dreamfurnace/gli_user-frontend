import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface CartItem {
  id: string
  name: string
  description: string
  price_glil: number
  price_usd?: number
  main_image_url?: string
  product_type_display: string
  category_name: string
  is_in_stock: boolean
  quantity: number
  addedAt: Date
  maxQuantity?: number
}

export const useShoppingCartStore = defineStore('shoppingCart', () => {
  // 상태
  const items = ref<CartItem[]>([])
  const isLoading = ref(false)

  // 게터 (computed)
  const itemCount = computed(() => {
    return items.value.reduce((total, item) => total + item.quantity, 0)
  })

  const totalPrice = computed(() => {
    return items.value.reduce((total, item) => total + (item.price_glil * item.quantity), 0)
  })

  const totalPriceUSD = computed(() => {
    return items.value.reduce((total, item) => {
      const usdPrice = item.price_usd || 0
      return total + (usdPrice * item.quantity)
    }, 0)
  })

  const isEmpty = computed(() => items.value.length === 0)

  const uniqueItemCount = computed(() => items.value.length)

  // 액션
  const addItem = (product: any, quantity: number = 1) => {
    const existingItemIndex = items.value.findIndex(item => item.id === product.id)
    
    if (existingItemIndex >= 0) {
      // 이미 존재하는 상품이면 수량 증가
      const existingItem = items.value[existingItemIndex]
      const newQuantity = existingItem.quantity + quantity
      
      // 최대 수량 체크 (기본값: 99)
      const maxQuantity = existingItem.maxQuantity || 99
      if (newQuantity <= maxQuantity) {
        existingItem.quantity = newQuantity
        saveToLocalStorage()
        return { success: true, message: `${product.name} 수량이 증가되었습니다.` }
      } else {
        return { 
          success: false, 
          message: `최대 주문 가능 수량(${maxQuantity}개)을 초과할 수 없습니다.` 
        }
      }
    } else {
      // 새로운 상품 추가
      const cartItem: CartItem = {
        id: product.id,
        name: product.name,
        description: product.short_description || product.description || '',
        price_glil: product.price_glil,
        price_usd: product.price_usd,
        main_image_url: product.main_image_url,
        product_type_display: product.product_type_display,
        category_name: product.category_name,
        is_in_stock: product.is_in_stock,
        quantity: quantity,
        addedAt: new Date(),
        maxQuantity: 99 // 기본 최대 수량
      }
      
      items.value.push(cartItem)
      saveToLocalStorage()
      return { success: true, message: `${product.name}이(가) 장바구니에 추가되었습니다.` }
    }
  }

  const removeItem = (productId: string) => {
    const index = items.value.findIndex(item => item.id === productId)
    if (index >= 0) {
      const removedItem = items.value.splice(index, 1)[0]
      saveToLocalStorage()
      return { success: true, message: `${removedItem.name}이(가) 장바구니에서 제거되었습니다.` }
    }
    return { success: false, message: '상품을 찾을 수 없습니다.' }
  }

  const updateQuantity = (productId: string, quantity: number) => {
    const item = items.value.find(item => item.id === productId)
    if (item) {
      if (quantity <= 0) {
        return removeItem(productId)
      }
      
      const maxQuantity = item.maxQuantity || 99
      if (quantity > maxQuantity) {
        return { 
          success: false, 
          message: `최대 주문 가능 수량(${maxQuantity}개)을 초과할 수 없습니다.` 
        }
      }
      
      item.quantity = quantity
      saveToLocalStorage()
      return { success: true, message: '수량이 변경되었습니다.' }
    }
    return { success: false, message: '상품을 찾을 수 없습니다.' }
  }

  const increaseQuantity = (productId: string) => {
    const item = items.value.find(item => item.id === productId)
    if (item) {
      return updateQuantity(productId, item.quantity + 1)
    }
    return { success: false, message: '상품을 찾을 수 없습니다.' }
  }

  const decreaseQuantity = (productId: string) => {
    const item = items.value.find(item => item.id === productId)
    if (item) {
      if (item.quantity <= 1) {
        return removeItem(productId)
      }
      return updateQuantity(productId, item.quantity - 1)
    }
    return { success: false, message: '상품을 찾을 수 없습니다.' }
  }

  const clearCart = () => {
    items.value = []
    saveToLocalStorage()
    return { success: true, message: '장바구니가 비워졌습니다.' }
  }

  const getItem = (productId: string) => {
    return items.value.find(item => item.id === productId)
  }

  const isInCart = (productId: string) => {
    return items.value.some(item => item.id === productId)
  }

  // 재고 상태 업데이트
  const updateStockStatus = (productId: string, isInStock: boolean) => {
    const item = items.value.find(item => item.id === productId)
    if (item) {
      item.is_in_stock = isInStock
      saveToLocalStorage()
    }
  }

  // 선택된 아이템들로 결제 진행
  const getCheckoutItems = (selectedIds?: string[]) => {
    if (selectedIds && selectedIds.length > 0) {
      return items.value.filter(item => selectedIds.includes(item.id))
    }
    return items.value
  }

  // 결제 완료 후 해당 아이템들 제거
  const removeCheckoutItems = (checkoutItemIds: string[]) => {
    checkoutItemIds.forEach(id => {
      const index = items.value.findIndex(item => item.id === id)
      if (index >= 0) {
        items.value.splice(index, 1)
      }
    })
    saveToLocalStorage()
  }

  // 로컬 스토리지 저장
  const saveToLocalStorage = () => {
    try {
      localStorage.setItem('gli_shopping_cart', JSON.stringify(items.value))
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error)
    }
  }

  // 로컬 스토리지에서 로드
  const loadFromLocalStorage = () => {
    try {
      const savedCart = localStorage.getItem('gli_shopping_cart')
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart)
        // Date 객체 복원
        items.value = parsedCart.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt)
        }))
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error)
      items.value = []
    }
  }

  // 장바구니 데이터 검증 (상품이 더 이상 존재하지 않거나 가격이 변경된 경우)
  const validateCart = async () => {
    // TODO: API를 통해 각 상품의 현재 정보를 확인하고 업데이트
    // 현재는 기본 구현만 제공
    isLoading.value = true
    
    try {
      // 실제 구현에서는 API 호출을 통해 각 상품 정보 검증
      await new Promise(resolve => setTimeout(resolve, 500)) // 로딩 시뮬레이션
      
      // 재고 없는 상품 체크 (실제로는 API 응답 기반)
      items.value.forEach(item => {
        // 예시: 재고 상태 업데이트 로직
        // item.is_in_stock = apiResponse.is_in_stock
      })
      
    } catch (error) {
      console.error('Cart validation failed:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 초기화 시 로컬 스토리지에서 데이터 로드
  loadFromLocalStorage()

  return {
    // 상태
    items: computed(() => items.value),
    isLoading: computed(() => isLoading.value),
    
    // 게터
    itemCount,
    totalPrice,
    totalPriceUSD,
    isEmpty,
    uniqueItemCount,
    
    // 액션
    addItem,
    removeItem,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    getItem,
    isInCart,
    updateStockStatus,
    getCheckoutItems,
    removeCheckoutItems,
    validateCart,
    saveToLocalStorage,
    loadFromLocalStorage
  }
})