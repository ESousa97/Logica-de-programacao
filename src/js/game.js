/**
 * GAME LOGIC - Lógica principal do jogo
 * Arquivo: src/js/game.js
 */

import { GameConfig, ConfigManager } from './config.js';
import { Utils } from './utils.js';

export class GameLogic {
  constructor(storageManager, uiManager) {
    this.storage = storageManager;
    this.ui = uiManager;
    
    // Estado do jogo
    this.gameState = {
      isPlaying: false,
      isPaused: false,
      isGameOver: false,
      secretNumber: null,
      currentGuess: null,
      attempts: 0,
      maxAttempts: 0,
      startTime: null,
      endTime: null,
      difficulty: 'easy',
      score: 0,
      hints: 0,
      streak: 0
    };

    // Estatísticas da sessão
    this.sessionStats = {
      gamesPlayed: 0,
      gamesWon: 0,
      totalAttempts: 0,
      totalTime: 0,
      bestScore: 0,
      currentStreak: 0,
      longestStreak: 0
    };

    this.init();
  }

  /**
   * Inicialização do jogo
   */
  init() {
    ConfigManager.log('Inicializando lógica do jogo...');
    
    // Carregar configurações e estatísticas
    this.loadGameState();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    
    // Inicializar novo jogo
    this.newGame();
    
    ConfigManager.log('Jogo inicializado com sucesso!');
  }

  /**
   * Carregar estado e estatísticas do jogo
   */
  loadGameState() {
    try {
      // Carregar dificuldade
      this.gameState.difficulty = ConfigManager.getCurrentDifficulty();
      
      // Carregar estatísticas
      const stats = this.storage.getStats();
      this.sessionStats = { ...this.sessionStats, ...stats };
      
      // Carregar streak atual
      this.gameState.streak = stats.currentStreak || 0;
      
      ConfigManager.log('Estado carregado:', this.gameState);
    } catch (error) {
      ConfigManager.error('Erro ao carregar estado:', error);
    }
  }

