<template>
  <div class="face-verification">
    <div class="verification-header">
      <h3>얼굴 인증</h3>
      <p class="verification-status" :class="verificationStatusClass">
        {{ verificationStatusText }}
      </p>
    </div>

    <div class="verification-content">
      <!-- 카메라 영역 -->
      <div class="camera-container" v-if="!isVerified">
        <div class="camera-wrapper" :class="{ 'detecting': isDetecting }">
          <video
            ref="videoElement"
            class="camera-video"
            :class="{ 'hidden': !showCamera }"
            autoplay
            muted
            playsinline
          ></video>
          <canvas
            ref="canvasElement"
            class="detection-canvas"
            :class="{ 'hidden': !showCamera }"
          ></canvas>
          
          <!-- 얼굴 감지 가이드 -->
          <div class="face-guide" v-if="showCamera && !faceDetected">
            <div class="guide-circle">
              <div class="guide-text">얼굴을 원 안에 맞춰주세요</div>
            </div>
          </div>
          
          <!-- 로딩 스피너 -->
          <div class="loading-overlay" v-if="isLoading">
            <div class="spinner"></div>
            <p>카메라를 준비하고 있습니다...</p>
          </div>
        </div>

        <!-- 카메라 컨트롤 -->
        <div class="camera-controls">
          <button
            @click="startVerification"
            :disabled="isLoading || isDetecting"
            class="btn btn-primary"
            v-if="!showCamera"
          >
            <i class="fas fa-camera"></i>
            얼굴 인증 시작
          </button>
          
          <button
            @click="stopVerification"
            class="btn btn-secondary"
            v-if="showCamera && !isVerified"
          >
            <i class="fas fa-times"></i>
            인증 취소
          </button>
        </div>
      </div>

      <!-- 인증 완료 상태 -->
      <div class="verification-success" v-if="isVerified">
        <div class="success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h4>얼굴 인증 완료</h4>
        <p>인증이 성공적으로 완료되었습니다.</p>
        <div class="verification-info">
          <p><strong>인증 시간:</strong> {{ verificationTime }}</p>
          <p><strong>신뢰도:</strong> {{ confidenceScore }}%</p>
        </div>
        
        <button @click="resetVerification" class="btn btn-outline">
          <i class="fas fa-redo"></i>
          다시 인증하기
        </button>
      </div>

      <!-- 에러 상태 -->
      <div class="verification-error" v-if="errorMessage">
        <div class="error-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h4>인증 오류</h4>
        <p>{{ errorMessage }}</p>
        <button @click="resetVerification" class="btn btn-primary">
          다시 시도
        </button>
      </div>
    </div>

    <!-- 진행 상황 표시 -->
    <div class="verification-progress" v-if="showCamera && !isVerified">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: verificationProgress + '%' }"></div>
      </div>
      <p class="progress-text">{{ progressText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { FaceMesh } from '@mediapipe/face_mesh'
import { Camera } from '@mediapipe/camera_utils'

// Props
interface Props {
  autoStart?: boolean
  requiredConfidence?: number
  verificationDuration?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoStart: false,
  requiredConfidence: 0.8,
  verificationDuration: 3000 // 3초간 안정적인 감지 필요
})

// Emits
const emit = defineEmits<{
  verified: [verified: boolean]
  error: [error: string]
}>()

// Refs
const videoElement = ref<HTMLVideoElement>()
const canvasElement = ref<HTMLCanvasElement>()

// State
const isLoading = ref(false)
const showCamera = ref(false)
const isDetecting = ref(false)
const isVerified = ref(false)
const faceDetected = ref(false)
const errorMessage = ref('')
const verificationProgress = ref(0)
const verificationTime = ref('')
const confidenceScore = ref(0)

// MediaPipe instances
let faceMesh: FaceMesh | null = null
let camera: Camera | null = null
let verificationTimer: NodeJS.Timeout | null = null
let progressTimer: NodeJS.Timeout | null = null

// Detection state
let consecutiveDetections = 0
let detectionStartTime = 0
const requiredDetections = 30 // 약 1초간 30프레임 안정적 감지

// Computed
const verificationStatusClass = computed(() => {
  if (isVerified.value) return 'status-success'
  if (errorMessage.value) return 'status-error'
  if (isDetecting.value) return 'status-detecting'
  return 'status-waiting'
})

const verificationStatusText = computed(() => {
  if (isVerified.value) return '✓ 인증 완료'
  if (errorMessage.value) return '✗ 인증 실패'
  if (isDetecting.value) return '🔍 얼굴 감지 중...'
  return '⏳ 인증 대기'
})

const progressText = computed(() => {
  if (verificationProgress.value === 0) return '얼굴을 카메라에 맞춰주세요'
  if (verificationProgress.value < 100) return `인증 중... ${Math.round(verificationProgress.value)}%`
  return '인증 완료!'
})

// Methods
const initializeFaceMesh = async () => {
  try {
    faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      }
    })

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    })

    faceMesh.onResults(onFaceMeshResults)
  } catch (error) {
    console.error('Face mesh initialization error:', error)
    handleError('얼굴 인식 모델을 로드하는데 실패했습니다.')
  }
}

