<template>
	<aside class="gli-sidebar" :class="{ collapsed: isCollapsed }">
		<div class="sidebar-header">
			<button class="collapse-btn" @click="toggleCollapse">
				<svg v-if="isCollapsed" viewBox="0 0 24 24" class="collapse-icon">
					<path d="M8.59 16.59L13.17 12L8.59 7.41L10 6l6 6-6 6-1.41-1.41z" />
				</svg>
				<svg v-else viewBox="0 0 24 24" class="collapse-icon">
					<path d="M15.41 7.41L10.83 12l4.58 4.59L14 18l-6-6 6-6z" />
				</svg>
			</button>
		</div>

		<nav class="sidebar-nav">
			<div class="nav-section">
				<ul class="nav-list">
					<li class="nav-item">
						<div
							class="nav-link"
							:class="{ active: $route.path.startsWith('/business') }"
							@click="handleBusinessMenuClick"
						>
							<span class="nav-icon">🏢</span>
							<span class="nav-text" v-if="!isCollapsed">사업 소개</span>
							<span class="nav-tooltip" v-if="isCollapsed">사업 소개</span>
							<span v-if="!isCollapsed" class="nav-arrow">
								{{ isBusinessExpanded ? "◀︎" : "▼" }}
							</span>
						</div>

						<!-- 하위 메뉴 -->
						<div v-if="!isCollapsed && isBusinessExpanded" class="submenu">
							<a
								v-for="submenu in businessSubmenus"
								:key="submenu.id"
								@click.prevent="scrollToBusinessSection(submenu.id)"
								class="submenu-link"
								:class="{ active: activeBusinessSection === submenu.id }"
							>
								<span class="submenu-icon">{{ submenu.icon }}</span>
								<span class="submenu-text">{{ submenu.label }}</span>
							</a>
						</div>
					</li>

					<li class="nav-item">
						<router-link
							to="/rwa-assets"
							class="nav-link"
							:class="{ active: $route.path.startsWith('/rwa-assets') }"
						>
							<span class="nav-icon">🏗️</span>
							<span class="nav-text" v-if="!isCollapsed">RWA 투자 자산 목록</span>
							<span class="nav-tooltip" v-if="isCollapsed">RWA 투자 자산 목록</span>
						</router-link>
					</li>

					<li class="nav-item">
						<router-link
							to="/auth"
							class="nav-link"
							:class="{ active: $route.path.startsWith('/auth') }"
						>
							<span class="nav-icon">🔐</span>
							<span class="nav-text" v-if="!isCollapsed">{{
								$t("nav.auth")
							}}</span>
							<span class="nav-tooltip" v-if="isCollapsed">{{
								$t("nav.auth")
							}}</span>
							<span
								v-if="!isCollapsed && authProgress < 100"
								class="progress-badge"
							>
								{{ authProgress }}%
							</span>
						</router-link>
					</li>

					<li class="nav-item">
						<router-link
							to="/conversion"
							class="nav-link"
							:class="{ active: $route.path.startsWith('/conversion') }"
						>
							<span class="nav-icon">💱</span>
							<span class="nav-text" v-if="!isCollapsed">{{
								$t("nav.conversion")
							}}</span>
							<span class="nav-tooltip" v-if="isCollapsed">{{
								$t("nav.conversion")
							}}</span>
						</router-link>
					</li>

					<li class="nav-item">
						<router-link
							to="/shopping"
							class="nav-link"
							:class="{ active: $route.path.startsWith('/shopping') }"
						>
							<span class="nav-icon">🛍️</span>
							<span class="nav-text" v-if="!isCollapsed">GLI-L 쇼핑몰</span>
							<span class="nav-tooltip" v-if="isCollapsed">GLI-L 쇼핑몰</span>
						</router-link>
					</li>

					<li class="nav-item">
						<router-link
							to="/mypage"
							class="nav-link"
							:class="{ active: $route.path.startsWith('/mypage') }"
						>
							<span class="nav-icon">🧑</span>
							<span class="nav-text" v-if="!isCollapsed">{{
								$t("nav.mypage")
							}}</span>
							<span class="nav-tooltip" v-if="isCollapsed">{{
								$t("nav.mypage")
							}}</span>
						</router-link>
					</li>

					<li class="nav-item">
						<router-link
							to="/referral"
							class="nav-link"
							:class="{ active: $route.path.startsWith('/referral') }"
						>
							<span class="nav-icon">🤝</span>
							<span class="nav-text" v-if="!isCollapsed">{{
								$t("nav.referral")
							}}</span>
							<span class="nav-tooltip" v-if="isCollapsed">{{
								$t("nav.referral")
							}}</span>
							<span
								v-if="!isCollapsed && referralCount > 0"
								class="count-badge"
							>
								{{ referralCount }}
							</span>
						</router-link>
					</li>

					<li class="nav-item">
						<router-link
							to="/help-center"
							class="nav-link"
							:class="{ active: $route.path.startsWith('/help-center') }"
						>
							<span class="nav-icon">❓</span>
							<span class="nav-text" v-if="!isCollapsed">안내 센터</span>
							<span class="nav-tooltip" v-if="isCollapsed">안내 센터</span>
						</router-link>
					</li>
				</ul>
			</div>

			<!-- 토큰 잔액 표시 (확장된 상태에서만) -->
			<div v-if="!isCollapsed && isConnected" class="token-balances">
				<h4 class="balance-title">💰 {{ $t("common.balance") }}</h4>
				<div class="balance-list">
					<div class="balance-item">
						<span class="token-name">GLIB</span>
						<span class="token-amount">{{ tokenBalances.glib }}</span>
					</div>
					<div class="balance-item">
						<span class="token-name">GLID</span>
						<span class="token-amount">{{ tokenBalances.glid }}</span>
					</div>
					<div class="balance-item">
						<span class="token-name">GLIL</span>
						<span class="token-amount">{{ tokenBalances.glil }}</span>
					</div>
					<div class="balance-item">
						<span class="token-name">USDT</span>
						<span class="token-amount">{{ tokenBalances.usdt }}</span>
					</div>
				</div>
			</div>
		</nav>
	</aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, inject } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useWeb3Store } from "@/stores/web3";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const web3Store = useWeb3Store();

