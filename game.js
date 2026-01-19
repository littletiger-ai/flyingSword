// game.js - 游戏主逻辑

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 游戏状态
const gameState = {
    mouseX: window.innerWidth / 2,
    mouseY: window.innerHeight / 2,
    lastMouseX: window.innerWidth / 2,
    lastMouseY: window.innerHeight / 2,
    mouseAngle: -Math.PI / 2, // 默认朝上
    formationAngle: 0, // 阵型旋转角度
    swords: [],
    config: {
        count: 5,
        speed: 5,
        radius: 50, // 轨道半径
        color: '#00ffff', // 青色荧光
        shape: 'default',
        trajectory: 'linear', // linear, curve
        attackMode: 'linear' // linear, scatter, circle
    }
};

// 飞剑类
class Sword {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.speed = gameState.config.speed;
        this.color = gameState.config.color;
        // 随机一点偏移，让飞剑不会完全重叠
        this.offsetFactor = Math.random() * 0.1 + 0.9; 
        
        // 波动参数
        this.wavePhase = Math.random() * Math.PI * 2;
        this.waveTime = 0;

        // 攻击状态
        this.isAttacking = false;
        this.attackState = null; // 存储攻击的具体参数
    }

    startAttack(mode, index, totalCount, mouseAngle) {
        if (this.isAttacking) return;
        
        try {
            this.isAttacking = true;
            this.attackState = {
                mode: mode,
                startX: this.x,
                startY: this.y,
                timer: 0,
                phase: 'out', // out: 发射出去, back: 返回
            };

            // 确保 mouseAngle 有效
            let validMouseAngle = -Math.PI / 2;
            if (typeof mouseAngle === 'number' && !isNaN(mouseAngle)) {
                validMouseAngle = mouseAngle;
            } else if (typeof this.angle === 'number' && !isNaN(this.angle)) {
                validMouseAngle = this.angle - Math.PI / 2;
            }

            if (mode === 'linear') {
                // 直线发射
                let angle = validMouseAngle;
                this.attackState.vx = Math.cos(angle) * 20; 
                this.attackState.vy = Math.sin(angle) * 20;
                this.attackState.maxDist = 800;
                this.attackState.distTraveled = 0;
            } else if (mode === 'scatter') {
                // 散射：60度扇形
                const spread = Math.PI / 3; // 60度
                let offset = 0;
                if (totalCount > 1) {
                    offset = -spread/2 + (spread / (totalCount - 1)) * index;
                }
                const angle = validMouseAngle + offset;
                this.attackState.vx = Math.cos(angle) * 20;
                this.attackState.vy = Math.sin(angle) * 20;
                this.attackState.maxDist = 800;
                this.attackState.distTraveled = 0;
            } else if (mode === 'circle') {
                // 圆形环绕
                // 确保中心点有效
                let cx = gameState.mouseX;
                let cy = gameState.mouseY;
                if (isNaN(cx) || isNaN(cy)) {
                    cx = canvas.width / 2;
                    cy = canvas.height / 2;
                }
                
                this.attackState.centerX = cx;
                this.attackState.centerY = cy;
                this.attackState.radius = 200;
                
                // 初始角度：相对于圆心的角度
                this.attackState.angle = Math.atan2(this.y - cy, this.x - cx);
                if (isNaN(this.attackState.angle)) this.attackState.angle = 0;
                
                this.attackState.totalRotation = 0;
                this.attackState.targetRotation = Math.PI * 2 * 3; // 3圈
                this.attackState.angularSpeed = (120 * Math.PI / 180) / 60; 
            }
        } catch (e) {
            console.error("startAttack error:", e);
            this.isAttacking = false;
        }
    }

    updateAttack() {
        try {
            const state = this.attackState;
            if (!state) {
                this.isAttacking = false;
                return;
            }
            
            if (state.mode === 'linear' || state.mode === 'scatter') {
                if (state.phase === 'out') {
                    // 检查 vx vy
                    if (isNaN(state.vx) || isNaN(state.vy)) {
                         this.isAttacking = false;
                         return;
                    }

                    this.x += state.vx;
                    this.y += state.vy;
                    
                    // 检查坐标有效性
                    if (isNaN(this.x) || isNaN(this.y)) {
                        this.x = state.startX;
                        this.y = state.startY;
                        this.isAttacking = false;
                        return;
                    }

                    state.distTraveled += Math.sqrt(state.vx*state.vx + state.vy*state.vy);
                    
                    // 朝向飞行方向
                    this.angle = Math.atan2(state.vy, state.vx) + Math.PI / 2;

                    if (state.distTraveled >= state.maxDist) {
                        state.phase = 'back';
                    }
                } else {
                    // 返回逻辑：直接结束攻击状态，交给常规 update 处理返回
                    this.isAttacking = false;
                }
            } else if (state.mode === 'circle') {
                if (state.phase === 'out') {
                    // 增加角度
                    const speed = 2 * Math.PI / 180 * 2; 
                    state.angle += speed;
                    state.totalRotation += speed;
                    
                    this.x = state.centerX + Math.cos(state.angle) * state.radius;
                    this.y = state.centerY + Math.sin(state.angle) * state.radius;
                    
                    // 检查坐标有效性
                    if (isNaN(this.x) || isNaN(this.y)) {
                         this.isAttacking = false;
                         return;
                    }

                    // 朝向切线方向
                    this.angle = state.angle + Math.PI + Math.PI/2; 

                    if (state.totalRotation >= state.targetRotation) {
                        this.isAttacking = false;
                    }
                }
            }
        } catch (e) {
            console.error("updateAttack error:", e);
            this.isAttacking = false;
        }
    }

    update(index, totalCount) {
        // 更新属性
        this.speed = gameState.config.speed * this.offsetFactor;
        this.color = gameState.config.color;
        this.waveTime += 0.1;

        // 如果在攻击状态，执行攻击逻辑
        if (this.isAttacking) {
            this.updateAttack();
            return;
        }

        let targetX, targetY;
        let targetAngle;

        if (totalCount < 2) {
            // 单把飞剑：原有逻辑，跟随鼠标
            targetX = gameState.mouseX;
            targetY = gameState.mouseY;
            
            // 确保目标坐标有效
            if (isNaN(targetX) || isNaN(targetY)) {
                targetX = canvas.width/2;
                targetY = canvas.height/2;
            }
            
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) {
                targetAngle = Math.atan2(dy, dx) + Math.PI / 2;
                this.angle = targetAngle; // 剑尖指向移动方向
                
                const angleToTarget = Math.atan2(dy, dx);
                this.vx = Math.cos(angleToTarget) * this.speed;
                this.vy = Math.sin(angleToTarget) * this.speed;
                
                this.x += this.vx;
                this.y += this.vy;
            }
        } else {
            // 多把飞剑：轨道逻辑
            // 1. 计算停留点
            // 半径
            let R = gameState.config.radius;
            if (isNaN(R)) R = 50;

            // 每个飞剑的基础角度偏移
            const offsetAngle = (Math.PI * 2 / totalCount) * index;
            // 当前停留点的角度 = 阵型旋转角 + 基础偏移
            const currentOrbitAngle = gameState.formationAngle + offsetAngle;
            
            // 停留点坐标
            targetX = gameState.mouseX + R * Math.cos(currentOrbitAngle);
            targetY = gameState.mouseY + R * Math.sin(currentOrbitAngle);
            
             // 确保目标坐标有效
            if (isNaN(targetX) || isNaN(targetY)) {
                targetX = gameState.mouseX;
                targetY = gameState.mouseY;
            }

            // 2. 飞剑追踪停留点
            let dx = targetX - this.x;
            let dy = targetY - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            
            // 定义一个“重合”的阈值，例如 5px
            const arrivedThreshold = 5;

            if (distance > 2) { // 移动逻辑
                const trajectory = gameState.config.trajectory;
                let moveAngle = Math.atan2(dy, dx);

                if (trajectory === 'curve') {
                    // 曲线飞行：叠加正弦波
                    const waveAmp = 5; // 振幅
                    const waveFreq = 0.5; // 频率
                    const waveOffset = Math.sin(this.waveTime * waveFreq + this.wavePhase) * waveAmp;
                    moveAngle += waveOffset * 0.2; 
                }

                this.vx = Math.cos(moveAngle) * this.speed;
                this.vy = Math.sin(moveAngle) * this.speed;
                
                // 防止超调抖动
                if (distance < this.speed) {
                    this.x = targetX;
                    this.y = targetY;
                } else {
                    this.x += this.vx;
                    this.y += this.vy;
                }
            } else {
                this.x = targetX;
                this.y = targetY;
            }

            // 3. 飞剑朝向逻辑
            if (distance > arrivedThreshold) {
                // 未重合时：朝向停留点
                const angleToTarget = Math.atan2(dy, dx);
                this.angle = angleToTarget + Math.PI / 2;
            } else {
                // 重合时：和鼠标的朝向保持一致
                // 确保 mouseAngle 有效
                let ma = gameState.mouseAngle;
                if (isNaN(ma)) ma = -Math.PI/2;
                this.angle = ma + Math.PI / 2;
            }
        }
        
        // 最后一道保险：防止坐标变为NaN
        if (isNaN(this.x)) this.x = Math.random() * canvas.width;
        if (isNaN(this.y)) this.y = Math.random() * canvas.height;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        drawSwordShape(ctx, this);
        ctx.restore();
    }
}

