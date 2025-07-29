import { ref, watch, type Ref } from 'vue'
import { useContractStore, type ContractData } from '@/stores/contractStore'

export interface AutoSaveOptions {
  debounceMs?: number
  enableLocalBackup?: boolean
  enableServerBackup?: boolean
  maxRetries?: number
  retryDelayMs?: number
}

export interface SaveStatus {
  isSaving: boolean
  lastSaved: Date | null
  lastError: string | null
  saveCount: number
  pendingChanges: boolean
}

export class AutoSaveService {
  private store = useContractStore()
  private saveTimeout: NodeJS.Timeout | null = null
  private options: Required<AutoSaveOptions>
  private saveStatus: Ref<SaveStatus>

  constructor(options: AutoSaveOptions = {}) {
    this.options = {
      debounceMs: 2000,
      enableLocalBackup: true,
      enableServerBackup: false,
      maxRetries: 3,
      retryDelayMs: 1000,
      ...options,
    }

    this.saveStatus = ref<SaveStatus>({
      isSaving: false,
      lastSaved: null,
      lastError: null,
      saveCount: 0,
      pendingChanges: false,
    })

    this.initializeAutoSave()
  }

  private initializeAutoSave(): void {
    // 계약서 데이터 변경 감지
    watch(
      () => this.store.currentContract,
      (newContract, oldContract) => {
        if (newContract && newContract !== oldContract) {
          this.scheduleSave()
        }
      },
      { deep: true },
    )

    // 개별 필드 변경 감지
    watch(
      () => this.store.currentContract?.propertyInfo,
      () => this.scheduleSave(),
      { deep: true },
    )

    watch(
      () => this.store.currentContract?.parties,
      () => this.scheduleSave(),
      { deep: true },
    )

    watch(
      () => this.store.currentContract?.financial,
      () => this.scheduleSave(),
      { deep: true },
    )

    watch(
      () => this.store.currentContract?.legal,
      () => this.scheduleSave(),
      { deep: true },
    )

    watch(
      () => this.store.currentContract?.documents,
      () => this.scheduleSave(),
      { deep: true },
    )

    watch(
      () => this.store.currentContract?.agreements,
      () => this.scheduleSave(),
      { deep: true },
    )

    // 페이지 언로드 시 강제 저장
    window.addEventListener('beforeunload', () => {
      this.forceSave()
    })

    // 브라우저 포커스 시 저장 상태 확인
    window.addEventListener('focus', () => {
      this.checkPendingChanges()
    })
  }

  private scheduleSave(): void {
    this.saveStatus.value.pendingChanges = true

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }

    this.saveTimeout = setTimeout(() => {
      this.performSave()
    }, this.options.debounceMs)
  }

  private async performSave(retryCount = 0): Promise<void> {
    if (!this.store.currentContract) {
      this.saveStatus.value.pendingChanges = false
      return
    }

    this.saveStatus.value.isSaving = true
    this.saveStatus.value.lastError = null

    try {
      // 로컬 스토리지 백업
      if (this.options.enableLocalBackup) {
        await this.saveToLocalStorage()
      }

      // 서버 백업 (구현 예정)
      if (this.options.enableServerBackup) {
        await this.saveToServer()
      }

      // 스토어 업데이트
      if (this.store.currentContract) {
        this.store.updateContract(
          this.store.currentContract.basicInfo.id,
          this.store.currentContract,
        )
      }

      this.saveStatus.value.lastSaved = new Date()
      this.saveStatus.value.saveCount++
      this.saveStatus.value.pendingChanges = false
      this.saveStatus.value.isSaving = false

      console.log(`✅ 자동 저장 완료: ${this.saveStatus.value.lastSaved.toLocaleTimeString()}`)
    } catch (error) {
      this.saveStatus.value.lastError = error instanceof Error ? error.message : '알 수 없는 오류'
      this.saveStatus.value.isSaving = false

      console.error('❌ 자동 저장 실패:', error)

      // 재시도 로직
      if (retryCount < this.options.maxRetries) {
        console.log(
          `${this.options.retryDelayMs}ms 후 재시도... (${retryCount + 1}/${this.options.maxRetries})`,
        )
        setTimeout(() => {
          this.performSave(retryCount + 1)
        }, this.options.retryDelayMs)
      } else {
        console.error('최대 재시도 횟수 초과')
      }
    }
  }

  private async saveToLocalStorage(): Promise<void> {
    const contract = this.store.currentContract
    if (!contract) return

    const backupData = {
      contract,
      timestamp: new Date().toISOString(),
      version: '1.0',
    }

    const key = `contract_backup_${contract.id}`
    localStorage.setItem(key, JSON.stringify(backupData))

    // 백업 히스토리 관리 (최대 10개)
    const historyKey = `contract_history_${contract.id}`
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]')
    history.unshift(backupData)

    if (history.length > 10) {
      history.pop()
    }

    localStorage.setItem(historyKey, JSON.stringify(history))
  }

  private async saveToServer(): Promise<void> {
    // TODO: 서버 API 구현 시 추가
    // const response = await fetch('/api/contracts/auto-save', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(this.store.currentContract)
    // })
    //
    // if (!response.ok) {
    //   throw new Error('서버 저장 실패')
    // }
  }

  public async forceSave(): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }
    await this.performSave()
  }

  public async restoreFromBackup(contractId: string): Promise<ContractData | null> {
    const key = `contract_backup_${contractId}`
    const backupData = localStorage.getItem(key)

    if (!backupData) return null

    try {
      const parsed = JSON.parse(backupData)
      return parsed.contract
    } catch (error) {
      console.error('백업 복원 실패:', error)
      return null
    }
  }

  public getBackupHistory(
    contractId: string,
  ): Array<{ contract: ContractData; timestamp: string }> {
    const historyKey = `contract_history_${contractId}`
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]')
    return history
  }

  private checkPendingChanges(): void {
    if (this.saveStatus.value.pendingChanges) {
      console.log('📝 저장되지 않은 변경사항이 있습니다. 자동 저장을 실행합니다.')
      this.forceSave()
    }
  }

  public getSaveStatus(): Ref<SaveStatus> {
    return this.saveStatus
  }

  public pauseAutoSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }
  }

  public resumeAutoSave(): void {
    if (this.saveStatus.value.pendingChanges) {
      this.scheduleSave()
    }
  }

  public destroy(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }
    window.removeEventListener('beforeunload', () => this.forceSave())
    window.removeEventListener('focus', () => this.checkPendingChanges())
  }
}

// 싱글톤 인스턴스
let autoSaveInstance: AutoSaveService | null = null

export function useAutoSave(options?: AutoSaveOptions): AutoSaveService {
  if (!autoSaveInstance) {
    autoSaveInstance = new AutoSaveService(options)
  }
  return autoSaveInstance
}

export function destroyAutoSave(): void {
  if (autoSaveInstance) {
    autoSaveInstance.destroy()
    autoSaveInstance = null
  }
}
