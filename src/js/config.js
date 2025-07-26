/**
 * GAME CONFIG - Configurações centralizadas do jogo
 * Arquivo: src/js/config.js
 */

export const GameConfig = {
  // Níveis de Dificuldade
  DIFFICULTY_LEVELS: {
    easy: {
      name: 'Fácil',
      min: 1,
      max: 10,
      maxAttempts: 5,
      scoreMultiplier: 1,
      emoji: '😊',
      color: '#00FF88'
    },
    medium: {
      name: 'Médio',
      min: 1,
      max: 100,
      maxAttempts: 8,
      scoreMultiplier: 2,
      emoji: '🤔',
      color: '#00E5FF'
    },
    hard: {
      name: 'Difícil',
      min: 1,
      max: 1000,
      maxAttempts: 12,
      scoreMultiplier: 3,
      emoji: '😤',
      color: '#7B68EE'
    },
    expert: {
      name: 'Expert',
      min: 1,
      max: 5000,
      maxAttempts: 15,
      scoreMultiplier: 5,
      emoji: '🔥',
      color: '#FF6B35'
    }
  },

  // Sistema de Pontuação
  SCORING: {
    baseScore: 1000,
    penaltyPerAttempt: 50,
    timeBonus: {
      under10s: 500,
      under30s: 300,
      under60s: 100
    },
    streakBonus: {
      3: 200,
      5: 500,
      10: 1000
    }
  },

  // Temas de Cores
  THEMES: {
    neon: {
      primary: '#00E5FF',
      secondary: '#7B68EE',
      success: '#00FF88',
      warning: '#FF6B35',
      error: '#FF4757'
    },
    cyberpunk: {
      primary: '#FF10F0',
      secondary: '#39FF14',
      success: '#00FFFF',
      warning: '#FFFF00',
      error: '#FF0080'
    },
    matrix: {
      primary: '#00FF41',
      secondary: '#008F11',
      success: '#00FF41',
      warning: '#FFFF00',
      error: '#FF0000'
    }
  },

  // Configurações de Audio
  AUDIO: {
    enabled: true,
    volume: 0.5,
    sounds: {
      correct: '/src/assets/sounds/success.mp3',
      wrong: '/src/assets/sounds/error.mp3',
      click: '/src/assets/sounds/click.mp3',
      victory: '/src/assets/sounds/victory.mp3',
      newGame: '/src/assets/sounds/start.mp3'
    }
  },

  // Configurações de Animação
  ANIMATIONS: {
    enabled: true,
    duration: {
      fast: 150,
      normal: 300,
      slow: 500
    },
    particles: {
      enabled: true,
      count: 50,
      speed: 2
    }
  },

  // Configurações de Storage
  STORAGE: {
    keys: {
      stats: 'secretNumber_stats',
      settings: 'secretNumber_settings',
      difficulty: 'secretNumber_difficulty',
      theme: 'secretNumber_theme'
    },
    version: '2.0.0'
  },

  // Configurações de Localização
  LOCALIZATION: {
    defaultLanguage: 'pt-BR',
    languages: {
      'pt-BR': {
        name: 'Português (Brasil)',
        flag: '🇧🇷'
      },
      'en-US': {
        name: 'English (US)',
        flag: '🇺🇸'
      },
      'es-ES': {
        name: 'Español',
        flag: '🇪🇸'
      }
    }
  },

  // Configurações de UI
  UI: {
    showParticles: true,
    showAnimations: true,
    vibrationEnabled: true,
    showHints: true,
    autoFocus: true,
    keyboardShortcuts: true
  },

  // Configurações de Gameplay
  GAMEPLAY: {
    allowRetry: true,
    showProgress: true,
    showTimer: true,
    enableStreaks: true,
    enableHints: true,
    hintCost: 100, // pontos
    maxHints: 3
  },

  // Configurações de Analytics
  ANALYTICS: {
    enabled: false,
    trackingId: null,
    events: {
      gameStart: 'game_start',
      gameWin: 'game_win',
      gameLose: 'game_lose',
      difficultyChange: 'difficulty_change',
      hintUsed: 'hint_used'
    }
  },

  // Configurações de Segurança
  SECURITY: {
    maxAttemptsPerMinute: 60,
    enableRateLimit: true,
    preventCheating: true
  },

  // Easter Eggs e Recursos Especiais
  EASTER_EGGS: {
    enabled: true,
    konami: true,
    secretNumbers: [42, 1337, 2023],
    specialEffects: true
  },

  // Configurações de Debug
  DEBUG: {
    enabled: false,
    showSecretNumber: false,
    logEvents: false,
    skipAnimations: false
  },

  // Constantes do Jogo
  CONSTANTS: {
    MIN_NUMBER: 1,
    MAX_ATTEMPTS_GLOBAL: 20,
    ANIMATION_DELAY: 100,
    HINT_COOLDOWN: 5000, // 5 segundos
    AUTO_SAVE_INTERVAL: 30000, // 30 segundos
    SESSION_TIMEOUT: 1800000 // 30 minutos
  },

  // Mensagens do Sistema
  MESSAGES: {
    welcome: {
      'pt-BR': 'Bem-vindo ao Jogo do Número Secreto! 🎮',
      'en-US': 'Welcome to the Secret Number Game! 🎮',
      'es-ES': '¡Bienvenido al Juego del Número Secreto! 🎮'
    },
    victory: {
      'pt-BR': [
        'Parabéns! Você descobriu o número secreto! 🎉',
        'Fantástico! Você acertou em cheio! ⭐',
        'Incrível! Você é um verdadeiro detetive! 🕵️',
        'Uau! Que intuição impressionante! 🧠',
        'Perfeito! Você dominou este desafio! 👑'
      ],
      'en-US': [
        'Congratulations! You discovered the secret number! 🎉',
        'Fantastic! You nailed it! ⭐',
        'Amazing! You are a true detective! 🕵️',
        'Wow! What impressive intuition! 🧠',
        'Perfect! You mastered this challenge! 👑'
      ],
      'es-ES': [
        '¡Felicidades! ¡Descubriste el número secreto! 🎉',
        '¡Fantástico! ¡Lo clavaste! ⭐',
        '¡Increíble! ¡Eres un verdadero detective! 🕵️',
        '¡Guau! ¡Qué intuición tan impresionante! 🧠',
        '¡Perfecto! ¡Dominaste este desafío! 👑'
      ]
    },
    hints: {
      'pt-BR': {
        higher: 'O número secreto é maior que {guess}! ⬆️',
        lower: 'O número secreto é menor que {guess}! ⬇️',
        close: 'Você está muito perto! 🔥',
        far: 'Você está longe do número! ❄️',
        veryClose: 'Quase lá! Está quentíssimo! 🌡️'
      },
      'en-US': {
        higher: 'The secret number is higher than {guess}! ⬆️',
        lower: 'The secret number is lower than {guess}! ⬇️',
        close: 'You are very close! 🔥',
        far: 'You are far from the number! ❄️',
        veryClose: 'Almost there! You are very hot! 🌡️'
      },
      'es-ES': {
        higher: '¡El número secreto es mayor que {guess}! ⬆️',
        lower: '¡El número secreto es menor que {guess}! ⬇️',
        close: '¡Estás muy cerca! 🔥',
        far: '¡Estás lejos del número! ❄️',
        veryClose: '¡Casi ahí! ¡Estás muy caliente! 🌡️'
      }
    }
  },

  // Validação de Entrada
  VALIDATION: {
    allowNegative: false,
    allowDecimals: false,
    allowEmpty: false,
    maxDigits: 6
  },

  // Configurações de Performance
  PERFORMANCE: {
    enableLazyLoading: true,
    enableImageOptimization: true,
    enableServiceWorker: false,
    enableCaching: true,
    maxCacheSize: 50 * 1024 * 1024 // 50MB
  }
};

