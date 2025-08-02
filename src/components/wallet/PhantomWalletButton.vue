<template>
	<div class="relative">
		<!-- 연결되지 않은 상태 -->
		<button
			v-if="!isConnected"
			@click="connectWallet"
			:disabled="isConnecting || isAuthenticating"
			class="gli-btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
		>
			<div
				v-if="isConnecting || isAuthenticating"
				class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
			></div>
			<PhantomIcon v-else class="w-5 h-5" />
			<span class="font-medium wallet-button-text">
				{{
					isConnecting
						? "연결 중..."
						: isAuthenticating
							? "인증 중..."
							: "팬텀 월렛"
				}}
			</span>
		</button>

		<!-- 연결된 상태 -->
		<div v-else class="relative">
			<button
				@click="toggleDropdown"
				class="gli-btn-gold flex items-center gap-2"
			>
				<div
					:class="[
						'w-2 h-2 rounded-full',
						isAuthenticated
							? 'bg-green-300 animate-pulse'
							: 'bg-yellow-300 animate-bounce',
					]"
				></div>
				<span class="font-medium">
					{{ isAuthenticated ? shortAddress : "인증 필요" }}
				</span>
				<ChevronDownIcon
					class="w-4 h-4 transition-transform"
					:class="{ 'rotate-180': showDropdown }"
				/>
			</button>

			<!-- 드롭다운 메뉴 -->
			<Transition
				enter-active-class="transition duration-200 ease-out"
				enter-from-class="transform scale-95 opacity-0"
				enter-to-class="transform scale-100 opacity-100"
				leave-active-class="transition duration-150 ease-in"
				leave-from-class="transform scale-100 opacity-100"
				leave-to-class="transform scale-95 opacity-0"
			>
				<div
					v-if="showDropdown"
					class="gli-luxury-card absolute right-0 top-full mt-2 w-80 z-50"
				>
					<!-- 지갑 정보 섹션 -->
					<div class="p-4 border-b border-white/10">
						<div class="flex items-center gap-3 mb-3">
							<div
								class="w-10 h-10 rounded-lg flex items-center justify-center"
								style="background: var(--gli-gradient-primary)"
							>
								<PhantomIcon class="w-6 h-6 text-white" />
							</div>
							<div>
								<h3 class="gli-emoji-enhanced font-semibold text-white">
									팬텀 월렛 💎
								</h3>
								<p class="text-sm text-white/70">연결됨</p>
							</div>
						</div>

						<!-- 주소 표시 -->
						<div class="gli-glass-panel p-3">
							<div class="flex items-center justify-between">
								<span class="text-xs text-white/70">월렛 주소</span>
								<button
									@click="copyAddress"
									class="text-blue-300 hover:text-blue-200 text-xs gli-emoji-enhanced"
								>
									복사 📋
								</button>
							</div>
							<p class="gli-wallet-address mt-1 break-all">
								{{ fullAddress }}
							</p>
						</div>
					</div>

					<!-- 잔액 섹션 -->
					<div class="p-4 border-b border-white/10">
						<div class="flex items-center justify-between">
							<span class="text-sm text-white/70">SOL 잔액</span>
							<button
								@click="updateBalance"
								class="text-blue-300 hover:text-blue-200 text-xs gli-emoji-enhanced"
							>
								새로고침 🔄
							</button>
						</div>
						<p class="text-2xl font-bold text-white mt-1 gli-emoji-enhanced">
							{{ balance.toFixed(4) }} SOL ⚡
						</p>
						<p class="text-xs text-white/50 mt-1">Devnet 테스트넷</p>
					</div>

					<!-- 액션 버튼들 -->
					<div class="p-4 space-y-2">
						<!-- GLI 플랫폼 인증 버튼 (미인증 시) -->
						<button
							v-if="!isAuthenticated"
							@click="authenticateWithWallet"
							:disabled="isAuthenticating"
							class="gli-btn-primary w-full flex items-center gap-3 disabled:opacity-50"
						>
							<div
								v-if="isAuthenticating"
								class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
							></div>
							<span v-else class="text-lg">🚀</span>
							<span>{{
								isAuthenticating ? "GLI 인증 중..." : "GLI 플랫폼 인증하기"
							}}</span>
						</button>

						<!-- 인증 완료 시 표시 -->
						<div
							v-if="isAuthenticated"
							class="gli-glass-panel px-3 py-2 border-green-400/30"
						>
							<div class="flex items-center gap-2 text-green-300">
								<span class="text-lg gli-emoji-enhanced">✅</span>
								<span class="text-sm font-medium">GLI 회원 인증 완료</span>
							</div>
							<p class="text-xs text-green-300/70 mt-1">
								{{ userProfile?.email || "Premium GLI Member" }}
							</p>
						</div>

						<button
							@click="goToProfile"
							class="w-full flex items-center gap-3 px-3 py-2 text-left text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors gli-emoji-enhanced"
						>
							<UserIcon class="w-4 h-4" />
							<span>프로필 보기 👤</span>
						</button>

						<button
							@click="requestAirdrop"
							:disabled="isAirdropping"
							class="w-full flex items-center gap-3 px-3 py-2 text-left text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 gli-emoji-enhanced"
						>
							<div
								v-if="isAirdropping"
								class="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"
							></div>
							<GiftIcon v-else class="w-4 h-4" />
							<span>{{
								isAirdropping ? "에어드랍 중..." : "테스트 SOL 받기 🎁"
							}}</span>
						</button>

						<button
							@click="disconnectWallet"
							class="w-full flex items-center gap-3 px-3 py-2 text-left text-red-300 hover:text-red-200 hover:bg-red-500/20 rounded-lg transition-colors gli-emoji-enhanced"
						>
							<LogoutIcon class="w-4 h-4" />
							<span>{{
								isAuthenticated ? "GLI 로그아웃 🚪" : "지갑 연결 해제 🚪"
							}}</span>
						</button>
					</div>
				</div>
			</Transition>
		</div>

		<!-- 백드롭 -->
		<div
			v-if="showDropdown"
			@click="showDropdown = false"
			class="fixed inset-0 z-40"
		></div>

		<!-- 로그인 필요 모달 -->
		<LoginRequiredModal
			:show="showLoginRequiredModal"
			@close="showLoginRequiredModal = false"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useSolanaWallet } from "@/composables/useSolanaWallet";
