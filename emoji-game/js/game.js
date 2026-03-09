// 🎮 游戏主控制器

class Game {
    constructor() {
        // Canvas
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 游戏状态
        this.state = 'start'; // start, playing, paused, gameover, victory
        this.selectedCharacter = '😎';
        
        // 游戏对象
        this.player = null;
        this.enemies = [];
        this.weapons = [];
        this.powerUps = [];
        
        // 管理器
        this.ui = new UI();
        this.spawner = new EnemySpawner();
        this.levelManager = new LevelManager();
        this.powerUpSpawner = new PowerUpSpawner();
        
        // 输入
        this.keys = {};
        this.joystick = { active: false, dx: 0, dy: 0 };
        
        // 统计
        this.wave = 0;
        this.frameCount = 0;
        this.powerUpsCollected = 0;
        
        // 初始化
        this.init();
    }
    
    init() {
        // 设置画布大小
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // 键盘事件
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // UI按钮事件
        this.bindUIEvents();
        
        // 移动端控制
        this.setupMobileControls();
        
        // 显示开始界面
        this.ui.showScreen('start');
        
        // 初始化音频
        document.addEventListener('click', () => audio.init(), { once: true });
        document.addEventListener('keydown', () => audio.init(), { once: true });
    }
    
    resize() {
        const container = document.getElementById('game-screen');
        this.canvas.width = container.clientWidth || 800;
        this.canvas.height = container.clientHeight || 600;
    }
    
