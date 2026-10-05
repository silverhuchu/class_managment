import { store } from '../store.js';

export function renderGateway(container, { onSelectTeacher, onSelectStudent }) {
  const students = store.getStudents();
  const settings = store.getSettings();

  container.innerHTML = `
    <div class="gateway-hero">
      <div class="gateway-badge">🌱 초등학교 4학년 맞춤형 학급 자치 플랫폼</div>
      <h1 class="gateway-title">${settings.className} 학급 경제교실 & 성장 퀘스트 🚀</h1>
      <p class="gateway-desc">
        스스로 역할을 다하고 바른 행동으로 화폐를 벌어 레벨업하세요! 오늘은 어떤 멋진 성장을 이뤄볼까요?
      </p>
    </div>

    <div class="mode-cards-container">
      <!-- 교사 모드 카드 -->
      <div class="mode-card teacher-card" id="btn-select-teacher">
        <div class="mode-card-icon">👨‍🏫</div>
        <h2 class="mode-card-title">선생님 대시보드</h2>
        <p class="mode-card-desc">
          우리 반 25명 학생의 전체 현황을 한눈에 보고, 화폐 지급·차감, 1인 1역 및 상점을 종합 관리합니다.
        </p>
        <button class="btn btn-blue" style="width: 100%;">
          <span>교사 모드로 시작하기</span>
          <span>➔</span>
        </button>
      </div>

      <!-- 학생 모드 안내 카드 -->
      <div class="mode-card student-card" id="btn-scroll-student">
        <div class="mode-card-icon">🎒</div>
        <h2 class="mode-card-title">학생 모드 진입</h2>
        <p class="mode-card-desc">
          내 화폐 잔액과 레벨을 확인하고, 1인 1역 실천 체크와 학급 상점 쿠폰을 이용합니다.
        </p>
        <button class="btn btn-primary" style="width: 100%;">
          <span>내 이름 선택하러 가기</span>
          <span>⬇️</span>
        </button>
      </div>
    </div>

    <!-- 학생 명단 선택 섹션 -->
    <div class="student-picker-section" id="student-picker-section">
      <div class="picker-header">
        <h3>
          <span>🎒</span>
          <span>학생 프로필 선택 (25명)</span>
          <span class="badge badge-green">4학년 1반</span>
        </h3>
        <div class="search-box-wrap">
          <span class="search-box-icon">🔍</span>
          <input type="text" id="student-search-input" class="search-box-input" placeholder="이름 또는 번호 검색...">
        </div>
      </div>

      <div class="student-grid" id="gateway-student-grid">
        <!-- 학생 카드들이 동적으로 렌더링됩니다 -->
      </div>
    </div>
  `;

  // Render student cards
  const gridContainer = container.querySelector('#gateway-student-grid');
  const searchInput = container.querySelector('#student-search-input');

  function renderStudentCards(list) {
    if (list.length === 0) {
      gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--text-muted);">
          일치하는 학생이 없습니다.
        </div>
      `;
      return;
    }

    gridContainer.innerHTML = list.map(student => {
      const roleText = student.role ? `${student.role.icon} ${student.role.name}` : '역할 미배정';
      return `
        <div class="student-select-card" data-student-id="${student.id}">
          <div class="student-avatar" style="background-color: ${student.avatarBg};">
            ${student.avatarEmoji}
          </div>
          <div class="student-select-info">
            <div class="student-select-name">
              <span class="student-num">${student.id}번</span>
              <span>${student.name}</span>
            </div>
            <div class="student-select-meta">
              <span class="badge" style="background: ${student.levelInfo.color}15; color: ${student.levelInfo.color}; font-size: 0.72rem; padding: 2px 6px;">
                ${student.levelInfo.icon} Lv.${student.levelInfo.level}
              </span>
              <span>💰 ${student.currency} ${settings.currencyName}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach click events
    gridContainer.querySelectorAll('.student-select-card').forEach(card => {
      card.addEventListener('click', () => {
        const studentId = Number(card.getAttribute('data-student-id'));
        onSelectStudent(studentId);
      });
    });
  }

  renderStudentCards(students);

  // Search filter
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    const filtered = students.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.id.toString() === query
    );
    renderStudentCards(filtered);
  });

  // Mode button events
  container.querySelector('#btn-select-teacher').addEventListener('click', onSelectTeacher);
  container.querySelector('#btn-scroll-student').addEventListener('click', () => {
    container.querySelector('#student-picker-section').scrollIntoView({ behavior: 'smooth' });
    searchInput.focus();
  });
}
