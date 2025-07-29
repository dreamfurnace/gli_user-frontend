<template>
  <div class="file-upload-component">
    <div class="input-group">
      <label v-if="label" class="input-label">{{ label }}</label>

      <!-- 파일 업로드 영역 -->
      <div
        ref="dropZone"
        @click="triggerFileInput"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
        class="upload-zone"
        :class="{
          dragging: isDragging,
          disabled: disabled,
          error: hasError,
        }"
      >
        <input
          ref="fileInput"
          type="file"
          :accept="accept"
          :multiple="multiple"
          @change="handleFileSelect"
          class="file-input"
          :disabled="disabled"
        />

        <div class="upload-content">
          <div class="upload-icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7,10 12,15 17,10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </div>
          <div class="upload-text">
            <p class="upload-title">{{ uploadTitle }}</p>
            <p class="upload-description">{{ uploadDescription }}</p>
          </div>
        </div>
      </div>

      <!-- 파일 목록 -->
      <div v-if="files.length > 0" class="file-list">
        <div
          v-for="(file, index) in files"
          :key="file.id"
          class="file-item"
          :class="{
            uploading: file.status === 'uploading',
            success: file.status === 'success',
            error: file.status === 'error',
          }"
        >
          <div class="file-info">
            <div class="file-icon">
              <svg
                v-if="file.type.startsWith('image/')"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21,15 16,10 5,21"></polyline>
              </svg>
              <svg
                v-else-if="file.type.includes('pdf')"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
              </svg>
              <svg
                v-else
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
              </svg>
            </div>
            <div class="file-details">
              <div class="file-name">{{ file.name }}</div>
              <div class="file-size">{{ formatFileSize(file.size) }}</div>
            </div>
          </div>

          <div class="file-actions">
            <!-- 업로드 진행률 -->
            <div v-if="file.status === 'uploading'" class="upload-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: `${file.progress}%` }"></div>
              </div>
              <span class="progress-text">{{ file.progress }}%</span>
            </div>

            <!-- 상태 아이콘 -->
            <div v-else-if="file.status === 'success'" class="status-icon success">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
            </div>

            <div v-else-if="file.status === 'error'" class="status-icon error">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>

            <!-- 삭제 버튼 -->
            <button
              v-if="file.status !== 'uploading'"
              @click="removeFile(index)"
              type="button"
              class="remove-button"
              :disabled="disabled"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="3,6 5,6 21,6"></polyline>
                <path
                  d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 추출된 텍스트 -->
      <div v-if="extractedText" class="extracted-text">
        <div class="extracted-header">
          <h4>추출된 텍스트</h4>
          <button @click="copyText" type="button" class="copy-button">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            복사
          </button>
        </div>
        <div class="text-content">
          <textarea
            v-model="extractedText"
            readonly
            class="text-area"
            :placeholder="'파일에서 추출된 텍스트가 여기에 표시됩니다.'"
          ></textarea>
        </div>
      </div>

      <div v-if="hasError" class="error-message">{{ errorMessage }}</div>
      <div v-if="showHelperText" class="helper-text">{{ helperText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// Props 정의
interface Props {
  modelValue?: File[]
  label?: string
  accept?: string
  multiple?: boolean
  maxFiles?: number
  maxSize?: number // MB
  disabled?: boolean
  required?: boolean
  helperText?: string
  autoExtract?: boolean
  uploadUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  label: '',
  accept: '*/*',
  multiple: false,
  maxFiles: 10,
  maxSize: 10, // 10MB
  disabled: false,
  required: false,
  helperText: '',
  autoExtract: false,
  uploadUrl: '',
})

// Emits 정의
const emit = defineEmits<{
  'update:modelValue': [files: File[]]
  change: [files: File[]]
  upload: [file: File, progress: number]
  success: [file: File, response: any]
  error: [file: File, error: any]
  extract: [text: string]
}>()

// 반응형 상태
const dropZone = ref<HTMLDivElement>()
const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)
const errorMessage = ref('')
const extractedText = ref('')

