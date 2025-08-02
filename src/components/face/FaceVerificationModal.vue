<template>
  <div class="face-verification-modal">
    <div class="modal-backdrop" @click="$emit('close')"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2>얼굴 인증</h2>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <!-- Initialization Step -->
        <div v-if="!isInitialized && !error" class="initialization-step">
          <div class="step-content">
            <div class="step-icon">🎯</div>
            <h3>얼굴 인증 준비</h3>
            <p>보안을 위한 얼굴 인증을 시작합니다.</p>
            
            <div class="preparation-checklist">
              <div class="checklist-item">
                <span class="check-icon">✓</span>
                <span>밝은 곳에서 진행해주세요</span>
              </div>
              <div class="checklist-item">
                <span class="check-icon">✓</span>
                <span>카메라가 얼굴을 잘 볼 수 있도록 해주세요</span>
              </div>
              <div class="checklist-item">
                <span class="check-icon">✓</span>
                <span>모자나 선글라스를 착용하지 말아주세요</span>
              </div>
            </div>

            <button 
              class="start-btn"
              @click="initialize"
              :disabled="isLoading"
            >
              <span v-if="isLoading" class="loading-spinner">⏳</span>
              {{ isLoading ? '초기화 중...' : '인증 시작' }}
            </button>
          </div>
        </div>

        <!-- Camera Setup Step -->
        <div v-else-if="isInitialized && !cameraReady" class="camera-setup-step">
          <div class="step-content">
            <div class="step-icon">📹</div>
            <h3>카메라 설정</h3>
            <p>카메라 접근을 허용하고 얼굴이 화면에 나타나도록 해주세요.</p>
            
            <div class="camera-preview">
              <video
                ref="videoRef"
                autoplay
                muted
                playsinline
                class="video-preview"
                @loadedmetadata="onVideoLoaded"
              ></video>
              <canvas
                ref="canvasRef"
                class="detection-overlay"
              ></canvas>
            </div>

            <div class="camera-controls">
              <button 
                v-if="!hasCamera"
                class="error-btn"
                disabled
              >
                카메라를 사용할 수 없습니다
              </button>
              <button 
                v-else-if="!cameraReady"
                class="setup-camera-btn"
                @click="setupCameraStream"
                :disabled="isLoading"
              >
                <span v-if="isLoading" class="loading-spinner">⏳</span>
                {{ isLoading ? '카메라 설정 중...' : '카메라 활성화' }}
              </button>
              <div v-else class="camera-ready">
                <span class="ready-icon">✓</span>
                <span>카메라 준비 완료</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Verification Process Step -->
        <div v-else-if="cameraReady && !verificationComplete" class="verification-step">
          <div class="step-content">
            <div class="verification-header">
              <h3>얼굴 인증 진행</h3>
              <div class="progress-indicator">
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: `${verificationProgress}%` }"
                  ></div>
                </div>
                <span class="progress-text">{{ verificationProgress }}% 완료</span>
              </div>
            </div>

            <div class="camera-view">
              <video
                ref="videoRef"
                autoplay
                muted
                playsinline
                class="video-stream"
              ></video>
              <canvas
                ref="canvasRef"
                class="face-overlay"
              ></canvas>
              
              <!-- Face detection indicator -->
              <div class="face-detection-indicator" :class="{ active: faceDetected }">
                <div class="face-frame"></div>
                <span class="detection-text">
                  {{ faceDetected ? '얼굴 인식됨' : '얼굴을 화면 중앙에 맞춰주세요' }}
                </span>
              </div>
            </div>

            <!-- Current instruction -->
            <div v-if="currentCheck" class="current-instruction">
              <div class="instruction-card">
                <div class="instruction-icon">
                  <span v-if="currentCheck.type === 'blink'">👁️</span>
                  <span v-else-if="currentCheck.type === 'head_turn'">↔️</span>
                  <span v-else-if="currentCheck.type === 'smile'">😊</span>
                  <span v-else-if="currentCheck.type === 'nod'">↕️</span>
                </div>
                <div class="instruction-content">
                  <h4>{{ currentCheck.instruction }}</h4>
                  <div class="instruction-timer">
                    <div class="timer-bar">
                      <div 
                        class="timer-fill" 
                        :style="{ width: `${instructionProgress}%` }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Verification controls -->
            <div class="verification-controls">
              <button 
                v-if="!verificationInProgress"
                class="start-verification-btn"
                @click="startVerificationProcess"
                :disabled="!faceDetected"
              >
                인증 시작
              </button>
              <button 
                v-else
                class="cancel-verification-btn"
                @click="cancelVerification"
              >
                인증 취소
              </button>
            </div>
          </div>
        </div>

        <!-- Verification Result Step -->
        <div v-else-if="verificationComplete" class="result-step">
          <div class="step-content">
            <div v-if="verificationResult?.verified" class="success-result">
              <div class="result-icon success">✅</div>
              <h3>인증 성공</h3>
              <p>얼굴 인증이 성공적으로 완료되었습니다.</p>
              
              <div class="result-details">
                <div class="detail-item">
                  <span class="label">신뢰도:</span>
                  <span class="value">{{ Math.round((verificationResult.confidence || 0) * 100) }}%</span>
                </div>
                <div class="detail-item">
                  <span class="label">완료 시간:</span>
                  <span class="value">{{ formatTimestamp(verificationResult.timestamp) }}</span>
                </div>
              </div>

              <button class="complete-btn" @click="completeVerification">
                완료
              </button>
            </div>

            <div v-else class="failure-result">
              <div class="result-icon failure">❌</div>
              <h3>인증 실패</h3>
              <p>{{ verificationResult?.errorMessage || '얼굴 인증에 실패했습니다.' }}</p>
              
              <div class="retry-options">
                <button class="retry-btn" @click="retryVerification">
                  다시 시도
                </button>
                <button class="cancel-btn" @click="$emit('close')">
                  나중에 하기
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-if="error" class="error-step">
          <div class="step-content">
            <div class="error-icon">⚠️</div>
            <h3>오류 발생</h3>
            <p class="error-message">{{ error }}</p>
            
            <div class="error-actions">
              <button class="retry-btn" @click="resetVerification">
                다시 시도
              </button>
              <button class="cancel-btn" @click="$emit('close')">
                취소
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useFaceVerification, type FaceVerificationResult } from '@/composables/useFaceVerification'
import { securityLogger } from '@/utils/security'

