import { ref, computed, onMounted, onUnmounted, readonly } from 'vue'
import { recoveryService, type RecoveryData } from '@/services/recoveryService'

export function useRecovery() {
  // 반응형 상태
  const isRecovering = ref(false)
  const hasRecoveryData = ref(false)
  const recoveryError = ref<string | null>(null)
  const backupHistory = ref<Array<{ timestamp: Date; contractId: string }>>([])

  // 계산된 속성
  const canRecover = computed(() => hasRecoveryData.value && !isRecovering.value)

  const backupCount = computed(() => backupHistory.value.length)

  const latestBackup = computed(() =>
    backupHistory.value.length > 0 ? backupHistory.value[backupHistory.value.length - 1] : null,
  )

  // 복원 가능한 데이터 확인
  const checkRecoveryData = () => {
    hasRecoveryData.value = recoveryService.hasRecoveryData()
    backupHistory.value = recoveryService.getBackupHistory()
  }

  // 데이터 복원 실행
  const recoverData = async (): Promise<boolean> => {
    try {
      isRecovering.value = true
      recoveryError.value = null

      const success = await recoveryService.recoverData()

      if (success) {
        // 복원 후 상태 업데이트
        checkRecoveryData()
        return true
      } else {
        recoveryError.value = '복원할 데이터가 없습니다.'
        return false
      }
    } catch (error) {
      recoveryError.value = error instanceof Error ? error.message : '복원 중 오류가 발생했습니다.'
      console.error('Recovery failed:', error)
      return false
    } finally {
      isRecovering.value = false
    }
  }

  // 특정 백업에서 복원
  const recoverFromBackup = async (timestamp: Date): Promise<boolean> => {
    try {
      isRecovering.value = true
      recoveryError.value = null

      const success = await recoveryService.recoverFromBackup(timestamp)

      if (success) {
        checkRecoveryData()
        return true
      } else {
        recoveryError.value = '백업에서 복원할 수 없습니다.'
        return false
      }
    } catch (error) {
      recoveryError.value =
        error instanceof Error ? error.message : '백업 복원 중 오류가 발생했습니다.'
      console.error('Backup recovery failed:', error)
      return false
    } finally {
      isRecovering.value = false
    }
  }

  // 수동 백업 생성
  const createBackup = () => {
    try {
      recoveryService.createBackup()
      checkRecoveryData()
      console.log('수동 백업이 생성되었습니다.')
    } catch (error) {
      console.error('백업 생성 실패:', error)
    }
  }

  // 복원 데이터 삭제
  const clearRecoveryData = () => {
    try {
      recoveryService.clearRecoveryData()
      checkRecoveryData()
      console.log('복원 데이터가 삭제되었습니다.')
    } catch (error) {
      console.error('복원 데이터 삭제 실패:', error)
    }
  }

  // 백업 데이터 삭제
  const clearBackupData = () => {
    try {
      recoveryService.clearBackupData()
      checkRecoveryData()
      console.log('백업 데이터가 삭제되었습니다.')
    } catch (error) {
      console.error('백업 데이터 삭제 실패:', error)
    }
  }

  // 모든 복원 관련 데이터 삭제
  const clearAllRecoveryData = () => {
    try {
      recoveryService.clearAllRecoveryData()
      checkRecoveryData()
      console.log('모든 복원 관련 데이터가 삭제되었습니다.')
    } catch (error) {
      console.error('복원 데이터 삭제 실패:', error)
    }
  }

  // 복원 데이터 정보 가져오기
  const getRecoveryInfo = (): RecoveryData | null => {
    return recoveryService.getRecoveryData()
  }

  // 백업 시간 포맷팅
  const formatBackupTime = (timestamp: Date): string => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()

    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`

    return timestamp.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 복원 확인 다이얼로그 표시 (선택적)
  const showRecoveryDialog = () => {
    // 실제 구현에서는 모달 다이얼로그를 표시
    // 여기서는 간단히 콘솔 로그로 대체
    console.log('복원 확인 다이얼로그를 표시합니다.')
  }

  // 자동 복원 시도 (페이지 로드 시)
  const attemptAutoRecovery = async (): Promise<boolean> => {
    if (!hasRecoveryData.value) return false

    // 사용자에게 복원 여부 확인
    const shouldRecover = confirm('이전 세션에서 저장된 데이터가 있습니다. 복원하시겠습니까?')

    if (shouldRecover) {
      return await recoverData()
    }

    return false
  }

  // 컴포넌트 마운트 시 초기화
  onMounted(() => {
    checkRecoveryData()
  })

  // 컴포넌트 언마운트 시 정리
  onUnmounted(() => {
    // 필요한 경우 서비스 정리
    // recoveryService.destroy()
  })

  return {
    // 상태
    isRecovering: readonly(isRecovering),
    hasRecoveryData: readonly(hasRecoveryData),
    recoveryError: readonly(recoveryError),
    backupHistory: readonly(backupHistory),

    // 계산된 속성
    canRecover,
    backupCount,
    latestBackup,

    // 메서드
    checkRecoveryData,
    recoverData,
    recoverFromBackup,
    createBackup,
    clearRecoveryData,
    clearBackupData,
    clearAllRecoveryData,
    getRecoveryInfo,
    formatBackupTime,
    showRecoveryDialog,
    attemptAutoRecovery,
  }
}
