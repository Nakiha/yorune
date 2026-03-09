// 👾 敌人类

// Meme敌人配置
const MemeTypes = {
    doge: {
        emoji: '🐕',
        name: '狗头',
        health: 30,
        damage: 10,
        speed: 2,
        points: 100,
        size: 30,
        quotes: ['有人@了你', '这件事你怎么看', '给爷整笑了']
    },
    pepe: {
        emoji: '🐸',
        name: 'Pepe',
        health: 25,
        damage: 8,
        speed: 3,
        points: 80,
        size: 25,
        quotes: ['FeelsBadMan', 'FeelsGoodMan', 'REEEEEE']
    },
    clown: {
        emoji: '🤡',
        name: '小丑',
        health: 40,
        damage: 15,
        speed: 1.5,
        points: 150,
        size: 35,
        quotes: ['你是小丑吗？', '🤡🤡🤡', '我是小丑']
    },
    skull: {
        emoji: '💀',
        name: '骷髅',
        health: 20,
        damage: 5,
        speed: 4,
        points: 60,
        size: 25,
        quotes: ['我无语了', '笑死', '寄']
    },
    crying: {
        emoji: '😭',
        name: '笑哭',
        health: 35,
        damage: 12,
        speed: 2.5,
        points: 120,
        size: 30,
        quotes: ['家人们谁懂啊', '破防了', '绝绝子']
    },
    fire: {
        emoji: '🔥',
        name: '火焰',
        health: 15,
        damage: 20,
        speed: 5,
        points: 50,
        size: 20,
        quotes: ['燃起来了', '着火了', 'hot hot hot']
    },
    think: {
        emoji: '🤔',
        name: '思考',
        health: 50,
        damage: 8,
        speed: 1,
        points: 200,
        size: 35,
        quotes: ['在思考', '有无大佬解释', '合理吗这？']
    },
    sunglasses: {
        emoji: '😎',
        name: '墨镜',
        health: 45,
        damage: 18,
        speed: 2,
        points: 180,
        size: 32,
        quotes: ['Deal with it', '淡定', '稳如老狗']
    }
};

// Boss配置
const BossTypes = {
    superDoge: {
        emoji: '🐕',
        name: '超级狗头',
        health: 500,
        damage: 25,
        speed: 1,
        points: 2000,
        size: 80,
        isBoss: true,
        quotes: ['大的来了！', '全员恶人', '你小子'],
        abilities: ['charge', 'summon', 'rage']
    },
    megaPepe: {
        emoji: '🐸',
        name: 'Mega Pepe',
        health: 400,
        damage: 30,
        speed: 1.5,
        points: 1500,
        size: 70,
        isBoss: true,
        quotes: ['RARE PEPE', 'feelsgoodman', 'this is fine'],
        abilities: ['jump', 'poison', 'multiply']
    },
    ultimateClown: {
        emoji: '🤡',
        name: '终极小丑',
        health: 600,
        damage: 20,
        speed: 0.8,
        points: 2500,
        size: 90,
        isBoss: true,
        quotes: ['全世界都是小丑', '🤡🌍', '我们都是小丑'],
        abilities: ['laugh', 'confetti', 'mindControl']
    }
};

class Enemy {
    constructor(x, y, type = 'doge') {
        const config = MemeTypes[type] || MemeTypes.doge;
        
        this.x = x;
        this.y = y;
        this.type = type;
        this.emoji = config.emoji;
        this.name = config.name;
        this.radius = config.size;
        this.maxHealth = config.health;
        this.health = config.health;
        this.damage = config.damage;
        this.baseSpeed = config.speed;
        this.speed = config.speed;
        this.points = config.points;
        this.quotes = config.quotes;
        this.isBoss = config.isBoss || false;
        
        // AI状态
        this.vx = 0;
        this.vy = 0;
        this.state = 'chase'; // chase, attack, idle
        this.stateTimer = 0;
        this.attackCooldown = 0;
        
        // 特效
        this.hitFlash = 0;
        this.quoteTimer = Utils.randomInt(120, 300);
        this.currentQuote = '';
        
        // Boss特殊能力
        if (this.isBoss) {
            this.abilities = config.abilities || [];
            this.abilityCooldown = 0;
            this.abilityTimer = Utils.randomInt(180, 300);
            this.phase = 1;
        }
    }
    
    update(playerX, playerY, canvasWidth, canvasHeight) {
        // 计算到玩家的方向
        const angle = Utils.angle(this.x, this.y, playerX, playerY);
        const dist = Utils.distance(this.x, this.y, playerX, playerY);
        
        // AI行为
        if (this.state === 'chase') {
            if (dist > this.radius + 50) {
                this.vx = Math.cos(angle) * this.speed;
                this.vy = Math.sin(angle) * this.speed;
            } else {
                this.vx *= 0.8;
                this.vy *= 0.8;
            }
        }
        
        // 移动
        this.x += this.vx;
        this.y += this.vy;
        
        // 边界
        this.x = Utils.clamp(this.x, this.radius, canvasWidth - this.radius);
        this.y = Utils.clamp(this.y, this.radius, canvasHeight - this.radius);
        
        // 冷却
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.hitFlash > 0) this.hitFlash--;
        
        // 随机说话
        this.quoteTimer--;
        if (this.quoteTimer <= 0 && this.quotes && this.quotes.length > 0) {
            this.currentQuote = Utils.randomChoice(this.quotes);
            this.quoteTimer = Utils.randomInt(180, 360);
        } else {
            this.currentQuote = '';
        }
        
