<template>
	<header class="gli-header">
		<div class="header-container">
			<!-- 로고 영역 -->
			<div class="logo-section">
				<div class="logo">
					<img :src="logoImg" alt="GLI Logo" class="logo-image" />
					<span class="logo-text">GLI Platform</span>
				</div>
			</div>

			<!-- 중앙 상태 표시 -->
			<div class="status-section">
				<!-- 사용자 등급 정보 (로그인 시) -->
				<div v-if="isConnected" class="account-info">
					<div class="account-item">
						<span class="label">💎 등급:</span>
						<span class="value grade-premium">Premium GLI Member</span>
					</div>
				</div>
			</div>

			<!-- 우측 컨트롤 영역 -->
			<div class="controls-section">
				<!-- 테마 토글 -->
				<button
					class="theme-toggle"
					@click="toggleTheme"
					:title="$t('common.theme.toggle')"
				>
					<svg v-if="theme === 'light'" class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
					</svg>
					<svg v-else class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<circle cx="12" cy="12" r="5"/>
						<path d="m12 1-1 2"/>
						<path d="m12 21-1 2"/>
						<path d="M4.22 4.22l1.42 1.42"/>
						<path d="m18.36 18.36 1.42 1.42"/>
						<path d="M1 12h2"/>
						<path d="M21 12h2"/>
						<path d="M4.22 19.78l1.42-1.42"/>
						<path d="M18.36 5.64l1.42-1.42"/>
					</svg>
				</button>

				<!-- 언어 선택 -->
				<div
					class="language-selector"
					:class="{ 'is-open': isLanguageDropdownOpen }"
					@click="toggleLanguageDropdown"
				>
					<div class="selected-language">
						<span class="flag">{{ currentFlag }}</span>
						<span class="language-text">{{ currentLanguageText }}</span>
						<span class="dropdown-arrow">▼</span>
					</div>
					<div v-if="isLanguageDropdownOpen" class="language-dropdown">
						<div
							class="language-option"
							:class="{ active: currentLocale === 'ko' }"
							@click.stop="setLanguage('ko')"
						>
							<span class="flag">🇰🇷</span>
							<span class="language-text">{{
								$t("header.language.korean")
							}}</span>
						</div>
						<div
							class="language-option"
							:class="{ active: currentLocale === 'en' }"
							@click.stop="setLanguage('en')"
						>
							<span class="flag">🇺🇸</span>
							<span class="language-text">{{
								$t("header.language.english")
							}}</span>
						</div>
					</div>
				</div>

				<!-- Phantom 지갑 연결 -->
				<div class="wallet-section">
					<PhantomWalletButton />
				</div>

				<!-- 자동 로그인 설정 -->
				<div v-if="isConnected" class="auto-login">
					<label class="auto-login-checkbox">
						<input type="checkbox" v-model="autoLogin" />
						<span class="checkmark">✅</span>
						<span class="label-text">자동 로그인</span>
					</label>
				</div>
			</div>
		</div>
	</header>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { useThemeStore } from "@/stores/theme";
import { useSolanaWallet } from "@/composables/useSolanaWallet";
import PhantomWalletButton from "@/components/wallet/PhantomWalletButton.vue";
import logoImg from "/img/logo/logo.png";

const { locale, t } = useI18n();
const themeStore = useThemeStore();
const { isConnected } = useSolanaWallet();

const currentLocale = ref(locale.value);
const autoLogin = ref(false);
const isLanguageDropdownOpen = ref(false);

// Theme
const theme = computed(() => themeStore.theme);
const toggleTheme = () => themeStore.toggleTheme();


// 언어 선택기 관련
const currentFlag = computed(() => {
	return currentLocale.value === "ko" ? "🇰🇷" : "🇺🇸";
});

const currentLanguageText = computed(() => {
	return currentLocale.value === "ko"
		? t("header.language.korean")
		: t("header.language.english");
});

const toggleLanguageDropdown = (event: Event) => {
	event.stopPropagation();
	console.log(
		"Toggle dropdown clicked, current state:",
		isLanguageDropdownOpen.value
	);
	isLanguageDropdownOpen.value = !isLanguageDropdownOpen.value;
	console.log("New state:", isLanguageDropdownOpen.value);
};

const setLanguage = (lang: string) => {
	currentLocale.value = lang;
	locale.value = lang;
	isLanguageDropdownOpen.value = false;
};

// 외부 클릭 시 드롭다운 닫기
const closeLanguageDropdown = (event: Event) => {
	const target = event.target as HTMLElement;
	if (!target.closest(".language-selector")) {
		isLanguageDropdownOpen.value = false;
	}
};

