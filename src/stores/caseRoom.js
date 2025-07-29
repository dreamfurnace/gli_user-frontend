import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { caseRoomAPI } from '@/services/api'

export const useCaseRoomStore = defineStore('caseRoom', () => {
  // 상태
  const caseRooms = ref([])
  const currentCaseRoom = ref(null)
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
  const hasCaseRooms = computed(() => caseRooms.value.length > 0)
  const caseRoomsByStatus = computed(() => {
    const grouped = {}
    caseRooms.value.forEach((room) => {
      if (!grouped[room.status]) {
        grouped[room.status] = []
      }
      grouped[room.status].push(room)
    })
    return grouped
  })

  // 액션
  const fetchCaseRooms = async (params = {}) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await caseRoomAPI.getCaseRooms({
        page: pagination.value.page,
        page_size: pagination.value.pageSize,
        ...params,
      })

      caseRooms.value = response.data.results || response.data

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
      error.value = err.response?.data?.error || '케이스룸 목록을 불러오는데 실패했습니다.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchCaseRoom = async (caseRoomId) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await caseRoomAPI.getCaseRoom(caseRoomId)
      currentCaseRoom.value = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || '케이스룸 정보를 불러오는데 실패했습니다.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createCaseRoom = async (caseRoomData) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await caseRoomAPI.createCaseRoom(caseRoomData)
      caseRooms.value.unshift(response.data)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || '케이스룸 생성에 실패했습니다.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateCaseRoom = async (caseRoomId, caseRoomData) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await caseRoomAPI.updateCaseRoom(caseRoomId, caseRoomData)

      // 목록에서 업데이트
      const index = caseRooms.value.findIndex((room) => room.id === caseRoomId)
      if (index !== -1) {
        caseRooms.value[index] = response.data
      }

      // 현재 케이스룸이 업데이트된 경우
      if (currentCaseRoom.value?.id === caseRoomId) {
        currentCaseRoom.value = response.data
      }

      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || '케이스룸 수정에 실패했습니다.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteCaseRoom = async (caseRoomId) => {
    isLoading.value = true
    error.value = null

    try {
      await caseRoomAPI.deleteCaseRoom(caseRoomId)

      // 목록에서 제거
      caseRooms.value = caseRooms.value.filter((room) => room.id !== caseRoomId)

      // 현재 케이스룸이 삭제된 경우
      if (currentCaseRoom.value?.id === caseRoomId) {
        currentCaseRoom.value = null
      }
    } catch (err) {
      error.value = err.response?.data?.error || '케이스룸 삭제에 실패했습니다.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const setCurrentCaseRoom = (caseRoom) => {
    currentCaseRoom.value = caseRoom
  }

  const clearCurrentCaseRoom = () => {
    currentCaseRoom.value = null
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    caseRooms.value = []
    currentCaseRoom.value = null
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
    caseRooms,
    currentCaseRoom,
    isLoading,
    error,
    pagination,

    // 계산된 속성
    hasCaseRooms,
    caseRoomsByStatus,

    // 액션
    fetchCaseRooms,
    fetchCaseRoom,
    createCaseRoom,
    updateCaseRoom,
    deleteCaseRoom,
    setCurrentCaseRoom,
    clearCurrentCaseRoom,
    clearError,
    reset,
  }
})
