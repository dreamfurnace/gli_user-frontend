/**
 * CSS Optimization Configuration
 * 
 * 이 파일은 CSS 최적화를 위한 빌드 도구 설정을 포함합니다.
 * PostCSS, PurgeCSS, CSSNano 등을 통한 성능 최적화를 설정합니다.
 */

module.exports = {
    // PostCSS 설정
    postcss: {
        plugins: [
            // CSS 변수 폴리필
            require('postcss-custom-properties')({
                preserve: false,
                importFrom: [
                    './src/styles/tokens.css',
                    './src/styles/design-tokens.ts'
                ]
            }),

            // 중첩 CSS 지원
            require('postcss-nested'),

            // 자동 벤더 프리픽스
            require('autoprefixer')({
                flexbox: 'no-2009',
                grid: 'autoplace'
            }),

            // CSS 모듈 지원
            require('postcss-modules')({
                scopeBehaviour: 'local',
                generateScopedName: '[name]__[local]___[hash:base64:5]'
            }),

            // 미디어 쿼리 최적화
            require('postcss-sort-media-queries')({
                sort: 'desktop-first'
            }),

            // CSS 압축 (프로덕션에서만)
            ...(process.env.NODE_ENV === 'production' ? [
                require('cssnano')({
                    preset: ['default', {
                        discardComments: {
                            removeAll: true,
                        },
                        normalizeWhitespace: true,
                        colormin: true,
                        minifyFontValues: true,
                        minifyGradients: true,
                        minifyParams: true,
                        minifySelectors: true,
                        mergeLonghand: true,
                        mergeRules: true,
                        reduceIdents: false,
                        reduceInitial: true,
                        reduceTransforms: true,
                        uniqueSelectors: true,
                        zindex: false
                    }]
                })
            ] : [])
        ]
    },

    // PurgeCSS 설정 (사용하지 않는 CSS 제거)
    purgecss: {
        content: [
            './src/**/*.{vue,js,ts,jsx,tsx}',
            './src/**/*.html',
            './public/index.html'
        ],
        css: [
            './src/styles/**/*.css',
            './src/styles/architecture/*.css'
        ],
        safelist: [
            // 동적으로 생성되는 클래스들
            /^c-/,
            /^o-/,
            /^u-/,
            /^case-detail/,
            /^case-search/,
            // Vue.js 관련 클래스
            /^v-/,
            /^router-/,
            // 애니메이션 클래스
            /^animate-/,
            /^fade-/,
            /^slide-/,
            // 상태 클래스
            /^is-/,
            /^has-/,
            /^loading/,
            /^error/,
            /^success/,
            /^warning/,
            // 반응형 클래스
            /^sm:/,
            /^md:/,
            /^lg:/,
            /^xl:/,
            /^2xl:/,
            // 유틸리티 클래스
            /^hidden$/,
            /^block$/,
            /^flex$/,
            /^grid$/,
            /^text-/,
            /^bg-/,
            /^border-/,
            /^rounded-/,
            /^shadow-/,
            /^m-/,
            /^p-/,
            /^w-/,
            /^h-/
        ],
        defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
        fontFace: true,
        keyframes: true,
        variables: true
    },

    // CSS 압축 설정
    minification: {
        // CSSNano 고급 설정
        cssnano: {
            preset: ['advanced', {
                autoprefixer: false,
                cssDeclarationSorter: true,
                cssnano: true,
                discardComments: {
                    removeAll: true
                },
                discardDuplicates: true,
                discardEmpty: true,
                discardUnused: true,
                mergeIdents: false,
                mergeLonghand: true,
                mergeRules: true,
                minifyFontValues: true,
                minifyGradients: true,
                minifyParams: true,
                minifySelectors: true,
                normalizeCharset: true,
                normalizeDisplayValues: true,
                normalizePositions: true,
                normalizeRepeatStyle: true,
                normalizeString: true,
                normalizeTimingFunctions: true,
                normalizeUnicode: true,
                normalizeUrl: true,
                orderedValues: true,
                reduceIdents: false,
                reduceInitial: true,
                reduceTransforms: true,
                uniqueSelectors: true,
                zindex: false
            }]
        }
    },

    // Critical CSS 설정
    critical: {
        // Critical CSS 추출 설정
        extract: {
            // 추출할 페이지들
            pages: [
                {
                    url: '/case-detail',
                    template: './src/views/CaseDetail.vue',
                    width: 1200,
                    height: 900
                },
                {
                    url: '/case-search',
                    template: './src/views/CaseSearch.vue',
                    width: 1200,
                    height: 900
                }
            ],
            // 인라인 크기 제한 (KB)
            inlineThreshold: 50,
            // 최소 크기 (KB)
            minify: true,
            // 폰트 최적화
            penthouse: {
                forceInclude: [
                    '.case-detail__header',
                    '.case-detail__main',
                    '.c-button',
                    '.c-input',
                    '.c-card'
                ],
                timeout: 30000,
                renderWaitTime: 1000,
                blockJSRequests: false
            }
        }
    },

    // 성능 모니터링 설정
    performance: {
        // CSS 크기 제한
        maxSize: {
            css: '100KB',
            critical: '20KB'
        },
        // 성능 메트릭
        metrics: {
            firstContentfulPaint: 1500,
            largestContentfulPaint: 2500,
            cumulativeLayoutShift: 0.1
        }
    },

    // 브라우저 지원 설정
    browsers: [
        '> 1%',
        'last 2 versions',
        'not dead',
        'not ie 11'
    ],

    // 소스맵 설정
    sourcemap: process.env.NODE_ENV !== 'production',

    // 캐시 설정
    cache: {
        enabled: true,
        directory: './node_modules/.cache/css-optimizer',
        maxAge: 24 * 60 * 60 * 1000 // 24시간
    },

    // 워치 모드 설정
    watch: {
        enabled: process.env.NODE_ENV === 'development',
        files: [
            './src/styles/**/*.css',
            './src/components/**/*.vue',
            './src/views/**/*.vue'
        ],
        ignore: [
            './node_modules/**',
            './dist/**'
        ]
    },

    // 로깅 설정
    logging: {
        level: process.env.NODE_ENV === 'production' ? 'error' : 'info',
        colors: true,
        timestamp: true
    }
}; 