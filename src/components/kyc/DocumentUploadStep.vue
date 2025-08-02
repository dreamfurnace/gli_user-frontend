<template>
  <div class="document-upload-step">
    <div class="step-description">
      <h4>{{ getDocumentTitle() }}</h4>
      <p>{{ getDocumentDescription() }}</p>
    </div>

    <div class="upload-section">
      <!-- Document Type Selection -->
      <div v-if="documentType === 'identity'" class="document-type-selection">
        <label class="form-label">신분증 유형 선택</label>
        <div class="type-options">
          <label 
            v-for="option in identityDocumentOptions" 
            :key="option.value"
            class="type-option"
            :class="{ active: selectedDocumentType === option.value }"
          >
            <input 
              type="radio" 
              :value="option.value"
              v-model="selectedDocumentType"
              :disabled="isLoading || isCompleted"
            />
            <div class="option-content">
              <div class="option-icon">{{ option.icon }}</div>
              <div class="option-text">{{ option.label }}</div>
            </div>
          </label>
        </div>
      </div>

      <!-- File Upload Area -->
      <div class="upload-area" :class="{ 'drag-over': isDragging, 'has-file': selectedFile }">
        <input
          ref="fileInput"
          type="file"
          :accept="acceptedFileTypes"
          @change="onFileSelect"
          class="file-input"
          :disabled="isLoading || isCompleted"
        />

        <div v-if="!selectedFile" class="upload-placeholder" @click="triggerFileSelect">
          <div class="upload-icon">📄</div>
          <h4>파일을 선택하거나 드래그해주세요</h4>
          <p>{{ getAcceptedTypesText() }}</p>
          <p class="size-limit">최대 파일 크기: 10MB</p>
          <button 
            type="button" 
            class="select-file-btn"
            :disabled="isLoading || isCompleted"
          >
            파일 선택
          </button>
        </div>

        <div v-else class="file-preview">
          <div class="preview-content">
            <!-- Image Preview -->
            <div v-if="isImageFile" class="image-preview">
              <img :src="filePreviewUrl" alt="Document preview" />
            </div>
            
            <!-- PDF Preview -->
            <div v-else-if="isPdfFile" class="pdf-preview">
              <div class="pdf-icon">📄</div>
              <p>PDF 파일</p>
            </div>
            
            <!-- Generic File Preview -->
            <div v-else class="generic-preview">
              <div class="file-icon">📎</div>
              <p>파일</p>
            </div>
          </div>
          
          <div class="file-info">
            <div class="file-name">{{ selectedFile.name }}</div>
            <div class="file-details">
              <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
              <span class="file-type">{{ selectedFile.type || '알 수 없는 형식' }}</span>
            </div>
          </div>
          
          <div class="file-actions">
            <button 
              type="button"
              class="change-file-btn"
              @click="clearFile"
              :disabled="isLoading || isCompleted"
            >
              다른 파일 선택
            </button>
          </div>
        </div>
      </div>

      <!-- Upload Guidelines -->
      <div class="upload-guidelines">
        <h5>업로드 가이드라인</h5>
        <ul>
          <li v-for="guideline in getUploadGuidelines()" :key="guideline">
            {{ guideline }}
          </li>
        </ul>
      </div>

      <!-- Upload Button -->
      <div v-if="selectedFile && !isCompleted" class="upload-actions">
        <button 
          type="button"
          class="upload-btn"
          @click="uploadDocument"
          :disabled="isLoading || !canUpload"
        >
          <span v-if="isLoading" class="loading-spinner">⏳</span>
          {{ isLoading ? '업로드 중...' : '문서 업로드' }}
        </button>
      </div>

      <!-- Upload Success -->
      <div v-if="isCompleted" class="upload-success">
        <div class="success-icon">✅</div>
        <h4>문서 업로드 완료</h4>
        <p>{{ getDocumentTitle() }}이(가) 성공적으로 업로드되었습니다.</p>
        <div class="uploaded-info">
          <div class="info-item">
            <span class="label">파일명:</span>
            <span class="value">{{ uploadedDocument?.file_name }}</span>
          </div>
          <div class="info-item">
            <span class="label">업로드 시간:</span>
            <span class="value">{{ formatUploadTime() }}</span>
          </div>
          <div class="info-item">
            <span class="label">상태:</span>
            <span class="value status-badge pending">검토 대기중</span>
          </div>
        </div>
        
        <button 
          type="button"
          class="reupload-btn"
          @click="enableReupload"
          :disabled="isLoading"
        >
          다시 업로드
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading && !isCompleted" class="loading-section">
        <div class="spinner"></div>
        <p>{{ loadingMessage }}</p>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="error-section">
        <div class="error-icon">⚠️</div>
        <p class="error-message">{{ error }}</p>
        <button class="retry-btn" @click="retryUpload">
          다시 시도
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useKYC, type KYCDocument } from '@/composables/useKYC'
import { securityLogger } from '@/utils/security'

