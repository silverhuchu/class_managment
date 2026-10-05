import {
  LEVEL_TIERS,
  DEFAULT_ROLES,
  DEFAULT_SHOP_ITEMS,
  DEFAULT_MISSIONS,
  DEFAULT_STUDENTS,
  DEFAULT_INVENTORIES,
  DEFAULT_LOGS
} from './data.js';

const STORAGE_KEYS = {
  STUDENTS: 'class_app_students_v1',
  ROLES: 'class_app_roles_v1',
  SHOP_ITEMS: 'class_app_shop_items_v1',
  MISSIONS: 'class_app_missions_v1',
  INVENTORIES: 'class_app_inventories_v1',
  LOGS: 'class_app_logs_v1',
  SETTINGS: 'class_app_settings_v1'
};

class Store {
  constructor() {
    this.subscribers = [];
    this.init();
  }

  init() {
    this.students = this._load(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
    this.roles = this._load(STORAGE_KEYS.ROLES, DEFAULT_ROLES);
    this.shopItems = this._load(STORAGE_KEYS.SHOP_ITEMS, DEFAULT_SHOP_ITEMS);
    this.missions = this._load(STORAGE_KEYS.MISSIONS, DEFAULT_MISSIONS);
    this.inventories = this._load(STORAGE_KEYS.INVENTORIES, DEFAULT_INVENTORIES);
    this.logs = this._load(STORAGE_KEYS.LOGS, DEFAULT_LOGS);
    this.settings = this._load(STORAGE_KEYS.SETTINGS, {
      className: '4학년 1반',
      currencyName: '새싹',
      currencyIcon: '🌱'
    });
  }

  _load(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.error(`Error loading ${key}:`, e);
      return fallback;
    }
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(this.students));
      localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(this.roles));
      localStorage.setItem(STORAGE_KEYS.SHOP_ITEMS, JSON.stringify(this.shopItems));
      localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(this.missions));
      localStorage.setItem(STORAGE_KEYS.INVENTORIES, JSON.stringify(this.inventories));
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(this.logs));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      this._notify();
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  _notify() {
    for (const callback of this.subscribers) {
      callback();
    }
  }

  // --- Level Helpers ---
  calculateLevel(exp) {
    const safeExp = Math.max(0, exp || 0);
    let currentTier = LEVEL_TIERS[0];

    for (const tier of LEVEL_TIERS) {
      if (safeExp >= tier.minExp) {
        currentTier = tier;
      }
    }

    const nextTier = LEVEL_TIERS.find(t => t.level === currentTier.level + 1);
    const min = currentTier.minExp;
    const max = nextTier ? nextTier.minExp : currentTier.maxExp;
    const span = max - min;
    const progressInSpan = Math.min(span, Math.max(0, safeExp - min));
    const percent = nextTier ? Math.floor((progressInSpan / span) * 100) : 100;
    const expNeeded = nextTier ? nextTier.minExp - safeExp : 0;

    return {
      ...currentTier,
      currentExp: safeExp,
      nextLevelExp: nextTier ? nextTier.minExp : max,
      percent,
      expNeeded,
      hasNextLevel: !!nextTier
    };
  }

  // --- Students ---
  getStudents() {
    return this.students.map(s => {
      const levelInfo = this.calculateLevel(s.exp);
      const role = this.roles.find(r => r.id === s.roleId) || null;
      return {
        ...s,
        levelInfo,
        role
      };
    });
  }

  getStudentById(id) {
    const s = this.students.find(st => st.id === Number(id));
    if (!s) return null;
    const levelInfo = this.calculateLevel(s.exp);
    const role = this.roles.find(r => r.id === s.roleId) || null;
    return {
      ...s,
      levelInfo,
      role
    };
  }

  updateStudent(id, partial) {
    const index = this.students.findIndex(s => s.id === Number(id));
    if (index === -1) return null;
    this.students[index] = { ...this.students[index], ...partial };
    this._save();
    return this.getStudentById(id);
  }

  /**
   * 화폐 지급: 화폐와 함께 경험치(EXP)도 1:1로 동일하게 누적!
   * 레벨업 여부 반환
   */
  grantCurrency(studentId, amount, reason = '선생님 칭찬') {
    const student = this.students.find(s => s.id === Number(studentId));
    if (!student) return { success: false, message: '학생을 찾을 수 없습니다.' };

    const oldLevelInfo = this.calculateLevel(student.exp);
    student.currency += amount;
    student.exp += amount;

    const newLevelInfo = this.calculateLevel(student.exp);
    const leveledUp = newLevelInfo.level > oldLevelInfo.level;

    this.addLog({
      type: 'grant',
      targetStudentId: student.id,
      targetStudentName: student.name,
      amount,
      reason,
      operator: '교사'
    });

    this._save();

    return {
      success: true,
      student: this.getStudentById(student.id),
      leveledUp,
      oldLevel: oldLevelInfo,
      newLevel: newLevelInfo
    };
  }

  /**
   * 화폐 차감: 잔액만 차감되며 경험치(EXP)와 레벨은 절대 깎이지 않음!
   */
  deductCurrency(studentId, amount, reason = '화폐 차감') {
    const student = this.students.find(s => s.id === Number(studentId));
    if (!student) return { success: false, message: '학생을 찾을 수 없습니다.' };

    if (student.currency < amount) {
      return { success: false, message: `잔액이 부족합니다. (현재 잔액: ${student.currency})` };
    }

    student.currency -= amount;

    this.addLog({
      type: 'deduct',
      targetStudentId: student.id,
      targetStudentName: student.name,
      amount: -amount,
      reason,
      operator: '교사'
    });

    this._save();

    return {
      success: true,
      student: this.getStudentById(student.id)
    };
  }

  /**
   * 일괄 화폐 지급
   */
  bulkGrantCurrency(studentIds, amount, reason = '학급 단체 보상') {
    const results = [];
    const targetIds = studentIds && studentIds.length > 0
      ? studentIds
      : this.students.map(s => s.id);

    targetIds.forEach(id => {
      const res = this.grantCurrency(id, amount, reason);
      if (res.success) results.push(res);
    });

    return results;
  }

  /**
   * 1인 1역 일일 실천 토글
   */
  toggleRoleDone(studentId) {
    const student = this.students.find(s => s.id === Number(studentId));
    if (!student) return null;

    student.roleDoneToday = !student.roleDoneToday;

    // 만약 완료로 체크했다면 1인 1역 실천 보상(+25 화폐 & 경험치) 자동 지급
    let bonusGranted = false;
    let levelInfo = null;
    if (student.roleDoneToday) {
      const grantRes = this.grantCurrency(student.id, 25, `${student.name} 1인 1역 실천 완료 보상`);
      bonusGranted = true;
      levelInfo = grantRes.newLevel;
    } else {
      this._save();
    }

    return {
      student: this.getStudentById(student.id),
      bonusGranted,
      roleDoneToday: student.roleDoneToday
    };
  }

  /**
   * 1인 1역 배정
   */
  assignRole(studentId, roleId) {
    const student = this.students.find(s => s.id === Number(studentId));
    if (!student) return false;
    student.roleId = roleId;
    this._save();
    return true;
  }

  // --- Missions ---
  getMissions() {
    return this.missions;
  }

  addMission({ title, rewardCurrency, rewardExp, category = '학습', icon = '⭐' }) {
    const newMission = {
      id: `mission-${Date.now()}`,
      title,
      rewardCurrency: Number(rewardCurrency) || 20,
      rewardExp: Number(rewardExp) || Number(rewardCurrency) || 20,
      category,
      icon,
      date: new Date().toISOString().slice(0, 10),
      completedStudents: []
    };
    this.missions.unshift(newMission);
    this._save();
    return newMission;
  }

  deleteMission(id) {
    this.missions = this.missions.filter(m => m.id !== id);
    this._save();
  }

  /**
   * 학생의 미션 완료 토글
   */
  toggleStudentMission(missionId, studentId) {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) return { success: false, message: '미션을 찾을 수 없습니다.' };

    const sId = Number(studentId);
    const index = mission.completedStudents.indexOf(sId);
    let newlyCompleted = false;

    if (index > -1) {
      // 이미 완료 상태였으면 취소
      mission.completedStudents.splice(index, 1);
    } else {
      // 새로 완료함 -> 보상 지급!
      mission.completedStudents.push(sId);
      newlyCompleted = true;
      this.grantCurrency(
        sId,
        mission.rewardCurrency,
        `미션 달성: ${mission.title}`
      );
    }

    this._save();
    return {
      success: true,
      newlyCompleted,
      mission
    };
  }

  // --- Shop Items ---
  getShopItems() {
    return this.shopItems;
  }

  addShopItem({ name, type = 'coupon', price, stock = 10, icon = '🎁', description = '' }) {
    const newItem = {
      id: `item-${Date.now()}`,
      name,
      type,
      price: Number(price),
      stock: Number(stock),
      icon,
      description
    };
    this.shopItems.push(newItem);
    this._save();
    return newItem;
  }

  updateShopItem(id, partial) {
    const index = this.shopItems.findIndex(i => i.id === id);
    if (index === -1) return null;
    this.shopItems[index] = { ...this.shopItems[index], ...partial };
    this._save();
    return this.shopItems[index];
  }

  deleteShopItem(id) {
    this.shopItems = this.shopItems.filter(i => i.id !== id);
    this._save();
  }

  /**
   * 상점 상품 구매
   */
  purchaseItem(studentId, itemId) {
    const student = this.students.find(s => s.id === Number(studentId));
    const item = this.shopItems.find(i => i.id === itemId);

    if (!student) return { success: false, message: '학생 정보를 찾을 수 없습니다.' };
    if (!item) return { success: false, message: '상품을 찾을 수 없습니다.' };
    if (item.stock <= 0) return { success: false, message: '품절된 상품입니다.' };
    if (student.currency < item.price) {
      return {
        success: false,
        message: `잔액이 부족합니다. (필요: ${item.price} ${this.settings.currencyName}, 보유: ${student.currency} ${this.settings.currencyName})`
      };
    }

    // 잔액 차감 (경험치 보존)
    student.currency -= item.price;
    item.stock -= 1;

    // 인벤토리에 추가
    const newInventoryItem = {
      id: `inv-${Date.now()}`,
      studentId: student.id,
      itemId: item.id,
      itemName: item.name,
      itemIcon: item.icon,
      itemType: item.type,
      itemDescription: item.description,
      purchasedAt: new Date().toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      isUsed: false,
      usedAt: null
    };

    this.inventories.unshift(newInventoryItem);

    this.addLog({
      type: 'purchase',
      targetStudentId: student.id,
      targetStudentName: student.name,
      amount: -item.price,
      reason: `상점 구매: ${item.name}`,
      operator: '학생'
    });

    this._save();

    return {
      success: true,
      item,
      inventoryItem: newInventoryItem,
      remainingCurrency: student.currency
    };
  }

  // --- Inventory ---
  getInventoriesByStudent(studentId) {
    return this.inventories.filter(inv => inv.studentId === Number(studentId));
  }

  /**
   * 쿠폰 사용 완료 처리
   */
  useInventoryItem(inventoryId) {
    const inv = this.inventories.find(i => i.id === inventoryId);
    if (!inv) return { success: false, message: '보관함 항목을 찾을 수 없습니다.' };
    if (inv.isUsed) return { success: false, message: '이미 사용 완료된 쿠폰입니다.' };

    inv.isUsed = true;
    inv.usedAt = new Date().toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    const student = this.getStudentById(inv.studentId);

    this.addLog({
      type: 'use_coupon',
      targetStudentId: inv.studentId,
      targetStudentName: student ? student.name : '학생',
      amount: 0,
      reason: `쿠폰 사용 완료: ${inv.itemName}`,
      operator: '학생(확인완료)'
    });

    this._save();
    return { success: true, inventoryItem: inv };
  }

  // --- Roles ---
  getRoles() {
    return this.roles;
  }

  addRole({ name, icon = '⭐', description = '' }) {
    const newRole = {
      id: `role-${Date.now()}`,
      name,
      icon,
      description
    };
    this.roles.push(newRole);
    this._save();
    return newRole;
  }

  // --- Logs ---
  getLogs() {
    return this.logs;
  }

  addLog({ type, targetStudentId, targetStudentName, amount, reason, operator }) {
    const newLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      type,
      targetStudentId,
      targetStudentName,
      amount,
      reason,
      operator
    };
    this.logs.unshift(newLog);
    if (this.logs.length > 100) this.logs.pop(); // keep last 100
  }

  // --- Settings ---
  getSettings() {
    return this.settings;
  }

  updateSettings(partial) {
    this.settings = { ...this.settings, ...partial };
    this._save();
  }

  // --- Data Backup / Restore / Reset ---
  exportData() {
    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      students: this.students,
      roles: this.roles,
      shopItems: this.shopItems,
      missions: this.missions,
      inventories: this.inventories,
      logs: this.logs,
      settings: this.settings
    }, null, 2);
  }

  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data.students || !Array.isArray(data.students)) {
        throw new Error('유효하지 않은 데이터 형식입니다.');
      }

      this.students = data.students;
      if (data.roles) this.roles = data.roles;
      if (data.shopItems) this.shopItems = data.shopItems;
      if (data.missions) this.missions = data.missions;
      if (data.inventories) this.inventories = data.inventories;
      if (data.logs) this.logs = data.logs;
      if (data.settings) this.settings = data.settings;

      this._save();
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  resetToDefault() {
    localStorage.clear();
    this.students = JSON.parse(JSON.stringify(DEFAULT_STUDENTS));
    this.roles = JSON.parse(JSON.stringify(DEFAULT_ROLES));
    this.shopItems = JSON.parse(JSON.stringify(DEFAULT_SHOP_ITEMS));
    this.missions = JSON.parse(JSON.stringify(DEFAULT_MISSIONS));
    this.inventories = JSON.parse(JSON.stringify(DEFAULT_INVENTORIES));
    this.logs = JSON.parse(JSON.stringify(DEFAULT_LOGS));
    this.settings = {
      className: '4학년 1반',
      currencyName: '새싹',
      currencyIcon: '🌱'
    };
    this._save();
    return { success: true };
  }
}

export const store = new Store();
