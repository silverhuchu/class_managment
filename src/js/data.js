/**
 * 초기 시드 데이터 (초등학교 4학년 1반 기준)
 */

export const LEVEL_TIERS = [
  { level: 1, name: '새싹 탐험가', minExp: 0, maxExp: 100, icon: '🌱', color: '#10B981' },
  { level: 2, name: '씩씩한 모험가', minExp: 100, maxExp: 300, icon: '🛡️', color: '#3B82F6' },
  { level: 3, name: '지혜로운 장인', minExp: 300, maxExp: 600, icon: '🔮', color: '#8B5CF6' },
  { level: 4, name: '든든한 수호자', minExp: 600, maxExp: 1000, icon: '👑', color: '#F59E0B' },
  { level: 5, name: '반짝이는 마스터', minExp: 1000, maxExp: 2000, icon: '🌟', color: '#EC4899' },
  { level: 6, name: '전설의 영웅', minExp: 2000, maxExp: 99999, icon: '🌈', color: '#EF4444' }
];

export const DEFAULT_ROLES = [
  { id: 'role-1', name: '칠판 지우미', icon: '🧹', description: '매 쉬는 시간 칠판을 깨끗이 닦고 분필 가루를 텁니다.' },
  { id: 'role-2', name: '환기 도우미', icon: '🪟', description: '아침과 점심시간 창문을 열어 교실 공기를 맑게 합니다.' },
  { id: 'role-3', name: '줄반장', icon: '🚶', description: '이동 수업이나 급식실로 갈 때 바르게 줄을 서도록 돕습니다.' },
  { id: 'role-4', name: '우유·간식 도우미', icon: '🥛', description: '우유 상자를 배분하고 뒷정리를 챙깁니다.' },
  { id: 'role-5', name: '도서 도우미', icon: '📚', description: '학급 문고 책꽂이를 깔끔하게 정리정돈합니다.' },
  { id: 'role-6', name: '에너지 지킴이', icon: '💡', description: '교실을 비울 때 전등과 전자칠판 전원을 끕니다.' },
  { id: 'role-7', name: '분리수거 도우미', icon: '♻️', description: '재활용 쓰레기통이 넘치지 않도록 바르게 분리합니다.' },
  { id: 'role-8', name: '학습 도우미', icon: '✏️', description: '수업 준비물과 학습지를 친구들에게 나누어 줍니다.' }
];

export const DEFAULT_SHOP_ITEMS = [
  {
    id: 'item-1',
    name: '원하는 자리 1일 선택권',
    type: 'coupon',
    price: 300,
    stock: 5,
    icon: '🪑',
    description: '하루 동안 내가 원하는 자리에 앉아서 공부할 수 있는 황금 쿠폰!'
  },
  {
    id: 'item-2',
    name: '숙제 1회 면제권',
    type: 'coupon',
    price: 450,
    stock: 3,
    icon: '📝',
    description: '일일 과제 1회를 기분 좋게 면제받을 수 있는 슈퍼 패스!'
  },
  {
    id: 'item-3',
    name: '아침 음악 신청권',
    type: 'coupon',
    price: 150,
    stock: 10,
    icon: '🎵',
    description: '아침 독서 시간이나 준비 시간에 듣고 싶은 노래를 1곡 신청해요.'
  },
  {
    id: 'item-4',
    name: '점심 1등 줄서기권',
    type: 'coupon',
    price: 200,
    stock: 4,
    icon: '🍱',
    description: '급식실로 향할 때 맨 앞에서 먼저 출발할 수 있는 급식 프리패스!'
  },
  {
    id: 'item-5',
    name: '선생님과 1:1 보드게임권',
    type: 'coupon',
    price: 500,
    stock: 2,
    icon: '🎲',
    description: '점심시간에 선생님과 함께 즐거운 미니 보드게임 한판!'
  },
  {
    id: 'item-6',
    name: '반짝이 캐릭터 볼펜',
    type: 'goods',
    price: 250,
    stock: 8,
    icon: '🖊️',
    description: '글씨를 쓸 때마다 기분 좋은 학급 전용 캐릭터 볼펜!'
  },
  {
    id: 'item-7',
    name: '귀여운 말랑이 지우개',
    type: 'goods',
    price: 120,
    stock: 12,
    icon: '🧸',
    description: '귀여운 동물 모양의 말랑말랑한 고급 지우개'
  },
  {
    id: 'item-8',
    name: '황금빛 칭찬 뱃지',
    type: 'goods',
    price: 350,
    stock: 6,
    icon: '🏅',
    description: '가방이나 옷에 달고 다닐 수 있는 특별 명예 뱃지'
  }
];