interface Props {
  userId: string
  documentType: 'identity' | 'address'
  isLoading?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  uploaded: []
  error: [string]
}>()

// Composables
const { uploadDocument, getDocuments } = useKYC()

// State
const selectedFile = ref<File | null>(null)
const selectedDocumentType = ref<'passport' | 'driver_license' | 'national_id' | 'address_proof'>('passport')
const filePreviewUrl = ref('')
const isDragging = ref(false)
const isLocalLoading = ref(false)
const loadingMessage = ref('')
const error = ref('')
const isCompleted = ref(false)
const uploadedDocument = ref<KYCDocument | null>(null)
const fileInput = ref<HTMLInputElement>()

// Document type options
const identityDocumentOptions = [
  { value: 'passport', label: '여권', icon: '📘' },
  { value: 'driver_license', label: '운전면허증', icon: '🪪' },
  { value: 'national_id', label: '주민등록증', icon: '🆔' }
] as const

// Computed
const isLoading = computed(() => props.isLoading || isLocalLoading.value)

const acceptedFileTypes = computed(() => {
  return 'image/jpeg,image/jpg,image/png,application/pdf'
})

const isImageFile = computed(() => {
  return selectedFile.value?.type.startsWith('image/') ?? false
})

const isPdfFile = computed(() => {
  return selectedFile.value?.type === 'application/pdf'
})

const canUpload = computed(() => {
  if (!selectedFile.value) return false
  if (props.documentType === 'identity' && !selectedDocumentType.value) return false
  return true
})

// Methods
const getDocumentTitle = (): string => {
  return props.documentType === 'identity' ? '신분증 업로드' : '주소 증명서 업로드'
}

const getDocumentDescription = (): string => {
  if (props.documentType === 'identity') {
    return '정부 발행 신분증을 업로드해주세요. 개인정보는 안전하게 보호됩니다.'
  }
  return '거주지 확인을 위한 주소 증명서를 업로드해주세요. (공과금 고지서, 은행 명세서 등)'
}

const getAcceptedTypesText = (): string => {
  return 'JPEG, PNG, PDF 파일만 지원'
}

const getUploadGuidelines = (): string[] => {
  const common = [
    '파일이 선명하고 읽기 쉬워야 합니다',
    '모든 모서리가 포함되어야 합니다',
    '반사나 그림자가 없어야 합니다'
  ]
  
  if (props.documentType === 'identity') {
    return [
      ...common,
      '사진이 명확하게 보여야 합니다',
      '개인정보가 가려지지 않아야 합니다'
    ]
  }
  
  return [
    ...common,
    '발행일이 3개월 이내여야 합니다',
    '주소가 명확하게 표시되어야 합니다'
  ]
}

const triggerFileSelect = () => {
  if (isLoading.value || isCompleted.value) return
  fileInput.value?.click()
}

const onFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    if (validateFile(file)) {
      selectedFile.value = file
      createFilePreview(file)
      error.value = ''
    }
  }
}