interface Props {
  userId: string
  show: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  completed: [FaceVerificationResult]
  failed: [string]
}>()

// Composables
const {
  isInitialized,
  isLoading,
  error,
  verificationInProgress,
  currentCheck,
  checkResults,
  hasCamera,
  verificationProgress,
  initializeFaceAPI,
  setupCamera,
  detectFaces,
  startVerification,
  submitVerificationResult,
  stopCamera,
  setVideoElement,
  setCanvasElement
} = useFaceVerification()

// Refs
const videoRef = ref<HTMLVideoElement>()
const canvasRef = ref<HTMLCanvasElement>()

// State
const cameraReady = ref(false)
const faceDetected = ref(false)
const verificationComplete = ref(false)
const verificationResult = ref<FaceVerificationResult | null>(null)
const instructionProgress = ref(0)
let detectionInterval: NodeJS.Timeout | null = null
let instructionTimer: NodeJS.Timeout | null = null

// Methods
const initialize = async () => {
  try {
    const success = await initializeFaceAPI()
    if (success && videoRef.value && canvasRef.value) {
      setVideoElement(videoRef.value)
      setCanvasElement(canvasRef.value)
    }
  } catch (err) {
    console.error('Initialization failed:', err)
  }
}

const setupCameraStream = async () => {
  try {
    const video = await setupCamera()
    if (video) {
      cameraReady.value = true
      startFaceDetection()
    }
  } catch (err) {
    console.error('Camera setup failed:', err)
  }
}

const onVideoLoaded = () => {
  // Video metadata loaded
  console.log('Video loaded')
}

const startFaceDetection = () => {
  if (detectionInterval) {
    clearInterval(detectionInterval)
  }

  detectionInterval = setInterval(async () => {
    try {
      const faces = await detectFaces()
      faceDetected.value = faces.length > 0

      // Draw detection overlay if canvas is available
      if (canvasRef.value && videoRef.value && faces.length > 0) {
        const canvas = canvasRef.value
        const video = videoRef.value
        
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          
          // Draw face detection rectangles
          faces.forEach(face => {
            const { x, y, width, height } = face.detection.box
            ctx.strokeStyle = '#00ff00'
            ctx.lineWidth = 2
            ctx.strokeRect(x, y, width, height)
          })
        }
      }
    } catch (err) {
      console.error('Face detection error:', err)
    }
  }, 100)
}

const startVerificationProcess = async () => {
  try {
    verificationResult.value = await startVerification()
    verificationComplete.value = true

    if (verificationResult.value.verified) {
      // Submit result to server
      const success = await submitVerificationResult(props.userId, verificationResult.value)
      if (success) {
        emit('completed', verificationResult.value)
      }
    } else {
      emit('failed', verificationResult.value.errorMessage || '인증 실패')
    }
  } catch (err: any) {
    console.error('Verification process failed:', err)
    emit('failed', err.message || '인증 과정에서 오류가 발생했습니다.')
  }
}

const cancelVerification = () => {
  // Stop any ongoing verification process
  verificationComplete.value = false
  verificationResult.value = null
}

const completeVerification = () => {
  if (verificationResult.value) {
    emit('completed', verificationResult.value)
  }
  emit('close')
}

const retryVerification = () => {
  verificationComplete.value = false
  verificationResult.value = null
  instructionProgress.value = 0
}

const resetVerification = () => {
  verificationComplete.value = false
  verificationResult.value = null
  cameraReady.value = false
  faceDetected.value = false
  instructionProgress.value = 0
  
  // Clear intervals
  if (detectionInterval) {
    clearInterval(detectionInterval)
    detectionInterval = null
  }
  if (instructionTimer) {
    clearInterval(instructionTimer)
    instructionTimer = null
  }
}

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Cleanup
const cleanup = () => {
  if (detectionInterval) {
    clearInterval(detectionInterval)
    detectionInterval = null
  }
  if (instructionTimer) {
    clearInterval(instructionTimer)
    instructionTimer = null
  }
  stopCamera()
}

