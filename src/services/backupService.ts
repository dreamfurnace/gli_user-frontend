import { useContractStore } from '@/stores/contractStore'
import { recoveryService } from './recoveryService'

export interface BackupData {
  id: string
  name: string
  description?: string
  timestamp: Date
  size: number
  version: string
  data: {
    contracts: any
    recovery: any
    userPreferences: any
    collaboration: any
  }
  metadata: {
    contractCount: number
    totalSize: number
    compressionRatio: number
    checksum: string
  }
}

export interface BackupOptions {
  enableCompression?: boolean
  enableEncryption?: boolean
  maxBackups?: number
  autoBackupInterval?: number // 분 단위
  backupRetentionDays?: number
}

export interface BackupProgress {
  stage: 'preparing' | 'compressing' | 'encrypting' | 'saving' | 'complete'
  progress: number // 0-100
  message: string
}

class BackupService {
  private contractStore = useContractStore()
  private readonly BACKUP_KEY = 'gli_backups'
  private readonly BACKUP_VERSION = '1.0.0'

  private options: BackupOptions = {
    enableCompression: true,
    enableEncryption: false,
    maxBackups: 10,
    autoBackupInterval: 30, // 30분
    backupRetentionDays: 30, // 30일
  }

  private autoBackupInterval: NodeJS.Timeout | null = null
  private isBackingUp = false

  constructor(options?: BackupOptions) {
    if (options) {
      this.options = { ...this.options, ...options }
    }

    this.setupAutoBackup()
    this.cleanupOldBackups()
  }

  // 자동 백업 설정
  private setupAutoBackup(): void {
    if (this.options.autoBackupInterval && this.options.autoBackupInterval > 0) {
      this.autoBackupInterval = setInterval(
        () => {
          this.createBackup('자동 백업')
        },
        this.options.autoBackupInterval * 60 * 1000,
      )
    }
  }

  // 백업 생성
  public async createBackup(
    name: string,
    description?: string,
    onProgress?: (progress: BackupProgress) => void,
  ): Promise<BackupData> {
    if (this.isBackingUp) {
      throw new Error('백업이 이미 진행 중입니다.')
    }

    try {
      this.isBackingUp = true

      // 1. 준비 단계
      onProgress?.({
        stage: 'preparing',
        progress: 10,
        message: '백업 데이터를 준비하고 있습니다...',
      })

      const backupData = await this.prepareBackupData(name, description)

      // 2. 압축 단계
      if (this.options.enableCompression) {
        onProgress?.({
          stage: 'compressing',
          progress: 30,
          message: '데이터를 압축하고 있습니다...',
        })

        backupData.data = await this.compressData(backupData.data)
        backupData.metadata.compressionRatio = this.calculateCompressionRatio(backupData.data)
      }

      // 3. 암호화 단계
      if (this.options.enableEncryption) {
        onProgress?.({
          stage: 'encrypting',
          progress: 60,
          message: '데이터를 암호화하고 있습니다...',
        })

        backupData.data = await this.encryptData(backupData.data)
      }

      // 4. 저장 단계
      onProgress?.({
        stage: 'saving',
        progress: 80,
        message: '백업을 저장하고 있습니다...',
      })

      await this.saveBackup(backupData)

      // 5. 완료
      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: '백업이 완료되었습니다.',
      })

      // 오래된 백업 정리
      this.cleanupOldBackups()

