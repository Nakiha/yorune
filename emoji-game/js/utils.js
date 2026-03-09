// 🛠️ 工具函数

const Utils = {
    // 随机数
    random: (min, max) => Math.random() * (max - min) + min,
    
    randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    
    // 随机选择数组元素
    randomChoice: (arr) => arr[Math.floor(Math.random() * arr.length)],
    
    // 距离计算
    distance: (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
    
    // 角度计算
    angle: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1),
    
    // 碰撞检测（圆形）
    circleCollision: (obj1, obj2) => {
        const dist = Utils.distance(obj1.x, obj1.y, obj2.x, obj2.y);
        return dist < obj1.radius + obj2.radius;
    },
    
    // 矩形碰撞
    rectCollision: (r1, r2) => {
        return r1.x < r2.x + r2.width &&
               r1.x + r1.width > r2.x &&
               r1.y < r2.y + r2.height &&
               r1.y + r1.height > r2.y;
    },
    
    // 限制值在范围内
    clamp: (value, min, max) => Math.min(Math.max(value, min), max),
    
    // 线性插值
    lerp: (start, end, t) => start + (end - start) * t,
    
    // 震动效果
    shake: (intensity = 5) => {
        return {
            x: Utils.random(-intensity, intensity),
            y: Utils.random(-intensity, intensity)
        };
    },
    
    // 创建伤害数字 - 优化版，使用粒子系统替代DOM
    showDamage: (x, y, damage, color = '#ff6b6b') => {
        particles.damageNumber(x, y, damage, color);
    },
    
    // 显示连击 - 简化版
    showCombo: (combo) => {
        if (combo < 3) return;
        particles.add(new Particle(
            400,
            180,
            {
                text: `${combo} COMBO!`,
                color: combo >= 10 ? '#ff6b6b' : '#ffe66d',
                size: Math.min(8 + combo, 16),
                vx: 0,
                vy: -0.5,
                life: 25,
                decay: 0.7
            }
        ));
    },
    
    // 概率判定
    chance: (percent) => Math.random() < percent,
    
    // 打字机效果
    typeWriter: async (element, text, speed = 50) => {
        element.textContent = '';
        for (let char of text) {
            element.textContent += char;
            await new Promise(r => setTimeout(r, speed));
        }
    }
};

// 梗文字生成器
const MemeTexts = {
    enemySpawn: [
        '有人@了你',
        '你有一条新消息',
        '震惊！',
        '这件事你怎么看？',
        '家人们谁懂啊',
        '笑死',
        '绝绝子',
        'yyds',
        '真的假的',
        '不应该是这样吗？',
        '给爷整笑了',
        '这也行？',
        '破防了',
        '绷不住了',
        '精神状态良好'
    ],
    
    playerHit: [
        '痛！',
        '危！',
        '寄',
        '汗流浃背',
        '这下尴尬了',
        '合理吗这？'
    ],
    
    enemyDeath: [
        '寄',
        '这就去',
        '不是吧',
        '我的我的',
        '下次一定',
        '有内鬼',
        '应该是的'
    ],
    
    powerUp: [
        '+1',
        '起飞！',
        '稳了',
        '这波稳',
        '发财'
    ],
    
    bossSpawn: [
        '大的来了！',
        '前方高能',
        '全员恶人',
        '重开吧',
        '这把没了'
    ],
    
    victory: [
        '就这？',
        '有手就行',
        '下次加油',
        '下次一定'
    ],
    
    getRandom: (category) => Utils.randomChoice(MemeTexts[category] || [])
};