// 파일 상태 인터페이스
interface FileWithStatus {
  id: string
  file: File
  name: string
  size: number
  type: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

const files = ref<FileWithStatus[]>([])

// 계산된 속성
const hasError = computed(() => errorMessage.value.length > 0)
const showHelperText = computed(() => props.helperText && !hasError.value)

const uploadTitle = computed(() => {
  if (props.multiple) {
    return '파일을 선택하거나 여기에 드래그하세요'
  }
  return '파일을 선택하거나 여기에 드래그하세요'
})

const uploadDescription = computed(() => {
  const sizeText = `최대 ${props.maxSize}MB`
  const countText = props.multiple ? `, 최대 ${props.maxFiles}개` : ''
  return `${sizeText}${countText}`
})

// 파일 크기 포맷팅
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 유효성 검사
const validateFile = (file: File): boolean => {
  errorMessage.value = ''

  // 파일 크기 검사
  if (file.size > props.maxSize * 1024 * 1024) {
    errorMessage.value = `파일 크기는 ${props.maxSize}MB 이하여야 합니다.`
    return false
  }

  // 파일 개수 검사
  if (props.multiple && files.value.length >= props.maxFiles) {
    errorMessage.value = `최대 ${props.maxFiles}개의 파일만 업로드할 수 있습니다.`
    return false
  }

  // 파일 타입 검사 (accept가 지정된 경우)
  if (props.accept !== '*/*') {
    const acceptedTypes = props.accept.split(',').map((type) => type.trim())
    const isValidType = acceptedTypes.some((type) => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase())
      }
      return file.type.match(new RegExp(type.replace('*', '.*')))
    })

    if (!isValidType) {
      errorMessage.value = '지원하지 않는 파일 형식입니다.'
      return false
    }
  }

  return true
}

// 파일 추가
const addFile = (file: File) => {
  if (!validateFile(file)) return

  const fileWithStatus: FileWithStatus = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    status: 'pending',
    progress: 0,
  }

  files.value.push(fileWithStatus)

  // 자동 업로드
  if (props.uploadUrl) {
    uploadFile(fileWithStatus)
  }

  // 자동 텍스트 추출
  if (props.autoExtract) {
    extractTextFromFile(file)
  }

  emitChange()
}

// 파일 업로드
const uploadFile = async (fileWithStatus: FileWithStatus) => {
  fileWithStatus.status = 'uploading'

  try {
    const formData = new FormData()
    formData.append('file', fileWithStatus.file)

    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100)
        fileWithStatus.progress = progress
        emit('upload', fileWithStatus.file, progress)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        fileWithStatus.status = 'success'
        fileWithStatus.progress = 100
        emit('success', fileWithStatus.file, JSON.parse(xhr.responseText))
      } else {
        throw new Error(`Upload failed with status ${xhr.status}`)
      }
    })

    xhr.addEventListener('error', () => {
      fileWithStatus.status = 'error'
      fileWithStatus.error = '업로드 중 오류가 발생했습니다.'
      emit('error', fileWithStatus.file, new Error('Upload failed'))
    })

    xhr.open('POST', props.uploadUrl)
    xhr.send(formData)
  } catch (error) {
    fileWithStatus.status = 'error'
    fileWithStatus.error = '업로드 중 오류가 발생했습니다.'
    emit('error', fileWithStatus.file, error)
  }
}

// 텍스트 추출
const extractTextFromFile = async (file: File) => {
  try {
    let text = ''

    if (file.type.startsWith('text/')) {
      text = await file.text()
    } else if (file.type.includes('pdf')) {
      // PDF 텍스트 추출 (실제 구현에서는 PDF.js 등 사용)
      text = 'PDF 파일에서 텍스트를 추출하는 기능은 별도 라이브러리가 필요합니다.'
    } else if (file.type.startsWith('image/')) {
      // 이미지 OCR (실제 구현에서는 Tesseract.js 등 사용)
      text = '이미지에서 텍스트를 추출하는 기능은 별도 라이브러리가 필요합니다.'
    }

    if (text) {
      extractedText.value = text
      emit('extract', text)
    }
  } catch (error) {
    console.error('텍스트 추출 실패:', error)
  }
}

// 파일 제거
const removeFile = (index: number) => {
  files.value.splice(index, 1)
  emitChange()
}

// 텍스트 복사
const copyText = async () => {
  try {
    await navigator.clipboard.writeText(extractedText.value)
    // 복사 성공 알림 (실제 구현에서는 토스트 메시지 등 사용)
  } catch (error) {
    console.error('텍스트 복사 실패:', error)
  }
}

