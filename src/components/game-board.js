/**
 * GAME BOARD COMPONENT - Componente principal do tabuleiro de jogo
 * Arquivo: src/components/game-board.js
 */

import { GameConfig, ConfigManager } from '../js/config.js';
import { Utils } from '../js/utils.js';

export class GameBoard {
  constructor(containerId = 'gameBoard') {
    this.container = document.getElementById(containerId);
    this.gameState = null;
    this.isLocked = false;
    this.pulseInterval = null;
    this.init();
  }

  /**
   * Inicialização do componente
   */
  init() {
    if (!this.container) {
      ConfigManager.error('Container do game board não encontrado!');
      return;
    }

    this.render();
    this.setupEventListeners();
    this.startBackgroundEffects();

    ConfigManager.log('Game Board inicializado');
  }

  /**
   * Renderizar o tabuleiro
   */
  render() {
    this.container.innerHTML = `
      <div class="game-board-content">
        <!-- Seção de Informações do Jogo -->
        <div class="game-info-section" id="gameInfoSection">
          <div class="game-status-card">
            <div class="status-header">
              <div class="status-icon" id="gameStatusIcon"></div>
              <div class="status-text" id="gameStatusText">Pronto para começar!</div>
            </div>
            
            <div class="status-details">
              <div class="detail-grid">
                <div class="detail-card">
                  <div class="detail-icon"></div>
                  <div class="detail-content">
                    <div class="detail-label">Intervalo</div>
                    <div class="detail-value" id="gameRange">1 - 10</div>
                  </div>
                </div>
                
                <div class="detail-card">
                  <div class="detail-icon"></div>
                  <div class="detail-content">
                    <div class="detail-label">Tentativas</div>
                    <div class="detail-value" id="gameAttempts">0/5</div>
                  </div>
                </div>
                
                <div class="detail-card">
                  <div class="detail-icon"></div>
                  <div class="detail-content">
                    <div class="detail-label">Pontuação</div>
                    <div class="detail-value" id="gameScore">0</div>
                  </div>
                </div>
                
                <div class="detail-card">
                  <div class="detail-icon"></div>
                  <div class="detail-content">
                    <div class="detail-label">Tempo</div>
                    <div class="detail-value" id="gameTime">00:00</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Seção de Progresso -->
        <div class="progress-section" id="progressSection">
          <div class="progress-header">
            <span class="progress-label">Progresso da Partida</span>
            <span class="progress-percentage" id="progressPercentage">0%</span>
          </div>
          
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div class="progress-fill" id="progressFill"></div>
              <div class="progress-glow" id="progressGlow"></div>
            </div>
          </div>
          
          <div class="attempts-indicators" id="attemptsIndicators">
            <!-- Indicadores de tentativas serão gerados dinamicamente -->
          </div>
        </div>

        <!-- Seção de Histórico de Tentativas -->
        <div class="history-section" id="historySection">
          <div class="history-header">
            <div class="history-title"></div>
            <button class="history-clear-btn" id="historyClearBtn" title="Limpar Histórico"></button>
          </div>
          
          <div class="history-container" id="historyContainer">
            <div class="history-empty" id="historyEmpty">
              <div class="empty-icon"></div>
              <div class="empty-text">Nenhuma tentativa ainda</div>
              <div class="empty-subtext">Faça seu primeiro palpite!</div>
            </div>
          </div>
        </div>

        <!-- Seção de Dicas -->
        <div class="hints-section" id="hintsSection" style="display: none;">
          <div class="hints-header">
            <div class="hints-title"></div>
            <div class="hints-counter" id="hintsCounter">3/3</div>
          </div>
          
          <div class="hints-container" id="hintsContainer">
            <button class="hint-btn" id="hintBtn" title="Usar Dica (Custa 100 pontos)">
              <span class="hint-icon"></span>
              <span class="hint-text">Usar Dica</span>
              <span class="hint-cost">-100 pts</span>
            </button>
          </div>
          
          <div class="hints-list" id="hintsList">
            <!-- Dicas usadas aparecerão aqui -->
          </div>
        </div>

        <!-- Seção de Power-ups (Futuro) -->
        <div class="powerups-section" id="powerupsSection" style="display: none;">
          <div class="powerups-header">
            <div class="powerups-title"></div>
          </div>
          
          <div class="powerups-grid" id="powerupsGrid">
            <button class="powerup-btn" data-powerup="reveal" title="Revelar Proximidade">
              <span class="powerup-icon"></span>
              <span class="powerup-name">Radar</span>
            </button>
            
            <button class="powerup-btn" data-powerup="eliminate" title="Eliminar Metade dos Números">
              <span class="powerup-icon"></span>
              <span class="powerup-name">Corte</span>
            </button>
            
            <button class="powerup-btn" data-powerup="freeze" title="Congelar Tempo">
              <span class="powerup-icon"></span>
              <span class="powerup-name">Freeze</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.container.classList.add('game-board-component');
  }

  /**
   * Configurar event listeners
   */
  setupEventListeners() {
    const historyClearBtn = document.getElementById('historyClearBtn');
    historyClearBtn?.addEventListener('click', () => this.clearHistory());

    const hintBtn = document.getElementById('hintBtn');
    hintBtn?.addEventListener('click', () => this.requestHint());

    const powerupBtns = document.querySelectorAll('.powerup-btn');
    powerupBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const powerup = btn.dataset.powerup;
        this.usePowerup(powerup);
      });
    });

    const statusCard = document.querySelector('.game-status-card');
    statusCard?.addEventListener('dblclick', () => this.triggerStatusEasterEgg());

    ConfigManager.log('Event listeners do game board configurados');
  }

  /**
   * Iniciar efeitos de fundo
   */
  startBackgroundEffects() {
    if (!GameConfig.ANIMATIONS.enabled) return;

    this.pulseInterval = setInterval(() => {
      const gameBoard = this.container;
      if (gameBoard && !this.isLocked) {
        gameBoard.style.transform = 'scale(1.002)';
        setTimeout(() => {
          gameBoard.style.transform = 'scale(1)';
        }, 1000);
      }
    }, 8000);

    this.startCardGlowEffect();
  }

  /**
   * Efeito de brilho nos cards
   */
  startCardGlowEffect() {
    const detailCards = document.querySelectorAll('.detail-card');

    detailCards.forEach((card, index) => {
      setTimeout(() => {
        if (GameConfig.ANIMATIONS.enabled) {
          this.addGlowEffect(card);
        }
      }, index * 500);
    });
  }

  // ... continuação dos métodos (ex: clearHistory, requestHint, usePowerup, etc.)
}

export default GameBoard;
