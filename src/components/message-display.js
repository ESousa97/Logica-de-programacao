/**
 * MESSAGE DISPLAY COMPONENT - Sistema de exibição de mensagens
 * Arquivo: src/components/message-display.js
 */

import { GameConfig, ConfigManager } from '../js/config.js';
import { Utils } from '../js/utils.js';

export class MessageDisplay {
  constructor(containerId = 'messageArea') {
    this.container = document.getElementById(containerId);
    this.currentMessage = null;
    this.messageQueue = [];
    this.isProcessing = false;
    this.autoHideTimer = null;
    this.init();
  }

  /**
   * Inicialização do componente
   */
  init() {
    if (!this.container) {
      ConfigManager.error('Container do message display não encontrado!');
      return;
    }

    this.render();
    this.setupEventListeners();

    ConfigManager.log('Message Display inicializado');
  }

  /**
   * Renderizar sistema de mensagens
   */
  render() {
    this.container.innerHTML = `
      <div class="message-display-content">
        <!-- Mensagem Principal -->
        <div class="main-message" id="mainMessage">
          <div class="message-wrapper">
            <div class="message-icon" id="messageIcon"></div>
            <div class="message-content">
              <div class="message-text" id="messageText">
                Bem-vindo! Escolha um número e tente sua sorte!
              </div>
              <div class="message-subtext" id="messageSubtext"></div>
            </div>
            <div class="message-actions" id="messageActions">
              <!-- Ações aparecerão aqui -->
            </div>
          </div>
          
          <div class="message-progress" id="messageProgress">
            <div class="progress-bar" id="messageProgressBar"></div>
          </div>
        </div>

        <!-- Toast Notifications -->
        <div class="toast-container" id="toastContainer">
          <!-- Toasts aparecerão aqui -->
        </div>

        <!-- Sistema de Conquistas -->
        <div class="achievements-container" id="achievementsContainer">
          <!-- Conquistas aparecerão aqui -->
        </div>

        <!-- Feedback Visual Rápido -->
        <div class="quick-feedback" id="quickFeedback">
          <!-- Feedback rápido aparecerá aqui -->
        </div>
      </div>
    `;

    this.container.classList.add('message-display-component');
  }

  /**
   * Configurar event listeners
   */
  setupEventListeners() {
    const mainMessage = document.getElementById('mainMessage');
    mainMessage?.addEventListener('click', () => this.handleMessageClick());
    mainMessage?.addEventListener('dblclick', () => this.triggerMessageEasterEgg());

    ConfigManager.log('Event listeners do message display configurados');
  }

  /**
   * Mostrar mensagem principal
   */
  showMessage(text, type = 'info', options = {}) {
    const {
      duration = 4000,
      icon = null,
      subtext = '',
      actions = [],
      animated = true,
      priority = 'normal'
    } = options;

    const message = {
      text,
      type,
      icon,
      subtext,
      actions,
      animated,
      duration,
      priority,
      timestamp: Date.now()
    };

    if (priority === 'high') {
      this.displayMessage(message);
    } else {
      this.messageQueue.push(message);
      this.processMessageQueue();
    }

    ConfigManager.log('Mensagem adicionada:', message);
  }

  /**
   * Processar fila de mensagens
   */
  processMessageQueue() {
    if (this.isProcessing || this.messageQueue.length === 0) return;

    this.isProcessing = true;
    const message = this.messageQueue.shift();
    this.displayMessage(message);
  }

  /**
   * Exibir mensagem
   */
  displayMessage(message) {
    const messageIcon = document.getElementById('messageIcon');
    const messageText = document.getElementById('messageText');
    const messageSubtext = document.getElementById('messageSubtext');
    const messageActions = document.getElementById('messageActions');
    const mainMessage = document.getElementById('mainMessage');

    if (!messageIcon || !messageText || !mainMessage) return;

    this.currentMessage = message;

    const icon = message.icon || this.getTypeIcon(message.type);
    messageIcon.textContent = icon;

    messageText.textContent = message.text;

    if (messageSubtext) {
      messageSubtext.textContent = message.subtext || '';
      messageSubtext.style.display = message.subtext ? 'block' : 'none';
    }

    this.updateMessageActions(message.actions);

    mainMessage.className = `main-message message-${message.type}`;

    if (message.animated && GameConfig.ANIMATIONS.enabled) {
      this.animateMessageEntry(mainMessage);
    }

    this.playMessageSound(message.type);

    if (message.duration > 0) {
      this.startAutoHide(message.duration);
    }

    setTimeout(() => {
      this.isProcessing = false;
      this.processMessageQueue();
    }, 500);
  }