// 이벤트 핸들러들
const triggerFileInput = () => {
  if (!props.disabled) {
    fileInput.value?.click()
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const selectedFiles = Array.from(target.files || [])

  if (props.multiple) {
    selectedFiles.forEach((file) => addFile(file))
  } else {
    if (selectedFiles.length > 0) {
      files.value = [] // 기존 파일 제거
      addFile(selectedFiles[0])
    }
  }

  // 입력 초기화
  target.value = ''
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (!props.disabled) {
    isDragging.value = true
  }
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false

  if (props.disabled) return

  const droppedFiles = Array.from(event.dataTransfer?.files || [])

  if (props.multiple) {
    droppedFiles.forEach((file) => addFile(file))
  } else {
    if (droppedFiles.length > 0) {
      files.value = [] // 기존 파일 제거
      addFile(droppedFiles[0])
    }
  }
}

const emitChange = () => {
  const fileList = files.value.map((f) => f.file)
  emit('update:modelValue', fileList)
  emit('change', fileList)
}

// 감시자
watch(
  () => props.modelValue,
  (newFiles) => {
    if (newFiles && newFiles.length > 0) {
      // 외부에서 파일이 추가된 경우 처리
      newFiles.forEach((file) => {
        const exists = files.value.some((f) => f.file === file)
        if (!exists) {
          addFile(file)
        }
      })
    }
  },
  { deep: true },
)

// 외부에서 접근 가능한 메서드들
defineExpose({
  addFile,
  removeFile,
  clearFiles: () => {
    files.value = []
    emitChange()
  },
  uploadAll: () => {
    files.value.forEach((file) => {
      if (file.status === 'pending' && props.uploadUrl) {
        uploadFile(file)
      }
    })
  },
  getFiles: () => files.value,
  getExtractedText: () => extractedText.value,
})
</script>

<style scoped>
.file-upload-component {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.input-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.upload-zone {
  position: relative;
  border: 2px dashed var(--color-border);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-xl);
  text-align: center;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.upload-zone:hover:not(.disabled) {
  border-color: var(--color-primary);
  background-color: var(--color-primary-light);
}

.upload-zone.dragging {
  border-color: var(--color-primary);
  background-color: var(--color-primary-light);
}

.upload-zone.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.upload-zone.error {
  border-color: var(--color-danger);
  background-color: var(--color-danger-light);
}

.file-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

.upload-icon {
  color: var(--color-text-secondary);
}

.upload-title {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin: 0;
}

.upload-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  background-color: var(--color-white);
  transition: border-color 0.2s ease;
}

.file-item.uploading {
  border-color: var(--color-primary);
}

.file-item.success {
  border-color: var(--color-success);
}

.file-item.error {
  border-color: var(--color-danger);
}

.file-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
}

.file-icon {
  color: var(--color-text-secondary);
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.file-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.file-size {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.file-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.upload-progress {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  min-width: 120px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background-color: var(--color-gray-200);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-primary);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  min-width: 30px;
}

.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.status-icon.success {
  color: var(--color-success);
}

.status-icon.error {
  color: var(--color-danger);
}

.remove-button {
  padding: var(--spacing-xs);
  border: none;
  background: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.remove-button:hover:not(:disabled) {
  color: var(--color-danger);
  background-color: var(--color-danger-light);
}

.extracted-text {
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  background-color: var(--color-white);
}

.extracted-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border);
}

.extracted-header h4 {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.copy-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-border);
  background-color: var(--color-white);
  color: var(--color-text-primary);
  font-size: var(--font-size-xs);
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.copy-button:hover {
  background-color: var(--color-primary-light);
  border-color: var(--color-primary);
}

.text-content {
  padding: var(--spacing-sm);
}

.text-area {
  width: 100%;
  min-height: 120px;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  font-family: monospace;
  resize: vertical;
  background-color: var(--color-gray-50);
}

.text-area:focus {
  outline: none;
  border-color: var(--color-primary);
}

.error-message {
  font-size: var(--font-size-xs);
  color: var(--color-danger);
}

.helper-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .upload-zone {
    padding: var(--spacing-lg);
  }

  .file-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .file-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
