/**
 * UTILS - Funções utilitárias e helpers
 * Arquivo: src/js/utils.js
 */

import { GameConfig, ConfigManager } from './config.js';

export class Utils {
  /** Debounce - Limita a frequência de execução de uma função */
  static debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(this, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(this, args);
    };
  }

  /** ⚡ Throttle - Executa no máximo uma vez por intervalo */
  static throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /** Gera número inteiro aleatório entre min e max (inclusivo) */
  static randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /** Gera número decimal aleatório entre min e max com casas decimais */
  static randomFloat(min, max, decimals = 2) {
    const random = Math.random() * (max - min) + min;
    return parseFloat(random.toFixed(decimals));
  }

  /** Gera cor hexadecimal aleatória */
  static randomColor() {
    return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
  }

  /** Gera cor HSL baseada em hash do valor */
  static colorFromValue(value) {
    let hash = 0;
    const str = value.toString();
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 60%)`;
  }

  /** Formata tempo em formato legível (h m s) */
  static formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /** Formata tempo de forma compacta (mm:ss) */
  static formatTimeCompact(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  }

  /** Formata números grandes com sufixos (K, M, B) */
  static formatNumber(number) {
    if (number >= 1e9) return (number / 1e9).toFixed(1) + 'B';
    if (number >= 1e6) return (number / 1e6).toFixed(1) + 'M';
    if (number >= 1e3) return (number / 1e3).toFixed(1) + 'K';
    return number.toString();
  }

  /** Formata número com separadores locais */
  static formatScore(score, locale = 'pt-BR') {
    return new Intl.NumberFormat(locale).format(score);
  }

  /** Detecta tipo de dispositivo: 'mobile', 'tablet' ou 'desktop' */
  static getDeviceType() {
    const ua = navigator.userAgent.toLowerCase();
    if (/tablet|ipad|playbook|silk/.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|windows ce|palm|smartphone/.test(ua)) return 'mobile';
    return 'desktop';
  }

  /** Verifica se está online */
  static isOnline() {
    return navigator.onLine;
  }

  /** Registra callback para mudanças na conexão online/offline */
  static onConnectionChange(callback) {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  }

  /** Vibrar dispositivo, se suportado e ativado nas configurações */
  static vibrate(pattern = [200]) {
    if ('vibrate' in navigator && GameConfig.UI.vibrationEnabled) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        ConfigManager.log('Vibração não suportada:', error);
      }
    }
  }

  /** Verifica suporte a áudio */
  static hasAudioSupport() {
    return !!(window.AudioContext || window.webkitAudioContext || window.Audio);
  }

  /** Cria e reproduz beep */
  static playBeep(frequency = 800, duration = 200, volume = 0.3) {
    if (!this.hasAudioSupport() || !ConfigManager.isAudioEnabled()) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioCtx();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      ConfigManager.log('Erro ao reproduzir beep:', error);
    }
  }

  /** Cria partículas flutuantes dentro do container especificado */
  static createFloatingParticles(container = null, count = 50) {
    const particlesContainer = container || document.getElementById('particles');
    if (!particlesContainer || !GameConfig.ANIMATIONS.particles.enabled) return;

    particlesContainer.innerHTML = '';
    const colors = ['#00E5FF', '#7B68EE', '#FF6B35', '#00FF88', '#FF10F0'];

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';

      const size = this.randomInt(2, 6);
      const color = colors[this.randomInt(0, colors.length - 1)];
      const left = this.randomInt(0, 100);
      const animationDuration = this.randomInt(6, 12);
      const delay = this.randomInt(0, 5);
      const opacity = this.randomFloat(0.3, 0.8);

      particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        left: ${left}%;
        animation-duration: ${animationDuration}s;
        animation-delay: ${delay}s;
        opacity: ${opacity};
      `;

      particlesContainer.appendChild(particle);
    }

    ConfigManager.log(`${count} partículas criadas`);
  }

  /** Atualiza partículas, recriando se necessário */
  static updateParticles(container = null) {
    const particlesContainer = container || document.getElementById('particles');
    if (!particlesContainer) return;

    if (particlesContainer.children.length === 0) {
      this.createFloatingParticles(particlesContainer);
    }
  }

  /** Interpola entre duas cores hex por fator (0 a 1) */
  static interpolateColor(color1, color2, factor) {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    if (!rgb1 || !rgb2) return color1;

    const r = Math.round(rgb1.r + factor * (rgb2.r - rgb1.r));
    const g = Math.round(rgb1.g + factor * (rgb2.g - rgb1.g));
    const b = Math.round(rgb1.b + factor * (rgb2.b - rgb1.b));

    return this.rgbToHex(r, g, b);
  }

  /** Converte hex para objeto RGB */
  static hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;

    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    };
  }

  /** Converte RGB para hex */
  static rgbToHex(r, g, b) {
    return (
      '#' +
      [r, g, b]
        .map((x) => x.toString(16).padStart(2, '0'))
        .join('')
    );
  }

  /** Calcula distância euclidiana entre dois pontos */
  static distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  /** Verifica se ponto (x,y) está dentro do retângulo (com propriedades left, right, top, bottom) */
  static isPointInRect(x, y, rect) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  /** Retorna informações da tela */
  static getScreenInfo() {
    return {
      width: window.innerWidth || document.documentElement.clientWidth,
      height: window.innerHeight || document.documentElement.clientHeight,
      ratio: window.devicePixelRatio || 1,
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
      type: this.getDeviceType()
    };
  }

  /** Retorna tema do sistema ('dark' ou 'light') */
  static getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  /** Retorna idioma do navegador */
  static getSystemLanguage() {
    return navigator.language || navigator.userLanguage || 'pt-BR';
  }

  /** Verifica suporte a recursos do navegador */
  static getFeatureSupport() {
    const testStorage = (storage) => {
      try {
        const test = '__test__';
        storage.setItem(test, test);
        storage.removeItem(test);
        return true;
      } catch {
        return false;
      }
    };

    return {
      localStorage: testStorage(localStorage),
      sessionStorage: testStorage(sessionStorage),
      vibration: 'vibrate' in navigator,
      audio: this.hasAudioSupport(),
      geolocation: 'geolocation' in navigator,
      notification: 'Notification' in window,
      serviceWorker: 'serviceWorker' in navigator,
      webGL: (() => {
        try {
          const canvas = document.createElement('canvas');
          return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
        } catch {
          return false;
        }
      })(),
      touch: 'ontouchstart' in window,
      pointer: 'PointerEvent' in window,
      intersectionObserver: 'IntersectionObserver' in window,
      mutationObserver: 'MutationObserver' in window
    };
  }

  /** Retorna informações de performance do navegador */
  static getPerformanceInfo() {
    if (!window.performance) return null;

    const navigation = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');

    return {
      domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
      loadComplete: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
      firstPaint: paint.find((p) => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find((p) => p.name === 'first-contentful-paint')?.startTime || 0,
      memory: performance.memory
        ? {
            used: Math.round(performance.memory.usedJSHeapSize / 1048576),
            total: Math.round(performance.memory.totalJSHeapSize / 1048576),
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
          }
        : null
    };
  }

  /** Retorna array dos gamepads conectados */
  static getGamepads() {
    if (!navigator.getGamepads) return [];
    return Array.from(navigator.getGamepads()).filter((gp) => gp !== null);
  }

  /** Gera UUID simples */
  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /** Gera ID único simples com prefixo opcional */
  static generateId(prefix = '') {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  /** Calcula hash simples de string */
  static simpleHash(str) {
    let hash = 0;
    if (!str.length) return hash;

    for (let i = 0; i < str.length; i++) {
      const chr = str.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Converte para 32-bit inteiro
    }

    return Math.abs(hash);
  }

  /** Calcula estatísticas básicas de array numérico */
  static calculateStats(numbers) {
    if (!Array.isArray(numbers) || numbers.length === 0) {
      return { min: 0, max: 0, avg: 0, sum: 0, count: 0, median: 0 };
    }

    const validNumbers = numbers.filter((n) => typeof n === 'number' && !isNaN(n));
    if (validNumbers.length === 0) {
      return { min: 0, max: 0, avg: 0, sum: 0, count: 0, median: 0 };
    }

    const sum = validNumbers.reduce((acc, n) => acc + n, 0);
    const avg = sum / validNumbers.length;
    const min = Math.min(...validNumbers);
    const max = Math.max(...validNumbers);
    const median = this.calculateMedian(validNumbers);

    return {
      min,
      max,
      avg: parseFloat(avg.toFixed(2)),
      sum,
      count: validNumbers.length,
      median
    };
  }

  /** Calcula mediana de array numérico */
  static calculateMedian(numbers) {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
  }

  /** Valida entrada numérica com opções */
  static validateNumberInput(value, min = -Infinity, max = Infinity, allowDecimals = false) {
    const num = allowDecimals ? parseFloat(value) : parseInt(value, 10);
    if (isNaN(num)) return { valid: false, error: 'Valor não é um número válido' };
    if (num < min) return { valid: false, error: `Valor deve ser maior ou igual a ${min}` };
    if (num > max) return { valid: false, error: `Valor deve ser menor ou igual a ${max}` };
    if (!allowDecimals && !Number.isInteger(num)) return { valid: false, error: 'Valor deve ser um número inteiro' };

    return { valid: true, value: num };
  }

  /** Formata data com opções de localidade e formatação */
  static formatDate(date, locale = 'pt-BR', options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(date);
  }

  /** Retorna texto humanizado de tempo decorrido */
  static timeAgo(date) {
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    const intervals = [
      { label: 'ano', seconds: 31536000 },
      { label: 'mês', seconds: 2592000 },
      { label: 'dia', seconds: 86400 },
      { label: 'hora', seconds: 3600 },
      { label: 'minuto', seconds: 60 },
      { label: 'segundo', seconds: 1 }
    ];

    for (const interval of intervals) {
      const count = Math.floor(diffSeconds / interval.seconds);
      if (count > 0) {
        return count === 1 ? `há 1 ${interval.label}` : `há ${count} ${interval.label}s`;
      }
    }
    return 'agora mesmo';
  }

  /** Executa poll/periódico até sucesso ou máximo de tentativas */
  static poll(fn, interval = 1000, maxAttempts = Infinity) {
    let attempts = 0;
    return new Promise((resolve, reject) => {
      const timer = setInterval(async () => {
        attempts++;
        try {
          const result = await fn();
          if (result) {
            clearInterval(timer);
            resolve(result);
          }
        } catch (error) {
          clearInterval(timer);
          reject(error);
        }
        if (attempts >= maxAttempts) {
          clearInterval(timer);
          reject(new Error('Máximo de tentativas atingido'));
        }
      }, interval);
    });
  }

  /** Delay/sleep assíncrono */
  static sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  /** Retry com backoff exponencial */
  static async retry(fn, maxAttempts = 3, baseDelay = 1000) {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
          ConfigManager.log(`Tentativa ${attempt} falhou, tentando novamente em ${delay}ms...`);
        }
      }
    }
    throw lastError;
  }

  /** Copia texto para clipboard */
  static async copyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback para navegadores antigos
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      }
    } catch (error) {
      ConfigManager.error('Erro ao copiar para clipboard:', error);
      return false;
    }
  }

  /** Cria gradiente CSS linear */
  static createGradient(colors, direction = 'to right') {
    if (!Array.isArray(colors) || colors.length < 2) {
      return colors[0] || '#000000';
    }
    const colorStops = colors
      .map((color, idx) => `${color} ${(idx / (colors.length - 1)) * 100}%`)
      .join(', ');
    return `linear-gradient(${direction}, ${colorStops})`;
  }

  /** Cria analisador de áudio para um elemento HTMLMediaElement */
  static createAudioAnalyzer(audioElement) {
    if (!this.hasAudioSupport()) return null;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioCtx();
      const source = audioContext.createMediaElementSource(audioElement);
      const analyzer = audioContext.createAnalyser();

      source.connect(analyzer);
      analyzer.connect(audioContext.destination);

      analyzer.fftSize = 256;
      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      return {
        getFrequencyData: () => {
          analyzer.getByteFrequencyData(dataArray);
          return dataArray;
        },
        getAverageFrequency: () => {
          analyzer.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((acc, val) => acc + val, 0);
          return sum / bufferLength;
        },
        destroy: () => {
          source.disconnect();
          analyzer.disconnect();
          audioContext.close();
        }
      };
    } catch (error) {
      ConfigManager.error('Erro ao criar analisador de áudio:', error);
      return null;
    }
  }

  /** Utilitários para desenvolvimento */
  static dev = {
    /** Inicia timer de performance (se debug habilitado) */
    time: (label) => {
      if (ConfigManager.isDebugEnabled()) console.time(label);
    },
    /** Finaliza timer de performance (se debug habilitado) */
    timeEnd: (label) => {
      if (ConfigManager.isDebugEnabled()) console.timeEnd(label);
    },
    /** Destaca elemento visualmente */
    highlight: (element, duration = 2000) => {
      if (!ConfigManager.isDebugEnabled() || !element) return;
      const originalOutline = element.style.outline;
      element.style.outline = '3px solid #ff0000';
      setTimeout(() => (element.style.outline = originalOutline), duration);
    },
    /** Exibe dump das infos do sistema */
    dumpSystemInfo: () => {
      if (!ConfigManager.isDebugEnabled()) return;

      const info = {
        screen: Utils.getScreenInfo(),
        features: Utils.getFeatureSupport(),
        performance: Utils.getPerformanceInfo(),
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        online: navigator.onLine,
        doNotTrack: navigator.doNotTrack,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
        connection: navigator.connection
          ? {
              effectiveType: navigator.connection.effectiveType,
              downlink: navigator.connection.downlink,
              rtt: navigator.connection.rtt
            }
          : 'N/A'
      };

      console.group('System Information');
      console.table(info);
      console.groupEnd();

      return info;
    }
  };

  /** Utilitários para testes */
  static test = {
    /** Gera dados de teste de jogos */
    generateGameStats: (count = 10) => {
      const stats = [];
      for (let i = 0; i < count; i++) {
        stats.push({
          id: Utils.generateId('game_'),
          timestamp: new Date(Date.now() - Utils.randomInt(0, 7 * 24 * 60 * 60 * 1000)),
          difficulty: ['easy', 'medium', 'hard', 'expert'][Utils.randomInt(0, 3)],
          attempts: Utils.randomInt(1, 15),
          score: Utils.randomInt(100, 2000),
          time: Utils.randomInt(5000, 120000),
          won: Math.random() > 0.3
        });
      }
      return stats;
    },

    /** Simula jogo com tentativas e dificuldade */
    simulateGame: (difficulty = 'medium', targetNumber = null) => {
      const config = ConfigManager.getDifficultyConfig(difficulty);
      const secret = targetNumber || Utils.randomInt(config.min, config.max);
      const attempts = [];
      let guess = Utils.randomInt(config.min, config.max);
      let attemptCount = 0;

      while (guess !== secret && attemptCount < config.maxAttempts) {
        attemptCount++;
        attempts.push(guess);
        guess = guess < secret
          ? Utils.randomInt(guess + 1, config.max)
          : Utils.randomInt(config.min, guess - 1);
      }

      return {
        secretNumber: secret,
        attempts,
        won: guess === secret,
        totalAttempts: attemptCount,
        finalGuess: guess
      };
    }
  };
}

export default Utils;
