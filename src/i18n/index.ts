import { createI18n } from 'vue-i18n'
import ko from './locales/ko'
import en from './locales/en'

const messages = {
  ko,
  en,
}

type LocaleType = keyof typeof messages

// 브라우저 언어 감지
function getDefaultLocale(): LocaleType {
  const savedLocale = localStorage.getItem('locale') as LocaleType
  if (savedLocale && messages[savedLocale]) {
    return savedLocale
  }

  const browserLocale = navigator.language.split('-')[0] as LocaleType
  if (messages[browserLocale]) {
    return browserLocale
  }

  return 'ko' // 기본값은 한국어
}

export const i18n = createI18n({
  legacy: false, // Composition API 사용
  locale: getDefaultLocale(),
  fallbackLocale: 'ko',
  messages,
})

// 언어 변경 함수
export function setLocale(locale: LocaleType) {
  if (messages[locale]) {
    i18n.global.locale.value = locale
    localStorage.setItem('locale', locale)
  }
}

// 현재 언어 가져오기
export function getCurrentLocale(): LocaleType {
  return i18n.global.locale.value as LocaleType
}

// 사용 가능한 언어 목록
export const availableLocales = [
  { code: 'ko' as const, name: '한국어' },
  { code: 'en' as const, name: 'English' },
]
