import { store } from '../store.js';
import { sound } from '../sound.js';
import { triggerConfetti } from '../confetti.js';

export function renderStudentView(container, studentId, { onSwitchMode, showToast, showModal }) {
  let activeTab = 'shop'; // 'shop' | 'inventory' | 'history'

  function update() {
    const student = store.getStudentById(studentId);
    if (!student) {
      container.innerHTML = `<div style="text-align: center; padding: 40px;">학생 정보를 찾을 수 없습니다. <button id="btn-back" class="btn btn-secondary">돌아가기</button></div>`;
      container.querySelector('#btn-back')?.addEventListener('click', onSwitchMode);
      return;
    }

    const settings = store.getSettings();
    const missions = store.getMissions();
    const shopItems = store.getShopItems();
    const inventory = store.getInventoriesByStudent(student.id);
    const logs = store.getLogs().filter(l => l.targetStudentId === student.id);

    const level = student.levelInfo;
    const role = student.role;

    container.innerHTML = `
      <!-- 학생 화면 헤더 바 -->
      <div class="app-header">
        <div class="brand-logo" id="btn-header-home">
          <div class="brand-icon" style="background-color: ${student.avatarBg}">
            ${student.avatarEmoji}
          </div>
          <div>
            <div class="brand-title">${student.id}번 ${student.name}의 성장 일지 ⭐</div>
            <div class="brand-subtitle">${settings.className} 학급 경제교실</div>
          </div>
        </div>

        <div class="header-actions">
          <button class="btn btn-secondary btn-sm" id="btn-switch-user">
            <span>🔄 모드 변경 / 다른 학생</span>
          </button>
        </div>
      </div>

      <!-- 상단 핵심 1: 프로필 & EXP / 보유 화폐 잔액 (PRD 최우선 노출 요구사항) -->
      <div class="student-banner-grid">
        <!-- 레벨 & 경험치 프로필 카드 -->
        <div class="student-profile-card">
          <div class="student-profile-header">
            <div class="profile-avatar-large" style="background-color: ${student.avatarBg}">
              ${student.avatarEmoji}
            </div>
            <div>
              <div class="profile-name-title">
                <span>${student.name}</span>
                <span class="profile-tier-badge" style="background: ${level.color}">
                  ${level.icon} Lv.${level.level} ${level.name}
                </span>
              </div>
              <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
                배정된 1인 1역: <strong>${role ? `${role.icon} ${role.name}` : '역할 없음'}</strong>
              </div>
            </div>
          </div>

          <!-- 경험치 진행도 바 -->
          <div class="exp-progress-wrap">
            <div class="exp-label-row">
              <span>누적 경험치: ${level.currentExp.toLocaleString()} EXP</span>
              <span>${level.percent}% 달성</span>
            </div>
            <div class="exp-bar-container">
              <div class="exp-bar-fill" style="width: ${level.percent}%;"></div>
            </div>
            <div class="exp-hint">
              ${level.hasNextLevel
                ? `다음 레벨(${level.level + 1}단계)까지 <strong>${level.expNeeded} EXP</strong> 더 필요해요!`
                : '최고 레벨에 도달했습니다! 멋진 활약을 펼쳐보세요! 🎉'}
            </div>
          </div>
        </div>

        <!-- 내 보유 화폐 카드 -->
        <div class="student-balance-card">
          <div class="balance-label">
            <span>${settings.currencyIcon}</span>
            <span>내 보유 학급 화폐</span>
          </div>
          <div class="balance-amount">
            <span class="balance-coin-icon">💰</span>
            <span>${student.currency.toLocaleString()}</span>
            <span style="font-size: 1.5rem; font-weight: 700;">${settings.currencyName}</span>
          </div>
          <div class="balance-sub">
            화폐를 써도 레벨과 경험치는 줄어들지 않아요! 🌱
          </div>
        </div>
      </div>

      <!-- 상단 핵심 2: 오늘 할 일 (1인 1역 실천 점검 + 오늘의 미션) (PRD 최우선 노출 요구사항) -->
      <div class="student-todo-section">
        <div class="section-title-row">
          <h2 class="section-title">
            <span>📋</span>
            <span>오늘 할 일 (Today's Quest)</span>
          </h2>
          <span class="badge badge-green">매일매일 실천하고 보상받기</span>
        </div>

        <!-- 1인 1역 실천 박스 -->
        <div class="role-hero-box">
          <div class="role-info-wrap">
            <div class="role-icon-big">${role ? role.icon : '❓'}</div>
            <div>
              <div class="role-title-text">
                <span>1인 1역: ${role ? role.name : '배정된 역할이 없습니다'}</span>
                <span class="badge badge-amber">+25 ${settings.currencyName} & EXP</span>
              </div>
              <div class="role-desc-text">
                ${role ? role.description : '선생님께 역할을 문의해 주세요.'}
              </div>
            </div>
          </div>

          ${role ? `
            <button class="role-check-btn ${student.roleDoneToday ? 'completed' : 'uncompleted'}" id="btn-toggle-role">
              <span>${student.roleDoneToday ? '✅ 오늘 역할 완수함!' : '👉 오늘 역할 완료하기'}</span>
            </button>
          ` : ''}
        </div>

        <!-- 오늘의 학급 미션 목록 -->
        <div class="todo-list">
          <div style="font-size: 0.92rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px;">
            📝 오늘의 학급 미션
          </div>
          ${missions.length === 0 ? `
            <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
              오늘 등록된 추가 미션이 없습니다.
            </div>
          ` : missions.map(mission => {
            const isCompleted = mission.completedStudents.includes(student.id);
            return `
              <div class="todo-item ${isCompleted ? 'completed' : ''}" data-mission-id="${mission.id}">
                <label class="todo-content">
                  <input type="checkbox" class="todo-checkbox" ${isCompleted ? 'checked' : ''} data-mission-id="${mission.id}">
                  <span style="font-size: 1.2rem;">${mission.icon}</span>
                  <span class="todo-title">${mission.title}</span>
                </label>
                <div class="todo-reward-pill">
                  <span>💰 +${mission.rewardCurrency} ${settings.currencyName}</span>
                  <span>⭐ +${mission.rewardExp} EXP</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 하단 탭: 학급 상점 / 내 보관함 / 활동 내역 -->
      <div class="tabs-nav">
        <button class="tab-btn ${activeTab === 'shop' ? 'active' : ''}" data-tab="shop">
          🛒 학급 상점 (${shopItems.length}종)
        </button>
        <button class="tab-btn ${activeTab === 'inventory' ? 'active' : ''}" data-tab="inventory">
          🎒 내 보관함 (${inventory.filter(i => !i.isUsed).length}장 보유)
        </button>
        <button class="tab-btn ${activeTab === 'history' ? 'active' : ''}" data-tab="history">
          📜 내 활동 내역
        </button>
      </div>

      <div id="student-tab-content">
        <!-- 탭 내용 렌더링 -->
      </div>
    `;

    // Render Tab Content
    const tabContainer = container.querySelector('#student-tab-content');
    if (activeTab === 'shop') {
      renderShopTab(tabContainer, student, settings, shopItems);
    } else if (activeTab === 'inventory') {
      renderInventoryTab(tabContainer, student, settings, inventory);
    } else if (activeTab === 'history') {
      renderHistoryTab(tabContainer, student, settings, logs);
    }

    // Attach Header / Mode Switch Events
    container.querySelector('#btn-switch-user').addEventListener('click', onSwitchMode);
    container.querySelector('#btn-header-home').addEventListener('click', onSwitchMode);

    // Tab buttons
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.getAttribute('data-tab');
        update();
      });
    });

    // 1인 1역 실천 버튼 클릭 이벤트
    const roleBtn = container.querySelector('#btn-toggle-role');
    if (roleBtn) {
      roleBtn.addEventListener('click', () => {
        const result = store.toggleRoleDone(student.id);
        if (result.bonusGranted) {
          sound.playCoin();
          triggerConfetti();
          showToast(`👏 1인 1역을 완수했습니다! +25 ${settings.currencyName} 및 EXP 획득!`, 'success');
        } else {
          showToast('1인 1역 실천 완료가 취소되었습니다.', 'info');
        }
        update();
      });
    }

    // 미션 체크박스 이벤트
    container.querySelectorAll('.todo-checkbox').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const missionId = e.target.getAttribute('data-mission-id');
        const res = store.toggleStudentMission(missionId, student.id);
        if (res.success && res.newlyCompleted) {
          sound.playCheck();
          triggerConfetti(1500);
          showToast(`🎯 미션 완료! +${res.mission.rewardCurrency} ${settings.currencyName} & EXP 획득!`, 'success');
        } else {
          showToast('미션 완료 상태가 변경되었습니다.', 'info');
        }
        update();
      });
    });
  }

  // --- Sub-Tab: Shop ---
  function renderShopTab(tabContainer, student, settings, items) {
    if (items.length === 0) {
      tabContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">등록된 상점 상품이 없습니다.</div>`;
      return;
    }

    tabContainer.innerHTML = `
      <div class="shop-grid">
        ${items.map(item => {
          const canAfford = student.currency >= item.price;
          const isOutOfStock = item.stock <= 0;
          return `
            <div class="shop-card">
              <span class="shop-card-badge ${item.type === 'coupon' ? 'badge-amber' : 'badge-blue'}">
                ${item.type === 'coupon' ? '🎫 쿠폰' : '🎁 실물 상품'}
              </span>
              <div class="shop-card-icon">${item.icon}</div>
              <h3 class="shop-card-title">${item.name}</h3>
              <p class="shop-card-desc">${item.description || '선생님과 함께하는 특별한 혜택'}</p>
              
              <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 8px;">
                남은 수량: <strong>${item.stock}개</strong>
              </div>

              <div class="shop-card-footer">
                <div class="shop-card-price">
                  <span>💰</span>
                  <span>${item.price}</span>
                  <span style="font-size: 0.85rem; font-weight: 600;">${settings.currencyName}</span>
                </div>
                <button class="btn btn-sm ${canAfford && !isOutOfStock ? 'btn-primary' : 'btn-secondary'}"
                        data-buy-id="${item.id}"
                        ${!canAfford || isOutOfStock ? 'disabled' : ''}>
                  ${isOutOfStock ? '품절' : !canAfford ? '잔액 부족' : '구매하기'}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Buy Button Handler
    tabContainer.querySelectorAll('[data-buy-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const itemId = btn.getAttribute('data-buy-id');
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        showModal({
          title: `🛒 상품 구매 확인`,
          content: `
            <div style="text-align: center; padding: 10px 0;">
              <div style="font-size: 3rem; margin-bottom: 10px;">${item.icon}</div>
              <h4 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 8px;">[${item.name}]</h4>
              <p style="color: var(--text-secondary); font-size: 0.92rem; margin-bottom: 16px;">
                ${item.description}
              </p>
              <div style="background: #fef3c7; padding: 12px; border-radius: var(--radius-md); font-weight: 700; color: #92400e;">
                구매 금액: 💰 ${item.price} ${settings.currencyName}<br>
                <span style="font-size: 0.85rem; font-weight: 500;">(구매 후 잔액: ${(student.currency - item.price)} ${settings.currencyName})</span>
              </div>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 10px;">
                💡 화폐를 사용해도 나의 누적 경험치와 레벨은 유지됩니다!
              </p>
            </div>
          `,
          confirmText: '구매하기',
          confirmClass: 'btn-primary',
          onConfirm: () => {
            const res = store.purchaseItem(student.id, item.id);
            if (res.success) {
              sound.playPurchase();
              triggerConfetti();
              showToast(`🎉 [${item.name}] 구매 완료! '내 보관함'에 보관되었습니다.`, 'success');
              activeTab = 'inventory'; // 구매 후 보관함으로 이동
              update();
            } else {
              showToast(res.message, 'error');
            }
          }
        });
      });
    });
  }

  // --- Sub-Tab: Inventory (PRD 핵심 요구사항: 내 보관함 및 선생님 확인 후 사용 완료) ---
  function renderInventoryTab(tabContainer, student, settings, items) {
    if (items.length === 0) {
      tabContainer.innerHTML = `
        <div style="text-align: center; padding: 50px 20px; background: #fff; border-radius: var(--radius-lg); border: 1px solid var(--border-light);">
          <div style="font-size: 3rem; margin-bottom: 12px;">🎒</div>
          <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">아직 보관 중인 쿠폰이나 상품이 없어요</h4>
          <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 18px;">학급 상점에서 열심히 모은 화폐로 특별한 쿠폰을 구매해 보세요!</p>
        </div>
      `;
      return;
    }

    tabContainer.innerHTML = `
      <div class="inventory-grid">
        ${items.map(inv => `
          <div class="inventory-card ${inv.isUsed ? 'used' : ''}">
            <div class="coupon-ticket-header">
              <div class="coupon-ticket-icon">${inv.itemIcon}</div>
              <div>
                <h4 class="coupon-ticket-title">${inv.itemName}</h4>
                <div class="coupon-ticket-time">구매일: ${inv.purchasedAt}</div>
              </div>
            </div>
            
            <p class="coupon-ticket-desc">
              ${inv.itemDescription || '학급 특권 쿠폰'}
            </p>

            ${inv.isUsed ? `
              <div style="background: #f1f5f9; padding: 10px; border-radius: var(--radius-md); text-align: center; font-size: 0.85rem; font-weight: 700; color: var(--text-muted);">
                ✅ 사용 완료 (${inv.usedAt})
              </div>
            ` : `
              <button class="btn btn-amber btn-sm" data-use-inv-id="${inv.id}" style="width: 100%;">
                <span>선생님께 확인받고 사용하기 👉</span>
              </button>
            `}
          </div>
        `).join('')}
      </div>
    `;

    // Coupon Use Button Handler (PRD 확정 결정 사항)
    tabContainer.querySelectorAll('[data-use-inv-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const invId = btn.getAttribute('data-use-inv-id');
        const inv = items.find(i => i.id === invId);
        if (!inv) return;

        showModal({
          title: `🎟️ 쿠폰 사용 확인`,
          content: `
            <div style="text-align: center; padding: 12px 0;">
              <div style="font-size: 3rem; margin-bottom: 10px;">${inv.itemIcon}</div>
              <h4 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 8px;">[${inv.itemName}]</h4>
              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--radius-md); padding: 14px; margin: 16px 0; color: #b91c1c; text-align: left; font-size: 0.92rem;">
                <strong>⚠️ 사용 전 꼭 확인해 주세요!</strong><br>
                1. 지금 선생님께 이 쿠폰 화면을 직접 보여드렸나요?<br>
                2. [사용 완료]를 누르면 쿠폰이 소모되어 다시 되돌릴 수 없습니다.
              </div>
              <p style="font-size: 0.88rem; color: var(--text-secondary);">
                선생님의 확인을 받으셨다면 아래 버튼을 눌러주세요.
              </p>
            </div>
          `,
          confirmText: '확인받고 사용 완료하기',
          confirmClass: 'btn-amber',
          onConfirm: () => {
            const res = store.useInventoryItem(inv.id);
            if (res.success) {
              sound.playPurchase();
              showToast(`🎫 [${inv.itemName}] 사용 완료 처리되었습니다! 즐거운 하루 되세요!`, 'success');
              update();
            } else {
              showToast(res.message, 'error');
            }
          }
        });
      });
    });
  }

  // --- Sub-Tab: History ---
  function renderHistoryTab(tabContainer, student, settings, logs) {
    if (logs.length === 0) {
      tabContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">아직 활동 내역이 없습니다.</div>`;
      return;
    }

    tabContainer.innerHTML = `
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>일시</th>
              <th>내용</th>
              <th>구분</th>
              <th>변동 화폐</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(log => `
              <tr>
                <td style="color: var(--text-muted); font-size: 0.82rem;">${log.timestamp}</td>
                <td><strong>${log.reason}</strong></td>
                <td>
                  <span class="badge ${log.type === 'grant' || log.type === 'bulk_grant' ? 'badge-green' : log.type === 'purchase' ? 'badge-amber' : 'badge-blue'}">
                    ${log.type === 'grant' ? '보상 지급' : log.type === 'bulk_grant' ? '학급 단체' : log.type === 'purchase' ? '상점 구매' : '쿠폰 사용'}
                  </span>
                </td>
                <td style="font-weight: 800; color: ${log.amount > 0 ? '#047857' : log.amount < 0 ? '#b91c1c' : '#475569'};">
                  ${log.amount > 0 ? `+${log.amount}` : log.amount} ${settings.currencyName}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Initial render
  update();
}
