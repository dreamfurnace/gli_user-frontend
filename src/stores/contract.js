import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { contractAPI } from '@/services/api'

export const useContractStore = defineStore('contract', () => {
  // 상태
  const contracts = ref([])
  const contractTemplates = ref([])
  const currentContract = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const pagination = ref({
    count: 0,
    next: null,
    previous: null,
    page: 1,
    pageSize: 10,
  })

  // 계산된 속성
  const hasContracts = computed(() => contracts.value.length > 0)
  const contractsByStatus = computed(() => {
    const grouped = {}
    contracts.value.forEach((contract) => {
      if (!grouped[contract.status]) {
        grouped[contract.status] = []
      }
      grouped[contract.status].push(contract)
    })
    return grouped
  })

  const hasTemplates = computed(() => contractTemplates.value.length > 0)

  // 액션
  const fetchContracts = async (params = {}) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await contractAPI.getContracts({
        page: pagination.value.page,
        page_size: pagination.value.pageSize,
        ...params,
      })

      contracts.value = response.data.results || response.data

      // 페이지네이션 정보 업데이트
      if (response.data.count !== undefined) {
        pagination.value = {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          page: params.page || 1,
          pageSize: params.page_size || 10,
        }
      }

      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || '계약 목록을 불러오는데 실패했습니다.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchContract = async (contractId) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await contractAPI.getContract(contractId)
      currentContract.value = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || '계약 정보를 불러오는데 실패했습니다.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createContract = async (contractData) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await contractAPI.createContract(contractData)
      contracts.value.unshift(response.data)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || '계약 생성에 실패했습니다.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateContract = async (contractId, contractData) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await contractAPI.updateContract(contractId, contractData)

      // 목록에서 업데이트
      const index = contracts.value.findIndex((contract) => contract.id === contractId)
      if (index !== -1) {
        contracts.value[index] = response.data
      }

      // 현재 계약이 업데이트된 경우
      if (currentContract.value?.id === contractId) {
        currentContract.value = response.data
      }

      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || '계약 수정에 실패했습니다.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteContract = async (contractId) => {
    isLoading.value = true
    error.value = null

    try {
      await contractAPI.deleteContract(contractId)

      // 목록에서 제거
      contracts.value = contracts.value.filter((contract) => contract.id !== contractId)

      // 현재 계약이 삭제된 경우
      if (currentContract.value?.id === contractId) {
        currentContract.value = null
      }
    } catch (err) {
      error.value = err.response?.data?.error || '계약 삭제에 실패했습니다.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchContractTemplates = async (params = {}) => {
    try {
      const response = await contractAPI.getContractTemplates(params)
      contractTemplates.value = response.data.results || response.data
      return response.data
    } catch (err) {
      console.error('계약 템플릿 조회 중 오류:', err)
      throw err
    }
  }

  const setCurrentContract = (contract) => {
    currentContract.value = contract
  }

  const clearCurrentContract = () => {
    currentContract.value = null
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    contracts.value = []
    contractTemplates.value = []
    currentContract.value = null
    error.value = null
    pagination.value = {
      count: 0,
      next: null,
      previous: null,
      page: 1,
      pageSize: 10,
    }
  }

  return {
    // 상태
    contracts,
    contractTemplates,
    currentContract,
    isLoading,
    error,
    pagination,

    // 계산된 속성
    hasContracts,
    contractsByStatus,
    hasTemplates,

    // 액션
    fetchContracts,
    fetchContract,
    createContract,
    updateContract,
    deleteContract,
    fetchContractTemplates,
    setCurrentContract,
    clearCurrentContract,
    clearError,
    reset,
  }
})
