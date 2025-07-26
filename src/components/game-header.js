/**
 * GAME HEADER COMPONENT - Componente do cabeçalho do jogo
 * Arquivo: src/components/game-header.js
 */

import { GameConfig, ConfigManager } from '../js/config.js';
import { Utils } from '../js/utils.js';

export class GameHeader {
  constructor(containerId = 'gameHeader') {
    this.container = document.getElementById(containerId);
    this.isAnimating = false;
    this.titleEffectActive = false;
    this.init();
  }

  /**
   * Inicialização do componente
   */
  init() {
    if (!this.container) {
      ConfigManager.error('Container do header não encontrado!');
      return;
    }

    this.render();
    this.setupEventListeners();
    this.startTitleEffects();

    ConfigManager.log('Game Header inicializado');
  }

  /**
   * Renderizar o cabeçalho
   */
  render() {
    this.container.innerHTML = `
      <div class="header-content">
        <h1 class="title" id="gameTitle">
          <span class="title-icon"></span>
          <span class="title-text">NÚMERO SECRETO</span>
          <span class="title-version">v2.0</span>
        </h1>
        <p class="subtitle" id="gameSubtitle">
          Descubra o número misterioso!
        </p>
        <div class="header-stats" id="headerStats">
          <div class="header-stat">
            <span class="stat-icon"></span>
            <span class="stat-value" id="quickGamesCount">0</span>
            <span class="stat-label">Jogos</span>
          </div>
          <div class="header-stat">
            <span class="stat-icon"></span>
            <span class="stat-value" id="quickWinsCount">0</span>
            <span class="stat-label">Vitórias</span>
          </div>
          <div class="header-stat">
            <span class="stat-icon"></span>
            <span class="stat-value" id="quickStreakCount">0</span>
            <span class="stat-label">Sequência</span>
          </div>
        </div>
      </div>
      
      <div class="header-controls" id="headerControls">
        <button class="header-btn" id="settingsBtn" title="Configurações">
          <span class="btn-icon"></span>
        </button>
        <button class="header-btn" id="statsBtn" title="Estatísticas Detalhadas">
          <span class="btn-icon"></span>
        </button>
        <button class="header-btn" id="helpBtn" title="Ajuda">
          <span class="btn-icon"></span>
        </button>
        <button class="header-btn" id="themeBtn" title="Alternar Tema">
          <span class="btn-icon"></span>
        </button>
      </div>
    `;

    // Adicionar classes CSS específicas
    this.container.classList.add('game-header-component');
  }

  /**
   * Configurar event listeners
   */
  setupEventListeners() {
    const settingsBtn = document.getElementById('settingsBtn');
    settingsBtn?.addEventListener('click', () => this.openSettings());

    const statsBtn = document.getElementById('statsBtn');
    statsBtn?.addEventListener('click', () => this.openDetailedStats());

    const helpBtn = document.getElementById('helpBtn');
    helpBtn?.addEventListener('click', () => this.openHelp());

    const themeBtn = document.getElementById('themeBtn');
    themeBtn?.addEventListener('click', () => this.cycleTheme());

    const title = document.getElementById('gameTitle');
    title?.addEventListener('click', () => this.triggerTitleEasterEgg());

    this.setupHoverEffects();

    ConfigManager.log('Event listeners do header configurados');
  }

