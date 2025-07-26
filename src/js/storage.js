/**
 * STORAGE MANAGER - Gerenciamento de persistência de dados
 * Arquivo: src/js/storage.js
 */

import { GameConfig, ConfigManager } from './config.js';

export class StorageManager {
  constructor() {
    this.isSupported = this.checkStorageSupport();
    this.init();
  }

  /**
   * Inicialização do storage
   */
  init() {
    ConfigManager.log('Inicializando Storage Manager...');
    
    if (!this.isSupported) {
      ConfigManager.error('LocalStorage não suportado!');
      return;
    }

    // Migrar dados de versões antigas se necessário
    this.migrateData();
    
    // Limpar dados expirados
    this.cleanExpiredData();
    
    ConfigManager.log('Storage Manager inicializado com sucesso!');
  }

  /**
   * Verificar suporte ao localStorage
   */
  checkStorageSupport() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      ConfigManager.error('LocalStorage não disponível:', error);
      return false;
    }
  }

  /**
   * Obter estatísticas do jogador
   */
  getStats() {
    if (!this.isSupported) return this.getDefaultStats();

    try {
      const statsJson = localStorage.getItem(GameConfig.STORAGE.keys.stats);
      if (!statsJson) return this.getDefaultStats();

      const stats = JSON.parse(statsJson);
      
      // Validar estrutura dos dados
      if (!this.validateStatsStructure(stats)) {
        ConfigManager.log('Estrutura de stats inválida, resetando...');
        return this.getDefaultStats();
      }

      return {
        ...this.getDefaultStats(),
        ...stats,
        lastUpdated: stats.lastUpdated || Date.now()
      };
    } catch (error) {
      ConfigManager.error('Erro ao carregar estatísticas:', error);
      return this.getDefaultStats();
    }
  }

  /**
   * Salvar estatísticas do jogador
   */
  saveStats(stats) {
    if (!this.isSupported) {
      ConfigManager.log('Salvamento ignorado - localStorage não suportado');
      return false;
    }

    try {
      const statsToSave = {
        ...stats,
        lastUpdated: Date.now(),
        version: GameConfig.STORAGE.version
      };

      localStorage.setItem(
        GameConfig.STORAGE.keys.stats,
        JSON.stringify(statsToSave)
      );

      ConfigManager.log('Estatísticas salvas:', statsToSave);
      return true;
    } catch (error) {
      ConfigManager.error('Erro ao salvar estatísticas:', error);
      
      // Tentar limpar storage se estiver cheio
      if (error.name === 'QuotaExceededError') {
        this.cleanOldData();
        // Tentar novamente
        try {
          localStorage.setItem(
            GameConfig.STORAGE.keys.stats,
            JSON.stringify(stats)
          );
          return true;
        } catch (retryError) {
          ConfigManager.error('Erro mesmo após limpeza:', retryError);
        }
      }
      
      return false;
    }
  }

  /**
   * Obter configurações do jogo
   */
  getGameSettings() {
    if (!this.isSupported) return this.getDefaultSettings();

    try {
      const settingsJson = localStorage.getItem(GameConfig.STORAGE.keys.settings);
      if (!settingsJson) return this.getDefaultSettings();

      const settings = JSON.parse(settingsJson);
      
      return {
        ...this.getDefaultSettings(),
        ...settings
      };
    } catch (error) {
      ConfigManager.error('Erro ao carregar configurações:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Salvar configurações do jogo
   */
  saveGameSettings(settings) {
    if (!this.isSupported) return false;

    try {
      const settingsToSave = {
        ...settings,
        lastUpdated: Date.now(),
        version: GameConfig.STORAGE.version
      };

      localStorage.setItem(
        GameConfig.STORAGE.keys.settings,
        JSON.stringify(settingsToSave)
      );

      ConfigManager.log('Configurações salvas:', settingsToSave);
      return true;
    } catch (error) {
      ConfigManager.error('Erro ao salvar configurações:', error);
      return false;
    }
  }

  /**
   * Salvar melhor pontuação por dificuldade
   */
  saveBestScore(difficulty, score, gameData = {}) {
    if (!this.isSupported) return false;

    try {
      const key = `${GameConfig.STORAGE.keys.stats}_best_scores`;
      const scoresJson = localStorage.getItem(key);
      const scores = scoresJson ? JSON.parse(scoresJson) : {};

      if (!scores[difficulty] || score > scores[difficulty].score) {
        scores[difficulty] = {
          score,
          date: new Date().toISOString(),
          attempts: gameData.attempts || 0,
          time: gameData.time || 0,
          ...gameData
        };

        localStorage.setItem(key, JSON.stringify(scores));
        ConfigManager.log(`Nova melhor pontuação em ${difficulty}:`, score);
        return true;
      }

      return false;
    } catch (error) {
      ConfigManager.error('Erro ao salvar melhor pontuação:', error);
      return false;
    }
  }

  /**
   * Obter melhores pontuações
   */
  getBestScores() {
    if (!this.isSupported) return {};

    try {
      const key = `${GameConfig.STORAGE.keys.stats}_best_scores`;
      const scoresJson = localStorage.getItem(key);
      return scoresJson ? JSON.parse(scoresJson) : {};
    } catch (error) {
      ConfigManager.error('Erro ao carregar melhores pontuações:', error);
      return {};
    }
  }

  /**
   * Salvar histórico de jogos
   */
  saveGameHistory(gameData) {
    if (!this.isSupported) return false;

    try {
      const key = `${GameConfig.STORAGE.keys.stats}_history`;
      const historyJson = localStorage.getItem(key);
      const history = historyJson ? JSON.parse(historyJson) : [];

      const gameRecord = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        ...gameData
      };

      history.unshift(gameRecord); // Adicionar no início

      // Manter apenas os últimos 100 jogos
      const maxHistory = 100;
      if (history.length > maxHistory) {
        history.splice(maxHistory);
      }

      localStorage.setItem(key, JSON.stringify(history));
      ConfigManager.log('Jogo salvo no histórico:', gameRecord);
      return true;
    } catch (error) {
      ConfigManager.error('Erro ao salvar histórico:', error);
      return false;
    }
  }

  /**
   * Obter histórico de jogos
   */
  getGameHistory(limit = 20) {
    if (!this.isSupported) return [];

    try {
      const key = `${GameConfig.STORAGE.keys.stats}_history`;
      const historyJson = localStorage.getItem(key);
      const history = historyJson ? JSON.parse(historyJson) : [];

      return history.slice(0, limit);
    } catch (error) {
      ConfigManager.error('Erro ao carregar histórico:', error);
      return [];
    }
  }

  /**
   * Migrar dados de versões antigas
   */
  migrateData() {
    try {
      // Verificar se há dados da versão 1.0
      const oldStats = localStorage.getItem('secretNumber_oldStats');
      if (oldStats) {
        ConfigManager.log('Migrando dados da versão 1.0...');
        
        const parsedOldStats = JSON.parse(oldStats);
        const newStats = this.convertOldStatsFormat(parsedOldStats);
        
        this.saveStats(newStats);
        localStorage.removeItem('secretNumber_oldStats');
        
        ConfigManager.log('Migração concluída!');
      }
    } catch (error) {
      ConfigManager.error('Erro na migração de dados:', error);
    }
  }

  /**
   * Converter formato antigo de estatísticas
   */
  convertOldStatsFormat(oldStats) {
    return {
      gamesPlayed: oldStats.jogos || 0,
      gamesWon: oldStats.vitorias || 0,
      totalAttempts: oldStats.tentativasTotal || 0,
      totalTime: oldStats.tempoTotal || 0,
      bestScore: oldStats.melhorPontuacao || 0,
      currentStreak: 0, // Reset streak na migração
      longestStreak: oldStats.maiorSequencia || 0,
      averageAttempts: oldStats.mediaTentativas || 0,
      winRate: oldStats.taxaVitoria || 0
    };
  }

  /**
   * Limpar dados expirados
   */
  cleanExpiredData() {
    if (!this.isSupported) return;

    try {
      const expiredKeys = [];
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

      // Verificar cada chave no localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith('secretNumber_')) continue;

        try {
          const dataJson = localStorage.getItem(key);
          const data = JSON.parse(dataJson);
          
          if (data.lastUpdated && data.lastUpdated < thirtyDaysAgo) {
            expiredKeys.push(key);
          }
        } catch (parseError) {
          // Se não conseguir fazer parse, considerar expirado
          expiredKeys.push(key);
        }
      }

      // Remover chaves expiradas
      expiredKeys.forEach(key => {
        localStorage.removeItem(key);
        ConfigManager.log('Dados expirados removidos:', key);
      });

      if (expiredKeys.length > 0) {
        ConfigManager.log(`${expiredKeys.length} entradas expiradas removidas`);
      }
    } catch (error) {
      ConfigManager.error('Erro ao limpar dados expirados:', error);
    }
  }

  /**
   * Limpar dados antigos para liberar espaço
   */
  cleanOldData() {
    if (!this.isSupported) return;

    try {
      // Remover histórico mais antigo
      const historyKey = `${GameConfig.STORAGE.keys.stats}_history`;
      const historyJson = localStorage.getItem(historyKey);
      if (historyJson) {
        const history = JSON.parse(historyJson);
        const reducedHistory = history.slice(0, 50); // Manter apenas 50 jogos
        localStorage.setItem(historyKey, JSON.stringify(reducedHistory));
      }

      // Remover dados temporários
      const tempKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('temp_') || key.includes('cache_'))) {
          tempKeys.push(key);
        }
      }

      tempKeys.forEach(key => localStorage.removeItem(key));
      
      ConfigManager.log('Dados antigos limpos para liberar espaço');
    } catch (error) {
      ConfigManager.error('Erro ao limpar dados antigos:', error);
    }
  }

  /**
   * Obter estatísticas padrão
   */
  getDefaultStats() {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      totalAttempts: 0,
      totalTime: 0,
      bestScore: 0,
      currentStreak: 0,
      longestStreak: 0,
      averageAttempts: 0,
      winRate: 0,
      lastPlayed: null,
      firstPlayed: null,
      favoritedifficulty: 'easy',
      totalHintsUsed: 0,
      perfectGames: 0, // Jogos ganhos em 1 tentativa
      difficultiesUnlocked: ['easy']
    };
  }

  /**
   * Obter configurações padrão
   */
  getDefaultSettings() {
    return {
      audio: true,
      volume: 0.5,
      vibration: true,
      animations: true,
      particles: true,
      language: 'pt-BR',
      theme: 'neon',
      autoFocus: true,
      keyboardShortcuts: true,
      showHints: true,
      difficulty: 'easy'
    };
  }

  /**
   * Validar estrutura das estatísticas
   */
  validateStatsStructure(stats) {
    const requiredFields = [
      'gamesPlayed', 'gamesWon', 'totalAttempts', 
      'totalTime', 'bestScore', 'currentStreak'
    ];

    return requiredFields.every(field => 
      stats.hasOwnProperty(field) && 
      typeof stats[field] === 'number'
    );
  }

  /**
   * Limpar todas as estatísticas
   */
  clearStats() {
    if (!this.isSupported) return false;

    try {
      localStorage.removeItem(GameConfig.STORAGE.keys.stats);
      localStorage.removeItem(`${GameConfig.STORAGE.keys.stats}_history`);
      localStorage.removeItem(`${GameConfig.STORAGE.keys.stats}_best_scores`);
      
      ConfigManager.log('Todas as estatísticas foram limpadadas');
      return true;
    } catch (error) {
      ConfigManager.error('Erro ao limpar estatísticas:', error);
      return false;
    }
  }

  /**
   * Limpar todas as configurações
   */
  clearSettings() {
    if (!this.isSupported) return false;

    try {
      localStorage.removeItem(GameConfig.STORAGE.keys.settings);
      localStorage.removeItem(GameConfig.STORAGE.keys.difficulty);
      localStorage.removeItem(GameConfig.STORAGE.keys.theme);
      
      ConfigManager.log('Todas as configurações foram limpadas');
      return true;
    } catch (error) {
      ConfigManager.error('Erro ao limpar configurações:', error);
      return false;
    }
  }

  /**
   * Exportar dados do usuário
   */
  exportUserData() {
    if (!this.isSupported) return null;

    try {
      const userData = {
        stats: this.getStats(),
        settings: this.getGameSettings(),
        bestScores: this.getBestScores(),
        history: this.getGameHistory(100),
        exportDate: new Date().toISOString(),
        version: GameConfig.STORAGE.version
      };

      return JSON.stringify(userData, null, 2);
    } catch (error) {
      ConfigManager.error('Erro ao exportar dados:', error);
      return null;
    }
  }

  /**
   * Importar dados do usuário
   */
  importUserData(dataJson) {
    if (!this.isSupported) return false;

    try {
      const userData = JSON.parse(dataJson);
      
      // Validar estrutura
      if (!userData.stats || !userData.settings) {
        throw new Error('Estrutura de dados inválida');
      }

      // Importar dados
      this.saveStats(userData.stats);
      this.saveGameSettings(userData.settings);
      
      if (userData.bestScores) {
        localStorage.setItem(
          `${GameConfig.STORAGE.keys.stats}_best_scores`,
          JSON.stringify(userData.bestScores)
        );
      }
      
      if (userData.history) {
        localStorage.setItem(
          `${GameConfig.STORAGE.keys.stats}_history`,
          JSON.stringify(userData.history)
        );
      }

      ConfigManager.log('Dados importados com sucesso');
      return true;
    } catch (error) {
      ConfigManager.error('Erro ao importar dados:', error);
      return false;
    }
  }

  /**
   * Obter informações de uso do storage
   */
  getStorageInfo() {
    if (!this.isSupported) {
      return {
        supported: false,
        used: 0,
        available: 0,
        percentage: 0
      };
    }

    try {
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }

      // Estimar limite (geralmente 5-10MB)
      const estimatedLimit = 5 * 1024 * 1024; // 5MB
      const percentage = (used / estimatedLimit) * 100;

      return {
        supported: true,
        used: used,
        available: estimatedLimit - used,
        percentage: Math.min(percentage, 100),
        usedFormatted: this.formatBytes(used),
        availableFormatted: this.formatBytes(estimatedLimit - used)
      };
    } catch (error) {
      ConfigManager.error('Erro ao obter info do storage:', error);
      return {
        supported: true,
        used: 0,
        available: 0,
        percentage: 0
      };
    }
  }

  /**
   * Formatar bytes em formato legível
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default StorageManager;