        // Boss能力
        if (this.isBoss && this.abilities && this.abilities.length > 0) {
            this.abilityTimer--;
            if (this.abilityTimer <= 0) {
                this.useAbility();
                this.abilityTimer = Utils.randomInt(180, 300);
            }
        }
        
        // Boss血量阶段
        if (this.isBoss) {
            const healthPercent = this.health / this.maxHealth;
            if (healthPercent < 0.3 && this.phase < 3) {
                this.phase = 3;
                this.speed = this.baseSpeed * 1.5;
                particles.bossSpawn(this.x, this.y);
            } else if (healthPercent < 0.6 && this.phase < 2) {
                this.phase = 2;
                this.speed = this.baseSpeed * 1.2;
            }
        }
    }
    
    useAbility() {
        if (!this.abilities) return null;
        
        const ability = Utils.randomChoice(this.abilities);
        // 返回能力信息，由游戏主循环处理
        return {
            type: ability,
            x: this.x,
            y: this.y,
            enemy: this
        };
    }
    
    takeDamage(damage) {
        this.health -= damage;
        this.hitFlash = 10;
        
        // 击退
        const knockbackForce = 5;
        this.vx = -this.vx * knockbackForce;
        this.vy = -this.vy * knockbackForce;
        
        audio.hit();
        
        return this.health <= 0;
    }
    
    draw(ctx) {
        ctx.save();
        
        // 受击闪烁
        if (this.hitFlash > 0) {
            ctx.filter = 'brightness(2)';
        }
        
        // Boss光环
        if (this.isBoss) {
            const glowSize = this.radius + 15 + Math.sin(Date.now() / 200) * 5;
            const gradient = ctx.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, glowSize);
            gradient.addColorStop(0, 'rgba(155, 89, 182, 0.5)');
            gradient.addColorStop(1, 'rgba(155, 89, 182, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 绘制emoji
        ctx.font = `${this.radius * 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, this.x, this.y);
        
        // 血条（仅Boss显示完整血条）
        if (this.isBoss) {
            const barWidth = this.radius * 2;
            const barHeight = 8;
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.radius - 20;
            
            // 背景
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // 血量
            const healthPercent = this.health / this.maxHealth;
            ctx.fillStyle = healthPercent > 0.5 ? '#27ae60' : healthPercent > 0.25 ? '#f39c12' : '#e74c3c';
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        }
        
        // 对话气泡
        if (this.currentQuote) {
            ctx.font = '12px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            
            const bubbleWidth = ctx.measureText(this.currentQuote).width + 20;
            const bubbleX = this.x - bubbleWidth / 2;
            const bubbleY = this.y - this.radius - 40;
            
            // 气泡背景
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.beginPath();
            ctx.roundRect(bubbleX, bubbleY, bubbleWidth, 24, 5);
            ctx.fill();
            
            // 气泡文字
            ctx.fillStyle = 'white';
            ctx.fillText(this.currentQuote, this.x, bubbleY + 16);
        }
        
        ctx.restore();
    }
    
    // 检查是否可以攻击
    canAttack(player) {
        const dist = Utils.distance(this.x, this.y, player.x, player.y);
        return dist < this.radius + player.radius + 10 && this.attackCooldown <= 0;
    }
}

// 敌人生成器
class EnemySpawner {
    constructor() {
        this.wave = 0;
        this.enemiesPerWave = 5;
        this.bossWave = 5; // 每5波出Boss
        this.spawnTimer = 0;
        this.spawnInterval = 120; // 2秒
        this.enemiesToSpawn = [];
        this.waveInProgress = false;
    }
    
    startWave(wave) {
        this.wave = wave;
        this.waveInProgress = true;
        
        // 计算这波敌人数量
        const baseCount = this.enemiesPerWave + Math.floor(wave * 1.5);
        const isBossWave = wave % this.bossWave === 0 && wave > 0;
        
        this.enemiesToSpawn = [];
        
        if (isBossWave) {
            // Boss波
            const bossTypes = Object.keys(BossTypes);
            const bossType = bossTypes[wave / this.bossWave % bossTypes.length];
            this.enemiesToSpawn.push({ type: bossType, isBoss: true, delay: 0 });
            
            // Boss波也有小怪
            for (let i = 0; i < Math.floor(baseCount / 2); i++) {
                this.enemiesToSpawn.push({
                    type: Utils.randomChoice(Object.keys(MemeTypes)),
                    delay: Utils.randomInt(60, 180)
                });
            }
        } else {
            // 普通波
            for (let i = 0; i < baseCount; i++) {
                // 根据波数增加难度
                const availableTypes = Object.keys(MemeTypes);
                const difficultyCap = Math.min(Math.floor(wave / 2) + 2, availableTypes.length);
                const typePool = availableTypes.slice(0, difficultyCap);
                
                this.enemiesToSpawn.push({
                    type: Utils.randomChoice(typePool),
                    delay: i * 30 + Utils.randomInt(0, 30)
                });
            }
        }
        
        this.spawnTimer = 0;
        audio.waveStart();
    }
    
    update() {
        if (!this.waveInProgress) return null;
        
        this.spawnTimer++;
        
        // 检查是否有敌人需要生成
        const toSpawn = this.enemiesToSpawn.filter(e => e.delay <= this.spawnTimer);
        this.enemiesToSpawn = this.enemiesToSpawn.filter(e => e.delay > this.spawnTimer);
        
        if (toSpawn.length > 0) {
            return toSpawn;
        }
        
        return null;
    }
    
    isWaveComplete() {
        return this.waveInProgress && this.enemiesToSpawn.length === 0;
    }
    
    endWave() {
        this.waveInProgress = false;
        this.spawnTimer = 0;
    }
}
