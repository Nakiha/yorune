// ✨ 粒子系统

class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || Utils.random(-2, 2);
        this.vy = options.vy || Utils.random(-2, 2);
        this.size = options.size || Utils.random(2, 6);
        this.color = options.color || '#ff6b6b';
        this.life = options.life || 60;
        this.maxLife = this.life;
        this.decay = options.decay || 1;
        this.gravity = options.gravity || 0;
        this.text = options.text || null;
        this.emoji = options.emoji || null;
        this.rotation = options.rotation || 0;
        this.rotationSpeed = options.rotationSpeed || Utils.random(-0.1, 0.1);
        this.scale = 1;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life -= this.decay;
        this.rotation += this.rotationSpeed;
        this.scale = this.life / this.maxLife;
        
        // 添加一些摩擦力
        this.vx *= 0.99;
        this.vy *= 0.99;
        
        return this.life > 0;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.scale;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        if (this.emoji) {
            ctx.font = `${this.size * 3 * this.scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.emoji, 0, 0);
        } else if (this.text) {
            ctx.font = `${this.size * 2}px Arial`;
            ctx.fillStyle = this.color;
            ctx.textAlign = 'center';
            ctx.fillText(this.text, 0, 0);
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size * this.scale, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 150; // 进一步降低粒子数量上限
    }
    
    add(particle) {
        // 如果粒子数量超过上限，移除最老的粒子
        if (this.particles.length >= this.maxParticles) {
            this.particles.shift();
        }
        this.particles.push(particle);
    }
    
    update() {
        // 使用反向遍历优化性能
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].update()) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    draw(ctx) {
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].draw(ctx);
        }
    }
    
    clear() {
        this.particles = [];
    }
    
    // 预设特效
    
    // 爆炸效果 - 限制最大数量
    explosion(x, y, color = '#ff6b6b', count = 20) {
        const safeCount = Math.min(count, 15); // 最大15个粒子
        for (let i = 0; i < safeCount; i++) {
            const angle = (Math.PI * 2 / safeCount) * i + Utils.random(-0.2, 0.2);
            const speed = Utils.random(3, 8);
            this.add(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: Utils.random(3, 6),
                life: Utils.random(15, 30)
            }));
        }
    }
    
    // Emoji爆炸 - 限制最大数量
    emojiExplosion(x, y, emojis = ['💥', '🔥', '⚡', '✨'], count = 10) {
        const safeCount = Math.min(count, 10); // 最大10个emoji粒子
        for (let i = 0; i < safeCount; i++) {
            const angle = Utils.random(0, Math.PI * 2);
            const speed = Utils.random(2, 5);
            this.add(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                emoji: Utils.randomChoice(emojis),
                size: 1,
                life: Utils.random(20, 35),
                rotationSpeed: Utils.random(-0.1, 0.1)
            }));
        }
    }
    
    // 伤害数字
    damageNumber(x, y, damage, color = '#ff6b6b') {
        this.add(new Particle(x, y, {
            text: damage.toString(),
            color: color,
            size: Math.min(12 + damage / 2, 20),
            vx: Utils.random(-1, 1),
            vy: -3,
            life: 40,
            decay: 0.8
        }));
    }
    
    // 治疗效果 - 减少粒子数量
    heal(x, y) {
        for (let i = 0; i < 3; i++) {
            this.add(new Particle(x + Utils.random(-15, 15), y + Utils.random(-15, 15), {
                emoji: '❤️',
                size: 1,
                vy: -2,
                life: 30
            }));
        }
    }
    
    // 升级效果 - 减少粒子数量
    levelUp(x, y) {
        for (let i = 0; i < 8; i++) {
            this.add(new Particle(x, y, {
                emoji: Utils.randomChoice(['⭐', '✨', '🌟']),
                size: 1,
                vx: Utils.random(-2, 2),
                vy: Utils.random(-3, -1),
                life: 30
            }));
        }
    }
    
    // 尾迹效果
    trail(x, y, color = '#4ecdc4') {
        this.add(new Particle(x, y, {
            color: color,
            size: Utils.random(3, 6),
            life: 15,
            decay: 1
        }));
    }
    
    // 死亡效果（敌人专用）- 减少粒子数量
    enemyDeath(x, y, memeType) {
        const memeEffects = {
            'doge': { emojis: ['🐶', '🐕'], color: '#f39c12' },
            'pepe': { emojis: ['🐸', '🌿'], color: '#27ae60' },
            'clown': { emojis: ['🤡', '🎈'], color: '#e74c3c' },
            'skull': { emojis: ['💀', '👻'], color: '#95a5a6' },
            'crying': { emojis: ['😭', '💧'], color: '#3498db' },
            'fire': { emojis: ['🔥', '💥'], color: '#e74c3c' },
            'think': { emojis: ['🤔', '❓'], color: '#9b59b6' },
            'default': { emojis: ['💥', '✨'], color: '#ff6b6b' }
        };
        
        const effect = memeEffects[memeType] || memeEffects['default'];
        this.emojiExplosion(x, y, effect.emojis, 6); // 减少emoji粒子
        this.explosion(x, y, effect.color, 5); // 减少普通粒子
    }
    
    // Boss出现效果 - 减少粒子数量
    bossSpawn(x, y) {
        for (let i = 0; i < 15; i++) {
            const angle = Utils.random(0, Math.PI * 2);
            this.add(new Particle(x, y, {
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                emoji: Utils.randomChoice(['⚠️', '💀', '🔥', '⚡']),
                size: 1.5,
                life: 40
            }));
        }
    }
}

// 全局粒子系统实例
const particles = new ParticleSystem();
