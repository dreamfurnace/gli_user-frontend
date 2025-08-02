<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">친구 초대하기</h3>
        <button class="close-button" @click="closeModal">×</button>
      </div>

      <div class="modal-body">
        <!-- Referral Code Display -->
        <div class="referral-code-section">
          <label class="section-label">나의 초대 코드</label>
          <div class="code-display">
            <span class="referral-code">{{ formattedReferralCode }}</span>
            <button 
              class="copy-button" 
              @click="copyReferralCode"
              :disabled="copyingCode"
            >
              {{ copyingCode ? '복사 중...' : (codeCopied ? '복사됨!' : '복사') }}
            </button>
          </div>
        </div>

        <!-- Referral Link Display -->
        <div class="referral-link-section">
          <label class="section-label">초대 링크</label>
          <div class="link-display">
            <input 
              ref="linkInput"
              type="text" 
              :value="referralLink" 
              readonly
              class="link-input"
            />
            <button 
              class="copy-button" 
              @click="copyReferralLink"
              :disabled="copyingLink"
            >
              {{ copyingLink ? '복사 중...' : (linkCopied ? '복사됨!' : '복사') }}
            </button>
          </div>
        </div>

        <!-- QR Code Section -->
        <div class="qr-code-section">
          <label class="section-label">QR 코드</label>
          <div class="qr-code-container">
            <canvas ref="qrCanvas" class="qr-code"></canvas>
            <button class="download-button" @click="downloadQRCode">
              QR 코드 다운로드
            </button>
          </div>
        </div>

        <!-- Social Share Buttons -->
        <div class="share-section">
          <label class="section-label">소셜 미디어로 공유</label>
          <div class="share-buttons">
            <button class="share-button kakao" @click="shareToKakao">
              <div class="icon-kakao">💬</div>
              카카오톡
            </button>
            <button class="share-button telegram" @click="shareToTelegram">
              <div class="icon-telegram">✈️</div>
              텔레그램
            </button>
            <button class="share-button twitter" @click="shareToTwitter">
              <div class="icon-twitter">🐦</div>
              트위터
            </button>
            <button class="share-button email" @click="shareByEmail">
              <div class="icon-email">📧</div>
              이메일
            </button>
          </div>
        </div>

        <!-- Instructions -->
        <div class="instructions-section">
          <h4>초대 방법</h4>
          <ol class="instructions-list">
            <li>위의 초대 코드나 링크를 친구에게 공유하세요</li>
            <li>친구가 코드를 사용하여 회원가입하면 보상을 받습니다</li>
            <li>GLI-B 토큰으로 보상이 지급됩니다</li>
          </ol>
        </div>
      </div>

      <div class="modal-footer">
        <button class="close-modal-button" @click="closeModal">
          닫기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useReferral } from '@/composables/useReferral'
import { securityLogger } from '@/utils/security'
import QRCode from 'qrcode'

