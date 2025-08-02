<template>
	<div class="concept-theme-switcher">
		<!-- 플로팅 버튼 -->
		<button
			class="floating-trigger"
			@mouseenter="showOptions = true"
			@mouseleave="hideOptionsDelayed"
			@click="handleMobileClick"
			:class="{ 'is-active': showOptions }"
		>
			<span class="trigger-icon">🎨</span>
		</button>

		<!-- 옵션 메뉴 -->
		<transition name="options-fade">
			<div
				v-if="showOptions"
				class="options-menu"
				@mouseenter="clearHideTimer"
				@mouseleave="hideOptionsDelayed"
			>
				<div
					v-for="theme in availableConceptThemes"
					:key="theme.name"
					class="theme-option"
					:class="{
						'is-active': conceptTheme === theme.name,
						'is-coming-soon': theme.status === 'coming-soon',
					}"
					@click="handleThemeSelect(theme.name)"
				>
					<div class="theme-preview">
						<div class="preview-circle">
							<div class="preview-color primary" :data-theme="theme.name"></div>
							<div
								class="preview-color secondary"
								:data-theme="theme.name"
							></div>
						</div>
					</div>
					<div class="theme-info">
						<div class="theme-name">{{ theme.displayName }}</div>
						<div class="theme-status" v-if="theme.status === 'coming-soon'">
							구상 중
						</div>
					</div>
				</div>
			</div>
		</transition>

		<!-- Coming Soon 모달 -->
		<transition name="modal-fade">
			<div
				v-if="showComingSoonModal"
				class="modal-backdrop"
				@click="hideComingSoonModal"
			>
				<div class="coming-soon-modal" @click.stop>
					<div class="modal-content">
						<div class="modal-icon">✨</div>
						<div class="modal-text">럭셔리 테마는 구상 중입니다</div>
					</div>
				</div>
			</div>
		</transition>

		<!-- 모바일용 백드롭 -->
		<div
			v-if="showOptions && isMobileView"
			class="mobile-backdrop"
			@click="hideOptions"
		></div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useThemeStore, type ConceptTheme } from "@/stores/theme";

const themeStore = useThemeStore();
const showOptions = ref(false);
const showComingSoonModal = ref(false);
const hideTimer = ref<number | null>(null);
const isMobileView = ref(false);

// Store getters (reactive)
const conceptTheme = computed(() => themeStore.conceptTheme);
const availableConceptThemes = computed(
	() => themeStore.availableConceptThemes
);
const setConceptThemeWithTransition = themeStore.setConceptThemeWithTransition;

// 모바일 감지
const checkMobileView = () => {
	isMobileView.value = window.innerWidth <= 768;
};

// 옵션 표시/숨김 로직
const clearHideTimer = () => {
	if (hideTimer.value) {
		clearTimeout(hideTimer.value);
		hideTimer.value = null;
	}
};

const hideOptionsDelayed = () => {
	if (isMobileView.value) return; // 모바일에서는 지연 숨김 사용 안 함

	hideTimer.value = window.setTimeout(() => {
		showOptions.value = false;
	}, 300);
};

const hideOptions = () => {
	clearHideTimer();
	showOptions.value = false;
};

const handleMobileClick = () => {
	if (isMobileView.value) {
		showOptions.value = !showOptions.value;
	}
};

// 테마 선택 처리
const handleThemeSelect = async (themeName: ConceptTheme) => {
	// Coming Soon 테마 처리
	if (themeName === "luxury") {
		showComingSoonModal.value = true;
		hideOptions();

		// 1초 후 모달 자동 닫기
		setTimeout(() => {
			showComingSoonModal.value = false;
		}, 1000);
		return;
	}

	// 사용 가능한 테마 적용
	await setConceptThemeWithTransition(themeName);
	hideOptions();
};

const hideComingSoonModal = () => {
	showComingSoonModal.value = false;
};

// 이벤트 리스너
const handleResize = () => {
	checkMobileView();
};

const handleEscKey = (event: KeyboardEvent) => {
	if (event.key === "Escape") {
		hideOptions();
		hideComingSoonModal();
	}
};

onMounted(() => {
	checkMobileView();
	window.addEventListener("resize", handleResize);
	document.addEventListener("keydown", handleEscKey);
});

onUnmounted(() => {
	clearHideTimer();
	window.removeEventListener("resize", handleResize);
	document.removeEventListener("keydown", handleEscKey);
});
</script>

<style scoped>
.concept-theme-switcher {
	position: fixed;
	bottom: 2rem;
	left: 2rem;
	z-index: var(--z-modal);
}

/* 플로팅 트리거 버튼 */
.floating-trigger {
	width: 50px;
	height: 50px;
	border-radius: 50%;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border: none;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	position: relative;
	z-index: 2;
}

.floating-trigger:hover,
.floating-trigger.is-active {
	transform: translateY(-4px) scale(1.1);
	box-shadow: 0 12px 35px rgba(0, 0, 0, 0.4);
}

.trigger-icon {
	font-size: 1.5rem;
	filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
	transition: transform 0.3s ease;
}

.floating-trigger.is-active .trigger-icon {
	transform: rotate(180deg);
}

/* 옵션 메뉴 */
.options-menu {
	position: absolute;
	bottom: 80px;
	left: 0;
	background: var(--card-bg);
	border: 1px solid var(--border-primary);
	border-radius: var(--radius-xl);
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	padding: var(--space-2);
	min-width: 180px;
	backdrop-filter: blur(20px);
}

