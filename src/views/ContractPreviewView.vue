<template>
	<div class="contract-preview-container">
		<GLIHeader
			@toggleLeftSidebar="handleToggleLeftSidebar"
			@toggleRightSidebar="handleToggleRightSidebar"
		/>
		<LeftSidebar :isHidden="leftSidebarHidden" />
		<RightSidebar
			:isHidden="rightSidebarHidden"
			@toggleSidebar="handleToggleRightSidebar"
			@logout="handleLogout"
		/>

		<div class="main-content" :class="{ 'sidebar-hidden': leftSidebarHidden }">
			<div class="contract-preview-wrapper">
				<div class="page-header">
					<h1 class="page-title">계약서 미리보기</h1>
					<p class="page-description">계약서 ID: {{ contractId }}</p>
				</div>

				<div class="preview-content">
					<div class="preview-placeholder">
						<div class="preview-icon">📄</div>
						<h2>계약서 미리보기</h2>
						<p>계약서 ID: {{ contractId }}의 미리보기 화면입니다.</p>
						<p>이 기능은 향후 구현될 예정입니다.</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import GLIHeader from "../components/GLIHeader.vue";
import LeftSidebar from "../components/LeftSidebar.vue";
import RightSidebar from "../components/RightSidebar.vue";
import { useSideMenuStore } from "@/stores/sideMenuStore";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();

// 사이드 메뉴 스토어
const sideMenuStore = useSideMenuStore();

// 인증 스토어
const authStore = useAuthStore();

// 사이드바 상태를 computed로 만들어 반응형으로 변경
const leftSidebarHidden = computed(() => sideMenuStore.leftSidebarHidden);
const rightSidebarHidden = computed(() => sideMenuStore.rightSidebarHidden);

// 계약서 ID 가져오기
const contractId = computed(() => route.params.contractId as string);

// 화면 진입 시 사이드바 비활성화
onMounted(() => {
	console.log("ContractPreviewView: 화면 진입, 사이드바 비활성화");
	sideMenuStore.importState({
		leftSidebarHidden: true,
		rightSidebarHidden: true,
	});
});

const handleToggleLeftSidebar = () => {
	console.log("ContractPreviewView: handleToggleLeftSidebar 호출됨");
	console.log(
		"ContractPreviewView: 좌측 사이드바 상태:",
		sideMenuStore.leftSidebarHidden
	);
	// 스토어 토글은 GLIHeader에서 이미 처리됨
};

const handleToggleRightSidebar = () => {
	console.log("ContractPreviewView: handleToggleRightSidebar 호출됨");
	console.log(
		"ContractPreviewView: 우측 사이드바 상태:",
		sideMenuStore.rightSidebarHidden
	);
	// 스토어 토글은 GLIHeader에서 이미 처리됨
};

const handleLogout = async () => {
	try {
		console.log("로그아웃 시작");

		// 인증 스토어의 로그아웃 함수 호출
		await authStore.logout();

		console.log("로그아웃 완료, 로그인 페이지로 이동");

		// 로그인 페이지로 리다이렉트
		router.push("/login");
	} catch (error) {
		console.error("로그아웃 중 오류:", error);
		// 오류가 발생해도 로컬 상태는 초기화하고 로그인 페이지로 이동
		router.push("/login");
	}
};
</script>

<style scoped>
.contract-preview-container {
	display: flex;
	min-height: 100vh;
	background-color: var(--color-background-primary);
}

.main-content {
	flex: 1;
	padding: var(--spacing-6);
	justify-content: flex-start;
	transition: margin-left var(--duration-300) var(--ease-in-out);
}

.main-content.sidebar-hidden {
	margin-left: 0;
}

.contract-preview-wrapper {
	max-width: 1200px;
	margin: 0 auto;
	margin-top: 20px;
}

.page-header {
	text-align: center;
	margin-bottom: var(--spacing-8);
}

.page-title {
	font-size: var(--font-size-3xl);
	font-weight: var(--font-weight-bold);
	color: var(--color-text-primary);
	margin-bottom: var(--spacing-4);
}

.page-description {
	font-size: var(--font-size-lg);
	color: var(--color-text-secondary);
	margin: 0;
}

.preview-content {
	background-color: var(--color-background-secondary);
	border-radius: var(--border-radius-lg);
	padding: var(--spacing-8);
	border: 1px solid var(--color-border-light);
	min-height: 400px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.preview-placeholder {
	text-align: center;
	color: var(--color-text-secondary);
}

.preview-icon {
	font-size: 4rem;
	margin-bottom: var(--spacing-4);
}

.preview-placeholder h2 {
	font-size: var(--font-size-xl);
	font-weight: var(--font-weight-bold);
	color: var(--color-text-primary);
	margin-bottom: var(--spacing-4);
}

.preview-placeholder p {
	font-size: var(--font-size-base);
	margin-bottom: var(--spacing-2);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
	.main-content {
		padding: var(--spacing-4);
	}

	.preview-content {
		padding: var(--spacing-6);
	}

	.page-title {
		font-size: var(--font-size-2xl);
	}

	.page-description {
		font-size: var(--font-size-base);
	}
}
</style>
