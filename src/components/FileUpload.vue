<template>
  <div class="file-upload-container">
    <div
      class="upload-area"
      @drop="handleDrop"
      @dragover.prevent
      @dragenter.prevent
      :class="{ 'drag-over': isDragOver, uploading: isUploading }"
    >
      <div class="upload-content">
        <div class="upload-icon">📁</div>
        <h3>파일을 여기에 드래그하거나 클릭하여 업로드</h3>
        <p>PDF, Word, Excel, 이미지 파일 등 (최대 50MB)</p>
        <input
          ref="fileInput"
          type="file"
          multiple
          @change="handleFileSelect"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.zip,.rar"
          class="file-input"
        />
        <button @click="triggerFileSelect" class="select-btn" :disabled="isUploading">
          파일 선택
        </button>
      </div>
    </div>

    <!-- 업로드 진행 상황 -->
    <div v-if="uploadProgress.length > 0" class="upload-progress">
      <h4>업로드 진행 상황</h4>
      <div v-for="file in uploadProgress" :key="file.id" class="progress-item">
        <div class="file-info">
          <span class="file-name">{{ file.name }}</span>
          <span class="file-size">{{ formatFileSize(file.size) }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: file.progress + '%' }"></div>
        </div>
        <div class="progress-status">
          <span v-if="file.status === 'uploading'">{{ file.progress }}%</span>
          <span v-else-if="file.status === 'success'" class="success">완료</span>
          <span v-else-if="file.status === 'error'" class="error">실패</span>
        </div>
      </div>
    </div>

    <!-- 업로드된 파일 목록 -->
    <div v-if="uploadedFiles.length > 0" class="uploaded-files">
      <h4>업로드된 파일</h4>
      <div v-for="file in uploadedFiles" :key="file.id" class="file-item">
        <div class="file-icon">
          {{ getFileIcon(file.file_name) }}
        </div>
        <div class="file-details">
          <div class="file-name">{{ file.file_name }}</div>
          <div class="file-meta">
            <span class="file-type">{{ file.doc_type }}</span>
            <span class="file-date">{{ formatDate(file.upload_date) }}</span>
          </div>
        </div>
        <div class="file-actions">
          <button @click="downloadFile(file)" class="action-btn download">📥 다운로드</button>
          <button @click="deleteFile(file)" class="action-btn delete">🗑️ 삭제</button>
        </div>
      </div>
    </div>

    <!-- 에러 메시지 -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/services/api'

interface UploadFile {
  id: string
  name: string
  size: number
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
}

interface UploadedFile {
  id: string
  file_name: string
  file_url: string
  doc_type: string
  upload_date: string
  file_size?: string
}

interface Props {
  contractId?: string
  directory?: string
}

const props = withDefaults(defineProps<Props>(), {
  directory: 'documents',
})

const emit = defineEmits<{
  uploadComplete: [files: UploadedFile[]]
  uploadError: [error: string]
}>()

const authStore = useAuthStore()

// 상태
const isDragOver = ref(false)
const isUploading = ref(false)
const uploadProgress = ref<UploadFile[]>([])
const uploadedFiles = ref<UploadedFile[]>([])
const error = ref('')
const fileInput = ref<HTMLInputElement>()

// 파일 선택 트리거
const triggerFileSelect = () => {
  fileInput.value?.click()
}

// 파일 선택 처리
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files) {
    handleFiles(Array.from(files))
  }
}

// 드래그 앤 드롭 처리
const handleDrop = (event: DragEvent) => {
  isDragOver.value = false
  const files = event.dataTransfer?.files
  if (files) {
    handleFiles(Array.from(files))
  }
}

// 파일 처리
const handleFiles = (files: File[]) => {
  if (files.length === 0) return

  // 파일 검증
  const validFiles = files.filter((file) => {
    if (file.size > 50 * 1024 * 1024) {
      // 50MB
      error.value = `${file.name} 파일이 너무 큽니다. 최대 50MB까지 업로드 가능합니다.`
      return false
    }
    return true
  })

  if (validFiles.length === 0) return

  // 업로드 진행 상황 초기화
  uploadProgress.value = validFiles.map((file) => ({
    id: Math.random().toString(36).substr(2, 9),
    name: file.name,
    size: file.size,
    progress: 0,
    status: 'uploading' as const,
  }))

  isUploading.value = true
  error.value = ''

  // 파일 업로드
  uploadFiles(validFiles)
}