.theme-option {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	padding: var(--space-2);
	border-radius: var(--radius-lg);
	cursor: pointer;
	transition: all 0.2s ease;
	position: relative;
}

.theme-option:hover:not(.is-coming-soon) {
	background-color: var(--interactive-secondary);
	transform: translateX(4px);
}

.theme-option.is-active {
	background-color: var(--interactive-primary);
	color: var(--text-inverse);
}

.theme-option.is-coming-soon {
	opacity: 0.6;
	cursor: default;
}

.theme-option.is-coming-soon:hover {
	cursor: not-allowed;
}

/* 테마 미리보기 */
.theme-preview {
	width: 36px;
	height: 36px;
	position: relative;
}

.preview-circle {
	width: 100%;
	height: 100%;
	border-radius: 50%;
	border: 2px solid var(--border-primary);
	overflow: hidden;
	position: relative;
	display: flex;
}

.preview-color {
	width: 50%;
	height: 100%;
}

/* 테마별 프리뷰 색상 */
.preview-color.primary[data-theme="default"] {
	background-color: #0ea5e9;
}
.preview-color.secondary[data-theme="default"] {
	background-color: #22c55e;
}

.preview-color.primary[data-theme="luxury"] {
	background-color: #d4af37;
}
.preview-color.secondary[data-theme="luxury"] {
	background-color: #1a237e;
}

.preview-color.primary[data-theme="minimal"] {
	background-color: #000000;
}
.preview-color.secondary[data-theme="minimal"] {
	background-color: #ffffff;
}

/* 테마 정보 */
.theme-info {
	flex: 1;
}

.theme-name {
	font-weight: var(--font-weight-medium);
	color: var(--text-primary);
	font-size: var(--font-size-sm);
}

.theme-option.is-active .theme-name {
	color: var(--text-inverse);
}

.theme-status {
	font-size: var(--font-size-xs);
	color: var(--text-tertiary);
	font-style: italic;
}

.theme-option.is-active .theme-status {
	color: var(--text-inverse);
	opacity: 0.8;
}

/* Coming Soon 모달 */
.modal-backdrop {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: var(--z-modal);
}

.coming-soon-modal {
	background: var(--card-bg);
	border-radius: var(--radius-xl);
	padding: var(--space-8);
	box-shadow: 0 25px 75px rgba(0, 0, 0, 0.4);
	border: 1px solid var(--border-primary);
	max-width: 90vw;
}

.modal-content {
	text-align: center;
}

.modal-icon {
	font-size: 3rem;
	margin-bottom: var(--space-4);
}

.modal-text {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-medium);
	color: var(--text-primary);
}

/* 모바일 백드롭 */
.mobile-backdrop {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.3);
	z-index: 1;
}

/* 트랜지션 */
.options-fade-enter-active,
.options-fade-leave-active {
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.options-fade-enter-from {
	opacity: 0;
	transform: translateY(20px) scale(0.9);
}

.options-fade-leave-to {
	opacity: 0;
	transform: translateY(20px) scale(0.9);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
	transition: all 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
	opacity: 0;
}

.modal-fade-enter-from .coming-soon-modal,
.modal-fade-leave-to .coming-soon-modal {
	transform: scale(0.8);
}

/* 반응형 */
@media (max-width: 768px) {
	.concept-theme-switcher {
		bottom: 1rem;
		left: 1rem;
	}

	.floating-trigger {
		width: 50px;
		height: 50px;
	}

	.trigger-icon {
		font-size: 1.2rem;
	}

	.options-menu {
		bottom: 65px;
		min-width: 180px;
	}

	.theme-option {
		padding: var(--space-2);
	}

	.theme-preview {
		width: 32px;
		height: 32px;
	}
}

@media (max-width: 480px) {
	.options-menu {
		left: 50%;
		transform: translateX(-50%);
		bottom: 65px;
	}

	.coming-soon-modal {
		margin: var(--space-4);
		padding: var(--space-6);
	}

	.modal-icon {
		font-size: 2rem;
	}

	.modal-text {
		font-size: var(--font-size-base);
	}
}

/* 다크 모드 조정 */
.dark .floating-trigger {
	background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
}

.dark .options-menu {
	backdrop-filter: blur(20px);
	border-color: var(--border-primary);
}

/* Minimal 테마 조정 */
:global([data-concept-theme="minimal"]) .floating-trigger {
	border-radius: 0 !important;
	border: 2px solid var(--border-primary) !important;
	box-shadow: var(--minimal-shadow) !important;
	backdrop-filter: none !important;
}

:global([data-concept-theme="minimal"]) .options-menu {
	border-radius: 0 !important;
	border: 2px solid var(--border-primary) !important;
	box-shadow: var(--minimal-shadow) !important;
	backdrop-filter: none !important;
}

:global([data-concept-theme="minimal"]) .theme-option {
	border-radius: 0 !important;
}

:global([data-concept-theme="minimal"]) .preview-circle {
	border-radius: 0 !important;
}

:global([data-concept-theme="minimal"]) .coming-soon-modal {
	border-radius: 0 !important;
	border: 2px solid var(--border-primary) !important;
	box-shadow: var(--minimal-shadow) !important;
}

/* 애니메이션 */
@keyframes pulse {
	0%,
	100% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.05);
	}
}

.floating-trigger:focus-visible {
	animation: pulse 0.5s ease-in-out;
}
</style>
