import { store } from '../store.js';
import { sound } from '../sound.js';
import { triggerConfetti } from '../confetti.js';

export function renderTeacherView(container, { onSwitchMode, showToast, showModal }) {
  let activeTab = 'students'; // 'students' | 'roles' | 'missions' | 'shop' | 'logs' | 'settings'
  let searchQuery = '';
  let roleFilter = 'all';
  let sortBy = 'id'; // 'id' | 'currency' | 'exp'
  let selectedStudentIds = new Set();

  function update() {
    const students = store.getStudents();
    const roles = store.getRoles();
    const missions = store.getMissions();
    const shopItems = store.getShopItems();
    const logs = store.getLogs();
    const settings = store.getSettings();

    // Summary calculations
    const totalCurrency = students.reduce((sum, s) => sum + s.currency, 0);
    const avgLevel = (students.reduce((sum, s) => sum + s.levelInfo.level, 0) / students.length).toFixed(1);
    const rolesDoneCount = students.filter(s => s.roleDoneToday).length;

    container.innerHTML = `
      <!-- 교사 헤더 바 -->
      <div class="app-header">
        <div class="brand-logo" id="btn-header-home">
          <div class="brand-icon">👨‍🏫</div>
          <div>
            <div class="brand-title">선생님 통합 대시보드</div>
            <div class="brand-subtitle">${settings.className} 학급 운영 관리 시스템</div>
          </div>
        </div>

        <div class="header-actions">
          <button class="btn btn-secondary btn-sm" id="btn-switch-mode">
            <span>🔄 모드 변경 / 학생 선택</span>
          </button>
        </div>
      </div>

      <!-- 상단 요약 통계 지표 -->
      <div class="teacher-stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background: #fef3c7; color: #b45309;">💰</div>
          <div>
            <div class="stat-label">학급 총 유통 화폐</div>
            <div class="stat-value">${totalCurrency.toLocaleString()} <span style="font-size: 1rem; font-weight: 600;">${settings.currencyName}</span></div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: #ede9fe; color: #7c3aed;">⭐</div>
          <div>
            <div class="stat-label">학급 평균 레벨</div>
            <div class="stat-value">Lv. ${avgLevel} <span style="font-size: 1rem; font-weight: 600;">(총 25명)</span></div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: #dcfce7; color: #15803d;">✅</div>
          <div>
            <div class="stat-label">오늘 1인 1역 실천율</div>
            <div class="stat-value">${rolesDoneCount} / 25명 <span style="font-size: 1rem; font-weight: 600;">(${Math.round(rolesDoneCount / 25 * 100)}%)</span></div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: #e0f2fe; color: #0369a1;">🛒</div>
          <div>
            <div class="stat-label">등록된 상점 품목</div>
            <div class="stat-value">${shopItems.length}종 <span style="font-size: 1rem; font-weight: 600;">(쿠폰 ${shopItems.filter(i => i.type === 'coupon').length})</span></div>
          </div>
        </div>
      </div>

      <!-- 교사 관리 탭 네비게이션 -->
      <div class="tabs-nav">
        <button class="tab-btn ${activeTab === 'students' ? 'active' : ''}" data-tab="students">
          👥 학생 전체 현황 & 화폐 지급 (25명)
        </button>
        <button class="tab-btn ${activeTab === 'roles' ? 'active' : ''}" data-tab="roles">
          🏷️ 1인 1역 역할 배정
        </button>
        <button class="tab-btn ${activeTab === 'missions' ? 'active' : ''}" data-tab="missions">
          📋 오늘의 미션 관리 (${missions.length}개)
        </button>
        <button class="tab-btn ${activeTab === 'shop' ? 'active' : ''}" data-tab="shop">
          🛒 상점 상품 관리 (${shopItems.length}종)
        </button>
        <button class="tab-btn ${activeTab === 'logs' ? 'active' : ''}" data-tab="logs">
          📜 학급 활동 로그
        </button>
        <button class="tab-btn ${activeTab === 'settings' ? 'active' : ''}" data-tab="settings">
          ⚙️ 데이터 백업·설정
        </button>
      </div>

      <!-- 탭 컨텐츠 영역 -->
      <div id="teacher-tab-content"></div>
    `;

    const tabContainer = container.querySelector('#teacher-tab-content');

    // Tab Render Router
    if (activeTab === 'students') {
      renderStudentsTab(tabContainer, students, roles, settings);
    } else if (activeTab === 'roles') {
      renderRolesTab(tabContainer, students, roles, settings);
    } else if (activeTab === 'missions') {
      renderMissionsTab(tabContainer, missions, students, settings);
    } else if (activeTab === 'shop') {
      renderShopTab(tabContainer, shopItems, settings);
    } else if (activeTab === 'logs') {
      renderLogsTab(tabContainer, logs, settings);
    } else if (activeTab === 'settings') {
      renderSettingsTab(tabContainer, settings);
    }

    // Attach Top Events
    container.querySelector('#btn-switch-mode').addEventListener('click', onSwitchMode);
    container.querySelector('#btn-header-home').addEventListener('click', onSwitchMode);

    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.getAttribute('data-tab');
        update();
      });
    });
  }

  // ============================================================
  // TAB 1: 학생 전체 현황 및 빠른 화폐 지급 (PRD 최우선 화면)
  // ============================================================
  function renderStudentsTab(tabContainer, students, roles, settings) {
    // Filter and Sort
    let filtered = students.filter(s => {
      const matchQuery = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.toString() === searchQuery;
      const matchRole = roleFilter === 'all' || s.roleId === roleFilter;
      return matchQuery && matchRole;
    });

    if (sortBy === 'currency') {
      filtered.sort((a, b) => b.currency - a.currency);
    } else if (sortBy === 'exp') {
      filtered.sort((a, b) => b.exp - a.exp);
    } else {
      filtered.sort((a, b) => a.id - b.id);
    }

    const allFilteredSelected = filtered.length > 0 && filtered.every(s => selectedStudentIds.has(s.id));

    tabContainer.innerHTML = `
      <!-- 액션 컨트롤 바 -->
      <div class="teacher-action-bar">
        <div class="action-bar-left">
          <label style="display: flex; align-items: center; gap: 8px; font-weight: 700; cursor: pointer; font-size: 0.92rem;">
            <input type="checkbox" id="chk-select-all" class="student-select-check" ${allFilteredSelected ? 'checked' : ''}>
            <span>전체 선택 (${selectedStudentIds.size}/${students.length}명)</span>
          </label>

          <button class="btn btn-primary btn-sm" id="btn-bulk-grant" ${selectedStudentIds.size === 0 ? 'disabled' : ''}>
            <span>💰 선택한 ${selectedStudentIds.size}명 일괄 화폐 지급</span>
          </button>
        </div>

        <div class="action-bar-right">
          <div class="search-box-wrap">
            <span class="search-box-icon">🔍</span>
            <input type="text" id="teacher-search-input" class="search-box-input" placeholder="이름/번호 검색..." value="${searchQuery}">
          </div>

          <select id="teacher-role-filter" class="form-select" style="width: auto; padding: 7px 12px; font-size: 0.88rem;">
            <option value="all">전체 1인 1역</option>
            ${roles.map(r => `
              <option value="${r.id}" ${roleFilter === r.id ? 'selected' : ''}>${r.icon} ${r.name}</option>
            `).join('')}
          </select>

          <select id="teacher-sort-by" class="form-select" style="width: auto; padding: 7px 12px; font-size: 0.88rem;">
            <option value="id" ${sortBy === 'id' ? 'selected' : ''}>번호순</option>
            <option value="currency" ${sortBy === 'currency' ? 'selected' : ''}>화폐 많은순</option>
            <option value="exp" ${sortBy === 'exp' ? 'selected' : ''}>경험치(레벨) 높은순</option>
          </select>
        </div>
      </div>

      <!-- 25명 학생 카드 그리드 -->
      <div class="teacher-student-grid">
        ${filtered.map(student => {
          const isSelected = selectedStudentIds.has(student.id);
          const lvl = student.levelInfo;
          return `
            <div class="teacher-student-card ${isSelected ? 'selected' : ''}" data-student-id="${student.id}">
              <div class="student-card-top">
                <input type="checkbox" class="student-select-check chk-student" data-id="${student.id}" ${isSelected ? 'checked' : ''}>
                <div class="student-avatar" style="background-color: ${student.avatarBg};">
                  ${student.avatarEmoji}
                </div>
                <div class="student-card-header-info">
                  <div class="student-card-name-row">
                    <span class="student-card-name">
                      <span class="student-num">${student.id}번</span>
                      <span>${student.name}</span>
                    </span>
                    <span class="student-card-currency">
                      💰 ${student.currency}
                    </span>
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 2px;">
                    <span class="badge" style="background: ${lvl.color}15; color: ${lvl.color}; font-size: 0.72rem; padding: 2px 6px;">
                      ${lvl.icon} Lv.${lvl.level} (${lvl.currentExp} EXP)
                    </span>
                  </div>
                </div>
              </div>

              <div class="student-card-role-row">
                <span style="color: var(--text-secondary);">
                  ${student.role ? `${student.role.icon} ${student.role.name}` : '역할 없음'}
                </span>
                <span class="badge ${student.roleDoneToday ? 'badge-green' : 'badge-gray'}" style="font-size: 0.72rem;">
                  ${student.roleDoneToday ? '✅ 실천 완료' : '⏳ 미완료'}
                </span>
              </div>

              <!-- 원클릭 빠른 화폐 버튼 (PRD 명시 기능) -->
              <div class="quick-grant-row">
                <button class="quick-btn plus-10" data-grant="${student.id}" data-amount="10" title="칭찬 +10">+10</button>
                <button class="quick-btn plus-20" data-grant="${student.id}" data-amount="20" title="발표 우수 +20">+20</button>
                <button class="quick-btn plus-50" data-grant="${student.id}" data-amount="50" title="모범 행동 +50">+50</button>
                <button class="quick-btn minus-10" data-deduct="${student.id}" data-amount="10" title="규칙 위반 -10">-10</button>
                <button class="quick-btn detail-btn" data-detail="${student.id}" title="직접 금액/사유 입력">상세</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Search and Filters
    tabContainer.querySelector('#teacher-search-input').addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderStudentsTab(tabContainer, students, roles, settings);
    });

    tabContainer.querySelector('#teacher-role-filter').addEventListener('change', (e) => {
      roleFilter = e.target.value;
      renderStudentsTab(tabContainer, students, roles, settings);
    });

    tabContainer.querySelector('#teacher-sort-by').addEventListener('change', (e) => {
      sortBy = e.target.value;
      renderStudentsTab(tabContainer, students, roles, settings);
    });

    // Checkbox selections
    tabContainer.querySelector('#chk-select-all').addEventListener('change', (e) => {
      if (e.target.checked) {
        filtered.forEach(s => selectedStudentIds.add(s.id));
      } else {
        filtered.forEach(s => selectedStudentIds.delete(s.id));
      }
      renderStudentsTab(tabContainer, students, roles, settings);
    });

    tabContainer.querySelectorAll('.chk-student').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const id = Number(e.target.getAttribute('data-id'));
        if (e.target.checked) {
          selectedStudentIds.add(id);
        } else {
          selectedStudentIds.delete(id);
        }
        renderStudentsTab(tabContainer, students, roles, settings);
      });
    });

    // Quick Grant (+10, +20, +50) Handlers
    tabContainer.querySelectorAll('[data-grant]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sId = Number(btn.getAttribute('data-grant'));
        const amount = Number(btn.getAttribute('data-amount'));
        const student = students.find(s => s.id === sId);
        if (!student) return;

        const reason = amount === 10 ? '수업 태도 칭찬' : amount === 20 ? '수업 발표 우수' : '학급 모범 행동';
        const res = store.grantCurrency(sId, amount, reason);
        if (res.success) {
          sound.playCoin();
          if (res.leveledUp) {
            sound.playLevelUp();
            triggerConfetti();
            showToast(`🎉 ${student.name} 학생이 Lv.${res.newLevel.level} [${res.newLevel.name}]으로 레벨업했습니다!`, 'levelup');
          } else {
            showToast(`👏 ${student.name}에게 +${amount} ${settings.currencyName} 지급 완료!`, 'success');
          }
          update();
        }
      });
    });

    // Quick Deduct (-10) Handler
    tabContainer.querySelectorAll('[data-deduct]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sId = Number(btn.getAttribute('data-deduct'));
        const amount = Number(btn.getAttribute('data-amount'));
        const student = students.find(s => s.id === sId);
        if (!student) return;

        const res = store.deductCurrency(sId, amount, '학급 규칙 위반');
        if (res.success) {
          showToast(`⚠️ ${student.name} 화폐 -${amount} ${settings.currencyName} 차감 처리`, 'info');
          update();
        } else {
          showToast(res.message, 'error');
        }
      });
    });

    // Detail/Custom Modal Handler
    tabContainer.querySelectorAll('[data-detail]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sId = Number(btn.getAttribute('data-detail'));
        const student = students.find(s => s.id === sId);
        if (!student) return;

        showModal({
          title: `💰 ${student.id}번 ${student.name} 화폐 관리`,
          content: `
            <div class="form-group">
              <label class="form-label">현재 잔액</label>
              <div style="font-size: 1.2rem; font-weight: 800; color: #b45309; margin-bottom: 12px;">
                💰 ${student.currency} ${settings.currencyName} (누적 ${student.exp} EXP / Lv.${student.levelInfo.level})
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">구분</label>
              <div style="display: flex; gap: 12px;">
                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                  <input type="radio" name="modal-action-type" value="grant" checked> <strong>화폐 및 경험치 지급 (+)</strong>
                </label>
                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                  <input type="radio" name="modal-action-type" value="deduct"> <strong>화폐만 차감 (-)</strong>
                </label>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">금액 (${settings.currencyName})</label>
              <input type="number" id="modal-custom-amount" class="form-input" value="30" min="1" step="5">
            </div>
            <div class="form-group">
              <label class="form-label">지급/차감 사유</label>
              <input type="text" id="modal-custom-reason" class="form-input" placeholder="예: 국어 시간 발표 적극 참여, 친절한 행동 등" value="칭찬 및 격려">
            </div>
          `,
          confirmText: '적용하기',
          confirmClass: 'btn-primary',
          onConfirm: () => {
            const isGrant = document.querySelector('input[name="modal-action-type"]:checked').value === 'grant';
            const amount = Number(document.getElementById('modal-custom-amount').value);
            const reason = document.getElementById('modal-custom-reason').value.trim() || '선생님 칭찬';

            if (!amount || amount <= 0) {
              showToast('유효한 금액을 입력해 주세요.', 'error');
              return;
            }

            if (isGrant) {
              const res = store.grantCurrency(student.id, amount, reason);
              if (res.success) {
                sound.playCoin();
                if (res.leveledUp) {
                  sound.playLevelUp();
                  triggerConfetti();
                  showToast(`🎉 ${student.name} 레벨업! Lv.${res.newLevel.level} 달성!`, 'levelup');
                } else {
                  showToast(`${student.name}에게 +${amount} ${settings.currencyName} 지급 완료!`, 'success');
                }
                update();
              }
            } else {
              const res = store.deductCurrency(student.id, amount, reason);
              if (res.success) {
                showToast(`${student.name}의 화폐가 -${amount} ${settings.currencyName} 차감되었습니다.`, 'info');
                update();
              } else {
                showToast(res.message, 'error');
              }
            }
          }
        });
      });
    });

    // Bulk Grant Handler
    const bulkBtn = tabContainer.querySelector('#btn-bulk-grant');
    if (bulkBtn) {
      bulkBtn.addEventListener('click', () => {
        if (selectedStudentIds.size === 0) return;

        showModal({
          title: `🎁 선택한 ${selectedStudentIds.size}명 일괄 화폐 지급`,
          content: `
            <p style="font-size: 0.92rem; color: var(--text-secondary); margin-bottom: 14px;">
              선택한 <strong>${selectedStudentIds.size}명</strong>의 학생 모두에게 화폐와 경험치를 동시에 지급합니다.
            </p>
            <div class="form-group">
              <label class="form-label">지급 금액 (1인당 ${settings.currencyName})</label>
              <input type="number" id="modal-bulk-amount" class="form-input" value="30" min="5" step="5">
            </div>
            <div class="form-group">
              <label class="form-label">지급 사유 프리셋</label>
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
                <button type="button" class="btn btn-secondary btn-sm preset-btn" data-reason="학급 전원 숙제 완수">과제 완수</button>
                <button type="button" class="btn btn-secondary btn-sm preset-btn" data-reason="이동 수업 질서 우수">줄서기 질서</button>
                <button type="button" class="btn btn-secondary btn-sm preset-btn" data-reason="교실 청소 깔끔하게 정돈">청소 우수</button>
                <button type="button" class="btn btn-secondary btn-sm preset-btn" data-reason="체육 시간 협동 우수">체육 협동</button>
              </div>
              <input type="text" id="modal-bulk-reason" class="form-input" value="학급 전원 숙제 완수">
            </div>
          `,
          confirmText: '일괄 지급하기',
          confirmClass: 'btn-primary',
          onConfirm: () => {
            const amount = Number(document.getElementById('modal-bulk-amount').value);
            const reason = document.getElementById('modal-bulk-reason').value.trim() || '학급 단체 보상';

            if (!amount || amount <= 0) {
              showToast('금액을 올바르게 입력해 주세요.', 'error');
              return;
            }

            store.bulkGrantCurrency(Array.from(selectedStudentIds), amount, reason);
            sound.playLevelUp();
            triggerConfetti();
            showToast(`👏 ${selectedStudentIds.size}명에게 각 +${amount} ${settings.currencyName} 일괄 지급 완료!`, 'success');
            selectedStudentIds.clear();
            update();
          }
        });

        // Modal preset clicks
        setTimeout(() => {
          document.querySelectorAll('.preset-btn').forEach(pb => {
            pb.addEventListener('click', () => {
              const reasonInput = document.getElementById('modal-bulk-reason');
              if (reasonInput) reasonInput.value = pb.getAttribute('data-reason');
            });
          });
        }, 50);
      });
    }
  }

  // ============================================================
  // TAB 2: 1인 1역 역할 배정 및 관리
  // ============================================================
  function renderRolesTab(tabContainer, students, roles, settings) {
    tabContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h3 style="font-size: 1.2rem; font-weight: 800;">🏷️ 1인 1역 학급 역할 배정</h3>
          <p style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 2px;">
            학생들의 역할을 배정하고 관리합니다. 학생은 자기 화면에서 일일 역할을 체크할 수 있습니다.
          </p>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-add-role">
          <span>➕ 새 역할 등록</span>
        </button>
      </div>

      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 70px;">번호</th>
              <th style="width: 120px;">이름</th>
              <th style="width: 250px;">배정된 1인 1역</th>
              <th>역할 설명</th>
              <th style="width: 140px; text-align: center;">오늘 실천 여부</th>
            </tr>
          </thead>
          <tbody>
            ${students.map(student => `
              <tr>
                <td><strong>${student.id}번</strong></td>
                <td>
                  <span style="font-weight: 700; display: flex; align-items: center; gap: 6px;">
                    <span>${student.avatarEmoji}</span>
                    <span>${student.name}</span>
                  </span>
                </td>
                <td>
                  <select class="form-select role-select" data-student-id="${student.id}" style="padding: 6px 10px; font-size: 0.88rem;">
                    <option value="">(역할 미배정)</option>
                    ${roles.map(r => `
                      <option value="${r.id}" ${student.roleId === r.id ? 'selected' : ''}>
                        ${r.icon} ${r.name}
                      </option>
                    `).join('')}
                  </select>
                </td>
                <td style="color: var(--text-secondary); font-size: 0.85rem;">
                  ${student.role ? student.role.description : '-'}
                </td>
                <td style="text-align: center;">
                  <button class="btn btn-sm ${student.roleDoneToday ? 'btn-primary' : 'btn-secondary'} teacher-toggle-role-btn" data-student-id="${student.id}">
                    ${student.roleDoneToday ? '✅ 실천 완료' : '⏳ 미완료'}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Role assignment change handler
    tabContainer.querySelectorAll('.role-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const sId = Number(e.target.getAttribute('data-student-id'));
        const newRoleId = e.target.value;
        store.assignRole(sId, newRoleId);
        showToast('역할 배정이 업데이트되었습니다.', 'success');
        update();
      });
    });

    // Toggle role status
    tabContainer.querySelectorAll('.teacher-toggle-role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sId = Number(btn.getAttribute('data-student-id'));
        const res = store.toggleRoleDone(sId);
        if (res && res.bonusGranted) {
          showToast(`${res.student.name} 1인 1역 완료 처리 (+25 ${settings.currencyName} & EXP 지급)`, 'success');
        } else {
          showToast('실천 상태가 변경되었습니다.', 'info');
        }
        update();
      });
    });

    // Add new role modal
    tabContainer.querySelector('#btn-add-role').addEventListener('click', () => {
      showModal({
        title: '➕ 새 1인 1역 등록',
        content: `
          <div class="form-group">
            <label class="form-label">역할 명칭</label>
            <input type="text" id="modal-role-name" class="form-input" placeholder="예: 식물 지킴이, 알림장 도우미 등">
          </div>
          <div class="form-group">
            <label class="form-label">아이콘 (이모지)</label>
            <input type="text" id="modal-role-icon" class="form-input" value="🌿" style="width: 80px;">
          </div>
          <div class="form-group">
            <label class="form-label">역할 설명</label>
            <textarea id="modal-role-desc" class="form-textarea" rows="3" placeholder="학생이 매일 해야 할 구체적인 실천 내용을 적어주세요."></textarea>
          </div>
        `,
        confirmText: '등록하기',
        confirmClass: 'btn-primary',
        onConfirm: () => {
          const name = document.getElementById('modal-role-name').value.trim();
          const icon = document.getElementById('modal-role-icon').value.trim() || '⭐';
          const description = document.getElementById('modal-role-desc').value.trim();

          if (!name) {
            showToast('역할 명칭을 입력해 주세요.', 'error');
            return;
          }

          store.addRole({ name, icon, description });
          showToast(`새로운 역할 [${name}] 등록 완료!`, 'success');
          update();
        }
      });
    });
  }

  // ============================================================
  // TAB 3: 오늘의 미션 관리
  // ============================================================
  function renderMissionsTab(tabContainer, missions, students, settings) {
    tabContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h3 style="font-size: 1.2rem; font-weight: 800;">📋 오늘의 학급 미션 관리</h3>
          <p style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 2px;">
            학생들이 오늘 완수할 수 있는 퀘스트를 등록하고 보상을 지정합니다.
          </p>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-add-mission">
          <span>➕ 새 미션 등록</span>
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${missions.length === 0 ? `
          <div style="text-align: center; padding: 40px; background: #fff; border-radius: var(--radius-lg); border: 1px solid var(--border-light); color: var(--text-muted);">
            등록된 미션이 없습니다. 새 미션을 추가해 보세요!
          </div>
        ` : missions.map(mission => {
          const count = mission.completedStudents.length;
          const pct = Math.round((count / students.length) * 100);
          return `
            <div class="card" style="display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 16px;">
                <div style="font-size: 2.2rem; width: 52px; height: 52px; background: #fef3c7; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">
                  ${mission.icon}
                </div>
                <div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="badge badge-purple">${mission.category}</span>
                    <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-main);">${mission.title}</h4>
                  </div>
                  <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
                    보상: <strong>💰 +${mission.rewardCurrency} ${settings.currencyName}</strong> / <strong>⭐ +${mission.rewardExp} EXP</strong>
                  </div>
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 20px;">
                <div style="text-align: right;">
                  <div style="font-size: 0.95rem; font-weight: 800; color: var(--text-main);">${count} / ${students.length}명 완료 (${pct}%)</div>
                  <div style="width: 140px; height: 8px; background: #e2e8f0; border-radius: var(--radius-full); overflow: hidden; margin-top: 4px;">
                    <div style="height: 100%; width: ${pct}%; background: var(--primary-500);"></div>
                  </div>
                </div>
                <button class="btn btn-danger btn-sm" data-delete-mission="${mission.id}">
                  삭제
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Add mission
    tabContainer.querySelector('#btn-add-mission').addEventListener('click', () => {
      showModal({
        title: '➕ 새 미션 등록',
        content: `
          <div class="form-group">
            <label class="form-label">미션 제목</label>
            <input type="text" id="modal-mission-title" class="form-input" placeholder="예: 과학 탐구 활동지 제출하기">
          </div>
          <div class="form-group">
            <label class="form-label">카테고리</label>
            <select id="modal-mission-category" class="form-select">
              <option value="학습">학습</option>
              <option value="인성">인성</option>
              <option value="생활">생활</option>
              <option value="체육/예술">체육/예술</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">아이콘 (이모지)</label>
            <input type="text" id="modal-mission-icon" class="form-input" value="🎯" style="width: 80px;">
          </div>
          <div class="form-group">
            <label class="form-label">지급 화폐 및 경험치</label>
            <div style="display: flex; gap: 10px;">
              <input type="number" id="modal-mission-currency" class="form-input" value="20" min="5" step="5">
              <span style="display: flex; align-items: center; font-weight: 700;">${settings.currencyName} & EXP</span>
            </div>
          </div>
        `,
        confirmText: '미션 등록',
        confirmClass: 'btn-primary',
        onConfirm: () => {
          const title = document.getElementById('modal-mission-title').value.trim();
          const category = document.getElementById('modal-mission-category').value;
          const icon = document.getElementById('modal-mission-icon').value.trim() || '🎯';
          const rewardCurrency = Number(document.getElementById('modal-mission-currency').value) || 20;

          if (!title) {
            showToast('미션 제목을 입력해 주세요.', 'error');
            return;
          }

          store.addMission({ title, category, icon, rewardCurrency, rewardExp: rewardCurrency });
          showToast(`새 미션 [${title}]이 등록되었습니다!`, 'success');
          update();
        }
      });
    });

    // Delete mission
    tabContainer.querySelectorAll('[data-delete-mission]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-delete-mission');
        store.deleteMission(id);
        showToast('미션이 삭제되었습니다.', 'info');
        update();
      });
    });
  }

  // ============================================================
  // TAB 4: 상점 상품 및 쿠폰 관리
  // ============================================================
  function renderShopTab(tabContainer, items, settings) {
    tabContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h3 style="font-size: 1.2rem; font-weight: 800;">🛒 학급 상점 상품 관리</h3>
          <p style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 2px;">
            학생들이 구매할 수 있는 특권 쿠폰 및 실물 보상품을 관리합니다.
          </p>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-add-item">
          <span>➕ 새 상품/쿠폰 등록</span>
        </button>
      </div>

      <div class="shop-grid">
        ${items.map(item => `
          <div class="shop-card">
            <span class="shop-card-badge ${item.type === 'coupon' ? 'badge-amber' : 'badge-blue'}">
              ${item.type === 'coupon' ? '🎫 쿠폰' : '🎁 실물 상품'}
            </span>
            <div class="shop-card-icon">${item.icon}</div>
            <h4 class="shop-card-title">${item.name}</h4>
            <p class="shop-card-desc">${item.description || '-'}</p>
            
            <div style="background: #f8fafc; padding: 10px; border-radius: var(--radius-md); margin-bottom: 12px; font-size: 0.85rem;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>가격:</span>
                <strong>💰 ${item.price} ${settings.currencyName}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>남은 수량:</span>
                <strong>${item.stock}개</strong>
              </div>
            </div>

            <div style="display: flex; gap: 8px;">
              <button class="btn btn-secondary btn-sm" data-edit-item="${item.id}" style="flex: 1;">수정</button>
              <button class="btn btn-danger btn-sm" data-delete-item="${item.id}">삭제</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Add item
    tabContainer.querySelector('#btn-add-item').addEventListener('click', () => {
      showModal({
        title: '➕ 새 상품 / 쿠폰 등록',
        content: `
          <div class="form-group">
            <label class="form-label">상품 / 쿠폰명</label>
            <input type="text" id="modal-item-name" class="form-input" placeholder="예: 자리 1일 선택권, 특별 간식 교환권 등">
          </div>
          <div class="form-group">
            <label class="form-label">유형</label>
            <select id="modal-item-type" class="form-select">
              <option value="coupon">학급 특권 쿠폰</option>
              <option value="goods">실물 상품/학용품</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">아이콘 (이모지)</label>
            <input type="text" id="modal-item-icon" class="form-input" value="🎫" style="width: 80px;">
          </div>
          <div class="form-group">
            <label class="form-label">가격 (${settings.currencyName})</label>
            <input type="number" id="modal-item-price" class="form-input" value="200" min="10" step="10">
          </div>
          <div class="form-group">
            <label class="form-label">준비된 수량 (재고)</label>
            <input type="number" id="modal-item-stock" class="form-input" value="5" min="1">
          </div>
          <div class="form-group">
            <label class="form-label">설명</label>
            <textarea id="modal-item-desc" class="form-textarea" rows="2" placeholder="쿠폰이나 상품에 대한 안내를 적어주세요."></textarea>
          </div>
        `,
        confirmText: '상점에 등록',
        confirmClass: 'btn-primary',
        onConfirm: () => {
          const name = document.getElementById('modal-item-name').value.trim();
          const type = document.getElementById('modal-item-type').value;
          const icon = document.getElementById('modal-item-icon').value.trim() || '🎁';
          const price = Number(document.getElementById('modal-item-price').value) || 100;
          const stock = Number(document.getElementById('modal-item-stock').value) || 1;
          const description = document.getElementById('modal-item-desc').value.trim();

          if (!name) {
            showToast('상품명을 입력해 주세요.', 'error');
            return;
          }

          store.addShopItem({ name, type, icon, price, stock, description });
          showToast(`[${name}] 상점에 등록되었습니다!`, 'success');
          update();
        }
      });
    });

    // Edit item
    tabContainer.querySelectorAll('[data-edit-item]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-edit-item');
        const item = items.find(i => i.id === id);
        if (!item) return;

        showModal({
          title: `✏️ [${item.name}] 수정`,
          content: `
            <div class="form-group">
              <label class="form-label">상품명</label>
              <input type="text" id="modal-edit-name" class="form-input" value="${item.name}">
            </div>
            <div class="form-group">
              <label class="form-label">가격 (${settings.currencyName})</label>
              <input type="number" id="modal-edit-price" class="form-input" value="${item.price}" min="10" step="10">
            </div>
            <div class="form-group">
              <label class="form-label">재고 수량</label>
              <input type="number" id="modal-edit-stock" class="form-input" value="${item.stock}" min="0">
            </div>
            <div class="form-group">
              <label class="form-label">설명</label>
              <textarea id="modal-edit-desc" class="form-textarea" rows="2">${item.description || ''}</textarea>
            </div>
          `,
          confirmText: '수정 완료',
          confirmClass: 'btn-primary',
          onConfirm: () => {
            const name = document.getElementById('modal-edit-name').value.trim();
            const price = Number(document.getElementById('modal-edit-price').value);
            const stock = Number(document.getElementById('modal-edit-stock').value);
            const description = document.getElementById('modal-edit-desc').value.trim();

            store.updateShopItem(item.id, { name, price, stock, description });
            showToast('상품 정보가 수정되었습니다.', 'success');
            update();
          }
        });
      });
    });

    // Delete item
    tabContainer.querySelectorAll('[data-delete-item]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-delete-item');
        store.deleteShopItem(id);
        showToast('상품이 삭제되었습니다.', 'info');
        update();
      });
    });
  }

  // ============================================================
  // TAB 5: 학급 활동 및 거래 로그
  // ============================================================
  function renderLogsTab(tabContainer, logs, settings) {
    tabContainer.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 1.2rem; font-weight: 800;">📜 학급 화폐 및 활동 내역 (최근 100건)</h3>
        <p style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 2px;">
          선생님의 화폐 지급·차감, 학생의 상점 구매 및 쿠폰 사용 내역이 투명하게 기록됩니다.
        </p>
      </div>

      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 140px;">일시</th>
              <th style="width: 120px;">대상 학생</th>
              <th style="width: 110px;">활동 구분</th>
              <th>상세 내용 / 사유</th>
              <th style="width: 120px; text-align: right;">변동 금액</th>
              <th style="width: 90px; text-align: center;">처리자</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(log => `
              <tr>
                <td style="color: var(--text-muted); font-size: 0.82rem;">${log.timestamp}</td>
                <td><strong>${log.targetStudentName}</strong></td>
                <td>
                  <span class="badge ${log.type === 'grant' || log.type === 'bulk_grant' ? 'badge-green' : log.type === 'purchase' ? 'badge-amber' : log.type === 'use_coupon' ? 'badge-purple' : 'badge-gray'}">
                    ${log.type === 'grant' ? '화폐 지급' : log.type === 'bulk_grant' ? '단체 지급' : log.type === 'purchase' ? '상점 구매' : log.type === 'use_coupon' ? '쿠폰 사용' : '화폐 차감'}
                  </span>
                </td>
                <td>${log.reason}</td>
                <td style="text-align: right; font-weight: 800; color: ${log.amount > 0 ? '#047857' : log.amount < 0 ? '#b91c1c' : '#475569'};">
                  ${log.amount > 0 ? `+${log.amount}` : log.amount} ${settings.currencyName}
                </td>
                <td style="text-align: center; color: var(--text-secondary); font-size: 0.82rem;">${log.operator}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ============================================================
  // TAB 6: 데이터 백업 및 설정
  // ============================================================
  function renderSettingsTab(tabContainer, settings) {
    tabContainer.innerHTML = `
      <div style="max-width: 680px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px;">
        <div class="card">
          <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 14px;">⚙️ 학급 기본 설정</h3>
          <div class="form-group">
            <label class="form-label">학급 이름</label>
            <input type="text" id="settings-class-name" class="form-input" value="${settings.className}">
          </div>
          <div class="form-group">
            <label class="form-label">학급 화폐 단위 명칭</label>
            <input type="text" id="settings-currency-name" class="form-input" value="${settings.currencyName}">
          </div>
          <button class="btn btn-primary btn-sm" id="btn-save-settings">설정 저장</button>
        </div>

        <div class="card">
          <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 8px;">💾 데이터 백업 및 복원 (JSON)</h3>
          <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 16px;">
            다른 컴퓨터나 브라우저로 학급 데이터를 옮기거나 백업할 수 있습니다.
          </p>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <button class="btn btn-secondary" id="btn-export-json">
              <span>📤 데이터 내보내기 (JSON 다운로드)</span>
            </button>
            <label class="btn btn-secondary" style="margin: 0; cursor: pointer;">
              <span>📥 데이터 가져오기 (JSON 불러오기)</span>
              <input type="file" id="file-import-json" accept=".json" style="display: none;">
            </label>
          </div>
        </div>

        <div class="card" style="border-color: #fecaca; background: #fffaf0;">
          <h3 style="font-size: 1.15rem; font-weight: 800; color: #b91c1c; margin-bottom: 8px;">⚠️ 데이터 초기화</h3>
          <p style="font-size: 0.88rem; color: #78350f; margin-bottom: 16px;">
            현재 저장된 모든 화폐, 미션, 상점 기록을 초기 데모 상태(25명 학생 기본값)로 되돌립니다.
          </p>
          <button class="btn btn-danger" id="btn-reset-demo">
            <span>초기 데모 상태로 완전 리셋</span>
          </button>
        </div>
      </div>
    `;

    // Save settings
    tabContainer.querySelector('#btn-save-settings').addEventListener('click', () => {
      const className = tabContainer.querySelector('#settings-class-name').value.trim() || '4학년 1반';
      const currencyName = tabContainer.querySelector('#settings-currency-name').value.trim() || '새싹';
      store.updateSettings({ className, currencyName });
      showToast('학급 설정이 저장되었습니다.', 'success');
      update();
    });

    // Export JSON
    tabContainer.querySelector('#btn-export-json').addEventListener('click', () => {
      const json = store.exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `class_economy_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('백업 파일이 다운로드되었습니다.', 'success');
    });

    // Import JSON
    tabContainer.querySelector('#file-import-json').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const res = store.importData(evt.target.result);
        if (res.success) {
          showToast('데이터 복원이 완료되었습니다!', 'success');
          update();
        } else {
          showToast(`가져오기 실패: ${res.message}`, 'error');
        }
      };
      reader.readAsText(file);
    });

    // Reset Demo
    tabContainer.querySelector('#btn-reset-demo').addEventListener('click', () => {
      showModal({
        title: '⚠️ 정말 초기화하시겠습니까?',
        content: `
          <p style="color: #b91c1c; font-weight: 700;">
            모든 학생의 화폐, 거래 내역, 인벤토리가 초기 샘플 데이터로 리셋됩니다.
          </p>
          <p style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 6px;">
            이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?
          </p>
        `,
        confirmText: '네, 초기화합니다',
        confirmClass: 'btn-danger',
        onConfirm: () => {
          store.resetToDefault();
          showToast('초기 상태로 리셋되었습니다.', 'info');
          update();
        }
      });
    });
  }

  // Initial render
  update();
}