// Inject sidebar collapse controls from parent App.vue
const sidebarControls = inject('sidebarCollapsed', {
	isLeftSidebarCollapsed: ref(false),
	setLeftSidebarCollapsed: (collapsed: boolean) => {}
});

const isCollapsed = computed({
	get: () => sidebarControls.isLeftSidebarCollapsed.value,
	set: (value: boolean) => sidebarControls.setLeftSidebarCollapsed(value)
});
const authProgress = ref(65); // 예시 진행률
const referralCount = ref(3); // 예시 레퍼럴 수

// 사업소개 메뉴 관련
const isBusinessExpanded = ref(false);
const activeBusinessSection = ref("");

// 사업소개 하위 메뉴 정의
const businessSubmenus = [
	{ id: "background", icon: "🎯", label: "1.회사 소개" },
	{ id: "team", icon: "👥", label: "2.사업 소개" },
	{ id: "strategy", icon: "📊", label: "3.사업 계획" },
	{ id: "roadmap", icon: "🗓️", label: "4.생태계 토큰" },
	{ id: "tokens", icon: "🪙", label: "5.추진 사업" },
];

const isConnected = computed(() => web3Store.isConnected);
const tokenBalances = computed(() => web3Store.tokenBalances);

const toggleCollapse = () => {
	isCollapsed.value = !isCollapsed.value;
	if (isCollapsed.value) {
		isBusinessExpanded.value = false;
	}
};

// 사업소개 메뉴 클릭 핸들러
const handleBusinessMenuClick = () => {
	if (isCollapsed.value) {
		// 축소된 상태에서는 바로 페이지로 이동
		router.push("/business");
		return;
	}

	// 확장된 상태에서는 하위 메뉴 토글
	isBusinessExpanded.value = !isBusinessExpanded.value;

	// 사업소개 페이지에 있지 않다면 이동
	if (!route.path.startsWith("/business")) {
		router.push("/business");
	}
};

// 사업소개 섹션으로 스크롤
const scrollToBusinessSection = (sectionId: string) => {
	// 먼저 사업소개 페이지로 이동 (이미 해당 페이지에 있다면 스크롤만 실행)
	if (!route.path.startsWith("/business")) {
		router.push("/business").then(() => {
			// 페이지 이동 후 스크롤
			setTimeout(() => scrollToSection(sectionId), 100);
		});
	} else {
		scrollToSection(sectionId);
	}

	activeBusinessSection.value = sectionId;
};

// 실제 스크롤 함수
const scrollToSection = (sectionId: string) => {
	const element = document.getElementById(sectionId);
	if (element) {
		// 헤더 높이(80px) + 사이드바 네비게이션 높이(약 100px) 고려
		const offsetTop = element.offsetTop - 180;
		window.scrollTo({
			top: offsetTop,
			behavior: "smooth",
		});
	}
};

// 현재 활성 섹션 감지
const detectActiveSection = () => {
	if (!route.path.startsWith("/business")) {
		activeBusinessSection.value = "";
		return;
	}

	const scrollY = window.scrollY + 200; // 오프셋 적용

	businessSubmenus.forEach((section) => {
		const element = document.getElementById(section.id);
		if (element) {
			const rect = element.getBoundingClientRect();
			const elementTop = rect.top + window.scrollY;
			const elementBottom = elementTop + rect.height;

			if (scrollY >= elementTop - 100 && scrollY < elementBottom - 100) {
				activeBusinessSection.value = section.id;
			}
		}
	});
};

