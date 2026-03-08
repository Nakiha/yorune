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
        this.maxParticles = 300; // 粒子数量上限
    }
    
    add(particle) {
        // 如果粒子数量超过上限，移除最老的粒子
        if (this.particles.length >= this.maxParticles) {
            this.particles.shift();
        }
        this.particles.push(particle);
    }
    
    update() {
        this.particles = this.particles.filter(p => p.update());
    }
    
    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }
    
    clear() {
        this.particles = [];
    }
    
    // 预设特效
    
    // 爆炸效果
    explosion(x, y, color = '#ff6b6b', count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Utils.random(-0.2, 0.2);
            const speed = Utils.random(3, 8);
            this.add(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: Utils.random(3, 8),
                life: Utils.random(20, 40)
            }));
        }
    }
    
    // Emoji爆炸
    emojiExplosion(x, y, emojis = ['💥', '🔥', '⚡', '✨'], count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = Utils.random(0, Math.PI * 2);
            const speed = Utils.random(2, 6);
            this.add(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                emoji: Utils.randomChoice(emojis),
                size: Utils.random(1, 2),
                life: Utils.random(30, 50),
                rotationSpeed: Utils.random(-0.2, 0.2)
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
    
    // 治疗效果
    heal(x, y) {
        for (let i = 0; i < 5; i++) {
            this.add(new Particle(x + Utils.random(-20, 20), y + Utils.random(-20, 20), {
                emoji: '❤️',
                size: Utils.random(0.8, 1.5),
                vy: -2,
                life: 40
            }));
        }
    }
    
    // 升级效果
    levelUp(x, y) {
        for (let i = 0; i < 15; i++) {
            this.add(new Particle(x, y, {
                emoji: Utils.randomChoice(['⭐', '✨', '🌟', '💫']),
                size: Utils.random(1, 2),
                vx: Utils.random(-3, 3),
                vy: Utils.random(-5, -2),
                life: 50
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
    
    // 死亡效果（敌人专用）
    enemyDeath(x, y, memeType) {
        const memeEffects = {
            'doge': { emojis: ['🐶', '🐕', '🦮'], color: '#f39c12' },
            'pepe': { emojis: ['🐸', '🌿'], color: '#27ae60' },
            'clown': { emojis: ['🤡', '🎪', '🎈'], color: '#e74c3c' },
            'skull': { emojis: ['💀', '☠️', '👻'], color: '#95a5a6' },
            'crying': { emojis: ['😭', '😢', '💧'], color: '#3498db' },
            'fire': { emojis: ['🔥', '💥', '⚡'], color: '#e74c3c' },
            'think': { emojis: ['🤔', '💭', '❓'], color: '#9b59b6' },
            'default': { emojis: ['💥', '✨', '💫'], color: '#ff6b6b' }
        };
        
        const effect = memeEffects[memeType] || memeEffects['default'];
        this.emojiExplosion(x, y, effect.emojis, 15);
        this.explosion(x, y, effect.color, 10);
    }
    
    // Boss出现效果
    bossSpawn(x, y) {
        for (let i = 0; i < 30; i++) {
            const angle = Utils.random(0, Math.PI * 2);
            const dist = Utils.random(50, 150);
            this.add(new Particle(x, y, {
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                emoji: Utils.randomChoice(['⚠️', '💀', '🔥', '⚡', '👁️']),
                size: Utils.random(1.5, 2.5),
                life: 60
            }));
        }
    }
}

// 全局粒子系统实例
const particles = new ParticleSystem();
