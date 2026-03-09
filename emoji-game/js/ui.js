// 🎨 UI系统

class UI {
    constructor() {
        // HUD元素
        this.healthFill = document.getElementById('health-fill');
        this.healthText = document.getElementById('health-text');
        this.energyFill = document.getElementById('energy-fill');
        this.waveNum = document.getElementById('wave-num');
        this.enemyCount = document.getElementById('enemy-count');
        this.scoreNum = document.getElementById('score-num');
        this.currentWeapon = document.getElementById('current-weapon');
        this.comboNum = document.getElementById('combo-num');
        
        // 屏幕元素
        this.startScreen = document.getElementById('start-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.pauseScreen = document.getElementById('pause-screen');
        this.gameoverScreen = document.getElementById('gameover-screen');
        this.victoryScreen = document.getElementById('victory-screen');
        
        // 消息队列
        this.messages = [];
        this.messageElement = null;
    }
    
    // 更新HUD
    updateHUD(player, wave, enemyCount) {
        // 血量
        const healthPercent = (player.health / player.maxHealth) * 100;
        this.healthFill.style.width = healthPercent + '%';
        this.healthText.textContent = `${Math.floor(player.health)}/${player.maxHealth}`;
        
        // 根据血量改变颜色
        if (healthPercent < 25) {
            this.healthFill.style.background = 'linear-gradient(90deg, #c0392b, #e74c3c)';
        } else if (healthPercent < 50) {
            this.healthFill.style.background = 'linear-gradient(90deg, #d35400, #e67e22)';
        } else {
            this.healthFill.style.background = 'linear-gradient(90deg, #e74c3c, #ff6b6b)';
        }
        
        // 能量
        const energyPercent = (player.energy / player.maxEnergy) * 100;
        this.energyFill.style.width = energyPercent + '%';
        
        // 波次和敌人
        this.waveNum.textContent = wave;
        this.enemyCount.textContent = enemyCount;
        
        // 分数
        this.scoreNum.textContent = player.score.toLocaleString();
        
        // 武器
        this.currentWeapon.textContent = player.currentWeapon;
        
        // 连击
        this.comboNum.textContent = player.combo;
        if (player.combo >= 5) {
            this.comboNum.style.color = '#ff6b6b';
            this.comboNum.style.fontSize = '20px';
        } else if (player.combo >= 3) {
            this.comboNum.style.color = '#ffe66d';
            this.comboNum.style.fontSize = '16px';
        } else {
            this.comboNum.style.color = '#ffe66d';
            this.comboNum.style.fontSize = '14px';
        }
    }
    
    // 显示屏幕
    showScreen(screenName) {
        // 隐藏所有屏幕
        [this.startScreen, this.gameScreen, this.pauseScreen, this.gameoverScreen, this.victoryScreen]
            .forEach(s => s.classList.remove('active'));
        
        // 显示指定屏幕
        switch (screenName) {
            case 'start':
                this.startScreen.classList.add('active');
                break;
            case 'game':
                this.gameScreen.classList.add('active');
                break;
            case 'pause':
                this.pauseScreen.classList.add('active');
                break;
            case 'gameover':
                this.gameoverScreen.classList.add('active');
                break;
            case 'victory':
                this.victoryScreen.classList.add('active');
                break;
        }
    }
    
    // 显示游戏结束
    showGameOver(player, wave) {
        document.getElementById('final-score').textContent = player.score.toLocaleString();
        document.getElementById('final-kills').textContent = player.kills;
        document.getElementById('final-combo').textContent = player.maxCombo;
        document.getElementById('final-wave').textContent = wave;
        this.showScreen('gameover');
        audio.gameOver();
    }
    
    // 显示胜利
    showVictory(player) {
        document.getElementById('victory-score').textContent = player.score.toLocaleString();
        document.getElementById('victory-kills').textContent = player.kills;
        this.showScreen('victory');
        audio.victory();
    }
    
    // 显示消息
    showMessage(text, duration = 3000) {
        // 创建消息元素
        const msg = document.createElement('div');
        msg.className = 'game-message';
        msg.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: #ffe66d;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            z-index: 100;
            animation: fadeInOut ${duration}ms ease-in-out forwards;
        `;
        msg.textContent = text;
        
        // 添加动画样式
        if (!document.getElementById('message-styles')) {
            const style = document.createElement('style');
            style.id = 'message-styles';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                }
            `;
            document.head.appendChild(style);
        }
        
        this.gameScreen.appendChild(msg);
        
        setTimeout(() => {
            msg.remove();
        }, duration);
    }
    
    // 显示成就
    showAchievement(achievement) {
        const elem = document.createElement('div');
        elem.style.cssText = `
            position: absolute;
            top: 100px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            font-size: 16px;
            z-index: 100;
            animation: slideIn 0.5s ease-out, fadeOut 0.5s ease-in 2.5s forwards;
        `;
        elem.innerHTML = `${achievement.emoji} <strong>${achievement.name}</strong><br><small>${achievement.desc}</small>`;
        
        // 添加动画
        if (!document.getElementById('achievement-styles')) {
            const style = document.createElement('style');
            style.id = 'achievement-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeOut {
                    to { opacity: 0; transform: translateY(-20px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        this.gameScreen.appendChild(elem);
        
        setTimeout(() => {
            elem.remove();
        }, 3000);
    }
    
    // 屏幕震动
    screenShake(intensity = 5, duration = 200) {
        const container = document.getElementById('game-container');
        container.style.animation = 'none';
        container.offsetHeight; // 触发重排
        
        let elapsed = 0;
        const interval = setInterval(() => {
            elapsed += 16;
            if (elapsed >= duration) {
                container.style.transform = 'translate(0, 0)';
                clearInterval(interval);
            } else {
                const x = Utils.random(-intensity, intensity);
                const y = Utils.random(-intensity, intensity);
                container.style.transform = `translate(${x}px, ${y}px)`;
            }
        }, 16);
    }
    
    // 闪屏效果
    flashScreen(color = 'white', duration = 100) {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: ${color};
            opacity: 0.5;
            pointer-events: none;
            z-index: 50;
        `;
        this.gameScreen.appendChild(flash);
        
        setTimeout(() => {
            flash.remove();
        }, duration);
    }
}
