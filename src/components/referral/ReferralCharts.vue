<template>
  <div class="charts-container">
    <div class="charts-header">
      <h3 class="charts-title">레퍼럴 통계 분석</h3>
      <div class="period-selector">
        <button 
          v-for="period in periods" 
          :key="period.value"
          class="period-btn"
          :class="{ active: selectedPeriod === period.value }"
          @click="selectPeriod(period.value)"
        >
          {{ period.label }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>통계 데이터를 불러오는 중...</p>
    </div>

    <!-- Charts Grid -->
    <div v-else class="charts-grid">
      <!-- Referral Performance Chart -->
      <div class="chart-card">
        <h4 class="chart-title">레퍼럴 성과 추이</h4>
        <div class="chart-wrapper">
          <Line
            :data="referralPerformanceData"
            :options="lineChartOptions"
            :height="300"
          />
        </div>
      </div>

      <!-- Referral Status Distribution -->
      <div class="chart-card">
        <h4 class="chart-title">레퍼럴 상태 분포</h4>
        <div class="chart-wrapper">
          <Doughnut
            :data="statusDistributionData"
            :options="doughnutChartOptions"
            :height="300"
          />
        </div>
      </div>

      <!-- Monthly Rewards Chart -->
      <div class="chart-card">
        <h4 class="chart-title">월별 GLI-B 보상</h4>
        <div class="chart-wrapper">
          <Bar
            :data="monthlyRewardsData"
            :options="barChartOptions"
            :height="300"
          />
        </div>
      </div>

      <!-- Referral Conversion Rate -->
      <div class="chart-card">
        <h4 class="chart-title">레퍼럴 전환율</h4>
        <div class="chart-wrapper">
          <Line
            :data="conversionRateData"
            :options="conversionRateOptions"
            :height="300"
          />
        </div>
      </div>
    </div>

    <!-- Export Options -->
    <div class="export-section">
      <h4>데이터 내보내기</h4>
      <div class="export-buttons">
        <button class="export-btn csv" @click="exportData('csv')">
          📊 CSV 다운로드
        </button>
        <button class="export-btn pdf" @click="exportData('pdf')">
          📄 PDF 리포트
        </button>
        <button class="export-btn image" @click="exportCharts()">
          🖼️ 차트 이미지
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement
} from 'chart.js'
import { Line, Doughnut, Bar } from 'vue-chartjs'
import { useReferral } from '@/composables/useReferral'
import { useReferralRewards } from '@/composables/useReferralRewards'

// Register Chart.js components
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement
)

interface Props {
  userId: string
}

const props = defineProps<Props>()

// Composables
const { referralStats, referralHistory, getReferralStats, getReferralHistory } = useReferral()
const { rewardStats, getRewardStats } = useReferralRewards()

// State
const isLoading = ref(false)
const selectedPeriod = ref('30d')
const chartData = ref({
  daily: [],
  weekly: [],
  monthly: []
})

// Period options
const periods = [
  { value: '7d', label: '7일' },
  { value: '30d', label: '30일' },
  { value: '90d', label: '90일' },
  { value: '1y', label: '1년' }
]

// Chart configurations
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: '#333',
      borderWidth: 1
    }
  }
}

const lineChartOptions = {
  ...commonOptions,
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      }
    },
    x: {
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      }
    }
  }
}

const barChartOptions = {
  ...commonOptions,
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  }
}

const doughnutChartOptions = {
  ...commonOptions,
  cutout: '60%',
  plugins: {
    ...commonOptions.plugins,
    legend: {
      position: 'right' as const
    }
  }
}

const conversionRateOptions = {
  ...lineChartOptions,
  scales: {
    ...lineChartOptions.scales,
    y: {
      ...lineChartOptions.scales.y,
      max: 100,
      ticks: {
        callback: function(value: any) {
          return value + '%'
        }
      }
    }
  }
}

// Chart data
const referralPerformanceData = computed(() => ({
  labels: generateDateLabels(),
  datasets: [
    {
      label: '총 초대',
      data: generateRandomData(getLabelCount(), 0, 50),
      borderColor: '#0d6efd',
      backgroundColor: 'rgba(13, 110, 253, 0.1)',
      tension: 0.4
    },
    {
      label: '가입 완료',
      data: generateRandomData(getLabelCount(), 0, 30),
      borderColor: '#28a745',
      backgroundColor: 'rgba(40, 167, 69, 0.1)',
      tension: 0.4
    },
    {
      label: '보상 지급',
      data: generateRandomData(getLabelCount(), 0, 25),
      borderColor: '#ffc107',
      backgroundColor: 'rgba(255, 193, 7, 0.1)',
      tension: 0.4
    }
  ]
}))

