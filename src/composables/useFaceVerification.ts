import { ref, computed } from 'vue'
import * as faceapi from 'face-api.js'
import { profileAPI } from '../services/api'
import { securityLogger } from '../utils/security'

// Face verification types
export interface FaceVerificationConfig {
  minConfidence: number
  maxRetries: number
  livenessChecks: LivenessCheck[]
  modelPath: string
}

export interface LivenessCheck {
  id: string
  type: 'blink' | 'head_turn' | 'smile' | 'nod'
  instruction: string
  duration: number
  threshold: number
}

export interface FaceVerificationResult {
  verified: boolean
  confidence: number
  livenessScore: number
  timestamp: string
  attempts: number
  errorCode?: string
  errorMessage?: string
}

export interface FaceDetection {
  detection: faceapi.FaceDetection
  landmarks: faceapi.FaceLandmarks68
  descriptor: Float32Array
}

// Global state
const isInitialized = ref(false)
const isLoading = ref(false)
const error = ref('')
const currentStream = ref<MediaStream | null>(null)
const verificationInProgress = ref(false)

// Default configuration
const defaultConfig: FaceVerificationConfig = {
  minConfidence: 0.7,
  maxRetries: 3,
  modelPath: '/models',
  livenessChecks: [
    {
      id: 'blink',
      type: 'blink',
      instruction: '눈을 한 번 깜빡여주세요',
      duration: 3000,
      threshold: 0.8
    },
    {
      id: 'head_turn',
      type: 'head_turn',
      instruction: '고개를 천천히 좌우로 돌려주세요',
      duration: 4000,
      threshold: 0.7
    }
  ]
}