  /**
   * Configurar efeitos de hover
   */
  setupHoverEffects() {
    const title = document.getElementById('gameTitle');
    const subtitle = document.getElementById('gameSubtitle');

    title?.addEventListener('mouseenter', () => {
      if (!this.isAnimating) {
        title.style.transform = 'scale(1.05)';
        title.style.filter = 'brightness(1.2)';
      }
    });

    title?.addEventListener('mouseleave', () => {
      if (!this.isAnimating) {
        title.style.transform = 'scale(1)';
        title.style.filter = 'brightness(1)';
      }
    });

    subtitle?.addEventListener('mouseenter', () => {
      subtitle.style.color = 'var(--neon-cyan)';
      subtitle.style.textShadow = '0 0 10px currentColor';
    });

    subtitle?.addEventListener('mouseleave', () => {
      subtitle.style.color = '';
      subtitle.style.textShadow = '';
    });

    const headerBtns = document.querySelectorAll('.header-btn');
    headerBtns.forEach((btn) => {
      btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateY(-2px) scale(1.1)';
        btn.style.boxShadow = '0 5px 15px rgba(0, 229, 255, 0.4)';
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
        btn.style.boxShadow = '';
      });
    });
  }

  /**
   * Iniciar efeitos do título
   */
  startTitleEffects() {
    const titleText = document.querySelector('.title-text');
    if (!titleText || !GameConfig.ANIMATIONS.enabled) return;

    this.titleGlowInterval = setInterval(() => {
      if (!this.titleEffectActive) {
        this.titleEffectActive = true;
        titleText.classList.add('animate-neon-flicker');

        setTimeout(() => {
          titleText.classList.remove('animate-neon-flicker');
          this.titleEffectActive = false;
        }, 2000);
      }
    }, 8000);

    this.titleColorInterval = setInterval(() => {
      if (!this.isAnimating) {
        titleText.classList.add('animate-color-shift');

        setTimeout(() => {
          titleText.classList.remove('animate-color-shift');
        }, 3000);
      }
    }, 15000);
  }

  /**
   * Easter Egg do título
   */
  triggerTitleEasterEgg() {
    if (this.isAnimating) return;

    this.isAnimating = true;
    const title = document.getElementById('gameTitle');
    const titleIcon = document.querySelector('.title-icon');

    title.classList.add('animate-celebration');

    const originalIcon = titleIcon.textContent;
    const icons = ['', '', '', '', '', '', ''];
    let iconIndex = 0;

    const iconInterval = setInterval(() => {
      titleIcon.textContent = icons[iconIndex % icons.length];
      iconIndex++;
    }, 200);

    this.createHeaderConfetti();

    Utils.playBeep(800, 100);
    setTimeout(() => Utils.playBeep(1000, 100), 150);
    setTimeout(() => Utils.playBeep(1200, 200), 300);

    setTimeout(() => {
      clearInterval(iconInterval);
      titleIcon.textContent = originalIcon;
      title.classList.remove('animate-celebration');
      this.isAnimating = false;
    }, 3000);

    ConfigManager.log('Easter egg do título ativado!');
  }

  /**
   * Criar confete no header
   */
  createHeaderConfetti() {
    const headerRect = this.container.getBoundingClientRect();
    const colors = ['#FF6B35', '#00E5FF', '#7B68EE', '#00FF88'];

    for (let i = 0; i < 20; i++) {
      const confetti = document.createElement('div');
      confetti.style.cssText = `
        position: fixed;
        width: 8px;
        height: 8px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        left: ${headerRect.left + Math.random() * headerRect.width}px;
        top: ${headerRect.top + headerRect.height / 2}px;
        animation: headerConfetti 2s ease-out forwards;
      `;

      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 2000);
    }
  }

  /**
   * Atualizar estatísticas rápidas do header
   */
  updateQuickStats(stats) {
    const gamesCount = document.getElementById('quickGamesCount');
    const winsCount = document.getElementById('quickWinsCount');
    const streakCount = document.getElementById('quickStreakCount');

    if (gamesCount) this.animateStatUpdate(gamesCount, stats.gamesPlayed || 0);
    if (winsCount) this.animateStatUpdate(winsCount, stats.gamesWon || 0);
    if (streakCount) this.animateStatUpdate(streakCount, stats.currentStreak || 0);
  }

  /**
   * Animar atualização de estatística
   */
  animateStatUpdate(element, newValue) {
    const oldValue = parseInt(element.textContent) || 0;
    if (oldValue === newValue) return;

    element.style.transform = 'scale(1.3)';
    element.style.color = 'var(--success-green)';

    const duration = 500;
    const steps = 10;
    const increment = (newValue - oldValue) / steps;
    let currentValue = oldValue;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      currentValue += increment;
      element.textContent = Math.round(currentValue);

      if (step >= steps) {
        clearInterval(interval);
        element.textContent = newValue;
      }
    }, duration / steps);

    setTimeout(() => {
      element.style.transform = '';
      element.style.color = '';
    }, duration + 200);
  }

  /**
   * Abrir configurações
   */
  openSettings() {
    this.createModal('settings', 'Configurações', this.renderSettingsContent());
    ConfigManager.log('Modal de configurações aberto');
  }

  /**
   * Abrir estatísticas detalhadas
   */
  openDetailedStats() {
    this.createModal('detailed-stats', 'Estatísticas Detalhadas', this.renderStatsContent());
    ConfigManager.log('Modal de estatísticas detalhadas aberto');
  }

  /**
   * Abrir ajuda
   */
  openHelp() {
    this.createModal('help', 'Como Jogar', this.renderHelpContent());
    ConfigManager.log('Modal de ajuda aberto');
  }

  /**
   * Alternar tema do jogo
   */
  cycleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    ConfigManager.log(`Tema alternado para ${newTheme}`);
  }

  /**
   * Criar modal genérico
   */
  createModal(id, title, content) {
    let modal = document.getElementById(id);
    if (modal) {
      modal.querySelector('.modal-title').textContent = title;
      modal.querySelector('.modal-content').innerHTML = content;
      modal.style.display = 'block';
      return;
    }

    modal = document.createElement('div');
    modal.id = id;
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-window">
        <header class="modal-header">
          <h2 class="modal-title">${title}</h2>
          <button class="modal-close" aria-label="Fechar modal">&times;</button>
        </header>
        <main class="modal-content">${content}</main>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', () => {
      modal.style.display = 'none';
    });

    modal.querySelector('.modal-overlay').addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  /**
   * Renderizar conteúdo das configurações
   */
  renderSettingsContent() {
    return `
      <p>Configurações do jogo aqui.</p>
    `;
  }

  /**
   * Renderizar conteúdo das estatísticas
   */
  renderStatsContent() {
    return `
      <p>Estatísticas detalhadas aqui.</p>
    `;
  }

  /**
   * Renderizar conteúdo de ajuda
   */
  renderHelpContent() {
    return `
      <p>Informações de como jogar aqui.</p>
    `;
  }
}

export default GameHeader;