const validateFile = (file: File): boolean => {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
  
  if (file.size > maxSize) {
    error.value = '파일 크기는 10MB 이하여야 합니다.'
    return false
  }
  
  if (!allowedTypes.includes(file.type)) {
    error.value = 'JPEG, PNG, PDF 파일만 업로드 가능합니다.'
    return false
  }
  
  return true
}

const createFilePreview = (file: File) => {
  if (file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      filePreviewUrl.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const clearFile = () => {
  selectedFile.value = null
  filePreviewUrl.value = ''
  error.value = ''
  
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const uploadDocument = async () => {
  if (!selectedFile.value || !canUpload.value) return

  try {
    isLocalLoading.value = true
    loadingMessage.value = '문서를 업로드하는 중...'
    error.value = ''

    // Determine document type for upload
    const docType = props.documentType === 'identity' 
      ? selectedDocumentType.value 
      : 'address_proof'

    const success = await uploadDocument(props.userId, selectedFile.value, docType)
    
    if (success) {
      isCompleted.value = true
      
      // Store uploaded document info
      uploadedDocument.value = {
        id: Date.now().toString(), // This would come from API
        type: docType,
        file_url: '',
        status: 'pending',
        uploaded_at: new Date().toISOString(),
        file_name: selectedFile.value.name
      } as KYCDocument & { file_name: string }
      
      emit('uploaded')
      
      securityLogger.log('KYC_DOCUMENT_UPLOADED', {
        userId: props.userId,
        documentType: docType,
        fileName: selectedFile.value.name,
        fileSize: selectedFile.value.size,
        timestamp: new Date().toISOString()
      })
    } else {
      error.value = '문서 업로드에 실패했습니다. 다시 시도해주세요.'
      emit('error', error.value)
    }

  } catch (err: any) {
    console.error('Failed to upload document:', err)
    error.value = err.response?.data?.message || '문서 업로드 중 오류가 발생했습니다.'
    emit('error', error.value)
  } finally {
    isLocalLoading.value = false
  }
}

const enableReupload = () => {
  isCompleted.value = false
  clearFile()
  error.value = ''
}

const retryUpload = () => {
  error.value = ''
  if (selectedFile.value) {
    uploadDocument()
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatUploadTime = (): string => {
  if (!uploadedDocument.value?.uploaded_at) return ''
  
  const date = new Date(uploadedDocument.value.uploaded_at)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const checkExistingDocument = async () => {
  try {
    const documents = await getDocuments(props.userId)
    const existingDoc = documents.find(doc => {
      if (props.documentType === 'identity') {
        return ['passport', 'driver_license', 'national_id'].includes(doc.type)
      }
      return doc.type === 'address_proof'
    })
    
    if (existingDoc && existingDoc.status !== 'rejected') {
      isCompleted.value = true
      uploadedDocument.value = existingDoc as KYCDocument & { file_name: string }
      emit('uploaded')
    }
    
  } catch (err) {
    console.error('Failed to check existing documents:', err)
    // Continue without error - user can still upload
  }
}

// Set default document type for address proof
if (props.documentType === 'address') {
  selectedDocumentType.value = 'address_proof'
}

// Drag and drop handlers
const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = true
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
  
  if (isLoading.value || isCompleted.value) return
  
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    if (validateFile(file)) {
      selectedFile.value = file
      createFilePreview(file)
      error.value = ''
    }
  }
}

// Initialize
onMounted(async () => {
  await checkExistingDocument()
  
  // Add drag and drop listeners
  document.addEventListener('dragover', handleDragOver)
  document.addEventListener('dragleave', handleDragLeave)
  document.addEventListener('drop', handleDrop)
})

onUnmounted(() => {
  // Cleanup
  if (filePreviewUrl.value) {
    URL.revokeObjectURL(filePreviewUrl.value)
  }
  
  // Remove drag and drop listeners
  document.removeEventListener('dragover', handleDragOver)
  document.removeEventListener('dragleave', handleDragLeave)
  document.removeEventListener('drop', handleDrop)
})
</script>

<style scoped>
.document-upload-step {
  max-width: 600px;
  margin: 0 auto;
}

.step-description {
  text-align: center;
  margin-bottom: 32px;
}

.step-description h4 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.step-description p {
  font-size: 16px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.upload-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.document-type-selection {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-label {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.type-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.type-option {
  display: flex;
  cursor: pointer;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
}

.type-option:hover {
  border-color: #0d6efd;
}

.type-option.active {
  border-color: #0d6efd;
  background: #e3f2fd;
}

.type-option input[type="radio"] {
  display: none;
}

.option-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.option-icon {
  font-size: 32px;
}

.option-text {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  text-align: center;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  transition: all 0.2s ease;
  position: relative;
}

.upload-area.drag-over {
  border-color: #0d6efd;
  background: #f0f8ff;
}

.upload-area.has-file {
  border-color: #28a745;
  background: #f8f9fa;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.upload-placeholder {
  cursor: pointer;
}

.upload-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.7;
}

.upload-placeholder h4 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.upload-placeholder p {
  font-size: 14px;
  color: #666;
  margin: 0 0 4px 0;
}

.size-limit {
  font-size: 12px;
  color: #999;
  margin-bottom: 16px;
}

.select-file-btn {
  padding: 12px 24px;
  background: #0d6efd;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.select-file-btn:hover:not(:disabled) {
  background: #0b5ed7;
}

.file-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.preview-content {
  width: 200px;
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border: 1px solid #ddd;
}

.image-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.pdf-preview,
.generic-preview {
  text-align: center;
}

.pdf-icon,
.file-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.file-info {
  text-align: center;
}

.file-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  word-break: break-all;
}

.file-details {
  display: flex;
  justify-content: center;
  gap: 16px;
  font-size: 14px;
  color: #666;
}

.file-actions {
  display: flex;
  justify-content: center;
}

.change-file-btn {
  padding: 8px 16px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.change-file-btn:hover:not(:disabled) {
  background: #5a6268;
}

.upload-guidelines {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  border-left: 4px solid #0d6efd;
}

.upload-guidelines h5 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.upload-guidelines ul {
  margin: 0;
  padding-left: 20px;
}

.upload-guidelines li {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
  line-height: 1.4;
}

.upload-actions {
  text-align: center;
}

.upload-btn {
  padding: 14px 32px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 auto;
}

.upload-btn:hover:not(:disabled) {
  background: #218838;
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

.upload-success {
  text-align: center;
  padding: 32px;
  background: #d4edda;
  border-radius: 12px;
  border: 1px solid #28a745;
}

.success-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.upload-success h4 {
  font-size: 20px;
  font-weight: 600;
  color: #155724;
  margin: 0 0 12px 0;
}

.upload-success p {
  font-size: 16px;
  color: #155724;
  margin: 0 0 24px 0;
}

.uploaded-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  text-align: left;
  background: rgba(21, 87, 36, 0.1);
  padding: 16px;
  border-radius: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item .label {
  font-size: 14px;
  color: #155724;
  font-weight: 500;
}

.info-item .value {
  font-size: 14px;
  color: #155724;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.reupload-btn {
  padding: 10px 20px;
  background: #0d6efd;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.reupload-btn:hover:not(:disabled) {
  background: #0b5ed7;
}

.loading-section {
  text-align: center;
  padding: 32px;
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

.loading-section p {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.error-section {
  text-align: center;
  padding: 20px;
  background: #f8d7da;
  border-radius: 8px;
  border: 1px solid #f5c6cb;
}

.error-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.error-message {
  font-size: 14px;
  color: #721c24;
  margin: 0 0 16px 0;
}

.retry-btn {
  padding: 8px 16px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.retry-btn:hover {
  background: #c82333;
}

@media (max-width: 768px) {
  .type-options {
    grid-template-columns: 1fr;
  }
  
  .upload-area {
    padding: 24px 16px;
  }
  
  .upload-icon {
    font-size: 48px;
  }
  
  .file-details {
    flex-direction: column;
    gap: 4px;
  }
  
  .uploaded-info {
    text-align: center;
  }
  
  .info-item {
    flex-direction: column;
    gap: 4px;
  }
}
</style>