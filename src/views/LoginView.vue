<template>
	<div class="login-page-bg">
		<div class="login-container">
			<div class="login-header">
				<h1 class="login-title">GLI Platform</h1>
				<p class="login-subtitle">GLI 플랫폼에 오신 것을 환영합니다</p>
			</div>

			<form class="login-form" @submit="handleLogin">
				<div class="input-group">
					<label for="email">이메일</label>
					<input type="email" id="email" v-model="email" required />
				</div>
				<div class="input-group">
					<label for="password">비밀번호</label>
					<input type="password" id="password" v-model="password" required />
				</div>
				<button
					type="submit"
					class="login-button"
					:disabled="authStore.isLoading"
				>
					{{ authStore.isLoading ? "로그인 중..." : "로그인" }}
				</button>
			</form>

			<div v-if="authStore.error" class="error-message">
				{{ authStore.error }}
			</div>

			<div class="sns-login">
				<p class="sns-title">SNS로 로그인하기</p>
				<div class="sns-buttons">
					<button class="sns-button" @click="handleSnsLogin('google')">
						<img src="https://www.google.com/favicon.ico" alt="Google" />
					</button>
					<button class="sns-button" @click="handleSnsLogin('kakao')">
						<img src="https://www.kakaocorp.com/page/favicon.ico" alt="Kakao" />
					</button>
					<button class="sns-button" @click="handleSnsLogin('naver')">
						<img src="https://www.naver.com/favicon.ico" alt="Naver" />
					</button>
				</div>
			</div>

			<div class="signup-section">
				<p class="signup-text">아직 계정이 없으신가요?</p>
				<button class="signup-button" @click="handleSignup">
					회원가입 하기
				</button>
			</div>
		</div>
		<div v-if="isDevelopment" class="dummy-login-floating">
			<div class="dummy-title">더미 계정 원클릭 로그인</div>
			<button
				class="dummy-btn"
				@click="dummyLogin(dummyUsers[0])"
				:disabled="authStore.isLoading"
			>
				관리자 ({{ dummyUsers[0].email }})
			</button>
			<button
				class="dummy-btn"
				@click="dummyLogin(dummyUsers[1])"
				:disabled="authStore.isLoading"
			>
				토큰 매니저 ({{ dummyUsers[1].email }})
			</button>
			<button
				class="dummy-btn"
				@click="dummyLogin(dummyUsers[2])"
				:disabled="authStore.isLoading"
			>
				일반 사용자 ({{ dummyUsers[2].email }})
			</button>
		</div>
		<SessionConflictModal
			v-if="showSessionConflict"
			:sessions="sessionConflictSessions"
			@force-logout="handleForceLogout"
			@cancel="handleCancel"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { authAPI } from "@/services/api";
import SessionConflictModal from "../components/ui/SessionConflictModal.vue";

const router = useRouter();
const authStore = useAuthStore();

// 개발 환경 체크
const isDevelopment = import.meta.env.DEV;

// 더미 계정 정보
const dummyUsers = [
	{
		email: "admin@gli.com",
		password: "admin123!",
		role: "admin",
		label: "관리자",
	},
	{
		email: "token@gli.com",
		password: "token123!",
		role: "token_manager",
		label: "토큰 매니저",
	},
	{
		email: "user@gli.com",
		password: "user123!",
		role: "user",
		label: "일반 사용자",
	},
];

// Reactive data
const email = ref("");
const password = ref("");
const showSessionConflict = ref(false);
const pendingUser = ref<{
	email: string;
	password: string;
	role: string;
	label?: string;
} | null>(null);
const sessionConflictSessions = ref<any[]>([]);

// Methods
const handleLogin = async (event: Event) => {
	event.preventDefault();
	authStore.clearError();

	try {
		await authStore.login({
			username: email.value,
			password: password.value,
			device_type: "web",
		});

		// 리다이렉트 처리
		const redirectPath = router.currentRoute.value.query.redirect as string;
		if (redirectPath) {
			router.push(redirectPath);
		} else {
			router.push("/");
		}
	} catch (error: any) {
		// 동시 로그인 제한 에러 처리
		if (error.response?.data?.sessions) {
			pendingUser.value = {
				email: email.value,
				password: password.value,
				role: "",
			};
			sessionConflictSessions.value = error.response.data.sessions;
			showSessionConflict.value = true;
		}
	}
};

const handleSnsLogin = (provider: string) => {
	console.log("SNS login:", provider);
	alert(`${provider} 로그인 기능은 준비 중입니다.`);
};

const handleSignup = () => {
	router.push("/signup");
};

