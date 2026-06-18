// Commercial district (상권) definition
export interface DistrictData {
  id: string
  nameKo: string
  nameEn: string
  desc: string
  avgSales: number // in KRW (ten thousand won, 만원)
  yoySalesChange: number // percentage
  densityScore: number // 1-100 scale (100 is high density)
  survivalRate3Year: number // percentage
  footTrafficHourly: { hour: string; traffic: number }[] // traffic in thousands
  footTrafficGender: { name: string; value: number }[]
  footTrafficAge: { ageGroup: string; percentage: number }[]
  topSectors: {
    sector: string
    density: "High" | "Medium" | "Low"
    survivalRate: number
  }[]
  recommendedFranchises: {
    name: string
    sector: string
    minCapital: number
    rating: number
  }[]
}

export interface CurationArticle {
  id: string
  title: string
  summary: string
  category: "Trend" | "Guide" | "Policy"
  readTime: string
  date: string
  imageUrl?: string
}

export interface OnboardingQuestion {
  id: number
  question: string
  options: {
    text: string
    persona: string
    desc: string
  }[]
}

export interface PersonaResult {
  id: string
  title: string
  desc: string
  accentColor: string
  recommendedSectors: string[]
  recommendedDistricts: string[] // references DistrictData.id
  franchises: string[]
}

