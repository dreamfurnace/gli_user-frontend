import { useContractStore, type ContractData } from '@/stores/contractStore'
import { collaborationService } from './collaborationService'

export interface RecoveryData {
  contractId: string
  contractData: ContractData
  lastSaved: Date
  collaborationState: {
    isConnected: boolean
    participants: any[]
    lastSyncTimestamp: number
  }
  userPreferences: {
    autoSave: boolean
    autoSaveInterval: number
    theme: string
    language: string
  }
  sessionInfo: {
    startedAt: Date
    lastActivity: Date
    pageUrl: string
  }
}

export interface RecoveryOptions {
  enableAutoRecovery?: boolean
  maxRecoveryAge?: number // 시간 단위
  backupInterval?: number // 분 단위
  compressionEnabled?: boolean
}

class RecoveryService {
  private contractStore = useContractStore()
  private readonly STORAGE_KEY = 'gli_recovery_data'
  private readonly SESSION_KEY = 'gli_session_info'
  private readonly BACKUP_KEY = 'gli_backup_data'

  private options: RecoveryOptions = {
    enableAutoRecovery: true,
    maxRecoveryAge: 24, // 24시간
    backupInterval: 5, // 5분
    compressionEnabled: true,
  }

  private backupInterval: NodeJS.Timeout | null = null
  private isRecovering = false

  constructor(options?: RecoveryOptions) {
    if (options) {
      this.options = { ...this.options, ...options }
    }

    this.setupAutoBackup()
    this.setupBeforeUnload()
  }

  // 자동 백업 설정
  private setupAutoBackup(): void {
    if (!this.options.enableAutoRecovery) return

    this.backupInterval = setInterval(
      () => {
        this.createBackup()
      },
      this.options.backupInterval! * 60 * 1000,
    ) // 분을 밀리초로 변환
  }