  /**
   * Configurar listeners de eventos
   */
  setupEventListeners() {
    // Botão de enviar palpite
    document.getElementById('submitBtn')?.addEventListener('click', () => {
      this.makeGuess();
    });

    // Botão de novo jogo
    document.getElementById('newGameBtn')?.addEventListener('click', () => {
      this.newGame();
    });

    // Input de número (Enter para enviar)
    const numberInput = document.getElementById('numberInput');
    numberInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.makeGuess();
      }
    });

    // Validação em tempo real
    numberInput?.addEventListener('input', (e) => {
      this.validateInput(e.target);
    });

    // Seletores de dificuldade
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.changeDifficulty(btn.dataset.difficulty);
      });
    });

    // Modal de vitória
    document.getElementById('playAgainBtn')?.addEventListener('click', () => {
      this.closeVictoryModal();
      this.newGame();
    });

    document.getElementById('closeModalBtn')?.addEventListener('click', () => {
      this.closeVictoryModal();
    });

    // Fechar modal clicando no overlay
    document.getElementById('victoryModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'victoryModal') {
        this.closeVictoryModal();
      }
    });
  }

  /**
   * Configurar atalhos de teclado
   */
  setupKeyboardShortcuts() {
    if (!GameConfig.UI.keyboardShortcuts) return;

    document.addEventListener('keydown', (e) => {
      // Ignorar se modal estiver aberto ou input focado
      if (document.getElementById('victoryModal').style.display === 'block') return;
      if (document.activeElement.tagName === 'INPUT') return;

      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          this.newGame();
          break;
        case 'h':
          e.preventDefault();
          this.showHint();
          break;
        case 'escape':
          e.preventDefault();
          this.closeVictoryModal();
          break;
        case '1':
        case '2':
        case '3':
        case '4':
          e.preventDefault();
          const difficulties = ['easy', 'medium', 'hard', 'expert'];
          this.changeDifficulty(difficulties[parseInt(e.key) - 1]);
          break;
      }
    });
  }

  /**
   * Iniciar novo jogo
   */
  newGame() {
    ConfigManager.log('Iniciando novo jogo...');

    try {
      const difficultyConfig = ConfigManager.getDifficultyConfig(this.gameState.difficulty);
      
      // Resetar estado do jogo
      this.gameState = {
        ...this.gameState,
        isPlaying: true,
        isPaused: false,
        isGameOver: false,
        secretNumber: this.generateSecretNumber(difficultyConfig),
        currentGuess: null,
        attempts: 0,
        maxAttempts: difficultyConfig.maxAttempts,
        startTime: Date.now(),
        endTime: null,
        score: 0,
        hints: 0
      };

      // Atualizar UI
      this.ui.updateGameInfo(this.gameState, difficultyConfig);
      this.ui.resetInput();
      this.ui.showMessage('Novo jogo iniciado! Boa sorte! 🍀', 'info');
      this.ui.focusInput();

      // Debug: mostrar número secreto se habilitado
      if (ConfigManager.isDebugEnabled() && GameConfig.DEBUG.showSecretNumber) {
        console.log('🎯 Número secreto:', this.gameState.secretNumber);
      }

      // Audio
      this.playSound('newGame');

      // Analytics
      this.trackEvent('game_start', {
        difficulty: this.gameState.difficulty,
        secretNumber: this.gameState.secretNumber
      });

      ConfigManager.log('Novo jogo iniciado:', this.gameState);
    } catch (error) {
      ConfigManager.error('Erro ao iniciar novo jogo:', error);
      this.ui.showMessage('Erro ao iniciar jogo. Tente novamente.', 'error');
    }
  }

  /**
   * Gerar número secreto
   */
  generateSecretNumber(difficultyConfig) {
    const { min, max } = difficultyConfig;
    let secretNumber;
    
    // Easter egg: verificar números especiais
    if (GameConfig.EASTER_EGGS.enabled) {
      const isSpecialNumber = Math.random() < 0.05; // 5% de chance
      if (isSpecialNumber) {
        const specialNumbers = GameConfig.EASTER_EGGS.secretNumbers.filter(
          num => num >= min && num <= max
        );
        if (specialNumbers.length > 0) {
          secretNumber = specialNumbers[Math.floor(Math.random() * specialNumbers.length)];
          ConfigManager.log('Número especial gerado!', secretNumber);
          return secretNumber;
        }
      }
    }
    
    // Gerar número normal
    secretNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    return secretNumber;
  }

  /**
   * Fazer palpite
   */
  makeGuess() {
    if (!this.gameState.isPlaying || this.gameState.isGameOver) {
      this.ui.showMessage('Jogo não está ativo!', 'warning');
      return;
    }

    const input = document.getElementById('numberInput');
    const guess = parseInt(input.value);

    // Validar entrada
    if (!this.validateGuess(guess)) {
      return;
    }

    this.gameState.currentGuess = guess;
    this.gameState.attempts++;

    ConfigManager.log(`Tentativa ${this.gameState.attempts}: ${guess}`);

    // Verificar se acertou
    if (guess === this.gameState.secretNumber) {
      this.handleCorrectGuess();
    } else {
      this.handleIncorrectGuess(guess);
    }

    // Atualizar UI
    this.ui.updateGameInfo(this.gameState, ConfigManager.getDifficultyConfig(this.gameState.difficulty));
    
    // Verificar fim de jogo por tentativas
    if (this.gameState.attempts >= this.gameState.maxAttempts && !this.gameState.isGameOver) {
      this.handleGameOver();
    }
  }

  /**
   * Lidar com palpite correto
   */
  handleCorrectGuess() {
    ConfigManager.log('Palpite correto!');

    this.gameState.isGameOver = true;
    this.gameState.endTime = Date.now();
    
    // Calcular pontuação
    const timeElapsed = this.gameState.endTime - this.gameState.startTime;
    this.gameState.score = ConfigManager.calculateScore(
      this.gameState.attempts,
      timeElapsed,
      this.gameState.difficulty,
      this.gameState.streak
    );

    // Atualizar streak
    this.gameState.streak++;
    this.sessionStats.currentStreak = this.gameState.streak;
    
    if (this.gameState.streak > this.sessionStats.longestStreak) {
      this.sessionStats.longestStreak = this.gameState.streak;
    }

    // Atualizar estatísticas
    this.updateStats(true, timeElapsed);

    // Mostrar mensagem de vitória
    const victoryMessage = ConfigManager.getMessage('victory');
    this.ui.showMessage(victoryMessage, 'success');

    // Efeitos visuais
    this.ui.showVictoryEffect();
    this.ui.showVictoryModal(this.gameState);

    // Audio
    this.playSound('correct');
    setTimeout(() => this.playSound('victory'), 500);

    // Vibração (mobile)
    this.vibrate([200, 100, 200]);

    // Analytics
    this.trackEvent('game_win', {
      attempts: this.gameState.attempts,
      time: timeElapsed,
      score: this.gameState.score,
      difficulty: this.gameState.difficulty,
      streak: this.gameState.streak
    });

    ConfigManager.log('Jogo ganho!', {
      score: this.gameState.score,
      attempts: this.gameState.attempts,
      time: timeElapsed
    });
  }

  /**
   * Lidar com palpite incorreto
   */
  handleIncorrectGuess(guess) {
    const secretNumber = this.gameState.secretNumber;
    const language = ConfigManager.getLanguage();
    const hints = GameConfig.MESSAGES.hints[language];
    
    let message;
    let messageType = 'warning';

    // Determinar proximidade
    const difference = Math.abs(guess - secretNumber);
    const difficultyConfig = ConfigManager.getDifficultyConfig(this.gameState.difficulty);
    const range = difficultyConfig.max - difficultyConfig.min;
    const proximityRatio = difference / range;

    if (proximityRatio <= 0.05) {
      message = hints.veryClose;
      messageType = 'warning';
    } else if (proximityRatio <= 0.15) {
      message = hints.close;
      messageType = 'warning';
    } else {
      // Dica de maior/menor
      if (guess < secretNumber) {
        message = hints.higher.replace('{guess}', guess);
      } else {
        message = hints.lower.replace('{guess}', guess);
      }
      
      if (proximityRatio > 0.5) {
        message += ' ' + hints.far;
      }
    }

    this.ui.showMessage(message, messageType);
    
    // Audio
    this.playSound('wrong');
    
    // Vibração curta para erro
    this.vibrate([100]);

    // Efeito visual de erro
    this.ui.showWrongAnswerEffect();

    ConfigManager.log(`Palpite incorreto: ${guess}, secreto: ${secretNumber}`);
  }

  /**
   * Lidar com fim de jogo (tentativas esgotadas)
   */
  handleGameOver() {
    ConfigManager.log('Fim de jogo - tentativas esgotadas');

    this.gameState.isGameOver = true;
    this.gameState.endTime = Date.now();
    this.gameState.streak = 0; // Reset streak
    this.sessionStats.currentStreak = 0;

    const timeElapsed = this.gameState.endTime - this.gameState.startTime;
    
    // Atualizar estatísticas
    this.updateStats(false, timeElapsed);

    // Mostrar número secreto
    this.ui.showMessage(
      `Que pena! O número secreto era ${this.gameState.secretNumber}. Tente novamente! 💪`,
      'error'
    );

    // Audio
    this.playSound('wrong');

    // Analytics
    this.trackEvent('game_lose', {
      attempts: this.gameState.attempts,
      time: timeElapsed,
      secretNumber: this.gameState.secretNumber,
      difficulty: this.gameState.difficulty
    });
  }

  /**
   * Mudar dificuldade
   */
  changeDifficulty(newDifficulty) {
    if (!GameConfig.DIFFICULTY_LEVELS[newDifficulty]) {
      ConfigManager.error('Dificuldade inválida:', newDifficulty);
      return;
    }

    const oldDifficulty = this.gameState.difficulty;
    this.gameState.difficulty = newDifficulty;
    
    // Salvar preferência
    ConfigManager.setCurrentDifficulty(newDifficulty);
    
    // Atualizar UI
    this.ui.updateDifficultySelector(newDifficulty);
    
    // Iniciar novo jogo se estiver jogando
    if (this.gameState.isPlaying) {
      this.newGame();
    }

    // Analytics
    this.trackEvent('difficulty_change', {
      from: oldDifficulty,
      to: newDifficulty
    });

    ConfigManager.log(`Dificuldade alterada: ${oldDifficulty} → ${newDifficulty}`);
  }

  /**
   * Mostrar dica
   */
  showHint() {
    if (!GameConfig.GAMEPLAY.enableHints || this.gameState.hints >= GameConfig.GAMEPLAY.maxHints) {
      this.ui.showMessage('Sem dicas disponíveis!', 'warning');
      return;
    }

    if (this.gameState.score < GameConfig.GAMEPLAY.hintCost) {
      this.ui.showMessage(`Você precisa de ${GameConfig.GAMEPLAY.hintCost} pontos para uma dica!`, 'warning');
      return;
    }

    const secretNumber = this.gameState.secretNumber;
    const difficultyConfig = ConfigManager.getDifficultyConfig(this.gameState.difficulty);
    const range = difficultyConfig.max - difficultyConfig.min;
    
    let hint;
    
    // Primeira dica: par ou ímpar
    if (this.gameState.hints === 0) {
      hint = secretNumber % 2 === 0 ? 'O número é par! 🎯' : 'O número é ímpar! 🎯';
    }
    // Segunda dica: faixa mais específica
    else if (this.gameState.hints === 1) {
      const quarter = Math.floor(range / 4);
      const position = Math.floor((secretNumber - difficultyConfig.min) / quarter);
      const ranges = [
        `entre ${difficultyConfig.min} e ${difficultyConfig.min + quarter}`,
        `entre ${difficultyConfig.min + quarter + 1} e ${difficultyConfig.min + quarter * 2}`,
        `entre ${difficultyConfig.min + quarter * 2 + 1} e ${difficultyConfig.min + quarter * 3}`,
        `entre ${difficultyConfig.min + quarter * 3 + 1} e ${difficultyConfig.max}`
      ];
      hint = `O número está ${ranges[Math.min(position, 3)]}! 🎯`;
    }
    // Terceira dica: divisibilidade
    else {
      const divisors = [3, 5, 7, 11].filter(d => range > d);
      if (divisors.length > 0) {
        const divisor = divisors[Math.floor(Math.random() * divisors.length)];
        hint = secretNumber % divisor === 0 
          ? `O número é divisível por ${divisor}! 🎯`
          : `O número NÃO é divisível por ${divisor}! 🎯`;
      } else {
        hint = 'Você está muito perto! Continue tentando! 🔥';
      }
    }

    this.gameState.hints++;
    this.gameState.score -= GameConfig.GAMEPLAY.hintCost;
    
    this.ui.showMessage(hint, 'info');
    this.ui.updateGameInfo(this.gameState, difficultyConfig);

    // Analytics
    this.trackEvent('hint_used', {
      hintNumber: this.gameState.hints,
      remainingScore: this.gameState.score
    });

    ConfigManager.log(`Dica ${this.gameState.hints} mostrada:`, hint);
  }

  /**
   * Validar palpite
   */
  validateGuess(guess) {
    const difficultyConfig = ConfigManager.getDifficultyConfig(this.gameState.difficulty);
    
    if (isNaN(guess)) {
      this.ui.showMessage('Por favor, digite um número válido!', 'error');
      return false;
    }

    if (guess < difficultyConfig.min || guess > difficultyConfig.max) {
      this.ui.showMessage(
        `O número deve estar entre ${difficultyConfig.min} e ${difficultyConfig.max}!`,
        'error'
      );
      return false;
    }

    return true;
  }

  /**
   * Validar entrada em tempo real
   */
  validateInput(input) {
    const value = input.value;
    const difficultyConfig = ConfigManager.getDifficultyConfig(this.gameState.difficulty);
    
    // Atualizar atributos do input
    input.min = difficultyConfig.min;
    input.max = difficultyConfig.max;
    
    // Validação visual
    if (value && !ConfigManager.validateNumber(value, this.gameState.difficulty)) {
      input.classList.add('invalid');
    } else {
      input.classList.remove('invalid');
    }
  }

  /**
   * Atualizar estatísticas
   */
  updateStats(won, timeElapsed) {
    this.sessionStats.gamesPlayed++;
    this.sessionStats.totalAttempts += this.gameState.attempts;
    this.sessionStats.totalTime += timeElapsed;
    
    if (won) {
      this.sessionStats.gamesWon++;
      if (this.gameState.score > this.sessionStats.bestScore) {
        this.sessionStats.bestScore = this.gameState.score;
      }
    }

    // Salvar estatísticas
    this.storage.saveStats(this.sessionStats);
    
    // Atualizar UI
    this.ui.updateStats(this.sessionStats);
  }

  /**
   * Reproduzir som
   */
  playSound(soundKey) {
    if (!ConfigManager.isAudioEnabled() || !GameConfig.AUDIO.enabled) return;

    try {
      const soundPath = GameConfig.AUDIO.sounds[soundKey];
      if (soundPath) {
        const audio = new Audio(soundPath);
        audio.volume = GameConfig.AUDIO.volume;
        audio.play().catch(error => {
          ConfigManager.log('Erro ao reproduzir som:', error);
        });
      }
    } catch (error) {
      ConfigManager.log('Erro no sistema de áudio:', error);
    }
  }

  /**
   * Vibrar dispositivo
   */
  vibrate(pattern) {
    if (!GameConfig.UI.vibrationEnabled || !navigator.vibrate) return;
    
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      ConfigManager.log('Vibração não suportada:', error);
    }
  }

  /**
   * Fechar modal de vitória
   */
  closeVictoryModal() {
    this.ui.hideVictoryModal();
  }

  /**
   * Rastrear eventos (Analytics)
   */
  trackEvent(eventName, data = {}) {
    if (!GameConfig.ANALYTICS.enabled) return;

    try {
      // Aqui você pode integrar com Google Analytics, Mixpanel, etc.
      ConfigManager.log('Analytics Event:', eventName, data);
      
      // Exemplo com Google Analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', eventName, {
          custom_parameter_1: data.difficulty,
          custom_parameter_2: data.score,
          value: data.attempts
        });
      }
    } catch (error) {
      ConfigManager.log('Erro no analytics:', error);
    }
  }

  /**
   * Pausar jogo
   */
  pauseGame() {
    if (!this.gameState.isPlaying || this.gameState.isGameOver) return;
    
    this.gameState.isPaused = true;
    this.ui.showMessage('Jogo pausado ⏸️', 'info');
    ConfigManager.log('Jogo pausado');
  }

  /**
   * Retomar jogo
   */
  resumeGame() {
    if (!this.gameState.isPaused) return;
    
    this.gameState.isPaused = false;
    this.ui.showMessage('Jogo retomado ▶️', 'info');
    ConfigManager.log('Jogo retomado');
  }

  /**
   * Obter estado atual do jogo
   */
  getGameState() {
    return { ...this.gameState };
  }

  /**
   * Obter estatísticas da sessão
   */
  getSessionStats() {
    return { ...this.sessionStats };
  }

  /**
   * Resetar estatísticas
   */
  resetStats() {
    this.sessionStats = {
      gamesPlayed: 0,
      gamesWon: 0,
      totalAttempts: 0,
      totalTime: 0,
      bestScore: 0,
      currentStreak: 0,
      longestStreak: 0
    };

    this.gameState.streak = 0;
    this.storage.clearStats();
    this.ui.updateStats(this.sessionStats);
    
    ConfigManager.log('Estatísticas resetadas');
  }

  /**
   * Limpar recursos
   */
  destroy() {
    // Limpar listeners
    document.removeEventListener('keydown', this.keyboardHandler);
    
    // Salvar estado final
    this.storage.saveStats(this.sessionStats);
    
    ConfigManager.log('Jogo destruído');
  }
}

export default GameLogic;