// 파일 업로드
const uploadFiles = async (files: File[]) => {
  try {
    const formData = new FormData()

    files.forEach((file) => {
      formData.append('files', file)
    })

    if (props.contractId) {
      formData.append('contract', props.contractId)
    }
    formData.append('directory', props.directory)

    const response = await apiClient.post('/files/upload-multiple/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          uploadProgress.value.forEach((file) => {
            file.progress = progress
          })
        }
      },
    })

    // 업로드 성공
    const newFiles = response.data.documents
    uploadedFiles.value.push(...newFiles)

    // 진행 상황 업데이트
    uploadProgress.value.forEach((file) => {
      file.status = 'success'
      file.progress = 100
    })

    // 이벤트 발생
    emit('uploadComplete', newFiles)

    // 3초 후 진행 상황 제거
    setTimeout(() => {
      uploadProgress.value = []
      isUploading.value = false
    }, 3000)
  } catch (err: any) {
    console.error('File upload error:', err)
    error.value = err.response?.data?.error || '파일 업로드 중 오류가 발생했습니다.'

    // 진행 상황 업데이트
    uploadProgress.value.forEach((file) => {
      file.status = 'error'
      file.error = error.value
    })

    emit('uploadError', error.value)

    setTimeout(() => {
      uploadProgress.value = []
      isUploading.value = false
    }, 3000)
  }
}

// 파일 다운로드
const downloadFile = async (file: UploadedFile) => {
  try {
    const response = await apiClient.get(`/files/download/${file.id}/`, {
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', file.file_name)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('File download error:', err)
    error.value = '파일 다운로드 중 오류가 발생했습니다.'
  }
}

// 파일 삭제
const deleteFile = async (file: UploadedFile) => {
  if (!confirm('정말로 이 파일을 삭제하시겠습니까?')) return

  try {
    await apiClient.delete(`/files/delete/${file.id}/`)

    // 목록에서 제거
    uploadedFiles.value = uploadedFiles.value.filter((f) => f.id !== file.id)
  } catch (err) {
    console.error('File delete error:', err)
    error.value = '파일 삭제 중 오류가 발생했습니다.'
  }
}

// 파일 아이콘 가져오기
const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase()

  const icons: { [key: string]: string } = {
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    xls: '📊',
    xlsx: '📊',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    txt: '📄',
    zip: '📦',
    rar: '📦',
  }

  return icons[ext || ''] || '📄'
}

// 파일 크기 포맷팅
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i]
}

// 날짜 포맷팅
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ko-KR')
}

// 기존 파일 목록 로드
const loadExistingFiles = async () => {
  try {
    const params: any = {}
    if (props.contractId) params.contract = props.contractId

    const response = await apiClient.get('/files/user-files/', { params })
    uploadedFiles.value = response.data.documents
  } catch (err) {
    console.error('Failed to load existing files:', err)
  }
}

onMounted(() => {
  loadExistingFiles()
})
</script>

<style scoped>
.file-upload-container {
  width: 100%;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  transition: all 0.3s ease;
  background: #f8f9fa;
  cursor: pointer;
}

.upload-area:hover {
  border-color: #007bff;
  background: #f0f8ff;
}

.upload-area.drag-over {
  border-color: #007bff;
  background: #e3f2fd;
}

.upload-area.uploading {
  opacity: 0.7;
  pointer-events: none;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-icon {
  font-size: 48px;
  color: #666;
}

.upload-content h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.upload-content p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.file-input {
  display: none;
}

.select-btn {
  padding: 12px 24px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s;
}

.select-btn:hover:not(:disabled) {
  background: #0056b3;
}

.select-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.upload-progress {
  margin-top: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.upload-progress h4 {
  margin: 0 0 16px 0;
  color: #333;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  display: block;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 12px;
  color: #666;
}

.progress-bar {
  width: 100px;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #007bff;
  transition: width 0.3s ease;
}

.progress-status {
  min-width: 60px;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
}

.progress-status .success {
  color: #28a745;
}

.progress-status .error {
  color: #dc3545;
}

.uploaded-files {
  margin-top: 20px;
}

.uploaded-files h4 {
  margin: 0 0 16px 0;
  color: #333;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  margin-bottom: 8px;
}

.file-icon {
  font-size: 24px;
  width: 40px;
  text-align: center;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-details .file-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.file-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}

.file-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.3s;
}

.action-btn.download {
  background: #28a745;
  color: white;
}

.action-btn.download:hover {
  background: #218838;
}

.action-btn.delete {
  background: #dc3545;
  color: white;
}

.action-btn.delete:hover {
  background: #c82333;
}

.error-message {
  margin-top: 16px;
  padding: 12px;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  font-size: 14px;
}
</style>