  // 페이지 언로드 전 백업
  private setupBeforeUnload(): void {
    if (!this.options.enableAutoRecovery) return

    window.addEventListener('beforeunload', () => {
      this.createBackup()
    })

    // 페이지 가시성 변경 시 백업
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.createBackup()
      }
    })
  }

  // 현재 상태 백업 생성
  public createBackup(): void {
    try {
      const currentContract = this.contractStore.currentContract
      if (!currentContract) return

      const recoveryData: RecoveryData = {
        contractId: currentContract.basicInfo.id,
        contractData: currentContract,
        lastSaved: new Date(),
        collaborationState: {
          isConnected: collaborationService.state.isConnected,
          participants: collaborationService.getParticipants(),
          lastSyncTimestamp: collaborationService.state.lastSyncTimestamp,
        },
        userPreferences: {
          autoSave: this.contractStore.autoSaveEnabled,
          autoSaveInterval: this.contractStore.autoSaveInterval,
          theme: localStorage.getItem('theme') || 'light',
          language: localStorage.getItem('language') || 'ko',
        },
        sessionInfo: {
          startedAt: this.getSessionStartTime(),
          lastActivity: new Date(),
          pageUrl: window.location.href,
        },
      }

      // 압축 옵션이 활성화된 경우 데이터 압축
      const dataToStore = this.options.compressionEnabled
        ? this.compressData(recoveryData)
        : JSON.stringify(recoveryData)

      // 메인 복원 데이터 저장
      localStorage.setItem(this.STORAGE_KEY, dataToStore)

      // 백업 데이터 저장 (최대 5개 유지)
      this.saveBackupData(recoveryData)

      console.log('백업 데이터가 생성되었습니다.')
    } catch (error) {
      console.error('백업 생성 실패:', error)
    }
  }

  // 백업 데이터 저장 (최대 5개 유지)
  private saveBackupData(recoveryData: RecoveryData): void {
    try {
      const backups = this.getBackupList()

      // 새 백업 추가
      backups.push({
        timestamp: new Date(),
        data: this.options.compressionEnabled
          ? this.compressData(recoveryData)
          : JSON.stringify(recoveryData),
      })

      // 최대 5개만 유지
      if (backups.length > 5) {
        backups.shift()
      }

      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backups))
    } catch (error) {
      console.error('백업 데이터 저장 실패:', error)
    }
  }

  // 백업 목록 가져오기
  private getBackupList(): Array<{ timestamp: Date; data: string }> {
    try {
      const backups = localStorage.getItem(this.BACKUP_KEY)
      if (!backups) return []

      const parsed = JSON.parse(backups)
      return parsed.map((backup: any) => ({
        timestamp: new Date(backup.timestamp),
        data: backup.data,
      }))
    } catch (error) {
      console.error('백업 목록 로드 실패:', error)
      return []
    }
  }

  // 복원 가능한 데이터 확인
  public hasRecoveryData(): boolean {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (!data) return false

      const recoveryData = this.options.compressionEnabled
        ? this.decompressData(data)
        : JSON.parse(data)

      // 복원 데이터 유효성 검사
      if (!recoveryData.contractId || !recoveryData.contractData) {
        return false
      }

      // 최대 복원 나이 확인
      const age = Date.now() - new Date(recoveryData.lastSaved).getTime()
      const maxAge = this.options.maxRecoveryAge! * 60 * 60 * 1000 // 시간을 밀리초로 변환

      return age <= maxAge
    } catch (error) {
      console.error('복원 데이터 확인 실패:', error)
      return false
    }
  }

  // 복원 데이터 가져오기
  public getRecoveryData(): RecoveryData | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (!data) return null

      const recoveryData = this.options.compressionEnabled
        ? this.decompressData(data)
        : JSON.parse(data)

      return recoveryData
    } catch (error) {
      console.error('복원 데이터 로드 실패:', error)
      return null
    }
  }

  // 데이터 복원 실행
  public async recoverData(): Promise<boolean> {
    if (this.isRecovering) {
      console.warn('복원이 이미 진행 중입니다.')
      return false
    }

    try {
      this.isRecovering = true

      const recoveryData = this.getRecoveryData()
      if (!recoveryData) {
        console.log('복원할 데이터가 없습니다.')
        return false
      }

      // 계약서 데이터 복원
      await this.recoverContractData(recoveryData.contractData)

      // 협업 상태 복원
      await this.recoverCollaborationState(recoveryData.collaborationState)

      // 사용자 설정 복원
      this.recoverUserPreferences(recoveryData.userPreferences)

      // 세션 정보 업데이트
      this.updateSessionInfo(recoveryData.sessionInfo)

      console.log('데이터 복원이 완료되었습니다.')
      return true
    } catch (error) {
      console.error('데이터 복원 실패:', error)
      return false
    } finally {
      this.isRecovering = false
    }
  }

  // 계약서 데이터 복원
  private async recoverContractData(contractData: ContractData): Promise<void> {
    // 기존 계약서가 있는지 확인
    const existingContract = this.contractStore.getContractById(contractData.basicInfo.id)

    if (existingContract) {
      // 기존 계약서 업데이트
      this.contractStore.updateContract(contractData.basicInfo.id, contractData)
    } else {
      // 새 계약서 생성
      this.contractStore.updateContract(contractData.basicInfo.id, contractData)
    }

    // 현재 계약서로 설정
    this.contractStore.setCurrentContract(contractData.basicInfo.id)
  }

  // 협업 상태 복원
  private async recoverCollaborationState(collaborationState: any): Promise<void> {
    if (collaborationState.isConnected && this.contractStore.currentContract) {
      // 협업 서비스 재연결
      try {
        // 실제 구현에서는 인증 토큰을 가져와야 함
        const token = localStorage.getItem('access_token')
        const userName = localStorage.getItem('user')
          ? JSON.parse(localStorage.getItem('user')!).name
          : 'Unknown User'

        if (token) {
          await collaborationService.connect(
            this.contractStore.currentContract!.basicInfo.id,
            token,
            userName,
          )
        }
      } catch (error) {
        console.error('협업 상태 복원 실패:', error)
      }
    }
  }

  // 사용자 설정 복원
  private recoverUserPreferences(preferences: any): void {
    // 자동 저장 설정 복원
    this.contractStore.autoSaveEnabled = preferences.autoSave
    this.contractStore.autoSaveInterval = preferences.autoSaveInterval

    // 테마 및 언어 설정 복원
    if (preferences.theme) {
      localStorage.setItem('theme', preferences.theme)
    }
    if (preferences.language) {
      localStorage.setItem('language', preferences.language)
    }
  }

  // 세션 정보 업데이트
  private updateSessionInfo(sessionInfo: any): void {
    const currentSession = {
      startedAt: sessionInfo.startedAt,
      lastActivity: new Date(),
      pageUrl: window.location.href,
    }

    localStorage.setItem(this.SESSION_KEY, JSON.stringify(currentSession))
  }

  // 세션 시작 시간 가져오기
  private getSessionStartTime(): Date {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY)
      if (sessionData) {
        const session = JSON.parse(sessionData)
        return new Date(session.startedAt)
      }
    } catch (error) {
      console.error('세션 정보 로드 실패:', error)
    }

    // 세션이 없으면 현재 시간으로 설정
    const now = new Date()
    localStorage.setItem(
      this.SESSION_KEY,
      JSON.stringify({
        startedAt: now,
        lastActivity: now,
        pageUrl: window.location.href,
      }),
    )
    return now
  }

  // 복원 데이터 삭제
  public clearRecoveryData(): void {
    localStorage.removeItem(this.STORAGE_KEY)
    localStorage.removeItem(this.BACKUP_KEY)
    console.log('복원 데이터가 삭제되었습니다.')
  }

  // 백업 데이터 삭제
  public clearBackupData(): void {
    localStorage.removeItem(this.BACKUP_KEY)
    console.log('백업 데이터가 삭제되었습니다.')
  }

  // 모든 복원 관련 데이터 삭제
  public clearAllRecoveryData(): void {
    this.clearRecoveryData()
    this.clearBackupData()
    localStorage.removeItem(this.SESSION_KEY)
    console.log('모든 복원 관련 데이터가 삭제되었습니다.')
  }

  // 백업 목록 가져오기 (공개 메서드)
  public getBackupHistory(): Array<{ timestamp: Date; contractId: string }> {
    const backups = this.getBackupList()
    return backups.map((backup) => {
      try {
        const data = this.options.compressionEnabled
          ? this.decompressData(backup.data)
          : JSON.parse(backup.data)

        return {
          timestamp: backup.timestamp,
          contractId: data.contractId,
        }
      } catch (error) {
        return {
          timestamp: backup.timestamp,
          contractId: 'unknown',
        }
      }
    })
  }

  // 특정 백업에서 복원
  public async recoverFromBackup(timestamp: Date): Promise<boolean> {
    try {
      const backups = this.getBackupList()
      const backup = backups.find((b) => b.timestamp.getTime() === timestamp.getTime())

      if (!backup) {
        console.error('지정된 백업을 찾을 수 없습니다.')
        return false
      }

      const recoveryData = this.options.compressionEnabled
        ? this.decompressData(backup.data)
        : JSON.parse(backup.data)

      // 복원 실행
      return await this.recoverData()
    } catch (error) {
      console.error('백업에서 복원 실패:', error)
      return false
    }
  }

  // 데이터 압축 (간단한 구현)
  private compressData(data: any): string {
    // 실제 구현에서는 더 효율적인 압축 알고리즘 사용
    return JSON.stringify(data)
  }

  // 데이터 압축 해제
  private decompressData(data: string): any {
    // 실제 구현에서는 더 효율적인 압축 해제 알고리즘 사용
    return JSON.parse(data)
  }

  // 서비스 정리
  public destroy(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval)
      this.backupInterval = null
    }
  }
}

// 싱글톤 인스턴스 생성
export const recoveryService = new RecoveryService()