// 初始化
function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    window.addEventListener('mousemove', (e) => {
        // 计算鼠标移动方向
        const dx = e.clientX - gameState.lastMouseX;
        const dy = e.clientY - gameState.lastMouseY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 2) { // 只有移动足够距离才更新方向
            gameState.mouseAngle = Math.atan2(dy, dx);
            gameState.lastMouseX = e.clientX;
            gameState.lastMouseY = e.clientY;
        }

        gameState.mouseX = e.clientX;
        gameState.mouseY = e.clientY;
    });

    // 初始化飞剑
    updateSwordCount();

    // 事件监听
    setupControls();
    
    // 开始循环
    requestAnimationFrame(gameLoop);
}

function setupControls() {
    // 数量控制
    const countControl = document.getElementById('countControl');
    const countDisplay = document.getElementById('countDisplay');
    countControl.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        gameState.config.count = val;
        countDisplay.innerText = val;
        updateSwordCount();
    });

    // 速度控制
    const speedControl = document.getElementById('speedControl');
    const speedDisplay = document.getElementById('speedDisplay');
    speedControl.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        gameState.config.speed = val;
        speedDisplay.innerText = val;
    });

    // 半径控制
    const radiusControl = document.getElementById('radiusControl');
    const radiusDisplay = document.getElementById('radiusDisplay');
    radiusControl.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        gameState.config.radius = val;
        radiusDisplay.innerText = val;
    });

    // 颜色控制
    const colorControl = document.getElementById('colorControl');
    colorControl.addEventListener('input', (e) => {
        gameState.config.color = e.target.value;
    });

    // 攻击模式
    const attackMode = document.getElementById('attackMode');
    attackMode.addEventListener('change', (e) => {
        gameState.config.attackMode = e.target.value;
    });

    // 发射按钮
    const attackBtn = document.getElementById('attackBtn');
    attackBtn.addEventListener('click', triggerAttack);

    // 键盘空格发射
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            triggerAttack();
        }
    });
}

