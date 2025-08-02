import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import { setupSideMenuGuards, setupAuthGuards } from "./guards";

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			name: "home",
			component: () => import("@/views/HomeView.vue"),
		},
		{
			path: "/business",
			name: "business",
			component: () => import("@/views/BusinessView.vue"),
		},
		{
			path: "/rwa-assets",
			name: "rwa-assets",
			component: () => import("@/views/RWAAssetsView.vue"),
		},
		{
			path: "/auth",
			name: "auth",
			component: () => import("@/views/AuthCenterView.vue"),
			meta: {
				requiresAuth: true,
			},
		},
		{
			path: "/mypage",
			name: "mypage",
			component: () => import("@/views/MyPageView.vue"),
			meta: {
				requiresAuth: true,
			},
		},
		{
			path: "/conversion",
			name: "conversion",
			component: () => import("@/views/TokenConversionView.vue"),
			meta: {
				requiresAuth: true,
			},
		},
		{
			path: "/shopping",
			name: "shopping",
			component: () => import("@/views/ShoppingMallView.vue"),
		},
		{
			path: "/referral",
			name: "referral",
			component: () => import("@/views/ReferralSystemView.vue"),
			meta: {
				requiresAuth: true,
			},
		},
		{
			path: "/help-center",
			name: "help-center",
			component: () => import("@/views/InformationCenterView.vue"),
		},
		{
			path: "/home",
			name: "home-alt",
			component: HomeView,
			meta: {
				showHomeButton: false,
				showLeftToggle: true,
				showRightToggle: true,
				requiresAuth: true,
			},
		},
		{
			path: "/design-tokens",
			name: "design-tokens",
			component: () => import("../components/DesignTokenDemo.vue"),
			meta: {
				showHomeButton: true,
				showLeftToggle: true,
				showRightToggle: true,
				requiresAuth: false,
			},
		},
		{
			path: "/token-test",
			name: "token-test",
			component: () => import("../components/TokenTest.vue"),
			meta: {
				showHomeButton: true,
				showLeftToggle: true,
				showRightToggle: true,
				requiresAuth: false,
			},
		},
		{
			path: "/styled-system",
			name: "styled-system",
			component: () => import("../components/StyledSystemDemo.vue"),
			meta: {
				showHomeButton: true,
				showLeftToggle: true,
				showRightToggle: true,
				requiresAuth: false,
			},
		},
		{
			path: "/accessibility-demo",
			name: "accessibility-demo",
			component: () => import("../views/AccessibilityDemo.vue"),
			meta: {
				showHomeButton: true,
				showLeftToggle: true,
				showRightToggle: true,
				requiresAuth: false,
			},
		},
		{
			path: "/login",
			name: "login",
			component: () => import("../views/LoginView.vue"),
			meta: {
				showHomeButton: true,
				showLeftToggle: false,
				showRightToggle: false,
				requiresAuth: false,
			},
		},
		{
			path: "/signup",
			name: "signup",
			component: () => import("../views/SignupView.vue"),
			meta: {
				showHomeButton: true,
				showLeftToggle: false,
				showRightToggle: false,
				requiresAuth: false,
			},
		},
		{
			path: "/profile-edit",
			name: "profile-edit",
			component: () => import("../views/ProfileEditView.vue"),
			meta: { requiresAuth: true },
		},
		{
			path: "/user-doc-mgmt",
			name: "user-doc-mgmt",
			component: () => import("../views/UserDocMgmtView.vue"),
			meta: {
				showHomeButton: true,
				showLeftToggle: false,
				showRightToggle: true,
				requiresAuth: true,
			},
		},
		{
			path: "/animation-demo",
			name: "animation-demo",
			component: () => import("../views/AnimationDemo.vue"),
			meta: {
				showHomeButton: true,
				showLeftToggle: true,
				showRightToggle: true,
				requiresAuth: false,
			},
		},
	],
});

// 인증 라우터 가드는 guards.ts에서 관리됨

// 사이드 메뉴 자동 숨김 가드 설정
setupSideMenuGuards(router);

// 인증 가드 설정
setupAuthGuards(router);

export default router;