// 라이프사이클 훅
onMounted(() => {
	// 사업소개 페이지에서 시작한다면 메뉴 확장
	if (route.path.startsWith("/business")) {
		isBusinessExpanded.value = true;
	}

	// 스크롤 이벤트 리스너 등록
	window.addEventListener("scroll", detectActiveSection);
	detectActiveSection(); // 초기 감지
});

onUnmounted(() => {
	window.removeEventListener("scroll", detectActiveSection);
});
</script>

<style scoped>
.gli-sidebar {
	position: fixed;
	left: 0;
	top: 80px; /* 헤더 높이만큼 */
	height: calc(100vh - 80px);
	width: 250px;
	background: var(--sidebar-bg, var(--gradient-dark));
	color: var(--text-primary, white);
	transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	z-index: 50;
	box-shadow: var(--shadow-lg);
	border-right: 1px solid var(--border-primary, var(--border-color));
	overflow-y: auto;
	overflow-x: hidden;
}

.gli-sidebar.collapsed {
	width: 70px;
}

.sidebar-header {
	padding: 0.5rem;
	display: flex;
	justify-content: flex-end;
}

.gli-sidebar.collapsed .sidebar-header {
	justify-content: center;
}

.collapse-btn {
	border: 1px solid var(--border-secondary, transparent);
	color: var(--text-primary, white);
	background: var(--interactive-secondary, rgba(255, 255, 255, 0.081));
	padding: 0;
	border-radius: var(--radius-md, 8px);
	cursor: pointer;
	transition: all var(--transition-base, 0.3s ease);
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 34px;
	min-width: 34px;
}