// 🛠️ Métodos Utilitários de Configuração
export class ConfigManager {
  static getCurrentDifficulty() {
    return localStorage.getItem(GameConfig.STORAGE.keys.difficulty) || 'easy';
  }

  static setCurrentDifficulty(difficulty) {
    if (GameConfig.DIFFICULTY_LEVELS[difficulty]) {
      localStorage.setItem(GameConfig.STORAGE.keys.difficulty, difficulty);
      return true;
    }
    return false;
  }

  static getDifficultyConfig(difficulty) {
    return GameConfig.DIFFICULTY_LEVELS[difficulty] || GameConfig.DIFFICULTY_LEVELS.easy;
  }

  static isAudioEnabled() {
    const settings = this.getSettings();
    return settings.audio !== false;
  }

  static getSettings() {
    try {
      const settings = localStorage.getItem(GameConfig.STORAGE.keys.settings);
      return settings ? JSON.parse(settings) : {};
    } catch (error) {
      console.warn('Erro ao carregar configurações:', error);
      return {};
    }
  }

  static saveSettings(settings) {
    try {
      const currentSettings = this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      localStorage.setItem(GameConfig.STORAGE.keys.settings, JSON.stringify(newSettings));
      return true;
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      return false;
    }
  }

  static resetSettings() {
    localStorage.removeItem(GameConfig.STORAGE.keys.settings);
    localStorage.removeItem(GameConfig.STORAGE.keys.difficulty);
    localStorage.removeItem(GameConfig.STORAGE.keys.theme);
  }

