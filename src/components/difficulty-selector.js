/**
 * DIFFICULTY SELECTOR COMPONENT - Seletor de dificuldade do jogo
 * Arquivo: src/components/difficulty-selector.js
 */

import { GameConfig, ConfigManager } from '../js/config.js';
import { Utils } from '../js/utils.js';

export class DifficultySelector {
  constructor(containerId = 'difficultySection') {
    this.container = document.getElementById(containerId);
    this.currentDifficulty = 'easy';
    this.isLocked = false;
    this.unlocked = ['easy'];
    this.animationQueue = [];
    this.init();
  }

  /**
   * Inicialização do componente
   */
  init() {
    if (!this.container) {
      ConfigManager.error('Container do difficulty selector não encontrado!');
      return;
    }

    this.loadSavedDifficulty();
    this.loadUnlockedDifficulties();
    this.render();
    this.setupEventListeners();
    this.updateDisplay();

    ConfigManager.log('Difficulty Selector inicializado');
  }

  /**
   * Carregar dificuldade salva
   */
  loadSavedDifficulty() {
    this.currentDifficulty = ConfigManager.getCurrentDifficulty();
  }

  /**
   * Carregar dificuldades desbloqueadas
   */
  loadUnlockedDifficulties() {
    const saved = localStorage.getItem('secretNumber_unlockedDifficulties');
    if (saved) {
      try {
        this.unlocked = JSON.parse(saved);
      } catch (error) {
        ConfigManager.error('Erro ao carregar dificuldades desbloqueadas:', error);
      }
    }
  }

  /**
   * Renderizar seletor de dificuldade
   */
  render() {
    this.container.innerHTML = `
      <div class="difficulty-selector-content">
        <!-- Cabeçalho -->
        <div class="difficulty-header" id="difficultyHeader">
          <div class="header-content">
            <h3 class="section-title">
              <span class="title-icon"></span>
              <span class="title-text">Escolha a Dificuldade</span>
            </h3>
            <div class="difficulty-info" id="difficultyInfo">
              <span class="info-text">Selecione o nível de desafio</span>
            </div>
          </div>
          <div class="difficulty-stats" id="difficultyStats">
            <div class="stat-item">
              <span class="stat-icon"></span>
              <span class="stat-value" id="currentRange">1-10</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon"></span>
              <span class="stat-value" id="currentAttempts">5</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon"></span>
              <span class="stat-value" id="currentMultiplier">1x</span>
            </div>
          </div>
        </div>

        <!-- Seletor de Dificuldades -->
        <div class="difficulty-grid" id="difficultyGrid"></div>

        <!-- Informações Detalhadas -->
        <div class="difficulty-details" id="difficultyDetails">
          <div class="details-card">
            <div class="card-header">
              <span class="card-icon" id="detailsIcon"></span>
              <span class="card-title" id="detailsTitle"></span>
              <span class="card-badge" id="detailsBadge"></span>
            </div>
            <div class="card-content">
              <div class="detail-description" id="detailsDescription"></div>
              <div class="detail-features" id="detailsFeatures"></div>
              <div class="detail-rewards" id="detailsRewards"></div>
            </div>
          </div>
        </div>

        <!-- Sistema de Desbloqueio -->
        <div class="unlock-system" id="unlockSystem">
          <div class="unlock-progress">
            <div class="progress-header">
              <span class="progress-icon"></span>
              <span class="progress-title">Progresso de Desbloqueio</span>
            </div>
            <div class="unlock-tracks" id="unlockTracks"></div>
          </div>
        </div>

        <!-- Histórico de Performance -->
        <div class="performance-history" id="performanceHistory">
          <h5 class="history-title"></h5>
          <div class="history-grid" id="historyGrid"></div>
        </div>

        <!-- Dicas de Estratégia -->
        <div class="strategy-tips" id="strategyTips">
          <h5 class="tips-title"></h5>
          <div class="tips-container" id="tipsContainer">
            <div class="tip-card active" id="currentTip"></div>
          </div>
          <div class="tips-navigation">
            <button class="tip-nav-btn" id="prevTipBtn">‹</button>
            <div class="tip-indicators" id="tipIndicators"></div>
            <button class="tip-nav-btn" id="nextTipBtn">›</button>
          </div>
        </div>
      </div>
    `;

    this.container.classList.add('difficulty-selector-component');
  }