const onFaceMeshResults = (results: any) => {
  if (!canvasElement.value || !videoElement.value) return

  const canvas = canvasElement.value
  const video = videoElement.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 캔버스 크기 설정
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  // 비디오 프레임 그리기
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    const landmarks = results.multiFaceLandmarks[0]
    
    // 얼굴 감지됨
    faceDetected.value = true
    handleFaceDetected(landmarks)
    
    // 랜드마크 그리기 (옵셔널)
    drawFaceLandmarks(ctx, landmarks, canvas.width, canvas.height)
  } else {
    // 얼굴 감지되지 않음
    faceDetected.value = false
    resetDetectionProgress()
  }
}

const drawFaceLandmarks = (ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number) => {
  ctx.fillStyle = '#00ff00'
  ctx.strokeStyle = '#00ff00'
  ctx.lineWidth = 2

  // 주요 얼굴 포인트만 그리기
  const faceBoundary = [
    10, 151, 9, 8, 107, 55, 65, 52, 53, 46, // 얼굴 윤곽
  ]

  faceBoundary.forEach(index => {
    if (landmarks[index]) {
      const x = landmarks[index].x * width
      const y = landmarks[index].y * height
      
      ctx.beginPath()
      ctx.arc(x, y, 2, 0, 2 * Math.PI)
      ctx.fill()
    }
  })
}

const handleFaceDetected = (landmarks: any[]) => {
  if (!isDetecting.value) return

  // 얼굴 품질 검증
  const faceQuality = calculateFaceQuality(landmarks)
  
  if (faceQuality >= props.requiredConfidence) {
    consecutiveDetections++
    
    if (consecutiveDetections === 1) {
      detectionStartTime = Date.now()
      startProgressTimer()
    }
    
    // 진행률 업데이트
    const progress = Math.min((consecutiveDetections / requiredDetections) * 100, 100)
    verificationProgress.value = progress
    
    // 충분한 감지 후 검증 완료
    if (consecutiveDetections >= requiredDetections) {
      completeVerification(faceQuality)
    }
  } else {
    resetDetectionProgress()
  }
}

const calculateFaceQuality = (landmarks: any[]): number => {
  if (!landmarks || landmarks.length === 0) return 0

  // 얼굴 크기 검증 (너무 작거나 크면 안됨)
  const leftEye = landmarks[133] // 왼쪽 눈 모서리
  const rightEye = landmarks[362] // 오른쪽 눈 모서리
  const noseTip = landmarks[1] // 코끝
  const chin = landmarks[175] // 턱

  if (!leftEye || !rightEye || !noseTip || !chin) return 0

  // 눈 사이의 거리로 얼굴 크기 측정
  const eyeDistance = Math.sqrt(
    Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2)
  )

  // 얼굴 높이 측정
  const faceHeight = Math.abs(chin.y - noseTip.y)

  // 적절한 크기 범위 (전체 화면의 10-40%)
  const minSize = 0.1
  const maxSize = 0.4
  
  let sizeScore = 0
  if (eyeDistance >= minSize && eyeDistance <= maxSize && faceHeight >= minSize && faceHeight <= maxSize) {
    sizeScore = 0.5
  }

  // 얼굴 정면성 검증
  const faceCenter = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 }
  const noseCenterOffset = Math.abs(noseTip.x - faceCenter.x)
  
  let frontalScore = 0
  if (noseCenterOffset < 0.02) { // 2% 이내의 편차
    frontalScore = 0.3
  }

  // 안정성 검증 (랜드마크 떨림 정도)
  const stabilityScore = 0.2 // 간단화

  return sizeScore + frontalScore + stabilityScore
}

const resetDetectionProgress = () => {
  consecutiveDetections = 0
  verificationProgress.value = 0
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

const startProgressTimer = () => {
  if (progressTimer) clearInterval(progressTimer)
  
  progressTimer = setInterval(() => {
    const elapsed = Date.now() - detectionStartTime
    const progress = Math.min((elapsed / props.verificationDuration) * 100, 100)
    
    if (progress >= 100) {
      clearInterval(progressTimer!)
      progressTimer = null
    }
  }, 100)
}

const completeVerification = (quality: number) => {
  isDetecting.value = false
  isVerified.value = true
  showCamera.value = false
  confidenceScore.value = Math.round(quality * 100)
  verificationTime.value = new Date().toLocaleString('ko-KR')
  
  // 카메라 정리
  stopCamera()
  
  emit('verified', true)
  
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

const startVerification = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    
    // MediaPipe 초기화
    if (!faceMesh) {
      await initializeFaceMesh()
    }
    
    // 카메라 시작
    await startCamera()
    
    showCamera.value = true
    isDetecting.value = true
    isLoading.value = false
    
  } catch (error) {
    console.error('Verification start error:', error)
    handleError('카메라 시작에 실패했습니다. 카메라 권한을 확인해주세요.')
  }
}