      console.log(`백업이 생성되었습니다: ${backupData.name}`)
      return backupData
    } catch (error) {
      console.error('백업 생성 실패:', error)
      throw error
    } finally {
      this.isBackingUp = false
    }
  }

  // 백업 데이터 준비
  private async prepareBackupData(name: string, description?: string): Promise<BackupData> {
    const contracts = this.contractStore.getAllContracts()
    const recoveryData = recoveryService.getRecoveryData()

    // 사용자 설정 수집
    const userPreferences = {
      theme: localStorage.getItem('theme') || 'light',
      language: localStorage.getItem('language') || 'ko',
      autoSave: this.contractStore.autoSaveEnabled,
      autoSaveInterval: this.contractStore.autoSaveInterval,
    }

    // 협업 데이터 수집
    const collaborationData = {
      participants: [],
      lastSyncTimestamp: 0,
    }

    const data = {
      contracts: contracts,
      recovery: recoveryData,
      userPreferences: userPreferences,
      collaboration: collaborationData,
    }

    const backupData: BackupData = {
      id: this.generateBackupId(),
      name,
      description,
      timestamp: new Date(),
      size: 0,
      version: this.BACKUP_VERSION,
      data,
      metadata: {
        contractCount: contracts.length,
        totalSize: 0,
        compressionRatio: 1.0,
        checksum: '',
      },
    }

    // 크기 및 체크섬 계산
    const dataString = JSON.stringify(data)
    backupData.size = new Blob([dataString]).size
    backupData.metadata.totalSize = backupData.size
    backupData.metadata.checksum = await this.calculateChecksum(dataString)

    return backupData
  }

  // 백업 저장
  private async saveBackup(backupData: BackupData): Promise<void> {
    try {
      const backups = this.getBackupList()

      // 새 백업 추가
      backups.push(backupData)

      // 최대 백업 개수 제한
      if (backups.length > this.options.maxBackups!) {
        backups.splice(0, backups.length - this.options.maxBackups!)
      }

      // 로컬 스토리지에 저장
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backups))
    } catch (error) {
      console.error('백업 저장 실패:', error)
      throw error
    }
  }

  // 백업 목록 가져오기
  public getBackupList(): BackupData[] {
    try {
      const data = localStorage.getItem(this.BACKUP_KEY)
      if (!data) return []

      const backups = JSON.parse(data)
      return backups.map((backup: any) => ({
        ...backup,
        timestamp: new Date(backup.timestamp),
      }))
    } catch (error) {
      console.error('백업 목록 로드 실패:', error)
      return []
    }
  }

  // 특정 백업 가져오기
  public getBackup(backupId: string): BackupData | null {
    const backups = this.getBackupList()
    return backups.find((backup) => backup.id === backupId) || null
  }

  // 백업에서 복원
  public async restoreFromBackup(
    backupId: string,
    onProgress?: (progress: BackupProgress) => void,
  ): Promise<boolean> {
    try {
      const backup = this.getBackup(backupId)
      if (!backup) {
        throw new Error('백업을 찾을 수 없습니다.')
      }

      onProgress?.({
        stage: 'preparing',
        progress: 20,
        message: '백업 데이터를 준비하고 있습니다...',
      })

      let data = backup.data

      // 암호화 해제
      if (this.options.enableEncryption) {
        onProgress?.({
          stage: 'encrypting',
          progress: 40,
          message: '데이터를 복호화하고 있습니다...',
        })
        data = await this.decryptData(data)
      }

      // 압축 해제
      if (this.options.enableCompression && backup.metadata.compressionRatio < 1.0) {
        onProgress?.({
          stage: 'compressing',
          progress: 60,
          message: '데이터를 압축 해제하고 있습니다...',
        })
        data = await this.decompressData(data)
      }

      onProgress?.({
        stage: 'saving',
        progress: 80,
        message: '데이터를 복원하고 있습니다...',
      })

      // 데이터 복원
      await this.restoreData(data)

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: '복원이 완료되었습니다.',
      })

      console.log(`백업에서 복원되었습니다: ${backup.name}`)
      return true
    } catch (error) {
      console.error('백업 복원 실패:', error)
      throw error
    }
  }

  // 데이터 복원
  private async restoreData(data: any): Promise<void> {
    // 계약서 데이터 복원
    if (data.contracts) {
      const contractStore = useContractStore()

      // 기존 계약서 삭제
      const existingContracts = contractStore.getAllContracts()
      existingContracts.forEach((contract) => {
        contractStore.deleteContract(contract.basicInfo.id)
      })

      // 새 계약서 추가
      data.contracts.forEach((contract: any) => {
        contractStore.updateContract(contract.basicInfo.id, contract)
      })
    }

    // 사용자 설정 복원
    if (data.userPreferences) {
      const contractStore = useContractStore()
      contractStore.autoSaveEnabled = data.userPreferences.autoSave
      contractStore.autoSaveInterval = data.userPreferences.autoSaveInterval

      if (data.userPreferences.theme) {
        localStorage.setItem('theme', data.userPreferences.theme)
      }
      if (data.userPreferences.language) {
        localStorage.setItem('language', data.userPreferences.language)
      }
    }

    // 복원 데이터 복원
    if (data.recovery) {
      // recoveryService를 통해 복원
      // 실제 구현에서는 recoveryService의 메서드를 호출
    }
  }

  // 백업 삭제
  public deleteBackup(backupId: string): boolean {
    try {
      const backups = this.getBackupList()
      const index = backups.findIndex((backup) => backup.id === backupId)

      if (index === -1) {
        return false
      }

      backups.splice(index, 1)
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backups))

      console.log(`백업이 삭제되었습니다: ${backupId}`)
      return true
    } catch (error) {
      console.error('백업 삭제 실패:', error)
      return false
    }
  }

  // 모든 백업 삭제
  public deleteAllBackups(): boolean {
    try {
      localStorage.removeItem(this.BACKUP_KEY)
      console.log('모든 백업이 삭제되었습니다.')
      return true
    } catch (error) {
      console.error('백업 삭제 실패:', error)
      return false
    }
  }

  // 오래된 백업 정리
  private cleanupOldBackups(): void {
    if (!this.options.backupRetentionDays) return

    try {
      const backups = this.getBackupList()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - this.options.backupRetentionDays)

      const validBackups = backups.filter((backup) => backup.timestamp > cutoffDate)

      if (validBackups.length !== backups.length) {
        localStorage.setItem(this.BACKUP_KEY, JSON.stringify(validBackups))
        console.log(`${backups.length - validBackups.length}개의 오래된 백업이 정리되었습니다.`)
      }
    } catch (error) {
      console.error('백업 정리 실패:', error)
    }
  }

  // 백업 내보내기 (파일 다운로드)
  public exportBackup(backupId: string): void {
    try {
      const backup = this.getBackup(backupId)
      if (!backup) {
        throw new Error('백업을 찾을 수 없습니다.')
      }

      const dataStr = JSON.stringify(backup, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })

      const link = document.createElement('a')
      link.href = URL.createObjectURL(dataBlob)
      link.download = `gli_backup_${backup.name}_${backup.timestamp.toISOString().split('T')[0]}.json`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      console.log(`백업이 내보내졌습니다: ${backup.name}`)
    } catch (error) {
      console.error('백업 내보내기 실패:', error)
      throw error
    }
  }

  // 백업 가져오기 (파일 업로드)
  public async importBackup(file: File): Promise<BackupData> {
    try {
      const text = await file.text()
      const backupData: BackupData = JSON.parse(text)

      // 백업 데이터 유효성 검사
      if (!this.validateBackupData(backupData)) {
        throw new Error('유효하지 않은 백업 파일입니다.')
      }

      // 백업 ID 재생성
      backupData.id = this.generateBackupId()
      backupData.timestamp = new Date()

      // 백업 저장
      await this.saveBackup(backupData)

      console.log(`백업이 가져와졌습니다: ${backupData.name}`)
      return backupData
    } catch (error) {
      console.error('백업 가져오기 실패:', error)
      throw error
    }
  }

  // 백업 데이터 유효성 검사
  private validateBackupData(backupData: any): boolean {
    return (
      backupData &&
      backupData.id &&
      backupData.name &&
      backupData.timestamp &&
      backupData.data &&
      backupData.version
    )
  }

  // 백업 통계 가져오기
  public getBackupStats(): {
    totalBackups: number
    totalSize: number
    oldestBackup: Date | null
    newestBackup: Date | null
    averageSize: number
  } {
    const backups = this.getBackupList()

    if (backups.length === 0) {
      return {
        totalBackups: 0,
        totalSize: 0,
        oldestBackup: null,
        newestBackup: null,
        averageSize: 0,
      }
    }

    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0)
    const timestamps = backups.map((backup) => backup.timestamp)

    return {
      totalBackups: backups.length,
      totalSize,
      oldestBackup: new Date(Math.min(...timestamps.map((t) => t.getTime()))),
      newestBackup: new Date(Math.max(...timestamps.map((t) => t.getTime()))),
      averageSize: totalSize / backups.length,
    }
  }

  // 유틸리티 메서드들
  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async calculateChecksum(data: string): Promise<string> {
    // 간단한 체크섬 계산 (실제로는 더 안전한 알고리즘 사용)
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // 32bit 정수로 변환
    }
    return hash.toString(16)
  }

  private calculateCompressionRatio(data: any): number {
    const originalSize = JSON.stringify(data).length
    const compressedSize = new Blob([JSON.stringify(data)]).size
    return compressedSize / originalSize
  }

  // 데이터 압축 (간단한 구현)
  private async compressData(data: any): Promise<any> {
    // 실제 구현에서는 더 효율적인 압축 알고리즘 사용
    return data
  }

  // 데이터 압축 해제
  private async decompressData(data: any): Promise<any> {
    // 실제 구현에서는 더 효율적인 압축 해제 알고리즘 사용
    return data
  }

  // 데이터 암호화 (간단한 구현)
  private async encryptData(data: any): Promise<any> {
    // 실제 구현에서는 안전한 암호화 알고리즘 사용
    return data
  }

  // 데이터 복호화
  private async decryptData(data: any): Promise<any> {
    // 실제 구현에서는 안전한 복호화 알고리즘 사용
    return data
  }

  // 서비스 정리
  public destroy(): void {
    if (this.autoBackupInterval) {
      clearInterval(this.autoBackupInterval)
      this.autoBackupInterval = null
    }
  }
}

// 싱글톤 인스턴스 생성
export const backupService = new BackupService()
