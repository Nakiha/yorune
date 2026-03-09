// ⚔️ 武器系统

class Weapon {
    constructor(owner, type) {
        this.owner = owner;
        this.type = type;
        this.x = owner.x;
        this.y = owner.y;
        this.vx = 0;
        this.vy = 0;
        this.radius = 15;
        this.damage = owner.getWeaponDamage();
        this.piercing = false;
        this.lifetime = 60;
        this.active = true;
        this.hitEnemies = new Set();
        
        this.init();
    }
    
    init() {
        // 根据武器类型设置属性
        const configs = {
            '🔥': { speed: 10, color: '#e74c3c', piercing: false, radius: 15, lifetime: 60 },
            '⚔️': { speed: 8, color: '#bdc3c7', piercing: true, radius: 20, lifetime: 40 },
            '⚡': { speed: 15, color: '#f1c40f', piercing: false, radius: 12, lifetime: 45 },
            '💣': { speed: 6, color: '#2c3e50', piercing: false, radius: 30, lifetime: 90, explosive: true }
        };
        
        const config = configs[this.type] || configs['🔥'];
        this.speed = config.speed;
        this.color = config.color;
        this.piercing = config.piercing;
        this.radius = config.radius;
        this.lifetime = config.lifetime;
        this.explosive = config.explosive || false;
        
        // 设置方向
        const direction = this.owner.facingRight ? 1 : -1;
        this.vx = direction * this.speed;
        this.vy = 0;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.lifetime--;
        
        if (this.lifetime <= 0) {
            if (this.explosive) {
                this.explode();
            }
            this.active = false;
        }
        
        // 尾迹 - 降低频率提升性能
        if (this.type === '🔥' && Math.random() > 0.5) {
            particles.trail(this.x, this.y, '#e74c3c');
        } else if (this.type === '⚡' && Math.random() > 0.5) {
            particles.trail(this.x, this.y, '#f1c40f');
        }
        
        return this.active;
    }
    
    explode() {
        particles.explosion(this.x, this.y, '#e74c3c', 30);
        particles.emojiExplosion(this.x, this.y, ['💥', '🔥', '💨'], 10);
        audio.hit();
    }
    
    onHit(enemy) {
        if (this.hitEnemies.has(enemy)) return false;
        
        if (!this.piercing) {
            this.active = false;
        }
        
        this.hitEnemies.add(enemy);
        
        // 命中特效
        if (this.type === '🔥') {
            particles.emojiExplosion(enemy.x, enemy.y, ['🔥', '💨'], 5);
        } else if (this.type === '⚡') {
            particles.emojiExplosion(enemy.x, enemy.y, ['⚡', '✨'], 5);
        } else if (this.type === '⚔️') {
            particles.explosion(enemy.x, enemy.y, '#bdc3c7', 8);
        } else if (this.type === '💣') {
            this.explode();
        }
        
        return true;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.font = `${this.radius * 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 旋转效果
        ctx.translate(this.x, this.y);
        ctx.rotate(Date.now() / 100);
        ctx.fillText(this.type, 0, 0);
        
        ctx.restore();
    }
    
    // 检查是否在屏幕内
    isInBounds(width, height) {
        return this.x > -50 && this.x < width + 50 && 
               this.y > -50 && this.y < height + 50;
    }
}

// 武器工厂
const WeaponFactory = {
    create(type, owner) {
        return new Weapon(owner, type);
    }
};

// 道具类
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 20;
        this.lifetime = 600; // 10秒
        this.active = true;
        this.bobOffset = 0;
        
        // 道具类型
        this.configs = {
            'health': { emoji: '❤️', effect: (player) => player.heal(30) },
            'energy': { emoji: '⚡', effect: (player) => { player.energy = player.maxEnergy; } },
            'speed': { emoji: '🚀', effect: (player) => { player.speed = Math.min(player.speed * 1.15, player.baseSpeed * 2); } },
            'damage': { emoji: '💪', effect: (player) => { player.attackBonus = Math.min((player.attackBonus || 0) + 0.15, 1.0); } },
            'shield': { emoji: '🛡️', effect: (player) => { player.invincible = 300; } },
            'bomb': { emoji: '💣', effect: (player, game) => game.clearAllEnemies() }
        };
        
        this.config = this.configs[type] || this.configs['health'];
        this.emoji = this.config.emoji;
    }
    
    update() {
        this.lifetime--;
        this.bobOffset = Math.sin(Date.now() / 200) * 5;
        
        if (this.lifetime <= 0) {
            this.active = false;
        }
        
        // 闪烁警告
        if (this.lifetime < 120 && this.lifetime % 20 < 10) {
            this.visible = false;
        } else {
            this.visible = true;
        }
        
        return this.active;
    }
    
    collect(player, game) {
        if (this.config.effect) {
            this.config.effect(player, game);
        }
        audio.powerUp();
        particles.levelUp(this.x, this.y);
        this.active = false;
    }
    
    draw(ctx) {
        if (!this.visible) return;
        
        ctx.save();
        ctx.font = `${this.radius * 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, this.x, this.y + this.bobOffset);
        ctx.restore();
    }
}

// 道具生成器
class PowerUpSpawner {
    constructor() {
        this.timer = 0;
        this.interval = 300; // 5秒检查一次
        this.chance = 0.3; // 30%概率生成
    }
    
    update(enemies, canvasWidth, canvasHeight) {
        this.timer++;
        
        if (this.timer >= this.interval) {
            this.timer = 0;
            
            if (Utils.chance(this.chance) && enemies.length > 0) {
                const types = ['health', 'energy', 'speed', 'damage', 'shield', 'bomb'];
                const type = Utils.randomChoice(types);
                
                return new PowerUp(
                    Utils.random(50, canvasWidth - 50),
                    Utils.random(50, canvasHeight - 50),
                    type
                );
            }
        }
        
        return null;
    }
}
