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
				<!-- 네트워크 상태 -->
				<div class="network-status" :class="networkStatusClass">
					<div class="status-indicator"></div>
					<span class="status-text">{{ networkStatusText }}</span>
				</div>

				<!-- 계정 정보 (로그인 시) -->
				<div v-if="isConnected" class="account-info">
					<div class="account-item">
						<span class="label">💎 등급:</span>
						<span class="value grade-premium">Premium GLI Member</span>
					</div>
					<div class="account-item">
						<span class="label">🏦 지갑 주소:</span>
						<span class="value wallet-address">{{ shortAddress }}</span>
					</div>
					<div class="account-item">
						<span class="label">🌐 네트워크:</span>
						<span class="value auth-number">Solana Devnet</span>
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
					<span v-if="theme === 'light'">🌙</span>
					<span v-else>☀️</span>
				</button>

				<!-- 언어 선택 -->
				<div class="language-selector">
					<select v-model="currentLocale" @change="changeLanguage">
						<option value="ko">🇰🇷 {{ $t("header.language.korean") }}</option>
						<option value="en">🇺🇸 {{ $t("header.language.english") }}</option>
					</select>
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
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useThemeStore } from "@/stores/theme";
import { useSolanaWallet } from "@/composables/useSolanaWallet";
import PhantomWalletButton from "@/components/wallet/PhantomWalletButton.vue";
import logoImg from "/img/logo/logo.png";

const { locale, t } = useI18n();
const themeStore = useThemeStore();
const { isConnected, shortAddress } = useSolanaWallet();

const currentLocale = ref(locale.value);
const autoLogin = ref(false);

// Theme
const theme = computed(() => themeStore.theme);
const toggleTheme = () => themeStore.toggleTheme();

// 네트워크 상태 (Solana 기반)
const networkStatusClass = computed(() => ({
	"status-connected": isConnected.value,
	"status-connecting": false,
	"status-disconnected": !isConnected.value,
}));

const networkStatusText = computed(() => {
	return isConnected.value
		? "🟢 Solana Devnet Connected"
		: "🔴 Wallet Disconnected";
});

// 언어 변경
const changeLanguage = () => {
	locale.value = currentLocale.value;
};
</script>

<style scoped>
.gli-header {
	background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
	color: white;
	position: sticky;
	top: 0;
	z-index: 100;
	box-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
	backdrop-filter: blur(10px);
	height: 80px; /* 고정 높이 설정 */
	min-height: 80px;
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
}

.logo {
	display: flex;
	align-items: center;
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
}

.logo-text {
	font-size: 1.5rem;
	font-weight: bold;
	background: linear-gradient(45deg, #ffd700, #ffed4e, #ffd700);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}

/* 상태 섹션 */
.status-section {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.5rem;
}

.network-status {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	border-radius: 20px;
	background: rgba(255, 255, 255, 0.1);
	backdrop-filter: blur(5px);
}

.status-indicator {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: #ff4444;
}

.status-connected .status-indicator {
	background: #44ff44;
}

.status-connecting .status-indicator {
	background: #ffaa44;
	animation: pulse 1s infinite;
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

.wallet-address {
	font-family: monospace;
	color: #64b5f6;
}

.auth-number {
	color: #81c784;
	font-weight: bold;
}

/* 컨트롤 섹션 */
.controls-section {
	display: flex;
	align-items: center;
	gap: 1rem;
	flex-shrink: 0;
}

.theme-toggle {
	background: var(--gradient-primary);
	border: none;
	border-radius: 50%;
	width: 44px;
	height: 44px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	font-size: 1.3rem;
	transition: all 0.3s ease;
	position: relative;
	overflow: hidden;
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

.language-selector select {
	background: rgba(255, 255, 255, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.2);
	border-radius: 8px;
	color: white;
	padding: 0.5rem;
	font-size: 0.9rem;
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

/* 다크 테마 */
:global(.dark) .gli-header {
	background: linear-gradient(135deg, #0d1117 0%, #161b22 50%, #21262d 100%);
}

:global(.dark) .network-status,
:global(.dark) .theme-toggle,
:global(.dark) .balance-display {
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 반응형 */
@media (max-width: 1024px) {
	.header-container {
		flex-direction: column;
		gap: 1rem;
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
