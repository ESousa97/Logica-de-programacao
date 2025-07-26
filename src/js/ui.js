/**
 * UI MANAGER - Gerenciamento de interface do usuário
 * Arquivo: src/js/ui.js
 */

import { GameConfig, ConfigManager } from './config.js';
import { Utils } from './utils.js';

export class UIManager {
  constructor() {
    this.elements = {};
    this.currentTheme = 'neon';
    this.animationsEnabled = true;
    this.init();
  }

  /**
   * Inicialização do UI Manager
   */
  init() {
    ConfigManager.log('Inicializando UI Manager...');

    this.cacheElements();
    this.loadTheme();
    this.setupGlobalListeners();
    this.initializeAnimations();

    ConfigManager.log('UI Manager inicializado com sucesso!');
  }

  /**
   * Cache de elementos DOM
   */
  cacheElements() {
    this.elements = {
      // Containers principais
      gameContainer: document.getElementById('gameContainer'),
      gameHeader: document.getElementById('gameHeader'),
      gameBoard: document.getElementById('gameBoard'),

      // Informações do jogo
      gameStatus: document.getElementById('gameStatus'),
      rangeDisplay: document.getElementById('rangeDisplay'),
      attemptsDisplay: document.getElementById('attemptsDisplay'),
      scoreDisplay: document.getElementById('scoreDisplay'),

      // Input e controles
      numberInput: document.getElementById('numberInput'),
      submitBtn: document.getElementById('submitBtn'),
      newGameBtn: document.getElementById('newGameBtn'),

      // Dificuldade
      difficultySelector: document.getElementById('difficultySelector'),
      difficultyButtons: document.querySelectorAll('.difficulty-btn'),

      // Mensagens
      messageArea: document.getElementById('messageArea'),
      gameMessage: document.getElementById('gameMessage'),

      // Estatísticas
      statsPanel: document.getElementById('statsPanel'),
      totalGames: document.getElementById('totalGames'),
      totalWins: document.getElementById('totalWins'),
      winRate: document.getElementById('winRate'),
      bestScore: document.getElementById('bestScore'),
      avgAttempts: document.getElementById('avgAttempts'),

      // Modal de vitória
      victoryModal: document.getElementById('victoryModal'),
      victoryMessage: document.getElementById('victoryMessage'),
      victoryNumber: document.getElementById('victoryNumber'),
      victoryAttempts: document.getElementById('victoryAttempts'),
      victoryScore: document.getElementById('victoryScore'),
      playAgainBtn: document.getElementById('playAgainBtn'),
      closeModalBtn: document.getElementById('closeModalBtn'),

      // Partículas
      particles: document.getElementById('particles')
    };

    ConfigManager.log('Elementos DOM cacheados');
  }

  /**
   * Carregar tema
   */
  loadTheme() {
    this.currentTheme = ConfigManager.getTheme();
    this.applyTheme(this.currentTheme);
  }

