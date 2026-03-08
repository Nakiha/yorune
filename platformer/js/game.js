// 🎮 Emoji vs Meme - 梗图大冒险 主游戏逻辑

class Game {
    constructor() {
        // Canvas设置
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 960;
        this.canvas.height = 540;
        
        // 游戏常量
        this.TILE_SIZE = 36;
        this.GRAVITY = 0.6;
        this.JUMP_FORCE = -12;
        this.MOVE_SPEED = 4;
        
        // 游戏状态
        this.state = 'start'; // start, playing, dead, win
        this.currentLevel = 0;
        this.levelKeys = getLevelKeys();
        
        // 玩家
        this.player = null;
        this.selectedChar = '😎';
        
        // 统计
        this.deaths = 0;
        this.coins = 0;
        this.totalCoins = 0;
        
        // 关卡数据
        this.levelData = null;
        this.map = [];
        this.enemies = [];
        this.traps = [];
        this.fakeCoins = [];
        
        // 相机
        this.cameraX = 0;
        
        // 特效
        this.particles = [];
        this.screenShake = 0;
        
        // 反向控制（毒药效果）
        this.reverseControls = false;
        this.reverseTimer = 0;
        
        // 音效
        this.sounds = {};
        this.initSounds();
        
        // 初始化UI
        this.initUI();
    }
    