interface Props {
  show: boolean
  referralCode?: string
  userId?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const { 
  formattedReferralCode, 
  referralLink, 
  generateReferralLink 
} = useReferral()

// Refs
const linkInput = ref<HTMLInputElement>()
const qrCanvas = ref<HTMLCanvasElement>()

// State
const copyingCode = ref(false)
const copyingLink = ref(false)
const codeCopied = ref(false)
const linkCopied = ref(false)

// Methods
const closeModal = () => {
  emit('close')
}

const copyReferralCode = async () => {
  if (!props.referralCode) return
  
  try {
    copyingCode.value = true
    await navigator.clipboard.writeText(props.referralCode)
    codeCopied.value = true
    
    // Log share event
    securityLogger.log('REFERRAL_CODE_COPIED', {
      userId: props.userId,
      method: 'clipboard',
      timestamp: new Date().toISOString()
    })
    
    setTimeout(() => {
      codeCopied.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy referral code:', error)
    alert('복사에 실패했습니다. 수동으로 복사해주세요.')
  } finally {
    copyingCode.value = false
  }
}

const copyReferralLink = async () => {
  if (!referralLink.value) return
  
  try {
    copyingLink.value = true
    await navigator.clipboard.writeText(referralLink.value)
    linkCopied.value = true
    
    // Log share event
    securityLogger.log('REFERRAL_LINK_COPIED', {
      userId: props.userId,
      method: 'clipboard',
      timestamp: new Date().toISOString()
    })
    
    setTimeout(() => {
      linkCopied.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy referral link:', error)
    
    // Fallback: select the text
    if (linkInput.value) {
      linkInput.value.select()
      document.execCommand('copy')
      linkCopied.value = true
      setTimeout(() => {
        linkCopied.value = false
      }, 2000)
    }
  } finally {
    copyingLink.value = false
  }
}

const generateQRCode = async () => {
  if (!qrCanvas.value || !referralLink.value) return
  
  try {
    await QRCode.toCanvas(qrCanvas.value, referralLink.value, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
  } catch (error) {
    console.error('Failed to generate QR code:', error)
  }
}

const downloadQRCode = () => {
  if (!qrCanvas.value) return
  
  try {
    const link = document.createElement('a')
    link.download = `GLI-Referral-${props.referralCode || 'code'}.png`
    link.href = qrCanvas.value.toDataURL()
    link.click()
    
    // Log download event
    securityLogger.log('REFERRAL_QR_DOWNLOADED', {
      userId: props.userId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to download QR code:', error)
    alert('QR 코드 다운로드에 실패했습니다.')
  }
}

const shareToKakao = () => {
  const shareText = `GLI 플랫폼에 함께 참여하세요! 초대 코드: ${props.referralCode}`
  const shareUrl = referralLink.value
  
  // Log share event
  securityLogger.log('REFERRAL_SHARED', {
    userId: props.userId,
    platform: 'kakao',
    timestamp: new Date().toISOString()
  })
  
  // Check if Kakao SDK is available
  if (typeof window !== 'undefined' && (window as any).Kakao) {
    (window as any).Kakao.Link.sendDefault({
      objectType: 'text',
      text: shareText,
      link: {
        webUrl: shareUrl,
        mobileWebUrl: shareUrl
      }
    })
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
    alert('카카오톡 SDK가 없어 클립보드에 복사했습니다.')
  }
}

const shareToTelegram = () => {
  const shareText = `GLI 플랫폼에 함께 참여하세요! 초대 코드: ${props.referralCode}`
  const shareUrl = referralLink.value
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
  
  // Log share event
  securityLogger.log('REFERRAL_SHARED', {
    userId: props.userId,
    platform: 'telegram',
    timestamp: new Date().toISOString()
  })
  
  window.open(telegramUrl, '_blank')
}

const shareToTwitter = () => {
  const shareText = `GLI 플랫폼에 함께 참여하세요! 초대 코드: ${props.referralCode}`
  const shareUrl = referralLink.value
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
  
  // Log share event
  securityLogger.log('REFERRAL_SHARED', {
    userId: props.userId,
    platform: 'twitter',
    timestamp: new Date().toISOString()
  })
  
  window.open(twitterUrl, '_blank')
}

const shareByEmail = () => {
  const subject = 'GLI 플랫폼 초대'
  const body = `안녕하세요!

GLI 플랫폼에 함께 참여하세요!

초대 코드: ${props.referralCode}
가입 링크: ${referralLink.value}

GLI 플랫폼에서 다양한 Web3 서비스를 경험해보세요!`
  
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  
  // Log share event
  securityLogger.log('REFERRAL_SHARED', {
    userId: props.userId,
    platform: 'email',
    timestamp: new Date().toISOString()
  })
  
  window.location.href = mailtoUrl
}

// Initialize QR code when modal opens
onMounted(async () => {
  if (props.show && props.referralCode) {
    // Generate referral link first
    await generateReferralLink(props.referralCode)
    await nextTick()
    await generateQRCode()
  }
})

// Watch for changes in show prop to regenerate QR code
watch(() => props.show, async (newShow) => {
  if (newShow && props.referralCode) {
    // Generate referral link first
    await generateReferralLink(props.referralCode)
    await nextTick()
    await generateQRCode()
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
}

.modal-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  color: #333;
}

.modal-body {
  padding: 24px;
}

.section-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.referral-code-section,
.referral-link-section,
.qr-code-section,
.share-section,
.instructions-section {
  margin-bottom: 24px;
}

.code-display,
.link-display {
  display: flex;
  gap: 8px;
  align-items: center;
}

.referral-code {
  font-family: monospace;
  font-size: 18px;
  font-weight: bold;
  color: #0d6efd;
  background: #f8f9fa;
  padding: 12px 16px;
  border-radius: 6px;
  border: 1px solid #ddd;
  flex: 1;
  text-align: center;
  letter-spacing: 2px;
}

.link-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: #f8f9fa;
}

.copy-button {
  padding: 12px 16px;
  background: #0d6efd;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
  transition: background 0.2s;
}

.copy-button:hover:not(:disabled) {
  background: #0b5ed7;
}

.copy-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.qr-code-container {
  text-align: center;
}

.qr-code {
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 12px;
}

.download-button {
  padding: 8px 16px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.download-button:hover {
  background: #218838;
}

.share-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.share-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.share-button:hover {
  background: #f8f9fa;
  transform: translateY(-1px);
}

.share-button [class^="icon-"] {
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.share-button.kakao:hover {
  border-color: #fee500;
  background: #fffbf0;
}

.share-button.telegram:hover {
  border-color: #0088cc;
  background: #f0f8ff;
}

.share-button.twitter:hover {
  border-color: #1da1f2;
  background: #f0f8ff;
}

.share-button.email:hover {
  border-color: #dc3545;
  background: #fff5f5;
}

.instructions-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
}

.instructions-list {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.instructions-list li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #eee;
  text-align: center;
}

.close-modal-button {
  padding: 12px 24px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.close-modal-button:hover {
  background: #5a6268;
}

@media (max-width: 480px) {
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .share-buttons {
    grid-template-columns: 1fr;
  }
  
  .code-display,
  .link-display {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>