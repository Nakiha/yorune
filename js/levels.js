// 🗺️ 关卡配置

const Levels = {
    // 关卡1：新手村
    tutorial: {
        name: '新手村',
        description: 'Emoji王国的边缘，MEME入侵的开始...',
        waves: 3,
        enemyTypes: ['doge', 'skull'],
        bossWave: -1, // 无Boss
        background: '#0a0a1a',
        ambientEmojis: ['⭐', '✨', '🌟'],
        messages: [
            { time: 0, text: '欢迎来到Emoji王国！' },
            { time: 120, text: 'MEME病毒正在侵蚀这里...' },
            { time: 240, text: '保护王国，击退入侵者！' }
        ]
    },
    
    // 关卡2：梗之森林
    memeForest: {
        name: '梗之森林',
        description: '充满了各种网络梗的神秘森林',
        waves: 5,
        enemyTypes: ['doge', 'pepe', 'skull', 'crying'],
        bossWave: 5,
        bossType: 'superDoge',
        background: '#0a1a0a',
        ambientEmojis: ['🌿', '🍃', '🌲'],
        messages: [
            { time: 0, text: '你进入了梗之森林...' },
            { time: 120, text: '这里充满了Pepe和狗头' },
            { time: 360, text: '小心！超级狗头即将出现！' }
        ]
    },
    
    // 关卡3：表情包城
    emojiCity: {
        name: '表情包城',
        description: 'Emoji王国的首都，战斗最激烈的地方',
        waves: 7,
        enemyTypes: ['doge', 'pepe', 'clown', 'skull', 'crying', 'fire', 'think'],
        bossWave: 4,
        bossType: 'megaPepe',
        background: '#1a0a1a',
        ambientEmojis: ['🌃', '🏙️', '🚗'],
        messages: [
            { time: 0, text: '表情包城！' },
            { time: 120, text: '这里是被入侵最严重的地方' },
            { time: 240, text: '所有MEME都想占领这里...' },
            { time: 480, text: 'Mega Pepe出现了！' }
        ]
    },
    
    // 关卡4：小丑马戏团
    clownCircus: {
        name: '小丑马戏团',
        description: '终极关卡！面对小丑大军的最后决战',
        waves: 10,
        enemyTypes: ['clown', 'fire', 'sunglasses', 'think'],
        bossWave: 5,
        bossType: 'ultimateClown',
        background: '#1a0a0a',
        ambientEmojis: ['🎪', '🎈', '🎭'],
        messages: [
            { time: 0, text: '最后的战场...' },
            { time: 120, text: '小丑们的总部' },
            { time: 240, text: '全世界都在看着你' },
            { time: 480, text: '终极小丑！！！' },
            { time: 600, text: '这是最后的战斗！' }
        ]
    }
};

// 关卡管理器
class LevelManager {
    constructor() {
        this.currentLevel = null;
        this.currentLevelKey = null;
        this.waveNumber = 0;
        this.messageQueue = [];
        this.messageTimer = 0;
        this.ambientTimer = 0;
    }
    
    loadLevel(levelKey) {
        this.currentLevelKey = levelKey;
        this.currentLevel = Levels[levelKey];
        this.waveNumber = 0;
        this.messageQueue = [...(this.currentLevel.messages || [])].sort((a, b) => a.time - b.time);
        this.messageTimer = 0;
        
        return this.currentLevel;
    }
    
    getNextWave() {
        if (!this.currentLevel) return null;
        
        this.waveNumber++;
        
        if (this.waveNumber > this.currentLevel.waves) {
            return null; // 关卡完成
        }
        
        return {
            wave: this.waveNumber,
            isBossWave: this.waveNumber === this.currentLevel.bossWave,
            bossType: this.waveNumber === this.currentLevel.bossWave ? this.currentLevel.bossType : null,
            enemyTypes: this.currentLevel.enemyTypes,
            isLastWave: this.waveNumber === this.currentLevel.waves
        };
    }
    