const startCamera = async () => {
  if (!videoElement.value || !faceMesh) return

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      }
    })

    videoElement.value.srcObject = stream

    // MediaPipe Camera 초기화
    camera = new Camera(videoElement.value, {
      onFrame: async () => {
        if (faceMesh && videoElement.value) {
          await faceMesh.send({ image: videoElement.value })
        }
      },
      width: 640,
      height: 480
    })

    await camera.start()
    
  } catch (error) {
    console.error('Camera start error:', error)
    throw new Error('카메라에 접근할 수 없습니다.')
  }
}

const stopCamera = () => {
  if (camera) {
    camera.stop()
    camera = null
  }

  if (videoElement.value && videoElement.value.srcObject) {
    const stream = videoElement.value.srcObject as MediaStream
    stream.getTracks().forEach(track => track.stop())
    videoElement.value.srcObject = null
  }
}

const stopVerification = () => {
  isDetecting.value = false
  showCamera.value = false
  resetDetectionProgress()
  stopCamera()
}

const resetVerification = () => {
  isVerified.value = false
  errorMessage.value = ''
  verificationProgress.value = 0
  verificationTime.value = ''
  confidenceScore.value = 0
  faceDetected.value = false
  resetDetectionProgress()
  emit('verified', false)
}

const handleError = (message: string) => {
  errorMessage.value = message
  isLoading.value = false
  isDetecting.value = false
  showCamera.value = false
  stopCamera()
  emit('error', message)
}

// Lifecycle
onMounted(async () => {
  if (props.autoStart) {
    await nextTick()
    startVerification()
  }
})

onUnmounted(() => {
  stopCamera()
  if (verificationTimer) clearTimeout(verificationTimer)
  if (progressTimer) clearInterval(progressTimer)
})
</script>

<style scoped>
.face-verification {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.verification-header {
  text-align: center;
  margin-bottom: 20px;
}

.verification-header h3 {
  color: #2c3e50;
  margin-bottom: 8px;
}

.verification-status {
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 20px;
  display: inline-block;
}

.status-success {
  background: #d4edda;
  color: #155724;
}

.status-error {
  background: #f8d7da;
  color: #721c24;
}

.status-detecting {
  background: #cce7ff;
  color: #0056b3;
}

.status-waiting {
  background: #f8f9fa;
  color: #6c757d;
}

.camera-container {
  position: relative;
  margin-bottom: 20px;
}

.camera-wrapper {
  position: relative;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
  transition: all 0.3s ease;
}

.camera-wrapper.detecting {
  box-shadow: 0 0 20px rgba(0, 123, 255, 0.5);
}

.camera-video, .detection-canvas {
  width: 100%;
  height: auto;
  display: block;
}

.detection-canvas {
  position: absolute;
  top: 0;
  left: 0;
}

.hidden {
  display: none;
}

.face-guide {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.guide-circle {
  width: 200px;
  height: 200px;
  border: 3px dashed #007bff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 2s infinite;
}

.guide-text {
  color: #007bff;
  font-size: 14px;
  text-align: center;
  font-weight: 600;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.camera-controls {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}

.verification-success, .verification-error {
  text-align: center;
  padding: 30px;
}

.success-icon i {
  font-size: 48px;
  color: #28a745;
  margin-bottom: 16px;
}

.error-icon i {
  font-size: 48px;
  color: #dc3545;
  margin-bottom: 16px;
}

.verification-info {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0;
  text-align: left;
}

.verification-info p {
  margin: 4px 0;
  font-size: 14px;
}

.verification-progress {
  margin-top: 16px;
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
  background: linear-gradient(90deg, #007bff, #0056b3);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-text {
  text-align: center;
  font-size: 14px;
  color: #6c757d;
  margin: 0;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn-outline {
  background: transparent;
  color: #007bff;
  border: 2px solid #007bff;
}

.btn-outline:hover {
  background: #007bff;
  color: white;
}

@media (max-width: 768px) {
  .face-verification {
    padding: 16px;
  }
  
  .camera-wrapper {
    max-width: 100%;
  }
  
  .guide-circle {
    width: 150px;
    height: 150px;
  }
  
  .guide-text {
    font-size: 12px;
  }
}
</style>