.collapse-icon {
	width: 16px;
	height: 16px;
	fill: currentColor;
	transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.collapse-btn:hover .collapse-icon {
	transform: scale(1.1);
}

.collapse-btn:hover {
	background: var(--interactive-secondary-hover, rgba(255, 255, 255, 0.2));
	transform: scale(1.1);
}

.sidebar-nav {
	display: flex;
	flex-direction: column;
	height: calc(100% - 80px);
}

.nav-section {
	flex: 1;
}

.nav-list {
	list-style: none;
	padding: 0;
	margin: 0;
}

.nav-item {
	margin-bottom: 0.5rem;
}

.nav-link {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 0.4rem 1.5rem;
	color: #94a3b8;
	text-decoration: none;
	transition: all 0.3s ease;
	position: relative;
	cursor: pointer;
}

.collapsed .nav-link {
	padding: 1rem;
	justify-content: center;
}

.nav-link:hover {
	background: rgba(255, 255, 255, 0.1);
	color: white;
}

.nav-link.active {
	background: linear-gradient(90deg, var(--gli-blue), var(--gli-purple));
	color: white;
	border-right: 3px solid var(--gli-gold);
	box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
}

.nav-icon {
	font-size: 1.5rem;
	flex-shrink: 0;
}

.nav-text {
	font-weight: 500;
	white-space: nowrap;
	opacity: 1;
	transition:
		opacity 0.3s ease 0.1s,
		transform 0.3s ease 0.1s;
	transform: translateX(0);
}

.collapsed .nav-text {
	opacity: 0;
	transform: translateX(-10px);
	transition:
		opacity 0.2s ease,
		transform 0.2s ease;
}

.nav-tooltip {
	position: absolute;
	left: 100%;
	top: 50%;
	transform: translateY(-50%);
	background: rgba(0, 0, 0, 0.9);
	color: white;
	padding: 0.5rem 1rem;
	border-radius: 8px;
	font-size: 0.9rem;
	white-space: nowrap;
	z-index: 1000;
	opacity: 0;
	pointer-events: none;
	transition: opacity 0.3s ease;
	margin-left: 1rem;
}

.collapsed .nav-link:hover .nav-tooltip {
	opacity: 1;
}

.progress-badge {
	background: linear-gradient(45deg, #f59e0b, #d97706);
	color: white;
	font-size: 0.75rem;
	padding: 0.25rem 0.5rem;
	border-radius: 12px;
	font-weight: 600;
	margin-left: auto;
}

.count-badge {
	background: linear-gradient(45deg, #10b981, #059669);
	color: white;
	font-size: 0.75rem;
	padding: 0.25rem 0.5rem;
	border-radius: 50%;
	font-weight: 600;
	margin-left: auto;
	min-width: 1.5rem;
	text-align: center;
}

.token-balances {
	padding: 1.5rem;
	border-top: 1px solid rgba(255, 255, 255, 0.1);
	background: rgba(255, 255, 255, 0.05);
	max-height: 400px;
	overflow: hidden;
	transition:
		max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1),
		opacity 0.3s ease 0.1s,
		padding 0.3s ease;
	opacity: 1;
}

.collapsed .token-balances {
	max-height: 0;
	opacity: 0;
	padding: 0 1.5rem;
	transition:
		max-height 0.3s ease,
		opacity 0.2s ease,
		padding 0.3s ease;
}

.balance-title {
	font-size: 1rem;
	font-weight: 600;
	margin-bottom: 1rem;
	color: #fbbf24;
}

.balance-list {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.balance-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.5rem;
	background: rgba(255, 255, 255, 0.05);
	border-radius: 8px;
	border-left: 3px solid transparent;
}

.balance-item:nth-child(1) {
	border-left-color: #3b82f6; /* GLIB - 파란색 */
}

.balance-item:nth-child(2) {
	border-left-color: #8b5cf6; /* GLID - 보라색 */
}

.balance-item:nth-child(3) {
	border-left-color: #10b981; /* GLIL - 초록색 */
}

.balance-item:nth-child(4) {
	border-left-color: #f59e0b; /* USDT - 주황색 */
}

.token-name {
	font-weight: 600;
	font-size: 0.9rem;
}

.token-amount {
	font-family: monospace;
	font-weight: 600;
	color: #94a3b8;
}

/* 화살표 아이콘 */
.nav-arrow {
	margin-left: auto;
	font-size: 0.9rem;
	transition:
		transform 0.3s ease,
		opacity 0.3s ease 0.1s;
	opacity: 1;
}

.collapsed .nav-arrow {
	opacity: 0;
	transition: opacity 0.2s ease;
}

/* 하위 메뉴 */
.submenu {
	padding-left: 1rem;
	padding-top: 0.5rem;
	border-left: 2px solid rgba(255, 255, 255, 0.1);
	margin-left: 1.5rem;
	margin-bottom: 0.5rem;
	max-height: 500px;
	overflow: hidden;
	transition:
		max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1),
		opacity 0.3s ease 0.1s;
	opacity: 1;
}

.collapsed .submenu {
	max-height: 0;
	opacity: 0;
	padding-top: 0;
	margin-bottom: 0;
	transition:
		max-height 0.3s ease,
		opacity 0.2s ease,
		padding 0.3s ease,
		margin 0.3s ease;
}

.submenu-link {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.4rem 1rem;
	color: #94a3b8;
	text-decoration: none;
	transition: all 0.3s ease;
	cursor: pointer;
	border-radius: 8px;
	margin-bottom: 0.25rem;
	font-size: 1.1rem;
}

.submenu-link:hover {
	background: rgba(255, 255, 255, 0.05);
	color: white;
	transform: translateX(5px);
}

.submenu-link.active {
	background: linear-gradient(90deg, var(--gli-blue), var(--gli-purple));
	color: white;
	font-weight: 600;
	border-left: 3px solid var(--gli-gold);
}

.submenu-icon {
	font-size: 1rem;
	flex-shrink: 0;
}

.submenu-text {
	font-weight: 500;
	white-space: nowrap;
}

/* 다크 테마 */
/* 테마별 스타일 오버라이드 */
:global([data-color-mode="dark"]) .gli-sidebar {
	background: var(--sidebar-bg);
	color: var(--text-primary);
}

:global([data-color-mode="dark"]) .nav-link.active {
	box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
}

/* Minimal 테마 특별 스타일 */
:global([data-concept-theme="minimal"]) .gli-sidebar {
	border-radius: 0 !important;
}

:global([data-concept-theme="minimal"]) .gli-sidebar * {
	border-radius: 0 !important;
}

/* Luxury 테마 특별 스타일 */
:global([data-concept-theme="luxury"]) .gli-sidebar {
	background: var(--luxury-gradient, var(--sidebar-bg));
}

/* 스크롤바 스타일 */
.gli-sidebar::-webkit-scrollbar {
	width: 6px;
}

.gli-sidebar::-webkit-scrollbar-track {
	background: rgba(255, 255, 255, 0.1);
}

.gli-sidebar::-webkit-scrollbar-thumb {
	background: rgba(255, 255, 255, 0.3);
	border-radius: 3px;
}

.gli-sidebar::-webkit-scrollbar-thumb:hover {
	background: rgba(255, 255, 255, 0.5);
}

/* 반응형 */
@media (max-width: 768px) {
	.gli-sidebar {
		transform: translateX(-100%);
		transition: transform 0.3s ease;
	}

	.gli-sidebar.mobile-open {
		transform: translateX(0);
	}
}
</style>