import { useSolanaAuth } from "@/composables/useSolanaAuth";
import PhantomIcon from "@/components/icons/PhantomIcon.vue";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
import UserIcon from "@/components/icons/UserIcon.vue";
import GiftIcon from "@/components/icons/GiftIcon.vue";
import LogoutIcon from "@/components/icons/LogoutIcon.vue";
import LoginRequiredModal from "@/components/LoginRequiredModal.vue";

const router = useRouter();
const showDropdown = ref(false);
const isAirdropping = ref(false);
const showLoginRequiredModal = ref(false);

const {
	isConnected,
	isConnecting,
	publicKey,
	balance,
	shortAddress,
	fullAddress,
	connection,
	connectWallet: connectSolanaWallet,
	disconnectWallet: disconnectSolanaWallet,
	updateBalance,
} = useSolanaWallet();

const {
	isAuthenticated,
	isAuthenticating,
	userProfile,
	authenticateWithWallet,
	logout,
} = useSolanaAuth();

const authStore = useAuthStore();

// 지갑 연결 + 인증
const connectWallet = async () => {
	try {
		// 로그인 상태 확인
		if (!authStore.isAuthenticated) {
			// 로그인이 필요하다는 모달 표시
			showLoginRequiredModal.value = true;
			return;
		}

		// 1. 지갑 연결
		await connectSolanaWallet();

		// 2. 지갑 연결 성공 후 인증 시도
		if (isConnected.value) {
			await authenticateWithWallet();
		}
	} catch (error) {
		console.error("지갑 연결 또는 인증 실패:", error);
	}
};

// 지갑 연결 해제 + 로그아웃
const disconnectWallet = async () => {
	try {
		// 1. 로그아웃
		await logout();

		// 2. 지갑 연결 해제
		await disconnectSolanaWallet();

		showDropdown.value = false;
	} catch (error) {
		console.error("로그아웃 실패:", error);
	}
};

const toggleDropdown = () => {
	showDropdown.value = !showDropdown.value;
};

const copyAddress = async () => {
	try {
		await navigator.clipboard.writeText(fullAddress.value);
		// 복사 완료 피드백을 위한 토스트 메시지 (추후 구현)
		console.log("주소가 클립보드에 복사되었습니다! 📋");
	} catch (error) {
		console.error("주소 복사 실패:", error);
	}
};

const goToProfile = () => {
	showDropdown.value = false;
	router.push("/profile");
};

const requestAirdrop = async () => {
	if (!publicKey.value || isAirdropping.value) return;

	try {
		isAirdropping.value = true;

		// 2 SOL 에어드랍 요청
		const signature = await connection.requestAirdrop(
			publicKey.value,
			2 * 1000000000 // 2 SOL in lamports
		);

		// 트랜잭션 확인 대기
		const latestBlockHash = await connection.getLatestBlockhash();
		await connection.confirmTransaction({
			blockhash: latestBlockHash.blockhash,
			lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
			signature: signature,
		});

		// 잔액 업데이트
		await updateBalance();

		console.log("✨ 에어드랍 완료! 2 SOL이 지갑에 추가되었습니다.");
	} catch (error) {
		console.error("에어드랍 실패:", error);
	} finally {
		isAirdropping.value = false;
	}
};
</script>

<style scoped>
.wallet-button-text {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 120px;
}

.gli-btn-primary,
.gli-btn-gold {
	height: 44px;
	white-space: nowrap;
}

.gli-btn-primary span,
.gli-btn-gold span {
	flex: 1;
	text-align: center;
}
</style>