// 컴포넌트 마운트 시 외부 클릭 이벤트 리스너 추가
onMounted(() => {
	document.addEventListener("click", closeLanguageDropdown);
});

onUnmounted(() => {
	document.removeEventListener("click", closeLanguageDropdown);
});
</script>

<style scoped>
.gli-header {
	background: var(
		--header-bg,
		linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)
	);
	color: var(--text-primary, white);
	position: sticky;
	top: 0;
	z-index: 100;
	box-shadow: var(--shadow-lg, 0 2px 20px rgba(0, 0, 0, 0.3));
	backdrop-filter: blur(10px);
	height: 80px;
	min-height: 80px;
	border-bottom: 1px solid var(--border-primary, transparent);
	transition: all var(--transition-base, 0.3s ease);
}

.header-container {
	margin: 0 auto;
	padding: 0 1rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 2rem;
	height: 100%;
	min-height: 80px;
}

/* 로고 섹션 */
.logo-section {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	height: 80px;
}

.logo {
	display: flex;
	align-items: flex-end;
	height: 40px;
}

.logo-image {
	width: 40px;
	height: 40px;
	margin-right: 12px;
	object-fit: contain;
	border-radius: 8px;
	background: rgba(255, 255, 255, 0.95);
	padding: 4px;
	backdrop-filter: blur(5px);
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.2);
	flex-shrink: 0;
}

