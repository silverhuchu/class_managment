import { store } from './store.js';
import { sound } from './sound.js';
import { renderGateway } from './views/gateway.js';
import { renderStudentView } from './views/studentView.js';
import { renderTeacherView } from './views/teacherView.js';

class App {
  constructor() {
    this.currentView = 'gateway'; // 'gateway' | 'teacher' | 'student'
    this.selectedStudentId = null;
    this.appContainer = document.getElementById('app');

    this.initSoundToggle();
    this.initModal();
    this.initRouting();
  }

  initSoundToggle() {
    let btn = document.getElementById('floating-sound-btn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'floating-sound-btn';
      btn.className = 'floating-sound-btn';
      btn.title = '효과음 켜기/끄기';
      btn.innerHTML = '🔊';
      document.body.appendChild(btn);
    }

    btn.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      btn.innerHTML = isMuted ? '🔇' : '🔊';
      this.showToast(isMuted ? '효과음이 꺼졌습니다.' : '효과음이 켜졌습니다.', 'info');
    });
  }

  initModal() {
    let overlay = document.getElementById('global-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'global-modal-overlay';
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="modal-title">알림</h3>
            <button class="modal-close-btn" id="modal-close-btn">&times;</button>
          </div>
          <div class="modal-body" id="modal-body"></div>
          <div class="modal-footer" id="modal-footer">
            <button class="btn btn-secondary" id="modal-cancel-btn">취소</button>
            <button class="btn btn-primary" id="modal-confirm-btn">확인</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    const closeBtn = overlay.querySelector('#modal-close-btn');
    const cancelBtn = overlay.querySelector('#modal-cancel-btn');

    const closeModal = () => {
      overlay.classList.remove('active');
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
  }

  showModal({ title, content, confirmText = '확인', confirmClass = 'btn-primary', onConfirm }) {
    const overlay = document.getElementById('global-modal-overlay');
    if (!overlay) return;

    overlay.querySelector('#modal-title').innerHTML = title;
    overlay.querySelector('#modal-body').innerHTML = content;

    const confirmBtn = overlay.querySelector('#modal-confirm-btn');
    confirmBtn.textContent = confirmText;
    confirmBtn.className = `btn ${confirmClass}`;

    // Remove old listeners by replacing button clone
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', () => {
      overlay.classList.remove('active');
      if (onConfirm) onConfirm();
    });

    overlay.classList.add('active');
  }

  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'levelup' ? '🌟' : 'ℹ️';

    toast.innerHTML = `
      <span style="font-size: 1.2rem;">${icon}</span>
      <div style="flex: 1;">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s forwards';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3200);
  }

  initRouting() {
    // Check URL hash for direct bookmarking/reloads if needed
    const hash = window.location.hash;
    if (hash === '#teacher') {
      this.currentView = 'teacher';
    } else if (hash.startsWith('#student-')) {
      const sId = Number(hash.replace('#student-', ''));
      if (sId) {
        this.currentView = 'student';
        this.selectedStudentId = sId;
      }
    }

    this.render();

    // Listen to hash changes (back/forward browser buttons)
    window.addEventListener('hashchange', () => {
      const newHash = window.location.hash;
      if (newHash === '#teacher') {
        this.currentView = 'teacher';
      } else if (newHash.startsWith('#student-')) {
        this.currentView = 'student';
        this.selectedStudentId = Number(newHash.replace('#student-', ''));
      } else {
        this.currentView = 'gateway';
        this.selectedStudentId = null;
      }
      this.render();
    });
  }

  navigate(view, studentId = null) {
    this.currentView = view;
    this.selectedStudentId = studentId;

    if (view === 'teacher') {
      window.location.hash = '#teacher';
    } else if (view === 'student' && studentId) {
      window.location.hash = `#student-${studentId}`;
    } else {
      window.location.hash = '';
    }

    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  render() {
    this.appContainer.innerHTML = '';

    if (this.currentView === 'gateway') {
      renderGateway(this.appContainer, {
        onSelectTeacher: () => this.navigate('teacher'),
        onSelectStudent: (id) => this.navigate('student', id)
      });
    } else if (this.currentView === 'teacher') {
      renderTeacherView(this.appContainer, {
        onSwitchMode: () => this.navigate('gateway'),
        showToast: (msg, type) => this.showToast(msg, type),
        showModal: (opts) => this.showModal(opts)
      });
    } else if (this.currentView === 'student' && this.selectedStudentId) {
      renderStudentView(this.appContainer, this.selectedStudentId, {
        onSwitchMode: () => this.navigate('gateway'),
        showToast: (msg, type) => this.showToast(msg, type),
        showModal: (opts) => this.showModal(opts)
      });
    }
  }
}

// Bootstrapping
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