  /**
   * Configurar event listeners
   */
  setupEventListeners() {
    const prevTipBtn = document.getElementById('prevTipBtn');
    const nextTipBtn = document.getElementById('nextTipBtn');

    prevTipBtn?.addEventListener('click', () => this.showPreviousTip());
    nextTipBtn?.addEventListener('click', () => this.showNextTip());

    this.startTipsRotation();

    ConfigManager.log('Event listeners do difficulty selector configurados');
  }

  /**
   * Atualizar display
   */
  updateDisplay() {
    this.generateDifficultyButtons();
    this.updateCurrentDifficultyInfo();
    this.updateUnlockTracks();
    this.updatePerformanceHistory();
    this.generateStrategyTips();
  }

  /**
   * Gerar botões de dificuldade
   */
  generateDifficultyButtons() {
    const difficultyGrid = document.getElementById('difficultyGrid');
    if (!difficultyGrid) return;

    difficultyGrid.innerHTML = '';

    Object.entries(GameConfig.DIFFICULTY_LEVELS).forEach(([key, config]) => {
      const isUnlocked = this.unlocked.includes(key);
      const isActive = key === this.currentDifficulty;
      const isLocked = this.isLocked && !isActive;

      const button = document.createElement('button');
      button.className = `difficulty-btn ${isActive ? 'active' : ''} ${!isUnlocked ? 'locked' : ''} ${isLocked ? 'disabled' : ''}`;
      button.dataset.difficulty = key;

      button.innerHTML = `
        <div class="btn-header">
          <div class="btn-icon">${config.emoji}</div>
          <div class="btn-name">${config.name}</div>
          ${!isUnlocked ? '<div class="lock-icon">🔒</div>' : ''}
        </div>
        <div class="btn-details">
          <div class="detail-range">${config.min}-${config.max}</div>
          <div class="detail-attempts">${config.maxAttempts} tentativas</div>
          <div class="detail-multiplier">${config.scoreMultiplier}x pontos</div>
        </div>
        <div class="btn-footer">
          ${isUnlocked ? 
            `<div class="btn-status">Disponível</div>` : 
            `<div class="btn-unlock-req">Ganhe ${this.getUnlockRequirement(key)} jogos</div>`
          }
        </div>
        ${isActive ? '<div class="active-indicator"></div>' : ''}
        ${!isUnlocked ? '<div class="locked-overlay"></div>' : ''}
      `;

      if (isUnlocked && !isLocked) {
        button.addEventListener('click', () => this.selectDifficulty(key));
        button.addEventListener('mouseenter', () => this.showDifficultyPreview(key));
        button.addEventListener('mouseleave', () => this.hideDifficultyPreview());
      } else if (!isUnlocked) {
        button.addEventListener('click', () => this.showUnlockRequirements(key));
      }

      difficultyGrid.appendChild(button);
    });
  }

  /**
   * Selecionar dificuldade
   */
  selectDifficulty(difficulty) {
    if (!this.unlocked.includes(difficulty) || this.isLocked) {
      return;
    }

    const oldDifficulty = this.currentDifficulty;
    this.currentDifficulty = difficulty;

    ConfigManager.setCurrentDifficulty(difficulty);

    this.updateActiveButton(difficulty);
    this.updateCurrentDifficultyInfo();

    this.playSelectionEffect(difficulty);

    document.dispatchEvent(new CustomEvent('difficultyChanged', {
      detail: { 
        difficulty,
        oldDifficulty,
        config: GameConfig.DIFFICULTY_LEVELS[difficulty]
      }
    }));

    ConfigManager.log('Dificuldade selecionada:', difficulty);
  }

