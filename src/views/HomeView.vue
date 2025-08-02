<template>
	<div class="home-view">
		<div class="hero-section">
			<div class="hero-content">
				<h1 class="hero-title">
					🌟 GLI Web3 레저투자 플랫폼에 오신 것을 환영합니다
				</h1>
				<p class="hero-description">
					블록체인 기술을 활용한 혁신적인 레저 투자 생태계를 경험해보세요.
					RWA 자산 투자부터 GLI 토큰 활용까지, 모든 것이 가능합니다.
				</p>
				<div class="hero-buttons">
					<router-link to="/business" class="btn-primary">
						사업 소개 보기
					</router-link>
					<router-link to="/rwa-assets" class="btn-secondary">
						투자 자산 둘러보기
					</router-link>
				</div>
			</div>
		</div>

		<div class="features-section">
			<div class="container">
				<h2 class="section-title">주요 서비스</h2>
				<div class="features-grid">
					<div class="feature-card">
						<div class="feature-icon">🏗️</div>
						<h3>RWA 투자 자산</h3>
						<p>실물 자산을 기반으로 한 안전하고 수익성 높은 투자 기회를 제공합니다.</p>
						<router-link to="/rwa-assets" class="feature-link">
							자세히 보기 →
						</router-link>
					</div>
					
					<div class="feature-card">
						<div class="feature-icon">💱</div>
						<h3>토큰 변환</h3>
						<p>GLI 생태계 내에서 다양한 토큰 간 원활한 변환 서비스를 제공합니다.</p>
						<router-link to="/conversion" class="feature-link">
							변환하기 →
						</router-link>
					</div>
					
					<div class="feature-card">
						<div class="feature-icon">🛍️</div>
						<h3>GLI-L 쇼핑몰</h3>
						<p>GLI-L 토큰으로 프리미엄 상품과 서비스를 구매할 수 있습니다.</p>
						<router-link to="/shopping" class="feature-link">
							쇼핑하기 →
						</router-link>
					</div>
					
					<div class="feature-card">
						<div class="feature-icon">🔐</div>
						<h3>인증 센터</h3>
						<p>안전하고 신뢰할 수 있는 Web3 인증 시스템을 통해 보안을 강화합니다.</p>
						<router-link to="/auth" class="feature-link">
							인증하기 →
						</router-link>
					</div>
				</div>
			</div>
		</div>

		<div class="stats-section">
			<div class="container">
				<div class="stats-grid">
					<div class="stat-item">
						<div class="stat-number">1,000+</div>
						<div class="stat-label">투자자</div>
					</div>
					<div class="stat-item">
						<div class="stat-number">₩50억+</div>
						<div class="stat-label">누적 투자액</div>
					</div>
					<div class="stat-item">
						<div class="stat-number">15+</div>
						<div class="stat-label">투자 자산</div>
					</div>
					<div class="stat-item">
						<div class="stat-number">98%</div>
						<div class="stat-label">고객 만족도</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

onMounted(async () => {
	try {
		// 사용자가 로그인한 경우 프로필 정보 업데이트
		if (auth.isAuthenticated) {
			await auth.fetchProfile()
		}
	} catch (error) {
		console.error('프로필 정보 로드 실패:', error)
	}
})
</script>

<style scoped>
.home-view {
	min-height: calc(100vh - 80px);
	background: linear-gradient(135deg, var(--gli-blue) 0%, var(--gli-purple) 100%);
}

.hero-section {
	padding: 6rem 2rem;
	text-align: center;
	color: white;
}

.hero-content {
	max-width: 800px;
	margin: 0 auto;
}

.hero-title {
	font-size: 3rem;
	font-weight: 700;
	margin-bottom: 1.5rem;
	background: linear-gradient(45deg, #fff, var(--gli-gold));
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}

.hero-description {
	font-size: 1.25rem;
	margin-bottom: 2.5rem;
	opacity: 0.9;
	line-height: 1.6;
}

.hero-buttons {
	display: flex;
	gap: 1rem;
	justify-content: center;
	flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
	padding: 1rem 2rem;
	border-radius: 8px;
	font-weight: 600;
	text-decoration: none;
	transition: all 0.3s ease;
	display: inline-block;
}

.btn-primary {
	background: var(--gli-gold);
	color: var(--gli-gray-dark);
}

.btn-primary:hover {
	transform: translateY(-2px);
	box-shadow: 0 8px 25px rgba(212, 175, 55, 0.3);
}

.btn-secondary {
	background: rgba(255, 255, 255, 0.1);
	color: white;
	border: 2px solid rgba(255, 255, 255, 0.3);
}

.btn-secondary:hover {
	background: rgba(255, 255, 255, 0.2);
	transform: translateY(-2px);
}

.features-section {
	padding: 5rem 0;
	background: var(--bg-primary);
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 2rem;
}

.section-title {
	text-align: center;
	font-size: 2.5rem;
	font-weight: 700;
	margin-bottom: 3rem;
	color: var(--text-primary);
}

.features-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 2rem;
}

.feature-card {
	background: var(--bg-secondary);
	padding: 2rem;
	border-radius: 12px;
	text-align: center;
	transition: all 0.3s ease;
	border: 1px solid var(--border-color);
}

.feature-card:hover {
	transform: translateY(-5px);
	box-shadow: var(--shadow-lg);
}

.feature-icon {
	font-size: 3rem;
	margin-bottom: 1rem;
}

.feature-card h3 {
	font-size: 1.5rem;
	font-weight: 600;
	margin-bottom: 1rem;
	color: var(--text-primary);
}

.feature-card p {
	color: var(--text-secondary);
	line-height: 1.6;
	margin-bottom: 1.5rem;
}

.feature-link {
	color: var(--gli-blue);
	text-decoration: none;
	font-weight: 600;
	transition: color 0.3s ease;
}

.feature-link:hover {
	color: var(--gli-purple);
}

.stats-section {
	padding: 4rem 0;
	background: var(--bg-tertiary);
}

.stats-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 2rem;
	text-align: center;
}

.stat-item {
	padding: 1.5rem;
}

.stat-number {
	font-size: 2.5rem;
	font-weight: 700;
	color: var(--gli-blue);
	margin-bottom: 0.5rem;
}

.stat-label {
	font-size: 1.1rem;
	color: var(--text-secondary);
	font-weight: 500;
}

/* 반응형 */
@media (max-width: 768px) {
	.hero-title {
		font-size: 2rem;
	}
	
	.hero-description {
		font-size: 1.1rem;
	}
	
	.hero-buttons {
		flex-direction: column;
		align-items: center;
	}
	
	.btn-primary,
	.btn-secondary {
		width: 200px;
	}
	
	.features-grid {
		grid-template-columns: 1fr;
	}
	
	.stats-grid {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media (max-width: 480px) {
	.hero-section {
		padding: 4rem 1rem;
	}
	
	.stats-grid {
		grid-template-columns: 1fr;
	}
}
</style>