// 1. Districts data
export const districtsData: DistrictData[] = [
  {
    id: "gangnam",
    nameKo: "강남역 상권",
    nameEn: "Gangnam Station",
    desc: "서울 최대의 오피스 및 상업 지구로, 20-30대 직장인과 대학생 유동인구가 압도적입니다. 높은 임대료와 치열한 경쟁이 특징이나 절대적인 배후 수요가 보장됩니다.",
    avgSales: 4850, // 4,850만원
    yoySalesChange: 6.4,
    densityScore: 92,
    survivalRate3Year: 42.5,
    footTrafficHourly: [
      { hour: "08시", traffic: 45 },
      { hour: "12시", traffic: 88 },
      { hour: "15시", traffic: 52 },
      { hour: "18시", traffic: 95 },
      { hour: "21시", traffic: 78 },
      { hour: "24시", traffic: 30 },
    ],
    footTrafficGender: [
      { name: "남성", value: 48 },
      { name: "여성", value: 52 },
    ],
    footTrafficAge: [
      { ageGroup: "20대", percentage: 41 },
      { ageGroup: "30대", percentage: 33 },
      { ageGroup: "40대", percentage: 14 },
      { ageGroup: "50대 이상", percentage: 12 },
    ],
    topSectors: [
      { sector: "일식/이자카야", density: "High", survivalRate: 46.8 },
      { sector: "커피 전문점", density: "High", survivalRate: 38.2 },
      { sector: "퓨전 한식", density: "Medium", survivalRate: 51.0 },
      { sector: "뷰티/미용실", density: "High", survivalRate: 49.3 },
    ],
    recommendedFranchises: [
      {
        name: "메가커피",
        sector: "커피 전문점",
        minCapital: 8500,
        rating: 4.5,
      },
      {
        name: "백소정",
        sector: "일식/이자카야",
        minCapital: 12000,
        rating: 4.7,
      },
      { name: "역전할머니맥주", sector: "주점", minCapital: 9800, rating: 4.4 },
    ],
  },
  {
    id: "mapo",
    nameKo: "홍대/합정 상권",
    nameEn: "Hongdae/Hapjeong",
    desc: "젊은 층과 외국인 관광객의 비중이 매우 높은 문화/예술 중심의 상권입니다. 트렌드 변화가 극도로 빠르며, 감성적인 인테리어와 독창적인 F&B 아이템이 유효합니다.",
    avgSales: 3120, // 3,120만원
    yoySalesChange: 8.9,
    densityScore: 85,
    survivalRate3Year: 39.1,
    footTrafficHourly: [
      { hour: "08시", traffic: 15 },
      { hour: "12시", traffic: 54 },
      { hour: "15시", traffic: 72 },
      { hour: "18시", traffic: 98 },
      { hour: "21시", traffic: 110 },
      { hour: "24시", traffic: 65 },
    ],
    footTrafficGender: [
      { name: "남성", value: 42 },
      { name: "여성", value: 58 },
    ],
    footTrafficAge: [
      { ageGroup: "20대", percentage: 56 },
      { ageGroup: "30대", percentage: 24 },
      { ageGroup: "40대", percentage: 12 },
      { ageGroup: "50대 이상", percentage: 8 },
    ],
    topSectors: [
      { sector: "감성 카페/디저트", density: "High", survivalRate: 35.4 },
      { sector: "의류 로드숍", density: "High", survivalRate: 41.2 },
      { sector: "아시안 푸드", density: "Medium", survivalRate: 48.6 },
      { sector: "스튜디오/셀프사진관", density: "Medium", survivalRate: 55.2 },
    ],
    recommendedFranchises: [
      { name: "하루필름", sector: "셀프사진관", minCapital: 6000, rating: 4.8 },
      {
        name: "투썸플레이스",
        sector: "커피 전문점",
        minCapital: 25000,
        rating: 4.3,
      },
      {
        name: "마라탕 브랜드",
        sector: "아시안 푸드",
        minCapital: 7500,
        rating: 4.6,
      },
    ],
  },
  {
    id: "seongdong",
    nameKo: "성수역 상권",
    nameEn: "Seongsu-dong",
    desc: "최근 가장 핫한 팝업 스토어 및 리테일 상권입니다. 붉은 벽돌의 공장형 카페와 힙한 브랜드 쇼룸이 혼재되어 있으며 주말 유동인구가 평일을 상회하는 복합 상권입니다.",
    avgSales: 3950, // 3,950만원
    yoySalesChange: 14.2,
    densityScore: 78,
    survivalRate3Year: 51.3,
    footTrafficHourly: [
      { hour: "08시", traffic: 35 },
      { hour: "12시", traffic: 70 },
      { hour: "15시", traffic: 68 },
      { hour: "18시", traffic: 82 },
      { hour: "21시", traffic: 60 },
      { hour: "24시", traffic: 18 },
    ],
    footTrafficGender: [
      { name: "남성", value: 45 },
      { name: "여성", value: 55 },
    ],
    footTrafficAge: [
      { ageGroup: "20대", percentage: 48 },
      { ageGroup: "30대", percentage: 32 },
      { ageGroup: "40대", percentage: 11 },
      { ageGroup: "50대 이상", percentage: 9 },
    ],
    topSectors: [
      { sector: "베이커리 카페", density: "Medium", survivalRate: 53.6 },
      { sector: "캐주얼 다이닝", density: "Medium", survivalRate: 49.5 },
      { sector: "패션 셀렉숍", density: "High", survivalRate: 47.1 },
      { sector: "가구/오브제 공방", density: "Low", survivalRate: 59.8 },
    ],
    recommendedFranchises: [
      {
        name: "아우어베이커리",
        sector: "베이커리 카페",
        minCapital: 19000,
        rating: 4.9,
      },
      {
        name: "올리브영",
        sector: "화장품/잡화",
        minCapital: 20000,
        rating: 4.7,
      },
      {
        name: "연돈볼카츠",
        sector: "수제카츠/포장",
        minCapital: 7200,
        rating: 4.1,
      },
    ],
  },
  {
    id: "jongno",
    nameKo: "종로3가 상권",
    nameEn: "Jongno 3-ga",
    desc: "기존 장년층 중심의 유동인구에서 최근 '익선동', '서순라길' 등으로 젊은 세대의 유입이 급격하게 늘어난 신구 조화형 상권입니다. 전통 상권의 안정감과 트렌드가 공존합니다.",
    avgSales: 3400, // 3,400만원
    yoySalesChange: 4.1,
    densityScore: 80,
    survivalRate3Year: 58.0,
    footTrafficHourly: [
      { hour: "08시", traffic: 25 },
      { hour: "12시", traffic: 80 },
      { hour: "15시", traffic: 60 },
      { hour: "18시", traffic: 85 },
      { hour: "21시", traffic: 75 },
      { hour: "24시", traffic: 22 },
    ],
    footTrafficGender: [
      { name: "남성", value: 55 },
      { name: "여성", value: 45 },
    ],
    footTrafficAge: [
      { ageGroup: "20대", percentage: 22 },
      { ageGroup: "30대", percentage: 28 },
      { ageGroup: "40대", percentage: 20 },
      { ageGroup: "50대 이상", percentage: 30 },
    ],
    topSectors: [
      { sector: "전통 요리/한식", density: "High", survivalRate: 61.2 },
      { sector: "막걸리/요리주점", density: "Medium", survivalRate: 56.4 },
      { sector: "레트로 카페", density: "Medium", survivalRate: 50.1 },
      { sector: "보석/귀금속", density: "High", survivalRate: 65.5 },
    ],
    recommendedFranchises: [
      {
        name: "한신포차",
        sector: "주점/실내포차",
        minCapital: 11000,
        rating: 4.2,
      },
      {
        name: "이디야커피",
        sector: "커피 전문점",
        minCapital: 11000,
        rating: 4.4,
      },
      { name: "설빙", sector: "디저트 전문점", minCapital: 13500, rating: 4.5 },
    ],
  },
  {
    id: "itaewon",
    nameKo: "이태원/경리단 상권",
    nameEn: "Itaewon/Gyeongridan",
    desc: "외국 문화가 융합된 이국적인 먹거리와 개성 강한 펍이 발달했습니다. 금요일/주말 야간 영업 매출 비중이 매우 크며, 글로벌 테마나 F&B 바이어들의 밀집도가 높습니다.",
    avgSales: 2750, // 2,750만원
    yoySalesChange: -1.5,
    densityScore: 72,
    survivalRate3Year: 36.8,
    footTrafficHourly: [
      { hour: "08시", traffic: 8 },
      { hour: "12시", traffic: 32 },
      { hour: "15시", traffic: 50 },
      { hour: "18시", traffic: 70 },
      { hour: "21시", traffic: 92 },
      { hour: "24시", traffic: 75 },
    ],
    footTrafficGender: [
      { name: "남성", value: 46 },
      { name: "여성", value: 54 },
    ],
    footTrafficAge: [
      { ageGroup: "20대", percentage: 38 },
      { ageGroup: "30대", percentage: 42 },
      { ageGroup: "40대", percentage: 12 },
      { ageGroup: "50대 이상", percentage: 8 },
    ],
    topSectors: [
      { sector: "수제버거/펍", density: "High", survivalRate: 39.0 },
      { sector: "외국 아시안 식당", density: "High", survivalRate: 41.5 },
      { sector: "라운지 바", density: "High", survivalRate: 31.2 },
      { sector: "가구/빈티지소품", density: "Low", survivalRate: 52.0 },
    ],
    recommendedFranchises: [
      { name: "프랭크버거", sector: "수제버거", minCapital: 8900, rating: 4.4 },
      { name: "생활맥주", sector: "맥주 펍", minCapital: 7800, rating: 4.6 },
      {
        name: "투썸플레이스",
        sector: "커피 전문점",
        minCapital: 25000,
        rating: 4.1,
      },
    ],
  },
]