export function useFaceVerification(config: Partial<FaceVerificationConfig> = {}) {
  const verificationConfig = { ...defaultConfig, ...config }
  const currentCheck = ref<LivenessCheck | null>(null)
  const checkResults = ref<Record<string, boolean>>({})
  const videoElement = ref<HTMLVideoElement | null>(null)
  const canvasElement = ref<HTMLCanvasElement | null>(null)

  // Computed
  const hasCamera = computed(() => {
    return navigator.mediaDevices && navigator.mediaDevices.getUserMedia
  })

  const allChecksCompleted = computed(() => {
    return verificationConfig.livenessChecks.every(check => 
      checkResults.value[check.id] === true
    )
  })

  const verificationProgress = computed(() => {
    const completed = Object.values(checkResults.value).filter(Boolean).length
    return Math.round((completed / verificationConfig.livenessChecks.length) * 100)
  })

  // Initialize face-api.js models
  const initializeFaceAPI = async (): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = ''

      if (isInitialized.value) {
        return true
      }

      securityLogger.log('FACE_API_INITIALIZATION_STARTED', {
        timestamp: new Date().toISOString()
      })

      // Load required models
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(verificationConfig.modelPath),
        faceapi.nets.faceLandmark68Net.loadFromUri(verificationConfig.modelPath),
        faceapi.nets.faceRecognitionNet.loadFromUri(verificationConfig.modelPath),
        faceapi.nets.faceExpressionNet.loadFromUri(verificationConfig.modelPath)
      ])

      isInitialized.value = true
      
      securityLogger.log('FACE_API_INITIALIZATION_SUCCESS', {
        timestamp: new Date().toISOString()
      })

      return true

    } catch (err: any) {
      console.error('Failed to initialize face-api.js:', err)
      error.value = '얼굴 인식 시스템 초기화에 실패했습니다.'
      
      securityLogger.log('FACE_API_INITIALIZATION_FAILED', {
        error: err.message,
        timestamp: new Date().toISOString()
      })

      return false
    } finally {
      isLoading.value = false
    }
  }

  // Setup camera stream
  const setupCamera = async (): Promise<HTMLVideoElement | null> => {
    try {
      isLoading.value = true
      error.value = ''

      if (!hasCamera.value) {
        throw new Error('카메라가 지원되지 않는 환경입니다.')
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      })

      if (!videoElement.value) {
        throw new Error('비디오 엘리먼트가 설정되지 않았습니다.')
      }

      videoElement.value.srcObject = stream
      currentStream.value = stream

      return new Promise((resolve, reject) => {
        if (!videoElement.value) {
          reject(new Error('비디오 엘리먼트가 없습니다.'))
          return
        }

        videoElement.value.onloadedmetadata = () => {
          securityLogger.log('CAMERA_SETUP_SUCCESS', {
            videoWidth: videoElement.value?.videoWidth,
            videoHeight: videoElement.value?.videoHeight,
            timestamp: new Date().toISOString()
          })
          resolve(videoElement.value!)
        }

        videoElement.value.onerror = () => {
          reject(new Error('비디오 스트림 로드에 실패했습니다.'))
        }
      })

    } catch (err: any) {
      console.error('Failed to setup camera:', err)
      error.value = err.message || '카메라 설정에 실패했습니다.'
      
      securityLogger.log('CAMERA_SETUP_FAILED', {
        error: err.message,
        timestamp: new Date().toISOString()
      })

      return null
    } finally {
      isLoading.value = false
    }
  }

  // Detect faces in video frame
  const detectFaces = async (): Promise<FaceDetection[]> => {
    if (!videoElement.value || !isInitialized.value) {
      return []
    }

    try {
      const detections = await faceapi
        .detectAllFaces(videoElement.value, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors()

      return detections.map(detection => ({
        detection: detection.detection,
        landmarks: detection.landmarks,
        descriptor: detection.descriptor
      }))

    } catch (err: any) {
      console.error('Face detection failed:', err)
      return []
    }
  }

  // Perform liveness check
  const performLivenessCheck = async (check: LivenessCheck): Promise<boolean> => {
    try {
      currentCheck.value = check
      
      securityLogger.log('LIVENESS_CHECK_STARTED', {
        checkType: check.type,
        checkId: check.id,
        timestamp: new Date().toISOString()
      })

      return new Promise((resolve) => {
        let checksPassed = 0
        let totalChecks = 0
        const startTime = Date.now()

        const checkInterval = setInterval(async () => {
          if (Date.now() - startTime > check.duration) {
            clearInterval(checkInterval)
            const success = checksPassed / totalChecks >= check.threshold
            checkResults.value[check.id] = success
            
            securityLogger.log('LIVENESS_CHECK_COMPLETED', {
              checkType: check.type,
              checkId: check.id,
              success,
              score: checksPassed / totalChecks,
              timestamp: new Date().toISOString()
            })
            
            resolve(success)
            return
          }

          const faces = await detectFaces()
          if (faces.length === 0) return

          totalChecks++
          
          // Perform specific liveness check based on type
          const passed = await evaluateLivenessAction(check.type, faces[0])
          if (passed) checksPassed++
        }, 100) // Check every 100ms
      })

    } catch (err: any) {
      console.error('Liveness check failed:', err)
      checkResults.value[check.id] = false
      return false
    }
  }

  // Evaluate specific liveness action
  const evaluateLivenessAction = async (
    actionType: LivenessCheck['type'], 
    faceData: FaceDetection
  ): Promise<boolean> => {
    const { landmarks } = faceData

    switch (actionType) {
      case 'blink':
        return evaluateBlinking(landmarks)
      
      case 'head_turn':
        return evaluateHeadTurn(landmarks)
      
      case 'smile':
        return evaluateSmile(landmarks)
      
      case 'nod':
        return evaluateNodding(landmarks)
      
      default:
        return false
    }
  }

  // Evaluate blinking
  const evaluateBlinking = (landmarks: faceapi.FaceLandmarks68): boolean => {
    const leftEye = landmarks.getLeftEye()
    const rightEye = landmarks.getRightEye()
    
    // Calculate eye aspect ratio (EAR)
    const leftEAR = calculateEAR(leftEye)
    const rightEAR = calculateEAR(rightEye)
    const avgEAR = (leftEAR + rightEAR) / 2
    
    // Threshold for closed eyes (typical EAR for closed eyes is around 0.2)
    return avgEAR < 0.25
  }

  // Calculate Eye Aspect Ratio
  const calculateEAR = (eyePoints: faceapi.Point[]): number => {
    // Vertical eye landmarks
    const A = distance(eyePoints[1], eyePoints[5])
    const B = distance(eyePoints[2], eyePoints[4])
    // Horizontal eye landmark
    const C = distance(eyePoints[0], eyePoints[3])
    
    return (A + B) / (2.0 * C)
  }

  // Calculate distance between two points
  const distance = (point1: faceapi.Point, point2: faceapi.Point): number => {
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2))
  }

  // Evaluate head turn
  const evaluateHeadTurn = (landmarks: faceapi.FaceLandmarks68): boolean => {
    const nose = landmarks.getNose()
    const jawline = landmarks.getJawLine()
    
    // Calculate face orientation based on nose and jawline positions
    const noseTip = nose[nose.length - 1]
    const leftJaw = jawline[0]
    const rightJaw = jawline[jawline.length - 1]
    
    const faceWidth = distance(leftJaw, rightJaw)
    const noseOffset = Math.abs(noseTip.x - (leftJaw.x + rightJaw.x) / 2)
    
    // If nose is significantly off-center, head is turned
    return noseOffset / faceWidth > 0.1
  }

  // Evaluate smile
  const evaluateSmile = (landmarks: faceapi.FaceLandmarks68): boolean => {
    const mouth = landmarks.getMouth()
    
    // Calculate mouth curvature
    const leftCorner = mouth[0]
    const rightCorner = mouth[6]
    const upperLip = mouth[3]
    const lowerLip = mouth[9]
    
    const mouthWidth = distance(leftCorner, rightCorner)
    const mouthHeight = distance(upperLip, lowerLip)
    const ratio = mouthWidth / mouthHeight
    
    // Smiling typically increases width-to-height ratio
    return ratio > 3.5
  }

  // Evaluate nodding
  const evaluateNodding = (landmarks: faceapi.FaceLandmarks68): boolean => {
    // This would require tracking head position over time
    // For now, return a simple implementation
    const nose = landmarks.getNose()
    const chin = landmarks.getJawLine()[8] // Bottom of chin
    
    const faceHeight = distance(nose[0], chin)
    
    // This is a simplified check - in practice, you'd track movement over time
    return faceHeight > 0
  }

  // Start verification process
  const startVerification = async (): Promise<FaceVerificationResult> => {
    try {
      verificationInProgress.value = true
      checkResults.value = {}
      error.value = ''

      securityLogger.log('FACE_VERIFICATION_STARTED', {
        timestamp: new Date().toISOString()
      })

      // Initialize if not already done
      if (!isInitialized.value) {
        const initialized = await initializeFaceAPI()
        if (!initialized) {
          throw new Error('Face API 초기화에 실패했습니다.')
        }
      }

      // Setup camera if not already done
      if (!videoElement.value?.srcObject) {
        await setupCamera()
      }

      // Perform all liveness checks
      let totalScore = 0
      for (const check of verificationConfig.livenessChecks) {
        const result = await performLivenessCheck(check)
        if (result) totalScore++
      }

      const livenessScore = totalScore / verificationConfig.livenessChecks.length
      const verified = livenessScore >= verificationConfig.minConfidence

      const result: FaceVerificationResult = {
        verified,
        confidence: livenessScore,
        livenessScore,
        timestamp: new Date().toISOString(),
        attempts: 1
      }

      securityLogger.log('FACE_VERIFICATION_COMPLETED', {
        verified,
        confidence: livenessScore,
        timestamp: new Date().toISOString()
      })

      return result

    } catch (err: any) {
      console.error('Face verification failed:', err)
      error.value = err.message || '얼굴 인증 중 오류가 발생했습니다.'
      
      const result: FaceVerificationResult = {
        verified: false,
        confidence: 0,
        livenessScore: 0,
        timestamp: new Date().toISOString(),
        attempts: 1,
        errorCode: 'VERIFICATION_FAILED',
        errorMessage: error.value
      }

      securityLogger.log('FACE_VERIFICATION_FAILED', {
        error: err.message,
        timestamp: new Date().toISOString()
      })

      return result
    } finally {
      verificationInProgress.value = false
      currentCheck.value = null
    }
  }

  // Submit verification result to server
  const submitVerificationResult = async (
    userId: string, 
    result: FaceVerificationResult
  ): Promise<boolean> => {
    try {
      const response = await profileAPI.submitFaceVerification(userId, {
        verified: result.verified,
        confidence: result.confidence,
        livenessScore: result.livenessScore,
        timestamp: result.timestamp,
        attempts: result.attempts
      })

      securityLogger.log('FACE_VERIFICATION_SUBMITTED', {
        userId,
        verified: result.verified,
        confidence: result.confidence,
        timestamp: new Date().toISOString()
      })

      return response.data.success
    } catch (err: any) {
      console.error('Failed to submit verification result:', err)
      error.value = '인증 결과 전송에 실패했습니다.'
      return false
    }
  }

  // Stop camera stream
  const stopCamera = () => {
    if (currentStream.value) {
      currentStream.value.getTracks().forEach(track => track.stop())
      currentStream.value = null
    }
    
    if (videoElement.value) {
      videoElement.value.srcObject = null
    }

    securityLogger.log('CAMERA_STOPPED', {
      timestamp: new Date().toISOString()
    })
  }

  // Set video element reference
  const setVideoElement = (element: HTMLVideoElement) => {
    videoElement.value = element
  }

  // Set canvas element reference
  const setCanvasElement = (element: HTMLCanvasElement) => {
    canvasElement.value = element
  }

  return {
    // State
    isInitialized: computed(() => isInitialized.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    verificationInProgress: computed(() => verificationInProgress.value),
    currentCheck: computed(() => currentCheck.value),
    checkResults: computed(() => checkResults.value),
    
    // Computed
    hasCamera,
    allChecksCompleted,
    verificationProgress,
    
    // Methods
    initializeFaceAPI,
    setupCamera,
    detectFaces,
    startVerification,
    submitVerificationResult,
    stopCamera,
    setVideoElement,
    setCanvasElement
  }
}