  /**
   * Aplicar tema
   */
  applyTheme(themeName) {
    const theme = GameConfig.THEMES[themeName];
    if (!theme) return;

    const root = document.documentElement;

    // Aplicar cores do tema
    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });

    // Adicionar classe do tema ao body
    document.body.className = document.body.className.replace(/theme-\w+/, '');
    document.body.classList.add(`theme-${themeName}`);

    this.currentTheme = themeName;
    ConfigManager.log('Tema aplicado:', themeName);
  }

  /**
   * Configurar listeners globais
   */
  setupGlobalListeners() {
    // Redimensionamento da janela
    window.addEventListener('resize', Utils.debounce(() => {
      this.handleResize();
    }, 250));

    // Mudança de orientação (mobile)
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.handleResize(), 100);
    });

    // Visibilidade da página
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });

    // Detectar modo escuro/claro do sistema
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        this.handleColorSchemeChange(e.matches);
      });
    }
  }

  /**
   * Inicializar animações
   */
  initializeAnimations() {
    // Verificar preferência do usuário por animações reduzidas
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.animationsEnabled = !prefersReducedMotion.matches;

    prefersReducedMotion.addEventListener('change', (e) => {
      this.animationsEnabled = !e.matches;
      this.toggleAnimations(this.animationsEnabled);
    });

    // Aplicar animações de entrada
    this.playEntryAnimations();
  }

  /**
   * Atualizar informações do jogo
   */
  updateGameInfo(gameState, difficultyConfig) {
    // Status do jogo
    const statusText = this.getGameStatusText(gameState);
    this.updateElement(this.elements.gameStatus, statusText);

    // Intervalo de números
    const rangeText = `${difficultyConfig.min} - ${difficultyConfig.max}`;
    this.updateElement(this.elements.rangeDisplay, rangeText);

    // Tentativas
    const attemptsText = `${gameState.attempts}/${difficultyConfig.maxAttempts}`;
    this.updateElement(this.elements.attemptsDisplay, attemptsText);

    // Pontuação
    this.updateElement(this.elements.scoreDisplay, this.formatScore(gameState.score));

    // Atualizar cores baseadas no progresso
    this.updateProgressColors(gameState, difficultyConfig);

    ConfigManager.log('Informações do jogo atualizadas');
  }

  /**
   * Obter texto do status do jogo
   */
  getGameStatusText(gameState) {
    if (gameState.isGameOver) {
      return gameState.attempts <= gameState.maxAttempts ?
        'Parabéns! Você ganhou!' :
        'Fim de jogo!';
    }

    if (gameState.isPaused) {
      return 'Jogo pausado';
    }

    if (gameState.isPlaying) {
      const remaining = gameState.maxAttempts - gameState.attempts;
      return `${remaining} tentativa${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}`;
    }

    return 'Pronto para começar!';
  }

  /**
   * Atualizar cores baseadas no progresso
   */
  updateProgressColors(gameState, difficultyConfig) {
    const progressRatio = gameState.attempts / difficultyConfig.maxAttempts;

    // Mudar cor das tentativas baseado no progresso
    const attemptsElement = this.elements.attemptsDisplay;
    if (attemptsElement) {
      attemptsElement.className = 'detail-value';

      if (progressRatio > 0.8) {
        attemptsElement.classList.add('danger');
      } else if (progressRatio > 0.6) {
        attemptsElement.classList.add('warning');
      } else {
        attemptsElement.classList.add('success');
      }
    }
  }

  /**
   * Mostrar mensagem
   */
  showMessage(text, type = 'info', duration = 4000) {
    if (!this.elements.gameMessage) return;

    // Limpar classes anteriores
    this.elements.gameMessage.className = 'message';

    // Adicionar nova classe de tipo
    this.elements.gameMessage.classList.add(`message-${type}`);

    // Atualizar texto
    this.elements.gameMessage.textContent = text;

    // Animar entrada da mensagem
    if (this.animationsEnabled) {
      this.elements.gameMessage.style.opacity = '0';
      this.elements.gameMessage.style.transform = 'translateY(20px)';

      requestAnimationFrame(() => {
        this.elements.gameMessage.style.transition = 'all 0.3s ease';
        this.elements.gameMessage.style.opacity = '1';
        this.elements.gameMessage.style.transform = 'translateY(0)';
      });
    }

    // Auto-ocultar mensagem após duration
    if (duration > 0) {
      setTimeout(() => {
        this.fadeOutMessage();
      }, duration);
    }

    ConfigManager.log('Mensagem exibida:', text, type);
  }

  /**
   * Fade out da mensagem
   */
  fadeOutMessage() {
    if (!this.elements.gameMessage || !this.animationsEnabled) return;

    this.elements.gameMessage.style.transition = 'opacity 0.5s ease';
    this.elements.gameMessage.style.opacity = '0';
  }

  /**
   * Atualizar seletor de dificuldade
   */
  updateDifficultySelector(selectedDifficulty) {
    this.elements.difficultyButtons.forEach(btn => {
      btn.classList.remove('active');

      if (btn.dataset.difficulty === selectedDifficulty) {
        btn.classList.add('active');

        // Efeito visual de seleção
        if (this.animationsEnabled) {
          btn.style.transform = 'scale(1.05)';
          setTimeout(() => {
            btn.style.transform = '';
          }, 200);
        }
      }
    });

    ConfigManager.log('Seletor de dificuldade atualizado:', selectedDifficulty);
  }

  /**
   * Atualizar estatísticas
   */
  updateStats(stats) {
    // Calcular estatísticas derivadas
    const winRate = stats.gamesPlayed > 0 ?
      ((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(1) : '0.0';

    const avgAttempts = stats.gamesWon > 0 ?
      (stats.totalAttempts / stats.gamesWon).toFixed(1) : '0.0';

    // Atualizar elementos
    this.updateElement(this.elements.totalGames, stats.gamesPlayed);
    this.updateElement(this.elements.totalWins, stats.gamesWon);
    this.updateElement(this.elements.winRate, `${winRate}%`);
    this.updateElement(this.elements.bestScore, this.formatScore(stats.bestScore));
    this.updateElement(this.elements.avgAttempts, avgAttempts);

    // Animar contadores se habilitado
    if (this.animationsEnabled) {
      this.animateCounters();
    }

    ConfigManager.log('Estatísticas atualizadas');
  }

  /**
   * Animar contadores
   */
  animateCounters() {
    const counterElements = [
      this.elements.totalGames,
      this.elements.totalWins,
      this.elements.bestScore
    ];

    counterElements.forEach(element => {
      if (!element) return;

      element.style.transform = 'scale(1.1)';
      element.style.transition = 'transform 0.2s ease';

      setTimeout(() => {
        element.style.transform = 'scale(1)';
      }, 200);
    });
  }

  /**
   * Mostrar modal de vitória
   */
  showVictoryModal(gameState) {
    if (!this.elements.victoryModal) return;

    // Atualizar conteúdo do modal
    this.updateElement(this.elements.victoryNumber, gameState.secretNumber);
    this.updateElement(this.elements.victoryAttempts, gameState.attempts);
    this.updateElement(this.elements.victoryScore, this.formatScore(gameState.score));

    // Mensagem personalizada baseada na performance
    const victoryMsg = this.getVictoryMessage(gameState);
    this.updateElement(this.elements.victoryMessage, victoryMsg);

    // Mostrar modal com animação
    this.elements.victoryModal.style.display = 'flex';

    if (this.animationsEnabled) {
      this.elements.victoryModal.style.opacity = '0';

      requestAnimationFrame(() => {
        this.elements.victoryModal.style.transition = 'opacity 0.3s ease';
        this.elements.victoryModal.style.opacity = '1';
      });
    }

    // Focar no botão "Jogar Novamente"
    setTimeout(() => {
      this.elements.playAgainBtn?.focus();
    }, 300);

    ConfigManager.log('Modal de vitória exibido');
  }

  /**
   * Obter mensagem de vitória personalizada
   */
  getVictoryMessage(gameState) {
    const { attempts, score, streak } = gameState;

    if (attempts === 1) {
      return 'INCRÍVEL! Você acertou de primeira! Você é um verdadeiro mestre!';
    } else if (attempts <= 3) {
      return 'EXCELENTE! Pouquíssimas tentativas! Sua intuição é impressionante!';
    } else if (score > 800) {
      return 'ÓTIMO! Pontuação fantástica! Continue assim!';
    } else if (streak >= 3) {
      return `SEQUÊNCIA INCRÍVEL! ${streak} vitórias seguidas! Você está em chamas!`;
    } else {
      return 'PARABÉNS! Você descobriu o número secreto! Muito bem jogado!';
    }
  }

  /**
   * Esconder modal de vitória
   */
  hideVictoryModal() {
    if (!this.elements.victoryModal) return;

    if (this.animationsEnabled) {
      this.elements.victoryModal.style.transition = 'opacity 0.3s ease';
      this.elements.victoryModal.style.opacity = '0';

      setTimeout(() => {
        this.elements.victoryModal.style.display = 'none';
      }, 300);
    } else {
      this.elements.victoryModal.style.display = 'none';
    }

    // Focar de volta no input
    this.focusInput();

    ConfigManager.log('Modal de vitória escondido');
  }

  /**
   * Mostrar efeito de vitória
   */
  showVictoryEffect() {
    if (!this.animationsEnabled) return;

    // Efeito de celebração no container
    this.elements.gameContainer?.classList.add('victory-animation');

    // Criar confetes
    this.createConfetti();

    // Efeito de pulso na pontuação
    this.elements.scoreDisplay?.classList.add('animate-pulse');

    // Remover efeitos após animação
    setTimeout(() => {
      this.elements.gameContainer?.classList.remove('victory-animation');
      this.elements.scoreDisplay?.classList.remove('animate-pulse');
    }, 2000);

    ConfigManager.log('Efeito de vitória ativado');
  }

  /**
   * Criar confetes
   */
  createConfetti() {
    if (!this.elements.particles) return;

    const colors = ['#FF6B35', '#00E5FF', '#7B68EE', '#00FF88', '#FF10F0'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.style.position = 'absolute';
      confetti.style.width = '10px';
      confetti.style.height = '10px';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.top = '-10px';
      confetti.style.borderRadius = '50%';
      confetti.style.animation = `confetti ${2 + Math.random() * 3}s ease-out forwards`;
      confetti.style.zIndex = '1000';

      this.elements.particles.appendChild(confetti);

      setTimeout(() => {
        confetti.remove();
      }, 5000);
    }
  }

  /**
   * Mostrar efeito de resposta errada
   */
  showWrongAnswerEffect() {
    if (!this.animationsEnabled || !this.elements.numberInput) return;

    // Efeito de shake no input
    this.elements.numberInput.classList.add('animate-shake');

    // Efeito de vibração visual no container
    this.elements.gameContainer?.classList.add('animate-shake');

    setTimeout(() => {
      this.elements.numberInput?.classList.remove('animate-shake');
      this.elements.gameContainer?.classList.remove('animate-shake');
    }, 600);

    ConfigManager.log('Efeito de resposta errada ativado');
  }

  /**
   * Focar no input
   */
  focusInput() {
    if (this.elements.numberInput && GameConfig.UI.autoFocus) {
      setTimeout(() => {
        this.elements.numberInput.focus();
        this.elements.numberInput.select();
      }, 100);
    }
  }

  /**
   * Resetar input
   */
  resetInput() {
    if (this.elements.numberInput) {
      this.elements.numberInput.value = '';
      this.elements.numberInput.classList.remove('invalid');
    }

    // Resetar estado dos botões
    if (this.elements.submitBtn) {
      this.elements.submitBtn.disabled = false;
      this.elements.submitBtn.textContent = 'Tentar';
    }
  }

  /**
   * Formatar pontuação
   */
  formatScore(score) {
    return score.toLocaleString('pt-BR');
  }

  /**
   * Atualizar elemento com verificação
   */
  updateElement(element, content) {
    if (element && content !== undefined) {
      if (typeof content === 'number') {
        if (this.animationsEnabled && element.textContent !== content.toString()) {
          this.animateNumberChange(element, content);
        } else {
          element.textContent = content;
        }
      } else {
        element.textContent = content;
      }
    }
  }

  /**
   * Animar mudança de números
   */
  animateNumberChange(element, targetValue) {
    const currentValue = parseInt(element.textContent) || 0;
    const difference = targetValue - currentValue;
    const duration = 300;
    const steps = 20;
    const stepValue = difference / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const newValue = Math.round(currentValue + (stepValue * currentStep));
      element.textContent = newValue;

      if (currentStep >= steps) {
        clearInterval(timer);
        element.textContent = targetValue;
      }
    }, stepDuration);
  }

  /**
   * Reproduzir animações de entrada
   */
  playEntryAnimations() {
    if (!this.animationsEnabled) return;

    const animatedElements = [
      { element: this.elements.gameHeader, delay: 0, animation: 'animate-fade-in' },
      { element: this.elements.difficultySelector, delay: 200, animation: 'animate-slide-in-left' },
      { element: this.elements.gameBoard, delay: 400, animation: 'animate-scale-in' },
      { element: this.elements.statsPanel, delay: 600, animation: 'animate-slide-in-right' }
    ];

    animatedElements.forEach(({ element, delay, animation }) => {
      if (element) {
        setTimeout(() => {
          element.classList.add(animation);
        }, delay);
      }
    });
  }

  /**
   * Lidar com redimensionamento
   */
  handleResize() {
    if (this.elements.particles) {
      Utils.updateParticles(this.elements.particles);
    }

    if (this.elements.victoryModal &&
      this.elements.victoryModal.style.display === 'flex') {
      this.adjustModalPosition();
    }

    ConfigManager.log('UI ajustada para novo tamanho');
  }

  /**
   * Ajustar posição do modal
   */
  adjustModalPosition() {
    const modal = this.elements.victoryModal;
    if (!modal) return;

    const isMobile = window.innerWidth <= 768;
    const modalContent = modal.querySelector('.modal-content');

    if (modalContent) {
      if (isMobile) {
        modalContent.style.margin = '1rem';
        modalContent.style.maxHeight = '90vh';
        modalContent.style.overflow = 'auto';
      } else {
        modalContent.style.margin = '';
        modalContent.style.maxHeight = '';
        modalContent.style.overflow = '';
      }
    }
  }

  /**
   * Lidar com mudança de visibilidade
   */
  handleVisibilityChange() {
    if (document.hidden) {
      this.pauseHeavyAnimations();
    } else {
      this.resumeHeavyAnimations();
    }
  }

  /**
   * Pausar animações pesadas
   */
  pauseHeavyAnimations() {
    if (this.elements.particles) {
      this.elements.particles.style.animationPlayState = 'paused';
    }

    document.querySelectorAll('.floating-particles .particle').forEach(particle => {
      particle.style.animationPlayState = 'paused';
    });
  }

  /**
   * Retomar animações pesadas
   */
  resumeHeavyAnimations() {
    if (this.elements.particles) {
      this.elements.particles.style.animationPlayState = 'running';
    }

    document.querySelectorAll('.floating-particles .particle').forEach(particle => {
      particle.style.animationPlayState = 'running';
    });
  }

  /**
   * Lidar com mudança de esquema de cores
   */
  handleColorSchemeChange(isDark) {
    const settings = ConfigManager.getSettings();

    if (settings.autoTheme) {
      const newTheme = isDark ? 'dark' : 'neon';
      this.applyTheme(newTheme);
      ConfigManager.saveSettings({ ...settings, theme: newTheme });
    }
  }

  /**
   * Alternar animações
   */
  toggleAnimations(enabled) {
    this.animationsEnabled = enabled;

    if (enabled) {
      document.body.classList.remove('no-animations');
    } else {
      document.body.classList.add('no-animations');
    }

    if (this.elements.particles) {
      this.elements.particles.style.display = enabled ? 'block' : 'none';
    }
  }

  /**
   * Detectar dispositivo móvel
   */
  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768;
  }

  /**
   * Atualizar estado dos controles
   */
  updateControlsState(gameState) {
    const { isPlaying, isGameOver, isPaused } = gameState;

    if (this.elements.submitBtn) {
      this.elements.submitBtn.disabled = !isPlaying || isGameOver || isPaused;
    }

    if (this.elements.numberInput) {
      this.elements.numberInput.disabled = !isPlaying || isGameOver || isPaused;
    }

    this.elements.difficultyButtons.forEach(btn => {
      btn.disabled = isPlaying && !isGameOver;
    });
  }

  /**
   * Mostrar indicador de loading
   */
  showLoading(message = 'Carregando...') {
    let loadingOverlay = document.getElementById('loadingOverlay');

    if (!loadingOverlay) {
      loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'loadingOverlay';
      loadingOverlay.className = 'loading-overlay';
      loadingOverlay.innerHTML = `
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <div class="loading-message">${message}</div>
        </div>
      `;
      document.body.appendChild(loadingOverlay);
    }

    loadingOverlay.style.display = 'flex';
  }

  /**
   * Esconder indicador de loading
   */
  hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }

  /**
   * Aplicar efeito de tema temporário
   */
  applyTemporaryThemeEffect(effect) {
    if (!this.animationsEnabled) return;

    switch (effect) {
      case 'rainbow':
        document.body.classList.add('rainbow-effect');
        setTimeout(() => {
          document.body.classList.remove('rainbow-effect');
        }, 3000);
        break;

      case 'glitch':
        this.elements.gameContainer?.classList.add('glitch-effect');
        setTimeout(() => {
          this.elements.gameContainer?.classList.remove('glitch-effect');
        }, 1000);
        break;

      case 'neon-pulse':
        document.body.classList.add('neon-pulse-effect');
        setTimeout(() => {
          document.body.classList.remove('neon-pulse-effect');
        }, 2000);
        break;
    }
  }

  /**
   * Mostrar tooltip
   */
  showTooltip(element, text, position = 'top') {
    if (!element) return;

    this.hideTooltip();

    const tooltip = document.createElement('div');
    tooltip.className = `tooltip tooltip-${position}`;
    tooltip.textContent = text;
    tooltip.id = 'gameTooltip';

    document.body.appendChild(tooltip);

    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    let top = rect.top - tooltipRect.height - 10;

    if (position === 'bottom') {
      top = rect.bottom + 10;
    }

    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';

    if (this.animationsEnabled) {
      tooltip.style.opacity = '0';
      tooltip.style.transform = 'translateY(10px)';

      requestAnimationFrame(() => {
        tooltip.style.transition = 'all 0.2s ease';
        tooltip.style.opacity = '1';
        tooltip.style.transform = 'translateY(0)';
      });
    }

    setTimeout(() => {
      this.hideTooltip();
    }, 3000);
  }

  /**
   * Esconder tooltip
   */
  hideTooltip() {
    const tooltip = document.getElementById('gameTooltip');
    if (tooltip) {
      tooltip.remove();
    }
  }

  /**
   * Salvar estado da UI
   */
  saveUIState() {
    const uiState = {
      theme: this.currentTheme,
      animationsEnabled: this.animationsEnabled,
      timestamp: Date.now()
    };

    localStorage.setItem('secretNumber_ui_state', JSON.stringify(uiState));
  }

  /**
   * Carregar estado da UI
   */
  loadUIState() {
    try {
      const uiStateJson = localStorage.getItem('secretNumber_ui_state');
      if (uiStateJson) {
        const uiState = JSON.parse(uiStateJson);

        if (uiState.theme) {
          this.applyTheme(uiState.theme);
        }

        if (typeof uiState.animationsEnabled === 'boolean') {
          this.toggleAnimations(uiState.animationsEnabled);
        }
      }
    } catch (error) {
      ConfigManager.error('Erro ao carregar estado da UI:', error);
    }
  }

  /**
   * Limpar recursos da UI
   */
  destroy() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleResize);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    this.hideTooltip();
    this.hideLoading();
    this.hideVictoryModal();

    this.saveUIState();

    ConfigManager.log('UI Manager destruído');
  }
}

export default UIManager;