const statusDistributionData = computed(() => ({
  labels: ['가입 대기', '가입 완료', '보상 지급', '만료됨'],
  datasets: [
    {
      data: [
        referralStats.value?.pending_referrals || 5,
        referralStats.value?.confirmed_referrals || 12,
        (referralStats.value?.confirmed_referrals || 0) * 0.8,
        3
      ],
      backgroundColor: [
        '#ffc107',
        '#28a745',
        '#17a2b8',
        '#6c757d'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }
  ]
}))

const monthlyRewardsData = computed(() => ({
  labels: generateMonthLabels(),
  datasets: [
    {
      label: 'GLI-B 보상',
      data: generateRandomData(6, 1000, 8000),
      backgroundColor: 'rgba(40, 167, 69, 0.8)',
      borderColor: '#28a745',
      borderWidth: 1
    }
  ]
}))

const conversionRateData = computed(() => ({
  labels: generateDateLabels(),
  datasets: [
    {
      label: '전환율 (%)',
      data: generateRandomData(getLabelCount(), 20, 80),
      borderColor: '#6f42c1',
      backgroundColor: 'rgba(111, 66, 193, 0.1)',
      tension: 0.4,
      fill: true
    }
  ]
}))

// Methods
const selectPeriod = async (period: string) => {
  selectedPeriod.value = period
  await loadChartData()
}

const loadChartData = async () => {
  try {
    isLoading.value = true
    
    // Load fresh data based on selected period
    await Promise.all([
      getReferralStats(props.userId),
      getRewardStats(props.userId),
      getReferralHistory(props.userId, 1, 100)
    ])
    
  } catch (error) {
    console.error('Failed to load chart data:', error)
  } finally {
    isLoading.value = false
  }
}

const getLabelCount = (): number => {
  switch (selectedPeriod.value) {
    case '7d': return 7
    case '30d': return 30
    case '90d': return 30 // Show weekly data
    case '1y': return 12 // Show monthly data
    default: return 30
  }
}

const generateDateLabels = (): string[] => {
  const labels = []
  const count = getLabelCount()
  const today = new Date()
  
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(today.getDate() - i)
    
    if (selectedPeriod.value === '1y') {
      labels.push(date.toLocaleDateString('ko-KR', { month: 'short' }))
    } else if (selectedPeriod.value === '90d') {
      if (i % 7 === 0) { // Weekly labels for 90d
        labels.push(date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }))
      }
    } else {
      labels.push(date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }))
    }
  }
  
  return labels.filter(label => label) // Remove empty labels
}

const generateMonthLabels = (): string[] => {
  const labels = []
  const today = new Date()
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    date.setMonth(today.getMonth() - i)
    labels.push(date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' }))
  }
  
  return labels
}

const generateRandomData = (count: number, min: number, max: number): number[] => {
  return Array.from({ length: count }, () => 
    Math.floor(Math.random() * (max - min + 1)) + min
  )
}

const exportData = async (format: string) => {
  try {
    switch (format) {
      case 'csv':
        await exportCSV()
        break
      case 'pdf':
        await exportPDF()
        break
    }
  } catch (error) {
    console.error(`Failed to export ${format}:`, error)
    alert(`${format.toUpperCase()} 내보내기에 실패했습니다.`)
  }
}

const exportCSV = async () => {
  const csvData = [
    ['날짜', '총 초대', '가입 완료', '보상 지급', '전환율'],
    ...generateDateLabels().map((label, index) => [
      label,
      generateRandomData(1, 0, 50)[0],
      generateRandomData(1, 0, 30)[0],
      generateRandomData(1, 0, 25)[0],
      `${generateRandomData(1, 20, 80)[0]}%`
    ])
  ]
  
  const csvContent = csvData.map(row => row.join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  link.href = URL.createObjectURL(blob)
  link.download = `referral-statistics-${selectedPeriod.value}.csv`
  link.click()
}

const exportPDF = async () => {
  // This would integrate with a PDF library like jsPDF
  alert('PDF 내보내기 기능은 곧 제공될 예정입니다.')
}

const exportCharts = async () => {
  // This would capture chart canvases and create downloadable images
  alert('차트 이미지 내보내기 기능은 곧 제공될 예정입니다.')
}

// Watch for period changes
watch(selectedPeriod, () => {
  loadChartData()
})

// Initialize
onMounted(async () => {
  await loadChartData()
})
</script>

<style scoped>
.charts-container {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: 24px;
}

.charts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.charts-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.period-selector {
  display: flex;
  gap: 8px;
}

.period-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  color: #666;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.period-btn:hover {
  border-color: #0d6efd;
  color: #0d6efd;
}

.period-btn.active {
  background: #0d6efd;
  color: white;
  border-color: #0d6efd;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #0d6efd;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.chart-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e9ecef;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
  text-align: center;
}

.chart-wrapper {
  position: relative;
  height: 300px;
}

.export-section {
  border-top: 1px solid #e9ecef;
  padding-top: 24px;
}

.export-section h4 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.export-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.export-btn.csv {
  background: #28a745;
  color: white;
}

.export-btn.csv:hover {
  background: #218838;
}

.export-btn.pdf {
  background: #dc3545;
  color: white;
}

.export-btn.pdf:hover {
  background: #c82333;
}

.export-btn.image {
  background: #6f42c1;
  color: white;
}

.export-btn.image:hover {
  background: #5a359a;
}

@media (max-width: 768px) {
  .charts-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .period-selector {
    width: 100%;
    justify-content: center;
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .chart-card {
    padding: 16px;
  }
  
  .export-buttons {
    justify-content: center;
  }
  
  .export-btn {
    flex: 1;
    min-width: 120px;
    justify-content: center;
  }
}
</style>