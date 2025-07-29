<template>
  <div class="rwa-assets-view">
    <div class="page-header">
      <h1 class="page-title text-gradient">🏗️ RWA 자산 목록</h1>
      <p class="page-description">
        GLI Platform의 실물 자산(Real World Assets)을 확인해보세요
      </p>
    </div>

    <div class="assets-grid">
      <div 
        v-for="asset in assets" 
        :key="asset.id"
        class="asset-card"
        @click="viewAssetDetails(asset)"
      >
        <div class="asset-image">
          <img :src="asset.image" :alt="asset.name" />
          <div class="asset-status" :class="asset.status">
            {{ getStatusText(asset.status) }}
          </div>
        </div>
        
        <div class="asset-info">
          <h3 class="asset-name">{{ asset.name }}</h3>
          <p class="asset-location">📍 {{ asset.location }}</p>
          <p class="asset-description">{{ asset.description }}</p>
          
          <div class="asset-details">
            <div class="detail-item">
              <span class="label">총 가치</span>
              <span class="value">{{ formatCurrency(asset.totalValue) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">토큰화 비율</span>
              <span class="value">{{ asset.tokenizationRatio }}%</span>
            </div>
            <div class="detail-item">
              <span class="label">연 수익률</span>
              <span class="value text-gradient">{{ asset.annualReturn }}%</span>
            </div>
          </div>
          
          <div class="asset-actions">
            <button class="btn-primary" @click.stop="investInAsset(asset)">
              투자하기
            </button>
            <button class="btn-secondary" @click.stop="viewDetails(asset)">
              자세히 보기
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="assets.length === 0" class="empty-state">
      <div class="empty-icon">🏗️</div>
      <h3>등록된 RWA 자산이 없습니다</h3>
      <p>곧 다양한 실물 자산이 등록될 예정입니다.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface RWAAsset {
  id: string
  name: string
  location: string
  description: string
  image: string
  totalValue: number
  tokenizationRatio: number
  annualReturn: number
  status: 'active' | 'pending' | 'sold_out'
}

const assets = ref<RWAAsset[]>([
  {
    id: '1',
    name: '서울 강남 오피스텔',
    location: '서울특별시 강남구',
    description: '프리미엄 오피스텔 부동산 토큰화 상품',
    image: '/img/assets/officetel-gangnam.jpg',
    totalValue: 2500000000,
    tokenizationRatio: 75,
    annualReturn: 8.5,
    status: 'active'
  },
  {
    id: '2',
    name: '부산 해운대 리조트',
    location: '부산광역시 해운대구',
    description: '해운대 소재 리조트 호텔 투자 상품',
    image: '/img/assets/resort-haeundae.jpg',
    totalValue: 1800000000,
    tokenizationRatio: 60,
    annualReturn: 7.2,
    status: 'active'
  },
  {
    id: '3',
    name: '제주 펜션 단지',
    location: '제주특별자치도',
    description: '제주도 관광 펜션 단지 토큰화',
    image: '/img/assets/pension-jeju.jpg',
    totalValue: 1200000000,
    tokenizationRatio: 90,
    annualReturn: 6.8,
    status: 'sold_out'
  }
])

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return '투자 가능'
    case 'pending': return '준비 중'
    case 'sold_out': return '완료'
    default: return status
  }
}

const viewAssetDetails = (asset: RWAAsset) => {
  console.log('자산 상세보기:', asset.name)
  // 자산 상세 페이지로 이동하는 로직
}

const investInAsset = (asset: RWAAsset) => {
  if (asset.status !== 'active') return
  console.log('투자하기:', asset.name)
  // 투자 로직
}

const viewDetails = (asset: RWAAsset) => {
  console.log('자세히 보기:', asset.name)
  // 상세 정보 모달 또는 페이지 이동
}

onMounted(() => {
  console.log('RWA 자산 목록 페이지 로드')
})
</script>

<style scoped>
.rwa-assets-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.page-description {
  font-size: 1.1rem;
  color: var(--text-secondary);
}

.assets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.asset-card {
  background: var(--bg-primary);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  cursor: pointer;
}

.asset-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.asset-image {
  position: relative;
  height: 200px;
  background: linear-gradient(45deg, var(--gli-blue), var(--gli-purple));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 4rem;
}

.asset-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.asset-status {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.9);
  color: var(--gli-gray-dark);
}

.asset-status.active {
  background: var(--success-color);
  color: white;
}

.asset-status.pending {
  background: var(--warning-color);
  color: var(--gli-gray-dark);
}

.asset-status.sold_out {
  background: var(--gli-gray);
  color: white;
}

.asset-info {
  padding: 1.5rem;
}

.asset-name {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.asset-location {
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.asset-description {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.asset-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-light);
}

.label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.value {
  font-weight: 600;
  color: var(--text-primary);
}

.asset-actions {
  display: flex;
  gap: 1rem;
}

.asset-actions button {
  flex: 1;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
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
  margin-bottom: 1rem;
  color: var(--text-primary);
}

/* 반응형 */
@media (max-width: 768px) {
  .rwa-assets-view {
    padding: 1rem;
  }
  
  .assets-grid {
    grid-template-columns: 1fr;
  }
  
  .asset-actions {
    flex-direction: column;
  }
}
</style>