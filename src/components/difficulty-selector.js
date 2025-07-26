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
   * Configurar event listeners
   */
  setupEventListeners() {
    // Event listeners para os botões de dificuldade existentes no HTML
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    difficultyButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const difficulty = btn.dataset.difficulty;
        if (this.unlocked.includes(difficulty) && !this.isLocked) {
          this.selectDifficulty(difficulty);
        } else if (!this.unlocked.includes(difficulty)) {
          this.showUnlockRequirements(difficulty);
        }
      });

      btn.addEventListener('mouseenter', () => {
        const difficulty = btn.dataset.difficulty;
        if (this.unlocked.includes(difficulty)) {
          this.showDifficultyPreview(difficulty);
        }
      });

      btn.addEventListener('mouseleave', () => {
        this.hideDifficultyPreview();
      });
    });

    // Escutar eventos de mudança de dificuldade
    document.addEventListener('difficultyChanged', (e) => {
      this.handleExternalDifficultyChange(e.detail);
    });

    ConfigManager.log('Event listeners do difficulty selector configurados');
  }

  /**
   * Atualizar display
   */
  updateDisplay() {
    this.updateActiveButton();
    this.updateCurrentDifficultyInfo();
    this.updateButtonStates();
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

    this.updateActiveButton();
    this.updateCurrentDifficultyInfo();

    this.playSelectionEffect(difficulty);

    // Disparar evento de mudança de dificuldade
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
  updateActiveButton() {
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.classList.remove('active');
      
      if (btn.dataset.difficulty === this.currentDifficulty) {
        btn.classList.add('active');

        if (GameConfig.ANIMATIONS.enabled) {
          btn.style.transform = 'scale(1.05)';
          setTimeout(() => {
            btn.style.transform = '';
          }, 200);
        }
      }
    });
  }

  /**
   * Atualizar informações da dificuldade atual
   */
  updateCurrentDifficultyInfo() {
    const config = GameConfig.DIFFICULTY_LEVELS[this.currentDifficulty];
    if (!config) return;

    // Atualizar estatísticas da dificuldade no header
    const currentRange = document.getElementById('currentRange');
    const currentAttempts = document.getElementById('currentAttempts');
    const currentMultiplier = document.getElementById('currentMultiplier');

    if (currentRange) currentRange.textContent = `${config.min}-${config.max}`;
    if (currentAttempts) currentAttempts.textContent = config.maxAttempts;
    if (currentMultiplier) currentMultiplier.textContent = `${config.scoreMultiplier}x`;
  }

  /**
   * Atualizar estados dos botões
   */
  updateButtonStates() {
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
      const difficulty = btn.dataset.difficulty;
      const isUnlocked = this.unlocked.includes(difficulty);
      const isActive = difficulty === this.currentDifficulty;
      const isLocked = this.isLocked && !isActive;

      // Remover classes existentes
      btn.classList.remove('locked', 'disabled');

      // Adicionar classes conforme estado
      if (!isUnlocked) {
        btn.classList.add('locked');
        this.updateButtonForLocked(btn, difficulty);
      } else if (isLocked) {
        btn.classList.add('disabled');
      }

      // Atualizar conteúdo do botão se necessário
      if (isUnlocked) {
        this.updateButtonForUnlocked(btn, difficulty);
      }
    });
  }

  /**
   * Atualizar botão para estado bloqueado
   */
  updateButtonForLocked(btn, difficulty) {
    const footer = btn.querySelector('.btn-footer .btn-status');
    if (footer) {
      const requirement = this.getUnlockRequirement(difficulty);
      footer.textContent = `Ganhe ${requirement} jogos`;
    }

    // Adicionar ícone de cadeado se não existir
    let lockIcon = btn.querySelector('.lock-icon');
    if (!lockIcon) {
      lockIcon = document.createElement('div');
      lockIcon.className = 'lock-icon';
      lockIcon.textContent = '🔒';
      btn.querySelector('.btn-header').appendChild(lockIcon);
    }
  }

  /**
   * Atualizar botão para estado desbloqueado
   */
  updateButtonForUnlocked(btn) {
    const footer = btn.querySelector('.btn-footer .btn-status');
    if (footer) {
      footer.textContent = 'Disponível';
    }

    // Remover ícone de cadeado se existir
    const lockIcon = btn.querySelector('.lock-icon');
    if (lockIcon) {
      lockIcon.remove();
    }
  }

  /**
   * Mostrar preview da dificuldade
   */
  showDifficultyPreview(difficulty) {
    const config = GameConfig.DIFFICULTY_LEVELS[difficulty];
    
    // Criar tooltip com informações da dificuldade
    this.showTooltip(difficulty, `
      ${config.name}
      Intervalo: ${config.min}-${config.max}
      Tentativas: ${config.maxAttempts}
      Multiplicador: ${config.scoreMultiplier}x
    `);
  }

  /**
   * Esconder preview da dificuldade
   */
  hideDifficultyPreview() {
    this.hideTooltip();
  }

  /**
   * Mostrar requisitos de desbloqueio
   */
  showUnlockRequirements(difficulty) {
    const requirement = this.getUnlockRequirement(difficulty);
    const progress = this.getUnlockProgress(difficulty);
    const config = GameConfig.DIFFICULTY_LEVELS[difficulty];

    // Criar mensagem de requisito
    const message = `
      Para desbloquear ${config.name}, você precisa ganhar ${requirement} jogos.
      Progresso atual: ${Math.floor(progress)}%
    `;

    // Disparar evento de mensagem
    document.dispatchEvent(new CustomEvent('gameMessage', {
      detail: {
        text: message,
        type: 'info',
        options: { duration: 4000 }
      }
    }));

    // Tocar som de erro
    if (window.audioManager) {
      window.audioManager.play('error');
    }
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
   * Efeito de seleção
   */
  playSelectionEffect(difficulty) {
    if (!GameConfig.ANIMATIONS.enabled) return;

    // Tocar beep baseado na dificuldade
    if (window.audioManager) {
      window.audioManager.play('click');
    }

    // Vibração baseada na dificuldade
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

    this.updateButtonStates();

    // Disparar evento de desbloqueio
    document.dispatchEvent(new CustomEvent('difficultyUnlocked', {
      detail: { difficulty }
    }));

    // Mostrar mensagem de desbloqueio
    const config = GameConfig.DIFFICULTY_LEVELS[difficulty];
    document.dispatchEvent(new CustomEvent('gameMessage', {
      detail: {
        text: `Parabéns! Você desbloqueou a dificuldade ${config.name}!`,
        type: 'success',
        options: { duration: 5000 }
      }
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
    this.updateButtonStates();

    if (locked) {
      this.container.classList.add('locked');
    } else {
      this.container.classList.remove('locked');
    }
  }

  /**
   * Lidar com mudança externa de dificuldade
   */
  handleExternalDifficultyChange(detail) {
    if (detail.difficulty !== this.currentDifficulty) {
      this.currentDifficulty = detail.difficulty;
      this.updateDisplay();
    }
  }

  /**
   * Mostrar tooltip
   */
  showTooltip(difficulty, text) {
    let tooltip = document.getElementById('difficultyTooltip');
    
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'difficultyTooltip';
      tooltip.className = 'difficulty-tooltip';
      document.body.appendChild(tooltip);
    }

    tooltip.innerHTML = text.trim().split('\n').map(line => `<div>${line.trim()}</div>`).join('');
    tooltip.style.display = 'block';
    tooltip.style.opacity = '1';

    // Posicionar tooltip
    const btn = document.querySelector(`[data-difficulty="${difficulty}"]`);
    if (btn) {
      const rect = btn.getBoundingClientRect();
      tooltip.style.left = rect.left + 'px';
      tooltip.style.top = (rect.bottom + 10) + 'px';
    }
  }

  /**
   * Esconder tooltip
   */
  hideTooltip() {
    const tooltip = document.getElementById('difficultyTooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }

  /**
   * Limpar recursos
   */
  destroy() {
    this.hideTooltip();
    
    const tooltip = document.getElementById('difficultyTooltip');
    if (tooltip) {
      tooltip.remove();
    }

    ConfigManager.log('Difficulty Selector destruído');
  }
}

// Inicialização automática
document.addEventListener('DOMContentLoaded', () => {
  window.difficultySelector = new DifficultySelector();

  // Escutar atualizações de estatísticas para desbloquear dificuldades
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

  // Escutar mudanças de estado do jogo para bloquear/desbloquear seletor
  document.addEventListener('gameStateChanged', (e) => {
    const { isPlaying } = e.detail.gameState;
    if (window.difficultySelector) {
      window.difficultySelector.setLocked(isPlaying);
    }
  });
});

export default DifficultySelector;
