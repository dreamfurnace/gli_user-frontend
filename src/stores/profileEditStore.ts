import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { profileAPI } from '@/services/api'
import type { ProfileData } from '@/services/api'

export const useProfileEditStore = defineStore('profileEdit', () => {
  // 상태
  const profileData = ref<ProfileData>({
    email: '',
    name: '',
    phone: '',
    profile_image_url: '',
    account_type: 'email',
    is_phone_verified: false,
    subscription_type: 'free',
    subscription_status: 'active',
    role: 'user',
    payment_method_registered: false,
    payment_card_number: '',
    payment_card_type: '',
    payment_card_expiry: '',
  })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const success = ref<string | null>(null)

  // 게터
  const isFormValid = computed(() => {
    return (profileData.value.name?.trim().length ?? 0) > 0
  })

  // 액션
  async function fetchProfile() {
    loading.value = true
    error.value = null
    try {
      const response = await profileAPI.getProfile()
      profileData.value = {
        id: response.data.id,
        email: response.data.email || '',
        name: response.data.name || '',
        phone: response.data.phone || '',
        profile_image_url: response.data.profile_image_url || '',
        account_type: response.data.account_type || 'email',
        is_phone_verified: response.data.is_phone_verified || false,
        phone_verified_at: response.data.phone_verified_at,
        subscription_type: response.data.subscription_type || 'free',
        subscription_status: response.data.subscription_status || 'active',
        subscription_start_date: response.data.subscription_start_date,
        subscription_end_date: response.data.subscription_end_date,
        role: response.data.role || 'user',
        created_at: response.data.created_at,
        updated_at: response.data.updated_at,
        payment_method_registered: response.data.payment_method_registered || false,
        payment_card_number: response.data.payment_card_number || '',
        payment_card_type: response.data.payment_card_type || '',
        payment_card_expiry: response.data.payment_card_expiry || '',
      }
    } catch (err: any) {
      error.value =
        err.response?.data?.message || err.message || '프로필 정보를 불러오는데 실패했습니다.'
    } finally {
      loading.value = false
    }
  }

  async function updateProfile() {
    if (!isFormValid.value) {
      error.value = '이름을 입력해주세요.'
      return
    }

    loading.value = true
    error.value = null
    success.value = null

    try {
      const updateData = {
        name: profileData.value.name,
        phone: profileData.value.phone,
        subscription_type: profileData.value.subscription_type,
        subscription_status: profileData.value.subscription_status,
      }
      const response = await profileAPI.updateProfile(updateData)
      success.value = '프로필이 성공적으로 업데이트되었습니다.'
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || '프로필 업데이트에 실패했습니다.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function uploadAvatar(file: File) {
    loading.value = true
    error.value = null
    success.value = null

    try {
      const response = await profileAPI.uploadAvatar(file)
      profileData.value.profile_image_url = response.data.profile.profile_image_url
      success.value = '아바타가 성공적으로 업로드되었습니다.'
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || '아바타 업로드에 실패했습니다.'
      throw err
    } finally {
      loading.value = false
    }
  }

  function updateProfileImage(imageUrl: string) {
    profileData.value.profile_image_url = imageUrl
  }

  function clearMessages() {
    error.value = null
    success.value = null
  }

  return {
    profileData,
    loading,
    error,
    success,
    isFormValid,
    fetchProfile,
    updateProfile,
    uploadAvatar,
    updateProfileImage,
    clearMessages,
  }
})