// 2. Curation Articles
export const curationArticles: CurationArticle[] = [
  {
    id: "art-1",
    title:
      "2026 서울시 신규 자영업 트렌드: 소규모 배달 전문 vs 초대형 쇼룸 카페",
    summary:
      "금리 하락기에 맞물린 서울 주요 상권의 상반된 트렌드를 조명합니다. 소자본 1인 창업과 하이엔드 오프라인 매장의 생존 전략을 데이터로 분석했습니다.",
    category: "Trend",
    readTime: "5분 분량",
    date: "2026-06-10",
  },
  {
    id: "art-2",
    title:
      "상가 임대차 보호법 개정안 핵심 가이드: 환산보증금과 권리금 보장 범위",
    summary:
      "초보 창업가가 계약서 날인 전에 반드시 알아야 할 법률적 체크포인트와 임대료 연 상승 한도(5%) 계산법을 예시와 함께 알기 쉽게 설명합니다.",
    category: "Guide",
    readTime: "7분 분량",
    date: "2026-06-05",
  },
  {
    id: "art-3",
    title:
      "성수동 팝업스토어 성황, 배후 상권 식음료 매출에 미치는 경제 효과는?",
    summary:
      "성수동 테마팝업 오픈 시 반경 300m 이내 일반 요식업 매장의 카드 긁힘 횟수와 주말 매출 상승 추이를 빅데이터 분석을 통해 수치화했습니다.",
    category: "Policy",
    readTime: "4분 분량",
    date: "2026-05-28",
  },
  {
    id: "art-4",
    title: "동네 상권에서 1등 하기: 인근 오피스 거주민 타겟 로컬 브랜딩 방법론",
    summary:
      "대형 상권이 아닌 주거밀착형 상권에서 재방문율 80% 이상을 확보한 반찬전문점, 골목 베이커리 대표님들이 공유하는 단골 확보 영업 노하우.",
    category: "Guide",
    readTime: "6분 분량",
    date: "2026-05-15",
  },
]

