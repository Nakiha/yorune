// 🔊 音效系统（Web Audio API）

class AudioSystem {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.volume = 0.5;
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }
    
    // 创建简单音效
    playTone(frequency, duration, type = 'sine', volumeMultiplier = 1) {
        if (!this.enabled || !this.ctx) return;
        
        try {
            const oscillator = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.ctx.destination);
            
            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, this.ctx.currentTime);
            
            gainNode.gain.setValueAtTime(this.volume * volumeMultiplier, this.ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
            
            oscillator.start(this.ctx.currentTime);
            oscillator.stop(this.ctx.currentTime + duration);
        } catch (e) {
            // 忽略音频错误
        }
    }
    
    // 攻击音效
    attack() {
        this.playTone(400, 0.1, 'square', 0.3);
        setTimeout(() => this.playTone(600, 0.05, 'square', 0.2), 50);
    }
    
    // 命中音效
    hit() {
        this.playTone(200, 0.15, 'sawtooth', 0.4);
        this.playTone(150, 0.1, 'square', 0.3);
    }
    
    // 敌人死亡
    enemyDeath() {
        this.playTone(600, 0.1, 'square', 0.3);
        setTimeout(() => this.playTone(800, 0.1, 'square', 0.2), 50);
        setTimeout(() => this.playTone(1000, 0.15, 'sine', 0.3), 100);
    }
    
    // 玩家受伤
    playerHit() {
        this.playTone(150, 0.2, 'sawtooth', 0.5);
        this.playTone(100, 0.3, 'square', 0.3);
    }
    
    // 拾取道具
    powerUp() {
        this.playTone(523, 0.1, 'sine', 0.3);  // C5
        setTimeout(() => this.playTone(659, 0.1, 'sine', 0.3), 100);  // E5
        setTimeout(() => this.playTone(784, 0.15, 'sine', 0.3), 200);  // G5
    }
    
    // 连击音效
    combo(level) {
        const baseFreq = 400 + level * 50;
        this.playTone(baseFreq, 0.1, 'sine', 0.3);
        this.playTone(baseFreq * 1.5, 0.1, 'sine', 0.2);
    }
    
    // Boss出现
    bossSpawn() {
        const notes = [200, 250, 300, 400, 500, 600, 800];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2, 'sawtooth', 0.4), i * 100);
        });
    }
    
    // 游戏结束
    gameOver() {
        const notes = [400, 350, 300, 250, 200];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.3, 'sine', 0.4), i * 200);
        });
    }
    
    // 胜利
    victory() {
        const notes = [523, 587, 659, 698, 784, 880, 988, 1047]; // C大调音阶
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.3), i * 100);
        });
    }
    
    // 升级
    levelUp() {
        const notes = [523, 659, 784, 1047]; // C-E-G-C
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.4), i * 80);
        });
    }
    
    // 技能释放
    skill() {
        this.playTone(800, 0.1, 'sine', 0.3);
        this.playTone(1000, 0.1, 'sine', 0.2);
        setTimeout(() => {
            this.playTone(1200, 0.2, 'sine', 0.3);
            this.playTone(1500, 0.15, 'sine', 0.2);
        }, 100);
    }
    
    // 波次开始
    waveStart() {
        this.playTone(300, 0.2, 'triangle', 0.3);
        setTimeout(() => this.playTone(400, 0.2, 'triangle', 0.3), 200);
        setTimeout(() => this.playTone(500, 0.3, 'triangle', 0.4), 400);
    }
    
    // 切换音量
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
    
    // 设置音量
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
    }
}

// 全局音频实例
const audio = new AudioSystem();