    bindUIEvents() {
        // 角色选择
        document.querySelectorAll('.char-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.char-btn').forEach(b => b.classList.remove('selected'));
                e.currentTarget.classList.add('selected');
                this.selectedCharacter = e.currentTarget.dataset.char;
            });
        });
        
        // 开始按钮
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        // 暂停界面按钮
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.resume();
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restart();
        });
        
        document.getElementById('quit-btn').addEventListener('click', () => {
            this.quitToMenu();
        });
        
        // 游戏结束界面按钮
        document.getElementById('retry-btn').addEventListener('click', () => {
            this.restart();
        });
        
        document.getElementById('menu-btn').addEventListener('click', () => {
            this.quitToMenu();
        });
        
        // 胜利界面按钮
        document.getElementById('next-level-btn').addEventListener('click', () => {
            this.nextLevel();
        });
    }
    
    setupMobileControls() {
        const joystickBase = document.getElementById('joystick-base');
        const joystickStick = document.getElementById('joystick-stick');
        
        if (!joystickBase || !joystickStick) return;
        
        let touchId = null;
        let baseX, baseY;
        const maxDist = 40;
        
        joystickBase.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchId = touch.identifier;
            const rect = joystickBase.getBoundingClientRect();
            baseX = rect.left + rect.width / 2;
            baseY = rect.top + rect.height / 2;
            this.joystick.active = true;
        });
        
        joystickBase.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (let touch of e.touches) {
                if (touch.identifier === touchId) {
                    const dx = touch.clientX - baseX;
                    const dy = touch.clientY - baseY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist > maxDist) {
                        this.joystick.dx = (dx / dist) * maxDist / maxDist;
                        this.joystick.dy = (dy / dist) * maxDist / maxDist;
                    } else {
                        this.joystick.dx = dx / maxDist;
                        this.joystick.dy = dy / maxDist;
                    }
                    
                    // 移动摇杆
                    const stickX = Math.min(Math.max(dx, -maxDist), maxDist);
                    const stickY = Math.min(Math.max(dy, -maxDist), maxDist);
                    joystickStick.style.transform = `translate(${stickX}px, ${stickY}px)`;
                }
            }
        });
        
        const resetJoystick = () => {
            this.joystick.active = false;
            this.joystick.dx = 0;
            this.joystick.dy = 0;
            joystickStick.style.transform = 'translate(0, 0)';
            touchId = null;
        };
        
        joystickBase.addEventListener('touchend', resetJoystick);
        joystickBase.addEventListener('touchcancel', resetJoystick);
        
        // 攻击按钮
        document.getElementById('btn-attack')?.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.playerAttack();
        });
        
        // 技能按钮
        document.getElementById('btn-skill')?.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.playerSkill();
        });
        
        // 切换武器按钮
        document.getElementById('btn-weapon')?.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.playerSwitchWeapon();
        });
    }
    
    handleKeyDown(e) {
        this.keys[e.code] = true;
        
        if (this.state === 'playing') {
            if (e.code === 'KeyJ' || e.code === 'Space') {
                e.preventDefault();
                this.playerAttack();
            }
            if (e.code === 'KeyK') {
                this.playerSkill();
            }
            if (e.code === 'KeyL') {
                this.playerSwitchWeapon();
            }
            if (e.code === 'Escape' || e.code === 'KeyP') {
                this.pause();
            }
        } else if (this.state === 'paused') {
            if (e.code === 'Escape' || e.code === 'KeyP') {
                this.resume();
            }
        } else if (this.state === 'start') {
            if (e.code === 'Enter' || e.code === 'Space') {
                e.preventDefault();
                this.startGame();
            }
        } else if (this.state === 'gameover' || this.state === 'victory') {
            if (e.code === 'Enter' || e.code === 'Space') {
                e.preventDefault();
                this.restart();
            }
        }
    }
    
    handleKeyUp(e) {
        this.keys[e.code] = false;
    }
    
    playerAttack() {
        if (!this.player || this.state !== 'playing') return;
        const weapon = this.player.attack(this.enemies);
        if (weapon) {
            this.weapons.push(weapon);
        }
    }
    
    playerSkill() {
        if (!this.player || this.state !== 'playing') return;
        if (this.player.useSkill()) {
            particles.explosion(this.player.x, this.player.y, '#ffe66d', 25);
            // 技能释放时对周围敌人造成伤害
            this.enemies.forEach(enemy => {
                const dist = Utils.distance(this.player.x, this.player.y, enemy.x, enemy.y);
                if (dist < 150) {
                    const damage = this.player.getWeaponDamage() * 2;
                    if (enemy.takeDamage(damage)) {
                        this.onEnemyDeath(enemy);
                    }
                }
            });
        }
    }
    
    playerSwitchWeapon() {
        if (!this.player || this.state !== 'playing') return;
        this.player.switchWeapon();
    }
    
    startGame() {
        this.state = 'playing';
        this.wave = 0;
        this.enemies = [];
        this.weapons = [];
        this.powerUps = [];
        this.frameCount = 0;
        this.powerUpsCollected = 0;
        
        // 初始化玩家
        this.player = new Player(
            this.canvas.width / 2,
            this.canvas.height / 2,
            this.selectedCharacter
        );
        
        // 加载第一关
        this.levelManager.loadLevel('tutorial');
        
        // 开始第一波
        this.startNextWave();
        
        // 显示游戏界面
        this.ui.showScreen('game');
        
        // 开始游戏循环
        this.gameLoop();
    }
    
    startNextWave() {
        const waveInfo = this.levelManager.getNextWave();
        
        if (!waveInfo) {
            // 关卡完成
            this.onLevelComplete();
            return;
        }
        
        this.wave = waveInfo.wave;
        
        // 配置敌人生成
        this.spawner.startWave(this.wave);
        
        // 显示波次信息
        if (waveInfo.isBossWave) {
            this.ui.showMessage(`⚠️ 第 ${this.wave} 波 - BOSS来了！`, 3000);
            audio.bossSpawn();
        } else {
            this.ui.showMessage(`第 ${this.wave} 波`, 2000);
        }
    }
    
    pause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            this.ui.showScreen('pause');
        }
    }
    
    resume() {
        if (this.state === 'paused') {
            this.state = 'playing';
            this.ui.showScreen('game');
            this.gameLoop();
        }
    }
    
    restart() {
        this.state = 'playing';
        this.wave = 0;
        this.enemies = [];
        this.weapons = [];
        this.powerUps = [];
        this.frameCount = 0;
        this.powerUpsCollected = 0;
        
        // 重置玩家
        this.player = new Player(
            this.canvas.width / 2,
            this.canvas.height / 2,
            this.selectedCharacter
        );
        
        // 重置关卡
        this.levelManager.loadLevel('tutorial');
        this.startNextWave();
        
        // 显示游戏界面
        this.ui.showScreen('game');
        
        // 开始游戏循环
        this.gameLoop();
    }
    
    quitToMenu() {
        this.state = 'start';
        this.ui.showScreen('start');
    }
    
    nextLevel() {
        const nextLevelKey = this.levelManager.getNextLevelKey();
        
        if (!nextLevelKey) {
            // 所有关卡完成
            this.ui.showMessage('🎉 恭喜通关！你拯救了Emoji王国！', 5000);
            this.quitToMenu();
            return;
        }
        
        this.state = 'playing';
        this.enemies = [];
        this.weapons = [];
        this.powerUps = [];
        
        // 重置玩家位置
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height / 2;
        
        // 加载下一关
        this.levelManager.loadLevel(nextLevelKey);
        this.startNextWave();
        
        this.ui.showScreen('game');
        this.gameLoop();
    }
    
    onLevelComplete() {
        if (this.levelManager.hasNextLevel()) {
            this.state = 'victory';
            this.ui.showVictory(this.player);
        } else {
            // 游戏通关
            this.state = 'victory';
            this.ui.showVictory(this.player);
            
            // 添加到排行榜
            Leaderboard.add(
                this.player.emoji + ' ' + this.player.characterBonus.name,
                this.player.score,
                this.wave,
                this.player.kills
            );
            
            // 检查成就
            Achievements.check('levelClear');
        }
    }
    
    onEnemyDeath(enemy) {
        // 加分
        const points = this.player.addKill(enemy.points);
        
        // 特效
        particles.enemyDeath(enemy.x, enemy.y, enemy.type);
        Utils.showDamage(enemy.x, enemy.y - 20, points, '#ffe66d');
        
        // 检查成就
        if (this.player.kills === 1) {
            const achievements = Achievements.check('kill');
            achievements.forEach(a => this.ui.showAchievement(a));
        }
        
        if (this.player.combo >= 3) {
            const achievements = Achievements.check('combo', this.player.combo);
            achievements.forEach(a => this.ui.showAchievement(a));
        }
        
        if (enemy.isBoss) {
            const achievements = Achievements.check('boss');
            achievements.forEach(a => this.ui.showAchievement(a));
        }
        
        // 播放音效
        audio.enemyDeath();
    }
    
    onGameOver() {
        this.state = 'gameover';
        this.ui.showGameOver(this.player, this.wave);
        
        // 添加到排行榜
        Leaderboard.add(
            this.player.emoji + ' ' + this.player.characterBonus.name,
            this.player.score,
            this.wave,
            this.player.kills
        );
    }
    
    clearAllEnemies() {
        // 清除所有敌人（炸弹道具效果）- 优化版，限制粒子数量
        const enemyCount = this.enemies.length;
        
        // 只对前5个敌人显示完整特效
        this.enemies.slice(0, 5).forEach(enemy => {
            this.onEnemyDeath(enemy);
            particles.explosion(enemy.x, enemy.y, '#ff6b6b', 10);
        });
        
        // 其余敌人只加分和简化特效
        this.enemies.slice(5).forEach(enemy => {
            this.player.addKill(enemy.points);
            particles.explosion(enemy.x, enemy.y, '#ff6b6b', 3);
        });
        
        this.enemies = [];
        
        // 屏幕震动和闪屏
        this.ui.screenShake(10, 300);
        this.ui.flashScreen('white', 150);
    }
    
    gameLoop() {
        if (this.state !== 'playing') return;
        
        this.frameCount++;
        
        // 更新
        this.update();
        
        // 渲染
        this.render();
        
        // 下一帧
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // 合并键盘和摇杆输入
        const input = { ...this.keys };
        
        if (this.joystick.active) {
            if (this.joystick.dx < -0.3) input['ArrowLeft'] = true;
            if (this.joystick.dx > 0.3) input['ArrowRight'] = true;
            if (this.joystick.dy < -0.3) input['ArrowUp'] = true;
            if (this.joystick.dy > 0.3) input['ArrowDown'] = true;
        }
        
        // 更新玩家
        this.player.update(input, this.canvas.width, this.canvas.height);
        
        // 生成敌人
        const spawnInfo = this.spawner.update();
        if (spawnInfo) {
            spawnInfo.forEach(info => {
                const edge = Utils.randomInt(0, 3);
                let x, y;
                
                switch (edge) {
                    case 0: // 上
                        x = Utils.random(50, this.canvas.width - 50);
                        y = -30;
                        break;
                    case 1: // 下
                        x = Utils.random(50, this.canvas.width - 50);
                        y = this.canvas.height + 30;
                        break;
                    case 2: // 左
                        x = -30;
                        y = Utils.random(50, this.canvas.height - 50);
                        break;
                    case 3: // 右
                        x = this.canvas.width + 30;
                        y = Utils.random(50, this.canvas.height - 50);
                        break;
                }
                
                let enemy;
                if (info.isBoss) {
                    const bossTypes = Object.keys(BossTypes);
                    const bossType = Utils.randomChoice(bossTypes);
                    enemy = new Enemy(x, y, bossType);
                } else {
                    const typePool = this.levelManager.currentLevel?.enemyTypes || Object.keys(MemeTypes);
                    const type = Utils.randomChoice(typePool);
                    enemy = new Enemy(x, y, type);
                }
                
                this.enemies.push(enemy);
                
                if (enemy.isBoss) {
                    particles.bossSpawn(enemy.x, enemy.y);
                }
            });
        }
        
        // 更新敌人
        this.enemies.forEach(enemy => {
            enemy.update(this.player.x, this.player.y, this.canvas.width, this.canvas.height);
            
            // 敌人攻击玩家
            if (enemy.canAttack(this.player)) {
                const dead = this.player.takeDamage(enemy.damage);
                enemy.attackCooldown = 60;
                
                // 击退
                const angle = Utils.angle(enemy.x, enemy.y, this.player.x, this.player.y);
                this.player.x += Math.cos(angle) * 20;
                this.player.y += Math.sin(angle) * 20;
                
                if (dead) {
                    this.onGameOver();
                    return;
                }
            }
        });
        
        // 更新武器
        this.weapons = this.weapons.filter(weapon => {
            if (!weapon.update()) return false;
            if (!weapon.isInBounds(this.canvas.width, this.canvas.height)) return false;
            
            // 检查碰撞
            for (let enemy of this.enemies) {
                if (Utils.circleCollision(weapon, enemy)) {
                    if (weapon.onHit(enemy)) {
                        const damage = weapon.damage;
                        if (enemy.takeDamage(damage)) {
                            this.onEnemyDeath(enemy);
                            this.enemies = this.enemies.filter(e => e !== enemy);
                        }
                    }
                }
            }
            
            return weapon.active;
        });
        
        // 移除死亡敌人
        this.enemies = this.enemies.filter(e => e.health > 0);
        
        // 生成道具
        const newPowerUp = this.powerUpSpawner.update(this.enemies, this.canvas.width, this.canvas.height);
        if (newPowerUp) {
            this.powerUps.push(newPowerUp);
        }
        
        // 更新道具
        this.powerUps = this.powerUps.filter(powerUp => {
            if (!powerUp.update()) return false;
            
            // 检查玩家拾取
            if (Utils.circleCollision(this.player, powerUp)) {
                powerUp.collect(this.player, this);
                this.powerUpsCollected++;
                
                // 检查成就
                if (this.powerUpsCollected >= 10) {
                    const achievements = Achievements.check('collector');
                    achievements.forEach(a => this.ui.showAchievement(a));
                }
                
                return false;
            }
            
            return powerUp.active;
        });
        
        // 更新粒子
        particles.update();
        
        // 更新关卡管理器
        this.levelManager.update();
        
        // 显示关卡消息
        const messages = this.levelManager.getMessages();
        messages.forEach(msg => this.ui.showMessage(msg));
        
        // 检查波次完成
        if (this.spawner.isWaveComplete() && this.enemies.length === 0) {
            this.spawner.endWave();
            
            // 小延迟后开始下一波
            setTimeout(() => {
                if (this.state === 'playing') {
                    this.startNextWave();
                }
            }, 1500);
        }
        
        // 更新UI
        this.ui.updateHUD(this.player, this.wave, this.enemies.length);
    }
    
    render() {
        const ctx = this.ctx;
        
        // 清除画布
        const bgColor = this.levelManager.currentLevel?.background || '#0a0a1a';
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格背景
        this.drawGrid(ctx);
        
        // 绘制道具
        this.powerUps.forEach(p => p.draw(ctx));
        
        // 绘制武器
        this.weapons.forEach(w => w.draw(ctx));
        
        // 绘制敌人
        this.enemies.forEach(e => e.draw(ctx));
        
        // 绘制玩家
        if (this.player) {
            this.player.draw(ctx);
        }
        
        // 绘制粒子
        particles.draw(ctx);
    }
    
    drawGrid(ctx) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        
        const gridSize = 50;
        
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }
        
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }
    }
}

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
