/**
 * INPUT SECTION COMPONENT - Componente de entrada do usuário
 * Arquivo: src/components/input-section.js
 */

import { GameConfig, ConfigManager } from '../js/config.js';
import { Utils } from '../js/utils.js';

export class InputSection {
  constructor(containerId = 'inputSection') {
    this.container = document.getElementById(containerId);
    this.isLocked = false;
    this.currentValue = '';
    this.validationTimer = null;
    this.suggestionsList = [];
    this.init();
  }

  /**
   * Inicialização do componente
   */
  init() {
    if (!this.container) {
      ConfigManager.error('Container do input section não encontrado!');
      return;
    }

    this.render();
    this.setupEventListeners();
    this.setupValidation();

    ConfigManager.log('Input Section inicializado');
  }

  /**
   * Renderizar seção de entrada
   */
  render() {
    this.container.innerHTML = `
      <div class="input-section-content">
        <!-- Campo de Input Principal -->
        <div class="input-wrapper" id="inputWrapper">
          <div class="input-container">
            <input 
              type="number" 
              class="number-input" 
              id="numberInput" 
              placeholder="Digite seu palpite..."
              min="1"
              max="10"
              autocomplete="off"
              spellcheck="false"
            >
            <div class="input-overlay" id="inputOverlay">
              <div class="input-glow"></div>
              <div class="input-particles" id="inputParticles"></div>
            </div>
          </div>
          
          <div class="input-status" id="inputStatus">
            <div class="status-indicator" id="statusIndicator"></div>
            <div class="status-text" id="statusText">Digite um número</div>
          </div>
        </div>

        <!-- Controles de Ação -->
        <div class="controls-section" id="controlsSection">
          <button class="action-btn action-btn-primary" id="submitBtn">
            <span class="btn-icon"></span>
            <span class="btn-text">Tentar</span>
            <span class="btn-shortcut">Enter</span>
          </button>
          
          <button class="action-btn action-btn-secondary" id="newGameBtn">
            <span class="btn-icon"></span>
            <span class="btn-text">Novo Jogo</span>
            <span class="btn-shortcut">N</span>
          </button>
          
          <button class="action-btn action-btn-hint" id="hintBtn" style="display: none;">
            <span class="btn-icon"></span>
            <span class="btn-text">Dica</span>
            <span class="btn-cost">-100</span>
          </button>
        </div>

        <!-- Sugestões Inteligentes -->
        <div class="suggestions-section" id="suggestionsSection" style="display: none;">
          <div class="suggestions-header">
            <span class="suggestions-icon"></span>
            <span class="suggestions-title">Sugestões Inteligentes</span>
          </div>
          
          <div class="suggestions-list" id="suggestionsList">
            <!-- Sugestões serão geradas dinamicamente -->
          </div>
        </div>

        <!-- Histórico de Entradas Recentes -->
        <div class="recent-inputs" id="recentInputs" style="display: none;">
          <div class="recent-header">
            <span class="recent-icon"></span>
            <span class="recent-title">Entradas Recentes</span>
          </div>
          
          <div class="recent-list" id="recentList">
            <!-- Entradas recentes aparecerão aqui -->
          </div>
        </div>

        <!-- Teclado Virtual (Mobile) -->
        <div class="virtual-keyboard" id="virtualKeyboard" style="display: none;">
          <div class="keyboard-row">
            <button class="key-btn" data-key="1">1</button>
            <button class="key-btn" data-key="2">2</button>
            <button class="key-btn" data-key="3">3</button>
          </div>
          <div class="keyboard-row">
            <button class="key-btn" data-key="4">4</button>
            <button class="key-btn" data-key="5">5</button>
            <button class="key-btn" data-key="6">6</button>
          </div>
          <div class="keyboard-row">
            <button class="key-btn" data-key="7">7</button>
            <button class="key-btn" data-key="8">8</button>
            <button class="key-btn" data-key="9">9</button>
          </div>
          <div class="keyboard-row">
            <button class="key-btn key-btn-wide" data-key="0">0</button>
            <button class="key-btn key-btn-action" data-key="backspace">⌫</button>
          </div>
          <div class="keyboard-row">
            <button class="key-btn key-btn-submit" data-key="enter">Tentar</button>
          </div>
        </div>
      </div>
    `;

    this.container.classList.add('input-section-component');
  }