  /**
   * Atualizar botão ativo
   */
  updateActiveButton(difficulty) {
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    const selectedBtn = document.querySelector(`[data-difficulty="${difficulty}"]`);
    if (selectedBtn) {
      selectedBtn.classList.add('active');

      if (GameConfig.ANIMATIONS.enabled) {
        selectedBtn.style.transform = 'scale(1.05)';
        setTimeout(() => {
          selectedBtn.style.transform = '';
        }, 200);
      }
    }
  }

  /**
   * Atualizar informações da dificuldade atual
   */
  updateCurrentDifficultyInfo() {
    const config = GameConfig.DIFFICULTY_LEVELS[this.currentDifficulty];
    if (!config) return;

    const currentRange = document.getElementById('currentRange');
    const currentAttempts = document.getElementById('currentAttempts');
    const currentMultiplier = document.getElementById('currentMultiplier');

    if (currentRange) currentRange.textContent = `${config.min}-${config.max}`;
    if (currentAttempts) currentAttempts.textContent = config.maxAttempts;
    if (currentMultiplier) currentMultiplier.textContent = `${config.scoreMultiplier}x`;

    this.updateDetailsCard(config);
  }

  /**
   * Atualizar card de detalhes
   */
  updateDetailsCard(config) {
    const detailsIcon = document.getElementById('detailsIcon');
    const detailsTitle = document.getElementById('detailsTitle');
    const detailsBadge = document.getElementById('detailsBadge');
    const detailsDescription = document.getElementById('detailsDescription');
    const detailsFeatures = document.getElementById('detailsFeatures');
    const detailsRewards = document.getElementById('detailsRewards');

    if (detailsIcon) detailsIcon.textContent = config.emoji;
    if (detailsTitle) detailsTitle.textContent = config.name;

    const badges = {
      easy: 'Recomendado',
      medium: 'Equilibrado',
      hard: 'Desafiador',
      expert: 'Extremo'
    };
    if (detailsBadge) detailsBadge.textContent = badges[this.currentDifficulty] || '';

    const descriptions = {
      easy: 'Perfeito para iniciantes. Números entre 1 e 10 com 5 tentativas.',
      medium: 'Dificuldade balanceada. Números entre 1 e 100 com 8 tentativas.',
      hard: 'Para jogadores experientes. Números entre 1 e 1000 com 12 tentativas.',
      expert: 'O desafio supremo. Números entre 1 e 5000 com 15 tentativas.'
    };
    if (detailsDescription) {
      detailsDescription.textContent = descriptions[this.currentDifficulty] || '';
    }

    this.updateFeatures(config);
    this.updateRewards(config);
  }

  /**
   * Atualizar features
   */
  updateFeatures(config) {
    const detailsFeatures = document.getElementById('detailsFeatures');
    if (!detailsFeatures) return;

    const features = this.getDifficultyFeatures(this.currentDifficulty);

    detailsFeatures.innerHTML = features.map(feature => `
      <div class="feature-item">
        <span class="feature-icon">${feature.icon}</span>
        <span class="feature-text">${feature.text}</span>
      </div>
    `).join('');
  }

  /**
   * Atualizar recompensas
   */
  updateRewards(config) {
    const detailsRewards = document.getElementById('detailsRewards');
    if (!detailsRewards) return;

    const baseReward = 1000 * config.scoreMultiplier;
    const rewards = [
      `+${Utils.formatScore(baseReward)} pontos base`,
      `Multiplicador ${config.scoreMultiplier}x`,
      this.currentDifficulty === 'expert' ? 'Conquistas exclusivas' : 'Conquistas progressivas'
    ];

    detailsRewards.innerHTML = `
      <h5 class="rewards-title">Recompensas:</h5>
      <div class="rewards-list">
        ${rewards.map(reward => `<span class="reward-item">${reward}</span>`).join('')}
      </div>
    `;
  }