    initSounds() {
        // 简单的音效系统
        this.audioCtx = null;
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio not supported');
        }
    }
    
    playSound(type) {
        if (!this.audioCtx) return;
        
        const sounds = {
            jump: { freq: 400, dur: 0.1 },
            coin: { freq: 800, dur: 0.15 },
            death: { freq: 200, dur: 0.3 },
            hit: { freq: 150, dur: 0.2 },
            win: { freq: 600, dur: 0.5 },
        };
        
        const s = sounds[type];
        if (!s) return;
        
        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.frequency.value = s.freq;
            gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + s.dur);
            osc.start();
            osc.stop(this.audioCtx.currentTime + s.dur);
        } catch (e) {}
    }
    
    initUI() {
        // 角色选择
        document.querySelectorAll('.char-option').forEach(el => {
            el.addEventListener('click', () => {
                document.querySelectorAll('.char-option').forEach(e => e.classList.remove('selected'));
                el.classList.add('selected');
                this.selectedChar = el.dataset.char;
            });
        });
        
        // 开始按钮
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        // 重试按钮
        document.getElementById('retry-btn').addEventListener('click', () => {
            this.retry();
        });
        
        // 下一关按钮
        document.getElementById('next-level-btn').addEventListener('click', () => {
            this.nextLevel();
        });
        
        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    
    handleKeyDown(e) {
        if (this.keys) this.keys[e.code] = true;
        
        // R键重试
        if (e.code === 'KeyR' && this.state === 'dead') {
            this.retry();
        }
        
        // 空格/回车开始
        if ((e.code === 'Space' || e.code === 'Enter') && this.state === 'start') {
            e.preventDefault();
            this.startGame();
        }
    }
    
    handleKeyUp(e) {
        if (this.keys) this.keys[e.code] = false;
    }
    
    startGame() {
        this.state = 'playing';
        this.deaths = 0;
        this.currentLevel = 0;
        
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('hud').style.display = 'block';
        
        this.loadLevel(this.currentLevel);
        this.gameLoop();
    }
    
    loadLevel(levelIndex) {
        const key = this.levelKeys[levelIndex];
        this.levelData = LevelData[key];
        
        // 解析地图
        this.map = parseMapString(this.levelData.map);
        
        // 计算总金币数
        this.totalCoins = 0;
        for (let row of this.map) {
            for (let cell of row) {
                if (cell === '3') this.totalCoins++;
            }
        }
        
        // 初始化玩家
        this.player = {
            x: 2 * this.TILE_SIZE,
            y: 10 * this.TILE_SIZE,
            vx: 0,
            vy: 0,
            width: 28,
            height: 32,
            onGround: false,
            emoji: this.selectedChar,
            facingRight: true,
        };
        
        // 初始化敌人
        this.enemies = this.levelData.enemies.map(e => {
            const type = EnemyTypes[e[0]];
            return {
                x: e[1] * this.TILE_SIZE,
                y: e[2] * this.TILE_SIZE - this.TILE_SIZE,
                vx: type.speed * type.dir,
                vy: 0,
                width: 30,
                height: 30,
                type: e[0],
                config: type,
                active: true,
                hidden: false,
            };
        });
        
        // 初始化陷阱
        this.traps = this.levelData.traps.map(t => ({
            type: t[0],
            x: t[1] * this.TILE_SIZE,
            y: t[2] * this.TILE_SIZE,
            param: t[3],
            triggered: false,
            active: true,
            timer: 0,
        }));
        
        // 假金币
        this.fakeCoins = this.levelData.fakeCoins.map(c => ({
            x: c[0] * this.TILE_SIZE,
            y: c[1] * this.TILE_SIZE,
            collected: false,
        }));
        
        // 重置状态
        this.coins = 0;
        this.cameraX = 0;
        this.particles = [];
        this.reverseControls = false;
        this.reverseTimer = 0;
        
        // 更新UI
        document.getElementById('level-num').textContent = levelIndex + 1;
        document.getElementById('death-count').textContent = this.deaths;
        document.getElementById('coin-count').textContent = this.coins;
        document.getElementById('coin-total').textContent = this.totalCoins;
        
        // 显示提示
        if (this.levelData.hint) {
            this.showHint(this.levelData.hint);
        }
    }
    
    showHint(text) {
        const hintBox = document.getElementById('hint-box');
        hintBox.textContent = text;
        hintBox.classList.add('show');
        setTimeout(() => hintBox.classList.remove('show'), 3000);
    }
    
    retry() {
        document.getElementById('death-screen').classList.remove('show');
        this.loadLevel(this.currentLevel);
        this.state = 'playing';
        this.gameLoop();
    }
    
    nextLevel() {
        document.getElementById('win-screen').classList.remove('show');
        this.currentLevel++;
        
        if (this.currentLevel >= this.levelKeys.length) {
            // 通关！
            this.showVictoryScreen();
        } else {
            this.loadLevel(this.currentLevel);
            this.state = 'playing';
            this.gameLoop();
        }
    }
    
    die(reason = 'default') {
        if (this.state !== 'playing') return;
        
        this.state = 'dead';
        this.deaths++;
        
        // 选择死亡消息
        const messages = DeathMessages[reason] || DeathMessages.default;
        const msg = messages[Math.floor(Math.random() * messages.length)];
        
        // 播放音效
        this.playSound('death');
        
        // 创建死亡粒子
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                emoji: ['💀', '💥', '⭐', '✨'][Math.floor(Math.random() * 4)],
                life: 60,
            });
        }
        
        // 显示死亡界面
        setTimeout(() => {
            document.getElementById('death-reason').textContent = msg;
            document.getElementById('death-num').textContent = this.deaths;
            document.getElementById('death-screen').classList.add('show');
        }, 500);
    }
    
    win() {
        if (this.state !== 'playing') return;
        
        this.state = 'win';
        this.playSound('win');
        
        // 庆祝粒子
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y,
                vx: (Math.random() - 0.5) * 8,
                vy: -Math.random() * 10,
                emoji: ['🎉', '🎊', '⭐', '🌟', '✨'][Math.floor(Math.random() * 5)],
                life: 100,
            });
        }
        
        setTimeout(() => {
            document.getElementById('final-deaths').textContent = this.deaths;
            document.getElementById('final-coins').textContent = this.coins;
            document.getElementById('win-screen').classList.add('show');
        }, 500);
    }
    
    showVictoryScreen() {
        // TODO: 显示通关界面
        this.showHint('🎉 恭喜通关！你是真正的梗王！');
        setTimeout(() => {
            location.reload();
        }, 3000);
    }
    
    gameLoop() {
        if (this.state !== 'playing') {
            // 继续渲染粒子效果
            this.updateParticles();
            this.render();
            if (this.particles.length > 0) {
                requestAnimationFrame(() => this.gameLoop());
            }
            return;
        }
        
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // 更新反向控制计时器
        if (this.reverseTimer > 0) {
            this.reverseTimer--;
            if (this.reverseTimer <= 0) {
                this.reverseControls = false;
            }
        }
        
        // 处理输入
        let moveLeft = this.keys['ArrowLeft'] || this.keys['KeyA'];
        let moveRight = this.keys['ArrowRight'] || this.keys['KeyD'];
        let jump = this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW'];
        
        // 反向控制
        if (this.reverseControls) {
            [moveLeft, moveRight] = [moveRight, moveLeft];
        }
        
        // 玩家移动
        if (moveLeft) {
            this.player.vx = -this.MOVE_SPEED;
            this.player.facingRight = false;
        } else if (moveRight) {
            this.player.vx = this.MOVE_SPEED;
            this.player.facingRight = true;
        } else {
            this.player.vx *= 0.8;
        }
        
        // 跳跃
        if (jump && this.player.onGround) {
            let jumpForce = this.JUMP_FORCE;
            
            // 检查是否在反向跳跃砖上
            const onReverse = this.traps.some(t => 
                t.type === 'reverse' && t.active &&
                this.player.x < t.x + this.TILE_SIZE &&
                this.player.x + this.player.width > t.x &&
                this.player.y + this.player.height >= t.y &&
                this.player.y + this.player.height <= t.y + this.TILE_SIZE
            );
            
            if (onReverse) jumpForce = -jumpForce;
            
            this.player.vy = jumpForce;
            this.player.onGround = false;
            this.playSound('jump');
        }
        
        // 应用重力
        this.player.vy += this.GRAVITY;
        this.player.vy = Math.min(this.player.vy, 15);
        
        // 移动并检测碰撞
        this.player.x += this.player.vx;
        this.handleCollisionX();
        
        this.player.y += this.player.vy;
        this.handleCollisionY();
        
        // 检测掉落
        if (this.player.y > this.canvas.height + 100) {
            this.die('fall');
        }
        
        // 更新敌人
        this.updateEnemies();
        
        // 检测陷阱
        this.checkTraps();
        
        // 检测金币
        this.checkCoins();
        
        // 检测终点
        this.checkGoal();
        
        // 更新相机
        this.cameraX = this.player.x - this.canvas.width / 3;
        this.cameraX = Math.max(0, this.cameraX);
        
        // 更新粒子
        this.updateParticles();
        
        // 屏幕震动衰减
        if (this.screenShake > 0) this.screenShake *= 0.9;
    }
    
    handleCollisionX() {
        const tileX1 = Math.floor(this.player.x / this.TILE_SIZE);
        const tileX2 = Math.floor((this.player.x + this.player.width) / this.TILE_SIZE);
        const tileY1 = Math.floor(this.player.y / this.TILE_SIZE);
        const tileY2 = Math.floor((this.player.y + this.player.height - 1) / this.TILE_SIZE);
        
        for (let ty = tileY1; ty <= tileY2; ty++) {
            for (let tx = tileX1; tx <= tileX2; tx++) {
                if (this.isSolid(tx, ty)) {
                    if (this.player.vx > 0) {
                        this.player.x = tx * this.TILE_SIZE - this.player.width;
                    } else if (this.player.vx < 0) {
                        this.player.x = (tx + 1) * this.TILE_SIZE;
                    }
                    this.player.vx = 0;
                }
            }
        }
    }
    
    handleCollisionY() {
        const tileX1 = Math.floor(this.player.x / this.TILE_SIZE);
        const tileX2 = Math.floor((this.player.x + this.player.width) / this.TILE_SIZE);
        const tileY1 = Math.floor(this.player.y / this.TILE_SIZE);
        const tileY2 = Math.floor((this.player.y + this.player.height) / this.TILE_SIZE);
        
        this.player.onGround = false;
        
        for (let ty = tileY1; ty <= tileY2; ty++) {
            for (let tx = tileX1; tx <= tileX2; tx++) {
                if (this.isSolid(tx, ty)) {
                    if (this.player.vy > 0) {
                        this.player.y = ty * this.TILE_SIZE - this.player.height;
                        this.player.vy = 0;
                        this.player.onGround = true;
                        
                        // 检查是否踩到特殊砖块
                        this.checkSpecialTile(tx, ty);
                    } else if (this.player.vy < 0) {
                        this.player.y = (ty + 1) * this.TILE_SIZE;
                        this.player.vy = 0;
                    }
                }
            }
        }
    }
    
    isSolid(tx, ty) {
        if (ty < 0 || ty >= this.map.length) return false;
        if (tx < 0 || tx >= this.map[ty].length) return true;
        
        const cell = this.map[ty][tx];
        // 1=砖块, G=地面
        return cell === '1' || cell === 'G';
    }
    
    checkSpecialTile(tx, ty) {
        // 检查是否是问号砖
        const worldX = tx * this.TILE_SIZE;
        const worldY = ty * this.TILE_SIZE;
        
        // 查找对应的陷阱
        const trap = this.traps.find(t => 
            t.x === worldX && t.y === worldY && 
            (t.type === 'trap_q' || t.type === 'death_q' || t.type === 'poison_q')
        );
        
        if (trap && !trap.triggered) {
            trap.triggered = true;
            
            if (trap.type === 'death_q') {
                this.die('question');
            } else if (trap.type === 'poison_q') {
                this.reverseControls = true;
                this.reverseTimer = 180; // 3秒
                this.showHint('😵 反向控制！' + (this.reverseControls ? '←→颠倒' : ''));
            } else if (trap.type === 'trap_q') {
                // 弹出敌人
                this.enemies.push({
                    x: worldX,
                    y: worldY - this.TILE_SIZE,
                    vx: 2,
                    vy: 0,
                    width: 30,
                    height: 30,
                    type: 'skull',
                    config: EnemyTypes.SKULL,
                    active: true,
                });
                this.die('question');
            }
        }
        
        // 检查弹跳砖
        const bounceTrap = this.traps.find(t => 
            t.type === 'bounce' && t.x === worldX && t.y === worldY && t.active
        );
        
        if (bounceTrap) {
            this.player.vy = this.JUMP_FORCE * 2; // 超级弹跳
            this.player.onGround = false;
        }
        
        // 检查坍塌砖
        const fallTrap = this.traps.find(t => 
            t.type === 'fall' && t.x === worldX && t.y === worldY && t.active
        );
        
        if (fallTrap) {
            setTimeout(() => {
                // 将砖块变为空气
                const mapTx = Math.floor(fallTrap.x / this.TILE_SIZE);
                const mapTy = Math.floor(fallTrap.y / this.TILE_SIZE);
                if (this.map[mapTy] && this.map[mapTy][mapTx]) {
                    this.map[mapTy][mapTx] = '.';
                }
            }, 500);
        }
    }
    
    updateEnemies() {
        this.enemies.forEach(enemy => {
            if (!enemy.active) return;
            
            // 隐藏敌人检测
            if (enemy.hidden) {
                const dist = Math.abs(this.player.x - enemy.x);
                if (dist < 100) {
                    enemy.hidden = false;
                }
                return;
            }
            
            // 移动
            enemy.x += enemy.vx;
            
            // 简单AI：撞墙反弹
            const tx = Math.floor((enemy.x + enemy.width / 2) / this.TILE_SIZE);
            const ty = Math.floor((enemy.y + enemy.height) / this.TILE_SIZE);
            
            if (this.isSolid(tx + Math.sign(enemy.vx), ty)) {
                enemy.vx = -enemy.vx;
            }
            
            // 幽灵上下浮动
            if (enemy.config.float) {
                enemy.y += Math.sin(Date.now() / 200) * 0.5;
            }
            
            // 碰撞玩家
            if (this.checkCollision(this.player, enemy)) {
                this.die(enemy.type);
            }
        });
    }
    
    checkTraps() {
        const px = this.player.x + this.player.width / 2;
        const py = this.player.y + this.player.height / 2;
        
        this.traps.forEach(trap => {
            if (!trap.active) return;
            
            const dist = Math.sqrt((px - trap.x) ** 2 + (py - trap.y) ** 2);
            
            // 隐藏尖刺
            if (trap.type === 'h_spike' && !trap.triggered && dist < 150) {
                trap.triggered = true;
                this.die('spike');
            }
            
            // 隐藏敌人
            if (trap.type === 'h_enemy' && !trap.triggered && dist < 100) {
                trap.triggered = true;
                const enemyType = trap.param || 'ghost';
                const config = EnemyTypes[enemyType.toUpperCase()] || EnemyTypes.GHOST;
                this.enemies.push({
                    x: trap.x,
                    y: trap.y,
                    vx: config.speed * config.dir,
                    vy: 0,
                    width: 30,
                    height: 30,
                    type: enemyType,
                    config: config,
                    active: true,
                    hidden: false,
                });
            }
            
            // 掉落物
            if (trap.type === 'falling' && !trap.triggered) {
                if (Math.abs(this.player.x - trap.x) < 50 && this.player.y > trap.y) {
                    trap.triggered = true;
                    trap.falling = true;
                    trap.vy = 0;
                }
            }
            
            // 更新掉落物
            if (trap.falling) {
                trap.vy += 0.5;
                trap.y += trap.vy;
                
                // 碰撞检测
                const trapRect = { x: trap.x - 15, y: trap.y - 15, width: 30, height: 30 };
                if (this.checkCollision(this.player, trapRect)) {
                    if (trap.param === 'block') {
                        this.die('block');
                    } else {
                        const enemyType = trap.param || 'doge';
                        this.die(enemyType);
                    }
                }
            }
            
            // 射击器
            if (trap.type === 'shooter') {
                trap.timer++;
                if (trap.timer >= 120) {
                    trap.timer = 0;
                    // 发射子弹
                    this.enemies.push({
                        x: trap.x,
                        y: trap.y,
                        vx: trap.param === 'left' ? -6 : 6,
                        vy: 0,
                        width: 20,
                        height: 20,
                        type: 'fire',
                        config: EnemyTypes.FIRE,
                        active: true,
                    });
                }
            }
            
            // 爆炸砖块
            if (trap.type === 'explode' && !trap.triggered && dist < 50) {
                trap.triggered = true;
                this.screenShake = 20;
                
                // 创建爆炸粒子
                for (let i = 0; i < 15; i++) {
                    this.particles.push({
                        x: trap.x + this.TILE_SIZE / 2,
                        y: trap.y + this.TILE_SIZE / 2,
                        vx: (Math.random() - 0.5) * 10,
                        vy: (Math.random() - 0.5) * 10,
                        emoji: '💥',
                        life: 30,
                    });
                }
                
                // 移除砖块
                const mapTx = Math.floor(trap.x / this.TILE_SIZE);
                const mapTy = Math.floor(trap.y / this.TILE_SIZE);
                if (this.map[mapTy] && this.map[mapTy][mapTx]) {
                    this.map[mapTy][mapTx] = '.';
                }
                
                // 检查玩家是否在爆炸范围内
                if (dist < 60) {
                    this.die('explosion');
                }
                
                trap.active = false;
            }
            
            // 假砖块
            if (trap.type === 'fake' && !trap.triggered) {
                if (this.player.x < trap.x + this.TILE_SIZE &&
                    this.player.x + this.player.width > trap.x &&
                    this.player.y + this.player.height >= trap.y &&
                    this.player.y + this.player.height <= trap.y + 10) {
                    trap.triggered = true;
                    trap.falling = true;
                    trap.vy = 0;
                    setTimeout(() => {
                        const mapTx = Math.floor(trap.x / this.TILE_SIZE);
                        const mapTy = Math.floor(trap.y / this.TILE_SIZE);
                        if (this.map[mapTy] && this.map[mapTy][mapTx]) {
                            this.map[mapTy][mapTx] = '.';
                        }
                    }, 300);
                }
            }
        });
    }
    
    checkCoins() {
        const tileX = Math.floor((this.player.x + this.player.width / 2) / this.TILE_SIZE);
        const tileY = Math.floor((this.player.y + this.player.height / 2) / this.TILE_SIZE);
        
        if (tileY >= 0 && tileY < this.map.length && tileX >= 0 && tileX < this.map[tileY].length) {
            if (this.map[tileY][tileX] === '3') {
                this.map[tileY][tileX] = '.';
                this.coins++;
                this.playSound('coin');
                document.getElementById('coin-count').textContent = this.coins;
                
                // 金币粒子
                for (let i = 0; i < 5; i++) {
                    this.particles.push({
                        x: tileX * this.TILE_SIZE + this.TILE_SIZE / 2,
                        y: tileY * this.TILE_SIZE + this.TILE_SIZE / 2,
                        vx: (Math.random() - 0.5) * 5,
                        vy: -Math.random() * 5,
                        emoji: '⭐',
                        life: 30,
                    });
                }
            }
        }
        
        // 假金币
        this.fakeCoins.forEach(coin => {
            if (coin.collected) return;
            
            const coinRect = { x: coin.x, y: coin.y, width: 20, height: 20 };
            if (this.checkCollision(this.player, coinRect)) {
                coin.collected = true;
                this.die('coin');
            }
        });
    }
    
    checkGoal() {
        const tileX = Math.floor((this.player.x + this.player.width / 2) / this.TILE_SIZE);
        const tileY = Math.floor((this.player.y + this.player.height / 2) / this.TILE_SIZE);
        
        if (tileY >= 0 && tileY < this.map.length && tileX >= 0 && tileX < this.map[tileY].length) {
            if (this.map[tileY][tileX] === '4') {
                this.win();
            }
        }
    }
    
    checkCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }
    
    updateParticles() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx || 0;
            p.y += p.vy || 0;
            p.vy = (p.vy || 0) + 0.2;
            p.life--;
            return p.life > 0;
        });
    }
    
    render() {
        const ctx = this.ctx;
        
        // 清屏
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 应用屏幕震动
        ctx.save();
        if (this.screenShake > 0.5) {
            ctx.translate(
                (Math.random() - 0.5) * this.screenShake,
                (Math.random() - 0.5) * this.screenShake
            );
        }
        
        // 绘制背景
        this.renderBackground();
        
        // 绘制地图
        this.renderMap();
        
        // 绘制陷阱（可见的）
        this.renderTraps();
        
        // 绘制假金币
        this.renderFakeCoins();
        
        // 绘制敌人
        this.renderEnemies();
        
        // 绘制玩家
        if (this.state === 'playing') {
            this.renderPlayer();
        }
        
        // 绘制粒子
        this.renderParticles();
        
        ctx.restore();
    }
    
    renderBackground() {
        const ctx = this.ctx;
        
        // 简单背景装饰
        ctx.fillStyle = '#16213e';
        for (let i = 0; i < 50; i++) {
            const x = (i * 100 - this.cameraX * 0.3) % (this.canvas.width + 100);
            const y = 50 + Math.sin(i) * 30;
            ctx.font = '20px Arial';
            ctx.fillText(['⭐', '✨', '🌟', '💫'][i % 4], x, y);
        }
    }
    
    renderMap() {
        const ctx = this.ctx;
        
        const startX = Math.floor(this.cameraX / this.TILE_SIZE);
        const endX = startX + Math.ceil(this.canvas.width / this.TILE_SIZE) + 1;
        
        for (let ty = 0; ty < this.map.length; ty++) {
            for (let tx = startX; tx < endX && tx < this.map[ty].length; tx++) {
                if (tx < 0) continue;
                
                const cell = this.map[ty][tx];
                const screenX = tx * this.TILE_SIZE - this.cameraX;
                const screenY = ty * this.TILE_SIZE;
                
                if (cell === '1' || cell === 'G') {
                    // 砖块
                    ctx.fillStyle = '#4a4a6a';
                    ctx.fillRect(screenX, screenY, this.TILE_SIZE, this.TILE_SIZE);
                    ctx.strokeStyle = '#6a6a8a';
                    ctx.strokeRect(screenX, screenY, this.TILE_SIZE, this.TILE_SIZE);
                    
                    // 砖块纹理
                    ctx.fillStyle = '#5a5a7a';
                    ctx.fillRect(screenX + 2, screenY + 2, this.TILE_SIZE - 4, this.TILE_SIZE - 4);
                } else if (cell === '2') {
                    // 问号砖
                    ctx.fillStyle = '#f39c12';
                    ctx.fillRect(screenX, screenY, this.TILE_SIZE, this.TILE_SIZE);
                    ctx.font = '24px Arial';
                    ctx.fillStyle = 'white';
                    ctx.fillText('?', screenX + 12, screenY + 26);
                } else if (cell === '3') {
                    // 金币
                    ctx.font = '24px Arial';
                    ctx.fillText('⭐', screenX + 6, screenY + 28);
                } else if (cell === '4') {
                    // 终点旗帜
                    ctx.font = '30px Arial';
                    ctx.fillText('🚩', screenX + 3, screenY + 32);
                }
            }
        }
    }
    
    renderTraps() {
        const ctx = this.ctx;
        
        this.traps.forEach(trap => {
            const screenX = trap.x - this.cameraX;
            const screenY = trap.y;
            
            // 只渲染可见/触发的陷阱
            if (trap.type === 'h_spike' && trap.triggered) {
                ctx.font = '24px Arial';
                ctx.fillText('⚠️', screenX + 6, screenY + 28);
            }
            
            if (trap.falling) {
                ctx.font = '28px Arial';
                const emoji = trap.param === 'block' ? '🧱' : 
                              trap.param === 'doge' ? '🐕' :
                              trap.param === 'pepe' ? '🐸' :
                              trap.param === 'clown' ? '🤡' : '💀';
                ctx.fillText(emoji, screenX, screenY + 28);
            }
        });
    }
    
    renderFakeCoins() {
        const ctx = this.ctx;
        
        this.fakeCoins.forEach(coin => {
            if (coin.collected) return;
            
            const screenX = coin.x - this.cameraX;
            ctx.font = '24px Arial';
            ctx.fillText('⭐', screenX, coin.y + 24);
        });
    }
    
    renderEnemies() {
        const ctx = this.ctx;
        
        this.enemies.forEach(enemy => {
            if (!enemy.active || enemy.hidden) return;
            
            const screenX = enemy.x - this.cameraX;
            ctx.font = '28px Arial';
            ctx.fillText(enemy.config.emoji, screenX, enemy.y + 28);
        });
    }
    
    renderPlayer() {
        const ctx = this.ctx;
        
        const screenX = this.player.x - this.cameraX;
        
        ctx.save();
        
        // 翻转
        if (!this.player.facingRight) {
            ctx.translate(screenX + this.player.width, 0);
            ctx.scale(-1, 1);
            screenX = 0;
        }
        
        // 反向控制效果
        if (this.reverseControls) {
            ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 100) * 0.3;
        }
        
        ctx.font = '32px Arial';
        ctx.fillText(this.player.emoji, screenX, this.player.y + 30);
        
        ctx.restore();
    }
    
    renderParticles() {
        const ctx = this.ctx;
        
        this.particles.forEach(p => {
            const screenX = p.x - this.cameraX;
            ctx.font = '20px Arial';
            ctx.globalAlpha = p.life / 60;
            ctx.fillText(p.emoji, screenX, p.y);
            ctx.globalAlpha = 1;
        });
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
    window.game.keys = {};
});