  /**
   * Obter ícone do tipo
   */
  getTypeIcon(type) {
    const icons = {
      info: '',
      success: '',
      warning: '',
      error: '',
      hint: '',
      achievement: '',
      celebration: ''
    };

    return icons[type] || '';
  }

  /**
   * Animar entrada da mensagem
   */
  animateMessageEntry(element) {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px) scale(0.95)';

    requestAnimationFrame(() => {
      element.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      element.style.opacity = '1';
      element.style.transform = 'translateY(0) scale(1)';
    });

    setTimeout(() => {
      element.style.boxShadow = '0 0 30px rgba(0, 229, 255, 0.4)';
      setTimeout(() => {
        element.style.boxShadow = '';
      }, 300);
    }, 200);
  }

  /**
   * Reproduzir som da mensagem
   */
  playMessageSound(type) {
    if (!ConfigManager.isAudioEnabled()) return;

    const frequencies = {
      info: 800,
      success: 1000,
      warning: 600,
      error: 400,
      hint: 1200,
      achievement: [800, 1000, 1200],
      celebration: [600, 800, 1000, 1200]
    };

    const freq = frequencies[type];

    if (Array.isArray(freq)) {
      freq.forEach((f, i) => {
        setTimeout(() => Utils.playBeep(f, 150), i * 100);
      });
    } else if (freq) {
      Utils.playBeep(freq, 200);
    }
  }

  /**
   * Atualizar ações da mensagem
   */
  updateMessageActions(actions) {
    const messageActions = document.getElementById('messageActions');
    if (!messageActions) return;

    messageActions.innerHTML = '';

    if (!actions || actions.length === 0) {
      messageActions.style.display = 'none';
      return;
    }

    messageActions.style.display = 'flex';

    actions.forEach(action => {
      const button = document.createElement('button');
      button.className = `message-action-btn message-action-${action.type || 'default'}`;
      button.innerHTML = `
        ${action.icon ? `<span class="action-icon">${action.icon}</span>` : ''}
        <span class="action-text">${action.text}</span>
      `;

      button.addEventListener('click', () => {
        if (action.callback) {
          action.callback();
        }
        this.hideMessage();
      });

      messageActions.appendChild(button);
    });
  }

  /**
   * Iniciar auto-hide
   */
  startAutoHide(duration) {
    this.clearAutoHide();

    const messageProgress = document.getElementById('messageProgress');
    const progressBar = document.getElementById('messageProgressBar');

    if (messageProgress && progressBar && GameConfig.UI.showProgress) {
      messageProgress.style.display = 'block';
      progressBar.style.transition = `width ${duration}ms linear`;
      progressBar.style.width = '0%';

      requestAnimationFrame(() => {
        progressBar.style.width = '100%';
      });
    }

    this.autoHideTimer = setTimeout(() => {
      this.hideMessage();
    }, duration);
  }

  /**
   * Limpar auto-hide
   */
  clearAutoHide() {
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }

    const messageProgress = document.getElementById('messageProgress');
    if (messageProgress) {
      messageProgress.style.display = 'none';
    }
  }

  /**
   * Esconder mensagem
   */
  hideMessage() {
    const mainMessage = document.getElementById('mainMessage');
    if (!mainMessage) return;

    this.clearAutoHide();

    if (GameConfig.ANIMATIONS.enabled) {
      mainMessage.style.transition = 'all 0.3s ease';
      mainMessage.style.opacity = '0';
      mainMessage.style.transform = 'translateY(-10px)';

      setTimeout(() => {
        mainMessage.style.opacity = '';
        mainMessage.style.transform = '';
        mainMessage.style.transition = '';
      }, 300);
    }

    this.currentMessage = null;
  }

  /**
   * Mostrar toast notification
   */
  showToast(text, type = 'info', duration = 3000) {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${this.getTypeIcon(type)}</div>
      <div class="toast-text">${text}</div>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

    toast.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      margin-bottom: 8px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      opacity: 0;
      transform: translateX(400px);
      transition: all 0.3s ease;
    `;

    const colors = {
      info: 'rgba(0, 229, 255, 0.2)',
      success: 'rgba(0, 255, 136, 0.2)',
      warning: 'rgba(255, 107, 53, 0.2)',
      error: 'rgba(255, 71, 87, 0.2)'
    };

    toast.style.background = colors[type] || colors.info;

    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(400px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);

    ConfigManager.log('Toast exibido:', text, type);
  }

  /**
   * Mostrar conquista
   */
  showAchievement(title, description, icon = '', rarity = 'common') {
    const achievementsContainer = document.getElementById('achievementsContainer');
    if (!achievementsContainer) return;

    const achievement = document.createElement('div');
    achievement.className = `achievement achievement-${rarity}`;
    achievement.innerHTML = `
      <div class="achievement-header">
        <div class="achievement-icon">${icon}</div>
        <div class="achievement-rarity">${this.getRarityText(rarity)}</div>
      </div>
      <div class="achievement-content">
        <div class="achievement-title">${title}</div>
        <div class="achievement-description">${description}</div>
      </div>
      <div class="achievement-shine"></div>
    `;

    achievement.style.cssText = `
      position: relative;
      padding: 20px;
      margin-bottom: 10px;
      border-radius: 12px;
      background: linear-gradient(45deg, ${this.getRarityColor(rarity)});
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
      border: 2px solid rgba(255, 255, 255, 0.3);
      opacity: 0;
      transform: scale(0.8) translateY(50px);
      transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      overflow: hidden;
    `;

    achievementsContainer.appendChild(achievement);

    requestAnimationFrame(() => {
      achievement.style.opacity = '1';
      achievement.style.transform = 'scale(1) translateY(0)';
    });

    setTimeout(() => {
      achievement.querySelector('.achievement-shine').style.animation = 'achievementShine 2s ease-in-out';
    }, 500);

    this.playAchievementSound(rarity);

    setTimeout(() => {
      achievement.style.opacity = '0';
      achievement.style.transform = 'scale(0.8) translateY(-50px)';
      setTimeout(() => achievement.remove(), 500);
    }, 6000);

    ConfigManager.log('Conquista exibida:', title, rarity);
  }

  /**
   * Obter cor da raridade
   */
  getRarityColor(rarity) {
    const colors = {
      common: '#4CAF50, #45A049',
      rare: '#2196F3, #1976D2',
      epic: '#9C27B0, #7B1FA2',
      legendary: '#FF9800, #F57C00',
      mythic: '#E91E63, #C2185B'
    };

    return colors[rarity] || colors.common;
  }

  /**
   * Obter texto da raridade
   */
  getRarityText(rarity) {
    const texts = {
      common: 'Comum',
      rare: 'Raro',
      epic: 'Épico',
      legendary: 'Lendário',
      mythic: 'Mítico'
    };

    return texts[rarity] || 'Comum';
  }

  /**
   * Som de conquista
   */
  playAchievementSound(rarity) {
    if (!ConfigManager.isAudioEnabled()) return;

    const soundPatterns = {
      common: [800, 1000],
      rare: [800, 1000, 1200],
      epic: [600, 800, 1000, 1200],
      legendary: [800, 1000, 1200, 1000, 1400],
      mythic: [600, 800, 1000, 1200, 1400, 1600]
    };

    const pattern = soundPatterns[rarity] || soundPatterns.common;

    pattern.forEach((freq, i) => {
      setTimeout(() => Utils.playBeep(freq, 150), i * 120);
    });

    const vibrationPatterns = {
      common: [100],
      rare: [100, 50, 100],
      epic: [100, 50, 100, 50, 100],
      legendary: [200, 100, 200, 100, 200],
      mythic: [300, 100, 200, 100, 300, 100, 200]
    };

    Utils.vibrate(vibrationPatterns[rarity] || [100]);
  }

  /**
   * Mostrar feedback rápido
   */
  showQuickFeedback(type, position = 'center') {
    const quickFeedback = document.getElementById('quickFeedback');
    if (!quickFeedback) return;

    const feedback = document.createElement('div');
    feedback.className = `quick-feedback-item quick-feedback-${type}`;

    const icons = {
      correct: '',
      wrong: '',
      close: '',
      far: '',
      hint: '',
      bonus: ''
    };

    feedback.innerHTML = `
      <div class="feedback-icon">${icons[type] || ''}</div>
    `;

    const positions = {
      center: { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' },
      top: { left: '50%', top: '20%', transform: 'translateX(-50%)' },
      bottom: { left: '50%', bottom: '20%', transform: 'translateX(-50%)' }
    };

    const pos = positions[position] || positions.center;
    Object.assign(feedback.style, {
      position: 'fixed',
      ...pos,
      fontSize: '3rem',
      zIndex: '10000',
      opacity: '0',
      transform: pos.transform + ' scale(0.5)',
      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      pointerEvents: 'none'
    });

    quickFeedback.appendChild(feedback);

    requestAnimationFrame(() => {
      feedback.style.opacity = '1';
      feedback.style.transform = pos.transform + ' scale(1)';
    });

    setTimeout(() => {
      feedback.style.opacity = '0';
      feedback.style.transform = pos.transform + ' scale(1.5)';
      setTimeout(() => feedback.remove(), 400);
    }, 1500);
  }

  /**
   * Easter egg da mensagem
   */
  triggerMessageEasterEgg() {
    const mainMessage = document.getElementById('mainMessage');
    if (!mainMessage) return;

    mainMessage.style.animation = 'messageRainbow 2s ease-in-out';

    this.showMessage(
      'Você encontrou um Easter Egg!',
      'celebration',
      {
        icon: '',
        subtext: 'Parabéns por ser curioso!',
        duration: 3000,
        actions: [
          {
            text: 'Legal!',
            icon: '',
            type: 'primary',
            callback: () => {
              this.showToast('Que bom que você gostou!', 'success');
            }
          }
        ]
      }
    );

    this.createMessageConfetti();

    setTimeout(() => {
      mainMessage.style.animation = '';
    }, 2000);
  }

  /**
   * Criar confete na mensagem
   */
  createMessageConfetti() {
    const colors = ['#FF6B35', '#00E5FF', '#7B68EE', '#00FF88', '#FF10F0'];
    const messageRect = this.container.getBoundingClientRect();

    for (let i = 0; i < 30; i++) {
      const confetti = document.createElement('div');
      confetti.style.cssText = `
        position: fixed;
        width: 8px;
        height: 8px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: 50%;
        pointer-events: none;
        z-index: 10000;
        left: ${messageRect.left + Math.random() * messageRect.width}px;
        top: ${messageRect.top + messageRect.height / 2}px;
        animation: messageConfetti ${2 + Math.random() * 2}s ease-out forwards;
      `;

      document.body.appendChild(confetti);

      setTimeout(() => confetti.remove(), 4000);
    }
  }

  /**
   * Lidar com clique na mensagem
   */
  handleMessageClick() {
    if (!this.currentMessage) return;

    if (this.currentMessage.actions && this.currentMessage.actions.length > 0) {
      return;
    }

    this.hideMessage();
  }

  /**
   * Limpar todas as mensagens
   */
  clearAllMessages() {
    this.hideMessage();
    this.messageQueue = [];

    const toasts = document.querySelectorAll('.toast');
    toasts.forEach(toast => toast.remove());

    const achievements = document.querySelectorAll('.achievement');
    achievements.forEach(achievement => achievement.remove());

    const quickFeedback = document.getElementById('quickFeedback');
    if (quickFeedback) {
      quickFeedback.innerHTML = '';
    }

    this.isProcessing = false;

    ConfigManager.log('Todas as mensagens limpas');
  }

  /**
   * Obter estatísticas de mensagens
   */
  getMessageStats() {
    return {
      currentMessage: this.currentMessage,
      queueLength: this.messageQueue.length,
      isProcessing: this.isProcessing,
      activeToasts: document.querySelectorAll('.toast').length,
      activeAchievements: document.querySelectorAll('.achievement').length
    };
  }

  /**
   * Aplicar tema
   */
  applyTheme(themeName) {
    const theme = GameConfig.THEMES[themeName];
    if (!theme) return;

    const mainMessage = document.getElementById('mainMessage');
    if (mainMessage) {
      mainMessage.style.setProperty('--theme-primary', theme.primary);
      mainMessage.style.setProperty('--theme-secondary', theme.secondary);
    }
  }

  /**
   * Limpar recursos
   */
  destroy() {
    this.clearAutoHide();
    this.clearAllMessages();

    ConfigManager.log('Message Display destruído');
  }
}

// Inicialização automática
document.addEventListener('DOMContentLoaded', () => {
  window.messageDisplay = new MessageDisplay();

  document.addEventListener('gameMessage', (e) => {
    const { text, type, options } = e.detail;
    if (window.messageDisplay) {
      window.messageDisplay.showMessage(text, type, options);
    }
  });

  document.addEventListener('achievementUnlocked', (e) => {
    const { title, description, icon, rarity } = e.detail;
    if (window.messageDisplay) {
      window.messageDisplay.showAchievement(title, description, icon, rarity);
    }
  });

  document.addEventListener('quickFeedback', (e) => {
    const { type, position } = e.detail;
    if (window.messageDisplay) {
      window.messageDisplay.showQuickFeedback(type, position);
    }
  });
});

export default MessageDisplay;