  /**
   * Atualizar trilhas de desbloqueio
   */
  updateUnlockTracks() {
    const unlockTracks = document.getElementById('unlockTracks');
    if (!unlockTracks) return;

    const difficulties = Object.keys(GameConfig.DIFFICULTY_LEVELS);
    unlockTracks.innerHTML = '';

    difficulties.forEach((difficulty, index) => {
      const isUnlocked = this.unlocked.includes(difficulty);
      const requirement = this.getUnlockRequirement(difficulty);
      const progress = this.getUnlockProgress(difficulty);

      const track = document.createElement('div');
      track.className = `unlock-track ${isUnlocked ? 'unlocked' : 'locked'}`;
      track.innerHTML = `
        <div class="track-icon">${GameConfig.DIFFICULTY_LEVELS[difficulty].emoji}</div>
        <div class="track-content">
          <div class="track-name">${GameConfig.DIFFICULTY_LEVELS[difficulty].name}</div>
          <div class="track-requirement">
            ${isUnlocked ? 'Desbloqueado' : `Ganhe ${requirement} jogos`}
          </div>
          ${!isUnlocked ? `
            <div class="track-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
              </div>
              <span class="progress-text">${progress}%</span>
            </div>
          ` : ''}
        </div>
        ${index < difficulties.length - 1 ? '<div class="track-connector"></div>' : ''}
      `;

      unlockTracks.appendChild(track);
    });
  }

  /**
   * Atualizar histórico de performance
   */
  updatePerformanceHistory() {
    const historyGrid = document.getElementById('historyGrid');
    if (!historyGrid) return;

    const stats = JSON.parse(localStorage.getItem(GameConfig.STORAGE.keys.stats) || '{}');
    const byDifficulty = stats.byDifficulty || {};

    historyGrid.innerHTML = '';

    Object.entries(GameConfig.DIFFICULTY_LEVELS).forEach(([key, config]) => {
      const diffStats = byDifficulty[key] || { played: 0, won: 0, bestScore: 0 };
      const winRate = diffStats.played > 0 ? ((diffStats.won / diffStats.played) * 100).toFixed(1) : '0.0';
      const isUnlocked = this.unlocked.includes(key);

      const historyCard = document.createElement('div');
      historyCard.className = `history-card ${!isUnlocked ? 'locked' : ''}`;
      historyCard.innerHTML = `
        <div class="history-header">
          <span class="history-emoji">${config.emoji}</span>
          <span class="history-name">${config.name}</span>
        </div>
        ${isUnlocked ? `
          <div class="history-stats">
            <div class="history-stat">
              <span class="stat-label">Jogados:</span>
              <span class="stat-value">${diffStats.played}</span>
            </div>
            <div class="history-stat">
              <span class="stat-label">Ganhos:</span>
              <span class="stat-value">${diffStats.won}</span>
            </div>
            <div class="history-stat">
              <span class="stat-label">Taxa:</span>
              <span class="stat-value">${winRate}%</span>
            </div>
            <div class="history-stat">
              <span class="stat-label">Melhor:</span>
              <span class="stat-value">${Utils.formatScore(diffStats.bestScore)}</span>
            </div>
          </div>
          <div class="history-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${winRate}%; background: ${config.color}"></div>
            </div>
          </div>
        ` : `
          <div class="locked-message">
            <div class="lock-icon">🔒</div>
            <div class="lock-text">Desbloqueie para ver estatísticas</div>
          </div>
        `}
      `;

      historyGrid.appendChild(historyCard);
    });
  }

  /**
   * Gerar dicas de estratégia
   */
  generateStrategyTips() {
    this.strategyTips = [
      {
        icon: '🎯',
        title: 'Estratégia Binária',
        description: 'Comece sempre pelo meio do intervalo para eliminar metade das possibilidades.'
      },
      {
        icon: '🧠',
        title: 'Memorize Padrões',
        description: 'Observe os padrões de números que aparecem com mais frequência.'
      },
      {
        icon: '⏱️',
        title: 'Gestão de Tempo',
        description: 'Não se apresse. Pense bem antes de cada tentativa para maximizar a pontuação.'
      },
      {
        icon: '💡',
        title: 'Use Dicas Sabiamente',
        description: 'Economize dicas para momentos cruciais ou quando estiver com poucas tentativas.'
      },
      {
        icon: '📊',
        title: 'Análise de Proximidade',
        description: 'Preste atenção às dicas de "quente" e "frio" para ajustar sua estratégia.'
      }
    ];

    this.currentTipIndex = 0;
    this.updateTipIndicators();
    this.showCurrentTip();
  }