  static getTheme() {
    return localStorage.getItem(GameConfig.STORAGE.keys.theme) || 'neon';
  }

  static setTheme(theme) {
    if (GameConfig.THEMES[theme]) {
      localStorage.setItem(GameConfig.STORAGE.keys.theme, theme);
      return true;
    }
    return false;
  }

  static getLanguage() {
    const settings = this.getSettings();
    return settings.language || GameConfig.LOCALIZATION.defaultLanguage;
  }

  static getMessage(key, language = null) {
    const lang = language || this.getLanguage();
    const messages = GameConfig.MESSAGES[key];
    
    if (!messages) return '';
    
    if (Array.isArray(messages[lang])) {
      // Retorna mensagem aleatória do array
      const randomIndex = Math.floor(Math.random() * messages[lang].length);
      return messages[lang][randomIndex];
    }
    
    return messages[lang] || messages[GameConfig.LOCALIZATION.defaultLanguage] || '';
  }

  static validateNumber(value, difficulty) {
    const config = this.getDifficultyConfig(difficulty);
    const num = parseInt(value);
    
    if (isNaN(num)) return false;
    if (num < config.min || num > config.max) return false;
    if (!GameConfig.VALIDATION.allowNegative && num < 0) return false;
    
    return true;
  }

  static calculateScore(attempts, timeElapsed, difficulty, streak = 0) {
    const config = this.getDifficultyConfig(difficulty);
    const scoring = GameConfig.SCORING;
    
    let score = scoring.baseScore * config.scoreMultiplier;
    
    // Penalidade por tentativas
    score -= (attempts - 1) * scoring.penaltyPerAttempt;
    
    // Bônus de tempo
    if (timeElapsed < 10000) score += scoring.timeBonus.under10s;
    else if (timeElapsed < 30000) score += scoring.timeBonus.under30s;
    else if (timeElapsed < 60000) score += scoring.timeBonus.under60s;
    
    // Bônus de streak
    for (const [streakCount, bonus] of Object.entries(scoring.streakBonus)) {
      if (streak >= parseInt(streakCount)) {
        score += bonus;
      }
    }
    
    return Math.max(0, Math.round(score));
  }

  static isDebugEnabled() {
    return GameConfig.DEBUG.enabled || 
           new URLSearchParams(window.location.search).has('debug');
  }

  static log(...args) {
    if (this.isDebugEnabled()) {
      console.log('[SecretNumber]', ...args);
    }
  }

  static error(...args) {
    console.error('[SecretNumber Error]', ...args);
  }
}

// 🎮 Exportar configuração como padrão
export default GameConfig;