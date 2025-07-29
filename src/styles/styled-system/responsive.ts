// 반응형 디자인 유틸리티
// 모바일-퍼스트 접근법

import { computed } from 'vue'
import { defaultTheme } from './index'

// 브레이크포인트 정의
export const breakpoints = {
  xs: '320px',
  sm: '576px',
  md: '768px',
  lg: '992px',
  xl: '1200px',
  '2xl': '1400px',
}

// 미디어 쿼리 유틸리티
export const media = {
  xs: `@media (min-width: ${breakpoints.xs})`,
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
}

// 반응형 간격 유틸리티
export const responsiveSpacing = {
  // 모바일에서는 작은 간격, 데스크톱에서는 큰 간격
  adaptive: computed(() => ({
    padding: defaultTheme.spacing.md,
    [media.md]: {
      padding: defaultTheme.spacing.lg,
    },
    [media.lg]: {
      padding: defaultTheme.spacing.xl,
    },
  })),

  // 섹션 간격
  section: computed(() => ({
    padding: `${defaultTheme.spacing.lg} 0`,
    [media.md]: {
      padding: `${defaultTheme.spacing.xl} 0`,
    },
    [media.lg]: {
      padding: `${defaultTheme.spacing['2xl']} 0`,
    },
  })),

  // 컨테이너 간격
  container: computed(() => ({
    padding: `0 ${defaultTheme.spacing.md}`,
    [media.md]: {
      padding: `0 ${defaultTheme.spacing.lg}`,
    },
    [media.lg]: {
      padding: `0 ${defaultTheme.spacing.xl}`,
    },
  })),
}

// 반응형 타이포그래피 유틸리티
export const responsiveTypography = {
  // 반응형 제목
  h1: computed(() => ({
    fontSize: defaultTheme.typography.fontSize['2xl'],
    lineHeight: defaultTheme.typography.lineHeight.tight,
    [media.md]: {
      fontSize: defaultTheme.typography.fontSize['3xl'],
    },
    [media.lg]: {
      fontSize: '32px',
    },
  })),

  h2: computed(() => ({
    fontSize: defaultTheme.typography.fontSize.xl,
    lineHeight: defaultTheme.typography.lineHeight.tight,
    [media.md]: {
      fontSize: defaultTheme.typography.fontSize['2xl'],
    },
    [media.lg]: {
      fontSize: defaultTheme.typography.fontSize['3xl'],
    },
  })),

  h3: computed(() => ({
    fontSize: defaultTheme.typography.fontSize.lg,
    lineHeight: defaultTheme.typography.lineHeight.normal,
    [media.md]: {
      fontSize: defaultTheme.typography.fontSize.xl,
    },
    [media.lg]: {
      fontSize: defaultTheme.typography.fontSize['2xl'],
    },
  })),

  body: computed(() => ({
    fontSize: defaultTheme.typography.fontSize.base,
    lineHeight: defaultTheme.typography.lineHeight.relaxed,
    [media.md]: {
      fontSize: defaultTheme.typography.fontSize.lg,
    },
  })),
}

// 반응형 레이아웃 유틸리티
export const responsiveLayout = {
  // 반응형 그리드
  grid: {
    // 1열 (모바일) → 2열 (태블릿) → 3열 (데스크톱)
    adaptive: computed(() => ({
      display: 'grid',
      gap: defaultTheme.spacing.md,
      gridTemplateColumns: '1fr',
      [media.md]: {
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: defaultTheme.spacing.lg,
      },
      [media.lg]: {
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: defaultTheme.spacing.xl,
      },
    })),

    // 1열 (모바일) → 2열 (태블릿) → 4열 (데스크톱)
    cards: computed(() => ({
      display: 'grid',
      gap: defaultTheme.spacing.md,
      gridTemplateColumns: '1fr',
      [media.sm]: {
        gridTemplateColumns: 'repeat(2, 1fr)',
      },
      [media.md]: {
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: defaultTheme.spacing.lg,
      },
      [media.lg]: {
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: defaultTheme.spacing.xl,
      },
    })),
  },

  // 반응형 플렉스
  flex: {
    // 세로 (모바일) → 가로 (태블릿+)
    columnToRow: computed(() => ({
      display: 'flex',
      flexDirection: 'column',
      gap: defaultTheme.spacing.md,
      [media.md]: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: defaultTheme.spacing.lg,
      },
    })),

    // 중앙 정렬
    center: computed(() => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: defaultTheme.spacing.md,
      [media.md]: {
        gap: defaultTheme.spacing.lg,
      },
    })),
  },
}

// 반응형 컴포넌트 스타일
export const responsiveComponents = {
  // 반응형 버튼
  button: computed(() => ({
    padding: `${defaultTheme.spacing.sm} ${defaultTheme.spacing.md}`,
    fontSize: defaultTheme.typography.fontSize.sm,
    [media.md]: {
      padding: `${defaultTheme.spacing.md} ${defaultTheme.spacing.lg}`,
      fontSize: defaultTheme.typography.fontSize.base,
    },
    [media.lg]: {
      padding: `${defaultTheme.spacing.lg} ${defaultTheme.spacing.xl}`,
      fontSize: defaultTheme.typography.fontSize.lg,
    },
  })),

  // 반응형 카드
  card: computed(() => ({
    padding: defaultTheme.spacing.md,
    borderRadius: defaultTheme.borderRadius.md,
    [media.md]: {
      padding: defaultTheme.spacing.lg,
      borderRadius: defaultTheme.borderRadius.lg,
    },
  })),

  // 반응형 입력 필드
  input: computed(() => ({
    padding: `${defaultTheme.spacing.sm} ${defaultTheme.spacing.md}`,
    fontSize: defaultTheme.typography.fontSize.sm,
    [media.md]: {
      padding: `${defaultTheme.spacing.md} ${defaultTheme.spacing.lg}`,
      fontSize: defaultTheme.typography.fontSize.base,
    },
  })),
}

// 터치 친화적 인터랙션
export const touchFriendly = {
  // 터치 타겟 최소 크기 (44px - WCAG 기준)
  touchTarget: computed(() => ({
    minWidth: '44px',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  })),

  // 터치 간격
  touchSpacing: computed(() => ({
    gap: defaultTheme.spacing.md,
    [media.md]: {
      gap: defaultTheme.spacing.lg,
    },
  })),
}

// 컨테이너 최대 너비
export const containerMaxWidth = {
  sm: '540px',
  md: '720px',
  lg: '960px',
  xl: '1140px',
  '2xl': '1320px',
}

// 반응형 컨테이너
export const responsiveContainer = computed(() => ({
  width: '100%',
  margin: '0 auto',
  padding: `0 ${defaultTheme.spacing.md}`,
  maxWidth: containerMaxWidth.xl,
  [media.sm]: {
    maxWidth: containerMaxWidth.sm,
  },
  [media.md]: {
    maxWidth: containerMaxWidth.md,
    padding: `0 ${defaultTheme.spacing.lg}`,
  },
  [media.lg]: {
    maxWidth: containerMaxWidth.lg,
    padding: `0 ${defaultTheme.spacing.xl}`,
  },
  [media.xl]: {
    maxWidth: containerMaxWidth.xl,
  },
  [media['2xl']]: {
    maxWidth: containerMaxWidth['2xl'],
  },
}))
