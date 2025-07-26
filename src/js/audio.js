/**
 * AUDIO SYSTEM - Sistema de áudio com fallback para Web Audio API
 * Arquivo: src/js/audio.js
 */

/* eslint-disable no-console */

export class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.volumes = {
            background: 0.2,
            click: 0.7,
            error: 0.8,
            success: 0.8,
            victory: 0.9
        };
        this.isEnabled = true;
        this.backgroundMusic = null;
        this.init();
    }

    /**
     * Inicializar sistema de áudio
     */
    init() {
        this.initAudioContext();
        this.createSounds();
        this.setupGlobalClickHandler();
        this.startBackgroundMusic();
        // console.log('Sistema de áudio inicializado'); // removido ou deixe comentado para produção
    }

    /**
     * Inicializar contexto de áudio
     */
    initAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
        } catch (error) {
            // console.log('Web Audio API não suportada, usando fallback'); // comentar ou remover
            this.audioContext = null;
        }
    }

    /**
     * Criar sons usando Web Audio API
     */
    createSounds() {
        if (!this.audioContext) return;

        this.sounds.click = this.createBeepSound(800, 0.1, 'square');
        this.sounds.error = this.createBeepSound(300, 0.3, 'sawtooth');
        this.sounds.success = this.createMelodySound([400, 600, 800], [0.1, 0.1, 0.2]);
        this.sounds.victory = this.createMelodySound([523, 659, 784, 1047], [0.2, 0.2, 0.2, 0.4]);
        this.sounds.background = this.createAmbientSound();
    }

    createBeepSound(frequency, duration, waveType = 'sine') {
        return () => {
            if (!this.audioContext || !this.isEnabled) return;

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = waveType;

            const now = this.audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

            oscillator.start(now);
            oscillator.stop(now + duration);
        };
    }

    createMelodySound(frequencies, durations) {
        return () => {
            if (!this.audioContext || !this.isEnabled) return;

            let startTime = this.audioContext.currentTime;

            frequencies.forEach((freq, index) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.frequency.value = freq;
                oscillator.type = 'sine';

                const duration = durations[index] || 0.2;

                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

                oscillator.start(startTime);
                oscillator.stop(startTime + duration);

                startTime += duration;
            });
        };
    }

    createAmbientSound() {
        if (!this.audioContext) return null;

        const bufferSize = this.audioContext.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.1 * Math.sin(i * 0.01);
        }

        return {
            buffer,
            source: null,
            gainNode: null,
            isPlaying: false,

            play: () => {
                if (!this.audioContext || !this.isEnabled || this.backgroundMusic?.isPlaying) return;

                this.backgroundMusic.source = this.audioContext.createBufferSource();
                this.backgroundMusic.gainNode = this.audioContext.createGain();

                this.backgroundMusic.source.buffer = this.backgroundMusic.buffer;
                this.backgroundMusic.source.loop = true;
                this.backgroundMusic.gainNode.gain.value = this.volumes.background;

                this.backgroundMusic.source.connect(this.backgroundMusic.gainNode);
                this.backgroundMusic.gainNode.connect(this.audioContext.destination);

                this.backgroundMusic.source.start();
                this.backgroundMusic.isPlaying = true;
            },

            stop: () => {
                if (this.backgroundMusic?.source && this.backgroundMusic.isPlaying) {
                    this.backgroundMusic.source.stop();
                    this.backgroundMusic.isPlaying = false;
                }
            }
        };
    }

    play(soundName) {
        if (!this.isEnabled) return;

        const audioElement = document.getElementById(soundName + 'Sound');
        if (audioElement) {
            audioElement.currentTime = 0;
            audioElement.volume = this.volumes[soundName] || 0.5;
            audioElement.play().catch(() => {
                // console.log('Fallback para Web Audio API'); // comentado para evitar no-console
                this.playWebAudio(soundName);
            });
        } else {
            this.playWebAudio(soundName);
        }
    }

    playWebAudio(soundName) {
        if (this.sounds[soundName] && typeof this.sounds[soundName] === 'function') {
            this.sounds[soundName]();
        }
    }

    startBackgroundMusic() {
        if (!this.isEnabled) return;

        const backgroundAudio = document.getElementById('backgroundAudio');
        if (backgroundAudio) {
            backgroundAudio.volume = this.volumes.background;
            backgroundAudio.play().catch(() => {
                // console.log('Fallback para música ambiente gerada'); // comentado
                if (this.sounds.background) {
                    this.backgroundMusic = this.sounds.background;
                    this.backgroundMusic.play();
                }
            });
        } else if (this.sounds.background) {
            this.backgroundMusic = this.sounds.background;
            this.backgroundMusic.play();
        }
    }

    stopBackgroundMusic() {
        const backgroundAudio = document.getElementById('backgroundAudio');
        if (backgroundAudio) {
            backgroundAudio.pause();
        }

        if (this.backgroundMusic) {
            this.backgroundMusic.stop();
        }
    }

    setupGlobalClickHandler() {
        document.addEventListener('click', (e) => {
            if (
                e.target.matches(
                    'button, .btn, .difficulty-btn, .interactive, .action-btn, .header-btn, .stats-action-btn'
                )
            ) {
                this.play('click');
            }
        });

        document.addEventListener(
            'click',
            () => {
                if (this.audioContext && this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
            },
            { once: true }
        );
    }

    toggle() {
        this.isEnabled = !this.isEnabled;

        if (!this.isEnabled) {
            this.stopBackgroundMusic();
        } else {
            this.startBackgroundMusic();
        }

        // console.log('Áudio', this.isEnabled ? 'ligado' : 'desligado'); // comentado para evitar no-console
        return this.isEnabled;
    }

    setVolume(soundType, volume) {
        this.volumes[soundType] = Math.max(0, Math.min(1, volume));

        const audioElement =
            document.getElementById(soundType + 'Sound') ||
            document.getElementById(soundType + 'Audio');
        if (audioElement) {
            audioElement.volume = this.volumes[soundType];
        }
    }

    hasSupport() {
        return !!(this.audioContext || window.Audio);
    }

    destroy() {
        this.stopBackgroundMusic();

        if (this.audioContext) {
            this.audioContext.close();
        }

        // console.log('Sistema de áudio destruído'); // comentado para evitar no-console
    }
}

export const audioSystem = new AudioSystem();

window.audioManager = {
    play: (soundName) => audioSystem.play(soundName),
    toggle: () => audioSystem.toggle(),
    setVolume: (soundType, volume) => audioSystem.setVolume(soundType, volume),
};
