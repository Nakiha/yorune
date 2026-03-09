// 🎮 Emoji vs Meme - 梗图大冒险
// 主游戏逻辑

// ==================== 像素素材绘制器 ====================
const PixelArt = {
    // 绘制砖块
    drawBrick(ctx, x, y, size, type = 'normal') {
        ctx.save();
        
        if (type === 'normal') {
            // 普通砖块
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x, y, size, size);
            
            // 砖块纹理
            ctx.fillStyle = '#A0522D';
            ctx.fillRect(x + 2, y + 2, size/2 - 3, size/2 - 3);
            ctx.fillRect(x + size/2 + 1, y + 2, size/2 - 3, size/2 - 3);
            ctx.fillRect(x + 2, y + size/2 + 1, size - 4, size/2 - 3);
            
            // 边框
            ctx.strokeStyle = '#5D3A1A';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, size, size);
        } 
        else if (type === 'ground') {
            // 地面砖块
            ctx.fillStyle = '#4a6741';
            ctx.fillRect(x, y, size, size);
            
            // 草地顶部
            ctx.fillStyle = '#7CBA5F';
            ctx.fillRect(x, y, size, 8);
            
            // 纹理
            ctx.fillStyle = '#3d5636';
            ctx.fillRect(x + 5, y + 12, 6, 6);
            ctx.fillRect(x + 20, y + 20, 8, 8);
        }
        else if (type === 'question') {
            // 问号砖块
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(x, y, size, size);
            
            // 3D效果
            ctx.fillStyle = '#FFA500';
            ctx.fillRect(x, y + size - 4, size, 4);
            ctx.fillRect(x + size - 4, y, 4, size);
            
            ctx.fillStyle = '#FFEC8B';
            ctx.fillRect(x, y, size, 4);
            ctx.fillRect(x, y, 4, size);
            
            // 问号
            ctx.fillStyle = '#8B4513';
            ctx.font = `bold ${size - 10}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', x + size/2, y + size/2);
        }
        
        ctx.restore();
    },
    
    // 绘制尖刺
    drawSpike(ctx, x, y, size) {
        ctx.save();
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.moveTo(x, y + size);
        ctx.lineTo(x + size/2, y);
        ctx.lineTo(x + size, y + size);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.moveTo(x + size/4, y + size);
        ctx.lineTo(x + size/2, y + size/3);
        ctx.lineTo(x + size/2, y + size);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    },
    
    // 绘制金币/星星
    drawStar(ctx, x, y, size) {
        ctx.save();
        ctx.font = `${size - 8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐', x + size/2, y + size/2);
        ctx.restore();
    },
    
    // 绘制终点旗帜
    drawFlag(ctx, x, y, size) {
        ctx.save();
        // 旗杆
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + size/2 - 3, y, 6, size);
        
        // 旗帜
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.moveTo(x + size/2 + 3, y + 5);
        ctx.lineTo(x + size - 2, y + size/4);
        ctx.lineTo(x + size/2 + 3, y + size/2 - 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    },
    
    // 绘制云朵
    drawCloud(ctx, x, y, scale = 1) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(x, y, 20 * scale, 0, Math.PI * 2);
        ctx.arc(x + 25 * scale, y - 10 * scale, 25 * scale, 0, Math.PI * 2);
        ctx.arc(x + 50 * scale, y, 20 * scale, 0, Math.PI * 2);
        ctx.arc(x + 25 * scale, y + 5 * scale, 15 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },
    
    // 绘制背景山
    drawMountain(ctx, x, y, width, height) {
        ctx.save();
        ctx.fillStyle = '#2d5a3d';
        ctx.beginPath();
        ctx.moveTo(x, y + height);
        ctx.lineTo(x + width/2, y);
        ctx.lineTo(x + width, y + height);
        ctx.closePath();
        ctx.fill();
        
        // 雪顶
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(x + width/2 - 15, y + 20);
        ctx.lineTo(x + width/2, y);
        ctx.lineTo(x + width/2 + 15, y + 20);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
};

// ==================== 主游戏类 ====================
class Game {
    constructor() {
        // Canvas设置
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 游戏常量
        this.TILE_SIZE = 40;
        this.GRAVITY = 0.5;
        this.JUMP_FORCE = -11;
        this.MOVE_SPEED = 4;
        
        // 游戏状态
        this.state = 'start';
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
        
        // 反向控制
        this.reverseControls = false;
        this.reverseTimer = 0;
        
        // 输入
        this.keys = {};
        
        // 音效
        this.audioCtx = null;
        
        // 初始化
        this.initUI();
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
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'KeyR' && this.state === 'dead') {
                this.retry();
            }
            if ((e.code === 'Space' || e.code === 'Enter') && this.state === 'start') {
                e.preventDefault();
                this.startGame();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    initAudio() {
        if (!this.audioCtx) {
            try {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {}
        }
    }
    
    playSound(type) {
        this.initAudio();
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
            gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + s.dur);
            osc.start();
            osc.stop(this.audioCtx.currentTime + s.dur);
        } catch (e) {}
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
        if (!LevelData[key]) {
            console.error('Level not found:', key);
            return;
        }
        
        this.levelData = LevelData[key];
        this.map = parseMapString(this.levelData.map);
        
        // 计算星星数量
        this.totalCoins = 0;
        for (let row of this.map) {
            for (let cell of row) {
                if (cell === '3') this.totalCoins++;
            }
        }
        
        // 初始化玩家
        this.player = {
            x: 3 * this.TILE_SIZE,
            y: 8 * this.TILE_SIZE,
            vx: 0,
            vy: 0,
            width: 28,
            height: 32,
            onGround: false,
            emoji: this.selectedChar,
            facingRight: true,
        };
        
        // 初始化敌人
        this.enemies = (this.levelData.enemies || []).map(e => {
            const type = EnemyTypes[e[0]] || EnemyTypes.doge;
            return {
                x: e[1] * this.TILE_SIZE,
                y: e[2] * this.TILE_SIZE - this.TILE_SIZE,
                vx: type.speed * type.dir,
                vy: 0,
                width: 32,
                height: 32,
                type: e[0],
                config: type,
                active: true,
                hidden: false,
            };
        });
        
        // 初始化陷阱
        this.traps = (this.levelData.traps || []).map(t => ({
            type: t[0],
            x: t[1] * this.TILE_SIZE,
            y: t[2] * this.TILE_SIZE,
            param: t[3],
            triggered: false,
            active: true,
            timer: 0,
            falling: false,
            vy: 0,
        }));
        
        // 假金币
        this.fakeCoins = (this.levelData.fakeCoins || []).map(c => ({
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
            this.showHint('🎉 恭喜通关！你是真正的梗王！');
            setTimeout(() => location.reload(), 3000);
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
        
        const messages = DeathMessages[reason] || DeathMessages.default;
        const msg = messages[Math.floor(Math.random() * messages.length)];
        
        this.playSound('death');
        
        // 死亡粒子
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                emoji: ['💀', '💥', '⭐'][Math.floor(Math.random() * 3)],
                life: 50,
            });
        }
        
        setTimeout(() => {
            document.getElementById('death-reason').textContent = msg;
            document.getElementById('death-num').textContent = this.deaths;
            document.getElementById('death-screen').classList.add('show');
        }, 400);
    }
    
    win() {
        if (this.state !== 'playing') return;
        
        this.state = 'win';
        this.playSound('win');
        
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y,
                vx: (Math.random() - 0.5) * 6,
                vy: -Math.random() * 8,
                emoji: ['🎉', '🎊', '⭐', '✨'][Math.floor(Math.random() * 4)],
                life: 80,
            });
        }
        
        setTimeout(() => {
            document.getElementById('final-deaths').textContent = this.deaths;
            document.getElementById('final-coins').textContent = this.coins;
            document.getElementById('win-screen').classList.add('show');
        }, 400);
    }
    
    gameLoop() {
        if (this.state === 'playing') {
            this.update();
        }
        
        this.updateParticles();
        this.render();
        
        if (this.state === 'playing' || this.particles.length > 0) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
    
    update() {
        // 反向控制计时器
        if (this.reverseTimer > 0) {
            this.reverseTimer--;
            if (this.reverseTimer <= 0) {
                this.reverseControls = false;
            }
        }
        
        // 输入处理
        let moveLeft = this.keys['ArrowLeft'] || this.keys['KeyA'];
        let moveRight = this.keys['ArrowRight'] || this.keys['KeyD'];
        let jump = this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW'];
        
        if (this.reverseControls) {
            [moveLeft, moveRight] = [moveRight, moveLeft];
        }
        
        // 移动
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
            
            // 检查反向跳跃砖
            const playerTileX = Math.floor((this.player.x + this.player.width/2) / this.TILE_SIZE);
            const playerTileY = Math.floor((this.player.y + this.player.height) / this.TILE_SIZE);
            
            const onReverse = this.traps.some(t => 
                t.type === 'reverse' && t.active &&
                Math.floor(t.x / this.TILE_SIZE) === playerTileX &&
                Math.floor(t.y / this.TILE_SIZE) === playerTileY
            );
            
            if (onReverse) jumpForce = -jumpForce;
            
            this.player.vy = jumpForce;
            this.player.onGround = false;
            this.playSound('jump');
        }
        
        // 重力
        this.player.vy += this.GRAVITY;
        this.player.vy = Math.min(this.player.vy, 12);
        
        // 移动和碰撞
        this.player.x += this.player.vx;
        this.handleCollisionX();
        
        this.player.y += this.player.vy;
        this.handleCollisionY();
        
        // 掉落
        if (this.player.y > this.canvas.height + 50) {
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
        
        // 相机
        this.cameraX = this.player.x - this.canvas.width / 3;
        this.cameraX = Math.max(0, this.cameraX);
        
        // 屏幕震动
        if (this.screenShake > 0) this.screenShake *= 0.9;
    }
    
    // 马里奥风格的碰撞检测 - X轴
    handleCollisionX() {
        const player = this.player;
        const tileSize = this.TILE_SIZE;
        
        // 计算玩家当前占据的瓦片范围
        const leftTile = Math.floor(player.x / tileSize);
        const rightTile = Math.floor((player.x + player.width - 1) / tileSize);
        const topTile = Math.floor(player.y / tileSize);
        const bottomTile = Math.floor((player.y + player.height - 1) / tileSize);
        
        // 只在移动时检测
        if (player.vx === 0) return;
        
        for (let ty = topTile; ty <= bottomTile; ty++) {
            for (let tx = leftTile; tx <= rightTile; tx++) {
                if (this.isSolid(tx, ty)) {
                    const tileLeft = tx * tileSize;
                    const tileRight = tileLeft + tileSize;
                    
                    if (player.vx > 0) {
                        // 向右移动，检测右侧碰撞
                        const overlap = (player.x + player.width) - tileLeft;
                        if (overlap > 0 && overlap < tileSize) {
                            player.x = tileLeft - player.width;
                            player.vx = 0;
                        }
                    } else if (player.vx < 0) {
                        // 向左移动，检测左侧碰撞
                        const overlap = tileRight - player.x;
                        if (overlap > 0 && overlap < tileSize) {
                            player.x = tileRight;
                            player.vx = 0;
                        }
                    }
                }
            }
        }
    }
    
    // 马里奥风格的碰撞检测 - Y轴
    handleCollisionY() {
        const player = this.player;
        const tileSize = this.TILE_SIZE;
        
        // 计算玩家当前占据的瓦片范围
        const leftTile = Math.floor(player.x / tileSize);
        const rightTile = Math.floor((player.x + player.width - 1) / tileSize);
        const topTile = Math.floor(player.y / tileSize);
        const bottomTile = Math.floor((player.y + player.height - 1) / tileSize);
        
        player.onGround = false;
        
        for (let ty = topTile; ty <= bottomTile; ty++) {
            for (let tx = leftTile; tx <= rightTile; tx++) {
                if (this.isSolid(tx, ty)) {
                    const tileTop = ty * tileSize;
                    const tileBottom = tileTop + tileSize;
                    
                    if (player.vy > 0) {
                        // 下落，检测底部碰撞
                        const overlap = (player.y + player.height) - tileTop;
                        if (overlap > 0 && overlap < tileSize * 0.7) {
                            player.y = tileTop - player.height;
                            player.vy = 0;
                            player.onGround = true;
                            this.checkSpecialTile(tx, ty);
                        }
                    } else if (player.vy < 0) {
                        // 上升，检测顶部碰撞
                        const overlap = tileBottom - player.y;
                        if (overlap > 0 && overlap < tileSize * 0.7) {
                            player.y = tileBottom;
                            player.vy = 0;
                        }
                    }
                }
            }
        }
        
        // 额外的地面检测 - 从玩家脚下发射射线
        if (!player.onGround && player.vy >= 0) {
            const footY = player.y + player.height;
            const checkPoints = [
                player.x + 4,
                player.x + player.width / 2,
                player.x + player.width - 4
            ];
            
            for (let px of checkPoints) {
                const tileX = Math.floor(px / tileSize);
                const tileY = Math.floor(footY / tileSize);
                
                if (this.isSolid(tileX, tileY)) {
                    const tileTop = tileY * tileSize;
                    if (footY >= tileTop && footY <= tileTop + 8) {
                        player.y = tileTop - player.height;
                        player.vy = 0;
                        player.onGround = true;
                        this.checkSpecialTile(tileX, tileY);
                        break;
                    }
                }
            }
        }
    }
    
    isSolid(tx, ty) {
        if (ty < 0 || ty >= this.map.length) return false;
        if (tx < 0 || tx >= this.map[ty].length) return true;
        
        const cell = this.map[ty][tx];
        return cell === '1' || cell === 'G';
    }
    
    checkSpecialTile(tx, ty) {
        const worldX = tx * this.TILE_SIZE;
        const worldY = ty * this.TILE_SIZE;
        
        // 检查陷阱
        this.traps.forEach(trap => {
            if (!trap.active || trap.x !== worldX || trap.y !== worldY) return;
            
            if (!trap.triggered) {
                if (trap.type === 'trap_q') {
                    trap.triggered = true;
                    this.enemies.push({
                        x: trap.x,
                        y: trap.y - this.TILE_SIZE,
                        vx: 3,
                        vy: 0,
                        width: 32,
                        height: 32,
                        type: 'skull',
                        config: EnemyTypes.skull,
                        active: true,
                    });
                    setTimeout(() => this.die('question'), 100);
                }
                else if (trap.type === 'death_q') {
                    trap.triggered = true;
                    this.die('question');
                }
                else if (trap.type === 'poison_q') {
                    trap.triggered = true;
                    this.reverseControls = true;
                    this.reverseTimer = 180;
                    this.showHint('😵 反向控制！左右颠倒！');
                }
                else if (trap.type === 'bounce') {
                    this.player.vy = this.JUMP_FORCE * 2;
                    this.player.onGround = false;
                }
                else if (trap.type === 'fall') {
                    trap.triggered = true;
                    setTimeout(() => {
                        if (this.map[ty] && this.map[ty][tx] === '1') {
                            this.map[ty][tx] = '.';
                        }
                    }, 300);
                }
            }
        });
    }
    
    updateEnemies() {
        this.enemies.forEach(enemy => {
            if (!enemy.active) return;
            
            if (enemy.hidden) {
                const dist = Math.abs(this.player.x - enemy.x);
                if (dist < 80) {
                    enemy.hidden = false;
                }
                return;
            }
            
            enemy.x += enemy.vx;
            
            const tx = Math.floor((enemy.x + enemy.width / 2) / this.TILE_SIZE);
            const ty = Math.floor((enemy.y + enemy.height) / this.TILE_SIZE);
            
            if (this.isSolid(tx + Math.sign(enemy.vx), ty)) {
                enemy.vx = -enemy.vx;
            }
            
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
            
            const dist = Math.sqrt((px - trap.x - this.TILE_SIZE/2) ** 2 + (py - trap.y - this.TILE_SIZE/2) ** 2);
            
            // 隐藏尖刺 - 用精确碰撞检测，不是距离
            if (trap.type === 'h_spike' && !trap.triggered) {
                // 触发距离（玩家接近时显示）
                if (dist < 100) {
                    trap.triggered = true;
                }
            }
            // 已触发的尖刺检测碰撞
            if (trap.type === 'h_spike' && trap.triggered) {
                const spikeRect = { 
                    x: trap.x + 8, 
                    y: trap.y + 15, 
                    width: this.TILE_SIZE - 16, 
                    height: this.TILE_SIZE - 15 
                };
                if (this.checkCollision(this.player, spikeRect)) {
                    this.die('spike');
                }
            }
            
            // 隐藏敌人
            if (trap.type === 'h_enemy' && !trap.triggered && dist < 80) {
                trap.triggered = true;
                const enemyType = trap.param || 'ghost';
                const config = EnemyTypes[enemyType] || EnemyTypes.ghost;
                this.enemies.push({
                    x: trap.x,
                    y: trap.y - this.TILE_SIZE,
                    vx: config.speed * config.dir,
                    vy: 0,
                    width: 32,
                    height: 32,
                    type: enemyType,
                    config: config,
                    active: true,
                });
            }
            
            // 掉落物
            if (trap.type === 'falling' && !trap.triggered && !trap.falling) {
                if (Math.abs(this.player.x - trap.x) < 40 && this.player.y > trap.y) {
                    trap.triggered = true;
                    trap.falling = true;
                    trap.vy = 0;
                }
            }
            
            // 更新掉落物
            if (trap.falling) {
                trap.vy += 0.5;
                trap.y += trap.vy;
                
                const trapRect = { x: trap.x - 15, y: trap.y - 15, width: 30, height: 30 };
                if (this.checkCollision(this.player, trapRect)) {
                    this.die(trap.param === 'block' ? 'block' : trap.param || 'falling');
                }
            }
            
            // 射击器
            if (trap.type === 'shooter') {
                trap.timer = (trap.timer || 0) + 1;
                if (trap.timer >= 90) {
                    trap.timer = 0;
                    this.enemies.push({
                        x: trap.x,
                        y: trap.y,
                        vx: trap.param === 'left' ? -5 : 5,
                        vy: 0,
                        width: 24,
                        height: 24,
                        type: 'fire',
                        config: EnemyTypes.fire,
                        active: true,
                    });
                }
            }
            
            // 爆炸砖块
            if (trap.type === 'explode' && !trap.triggered && dist < 50) {
                trap.triggered = true;
                this.screenShake = 15;
                
                for (let i = 0; i < 10; i++) {
                    this.particles.push({
                        x: trap.x + this.TILE_SIZE / 2,
                        y: trap.y + this.TILE_SIZE / 2,
                        vx: (Math.random() - 0.5) * 8,
                        vy: (Math.random() - 0.5) * 8,
                        emoji: '💥',
                        life: 25,
                    });
                }
                
                const mapTx = Math.floor(trap.x / this.TILE_SIZE);
                const mapTy = Math.floor(trap.y / this.TILE_SIZE);
                if (this.map[mapTy] && this.map[mapTy][mapTx]) {
                    this.map[mapTy][mapTx] = '.';
                }
                
                if (dist < 50) {
                    this.die('explosion');
                }
                
                trap.active = false;
            }
            
            // 假砖块
            if (trap.type === 'fake' && !trap.triggered) {
                if (this.player.x < trap.x + this.TILE_SIZE &&
                    this.player.x + this.player.width > trap.x &&
                    this.player.y + this.player.height >= trap.y &&
                    this.player.y + this.player.height <= trap.y + 8) {
                    trap.triggered = true;
                    setTimeout(() => {
                        const mapTx = Math.floor(trap.x / this.TILE_SIZE);
                        const mapTy = Math.floor(trap.y / this.TILE_SIZE);
                        if (this.map[mapTy] && this.map[mapTy][mapTx] === '1') {
                            this.map[mapTy][mapTx] = '.';
                        }
                    }, 200);
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
                
                for (let i = 0; i < 5; i++) {
                    this.particles.push({
                        x: tileX * this.TILE_SIZE + this.TILE_SIZE / 2,
                        y: tileY * this.TILE_SIZE + this.TILE_SIZE / 2,
                        vx: (Math.random() - 0.5) * 4,
                        vy: -Math.random() * 4,
                        emoji: '⭐',
                        life: 25,
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
        
        // 清屏 - 天空渐变
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.6, '#98D8E8');
        gradient.addColorStop(1, '#B0E0E6');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        ctx.save();
        
        // 屏幕震动
        if (this.screenShake > 0.5) {
            ctx.translate(
                (Math.random() - 0.5) * this.screenShake,
                (Math.random() - 0.5) * this.screenShake
            );
        }
        
        // 背景装饰
        this.renderBackground();
        
        // 地图
        this.renderMap();
        
        // 陷阱
        this.renderTraps();
        
        // 假金币
        this.renderFakeCoins();
        
        // 敌人
        this.renderEnemies();
        
        // 玩家
        if (this.state === 'playing') {
            this.renderPlayer();
        }
        
        // 粒子
        this.renderParticles();
        
        ctx.restore();
    }
    
    renderBackground() {
        const ctx = this.ctx;
        
        // 云朵
        PixelArt.drawCloud(ctx, 100 - this.cameraX * 0.1, 80, 1);
        PixelArt.drawCloud(ctx, 300 - this.cameraX * 0.15, 120, 0.8);
        PixelArt.drawCloud(ctx, 500 - this.cameraX * 0.1, 60, 1.2);
        PixelArt.drawCloud(ctx, 700 - this.cameraX * 0.12, 100, 0.9);
        PixelArt.drawCloud(ctx, 900 - this.cameraX * 0.1, 70, 1.1);
    }
    
    renderMap() {
        const ctx = this.ctx;
        
        const startX = Math.max(0, Math.floor(this.cameraX / this.TILE_SIZE));
        const endX = Math.min(this.map[0]?.length || 0, startX + Math.ceil(this.canvas.width / this.TILE_SIZE) + 2);
        
        for (let ty = 0; ty < this.map.length; ty++) {
            for (let tx = startX; tx < endX; tx++) {
                if (tx >= this.map[ty].length) continue;
                
                const cell = this.map[ty][tx];
                const screenX = tx * this.TILE_SIZE - this.cameraX;
                const screenY = ty * this.TILE_SIZE;
                
                if (cell === '1') {
                    PixelArt.drawBrick(ctx, screenX, screenY, this.TILE_SIZE, 'normal');
                } else if (cell === 'G') {
                    PixelArt.drawBrick(ctx, screenX, screenY, this.TILE_SIZE, 'ground');
                } else if (cell === '2') {
                    PixelArt.drawBrick(ctx, screenX, screenY, this.TILE_SIZE, 'question');
                } else if (cell === '3') {
                    PixelArt.drawStar(ctx, screenX, screenY, this.TILE_SIZE);
                } else if (cell === '4') {
                    PixelArt.drawFlag(ctx, screenX, screenY, this.TILE_SIZE);
                }
            }
        }
    }
    
    renderTraps() {
        const ctx = this.ctx;
        
        this.traps.forEach(trap => {
            const screenX = trap.x - this.cameraX;
            const screenY = trap.y;
            
            if (screenX < -50 || screenX > this.canvas.width + 50) return;
            
            // 隐藏尖刺显示
            if (trap.type === 'h_spike' && trap.triggered) {
                PixelArt.drawSpike(ctx, screenX, screenY, this.TILE_SIZE);
            }
            
            // 掉落物
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
            if (screenX < -20 || screenX > this.canvas.width + 20) return;
            
            ctx.font = '24px Arial';
            ctx.fillText('⭐', screenX, coin.y + 24);
        });
    }
    
    renderEnemies() {
        const ctx = this.ctx;
        
        this.enemies.forEach(enemy => {
            if (!enemy.active || enemy.hidden) return;
            
            const screenX = enemy.x - this.cameraX;
            if (screenX < -40 || screenX > this.canvas.width + 40) return;
            
            ctx.font = '28px Arial';
            ctx.fillText(enemy.config.emoji, screenX, enemy.y + 28);
        });
    }
    
    renderPlayer() {
        const ctx = this.ctx;
        
        const screenX = this.player.x - this.cameraX;
        
        ctx.save();
        
        if (!this.player.facingRight) {
            ctx.translate(screenX + this.player.width, 0);
            ctx.scale(-1, 1);
            ctx.font = '32px Arial';
            ctx.fillText(this.player.emoji, 0, this.player.y + 30);
        } else {
            ctx.font = '32px Arial';
            ctx.fillText(this.player.emoji, screenX, this.player.y + 30);
        }
        
        // 反向控制效果
        if (this.reverseControls) {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.3;
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(screenX, this.player.y - 10, this.player.width, 5);
        }
        
        ctx.restore();
    }
    
    renderParticles() {
        const ctx = this.ctx;
        
        this.particles.forEach(p => {
            const screenX = p.x - this.cameraX;
            ctx.font = '20px Arial';
            ctx.globalAlpha = p.life / 50;
            ctx.fillText(p.emoji, screenX, p.y);
            ctx.globalAlpha = 1;
        });
    }
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
