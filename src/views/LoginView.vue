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
					<input 
						type="email" 
						id="email" 
						v-model="email" 
						required 
						@blur="validateEmailInput"
						:class="{ 'input-error': validationErrors.some(error => error.includes('이메일')) }"
					/>
				</div>
				<div class="input-group">
					<label for="password">비밀번호</label>
					<input 
						type="password" 
						id="password" 
						v-model="password" 
						required 
						@blur="validatePasswordInput"
						:class="{ 'input-error': validationErrors.some(error => error.includes('비밀번호')) }"
					/>
				</div>
				<button
					type="submit"
					class="login-button"
					:disabled="authStore.isLoading || isRateLimited"
				>
					{{ authStore.isLoading ? "로그인 중..." : "로그인" }}
				</button>
			</form>

			<!-- Security validation errors -->
			<div v-if="validationErrors.length > 0" class="error-message">
				<div v-for="error in validationErrors" :key="error" class="error-item">
					{{ error }}
				</div>
			</div>

			<!-- Rate limiting message -->
			<div v-if="isRateLimited" class="error-message security-warning">
				⚠️ {{ rateLimitMessage }}
			</div>

			<!-- Auth store error -->
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
import { 
	sanitizeInput, 
	validateInput, 
	loginRateLimiter, 
	csrfProtection, 
	securityLogger 
} from "@/utils/security";

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

// Security-related reactive data
const validationErrors = ref<string[]>([]);
const isRateLimited = ref(false);
const rateLimitMessage = ref("");
const csrfToken = ref("");

// Security validation helper
const validateLoginInput = (): boolean => {
	validationErrors.value = [];
	
	// Sanitize inputs
	const sanitizedEmail = sanitizeInput.email(email.value);
	const sanitizedPassword = password.value; // Don't sanitize password as it may contain special chars
	
	// Validate email
	const emailError = validateInput.required(sanitizedEmail, "이메일") || validateInput.email(sanitizedEmail);
	if (emailError) {
		validationErrors.value.push(emailError);
	}
	
	// Validate password
	const passwordError = validateInput.required(sanitizedPassword, "비밀번호") || validateInput.password(sanitizedPassword);
	if (passwordError) {
		validationErrors.value.push(passwordError);
	}
	
	// Update sanitized values
	if (sanitizedEmail !== email.value) {
		email.value = sanitizedEmail;
	}
	
	return validationErrors.value.length === 0;
};

// Rate limiting check
const checkRateLimit = (): boolean => {
	const identifier = email.value || 'anonymous';
	
	if (loginRateLimiter.isRateLimited(identifier)) {
		isRateLimited.value = true;
		rateLimitMessage.value = "로그인 시도 횟수가 초과되었습니다. 5분 후 다시 시도해주세요.";
		securityLogger.logSuspiciousActivity('LOGIN_RATE_LIMIT_EXCEEDED', { 
			identifier: sanitizeInput.email(identifier),
			timestamp: new Date().toISOString() 
		});
		return false;
	}
	
	isRateLimited.value = false;
	rateLimitMessage.value = "";
	return true;
};

// Individual input validation methods
const validateEmailInput = (): void => {
	const sanitizedEmail = sanitizeInput.email(email.value);
	const emailError = validateInput.required(sanitizedEmail, "이메일") || validateInput.email(sanitizedEmail);
	
	// Remove existing email errors
	validationErrors.value = validationErrors.value.filter(error => !error.includes('이메일'));
	
	if (emailError) {
		validationErrors.value.push(emailError);
	}
	
	// Update sanitized value
	if (sanitizedEmail !== email.value) {
		email.value = sanitizedEmail;
	}
};

const validatePasswordInput = (): void => {
	const passwordError = validateInput.required(password.value, "비밀번호");
	
	// Remove existing password errors (but not strength validation during typing)
	validationErrors.value = validationErrors.value.filter(error => !error.includes('비밀번호를 입력해주세요'));
	
	if (passwordError) {
		validationErrors.value.push(passwordError);
	}
};

// Methods
const handleLogin = async (event: Event) => {
	event.preventDefault();
	authStore.clearError();
	validationErrors.value = [];
	
	// Security validations
	if (!validateLoginInput()) {
		securityLogger.logSuspiciousActivity('INVALID_LOGIN_INPUT', { 
			email: sanitizeInput.email(email.value),
			errors: validationErrors.value 
		});
		return;
	}
	
	if (!checkRateLimit()) {
		return;
	}

	try {
		// Log login attempt
		securityLogger.log('LOGIN_ATTEMPT', { 
			email: sanitizeInput.email(email.value),
			timestamp: new Date().toISOString() 
		});

		await authStore.login({
			username: email.value,
			password: password.value,
			device_type: "web",
		});

		// Log successful login
		securityLogger.log('LOGIN_SUCCESS', { 
			email: sanitizeInput.email(email.value),
			timestamp: new Date().toISOString() 
		});

		// Clear sensitive data
		password.value = "";
		csrfProtection.clearToken();

		// 리다이렉트 처리
		const redirectPath = router.currentRoute.value.query.redirect as string;
		if (redirectPath) {
			router.push(redirectPath);
		} else {
			router.push("/");
		}
	} catch (error: any) {
		// Log failed login
		securityLogger.logFailedLogin(sanitizeInput.email(email.value));
		
		// Clear password on failed login
		password.value = "";
		
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
	validationErrors.value = [];

	// Apply security checks for dummy login as well
	if (!checkRateLimit()) {
		return;
	}

	try {
		// Log dummy login attempt
		securityLogger.log('DUMMY_LOGIN_ATTEMPT', { 
			email: sanitizeInput.email(user.email),
			role: user.role,
			timestamp: new Date().toISOString() 
		});

		await authStore.login({
			username: user.email,
			password: user.password,
			device_type: "web",
		});

		// Log successful dummy login
		securityLogger.log('DUMMY_LOGIN_SUCCESS', { 
			email: sanitizeInput.email(user.email),
			role: user.role,
			timestamp: new Date().toISOString() 
		});

		// 리다이렉트 처리
		const redirectPath = router.currentRoute.value.query.redirect as string;
		if (redirectPath) {
			router.push(redirectPath);
		} else {
			router.push("/");
		}
	} catch (error: any) {
		// Log failed dummy login
		securityLogger.logFailedLogin(sanitizeInput.email(user.email));
		
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

// 컴포넌트 마운트 시 인증 상태 초기화 및 보안 설정
onMounted(async () => {
	await authStore.initialize();
	
	// Initialize CSRF protection
	const token = csrfProtection.generateToken();
	csrfProtection.storeToken(token);
	csrfToken.value = token;
	
	// Log page access
	securityLogger.log('LOGIN_PAGE_ACCESS', {
		timestamp: new Date().toISOString(),
		userAgent: navigator.userAgent
	});
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

.input-group input.input-error {
	border-color: #dc3545;
	background-color: #fff5f5;
}

.input-group input.input-error:focus {
	border-color: #dc3545;
	box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
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

.error-item {
	margin-bottom: 5px;
}

.error-item:last-child {
	margin-bottom: 0;
}

.security-warning {
	background: #fff3cd;
	color: #856404;
	border: 1px solid #ffeaa7;
	font-weight: 500;
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