  /**
   * Configurar event listeners
   */
  setupEventListeners() {
    const numberInput = document.getElementById('numberInput');
    const submitBtn = document.getElementById('submitBtn');
    const newGameBtn = document.getElementById('newGameBtn');
    const hintBtn = document.getElementById('hintBtn');

    numberInput?.addEventListener('input', (e) => this.handleInput(e));
    numberInput?.addEventListener('keydown', (e) => this.handleKeyDown(e));
    numberInput?.addEventListener('focus', () => this.handleFocus());
    numberInput?.addEventListener('blur', () => this.handleBlur());
    numberInput?.addEventListener('paste', (e) => this.handlePaste(e));

    submitBtn?.addEventListener('click', () => this.handleSubmit());
    newGameBtn?.addEventListener('click', () => this.handleNewGame());
    hintBtn?.addEventListener('click', () => this.handleHint());

    const virtualKeyboard = document.getElementById('virtualKeyboard');
    virtualKeyboard?.addEventListener('click', (e) => this.handleVirtualKey(e));

    if (Utils.getDeviceType() === 'mobile') {
      this.setupMobileEvents();
    }

    this.setupSuggestionEvents();

    ConfigManager.log('Event listeners do input section configurados');
  }

  /**
   * Configurar eventos móveis
   */
  setupMobileEvents() {
    const numberInput = document.getElementById('numberInput');

    numberInput?.addEventListener('focus', () => {
      if (Utils.getDeviceType() === 'mobile') {
        this.showVirtualKeyboard();
      }
    });

    numberInput?.addEventListener('touchstart', () => {
      if (numberInput.style.fontSize !== '16px') {
        numberInput.style.fontSize = '16px';
      }
    });
  }

  /**
   * Configurar eventos de sugestões
   */
  setupSuggestionEvents() {
    const suggestionsList = document.getElementById('suggestionsList');

    suggestionsList?.addEventListener('click', (e) => {
      const suggestion = e.target.closest('.suggestion-item');
      if (suggestion) {
        const value = suggestion.dataset.value;
        this.applySuggestion(value);
      }
    });
  }

  /**
   * Configurar validação
   */
  setupValidation() {
    this.validationRules = {
      required: true,
      min: 1,
      max: 10,
      integer: true
    };
  }

  /**
   * Lidar com input
   */
  handleInput(event) {
    const input = event.target;
    const value = input.value;

    this.currentValue = value;

    clearTimeout(this.validationTimer);
    this.validationTimer = setTimeout(() => {
      this.validateInput(value);
    }, 300);

    this.updateSuggestions(value);

    this.updateInputEffects(value);

    if (value && this.isValidNumber(value)) {
      this.addToRecentInputs(value);
    }
  }

  /**
   * Lidar com teclas
   */
  handleKeyDown(event) {
    const key = event.key;

    if (key === 'Enter') {
      event.preventDefault();
      this.handleSubmit();
      return;
    }

    if (key === 'Tab') {
      return;
    }

    if (key === 'Escape') {
      event.preventDefault();
      this.clearInput();
      return;
    }

    if (key === 'ArrowUp' || key === 'ArrowDown') {
      event.preventDefault();
      this.navigateSuggestions(key === 'ArrowDown' ? 1 : -1);
      return;
    }

    const allowedKeys = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight',
      'Home', 'End', 'Tab'
    ];

    const isNumber = /^[0-9]$/.test(key);
    const isAllowed = allowedKeys.includes(key);