.logo-text {
	font-size: 1.5rem;
	font-weight: bold;
	background: linear-gradient(45deg, #ffd700, #ffed4e, #ffd700);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
	line-height: 1;
	display: flex;
	align-items: center;
	margin-bottom: 7px;
	vertical-align: middle;
	position: relative;
	top: 1px;
}

/* 상태 섹션 */
.status-section {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.5rem;
}


.account-info {
	display: flex;
	gap: 1.5rem;
	font-size: 0.9rem;
}

.account-item {
	display: flex;
	align-items: center;
	gap: 0.25rem;
}

.label {
	color: #b8c5d6;
}

.value {
	font-weight: 600;
}

.grade-premium {
	color: #ffd700;
}


/* 컨트롤 섹션 */
.controls-section {
	display: flex;
	align-items: center;
	gap: 1rem;
	flex-shrink: 0;
}

.theme-toggle {
	background: var(--interactive-primary, var(--gradient-primary));
	border: 1px solid var(--border-primary, transparent);
	border-radius: var(--radius-full, 50%);
	width: 44px;
	height: 44px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	font-size: 1.3rem;
	transition: all var(--transition-base, 0.3s ease);
	position: relative;
	overflow: hidden;
	color: var(--button-primary-text, white);
}

.theme-toggle::before {
	content: "";
	position: absolute;
	inset: 2px;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 50%;
	transition: all 0.3s ease;
}

.theme-toggle:hover {
	transform: scale(1.1);
	filter: brightness(1.1);
	box-shadow: 0 4px 15px rgba(30, 64, 175, 0.4);
}

.theme-toggle:hover::before {
	background: rgba(255, 255, 255, 0.2);
}

.theme-toggle span {
	position: relative;
	z-index: 1;
	filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.theme-icon {
	width: 20px;
	height: 20px;
	position: relative;
	z-index: 1;
	filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
	stroke-width: 2;
}

/* 커스텀 언어 선택기 */
.language-selector {
	position: relative;
	cursor: pointer;
	user-select: none;
}

.selected-language {
	display: flex;
	align-items: center;
	justify-content: flex-start;
	gap: 0.5rem;
	background: var(--interactive-secondary, rgba(255, 255, 255, 0.1));
	border: 1px solid var(--border-secondary, rgba(255, 255, 255, 0.2));
	border-radius: var(--radius-md, 8px);
	color: var(--text-primary, white);
	padding: 0.5rem 0.75rem 0.4rem 0.75rem;
	font-size: 0.9rem;
	transition: all var(--transition-base, 0.3s ease);
	min-width: 120px;
	height: 36px;
	line-height: 1;
	position: relative;
	box-sizing: border-box;
}

.selected-language:hover {
	background: var(--interactive-secondary-hover, rgba(255, 255, 255, 0.15));
	border-color: var(--border-primary, rgba(255, 255, 255, 0.3));
}

.flag {
	font-size: 1.2rem;
	line-height: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	flex-shrink: 0;
	margin-top: -1px;
}

.language-text {
	flex: 1;
	text-align: left;
	line-height: 1;
	font-size: 0.9rem;
	display: flex;
	align-items: center;
	height: 20px;
	padding-right: 1.5rem;
}

.dropdown-arrow {
	font-size: 0.6rem;
	transition: transform 0.3s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 16px;
	height: 16px;
	flex-shrink: 0;
	position: absolute;
	right: 0.75rem;
	top: 50%;
	transform: translateY(-50%);
}

.language-selector.is-open .dropdown-arrow {
	transform: translateY(-50%) rotate(180deg);
}

.language-dropdown {
	position: absolute;
	top: 100%;
	left: 0;
	right: 0;
	background: rgba(30, 42, 58, 0.95);
	backdrop-filter: blur(10px);
	border: 1px solid rgba(255, 255, 255, 0.2);
	border-radius: 8px;
	margin-top: 0.25rem;
	z-index: 1000;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	overflow: hidden;
	animation: dropdownFadeIn 0.2s ease-out;
	min-width: 120px;
}

.language-option {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
	padding: 0.75rem;
	cursor: pointer;
	transition: all 0.2s ease;
	border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	height: 36px;
	line-height: 1;
}

.language-option:last-child {
	border-bottom: none;
}

.language-option:hover {
	background: rgba(255, 255, 255, 0.1);
}

.language-option.active {
	background: rgba(59, 130, 246, 0.2);
	border-left: 3px solid #3b82f6;
}

.language-option .flag {
	font-size: 1.2rem;
	line-height: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	flex-shrink: 0;
}

.language-option .language-text {
	flex: 1;
	text-align: left;
	line-height: 1;
	font-size: 0.9rem;
	display: flex;
	align-items: center;
	height: 20px;
}

@keyframes dropdownFadeIn {
	from {
		opacity: 0;
		transform: translateY(-10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.connect-wallet-btn {
	background: linear-gradient(45deg, #4caf50, #45a049);
	border: none;
	border-radius: 25px;
	color: white;
	padding: 0.75rem 1.5rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.3s ease;
	box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
}

.connect-wallet-btn:hover:not(:disabled) {
	transform: translateY(-2px);
	box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
}

.connect-wallet-btn:disabled {
	opacity: 0.7;
	cursor: not-allowed;
}

.wallet-connected {
	display: flex;
	align-items: center;
	gap: 1rem;
}

.balance-display {
	background: rgba(255, 255, 255, 0.1);
	padding: 0.5rem 1rem;
	border-radius: 15px;
	font-size: 0.9rem;
}

.balance-value {
	font-weight: 600;
	color: #81c784;
}

.disconnect-btn {
	background: linear-gradient(45deg, #f44336, #d32f2f);
	border: none;
	border-radius: 20px;
	color: white;
	padding: 0.5rem 1rem;
	font-size: 0.9rem;
	cursor: pointer;
	transition: all 0.3s ease;
}

.disconnect-btn:hover {
	transform: scale(1.05);
}

.auto-login {
	display: flex;
	align-items: center;
}

.auto-login-checkbox {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
	font-size: 0.9rem;
}

.auto-login-checkbox input {
	display: none;
}

.checkmark {
	opacity: 0.5;
	transition: opacity 0.3s ease;
}

.auto-login-checkbox input:checked + .checkmark {
	opacity: 1;
}

@keyframes pulse {
	0%,
	100% {
		opacity: 1;
	}
	50% {
		opacity: 0.5;
	}
}

/* 다크 모드 오버라이드 */
:global([data-color-mode="dark"]) .gli-header {
	background: var(--header-bg);
	color: var(--text-primary);
}

:global([data-color-mode="dark"]) .theme-toggle {
	background: var(--interactive-secondary);
	border: 1px solid var(--border-primary);
}

/* 테마별 특별 스타일 */
:global([data-concept-theme="minimal"]) .gli-header {
	border-radius: 0 !important;
	backdrop-filter: none;
}

:global([data-concept-theme="minimal"]) .gli-header * {
	border-radius: 0 !important;
}

:global([data-concept-theme="luxury"]) .gli-header {
	background: var(--luxury-gradient, var(--header-bg));
	text-shadow: var(--luxury-text-shadow, none);
}

/* 반응형 */
@media (max-width: 1024px) {
	.header-container {
		gap: 0.5rem;
	}

	.account-info {
		flex-direction: column;
		gap: 0.5rem;
		text-align: center;
	}
}

@media (max-width: 768px) {
	.controls-section {
		flex-wrap: wrap;
		justify-content: center;
	}

	.account-info {
		font-size: 0.8rem;
	}

	.logo-image {
		width: 32px;
		height: 32px;
		margin-right: 8px;
	}

	.logo-text {
		font-size: 1.2rem;
	}
}

@media (max-width: 480px) {
	.logo-image {
		width: 28px;
		height: 28px;
		margin-right: 6px;
	}

	.logo-text {
		font-size: 1rem;
	}
}

/* 월렛 연동 버튼과 관련된 텍스트 래핑 방지 */
.wallet-section {
	flex-shrink: 0;
}

.wallet-section button {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
</style>