// 3. Onboarding Questionnaire
export const onboardingQuestions: OnboardingQuestion[] = [
  {
    id: 1,
    question: "창업을 위해 생각하고 계신 예산 범위주는 얼마인가요?",
    options: [
      {
        text: "5천만 원 미만 (초소자본)",
        persona: "DELIVERY",
        desc: "주로 배달 전문점, 무인 키오스크 매장, 테이크아웃 전용 매장이 적합합니다.",
      },
      {
        text: "5천만 원 ~ 1억 5천만 원 (일반)",
        persona: "BALANCED",
        desc: "개인 감성 카페, 캐주얼 식당, 소형 프랜차이즈 등이 가능한 범위입니다.",
      },
      {
        text: "1억 5천만 원 이상 (여유)",
        persona: "PREMIUM",
        desc: "중대형 매장, 핵심 상권 입점, F&B 프리미닝 및 시그니처 베이커리가 유효합니다.",
      },
    ],
  },
  {
    id: 2,
    question: "가장 선호하는 운영 및 라이프스타일 형태는 무엇인가요?",
    options: [
      {
        text: "온라인/배달 위주 (몸이 편한 1인 창업)",
        persona: "DELIVERY",
        desc: "오프라인 접객 스트레스가 없으며, 관리 포인트가 심플합니다.",
      },
      {
        text: "단골 손님과의 밀접한 소통 (감성 자아실현)",
        persona: "PREMIUM",
        desc: "나만의 고유 브랜딩과 인테리어를 강조하며 매니아층을 형성합니다.",
      },
      {
        text: "안정적인 대중성 확보 (프랜차이즈 매뉴얼)",
        persona: "BALANCED",
        desc: "유행을 크게 타지 않고 표준화된 시스템에 맞춰 안정적으로 매출을 냅니다.",
      },
    ],
  },
  {
    id: 3,
    question: "창업 후 영업 시 가장 만나기 싫은 (기피하고 싶은) 고객 유형은?",
    options: [
      {
        text: "리뷰 테러를 하는 악성 배달 블랙컨슈머",
        persona: "PREMIUM",
        desc: "배달 비중을 극히 낮추고, 대면 오프라인 중심의 고급 접객이 맞습니다.",
      },
      {
        text: "테이블에 몇 시간씩 앉아 자리를 차지하는 손님",
        persona: "DELIVERY",
        desc: "회전율이 높은 소형 테이크아웃이나 회전이 없는 배달이 알맞습니다.",
      },
      {
        text: "가격이 비싸다며 사소한 것에 불평하는 손님",
        persona: "BALANCED",
        desc: "대중적인 브랜드, 가격 저항선이 낮은 가성비 높은 메이저 프랜차이즈가 어울립니다.",
      },
    ],
  },
  {
    id: 4,
    question: "선호하시는 투자 위험 및 목표 수익 성향은?",
    options: [
      {
        text: "낮은 마진이라도 망하지 않고 평생 가는 안정성",
        persona: "BALANCED",
        desc: "전통 상권의 대중 요식업이나 필수 소비재 중심의 프랜차이즈가 좋습니다.",
      },
      {
        text: "트렌드에 편승하여 단기간 높은 매출을 올리는 고수익성",
        persona: "PREMIUM",
        desc: "성수, 홍대 등 핫플레이스 상권의 테마형 외식업이나 쇼룸형 매장이 적합합니다.",
      },
      {
        text: "고정비를 최소화하여 적게 벌어도 적게 쓰고 싶은 효율성",
        persona: "DELIVERY",
        desc: "임대료가 저렴한 이면도로 입지 또는 공유주방에서의 배달 형태가 딱 맞습니다.",
      },
    ],
  },
]