  /**
   * Mostrar dica atual
   */
  showCurrentTip() {
    const currentTip = document.getElementById('currentTip');
    if (!currentTip || !this.strategyTips) return;

    const tip = this.strategyTips[this.currentTipIndex];

    currentTip.innerHTML = `
      <div class="tip-icon">${tip.icon}</div>
      <div class="tip-content">
        <div class="tip-title">${tip.title}</div>
        <div class="tip-description">${tip.description}</div>
      </div>
    `;

    if (GameConfig.ANIMATIONS.enabled) {
      currentTip.style.opacity = '0';
      currentTip.style.transform = 'translateX(20px)';

      requestAnimationFrame(() => {
        currentTip.style.transition = 'all 0.3s ease';
        currentTip.style.opacity = '1';
        currentTip.style.transform = 'translateX(0)';
      });
    }
  }

  /**
   * Próxima dica
   */
  showNextTip() {
    if (!this.strategyTips) return;

    this.currentTipIndex = (this.currentTipIndex + 1) % this.strategyTips.length;
    this.showCurrentTip();
    this.updateTipIndicators();
  }

  /**
   * Dica anterior
   */
  showPreviousTip() {
    if (!this.strategyTips) return;

    this.currentTipIndex = this.currentTipIndex === 0 ?
      this.strategyTips.length - 1 :
      this.currentTipIndex - 1;
    this.showCurrentTip();
    this.updateTipIndicators();
  }

  /**
   * Atualizar indicadores de dicas
   */
  updateTipIndicators() {
    const tipIndicators = document.getElementById('tipIndicators');
    if (!tipIndicators || !this.strategyTips) return;

    tipIndicators.innerHTML = this.strategyTips.map((_, index) =>
      `<div class="tip-indicator ${index === this.currentTipIndex ? 'active' : ''}"></div>`
    ).join('');
  }

  /**
   * Iniciar rotação automática de dicas
   */
  startTipsRotation() {
    if (this.tipsInterval) {
      clearInterval(this.tipsInterval);
    }

    this.tipsInterval = setInterval(() => {
      this.showNextTip();
    }, 8000);
  }

  /**
   * Mostrar preview da dificuldade
   */
  showDifficultyPreview(difficulty) {
    ConfigManager.log('Preview da dificuldade:', difficulty);
  }

  /**
   * Esconder preview da dificuldade
   */
  hideDifficultyPreview() {}

  /**
   * Mostrar requisitos de desbloqueio
   */
  showUnlockRequirements(difficulty) {
    const requirement = this.getUnlockRequirement(difficulty);
    const progress = this.getUnlockProgress(difficulty);

    const modal = document.createElement('div');
    modal.className = 'unlock-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${GameConfig.DIFFICULTY_LEVELS[difficulty].name} Bloqueado</h3>
          <button class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="unlock-info">
            <div class="unlock-icon">${GameConfig.DIFFICULTY_LEVELS[difficulty].emoji}</div>
            <div class="unlock-details">
              <p>Para desbloquear este nível, você precisa:</p>
              <div class="requirement">Ganhar ${requirement} jogos</div>
              <div class="progress-section">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="progress-text">${progress}% completo</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    setTimeout(() => modal.remove(), 5000);
  }

  /**
   * Obter requisito de desbloqueio
   */
  getUnlockRequirement(difficulty) {
    const requirements = {
      easy: 0,
      medium: 3,
      hard: 10,
      expert: 25
    };

    return requirements[difficulty] || 0;
  }

  /**
   * Obter progresso de desbloqueio
   */
  getUnlockProgress(difficulty) {
    const requirement = this.getUnlockRequirement(difficulty);
    if (requirement === 0) return 100;

    const stats = JSON.parse(localStorage.getItem(GameConfig.STORAGE.keys.stats) || '{}');
    const currentWins = stats.gamesWon || 0;

    return Math.min((currentWins / requirement) * 100, 100);
  }