function triggerAttack() {
    try {
        const mode = gameState.config.attackMode;
        gameState.swords.forEach((sword, index) => {
            sword.startAttack(mode, index, gameState.swords.length, gameState.mouseAngle);
        });
    } catch (e) {
        console.error("triggerAttack error:", e);
    }
}

function updateSwordCount() {
    const diff = gameState.config.count - gameState.swords.length;
    if (diff > 0) {
        for (let i = 0; i < diff; i++) {
            gameState.swords.push(new Sword());
        }
    } else if (diff < 0) {
        gameState.swords.splice(diff);
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // 确保 mouseX mouseY 有效
    if (isNaN(gameState.mouseX)) gameState.mouseX = canvas.width / 2;
    if (isNaN(gameState.mouseY)) gameState.mouseY = canvas.height / 2;
}

function gameLoop() {
    // 清空画布
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制飞剑轨道 (仅当飞剑数量 >= 2 时)
    if (gameState.swords.length >= 2) {
        // 更新阵型角度
        gameState.formationAngle += 0.05;
    }

    // 更新和绘制飞剑
    gameState.swords.forEach((sword, index) => {
        sword.update(index, gameState.swords.length);
        sword.draw();
    });

    requestAnimationFrame(gameLoop);
}

// 启动游戏
init();