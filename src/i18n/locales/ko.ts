export default {
  // 공통
  common: {
    save: '저장',
    cancel: '취소',
    loading: '로딩 중...',
    error: '오류',
    success: '성공',
    confirm: '확인',
    close: '닫기',
    back: '뒤로',
    next: '다음',
    previous: '이전',
    edit: '수정',
    delete: '삭제',
    create: '생성',
    search: '검색',
    filter: '필터',
    sort: '정렬',
    refresh: '새로고침',
    upload: '업로드',
    download: '다운로드',
    copy: '복사',
    paste: '붙여넣기',
    select: '선택',
    all: '전체',
    none: '없음',
    yes: '예',
    no: '아니오',
    ok: '확인',
    connect: '연결',
    disconnect: '연결 해제',
    balance: '잔액',
    wallet: '지갑',
    network: '네트워크',
    enabled: '활성화',
    disabled: '비활성화',
    theme: {
      light: '라이트 모드',
      dark: '다크 모드',
      toggle: '테마 변경'
    }
  },

  // 네비게이션
  nav: {
    business: '📄 사업 소개',
    auth: '🔐 인증 센터', 
    conversion: '💱 토큰 변환',
    shopping: '🛍️ 쇼핑몰',
    mypage: '🧑 마이페이지',
    referral: '🤝 레퍼럴',
    help: '📑 안내 센터'
  },

  // 헤더
  header: {
    brand: 'GLI Platform',
    account: '계정',
    grade: '등급',
    walletAddress: '지갑 주소',
    authNumber: '인증 번호',
    networkStatus: '네트워크 상태',
    login: '로그인',
    logout: '로그아웃',
    autoLogin: '3일 자동 로그인',
    language: {
      korean: '한국어',
      english: 'English'
    }
  },

  // Web3 관련
  web3: {
    connecting: '지갑 연결 중...',
    connected: '연결됨',
    disconnected: '연결되지 않음',
    networkError: '네트워크 오류',
    walletNotFound: '지갑을 찾을 수 없습니다',
    transactionPending: '거래 처리 중...',
    transactionSuccess: '거래 완료',
    transactionFailed: '거래 실패',
    insufficientBalance: '잔액이 부족합니다'
  },

  // 토큰 관련
  tokens: {
    glib: 'GLIB (RWA 코인)',
    glid: 'GLID (거버넌스)',
    glil: 'GLIL (게임/스테이블)',
    usdt: 'USDT',
    conversion: '변환',
    amount: '수량',
    from: '출발',
    to: '도착',
    rate: '환율',
    fee: '수수료',
    convert: '변환하기'
  },

  // 비즈니스 페이지
  business: {
    hero: {
      subtitle: '프리미엄 리조트와 Web3가 만나는 혁신적인 플랫폼'
    },
    nav: {
      background: '배경',
      team: '팀원',
      strategy: '전략',
      roadmap: '일정'
    },
    background: {
      title: '프로젝트 배경',
      vision: {
        title: '비전',
        description: 'GLI는 리조트 경험과 블록체인 기술을 융합하여 새로운 가치를 창출합니다.'
      },
      blockchain: {
        title: '블록체인 혁신',
        description: 'RWA 토큰을 통해 실물 자산과 디지털 자산을 연결하는 혁신적인 생태계를 구축합니다.'
      },
      resort: {
        title: '프리미엄 리조트',
        description: '최고급 리조트 서비스와 독점적인 경험을 토큰 홀더에게 제공합니다.'
      },
      gaming: {
        title: '게임 생태계',
        description: '재미있는 게임 요소를 통해 사용자 참여를 높이고 토큰 유틸리티를 확장합니다.'
      }
    },
    team: {
      title: '팀 구성원',
      roles: {
        ceo: '최고경영자',
        cto: '최고기술책임자',
        designer: '디자인 총괄',
        marketing: '마케팅 총괄'
      },
      descriptions: {
        ceo: '블록체인 비즈니스 전략 및 전반적인 경영을 담당합니다.',
        cto: '스마트 컨트랙트와 DeFi 프로토콜 개발을 리드합니다.',
        designer: 'UI/UX 디자인과 브랜드 경험을 책임집니다.',
        marketing: '커뮤니티 성장과 마케팅 전략을 담당합니다.'
      }
    },
    strategy: {
      title: '전략 로드맵',
      phases: {
        phase1: {
          title: '플랫폼 구축',
          description: '기본 플랫폼과 토큰 시스템을 구축합니다.',
          features: {
            platform: '웹 플랫폼 개발',
            tokens: 'GLIB/GLID/GLIL 토큰 발행',
            wallet: '지갑 연동 시스템'
          }
        },
        phase2: {
          title: '리조트 연동',
          description: '프리미엄 리조트 예약 및 리워드 시스템을 구축합니다.',
          features: {
            resort: '리조트 파트너십',
            booking: '예약 시스템',
            rewards: '리워드 프로그램'
          }
        },
        phase3: {
          title: '게임 생태계',
          description: '게이밍 요소와 NFT를 도입하여 생태계를 확장합니다.',
          features: {
            gaming: '게임 콘텐츠',
            nft: 'NFT 컬렉션',
            metaverse: '메타버스 경험'
          }
        },
        phase4: {
          title: '글로벌 확장',
          description: '전 세계로 서비스를 확장하고 파트너십을 강화합니다.',
          features: {
            global: '글로벌 진출',
            partnerships: '전략적 파트너십',
            expansion: '서비스 확장'
          }
        }
      }
    },
    roadmap: {
      title: '개발 일정',
      milestones: {
        q1_2024: {
          title: '플랫폼 MVP 출시',
          description: '기본 플랫폼과 토큰 시스템 출시'
        },
        q2_2024: {
          title: '리조트 파트너십',
          description: '첫 번째 리조트 파트너와의 협약 체결'
        },
        q3_2024: {
          title: '베타 서비스',
          description: '제한된 사용자 대상 베타 서비스 시작'
        },
        q4_2024: {
          title: '정식 서비스',
          description: '전체 기능을 포함한 정식 서비스 오픈'
        }
      }
    }
  },

  // 계약서 선택 페이지
  contractDocChoice: {
    title: '계약서 작성',
    description: '작성하고자 하는 계약서 유형을 선택해주세요',
    comingSoon: 'Coming Soon',
    contractTypes: {
      realEstateSale: '부동산 매매계약서',
      realEstateSaleLand: '부동산 매매계약서/토지',
      realEstateSaleCommercial: '부동산 매매계약서/상가',
      realEstateSaleApartment: '부동산 매매계약서/아파트',
      realEstateRentalHouse: '부동산 임대차계약서/일반주택',
      realEstateRentalCommercial: '부동산 임대차계약서/상가',
      realEstateRentalLand: '부동산 임대차계약서/토지',
      realEstateRentalApartment: '부동산 임대차계약서/아파트',
      realEstateRentalVilla: '부동산 임대차계약서/빌라',
      realEstateRentalStudio: '부동산 임대차계약서/원룸',
      realEstateRentalEtc: '부동산 임대차계약서/기타',
    },
    descriptions: {
      realEstateSale: '아파트, 빌라, 상가 등 부동산 매매',
      realEstateSaleLand: '토지, 논, 밭 등 토지 매매',
      realEstateSaleCommercial: '상가, 오피스텔 등 상업용 부동산',
      realEstateSaleApartment: '아파트, 주상복합 등 주거용 부동산',
      realEstateRentalHouse: '일반주택, 원룸 등 주거용 임대차',
      realEstateRentalCommercial: '상가, 사무실 등 상업용 임대차',
      realEstateRentalLand: '토지, 공장부지 등 토지 임대차',
      realEstateRentalApartment: '아파트, 주상복합 등 아파트 임대차',
      realEstateRentalVilla: '빌라, 다세대주택 등 빌라 임대차',
      realEstateRentalStudio: '원룸, 고시원 등 원룸 임대차',
      realEstateRentalEtc: '기타 부동산 임대차 계약',
    },
    messages: {
      comingSoon: '이 기능은 준비 중입니다. 곧 서비스될 예정입니다.',
    },
  },

  // 프로필 편집 페이지
  profileEdit: {
    title: '내 정보 수정',
    basicInfo: '기본 정보',
    name: '이름',
    nameRequired: '이름 *',
    phone: '전화번호',
    phonePlaceholder: '010-0000-0000',
    profileImage: '프로필 이미지',
    save: '저장',
    saving: '저장 중...',
    cancel: '취소',
    messages: {
      loadError: '프로필 정보를 불러오는데 실패했습니다.',
      updateSuccess: '프로필이 성공적으로 업데이트되었습니다.',
      updateError: '프로필 업데이트에 실패했습니다.',
      avatarUploadSuccess: '아바타가 성공적으로 업로드되었습니다.',
      avatarUploadError: '아바타 업로드에 실패했습니다.',
      nameRequired: '이름을 입력해주세요.',
    },
  },

  // 인증 센터
  auth: {
    subtitle: '회원 등급 관리와 토큰 변환을 위한 인증 센터',
    currentGrade: '현재 등급',
    current: '현재',
    unlocked: '해제됨',
    locked: '잠김',
    benefits: '혜택',
    requirements: '요구사항',
    upgrade: '등급 업그레이드',
    stakingNav: '스테이킹',
    grades: {
      r: 'Reader (읽기 권한)',
      w: 'Writer (쓰기 권한)',
      x: 'Expert (전문가 권한)'
    },
    gradeSystem: {
      title: '회원 등급 시스템'
    },
    gradeBenefits: {
      basicAccess: '기본 플랫폼 접근',
      communityForum: '커뮤니티 포럼 참여',
      weeklyReports: '주간 리포트 수신',
      premiumContent: '프리미엄 콘텐츠 접근',
      prioritySupport: '우선 고객지원',
      monthlyAnalysis: '월간 시장 분석',
      earlyAccess: '신기능 조기 접근',
      exclusiveEvents: '독점 이벤트 참여',
      personalConsultation: '개인 컨설팅 서비스',
      customReports: '맞춤형 보고서',
      vipLounge: 'VIP 라운지 이용'
    },
    conversion: {
      title: '토큰 변환 센터',
      glibGlidTitle: 'GLIB ↔ GLID 양방향 변환',
      glibGlilTitle: 'GLIB → GLIL 단방향 변환',
      oneWayWarning: '이 변환은 되돌릴 수 없습니다',
      convertToGame: '게임 토큰으로 변환'
    },
    staking: {
      title: '스테이킹 센터',
      totalStaked: '총 스테이킹',
      apy: '연간 수익률',
      rewards: '보상',
      stake: '스테이킹',
      unstake: '언스테이킹'
    },
    achievements: {
      title: '성취 시스템',
      firstStake: {
        title: '첫 스테이킹',
        description: '처음으로 토큰을 스테이킹했습니다',
        reward: '+100 GLIB 보너스'
      },
      tokenConverter: {
        title: '토큰 변환 마스터',
        description: '토큰 변환을 10회 완료하세요',
        reward: '변환 수수료 50% 할인'
      },
      stakingMaster: {
        title: '스테이킹 마스터',
        description: '30일 연속 스테이킹을 유지하세요',
        reward: 'APY +2% 보너스'
      },
      gradeExpert: {
        title: '전문가 등급 달성',
        description: 'Expert 등급에 도달하세요',
        reward: '독점 NFT 지급'
      }
    }
  },

  // 마이페이지
  mypage: {
    subtitle: '내 정보, 추천인 코드, 토큰 주소, 거래 내역을 관리하세요',
    tabs: {
      profile: '회원 정보',
      portfolio: '투자 포트폴리오',
      referral: '추천인 코드',
      tokens: '토큰 주소',
      transactions: '거래 내역',
      wallet: '입출금'
    },
    profile: {
      title: '회원 정보',
      basicInfo: '기본 정보',
      email: '이메일',
      phone: '전화번호',
      joinDate: '가입일',
      lastLogin: '최근 로그인',
      recentSessions: '최근 로그인 세션',
      security: '보안 설정',
      twoFactor: '2단계 인증',
      twoFactorDesc: '계정 보안을 위한 2단계 인증을 설정하세요',
      passwordChange: '비밀번호 변경',
      passwordChangeDesc: '정기적으로 비밀번호를 변경해주세요',
      changePassword: '변경하기',
      sessionStatus: {
        active: '활성',
        expired: '만료'
      }
    },
    referral: {
      title: '추천인 코드',
      myCode: '내 추천인 코드',
      copyLink: '링크 복사',
      stats: '추천 통계',
      totalInvited: '총 초대 수',
      activeReferrals: '활성 추천인',
      totalRewards: '총 보상',
      monthlyRewards: '이번 달 보상',
      share: '소셜 공유'
    },
    tokens: {
      title: '토큰 주소',
      address: '지갑 주소',
      qrCode: 'QR 코드'
    },
    transactions: {
      title: '거래 내역',
      tokenFilter: '토큰 필터',
      typeFilter: '거래 유형',
      dateRange: '기간',
      export: '내보내기',
      date: '날짜',
      type: '유형',
      token: '토큰',
      amount: '금액',
      status: '상태',
      hash: '해시',
      types: {
        deposit: '입금',
        withdrawal: '출금',
        conversion: '변환',
        purchase: '구매'
      },
      statuses: {
        completed: '완료',
        pending: '대기',
        failed: '실패'
      }
    },
    wallet: {
      title: '입출금',
      connected: '지갑 연결됨',
      disconnected: '지갑 연결 안됨',
      connect: '지갑 연결',
      deposit: '입금',
      withdrawal: '출금',
      token: '토큰',
      amount: '금액',
      enterAmount: '금액을 입력하세요',
      toAddress: '받는 주소',
      enterAddress: '주소를 입력하세요',
      networkFee: '네트워크 수수료',
      withdrawalFee: '출금 수수료'
    }
  },

  // 토큰 변환
  conversion: {
    subtitle: '다양한 GLI 토큰 간의 스마트한 변환 서비스',
    exchange: '토큰 교환',
    types: {
      standard: '표준',
      instant: '즉시',
      economy: '절약'
    },
    from: '보내는 토큰',
    to: '받는 토큰',
    enterAmount: '수량 입력',
    max: '최대',
    available: '사용 가능',
    rate: '환율',
    fee: '수수료',
    priceImpact: '가격 영향',
    minimumReceived: '최소 수령',
    networkFee: '네트워크 수수료',
    convert: '변환하기',
    converting: '변환 중...',
    confirmConversion: '변환 확인',
    youPay: '지불하는 금액',
    youReceive: '받는 금액',
    confirmWarning: '이 거래는 되돌릴 수 없습니다. 계속하시겠습니까?',
    confirmAndConvert: '확인 후 변환',
    recentTransactions: '최근 거래 내역',
    allTokens: '모든 토큰',
    noTransactions: '거래 내역이 없습니다',
    viewDetails: '상세보기',
    transactionDetails: '거래 상세정보',
    conversionInfo: '변환 정보',
    transactionInfo: '거래 정보',
    timestamp: '거래 시간',
    transactionHash: '거래 해시',
    status: {
      completed: '완료',
      pending: '대기중',
      failed: '실패'
    },
    warnings: {
      highPriceImpact: '높은 가격 영향이 예상됩니다',
      highAmount: '큰 금액의 변환입니다',
      oneWayConversion: '이 변환은 되돌릴 수 없습니다'
    }
  },

  // 에러 메시지
  errors: {
    network: '네트워크 오류가 발생했습니다.',
    server: '서버 오류가 발생했습니다.',
    unauthorized: '인증되지 않은 사용자입니다.',
    forbidden: '접근 권한이 없습니다.',
    notFound: '요청한 리소스를 찾을 수 없습니다.',
    validation: '입력값을 확인해주세요.',
    fileSize: '파일 크기는 5MB를 초과할 수 없습니다.',
    fileType: '지원되는 이미지 형식은 JPEG, PNG, GIF입니다.',
  },

  // 성공 메시지
  success: {
    saved: '저장되었습니다.',
    updated: '업데이트되었습니다.',
    deleted: '삭제되었습니다.',
    uploaded: '업로드되었습니다.',
  },

  // 우측 패널
  rightPanel: {
    toggle: '도움말 패널 토글',
    help: '도움말 및 가이드',
    contextualHelp: '상황별 도움말',
    tooltips: '빠른 팁',
    customerService: '고객 서비스',
    chat: '실시간 채팅',
    sendMessage: '메시지 전송',
    typing: '어시스턴트가 입력 중...',
    helpSections: {
      gettingStarted: '시작하기',
      walletSetup: '지갑 설정',
      tokenConversion: '토큰 변환',
      businessServices: '비즈니스 서비스',
      troubleshooting: '문제 해결'
    },
    tooltipContent: {
      walletConnect: '모든 기능을 이용하려면 Web3 지갑을 연결하세요',
      tokenConversion: '다양한 토큰 유형 간 변환이 가능합니다',
      businessCenter: '비즈니스 서비스 및 파트너십에 접근하세요',
      shoppingMall: '리조트 예약 및 상품을 둘러보고 구매하세요'
    },
    chatPlaceholder: 'GLI 서비스에 대해 궁금한 것을 물어보세요...',
    defaultResponses: {
      welcome: '안녕하세요! GLI 서비스 이용을 도와드리겠습니다. 무엇을 도와드릴까요?',
      walletHelp: '지갑을 연결하려면 헤더의 "지갑 연결" 버튼을 클릭하고 원하는 지갑 제공업체를 선택하세요.',
      tokenHelp: '토큰 변환을 통해 다양한 토큰을 교환할 수 있습니다. 토큰 변환 페이지를 방문해 시작하세요.',
      generalHelp: '더 자세한 정보는 도움말 섹션을 확인하거나 고객 지원팀에 문의하세요.'
    }
  },

  // 쇼핑몰
  shopping: {
    title: 'GLI 쇼핑몰',
    subtitle: '럭셔리 리조트 예약, 프리미엄 상품, 고급 레스토랑 예약을 경험하세요',
    items: '개 상품',
    viewCart: '장바구니 보기',
    addToCart: '장바구니 담기',
    bookNow: '지금 예약',
    buyNow: '지금 구매',
    reserveNow: '지금 예약',
    connectWalletFirst: '먼저 지갑을 연결해주세요',
    addedToCart: '상품이 장바구니에 추가되었습니다',
    paymentSuccess: '결제가 성공적으로 완료되었습니다',
    paymentError: '결제에 실패했습니다. 다시 시도해주세요.',
    tabs: {
      resort: '리조트 예약',
      goods: '상품 구매',
      restaurant: '레스토랑',
      orders: '주문 내역'
    },
    resort: {
      title: '리조트 예약',
      subtitle: 'GLI 럭셔리 리조트에서 완벽한 휴가를 예약하세요',
      checkIn: '체크인 날짜',
      checkOut: '체크아웃 날짜',
      guests: '투숙객',
      guest: '명',
      roomType: '객실 타입',
      allRoomTypes: '모든 객실 타입',
      standard: '스탠다드룸',
      deluxe: '디럭스룸',
      suite: '스위트룸',
      villa: '빌라',
      search: '검색',
      night: '박',
      selectDates: '체크인과 체크아웃 날짜를 선택해주세요',
      searching: '이용 가능한 객실을 검색 중...',
      noResults: '검색된 리조트가 없습니다',
      tryDifferentSearch: '검색 조건을 조정해보세요'
    }
  },

  // 추천인 시스템
  referral: {
    title: '추천인 시스템',
    subtitle: '친구를 초대하고 GLI 추천인 프로그램으로 보상을 받으세요',
    totalInvited: '총 초대 수',
    activeReferrals: '활성 추천인',
    totalRewards: '총 보상',
    monthlyRewards: '월간 보상',
    myReferralCode: '내 추천인 코드',
    codeDescription: '친구와 가족에게 고유한 추천인 코드를 공유하세요',
    referralLink: '추천인 링크',
    copyLink: '링크 복사',
    copied: '복사됨!',
    copyFailed: '복사에 실패했습니다',
    customLinkGenerator: '커스텀 링크 생성기',
    customLinkDescription: '다양한 캠페인을 위한 추적 가능한 커스텀 링크를 생성하세요',
    campaignName: '캠페인 이름',
    campaignPlaceholder: '캠페인 이름을 입력하세요 (예: Summer2024)',
    medium: '매체',
    selectMedium: '매체 선택',
    social: '소셜 미디어',
    email: '이메일',
    website: '웹사이트',
    qr: 'QR 코드',
    generatedLink: '생성된 링크',
    socialSharing: '소셜 미디어 공유',
    socialDescription: '소셜 플랫폼에서 추천인 링크를 공유하세요',
    customMessage: '커스텀 메시지',
    messagePlaceholder: '커스텀 공유 메시지를 입력하세요...',
    kakaoShareNotImplemented: '카카오톡 공유 기능은 곧 구현될 예정입니다',
    discordCopied: '디스코드 공유를 위해 메시지가 복사되었습니다',
    qrCode: 'QR 코드 생성기',
    qrDescription: '오프라인 공유를 위한 QR 코드를 생성하세요',
    basicLink: '기본 추천인 링크',
    customLink: '커스텀 링크',
    generateQR: 'QR 코드 생성',
    qrCodeAlt: '추천인 QR 코드',
    downloadQR: 'QR 코드 다운로드',
    referralList: '내 추천인 목록',
    listDescription: '추천한 사용자와 상태를 추적하세요',
    user: '사용자',
    joinDate: '가입일',
    status: {
      active: '활성',
      pending: '대기 중',
      inactive: '비활성'
    },
    rewards: '보상',
    noReferrals: '아직 추천인이 없습니다',
    startReferring: '친구를 초대해서 보상을 받으세요!',
    rewardHistory: '보상 내역',
    rewardDescription: '추천인 보상과 보너스를 추적하세요',
    noRewards: '아직 보상이 없습니다'
  },

  // 안내 센터
  info: {
    title: '안내 센터',
    subtitle: 'GLI 플랫폼 사용법과 도움말을 확인하세요',
    searchPlaceholder: 'FAQ, 가이드, 도움말 검색...',
    noResults: '검색 결과가 없습니다',
    tryDifferentSearch: '다른 검색어를 시도해보세요',
    download: '다운로드',
    quickLinks: {
      faq: 'FAQ',
      faqDesc: '자주 묻는 질문과 답변',
      guides: '사용자 가이드',
      guidesDesc: '단계별 사용법 안내',
      resources: '다운로드 자료',
      resourcesDesc: '유용한 문서와 자료',
      contact: '연락처',
      contactDesc: '고객 지원 및 문의'
    },
    faq: {
      title: '자주 묻는 질문',
      subtitle: 'GLI 플랫폼에 대한 궁금한 점들을 확인해보세요',
      categories: {
        all: '전체',
        gettingStarted: '시작하기',
        wallet: '지갑',
        tokens: '토큰',
        shopping: '쇼핑몰',
        technical: '기술 지원'
      },
      items: {
        howToStart: {
          question: 'GLI 플랫폼을 어떻게 시작하나요?',
          answer: 'GLI 플랫폼을 시작하려면 먼저 Web3 지갑을 연결하고 계정을 생성하세요. 그 다음 인증 센터에서 등급을 확인하고 토큰 변환 기능을 이용할 수 있습니다.'
        },
        connectWallet: {
          question: '지갑 연결이 안 되는 경우 어떻게 해야 하나요?',
          answer: '지갑 연결 문제가 발생하면 다음을 확인하세요: 1) 브라우저에 지갑 확장 프로그램이 설치되어 있는지, 2) 올바른 네트워크에 연결되어 있는지, 3) 지갑이 잠금 해제되어 있는지 확인하세요.'
        },
        tokenTypes: {
          question: 'GLIB, GLID, GLIL 토큰의 차이점은 무엇인가요?',
          answer: 'GLIB는 RWA(실물 자산) 토큰으로 리조트 자산과 연결되어 있습니다. GLID는 거버넌스 토큰으로 플랫폼 의사결정에 참여할 수 있습니다. GLIL은 게임 및 스테이블 토큰으로 플랫폼 내 결제와 게임에 사용됩니다.'
        },
        resortBooking: {
          question: '리조트 예약은 어떻게 하나요?',
          answer: '쇼핑몰에서 리조트 예약 탭을 선택하고, 원하는 날짜와 객실 타입을 선택하세요. GLI 토큰으로 결제하면 특별 할인 혜택을 받을 수 있습니다.'
        },
        networkIssues: {
          question: '네트워크 오류가 발생하면 어떻게 해야 하나요?',
          answer: '네트워크 오류 시 페이지를 새로고침하거나 지갑을 다시 연결해보세요. 문제가 지속되면 고객 지원팀에 문의하시기 바랍니다.'
        },
        accountSetup: {
          question: '계정 설정은 어떻게 하나요?',
          answer: '마이페이지에서 프로필 정보를 수정할 수 있습니다. 보안을 위해 2단계 인증을 설정하는 것을 권장합니다.'
        }
      }
    },
    guides: {
      title: '사용자 가이드',
      subtitle: '단계별 가이드로 GLI 플랫폼을 쉽게 이용하세요',
      difficulty: {
        beginner: '초급',
        intermediate: '중급',
        advanced: '고급'
      },
      items: {
        gettingStarted: {
          title: 'GLI 플랫폼 시작하기',
          description: 'GLI 플랫폼 첫 사용자를 위한 기본 가이드',
          steps: {
            1: {
              title: '계정 생성',
              description: '이메일과 패스워드로 GLI 계정을 생성하세요.'
            },
            2: {
              title: '지갑 연결',
              description: 'MetaMask 등 Web3 지갑을 연결하세요.'
            },
            3: {
              title: '등급 확인',
              description: '인증 센터에서 현재 등급과 혜택을 확인하세요.'
            },
            4: {
              title: '기능 탐색',
              description: '토큰 변환, 쇼핑몰 등 다양한 기능을 둘러보세요.'
            }
          }
        },
        walletSetup: {
          title: '지갑 설정 가이드',
          description: 'Web3 지갑 설치부터 연결까지 상세 안내',
          steps: {
            1: {
              title: 'MetaMask 설치',
              description: '브라우저 확장 프로그램으로 MetaMask를 설치하세요.'
            },
            2: {
              title: '네트워크 설정',
              description: 'GLI 네트워크를 추가하고 연결하세요.'
            }
          }
        },
        tokenConversion: {
          title: '토큰 변환 가이드',
          description: '다양한 토큰 간 변환 방법과 주의사항',
          steps: {
            1: {
              title: '변환 페이지 접속',
              description: '토큰 변환 메뉴로 이동하세요.'
            }
          }
        }
      }
    },
    resources: {
      title: '다운로드 자료',
      subtitle: '유용한 문서와 자료를 다운로드하세요',
      downloadStarted: '다운로드가 시작되었습니다',
      items: {
        whitepaper: {
          title: 'GLI 백서',
          description: 'GLI 프로젝트의 비전과 기술적 세부사항'
        },
        tokenomics: {
          title: '토큰 이코노믹스',
          description: 'GLI 토큰의 경제 모델과 분배 구조'
        },
        apiDocs: {
          title: 'API 문서',
          description: '개발자를 위한 GLI 플랫폼 API 가이드'
        }
      }
    },
    contact: {
      title: '연락처 및 지원',
      subtitle: '도움이 필요하시면 언제든 연락주세요',
      email: '이메일 지원',
      chat: '실시간 채팅',
      chatHours: '평일 9:00-18:00 운영',
      telegram: '텔레그램',
      form: {
        title: '문의하기',
        name: '이름',
        email: '이메일',
        subject: '문의 유형',
        selectSubject: '문의 유형을 선택하세요',
        subjects: {
          technical: '기술 지원',
          account: '계정 관련',
          billing: '결제 관련',
          general: '일반 문의'
        },
        message: '문의 내용',
        send: '문의하기',
        sending: '전송 중...',
        success: '문의가 성공적으로 전송되었습니다',
        error: '문의 전송에 실패했습니다'
      }
    }
  },
}