const dummyLogin = async (user: {
	email: string;
	password: string;
	role: string;
}) => {
	authStore.clearError();

	try {
		await authStore.login({
			username: user.email,
			password: user.password,
			device_type: "web",
		});

		// 리다이렉트 처리
		const redirectPath = router.currentRoute.value.query.redirect as string;
		if (redirectPath) {
			router.push(redirectPath);
		} else {
			router.push("/");
		}
	} catch (error: any) {
		// 동시 로그인 제한 에러 처리
		if (error.response?.data?.sessions) {
			pendingUser.value = user;
			sessionConflictSessions.value = error.response.data.sessions;
			showSessionConflict.value = true;
		}
	}
};

const handleForceLogout = async () => {
	if (!pendingUser.value) return;

	try {
		// 강제 로그아웃 API 호출
		await authAPI.forceLogout({
			device_type: "web",
			username: pendingUser.value.email,
		});

		// 강제 로그아웃 성공 후 재로그인
		showSessionConflict.value = false;
		await dummyLogin(pendingUser.value);
		pendingUser.value = null;
	} catch (error: any) {
		console.error("Force logout error:", error);
		const errorMessage =
			error.response?.data?.error || "강제 로그아웃 중 오류가 발생했습니다.";
		alert("강제 로그아웃 실패: " + errorMessage);
		showSessionConflict.value = false;
		pendingUser.value = null;
	}
};

const handleCancel = () => {
	showSessionConflict.value = false;
	pendingUser.value = null;
};

// 컴포넌트 마운트 시 인증 상태 초기화
onMounted(async () => {
	await authStore.initialize();
});
</script>

<style scoped>
.login-container {
	width: 400px;
	padding: 40px;
	background: white;
	border-radius: 10px;
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.login-header {
	text-align: center;
	margin-bottom: 30px;
}

.login-title {
	font-size: 24px;
	color: #333;
	margin-bottom: 10px;
}

.login-subtitle {
	font-size: 14px;
	color: #666;
}

.login-form {
	display: flex;
	flex-direction: column;
	gap: 15px;
	margin-bottom: 20px;
}

.input-group {
	display: flex;
	flex-direction: column;
	gap: 5px;
}

.input-group label {
	font-size: 14px;
	color: #333;
	font-weight: 500;
}

.input-group input {
	padding: 12px;
	border: 1px solid #ddd;
	border-radius: 5px;
	font-size: 14px;
}

.input-group input:focus {
	outline: none;
	border-color: #007bff;
}

.login-button {
	padding: 12px;
	background: #007bff;
	color: white;
	border: none;
	border-radius: 5px;
	font-size: 16px;
	cursor: pointer;
	transition: background 0.3s;
}

.login-button:hover:not(:disabled) {
	background: #0056b3;
}

.login-button:disabled {
	background: #ccc;
	cursor: not-allowed;
}

.error-message {
	background: #f8d7da;
	color: #721c24;
	padding: 10px;
	border-radius: 5px;
	margin-bottom: 15px;
	font-size: 14px;
}

.sns-login {
	text-align: center;
	margin-bottom: 20px;
}

.sns-title {
	font-size: 14px;
	color: #666;
	margin-bottom: 15px;
}

.sns-buttons {
	display: flex;
	justify-content: center;
	gap: 15px;
}

.sns-button {
	width: 40px;
	height: 40px;
	border: 1px solid #ddd;
	border-radius: 50%;
	background: white;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: transform 0.2s;
}

.sns-button:hover {
	transform: scale(1.1);
}

.sns-button img {
	width: 20px;
	height: 20px;
}

.signup-section {
	text-align: center;
}

.signup-text {
	font-size: 14px;
	color: #666;
	margin-bottom: 10px;
}

.signup-button {
	background: none;
	border: none;
	color: #007bff;
	cursor: pointer;
	font-size: 14px;
	text-decoration: underline;
}

.signup-button:hover {
	color: #0056b3;
}

.dummy-login-floating {
	position: fixed;
	bottom: 20px;
	right: 50px;
	background: white;
	padding: 15px;
	border-radius: 8px;
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	max-width: 250px;
	z-index: 9999;
}

.dummy-title {
	font-size: 12px;
	color: #666;
	margin-bottom: 10px;
	font-weight: bold;
}

.dummy-btn {
	display: block;
	width: 100%;
	padding: 8px;
	margin-bottom: 5px;
	background: #f8f9fa;
	color: #000;
	border: 1px solid #ddd;
	border-radius: 4px;
	font-size: 11px;
	cursor: pointer;
	transition: background 0.2s;
}

.dummy-btn:hover:not(:disabled) {
	background: #e9ecef;
}

.dummy-btn:disabled {
	background: #f5f5f5;
	color: #999;
	cursor: not-allowed;
}

.login-page-bg {
	display: flex;
	padding: 20px;
}
</style>
