/**
 * GAME LOGIC - Lógica principal do jogo
 * Arquivo: src/js/game.js
 */

/* global gtag */

import { GameConfig, ConfigManager } from './config.js';

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

    // Timer para o jogo
    this.gameTimer = null;
    this.gameTimeElapsed = 0;

    this.init();
  }

  /**
   * Inicialização do jogo
   */
  init() {
    ConfigManager.log('Inicializando lógica do jogo...');
    
    this.loadGameState();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    this.setupCustomEvents();
    
    this.newGame();
    
    ConfigManager.log('Jogo inicializado com sucesso!');
  }

  /**
   * Carregar estado e estatísticas do jogo
   */
  loadGameState() {
    try {
      this.gameState.difficulty = ConfigManager.getCurrentDifficulty();
      const stats = this.storage.getStats();
      this.sessionStats = { ...this.sessionStats, ...stats };
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
    document.getElementById('submitBtn')?.addEventListener('click', () => {
      this.makeGuess();
    });

    document.getElementById('newGameBtn')?.addEventListener('click', () => {
      this.newGame();
    });

    const numberInput = document.getElementById('numberInput');
    numberInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.makeGuess();
      }
    });

    numberInput?.addEventListener('input', (e) => {
      this.validateInput(e.target);
    });

    document.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.changeDifficulty(btn.dataset.difficulty);
      });
    });

    document.getElementById('playAgainBtn')?.addEventListener('click', () => {
      this.closeVictoryModal();
      this.newGame();
    });

    document.getElementById('closeModalBtn')?.addEventListener('click', () => {
      this.closeVictoryModal();
    });

    document.getElementById('victoryModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'victoryModal') {
        this.closeVictoryModal();
      }
    });

    // Event listeners para botões de header
    document.getElementById('settingsBtn')?.addEventListener('click', () => {
      this.openSettings();
    });

    document.getElementById('statsBtn')?.addEventListener('click', () => {
      this.openDetailedStats();
    });

    document.getElementById('helpBtn')?.addEventListener('click', () => {
      this.openHelp();
    });

    document.getElementById('themeBtn')?.addEventListener('click', () => {
      this.cycleTheme();
    });
  }

  /**
   * Configurar atalhos de teclado
   */
  setupKeyboardShortcuts() {
    if (!GameConfig.UI.keyboardShortcuts) return;

    document.addEventListener('keydown', (e) => {
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
        case '4': {
          e.preventDefault();
          const difficulties = ['easy', 'medium', 'hard', 'expert'];
          this.changeDifficulty(difficulties[parseInt(e.key, 10) - 1]);
          break;
        }
      }
    });
  }

  /**
   * Configurar eventos customizados
   */
  setupCustomEvents() {
    // Escutar eventos de mudança de dificuldade
    document.addEventListener('difficultyChanged', () => {
      this.handleDifficultyChange();
    });

    // Escutar eventos de guess submetido
    document.addEventListener('guessSubmitted', () => {
      this.handleGuessFromInput();
    });

    // Escutar eventos de novo jogo solicitado
    document.addEventListener('newGameRequested', () => {
      this.newGame();
    });

    // Escutar eventos de dica solicitada
    document.addEventListener('hintRequested', () => {
      this.showHint();
    });
  }

  /**
   * Iniciar novo jogo
   */
  newGame() {
    ConfigManager.log('Iniciando novo jogo...');

    try {
      const difficultyConfig = ConfigManager.getDifficultyConfig(this.gameState.difficulty);
      
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
        score: GameConfig.SCORING.baseScore * difficultyConfig.scoreMultiplier,
        hints: 0
      };

      this.gameTimeElapsed = 0;
      this.startGameTimer();

      this.updateUI();
      this.resetInput();
      this.showGameMessage('Novo jogo iniciado! Boa sorte!', 'info');
      this.focusInput();

      // Disparar evento de início de jogo
      this.dispatchGameEvent('gameStarted', {
        difficulty: this.gameState.difficulty,
        config: difficultyConfig
      });

      // Atualizar estado dos controles
      this.dispatchGameEvent('gameStateChanged', {
        gameState: this.gameState
      });

      if (ConfigManager.isDebugEnabled() && GameConfig.DEBUG.showSecretNumber) {
        // eslint-disable-next-line no-console
        console.log('Número secreto:', this.gameState.secretNumber);
      }

      this.trackEvent('game_start', {
        difficulty: this.gameState.difficulty,
        secretNumber: this.gameState.secretNumber
      });

      ConfigManager.log('Novo jogo iniciado:', this.gameState);
    } catch (error) {
      ConfigManager.error('Erro ao iniciar novo jogo:', error);
      this.showGameMessage('Erro ao iniciar jogo. Tente novamente.', 'error');
    }
  }

  /**
   * Gerar número secreto
   */
  generateSecretNumber(difficultyConfig) {
    const { min, max } = difficultyConfig;
    let secretNumber;
    
    if (GameConfig.EASTER_EGGS.enabled) {
      const isSpecialNumber = Math.random() < 0.05;
      if (isSpecialNumber) {
        const specialNumbers = GameConfig.EASTER_EGGS.secretNumbers.filter(
          (num) => num >= min && num <= max,
        );
        if (specialNumbers.length > 0) {
          secretNumber = specialNumbers[Math.floor(Math.random() * specialNumbers.length)];
          ConfigManager.log('Número especial gerado!', secretNumber);
          return secretNumber;
        }
      }
    }
    
    secretNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    return secretNumber;
  }

  /**
   * Fazer palpite
   */
  makeGuess() {
    if (!this.gameState.isPlaying || this.gameState.isGameOver) {
      this.showGameMessage('Jogo não está ativo!', 'warning');
      this.playSound('error');
      return;
    }

    const input = document.getElementById('numberInput');
    const guess = parseInt(input.value, 10);

    if (!this.validateGuess(guess)) {
      return;
    }

    this.gameState.currentGuess = guess;
    this.gameState.attempts++;
    this.gameState.score -= GameConfig.SCORING.penaltyPerAttempt;

    ConfigManager.log(`Tentativa ${this.gameState.attempts}: ${guess}`);

    if (guess === this.gameState.secretNumber) {
      this.handleCorrectGuess();
    } else {
      this.handleIncorrectGuess(guess);
    }

    this.updateUI();
    
    if (this.gameState.attempts >= this.gameState.maxAttempts && !this.gameState.isGameOver) {
      this.handleGameOver();
    }

    this.clearInput();
    this.focusInput();
  }

  /**
   * Lidar com palpite correto
   */
  handleCorrectGuess() {
    ConfigManager.log('Palpite correto!');

    this.gameState.isGameOver = true;
    this.gameState.endTime = Date.now();
    this.stopGameTimer();
    
    const timeElapsed = this.gameState.endTime - this.gameState.startTime;
    
    // Calcular bônus de tempo
    if (timeElapsed < 10000) {
      this.gameState.score += GameConfig.SCORING.timeBonus.under10s;
    } else if (timeElapsed < 30000) {
      this.gameState.score += GameConfig.SCORING.timeBonus.under30s;
    } else if (timeElapsed < 60000) {
      this.gameState.score += GameConfig.SCORING.timeBonus.under60s;
    }

    // Atualizar streak
    this.gameState.streak++;
    this.sessionStats.currentStreak = this.gameState.streak;
    
    if (this.gameState.streak > this.sessionStats.longestStreak) {
      this.sessionStats.longestStreak = this.gameState.streak;
    }

    // Bônus de streak
    Object.entries(GameConfig.SCORING.streakBonus).forEach(([streakCount, bonus]) => {
      if (this.gameState.streak >= parseInt(streakCount, 10)) {
        this.gameState.score += bonus;
      }
    });

    this.updateStats(true, timeElapsed);

    const victoryMessage = ConfigManager.getMessage('victory');
    this.showGameMessage(victoryMessage, 'success');

    // Tocar sons de sucesso
    this.playSound('success');
    setTimeout(() => this.playSound('victory'), 500);

    this.vibrate([200, 100, 200]);

    // Mostrar modal de vitória
    this.showVictoryModal();

    // Disparar eventos
    this.dispatchGameEvent('gameWon', {
      attempts: this.gameState.attempts,
      time: timeElapsed,
      score: this.gameState.score,
      difficulty: this.gameState.difficulty,
      streak: this.gameState.streak,
    });

    this.dispatchGameEvent('gameStateChanged', {
      gameState: this.gameState,
    });

    this.trackEvent('game_win', {
      attempts: this.gameState.attempts,
      time: timeElapsed,
      score: this.gameState.score,
      difficulty: this.gameState.difficulty,
      streak: this.gameState.streak,
    });

    ConfigManager.log('Jogo ganho!', {
      score: this.gameState.score,
      attempts: this.gameState.attempts,
      time: timeElapsed,
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
      if (guess < secretNumber) {
        message = hints.higher.replace('{guess}', guess);
      } else {
        message = hints.lower.replace('{guess}', guess);
      }
      
      if (proximityRatio > 0.5) {
        message += ` ${hints.far}`;
      }
    }

    this.showGameMessage(message, messageType);
    
    // Tocar som de erro
    this.playSound('error');
    
    this.vibrate([100]);

    // Mostrar feedback visual rápido
    this.dispatchGameEvent('quickFeedback', {
      type: 'wrong',
      position: 'center',
    });

    ConfigManager.log(`Palpite incorreto: ${guess}, secreto: ${secretNumber}`);
  }

  /**
   * Lidar com fim de jogo (tentativas esgotadas)
   */
  handleGameOver() {
    ConfigManager.log('Fim de jogo - tentativas esgotadas');

    this.gameState.isGameOver = true;
    this.gameState.endTime = Date.now();
    this.gameState.streak = 0;
    this.sessionStats.currentStreak = 0;
    this.stopGameTimer();

    const timeElapsed = this.gameState.endTime - this.gameState.startTime;
    
    this.updateStats(false, timeElapsed);

    this.showGameMessage(
      `Que pena! O número secreto era ${this.gameState.secretNumber}. Tente novamente!`,
      'error',
    );

    // Tocar som de erro
    this.playSound('error');

    // Disparar eventos
    this.dispatchGameEvent('gameLost', {
      attempts: this.gameState.attempts,
      time: timeElapsed,
      secretNumber: this.gameState.secretNumber,
      difficulty: this.gameState.difficulty,
    });

    this.dispatchGameEvent('gameStateChanged', {
      gameState: this.gameState,
    });

    this.trackEvent('game_lose', {
      attempts: this.gameState.attempts,
      time: timeElapsed,
      secretNumber: this.gameState.secretNumber,
      difficulty: this.gameState.difficulty,
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
    
    ConfigManager.setCurrentDifficulty(newDifficulty);
    
    // Disparar evento de mudança de dificuldade
    this.dispatchGameEvent('difficultyChanged', {
      difficulty: newDifficulty,
      oldDifficulty,
      config: GameConfig.DIFFICULTY_LEVELS[newDifficulty],
    });
    
    if (this.gameState.isPlaying) {
      this.newGame();
    }

    this.trackEvent('difficulty_change', {
      from: oldDifficulty,
      to: newDifficulty,
    });

    ConfigManager.log(`Dificuldade alterada: ${oldDifficulty} → ${newDifficulty}`);
  }

  /**
   * Mostrar dica
   */
  showHint() {
    if (!GameConfig.GAMEPLAY.enableHints || this.gameState.hints >= GameConfig.GAMEPLAY.maxHints) {
      this.showGameMessage('Sem dicas disponíveis!', 'warning');
      this.playSound('error');
      return;
    }

    if (this.gameState.score < GameConfig.GAMEPLAY.hintCost) {
      this.showGameMessage(`Você precisa de ${GameConfig.GAMEPLAY.hintCost} pontos para uma dica!`, 'warning');
      this.playSound('error');
      return;
    }

    const secretNumber = this.gameState.secretNumber;
    const difficultyConfig = ConfigManager.getDifficultyConfig(this.gameState.difficulty);
    const range = difficultyConfig.max - difficultyConfig.min;
    
    let hint;
    
    if (this.gameState.hints === 0) {
      hint = secretNumber % 2 === 0 ? 'O número é par!' : 'O número é ímpar!';
    } else if (this.gameState.hints === 1) {
      const quarter = Math.floor(range / 4);
      const position = Math.floor((secretNumber - difficultyConfig.min) / quarter);
      const ranges = [
        `entre ${difficultyConfig.min} e ${difficultyConfig.min + quarter}`,
        `entre ${difficultyConfig.min + quarter + 1} e ${difficultyConfig.min + quarter * 2}`,
        `entre ${difficultyConfig.min + quarter * 2 + 1} e ${difficultyConfig.min + quarter * 3}`,
        `entre ${difficultyConfig.min + quarter * 3 + 1} e ${difficultyConfig.max}`,
      ];
      hint = `O número está ${ranges[Math.min(position, 3)]}!`;
    } else {
      const divisors = [3, 5, 7, 11].filter((d) => range > d);
      if (divisors.length > 0) {
        const divisor = divisors[Math.floor(Math.random() * divisors.length)];
        hint = secretNumber % divisor === 0
          ? `O número é divisível por ${divisor}!`
          : `O número NÃO é divisível por ${divisor}!`;
      } else {
        hint = 'Você está muito perto! Continue tentando!';
      }
    }

    this.gameState.hints++;
    this.gameState.score -= GameConfig.GAMEPLAY.hintCost;
    
    this.showGameMessage(hint, 'info');
    this.updateUI();

    this.trackEvent('hint_used', {
      hintNumber: this.gameState.hints,
      remainingScore: this.gameState.score,
    });

    ConfigManager.log(`Dica ${this.gameState.hints} mostrada:`, hint);
  }

  /**
   * Validar palpite
   */
  validateGuess(guess) {
    const difficultyConfig = ConfigManager.getDifficultyConfig(this.gameState.difficulty);
    
    if (Number.isNaN(guess)) {
      this.showGameMessage('Por favor, digite um número válido!', 'error');
      this.playSound('error');
      return false;
    }

    if (guess < difficultyConfig.min || guess > difficultyConfig.max) {
      this.showGameMessage(
        `O número deve estar entre ${difficultyConfig.min} e ${difficultyConfig.max}!`,
        'error',
      );
      this.playSound('error');
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
    
    input.min = difficultyConfig.min;
    input.max = difficultyConfig.max;
    
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

    this.storage.saveStats(this.sessionStats);
    
    // Disparar evento de atualização de estatísticas
    this.dispatchGameEvent('statsUpdated', {
      stats: this.sessionStats,
    });
  }

  /**
   * Reproduzir som
   */
  playSound(soundKey) {
    if (window.audioManager) {
      window.audioManager.play(soundKey);
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
   * Atualizar UI
   */
  updateUI() {
    const difficultyConfig = ConfigManager.getDifficultyConfig(this.gameState.difficulty);
    
    // Atualizar informações do jogo
    document.getElementById('gameRange').textContent = `${difficultyConfig.min} - ${difficultyConfig.max}`;
    document.getElementById('gameAttempts').textContent = `${this.gameState.attempts}/${this.gameState.maxAttempts}`;
    document.getElementById('gameScore').textContent = Math.max(0, this.gameState.score);
    document.getElementById('gameTime').textContent = this.formatTime(this.gameTimeElapsed);
    
    // Atualizar status do jogo
    const statusText = this.getGameStatusText();
    document.getElementById('gameStatusText').textContent = statusText;
    
    // Atualizar estatísticas do header
    document.getElementById('quickGamesCount').textContent = this.sessionStats.gamesPlayed;
    document.getElementById('quickWinsCount').textContent = this.sessionStats.gamesWon;
    document.getElementById('quickStreakCount').textContent = this.sessionStats.currentStreak;
  }

  /**
   * Obter texto do status do jogo
   */
  getGameStatusText() {
    if (this.gameState.isGameOver) {
      return this.gameState.attempts <= this.gameState.maxAttempts
        ? 'Parabéns! Você ganhou!'
        : 'Fim de jogo!';
    }

    if (this.gameState.isPaused) {
      return 'Jogo pausado';
    }

    if (this.gameState.isPlaying) {
      const remaining = this.gameState.maxAttempts - this.gameState.attempts;
      return `${remaining} tentativa${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}`;
    }

    return 'Pronto para começar!';
  }

  /**
   * Mostrar modal de vitória
   */
  showVictoryModal() {
    document.getElementById('victoryNumber').textContent = this.gameState.secretNumber;
    document.getElementById('victoryAttempts').textContent = this.gameState.attempts;
    document.getElementById('victoryScore').textContent = this.gameState.score;
    
    const victoryMessage = this.getVictoryMessage();
    document.getElementById('victoryMessage').textContent = victoryMessage;
    
    document.getElementById('victoryModal').style.display = 'flex';
    
    setTimeout(() => {
      document.getElementById('playAgainBtn')?.focus();
    }, 300);
  }

  /**
   * Obter mensagem de vitória personalizada
   */
  getVictoryMessage() {
    const { attempts, score, streak } = this.gameState;

    if (attempts === 1) {
      return 'INCRÍVEL! Você acertou de primeira! Você é um verdadeiro mestre!';
    } if (attempts <= 3) {
      return 'EXCELENTE! Pouquíssimas tentativas! Sua intuição é impressionante!';
    } if (score > 800) {
      return 'ÓTIMO! Pontuação fantástica! Continue assim!';
    } if (streak >= 3) {
      return `SEQUÊNCIA INCRÍVEL! ${streak} vitórias seguidas! Você está em chamas!`;
    }
    return 'PARABÉNS! Você descobriu o número secreto! Muito bem jogado!';
  }

  /**
   * Fechar modal de vitória
   */
  closeVictoryModal() {
    document.getElementById('victoryModal').style.display = 'none';
    this.focusInput();
  }

  /**
   * Mostrar mensagem de jogo
   */
  showGameMessage(text, type) {
    this.dispatchGameEvent('gameMessage', {
      text,
      type,
      options: {},
    });
  }

  /**
   * Resetar input
   */
  resetInput() {
    const input = document.getElementById('numberInput');
    if (input) {
      input.value = '';
      input.classList.remove('invalid');
    }
  }

  /**
   * Limpar input
   */
  clearInput() {
    const input = document.getElementById('numberInput');
    if (input) {
      input.value = '';
    }
  }

  /**
   * Focar no input
   */
  focusInput() {
    const input = document.getElementById('numberInput');
    if (input && GameConfig.UI.autoFocus) {
      setTimeout(() => {
        input.focus();
        input.select();
      }, 100);
    }
  }

  /**
   * Iniciar timer do jogo
   */
  startGameTimer() {
    this.stopGameTimer();
    this.gameTimer = setInterval(() => {
      this.gameTimeElapsed = Date.now() - this.gameState.startTime;
      document.getElementById('gameTime').textContent = this.formatTime(this.gameTimeElapsed);
    }, 1000);
  }

  /**
   * Parar timer do jogo
   */
  stopGameTimer() {
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }
  }

  /**
   * Formatar tempo
   */
  formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  }

  /**
   * Disparar evento customizado
   */
  dispatchGameEvent(eventName, detail) {
    document.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  /**
   * Lidar com mudança de dificuldade vinda de componente
   */
  handleDifficultyChange() {
    this.changeDifficulty(this.gameState.difficulty);
  }

  /**
   * Lidar com guess vindo do componente de input
   */
  handleGuessFromInput() {
    this.makeGuess();
  }

  /**
   * Abrir configurações
   */
  openSettings() {
    // if (GameConfig.DEBUG.enabled) {
    //   console.log('Abrindo configurações...');
    // }
  }

  /**
   * Abrir estatísticas detalhadas
   */
  openDetailedStats() {
    // if (GameConfig.DEBUG.enabled) {
    //   console.log('Abrindo estatísticas detalhadas...');
    // }
  }

  /**
   * Abrir ajuda
   */
  openHelp() {
    // if (GameConfig.DEBUG.enabled) {
    //   console.log('Abrindo ajuda...');
    // }
  }

  /**
   * Alternar tema
   */
  cycleTheme() {
    // if (GameConfig.DEBUG.enabled) {
    //   console.log('Alternando tema...');
    // }
  }

  /**
   * Rastrear eventos (Analytics)
   */
  trackEvent(eventName, data = {}) {
    if (!GameConfig.ANALYTICS.enabled) return;

    try {
      ConfigManager.log('Analytics Event:', eventName, data);
      
      if (typeof gtag !== 'undefined') {
        gtag('event', eventName, {
          custom_parameter_1: data.difficulty,
          custom_parameter_2: data.score,
          value: data.attempts,
        });
      }
    } catch (error) {
      ConfigManager.log('Erro no analytics:', error);
    }
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
   * Limpar recursos
   */
  destroy() {
    this.stopGameTimer();
    this.storage.saveStats(this.sessionStats);
    ConfigManager.log('Jogo destruído');
  }
}

export default GameLogic;