    update() {
        this.messageTimer++;
        
        // 环境emoji
        this.ambientTimer++;
        if (this.ambientTimer >= 60 && this.currentLevel) {
            this.ambientTimer = 0;
            if (this.currentLevel.ambientEmojis) {
                // 在游戏画布边缘生成环境emoji
            }
        }
    }
    
    getMessages() {
        const messages = [];
        
        while (this.messageQueue.length > 0 && this.messageQueue[0].time <= this.messageTimer) {
            messages.push(this.messageQueue.shift().text);
        }
        
        return messages;
    }
    
    isLevelComplete() {
        return this.currentLevel && this.waveNumber >= this.currentLevel.waves;
    }
    
    hasNextLevel() {
        const levelKeys = Object.keys(Levels);
        const currentIndex = levelKeys.indexOf(this.currentLevelKey);
        return currentIndex < levelKeys.length - 1;
    }
    
    getNextLevelKey() {
        const levelKeys = Object.keys(Levels);
        const currentIndex = levelKeys.indexOf(this.currentLevelKey);
        return levelKeys[currentIndex + 1];
    }
    
    // 获取关卡进度
    getProgress() {
        if (!this.currentLevel) return 0;
        return this.waveNumber / this.currentLevel.waves;
    }
}

// 成就系统
const Achievements = {
    firstBlood: { name: '首杀', desc: '击杀第一个敌人', emoji: '🩸', unlocked: false },
    combo10: { name: '连击大师', desc: '达成10连击', emoji: '🔥', unlocked: false },
    combo20: { name: '连击之王', desc: '达成20连击', emoji: '👑', unlocked: false },
    bossKiller: { name: 'Boss杀手', desc: '击杀一个Boss', emoji: '💀', unlocked: false },
    survivor: { name: '生存者', desc: '以满血完成一波', emoji: '❤️', unlocked: false },
    speedster: { name: '速度狂人', desc: '在30秒内完成一波', emoji: '⚡', unlocked: false },
    collector: { name: '收藏家', desc: '收集10个道具', emoji: '💎', unlocked: false },
    levelClear: { name: '通关', desc: '完成所有关卡', emoji: '🏆', unlocked: false },
    
    check(type, value) {
        let unlocked = [];
        
        if (type === 'kill' && !this.firstBlood.unlocked) {
            this.firstBlood.unlocked = true;
            unlocked.push(this.firstBlood);
        }
        
        if (type === 'combo') {
            if (value >= 10 && !this.combo10.unlocked) {
                this.combo10.unlocked = true;
                unlocked.push(this.combo10);
            }
            if (value >= 20 && !this.combo20.unlocked) {
                this.combo20.unlocked = true;
                unlocked.push(this.combo20);
            }
        }
        
        if (type === 'boss' && !this.bossKiller.unlocked) {
            this.bossKiller.unlocked = true;
            unlocked.push(this.bossKiller);
        }
        
        return unlocked;
    }
};

// 排行榜
const Leaderboard = {
    scores: [],
    
    add(name, score, wave, kills) {
        this.scores.push({
            name: name,
            score: score,
            wave: wave,
            kills: kills,
            date: new Date().toLocaleDateString()
        });
        
        this.scores.sort((a, b) => b.score - a.score);
        this.scores = this.scores.slice(0, 10); // 只保留前10
        
        this.save();
    },
    
    save() {
        try {
            localStorage.setItem('emojiMemeLeaderboard', JSON.stringify(this.scores));
        } catch (e) {
            // 忽略存储错误
        }
    },
    
    load() {
        try {
            const saved = localStorage.getItem('emojiMemeLeaderboard');
            if (saved) {
                this.scores = JSON.parse(saved);
            }
        } catch (e) {
            this.scores = [];
        }
    }
};

// 初始化加载排行榜
Leaderboard.load();