// 4. Onboarding results (Personas)
export const personaResults: Record<string, PersonaResult> = {
  DELIVERY: {
    id: "DELIVERY",
    title: "초가성비 1인 배달/테이크아웃 스페셜리스트",
    desc: "고정비(임대료, 인건비)를 극한으로 줄이고 마케팅 및 효율성으로 승부하는 실속파 창업가입니다. 화려한 외장보다는 포장 배달 최적화 입지와 대중적인 가성비 프랜차이즈가 어울립니다.",
    accentColor: "indigo",
    recommendedSectors: [
      "포장 배달전문 요식업",
      "무인 가맹점",
      "테이크아웃 주스/에이드",
    ],
    recommendedDistricts: ["mapo", "itaewon"],
    franchises: ["연돈볼카츠", "프랭크버거", "마라탕 브랜드"],
  },
  BALANCED: {
    id: "BALANCED",
    title: "안정 추구형 생활밀착 매뉴얼 창업가",
    desc: "시스템화된 가맹본부의 매뉴얼에 따라 표준화된 리스크 관리와 탄탄한 배후 유동인구를 중요시하는 정석형 창업가입니다. 오피스 상권의 탄탄한 프랜차이즈나 유행 없는 전통 아이템이 맞습니다.",
    accentColor: "blue",
    recommendedSectors: [
      "가성비 커피 전문점",
      "캐주얼 일식/돈까스",
      "대중 한식/국밥",
    ],
    recommendedDistricts: ["gangnam", "jongno"],
    franchises: ["메가커피", "백소정", "이디야커피"],
  },
  PREMIUM: {
    id: "PREMIUM",
    title: "힙앤프리미엄 독창적 F&B 브랜더",
    desc: "남다른 공간 가치와 시그니처 브랜딩을 소중히 여깁니다. 높은 고객 단가와 독자적 감성 마케팅으로 젊은 층의 '경험 소비'를 유도합니다. 트렌드가 가파르게 일어나는 힙 상권이 최적입니다.",
    accentColor: "violet",
    recommendedSectors: [
      "스페셜티 베이커리 카페",
      "프리미엄 다이닝/와인바",
      "셀프 스튜디오/쇼룸",
    ],
    recommendedDistricts: ["seongdong", "mapo"],
    franchises: ["아우어베이커리", "하루필름", "올리브영"],
  },
}