export const DEFAULT_MISSIONS = [
  {
    id: 'mission-1',
    title: '수학 익힘책 42~43쪽 풀고 제출하기',
    rewardCurrency: 20,
    rewardExp: 20,
    category: '학습',
    icon: '📐',
    date: '2026-10-05',
    completedStudents: [1, 3, 5, 7, 12, 18]
  },
  {
    id: 'mission-2',
    title: '친구에게 고마운 점 한마디 건네기',
    rewardCurrency: 15,
    rewardExp: 15,
    category: '인성',
    icon: '🤝',
    date: '2026-10-05',
    completedStudents: [2, 4, 7, 9, 14, 21, 23]
  },
  {
    id: 'mission-3',
    title: '자기 자리 주변 쓰레기 3개 줍기',
    rewardCurrency: 10,
    rewardExp: 10,
    category: '생활',
    icon: '✨',
    date: '2026-10-05',
    completedStudents: [1, 2, 6, 7, 8, 10, 15, 20]
  }
];

// 학생 25명 명단 및 초기 상태 (현실감 있는 4학년 학생 이름과 성향)
export const DEFAULT_STUDENTS = [
  { id: 1, name: '김민준', gender: 'm', currency: 280, exp: 280, roleId: 'role-1', roleDoneToday: true, avatarBg: '#DBEAFE', avatarEmoji: '🦁' },
  { id: 2, name: '이서연', gender: 'f', currency: 450, exp: 450, roleId: 'role-2', roleDoneToday: true, avatarBg: '#FCE7F3', avatarEmoji: '🐰' },
  { id: 3, name: '박도윤', gender: 'm', currency: 190, exp: 190, roleId: 'role-3', roleDoneToday: false, avatarBg: '#E0E7FF', avatarEmoji: '🐯' },
  { id: 4, name: '정예은', gender: 'f', currency: 520, exp: 520, roleId: 'role-4', roleDoneToday: true, avatarBg: '#FEF3C7', avatarEmoji: '🐱' },
  { id: 5, name: '최준서', gender: 'm', currency: 310, exp: 310, roleId: 'role-5', roleDoneToday: false, avatarBg: '#D1FAE5', avatarEmoji: '🦊' },
  { id: 6, name: '강하은', gender: 'f', currency: 380, exp: 380, roleId: 'role-6', roleDoneToday: true, avatarBg: '#FEE2E2', avatarEmoji: '🐼' },
  { id: 7, name: '조시우', gender: 'm', currency: 420, exp: 420, roleId: 'role-1', roleDoneToday: true, avatarBg: '#EDE9FE', avatarEmoji: '🐨' },
  { id: 8, name: '윤지우', gender: 'f', currency: 240, exp: 240, roleId: 'role-7', roleDoneToday: false, avatarBg: '#CFFAFE', avatarEmoji: '🐧' },
  { id: 9, name: '장서준', gender: 'm', currency: 610, exp: 610, roleId: 'role-8', roleDoneToday: true, avatarBg: '#E0F2FE', avatarEmoji: '🐻' },
  { id: 10, name: '임수아', gender: 'f', currency: 340, exp: 340, roleId: 'role-2', roleDoneToday: true, avatarBg: '#FDF4FF', avatarEmoji: '🐹' },
  { id: 11, name: '한도현', gender: 'm', currency: 150, exp: 150, roleId: 'role-3', roleDoneToday: false, avatarBg: '#FFEDD5', avatarEmoji: '🐶' },
  { id: 12, name: '오지민', gender: 'f', currency: 480, exp: 480, roleId: 'role-4', roleDoneToday: true, avatarBg: '#F3E8FF', avatarEmoji: '🦄' },
  { id: 13, name: '신유찬', gender: 'm', currency: 290, exp: 290, roleId: 'role-5', roleDoneToday: false, avatarBg: '#ECFCCB', avatarEmoji: '🐸' },
  { id: 14, name: '서채원', gender: 'f', currency: 560, exp: 560, roleId: 'role-6', roleDoneToday: true, avatarBg: '#FFE4E6', avatarEmoji: '🦋' },
  { id: 15, name: '권건우', gender: 'm', currency: 210, exp: 210, roleId: 'role-7', roleDoneToday: false, avatarBg: '#E0E7FF', avatarEmoji: '🐵' },
  { id: 16, name: '황하린', gender: 'f', currency: 430, exp: 430, roleId: 'role-8', roleDoneToday: true, avatarBg: '#FEF9C3', avatarEmoji: '🐥' },
  { id: 17, name: '송민재', gender: 'm', currency: 330, exp: 330, roleId: 'role-1', roleDoneToday: false, avatarBg: '#DCFCE7', avatarEmoji: '🐺' },
  { id: 18, name: '류소율', gender: 'f', currency: 620, exp: 620, roleId: 'role-2', roleDoneToday: true, avatarBg: '#FCE7F3', avatarEmoji: '🦔' },
  { id: 19, name: '홍우진', gender: 'm', currency: 180, exp: 180, roleId: 'role-3', roleDoneToday: false, avatarBg: '#E0F2FE', avatarEmoji: '🐳' },
  { id: 20, name: '배지안', gender: 'f', currency: 390, exp: 390, roleId: 'role-4', roleDoneToday: true, avatarBg: '#FDF2F8', avatarEmoji: '🐿️' },
  { id: 21, name: '고은우', gender: 'm', currency: 460, exp: 460, roleId: 'role-5', roleDoneToday: true, avatarBg: '#FEF3C7', avatarEmoji: '🦥' },
  { id: 22, name: '문다은', gender: 'f', currency: 270, exp: 270, roleId: 'role-6', roleDoneToday: false, avatarBg: '#F3E8FF', avatarEmoji: '🦩' },
  { id: 23, name: '양태양', gender: 'm', currency: 510, exp: 510, roleId: 'role-7', roleDoneToday: true, avatarBg: '#FFEDD5', avatarEmoji: '🦭' },
  { id: 24, name: '손시은', gender: 'f', currency: 350, exp: 350, roleId: 'role-8', roleDoneToday: true, avatarBg: '#E0E7FF', avatarEmoji: '🦚' },
  { id: 25, name: '최준호', gender: 'm', currency: 220, exp: 220, roleId: 'role-1', roleDoneToday: false, avatarBg: '#D1FAE5', avatarEmoji: '🐬' }
];

