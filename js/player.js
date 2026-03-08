// 🎮 玩家类

class Player {
    constructor(x, y, emoji = '😎') {
        this.x = x;
        this.y = y;
        this.emoji = emoji;
        this.radius = 25;
        this.speed = 5;
        this.baseSpeed = 5;
        
        // 属性
        this.maxHealth = 100;
        this.health = 100;
        this.maxEnergy = 100;
        this.energy = 100;
        this.energyRegen = 0.5;
        
        // 角色特性
        this.characterBonus = this.getCharacterBonus(emoji);
        this.applyCharacterBonus();
        
        // 武器
        this.weapons = ['🔥', '⚔️', '⚡', '💣'];
        this.currentWeaponIndex = 0;
        this.currentWeapon = this.weapons[0];
        this.attackCooldown = 0;
        this.attackRate = 15; // frames
        
        // 技能
        this.skillCooldown = 0;
        this.skillMaxCooldown = 180; // 3秒
        this.skillActive = false;
        this.skillDuration = 0;
        
        // 状态
        this.invincible = 0;
        this.vx = 0;
        this.vy = 0;
        this.facingRight = true;
        
        // 统计
        this.score = 0;
        this.kills = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.comboTimer = 0;
        
        // 特效
        this.trailTimer = 0;
    }
    
    getCharacterBonus(emoji) {
        const bonuses = {
            '😎': { defense: 0.2, name: '酷盖' },
            '🚀': { speed: 0.3, name: '火箭人' },
            '🎮': { attack: 0.25, name: '玩家' },
            '🌈': { luck: 0.4, name: '彩虹使者' }
        };
        return bonuses[emoji] || { name: '无名英雄' };
    }
    
    applyCharacterBonus() {
        if (this.characterBonus.speed) {
            this.speed = this.baseSpeed * (1 + this.characterBonus.speed);
        }
        if (this.characterBonus.defense) {
            this.defenseBonus = this.characterBonus.defense;
        }
        if (this.characterBonus.attack) {
            this.attackBonus = this.characterBonus.attack;
        }
        if (this.characterBonus.luck) {
            this.luckBonus = this.characterBonus.luck;
        }
    }
    
    update(keys, canvasWidth, canvasHeight) {
        // 移动
        let moveX = 0;
        let moveY = 0;
        
        if (keys['ArrowUp'] || keys['KeyW']) moveY = -1;
        if (keys['ArrowDown'] || keys['KeyS']) moveY = 1;
        if (keys['ArrowLeft'] || keys['KeyA']) { moveX = -1; this.facingRight = false; }
        if (keys['ArrowRight'] || keys['KeyD']) { moveX = 1; this.facingRight = true; }
        
        // 对角线移动标准化
        if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.707;
            moveY *= 0.707;
        }
        
        this.vx = moveX * this.speed;
        this.vy = moveY * this.speed;
        
        this.x += this.vx;
        this.y += this.vy;
        
        // 边界限制
        this.x = Utils.clamp(this.x, this.radius, canvasWidth - this.radius);
        this.y = Utils.clamp(this.y, this.radius, canvasHeight - this.radius);
        
        // 能量恢复
        this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegen);
        
        // 冷却
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.skillCooldown > 0) this.skillCooldown--;
        
        // 无敌时间
        if (this.invincible > 0) this.invincible--;
        
        // 连击计时器
        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }
        
        // 技能持续时间
        if (this.skillActive) {
            this.skillDuration--;
            if (this.skillDuration <= 0) {
                this.skillActive = false;
            }
        }
        
        // 尾迹效果 - 降低频率提升性能
        this.trailTimer++;
        if (this.trailTimer >= 5 && (Math.abs(this.vx) > 0 || Math.abs(this.vy) > 0)) {
            particles.trail(this.x, this.y, this.skillActive ? '#ffe66d' : '#4ecdc4');
            this.trailTimer = 0;
        }
    }
    
    attack(enemies) {
        if (this.attackCooldown > 0) return null;
        
        this.attackCooldown = this.attackRate;
        audio.attack();
        
        const weapon = WeaponFactory.create(this.currentWeapon, this);
        return weapon;
    }
    
    useSkill() {
        if (this.skillCooldown > 0 || this.energy < 30) return false;
        
        this.energy -= 30;
        this.skillCooldown = this.skillMaxCooldown;
        this.skillActive = true;
        this.skillDuration = 180; // 3秒
        this.invincible = 30; // 0.5秒无敌
        
        audio.skill();
        particles.explosion(this.x, this.y, '#ffe66d', 20);
        
        return true;
    }
    
    switchWeapon() {
        this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
        this.currentWeapon = this.weapons[this.currentWeaponIndex];
    }
    
    takeDamage(damage) {
        if (this.invincible > 0) return false;
        
        // 防御减伤
        if (this.defenseBonus) {
            damage *= (1 - this.defenseBonus);
        }
        
        this.health -= Math.floor(damage);
        this.invincible = 60; // 1秒无敌
        this.combo = 0; // 重置连击
        
        audio.playerHit();
        Utils.showDamage(this.x, this.y - 30, Math.floor(damage));
        
        return this.health <= 0;
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        audio.powerUp();
        particles.heal(this.x, this.y);
    }
    
    addKill(points) {
        this.kills++;
        this.combo++;
        this.comboTimer = 120; // 2秒内继续击杀保持连击
        
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        
        // 连击加分
        const comboMultiplier = 1 + this.combo * 0.1;
        const finalPoints = Math.floor(points * comboMultiplier);
        this.score += finalPoints;
        
        if (this.combo >= 3) {
            audio.combo(this.combo);
            Utils.showCombo(this.combo);
        }
        
        return finalPoints;
    }
    
    draw(ctx) {
        ctx.save();
        
        // 无敌闪烁效果
        if (this.invincible > 0 && Math.floor(this.invincible / 5) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // 技能激活光环
        if (this.skillActive) {
            const glowRadius = this.radius + 20 + Math.sin(Date.now() / 100) * 5;
            const gradient = ctx.createRadialGradient(this.x, this.y, this.radius, this.x, this.y, glowRadius);
            gradient.addColorStop(0, 'rgba(255, 230, 109, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 230, 109, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 绘制emoji
        ctx.font = `${this.radius * 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 翻转方向
        if (!this.facingRight) {
            ctx.scale(-1, 1);
            ctx.fillText(this.emoji, -this.x, this.y);
        } else {
            ctx.fillText(this.emoji, this.x, this.y);
        }
        
        ctx.restore();
    }
    
    // 获取技能冷却百分比
    getSkillCooldownPercent() {
        return this.skillCooldown / this.skillMaxCooldown;
    }
    
    // 获取当前武器伤害
    getWeaponDamage() {
        const baseDamages = {
            '🔥': 20,
            '⚔️': 15,
            '⚡': 25,
            '💣': 35
        };
        let damage = baseDamages[this.currentWeapon] || 10;
        
        // 攻击加成
        if (this.attackBonus) {
            damage *= (1 + this.attackBonus);
        }
        
        // 技能加成
        if (this.skillActive) {
            damage *= 1.5;
        }
        
        return Math.floor(damage);
    }
}
