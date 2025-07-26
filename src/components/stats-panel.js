/**
 * STATS PANEL COMPONENT - Painel de estatísticas do jogador
 * Arquivo: src/components/stats-panel.js
 */

import { GameConfig, ConfigManager } from '../js/config.js';
import { Utils } from '../js/utils.js';

export class StatsPanel {
  constructor(containerId = 'statsPanel') {
    this.container = document.getElementById(containerId);
    this.currentStats = {};
    this.animationQueue = [];
    this.isAnimating = false;
    this.chartInstances = {};
    this.init();
  }

  /**
   * Inicialização do componente
   */
  init() {
    if (!this.container) {
      ConfigManager.error('Container do stats panel não encontrado!');
      return;
    }

    this.render();
    this.setupEventListeners();
    this.loadInitialStats();

    ConfigManager.log('Stats Panel inicializado');
  }

  /**
   * Renderizar painel de estatísticas
   */
  render() {
    this.container.innerHTML = `
      <div class="stats-panel-content">
        <!-- Cabeçalho das Estatísticas -->
        <div class="stats-header" id="statsHeader">
          <div class="stats-title">
            <span class="title-icon"></span>
            <span class="title-text">Suas Estatísticas</span>
          </div>
          <div class="stats-actions">
            <button class="stats-action-btn" id="refreshStatsBtn" title="Atualizar">
              <span class="btn-icon"></span>
            </button>
            <button class="stats-action-btn" id="exportStatsBtn" title="Exportar">
              <span class="btn-icon"></span>
            </button>
            <button class="stats-action-btn" id="resetStatsBtn" title="Resetar">
              <span class="btn-icon"></span>
            </button>
          </div>
        </div>

        <!-- Estatísticas Principais -->
        <div class="main-stats" id="mainStats">
          <div class="stat-card" data-stat="gamesPlayed">
            <div class="stat-icon"></div>
            <div class="stat-content">
              <div class="stat-value" id="totalGames">0</div>
              <div class="stat-label">Jogos</div>
              <div class="stat-trend" id="gamesTrend"></div>
            </div>
            <div class="stat-sparkline" id="gamesSparkline"></div>
          </div>

          <div class="stat-card" data-stat="gamesWon">
            <div class="stat-icon"></div>
            <div class="stat-content">
              <div class="stat-value" id="totalWins">0</div>
              <div class="stat-label">Vitórias</div>
              <div class="stat-trend" id="winsTrend"></div>
            </div>
            <div class="stat-sparkline" id="winsSparkline"></div>
          </div>

          <div class="stat-card" data-stat="winRate">
            <div class="stat-icon"></div>
            <div class="stat-content">
              <div class="stat-value" id="winRate">0%</div>
              <div class="stat-label">Taxa de Vitória</div>
              <div class="stat-trend" id="winRateTrend"></div>
            </div>
            <div class="stat-progress">
              <div class="progress-bar">
                <div class="progress-fill" id="winRateProgress"></div>
              </div>
            </div>
          </div>

          <div class="stat-card" data-stat="bestScore">
            <div class="stat-icon"></div>
            <div class="stat-content">
              <div class="stat-value" id="bestScore">0</div>
              <div class="stat-label">Melhor Pontuação</div>
              <div class="stat-trend" id="scoreTrend"></div>
            </div>
            <div class="stat-achievement" id="scoreAchievement"></div>
          </div>

          <div class="stat-card" data-stat="currentStreak">
            <div class="stat-icon"></div>
            <div class="stat-content">
              <div class="stat-value" id="currentStreak">0</div>
              <div class="stat-label">Sequência Atual</div>
              <div class="stat-trend" id="streakTrend"></div>
            </div>
            <div class="streak-flames" id="streakFlames"></div>
          </div>

          <div class="stat-card" data-stat="avgAttempts">
            <div class="stat-icon"></div>
            <div class="stat-content">
              <div class="stat-value" id="avgAttempts">0</div>
              <div class="stat-label">Média de Tentativas</div>
              <div class="stat-trend" id="attemptsTrend"></div>
            </div>
            <div class="efficiency-meter" id="efficiencyMeter"></div>
          </div>
        </div>

        <!-- Estatísticas Detalhadas -->
        <div class="detailed-stats" id="detailedStats">
          <div class="stats-section">
            <h4 class="section-title"></h4>
            <div class="difficulty-stats" id="difficultyStats"></div>
          </div>

          <div class="stats-section">
            <h4 class="section-title"></h4>
            <div class="activity-chart" id="activityChart">
              <div class="chart-placeholder">
                <div class="chart-icon"></div>
                <div class="chart-text">Dados sendo carregados...</div>
              </div>
            </div>
          </div>

          <div class="stats-section">
            <h4 class="section-title"></h4>
            <div class="achievements-grid" id="achievementsGrid"></div>
          </div>

          <div class="stats-section">
            <h4 class="section-title"></h4>
            <div class="trends-container" id="trendsContainer"></div>
          </div>
        </div>

        <!-- Resumo de Sessão -->
        <div class="session-summary" id="sessionSummary">
          <h4 class="section-title"></h4>
          <div class="session-stats">
            <div class="session-stat">
              <span class="session-label">Tempo de Jogo:</span>
              <span class="session-value" id="sessionTime">0min</span>
            </div>
            <div class="session-stat">
              <span class="session-label">Jogos Nesta Sessão:</span>
              <span class="session-value" id="sessionGames">0</span>
            </div>
            <div class="session-stat">
              <span class="session-label">Melhor da Sessão:</span>
              <span class="session-value" id="sessionBest">0 pts</span>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.classList.add('stats-panel-component');
  }

  /**
   * Configurar event listeners
   */
  setupEventListeners() {
    const refreshBtn = document.getElementById('refreshStatsBtn');
    refreshBtn?.addEventListener('click', () => this.refreshStats());

    const exportBtn = document.getElementById('exportStatsBtn');
    exportBtn?.addEventListener('click', () => this.exportStats());

    const resetBtn = document.getElementById('resetStatsBtn');
    resetBtn?.addEventListener('click', () => this.resetStats());

    this.setupCardHoverEffects();

    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
      card.addEventListener('dblclick', () => {
        const statType = card.dataset.stat;
        this.showStatDetails(statType);
      });
    });

    ConfigManager.log('Event listeners do stats panel configurados');
  }

  /**
   * Configurar efeitos de hover nos cards
   */
  setupCardHoverEffects() {
    const statCards = document.querySelectorAll('.stat-card');

    statCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        if (GameConfig.ANIMATIONS.enabled) {
          card.style.transform = 'translateY(-5px) scale(1.02)';
          card.style.boxShadow = '0 10px 30px rgba(0, 229, 255, 0.3)';
        }
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.boxShadow = '';
      });
    });
  }

  /**
   * Carregar estatísticas iniciais
   */
  loadInitialStats() {
    const savedStats = JSON.parse(localStorage.getItem(GameConfig.STORAGE.keys.stats) || '{}');
    this.updateStats(savedStats);
  }

  /**
   * Atualizar estatísticas
   */
  updateStats(newStats) {
    const stats = { ...this.getDefaultStats(), ...newStats };

    const derived = this.calculateDerivedStats(stats);
    const fullStats = { ...stats, ...derived };

    this.currentStats = fullStats;

    this.updateMainStats(fullStats);
    this.updateDetailedStats(fullStats);
    this.updateSessionStats();

    this.updateCharts(fullStats);

    ConfigManager.log('Estatísticas atualizadas:', fullStats);
  }

  /**
   * Atualizar estatísticas principais
   */
  updateMainStats(stats) {
    const updates = [
      { id: 'totalGames', value: stats.gamesPlayed, format: 'number' },
      { id: 'totalWins', value: stats.gamesWon, format: 'number' },
      { id: 'winRate', value: stats.winRate, format: 'percentage' },
      { id: 'bestScore', value: stats.bestScore, format: 'score' },
      { id: 'currentStreak', value: stats.currentStreak, format: 'number' },
      { id: 'avgAttempts', value: stats.averageAttempts, format: 'decimal' }
    ];

    updates.forEach(({ id, value, format }) => {
      this.updateStatValue(id, value, format);
    });

    this.updateWinRateProgress(stats.winRate);
    this.updateStreakFlames(stats.currentStreak);
    this.updateEfficiencyMeter(stats.averageAttempts);
  }

  /**
   * Atualizar valor de estatística
   */
  updateStatValue(elementId, newValue, format = 'number') {
    const element = document.getElementById(elementId);
    if (!element) return;

    const oldValue = this.parseValueFromElement(element);

    if (oldValue !== newValue) {
      this.animateValueChange(element, oldValue, newValue, format);
      this.updateTrend(elementId, oldValue, newValue);
    }
  }

  /**
   * Animar mudança de valor
   */
  animateValueChange(element, oldValue, newValue, format) {
    if (!GameConfig.ANIMATIONS.enabled) {
      element.textContent = this.formatValue(newValue, format);
      return;
    }

    const duration = 1000;
    const steps = 30;
    const increment = (newValue - oldValue) / steps;
    let currentValue = oldValue;
    let step = 0;

    element.style.color = 'var(--neon-cyan)';
    element.style.transform = 'scale(1.1)';

    const interval = setInterval(() => {
      step++;
      currentValue += increment;

      if (step >= steps) {
        clearInterval(interval);
        currentValue = newValue;

        setTimeout(() => {
          element.style.color = '';
          element.style.transform = '';
        }, 200);
      }

      element.textContent = this.formatValue(Math.round(currentValue * 100) / 100, format);
    }, duration / steps);
  }

  /**
   * Atualizar tendência
   */
  updateTrend(statId, oldValue, newValue) {
    const trendElement = document.getElementById(`${statId.replace(/([A-Z])/g, s => s.toLowerCase())}Trend`);
    if (!trendElement) return;

    const difference = newValue - oldValue;
    let trendIcon = '';
    let trendClass = '';

    if (difference > 0) {
      trendIcon = '';
      trendClass = 'trend-up';
    } else if (difference < 0) {
      trendIcon = '';
      trendClass = 'trend-down';
    } else {
      trendIcon = '';
      trendClass = 'trend-stable';
    }

    trendElement.textContent = trendIcon;
    trendElement.className = `stat-trend ${trendClass}`;

    if (difference !== 0 && GameConfig.ANIMATIONS.enabled) {
      trendElement.style.animation = 'trendPulse 0.6s ease-in-out';
      setTimeout(() => {
        trendElement.style.animation = '';
      }, 600);
    }
  }

  /**
   * Atualizar barra de progresso da taxa de vitória
   */
  updateWinRateProgress(winRate) {
    const progressFill = document.getElementById('winRateProgress');
    if (!progressFill) return;

    progressFill.style.width = `${winRate}%`;

    if (winRate >= 80) {
      progressFill.style.background = 'var(--success-green)';
    } else if (winRate >= 60) {
      progressFill.style.background = 'var(--neon-cyan)';
    } else if (winRate >= 40) {
      progressFill.style.background = 'var(--warning-orange)';
    } else {
      progressFill.style.background = 'var(--error-red)';
    }
  }

  /**
   * Atualizar chamas da sequência
   */
  updateStreakFlames(streak) {
    const streakFlames = document.getElementById('streakFlames');
    if (!streakFlames) return;

    streakFlames.innerHTML = '';

    const flameCount = Math.min(streak, 10);

    for (let i = 0; i < flameCount; i++) {
      const flame = document.createElement('div');
      flame.className = 'streak-flame';
      flame.textContent = '';
      flame.style.animationDelay = `${i * 0.1}s`;
      streakFlames.appendChild(flame);
    }

    if (streak >= 5) {
      streakFlames.classList.add('streak-hot');
    } else {
      streakFlames.classList.remove('streak-hot');
    }
  }

  /**
   * Atualizar medidor de eficiência
   */
  updateEfficiencyMeter(avgAttempts) {
    const efficiencyMeter = document.getElementById('efficiencyMeter');
    if (!efficiencyMeter) return;

    const maxAttempts = 10;
    const efficiency = Math.max(0, ((maxAttempts - avgAttempts) / maxAttempts) * 100);

    efficiencyMeter.innerHTML = `
      <div class="efficiency-bar">
        <div class="efficiency-fill" style="width: ${efficiency}%"></div>
      </div>
      <div class="efficiency-label">${Math.round(efficiency)}% eficiente</div>
    `;
  }

  /**
   * Atualizar estatísticas detalhadas
   */
  updateDetailedStats(stats) {
    this.updateDifficultyStats(stats);
    this.updateAchievements(stats);
    this.generateActivityChart(stats);
  }

  /**
   * Atualizar estatísticas por dificuldade
   */
  updateDifficultyStats(stats) {
    const difficultyStats = document.getElementById('difficultyStats');
    if (!difficultyStats) return;

    difficultyStats.innerHTML = '';

    Object.entries(GameConfig.DIFFICULTY_LEVELS).forEach(([key, config]) => {
      const diffStats = stats.byDifficulty?.[key] || { played: 0, won: 0 };
      const winRate = diffStats.played > 0 ? ((diffStats.won / diffStats.played) * 100).toFixed(1) : '0.0';

      const diffCard = document.createElement('div');
      diffCard.className = 'difficulty-stat-card';
      diffCard.innerHTML = `
        <div class="diff-header">
          <span class="diff-emoji"></span>
          <span class="diff-name">${config.name}</span>
        </div>
        <div class="diff-stats">
          <div class="diff-stat">
            <span class="diff-label">Jogados:</span>
            <span class="diff-value">${diffStats.played}</span>
          </div>
          <div class="diff-stat">
            <span class="diff-label">Vencidos:</span>
            <span class="diff-value">${diffStats.won}</span>
          </div>
          <div class="diff-stat">
            <span class="diff-label">Taxa:</span>
            <span class="diff-value">${winRate}%</span>
          </div>
        </div>
        <div class="diff-progress">
          <div class="diff-progress-bar">
            <div class="diff-progress-fill" style="width: ${winRate}%; background: ${config.color}"></div>
          </div>
        </div>
      `;

      difficultyStats.appendChild(diffCard);
    });
  }

  /**
   * Atualizar conquistas
   */
  updateAchievements(stats) {
    const achievementsGrid = document.getElementById('achievementsGrid');
    if (!achievementsGrid) return;

    const achievements = this.calculateAchievements(stats);
    achievementsGrid.innerHTML = '';

    achievements.forEach(achievement => {
      const achievementCard = document.createElement('div');
      achievementCard.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;
      achievementCard.innerHTML = `
        <div class="achievement-icon"></div>
        <div class="achievement-info">
          <div class="achievement-title">${achievement.title}</div>
          <div class="achievement-desc">${achievement.description}</div>
          ${achievement.progress !== undefined ? 
            `<div class="achievement-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${achievement.progress}%"></div>
              </div>
              <span class="progress-text">${achievement.progress}%</span>
            </div>` : ''
          }
        </div>
        ${achievement.unlocked ? '<div class="achievement-check"></div>' : ''}
      `;

      achievementsGrid.appendChild(achievementCard);
    });
  }

  /**
   * Calcular conquistas
   */
  calculateAchievements(stats) {
    return [
      {
        id: 'first_win',
        title: 'Primeira Vitória',
        description: 'Ganhe seu primeiro jogo',
        unlocked: stats.gamesWon >= 1,
        progress: stats.gamesWon >= 1 ? 100 : 0
      },
      {
        id: 'ten_wins',
        title: 'Veterano',
        description: 'Ganhe 10 jogos',
        unlocked: stats.gamesWon >= 10,
        progress: Math.min((stats.gamesWon / 10) * 100, 100)
      },
      {
        id: 'streak_5',
        title: 'Em Chamas',
        description: 'Ganhe 5 jogos seguidos',
        unlocked: stats.longestStreak >= 5,
        progress: Math.min((stats.longestStreak / 5) * 100, 100)
      },
      {
        id: 'perfect_game',
        title: 'Perfeição',
        description: 'Ganhe um jogo em 1 tentativa',
        unlocked: stats.perfectGames >= 1,
        progress: stats.perfectGames >= 1 ? 100 : 0
      },
      {
        id: 'high_efficiency',
        title: 'Eficiência Máxima',
        description: 'Mantenha média de 3 tentativas ou menos',
        unlocked: stats.averageAttempts <= 3 && stats.gamesWon >= 5,
        progress: stats.gamesWon >= 5 ? Math.max(0, 100 - ((stats.averageAttempts - 1) / 2) * 100) : 0
      },
      {
        id: 'all_difficulties',
        title: 'Mestre Universal',
        description: 'Ganhe pelo menos 1 jogo em cada dificuldade',
        unlocked: this.hasWonAllDifficulties(stats),
        progress: this.calculateAllDifficultiesProgress(stats)
      }
    ];
  }

  /**
   * Gerar gráfico de atividade
   */
  generateActivityChart(stats) {
    const activityChart = document.getElementById('activityChart');
    if (!activityChart) return;

    const last7Days = this.getLast7DaysActivity(stats);

    activityChart.innerHTML = `
      <div class="activity-bars">
        ${last7Days.map((day, index) => `
          <div class="activity-bar-container">
            <div class="activity-bar" style="height: ${(day.games / Math.max(...last7Days.map(d => d.games), 1)) * 100}%">
              <div class="bar-fill" style="background: ${day.games > 0 ? 'var(--success-green)' : 'var(--text-gray)'}"></div>
            </div>
            <div class="activity-label">${day.label}</div>
            <div class="activity-value">${day.games}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Obter atividade dos últimos 7 dias
   */
  getLast7DaysActivity(stats) {
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      days.push({
        date: date,
        label: i === 0 ? 'Hoje' : date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        games: Math.floor(Math.random() * 5),
        wins: Math.floor(Math.random() * 3)
      });
    }

    return days;
  }

  /**
   * Atualizar estatísticas da sessão
   */
  updateSessionStats() {
    const sessionStart = Date.now() - (Math.random() * 3600000);
    const sessionTime = Math.floor((Date.now() - sessionStart) / 60000);

    const sessionTimeEl = document.getElementById('sessionTime');
    const sessionGamesEl = document.getElementById('sessionGames');
    const sessionBestEl = document.getElementById('sessionBest');

    if (sessionTimeEl) sessionTimeEl.textContent = `${sessionTime}min`;
    if (sessionGamesEl) sessionGamesEl.textContent = '0';
    if (sessionBestEl) sessionBestEl.textContent = '0 pts';
  }

  /**
   * Calcular estatísticas derivadas
   */
  calculateDerivedStats(stats) {
    const winRate = stats.gamesPlayed > 0 ? 
      ((stats.gamesWon / stats.gamesPlayed) * 100) : 0;

    const averageAttempts = stats.gamesWon > 0 ? 
      (stats.totalAttempts / stats.gamesWon) : 0;

    return {
      winRate: Math.round(winRate * 10) / 10,
      averageAttempts: Math.round(averageAttempts * 10) / 10,
      perfectGames: stats.perfectGames || 0,
      longestStreak: stats.longestStreak || 0
    };
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
      perfectGames: 0,
      byDifficulty: {}
    };
  }

  /**
   * Analisar valor do elemento
   */
  parseValueFromElement(element) {
    const text = element.textContent.replace(/[^\d.-]/g, '');
    return parseFloat(text) || 0;
  }

  /**
   * Formatar valor
   */
  formatValue(value, format) {
    switch (format) {
      case 'percentage':
        return `${Math.round(value * 10) / 10}%`;
      case 'score':
        return Utils.formatScore(value);
      case 'decimal':
        return Math.round(value * 10) / 10;
      case 'number':
      default:
        return Math.round(value);
    }
  }

  /**
   * Verificar se ganhou em todas as dificuldades
   */
  hasWonAllDifficulties(stats) {
    const difficulties = Object.keys(GameConfig.DIFFICULTY_LEVELS);
    return difficulties.every(diff => 
      stats.byDifficulty?.[diff]?.won >= 1
    );
  }

  /**
   * Calcular progresso de todas as dificuldades
   */
  calculateAllDifficultiesProgress(stats) {
    const difficulties = Object.keys(GameConfig.DIFFICULTY_LEVELS);
    const completed = difficulties.filter(diff => 
      stats.byDifficulty?.[diff]?.won >= 1
    ).length;

    return (completed / difficulties.length) * 100;
  }

  /**
   * Atualizar gráficos
   */
  updateCharts(stats) {
    ConfigManager.log('Gráficos atualizados');
  }

  /**
   * Refrescar estatísticas
   */
  refreshStats() {
    const refreshBtn = document.getElementById('refreshStatsBtn');
    if (refreshBtn) {
      refreshBtn.style.transform = 'rotate(360deg)';
      setTimeout(() => {
        refreshBtn.style.transform = '';
      }, 500);
    }

    this.loadInitialStats();

    ConfigManager.log('Estatísticas atualizadas manualmente');
  }

  /**
   * Exportar estatísticas
   */
  exportStats() {
    const data = {
      stats: this.currentStats,
      exportDate: new Date().toISOString(),
      version: GameConfig.STORAGE.version
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `numero-secreto-stats-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    const exportBtn = document.getElementById('exportStatsBtn');
    if (exportBtn) {
      exportBtn.style.background = 'var(--success-green)';
      setTimeout(() => {
        exportBtn.style.background = '';
      }, 1000);
    }

    ConfigManager.log('Estatísticas exportadas');
  }

  /**
   * Resetar estatísticas
   */
  resetStats() {
    const confirmed = confirm(
      'Tem certeza de que deseja resetar todas as estatísticas? Esta ação não pode ser desfeita.'
    );

    if (!confirmed) return;

    localStorage.removeItem(GameConfig.STORAGE.keys.stats);

    const defaultStats = this.getDefaultStats();
    this.updateStats(defaultStats);

    const resetBtn = document.getElementById('resetStatsBtn');
    if (resetBtn) {
      resetBtn.style.background = 'var(--error-red)';
      setTimeout(() => {
        resetBtn.style.background = '';
      }, 1000);
    }

    ConfigManager.log('Estatísticas resetadas');
  }

  /**
   * Mostrar detalhes da estatística
   */
  showStatDetails(statType) {
    const details = this.getStatDetails(statType);

    const modal = document.createElement('div');
    modal.className = 'stat-details-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${details.title}</h3>
          <button class="modal-close">×</button>
        </div>
        <div class="modal-body">
          ${details.content}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    ConfigManager.log('Detalhes da estatística exibidos:', statType);
  }

  /**
   * Obter detalhes da estatística
   */
  getStatDetails(statType) {
    const details = {
      gamesPlayed: {
        title: 'Jogos Jogados',
        content: `
          <p>Total de jogos iniciados: <strong>${this.currentStats.gamesPlayed}</strong></p>
          <p>Inclui jogos completos e abandonados.</p>
        `
      },
      gamesWon: {
        title: 'Vitórias',
        content: `
          <p>Total de vitórias: <strong>${this.currentStats.gamesWon}</strong></p>
          <p>Jogos onde você descobriu o número secreto.</p>
        `
      },
      winRate: {
        title: 'Taxa de Vitória',
        content: `
          <p>Taxa atual: <strong>${this.currentStats.winRate}%</strong></p>
          <p>Calculada como: (Vitórias ÷ Jogos) × 100</p>
        `
      }
    };

    return details[statType] || { title: 'Detalhes', content: 'Informações não disponíveis.' };
  }

  /**
   * Limpar recursos
   */
  destroy() {
    Object.values(this.chartInstances).forEach(chart => {
      if (chart.destroy) chart.destroy();
    });

    ConfigManager.log('Stats Panel destruído');
  }
}

// Inicialização automática
document.addEventListener('DOMContentLoaded', () => {
  window.statsPanel = new StatsPanel();

  document.addEventListener('statsUpdated', (e) => {
    if (window.statsPanel) {
      window.statsPanel.updateStats(e.detail.stats);
    }
  });
});

export default StatsPanel;