// 학생 인벤토리 초기 보유 내역 샘플 (일부 학생이 이미 구매해둔 쿠폰)
export const DEFAULT_INVENTORIES = [
  {
    id: 'inv-1',
    studentId: 7, // 조시우
    itemId: 'item-3',
    itemName: '아침 음악 신청권',
    itemIcon: '🎵',
    purchasedAt: '2026-10-04 09:15',
    isUsed: false,
    usedAt: null
  },
  {
    id: 'inv-2',
    studentId: 2, // 이서연
    itemId: 'item-1',
    itemName: '원하는 자리 1일 선택권',
    itemIcon: '🪑',
    purchasedAt: '2026-10-03 14:20',
    isUsed: false,
    usedAt: null
  },
  {
    id: 'inv-3',
    studentId: 4, // 정예은
    itemId: 'item-4',
    itemName: '점심 1등 줄서기권',
    itemIcon: '🍱',
    purchasedAt: '2026-10-02 11:30',
    isUsed: true,
    usedAt: '2026-10-03 12:10'
  }
];

// 최근 거래 및 활동 로그
export const DEFAULT_LOGS = [
  {
    id: 'log-1',
    timestamp: '2026-10-05 10:30',
    type: 'grant',
    targetStudentId: 7,
    targetStudentName: '조시우',
    amount: 50,
    reason: '칠판 깨끗이 닦음 (1인 1역 실천)',
    operator: '교사'
  },
  {
    id: 'log-2',
    timestamp: '2026-10-05 11:10',
    type: 'purchase',
    targetStudentId: 7,
    targetStudentName: '조시우',
    amount: -150,
    reason: '아침 음악 신청권 구매',
    operator: '학생'
  },
  {
    id: 'log-3',
    timestamp: '2026-10-05 13:40',
    type: 'grant',
    targetStudentId: 2,
    targetStudentName: '이서연',
    amount: 20,
    reason: '수학 문제 적극적 발표',
    operator: '교사'
  },
  {
    id: 'log-4',
    timestamp: '2026-10-05 14:00',
    type: 'bulk_grant',
    targetStudentId: null,
    targetStudentName: '학급 전체(25명)',
    amount: 30,
    reason: '도서관 이용 규칙 우수 준수 칭찬',
    operator: '교사'
  }
];