    if (!isNumber && !isAllowed) {
      event.preventDefault();
      this.showInputError('Apenas números são permitidos');
    }
  }

  /**
   * Lidar com foco
   */
  handleFocus() {
    const inputWrapper = document.getElementById('inputWrapper');
    const inputOverlay = document.getElementById('inputOverlay');

    inputWrapper?.classList.add('focused');

    if (inputOverlay && GameConfig.ANIMATIONS.enabled) {
      inputOverlay.classList.add('glow-active');
    }

    this.showSuggestions();

    ConfigManager.log('Input focado');
  }

  /**
   * Lidar com blur
   */
  handleBlur() {
    const inputWrapper = document.getElementById('inputWrapper');
    const inputOverlay = document.getElementById('inputOverlay');

    setTimeout(() => {
      inputWrapper?.classList.remove('focused');
      inputOverlay?.classList.remove('glow-active');
      this.hideSuggestions();
    }, 150);
  }

  /**
   * Lidar com paste
   */
  handlePaste(event) {
    event.preventDefault();

    const pastedText = (event.clipboardData || window.clipboardData).getData('text');
    const numberValue = pastedText.replace(/\D/g, '');

    if (numberValue) {
      const input = event.target;
      input.value = numberValue;
      this.handleInput({ target: input });
      this.showInputSuccess('Número colado com sucesso!');
    } else {
      this.showInputError('Conteúdo colado não contém números válidos');
    }
  }

  /**
   * Lidar com envio
   */
  handleSubmit() {
    const input = document.getElementById('numberInput');
    const value = input?.value;

    if (!value) {
      this.showInputError('Digite um número primeiro!');
      this.focusInput();
      return;
    }

    const validation = this.validateInput(value);
    if (!validation.isValid) {
      this.showInputError(validation.message);
      this.focusInput();
      return;
    }

    this.showSubmitEffect();

    document.dispatchEvent(new CustomEvent('guessSubmitted', {
      detail: {
        guess: parseInt(value),
        timestamp: Date.now()
      }
    }));

    this.addToRecentInputs(value);

    ConfigManager.log('Palpite enviado:', value);
  }

  /**
   * Lidar com novo jogo
   */
  handleNewGame() {
    this.clearInput();

    const newGameBtn = document.getElementById('newGameBtn');
    if (newGameBtn) {
      newGameBtn.style.transform = 'scale(0.9)';
      setTimeout(() => {
        newGameBtn.style.transform = '';
      }, 150);
    }

    document.dispatchEvent(new CustomEvent('newGameRequested'));

    ConfigManager.log('Novo jogo solicitado via input section');
  }

  /**
   * Lidar com dica
   */
  handleHint() {
    const hintBtn = document.getElementById('hintBtn');
    if (hintBtn) {
      hintBtn.classList.add('btn-used');
      setTimeout(() => {
        hintBtn.classList.remove('btn-used');
      }, 1000);
    }

    document.dispatchEvent(new CustomEvent('hintRequested'));

    ConfigManager.log('Dica solicitada via input section');
  }

  /**
   * Lidar com teclado virtual
   */
  handleVirtualKey(event) {
    const key = event.target.closest('.key-btn');
    if (!key) return;

    const keyValue = key.dataset.key;
    const input = document.getElementById('numberInput');
    if (!input) return;

    switch (keyValue) {
      case 'backspace':
        input.value = input.value.slice(0, -1);
        break;
      case 'enter':
        this.handleSubmit();
        return;
      default:
        if (/^[0-9]$/.test(keyValue)) {
          input.value += keyValue;
        }
        break;
    }

    this.handleInput({ target: input });

    key.style.transform = 'scale(0.95)';
    setTimeout(() => {
      key.style.transform = '';
    }, 100);
  }

  /**
   * Validar entrada
   */
  validateInput(value) {
    if (!value) {
      return { isValid: false, message: 'Digite um número' };
    }

    const num = parseInt(value);

    if (isNaN(num)) {
      return { isValid: false, message: 'Número inválido' };
    }

    if (num < this.validationRules.min) {
      return { isValid: false, message: `Número deve ser maior que ${this.validationRules.min - 1}` };
    }

    if (num > this.validationRules.max) {
      return { isValid: false, message: `Número deve ser menor que ${this.validationRules.max + 1}` };
    }

    return { isValid: true, message: 'Número válido' };
  }

  /**
   * Verificar se é número válido
   */
  isValidNumber(value) {
    const validation = this.validateInput(value);
    return validation.isValid;
  }

  /**
   * Atualizar efeitos visuais do input
   */
  updateInputEffects(value) {
    const input = document.getElementById('numberInput');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');

    if (!input || !statusIndicator || !statusText) return;

    const validation = this.validateInput(value);

    input.classList.remove('valid', 'invalid', 'empty');

    if (!value) {
      input.classList.add('empty');
      statusIndicator.textContent = '';
      statusText.textContent = 'Digite um número';
    } else if (validation.isValid) {
      input.classList.add('valid');
      statusIndicator.textContent = '';
      statusText.textContent = validation.message;
    } else {
      input.classList.add('invalid');
      statusIndicator.textContent = '';
      statusText.textContent = validation.message;
    }

    if (validation.isValid && GameConfig.ANIMATIONS.enabled) {
      this.createInputParticles();
    }
  }

  /**
   * Criar partículas no input
   */
  createInputParticles() {
    const inputParticles = document.getElementById('inputParticles');
    if (!inputParticles) return;

    inputParticles.innerHTML = '';

    for (let i = 0; i < 5; i++) {
      const particle = document.createElement('div');
      particle.className = 'input-particle';
      particle.style.cssText = `
        position: absolute;
        width: 3px;
        height: 3px;
        background: var(--success-green);
        border-radius: 50%;
        animation: inputParticle 1s ease-out forwards;
        left: ${Math.random() * 100}%;
        animation-delay: ${i * 100}ms;
      `;

      inputParticles.appendChild(particle);

      setTimeout(() => particle.remove(), 1000);
    }
  }

  /**
   * Atualizar sugestões
   */
  updateSuggestions(currentValue) {
    if (!GameConfig.UI.showHints) return;

    const suggestionsList = document.getElementById('suggestionsList');
    if (!suggestionsList) return;

    const suggestions = this.generateSuggestions(currentValue);

    suggestionsList.innerHTML = '';

    suggestions.forEach((suggestion) => {
      const suggestionItem = document.createElement('div');
      suggestionItem.className = 'suggestion-item';
      suggestionItem.dataset.value = suggestion.value;
      suggestionItem.innerHTML = `
        <div class="suggestion-number">${suggestion.value}</div>
        <div class="suggestion-reason">${suggestion.reason}</div>
        <div class="suggestion-confidence">${suggestion.confidence}%</div>
      `;

      suggestionsList.appendChild(suggestionItem);
    });

    this.suggestionsList = suggestions;
  }

  /**
   * Gerar sugestões inteligentes
   */
  generateSuggestions(currentValue) {
    const suggestions = [];
    const min = this.validationRules.min;
    const max = this.validationRules.max;
    const range = max - min + 1;

    const middle = Math.floor((min + max) / 2);
    suggestions.push({
      value: middle,
      reason: 'Estratégia binária - meio do intervalo',
      confidence: 85
    });

    const goldenRatio = Math.floor(min + (range * 0.618));
    if (goldenRatio !== middle) {
      suggestions.push({
        value: goldenRatio,
        reason: 'Baseado na proporção áurea',
        confidence: 70
      });
    }

    const smartRandom = min + Math.floor(Math.random() * range);
    if (smartRandom !== middle && smartRandom !== goldenRatio) {
      suggestions.push({
        value: smartRandom,
        reason: 'Escolha aleatória inteligente',
        confidence: 60
      });
    }

    return suggestions.slice(0, 3);
  }

  /**
   * Aplicar sugestão
   */
  applySuggestion(value) {
    const input = document.getElementById('numberInput');
    if (!input) return;

    input.value = value;
    this.handleInput({ target: input });

    input.style.background = 'rgba(0, 229, 255, 0.2)';
    setTimeout(() => {
      input.style.background = '';
    }, 500);

    this.hideSuggestions();
    this.focusInput();

    ConfigManager.log('Sugestão aplicada:', value);
  }

  /**
   * Mostrar sugestões
   */
  showSuggestions() {
    const suggestionsSection = document.getElementById('suggestionsSection');
    if (suggestionsSection && this.suggestionsList.length > 0) {
      suggestionsSection.style.display = 'block';
    }
  }

  /**
   * Esconder sugestões
   */
  hideSuggestions() {
    const suggestionsSection = document.getElementById('suggestionsSection');
    if (suggestionsSection) {
      suggestionsSection.style.display = 'none';
    }
  }

  /**
   * Adicionar ao histórico de entradas
   */
  addToRecentInputs(value) {
    const recentList = document.getElementById('recentList');
    if (!recentList) return;

    const existing = recentList.querySelector(`[data-value="${value}"]`);
    if (existing) {
      existing.remove();
    }

    const recentItem = document.createElement('div');
    recentItem.className = 'recent-item';
    recentItem.dataset.value = value;
    recentItem.innerHTML = `
      <span class="recent-number">${value}</span>
      <span class="recent-time">${new Date().toLocaleTimeString()}</span>
    `;

    recentItem.addEventListener('click', () => {
      this.applySuggestion(value);
    });

    recentList.insertBefore(recentItem, recentList.firstChild);

    while (recentList.children.length > 5) {
      recentList.removeChild(recentList.lastChild);
    }

    const recentInputs = document.getElementById('recentInputs');
    if (recentInputs) {
      recentInputs.style.display = 'block';
    }
  }

  /**
   * Mostrar teclado virtual
   */
  showVirtualKeyboard() {
    const virtualKeyboard = document.getElementById('virtualKeyboard');
    if (virtualKeyboard) {
      virtualKeyboard.style.display = 'block';
    }
  }

  /**
   * Esconder teclado virtual
   */
  hideVirtualKeyboard() {
    const virtualKeyboard = document.getElementById('virtualKeyboard');
    if (virtualKeyboard) {
      virtualKeyboard.style.display = 'none';
    }
  }

  /**
   * Mostrar efeito de envio
   */
  showSubmitEffect() {
    const submitBtn = document.getElementById('submitBtn');
    const inputWrapper = document.getElementById('inputWrapper');

    if (submitBtn) {
      submitBtn.classList.add('btn-submitting');
      setTimeout(() => {
        submitBtn.classList.remove('btn-submitting');
      }, 1000);
    }

    if (inputWrapper && GameConfig.ANIMATIONS.enabled) {
      inputWrapper.classList.add('input-submitting');
      setTimeout(() => {
        inputWrapper.classList.remove('input-submitting');
      }, 600);
    }
  }

  /**
   * Mostrar erro no input
   */
  showInputError(message) {
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.getElementById('statusIndicator');

    if (statusText) {
      statusText.textContent = message;
      statusText.style.color = 'var(--error-red)';
    }

    if (statusIndicator) {
      statusIndicator.textContent = '';
    }

    Utils.vibrate([100, 50, 100]);

    setTimeout(() => {
      if (statusText) {
        statusText.style.color = '';
      }
    }, 3000);
  }

  /**
   * Mostrar sucesso no input
   */
  showInputSuccess(message) {
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.getElementById('statusIndicator');

    if (statusText) {
      statusText.textContent = message;
      statusText.style.color = 'var(--success-green)';
    }

    if (statusIndicator) {
      statusIndicator.textContent = '';
    }

    setTimeout(() => {
      if (statusText) {
        statusText.style.color = '';
      }
    }, 2000);
  }

  /**
   * Limpar input
   */
  clearInput() {
    const input = document.getElementById('numberInput');
    if (input) {
      input.value = '';
      this.currentValue = '';
      this.handleInput({ target: input });
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
   * Atualizar configurações de dificuldade
   */
  updateDifficulty(difficulty) {
    const config = ConfigManager.getDifficultyConfig(difficulty);
    const input = document.getElementById('numberInput');

    if (input) {
      input.min = config.min;
      input.max = config.max;
      input.placeholder = `Digite um número entre ${config.min} e ${config.max}`;
    }

    this.validationRules.min = config.min;
    this.validationRules.max = config.max;

    if (this.currentValue) {
      this.handleInput({ target: input });
    }
  }

  /**
   * Bloquear/desbloquear input
   */
  setLocked(locked) {
    this.isLocked = locked;

    const input = document.getElementById('numberInput');
    const submitBtn = document.getElementById('submitBtn');
    const hintBtn = document.getElementById('hintBtn');

    if (input) input.disabled = locked;
    if (submitBtn) submitBtn.disabled = locked;
    if (hintBtn) hintBtn.disabled = locked;

    if (locked) {
      this.container.classList.add('locked');
    } else {
      this.container.classList.remove('locked');
      this.focusInput();
    }
  }

  /**
   * Mostrar/esconder botão de dica
   */
  toggleHintButton(show, enabled = true) {
    const hintBtn = document.getElementById('hintBtn');
    if (!hintBtn) return;

    hintBtn.style.display = show ? 'flex' : 'none';
    hintBtn.disabled = !enabled;

    if (!enabled) {
      hintBtn.classList.add('disabled');
    } else {
      hintBtn.classList.remove('disabled');
    }
  }

  /**
   * Limpar recursos
   */
  destroy() {
    if (this.validationTimer) {
      clearTimeout(this.validationTimer);
    }

    ConfigManager.log('Input Section destruído');
  }
}

// Inicialização automática
document.addEventListener('DOMContentLoaded', () => {
  window.inputSection = new InputSection();

  document.addEventListener('difficultyChanged', (e) => {
    if (window.inputSection) {
      window.inputSection.updateDifficulty(e.detail.difficulty);
    }
  });

  document.addEventListener('gameStateChanged', (e) => {
    if (window.inputSection) {
      const { isPlaying, isGameOver } = e.detail.gameState;
      window.inputSection.setLocked(!isPlaying || isGameOver);
    }
  });
});

export default InputSection;