  /**
   * Obter features da dificuldade
   */
  getDifficultyFeatures(difficulty) {
    const features = {
      easy: [
        { icon: '🎯', text: 'Intervalo pequeno' },
        { icon: '⏱️', text: 'Sem pressão de tempo' },
        { icon: '💡', text: 'Dicas disponíveis' }
      ],
      medium: [
        { icon: '⚖️', text: 'Equilibrio perfeito' },
        { icon: '🧠', text: 'Requer estratégia' },
        { icon: '⭐', text: 'Bônus moderados' }
      ],
      hard: [
        { icon: '🔥', text: 'Desafio intenso' },
        { icon: '💎', text: 'Recompensas maiores' },
        { icon: '🎖️', text: 'Para especialistas' }
      ],
      expert: [
        { icon: '👑', text: 'Dificuldade suprema' },
        { icon: '🏆', text: 'Máximas recompensas' },
        { icon: '🌟', text: 'Conquistas exclusivas' }
      ]
    };

    return features[difficulty] || [];
  }

  /**
   * Efeito de seleção
   */
  playSelectionEffect(difficulty) {
    if (!GameConfig.ANIMATIONS.enabled) return;

    Utils.playBeep({
      easy: 800,
      medium: 900,
      hard: 1000,
      expert: 1200
    }[difficulty] || 800, 200);

    Utils.vibrate({
      easy: [50],
      medium: [50, 50, 50],
      hard: [100, 50, 100],
      expert: [150, 50, 150, 50, 150]
    }[difficulty] || [50]);
  }

  /**
   * Desbloquear dificuldade
   */
  unlockDifficulty(difficulty) {
    if (this.unlocked.includes(difficulty)) return;

    this.unlocked.push(difficulty);
    this.saveUnlockedDifficulties();

    this.updateDisplay();

    document.dispatchEvent(new CustomEvent('difficultyUnlocked', {
      detail: { difficulty }
    }));

    ConfigManager.log('Dificuldade desbloqueada:', difficulty);
  }

  /**
   * Salvar dificuldades desbloqueadas
   */
  saveUnlockedDifficulties() {
    localStorage.setItem('secretNumber_unlockedDifficulties', JSON.stringify(this.unlocked));
  }

  /**
   * Bloquear/desbloquear seletor
   */
  setLocked(locked) {
    this.isLocked = locked;

    document.querySelectorAll('.difficulty-btn').forEach(btn => {
      if (locked && !btn.classList.contains('active')) {
        btn.classList.add('disabled');
      } else {
        btn.classList.remove('disabled');
      }
    });

    if (locked) {
      this.container.classList.add('locked');
    } else {
      this.container.classList.remove('locked');
    }
  }

  /**
   * Limpar recursos
   */
  destroy() {
    if (this.tipsInterval) {
      clearInterval(this.tipsInterval);
    }

    ConfigManager.log('Difficulty Selector destruído');
  }
}

// Inicialização automática
document.addEventListener('DOMContentLoaded', () => {
  window.difficultySelector = new DifficultySelector();

  document.addEventListener('statsUpdated', (e) => {
    const stats = e.detail.stats;
    if (window.difficultySelector && stats.gamesWon) {
      if (stats.gamesWon >= 3 && !window.difficultySelector.unlocked.includes('medium')) {
        window.difficultySelector.unlockDifficulty('medium');
      }
      if (stats.gamesWon >= 10 && !window.difficultySelector.unlocked.includes('hard')) {
        window.difficultySelector.unlockDifficulty('hard');
      }
      if (stats.gamesWon >= 25 && !window.difficultySelector.unlocked.includes('expert')) {
        window.difficultySelector.unlockDifficulty('expert');
      }
    }
  });

  document.addEventListener('gameStateChanged', (e) => {
    const { isPlaying } = e.detail.gameState;
    if (window.difficultySelector) {
      window.difficultySelector.setLocked(isPlaying);
    }
  });
});

export default DifficultySelector;
