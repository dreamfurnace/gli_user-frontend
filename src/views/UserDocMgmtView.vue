<template>
	<div class="user-doc-mgmt-container">
		<GLIHeader @toggleLeftSidebar="toggleLeftSidebar" />
		<LeftSidebar :isHidden="isLeftSidebarHidden" />
		<RightSidebar
			:is-hidden="sideMenuStore.rightSidebarHidden"
			@logout="handleLogout"
		/>

		<div
			class="main-content"
			:class="{ 'sidebar-hidden': isLeftSidebarHidden }"
		>
			<h1>사용자 문서 관리</h1>
			<p>이 페이지는 준비 중입니다.</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useSideMenuStore } from "@/stores/sideMenuStore";
import GLIHeader from "../components/GLIHeader.vue";
import LeftSidebar from "../components/LeftSidebar.vue";
import RightSidebar from "../components/RightSidebar.vue";

const router = useRouter();
const sideMenuStore = useSideMenuStore();

// 양쪽 사이드 메뉴를 기본적으로 숨김 상태로 설정
const isLeftSidebarHidden = ref(true);

const toggleLeftSidebar = () => {
	isLeftSidebarHidden.value = !isLeftSidebarHidden.value;
};

const handleLogout = () => {
	localStorage.removeItem("userToken");
	router.push("/login");
};

// 페이지 진입 시 양쪽 사이드 메뉴를 숨김 상태로 설정
onMounted(() => {
	isLeftSidebarHidden.value = true;
	// 우측 사이드바도 숨김 상태로 설정
	sideMenuStore.rightSidebarHidden = true;
});
</script>

<style scoped>
.user-doc-mgmt-container {
	display: flex;
	min-height: 100vh;
	background-color: #fafafa;
}
</style>