// Lifecycle
onMounted(async () => {
  if (props.show) {
    await nextTick()
    if (videoRef.value && canvasRef.value) {
      setVideoElement(videoRef.value)
      setCanvasElement(canvasRef.value)
    }
  }

  securityLogger.log('FACE_VERIFICATION_MODAL_OPENED', {
    userId: props.userId,
    timestamp: new Date().toISOString()
  })
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.face-verification-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.modal-content {
  position: relative;
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 0 24px;
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 24px;
}

.modal-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f8f9fa;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #6c757d;
}

.close-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.modal-body {
  padding: 0 24px 24px 24px;
  max-height: calc(90vh - 100px);
  overflow-y: auto;
}

.step-content {
  text-align: center;
  padding: 20px;
}

.step-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.step-content h3 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.step-content p {
  font-size: 16px;
  color: #666;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.preparation-checklist {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 24px 0;
  text-align: left;
}

.checklist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.check-icon {
  width: 20px;
  height: 20px;
  background: #28a745;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.start-btn {
  padding: 14px 32px;
  background: #0d6efd;
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

.start-btn:hover:not(:disabled) {
  background: #0b5ed7;
}

.start-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

.camera-preview,
.camera-view {
  position: relative;
  margin: 24px auto;
  width: 400px;
  height: 300px;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
}

.video-preview,
.video-stream {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detection-overlay,
.face-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.face-detection-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 150px;
  border: 2px dashed #6c757d;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: border-color 0.3s ease;
}

.face-detection-indicator.active {
  border-color: #28a745;
}

.face-frame {
  width: 100%;
  height: 100%;
  border-radius: 10px;
}

.detection-text {
  position: absolute;
  bottom: -30px;
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.face-detection-indicator.active .detection-text {
  color: #28a745;
}

.camera-controls {
  margin-top: 16px;
}

.setup-camera-btn,
.error-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.setup-camera-btn {
  background: #28a745;
  color: white;
}

.setup-camera-btn:hover:not(:disabled) {
  background: #218838;
}

.error-btn {
  background: #dc3545;
  color: white;
  cursor: not-allowed;
}

.camera-ready {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #28a745;
  font-weight: 500;
}

.ready-icon {
  width: 20px;
  height: 20px;
  background: #28a745;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.verification-header {
  margin-bottom: 24px;
}

.progress-indicator {
  margin-top: 12px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0d6efd 0%, #28a745 100%);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.current-instruction {
  margin: 24px 0;
}

.instruction-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #e3f2fd;
  border-radius: 12px;
  border-left: 4px solid #2196f3;
}

.instruction-icon {
  font-size: 32px;
}

.instruction-content {
  flex: 1;
  text-align: left;
}

.instruction-content h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1565c0;
  margin: 0 0 8px 0;
}

.timer-bar {
  width: 100%;
  height: 4px;
  background: rgba(21, 101, 192, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.timer-fill {
  height: 100%;
  background: #1565c0;
  transition: width 0.1s linear;
}

.verification-controls {
  margin-top: 24px;
}

.start-verification-btn,
.cancel-verification-btn {
  padding: 14px 32px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
}

.start-verification-btn {
  background: #28a745;
  color: white;
}

.start-verification-btn:hover:not(:disabled) {
  background: #218838;
}

.start-verification-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.cancel-verification-btn {
  background: #dc3545;
  color: white;
}

.cancel-verification-btn:hover {
  background: #c82333;
}

.result-step {
  padding: 40px 20px;
}

.result-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.success-result h3 {
  color: #155724;
}

.failure-result h3 {
  color: #721c24;
}

.result-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 24px 0;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-item .label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.detail-item .value {
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.complete-btn,
.retry-btn,
.cancel-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  margin: 0 8px;
}

.complete-btn {
  background: #28a745;
  color: white;
}

.complete-btn:hover {
  background: #218838;
}

.retry-btn {
  background: #0d6efd;
  color: white;
}

.retry-btn:hover {
  background: #0b5ed7;
}

.cancel-btn {
  background: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background: #5a6268;
}

.retry-options,
.error-actions {
  margin-top: 24px;
}

.error-step {
  padding: 40px 20px;
}

.error-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.error-message {
  color: #721c24;
  margin-bottom: 24px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .modal-content {
    margin: 10px;
    width: calc(100% - 20px);
  }
  
  .camera-preview,
  .camera-view {
    width: 100%;
    max-width: 350px;
  }
  
  .instruction-card {
    flex-direction: column;
    text-align: center;
  }
  
  .instruction-content {
    text-align: center;
  }
  
  .retry-options,
  .error-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .complete-btn,
  .retry-btn,
  .cancel-btn {
    width: 100%;
    margin: 0;
  }
}
</style>