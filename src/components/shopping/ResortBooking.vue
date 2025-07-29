<template>
  <div class="resort-booking">
    <div class="section-header">
      <h2 class="section-title">
        <span class="title-icon">🏨</span>
        {{ $t('shopping.resort.title') }}
      </h2>
      <p class="section-subtitle">{{ $t('shopping.resort.subtitle') }}</p>
    </div>

    <!-- 필터 및 검색 -->
    <div class="booking-filters">
      <div class="filter-group">
        <label class="filter-label">{{ $t('shopping.resort.checkIn') }}</label>
        <input 
          type="date" 
          v-model="filters.checkIn"
          class="filter-input"
          :min="minDate"
        />
      </div>
      
      <div class="filter-group">
        <label class="filter-label">{{ $t('shopping.resort.checkOut') }}</label>
        <input 
          type="date" 
          v-model="filters.checkOut"
          class="filter-input"
          :min="filters.checkIn"
        />
      </div>
      
      <div class="filter-group">
        <label class="filter-label">{{ $t('shopping.resort.guests') }}</label>
        <select v-model="filters.guests" class="filter-select">
          <option value="1">1 {{ $t('shopping.resort.guest') }}</option>
          <option value="2">2 {{ $t('shopping.resort.guests') }}</option>
          <option value="3">3 {{ $t('shopping.resort.guests') }}</option>
          <option value="4">4 {{ $t('shopping.resort.guests') }}</option>
          <option value="5+">5+ {{ $t('shopping.resort.guests') }}</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label class="filter-label">{{ $t('shopping.resort.roomType') }}</label>
        <select v-model="filters.roomType" class="filter-select">
          <option value="">{{ $t('shopping.resort.allRoomTypes') }}</option>
          <option value="standard">{{ $t('shopping.resort.standard') }}</option>
          <option value="deluxe">{{ $t('shopping.resort.deluxe') }}</option>
          <option value="suite">{{ $t('shopping.resort.suite') }}</option>
          <option value="villa">{{ $t('shopping.resort.villa') }}</option>
        </select>
      </div>
      
      <button class="search-btn" @click="searchRooms">
        <span class="search-icon">🔍</span>
        {{ $t('shopping.resort.search') }}
      </button>
    </div>

    <!-- 리조트 목록 -->
    <div class="resort-grid">
      <div 
        v-for="resort in filteredResorts" 
        :key="resort.id"
        class="resort-card"
      >
        <div class="resort-image">
          <img :src="resort.image" :alt="resort.name" />
          <div class="resort-rating">
            <span class="stars">{{ '⭐'.repeat(resort.rating) }}</span>
            <span class="rating-text">{{ resort.rating }}/5</span>
          </div>
        </div>
        
        <div class="resort-content">
          <h3 class="resort-name">{{ resort.name }}</h3>
          <p class="resort-location">
            <span class="location-icon">📍</span>
            {{ resort.location }}
          </p>
          <p class="resort-description">{{ resort.description }}</p>
          
          <div class="room-options">
            <div 
              v-for="room in resort.rooms" 
              :key="room.type"
              class="room-option"
              :class="{ selected: selectedRooms[resort.id] === room.type }"
              @click="selectRoom(resort.id, room.type)"
            >
              <div class="room-info">
                <h4 class="room-type">{{ $t(`shopping.resort.${room.type}`) }}</h4>
                <p class="room-features">{{ room.features.join(' • ') }}</p>
                <div class="room-price">
                  <span class="price-amount">{{ formatPrice(room.price) }}</span>
                  <span class="price-unit">GLI / {{ $t('shopping.resort.night') }}</span>
                </div>
              </div>
              <div class="room-actions">
                <button 
                  class="add-to-cart-btn"
                  @click.stop="addToCart(resort, room)"
                >
                  {{ $t('shopping.addToCart') }}
                </button>
                <button 
                  class="book-now-btn"
                  @click.stop="bookNow(resort, room)"
                >
                  {{ $t('shopping.bookNow') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>{{ $t('shopping.resort.searching') }}</p>
    </div>

    <!-- 결과 없음 -->
    <div v-if="!loading && filteredResorts.length === 0" class="no-results">
      <div class="no-results-icon">🏨</div>
      <h3>{{ $t('shopping.resort.noResults') }}</h3>
      <p>{{ $t('shopping.resort.tryDifferentSearch') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const emit = defineEmits(['add-to-cart', 'book-now'])

// 상태 관리
const loading = ref(false)
const selectedRooms = ref({})

// 필터 상태
const filters = ref({
  checkIn: '',
  checkOut: '',
  guests: '2',
  roomType: ''
})

// 최소 날짜 (오늘)
const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

// 리조트 데이터 (실제로는 API에서 가져옴)
const resorts = ref([
  {
    id: 'resort-1',
    name: 'GLI Ocean Resort',
    location: 'Jeju Island, Korea',
    description: '제주도의 아름다운 해변가에 위치한 럭셔리 리조트입니다.',
    image: '/api/placeholder/400/250',
    rating: 5,
    rooms: [
      {
        type: 'standard',
        price: 150,
        features: ['Ocean View', 'Free WiFi', 'Breakfast Included']
      },
      {
        type: 'deluxe',
        price: 250,
        features: ['Premium Ocean View', 'Balcony', 'Room Service', 'Mini Bar']
      },
      {
        type: 'suite',
        price: 450,
        features: ['Panoramic View', 'Separate Living Room', 'Jacuzzi', 'Butler Service']
      }
    ]
  },
  {
    id: 'resort-2',
    name: 'GLI Mountain Lodge',
    location: 'Gangwon-do, Korea',
    description: '설악산의 청정 자연 속에서 힐링할 수 있는 마운틴 리조트입니다.',
    image: '/api/placeholder/400/250',
    rating: 4,
    rooms: [
      {
        type: 'standard',
        price: 120,
        features: ['Mountain View', 'Heating', 'Free Parking']
      },
      {
        type: 'deluxe',
        price: 200,
        features: ['Premium Mountain View', 'Fireplace', 'Private Deck']
      },
      {
        type: 'villa',
        price: 380,
        features: ['Private Villa', 'Hot Tub', 'Kitchen', 'BBQ Area']
      }
    ]
  },
  {
    id: 'resort-3',
    name: 'GLI City Hotel',
    location: 'Seoul, Korea',
    description: '서울 도심 속 비즈니스와 레저를 동시에 즐길 수 있는 프리미엄 호텔입니다.',
    image: '/api/placeholder/400/250',
    rating: 5,
    rooms: [
      {
        type: 'standard',
        price: 180,
        features: ['City View', 'Business Center', 'Gym Access']
      },
      {
        type: 'deluxe',
        price: 280,
        features: ['Han River View', 'Executive Lounge', 'Express Check-in']
      },
      {
        type: 'suite',
        price: 500,
        features: ['Presidential Suite', 'Private Elevator', 'Personal Assistant', 'Rooftop Access']
      }
    ]
  }
])

// 필터된 리조트 목록
const filteredResorts = computed(() => {
  let filtered = resorts.value

  if (filters.value.roomType) {
    filtered = filtered.filter(resort => 
      resort.rooms.some(room => room.type === filters.value.roomType)
    )
  }

  return filtered
})

// 메서드
const searchRooms = () => {
  loading.value = true
  
  // 검색 시뮬레이션
  setTimeout(() => {
    loading.value = false
  }, 1000)
}

const selectRoom = (resortId: string, roomType: string) => {
  selectedRooms.value[resortId] = roomType
}

const addToCart = (resort: any, room: any) => {
  if (!filters.value.checkIn || !filters.value.checkOut) {
    alert(t('shopping.resort.selectDates'))
    return
  }

  const nights = calculateNights(filters.value.checkIn, filters.value.checkOut)
  const cartItem = {
    id: `${resort.id}-${room.type}`,
    type: 'resort',
    name: `${resort.name} - ${t(`shopping.resort.${room.type}`)}`,
    price: room.price * nights,
    quantity: 1,
    details: {
      resort: resort.name,
      roomType: room.type,
      checkIn: filters.value.checkIn,
      checkOut: filters.value.checkOut,
      guests: filters.value.guests,
      nights: nights
    },
    image: resort.image
  }

  emit('add-to-cart', cartItem)
}

const bookNow = (resort: any, room: any) => {
  if (!filters.value.checkIn || !filters.value.checkOut) {
    alert(t('shopping.resort.selectDates'))
    return
  }

  const nights = calculateNights(filters.value.checkIn, filters.value.checkOut)
  const bookingData = {
    id: `${resort.id}-${room.type}`,
    type: 'resort',
    name: `${resort.name} - ${t(`shopping.resort.${room.type}`)}`,
    price: room.price * nights,
    quantity: 1,
    details: {
      resort: resort.name,
      roomType: room.type,
      checkIn: filters.value.checkIn,
      checkOut: filters.value.checkOut,
      guests: filters.value.guests,
      nights: nights
    },
    image: resort.image
  }

  emit('book-now', bookingData)
}

const calculateNights = (checkIn: string, checkOut: string) => {
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

onMounted(() => {
  // 기본 날짜 설정
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  filters.value.checkIn = today.toISOString().split('T')[0]
  filters.value.checkOut = tomorrow.toISOString().split('T')[0]
})
</script>

<style scoped>
.resort-booking {
  max-width: 1200px;
  margin: 0 auto;
}

/* 섹션 헤더 */
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
  max-width: 600px;
  margin: 0 auto;
}

/* 필터 영역 */
.booking-filters {
  background: var(--bg-tertiary);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.filter-input,
.filter-select {
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: var(--gli-blue);
}

.search-btn {
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: fit-content;
}

.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.search-icon {
  font-size: 1.2rem;
}

/* 리조트 그리드 */
.resort-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.resort-card {
  background: var(--bg-primary);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.resort-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.resort-image {
  position: relative;
  height: 200px;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.resort-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.resort-rating {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.resort-content {
  padding: 1.5rem;
}

.resort-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.resort-location {
  color: var(--text-secondary);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.resort-description {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

/* 룸 옵션 */
.room-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.room-option {
  border: 2px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-option:hover {
  border-color: var(--gli-blue);
}

.room-option.selected {
  border-color: var(--gli-gold);
  background: rgba(212, 175, 55, 0.1);
}

.room-info {
  flex: 1;
}

.room-type {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.room-features {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.room-price {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.price-amount {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--gli-blue);
}

.price-unit {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.room-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.add-to-cart-btn,
.book-now-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  min-width: 100px;
}

.add-to-cart-btn {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
}

.add-to-cart-btn:hover {
  background: var(--gli-gray);
  color: white;
}

.book-now-btn {
  background: var(--gradient-gold);
  color: var(--gli-gray-dark);
}

.book-now-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

/* 로딩 및 빈 상태 */
.loading-state,
.no-results {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--gli-blue);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.no-results-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 반응형 */
@media (max-width: 768px) {
  .booking-filters {
    grid-template-columns: 1fr;
  }
  
  .resort-grid {
    grid-template-columns: 1fr;
  }
  
  .room-option {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .room-actions {
    flex-direction: row;
  }
}
</style>