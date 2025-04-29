// 游戏常量
const GRID_SIZE = 20; // 网格大小
const GAME_SPEED = 500; // 游戏速度(毫秒) - 在移动设备上更快的速度

// 检测是否为移动设备
const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// 游戏变量
let canvas, ctx;
let snake, food;
let direction, nextDirection;
let gameInterval;
let score;
let gameRunning = false;

// 蛇的颜色选项
const snakeColors = ['#FF9800', '#4CAF50', '#2196F3', '#9C27B0', '#F44336'];
let snakeColor;

// 食物图片
const foodImages = [];
const foodTypes = ['apple', 'banana', 'strawberry', 'orange'];
let currentFoodType;

// 动画效果变量
let fireworks = []; // 烟花粒子数组
let cryingAnimation = null; // 哭泣动画对象
let animationFrame = null; // 动画帧请求ID

// 游戏音效 - 使用AudioManager管理

// 初始化游戏
window.onload = function() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    
    // 初始化按钮事件
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('upBtn').addEventListener('click', () => changeDirection('up'));
    document.getElementById('downBtn').addEventListener('click', () => changeDirection('down'));
    document.getElementById('leftBtn').addEventListener('click', () => changeDirection('left'));
    document.getElementById('rightBtn').addEventListener('click', () => changeDirection('right'));
    
    // 键盘控制
    document.addEventListener('keydown', handleKeyPress);
    
    // 触摸控制（移动设备）
    initTouchControls();
    
    // 加载食物图片
    loadFoodImages();
    
    // 初始化音频管理器
    AudioManager.init();
    
    // 绘制初始画面
    drawWelcomeScreen();
    
    // 调整画布大小以适应屏幕
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
};

// 调整画布大小
function resizeCanvas() {
    const container = document.querySelector('.game-container');
    const maxWidth = Math.min(320, container.clientWidth - 20);
    
    canvas.width = maxWidth;
    canvas.height = maxWidth;
    
    // 重新绘制
    if (gameRunning) {
        draw();
    } else {
        drawWelcomeScreen();
    }
}

// 初始化触摸控制
function initTouchControls() {
    // 触摸变量
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    
    // 防止整个游戏容器的默认触摸行为
    document.querySelector('.game-container').addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, { passive: false });
    
    // 监听触摸开始事件
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: false });
    
    // 监听触摸移动事件
    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, { passive: false });
    
    // 监听触摸结束事件
    canvas.addEventListener('touchend', function(e) {
        e.preventDefault();
        touchEndX = e.changedTouches[0].clientX;
        touchEndY = e.changedTouches[0].clientY;
        handleSwipe();
    }, { passive: false });
    
    // 为方向按钮添加触摸事件
    const dirButtons = document.querySelectorAll('.direction-buttons button');
    dirButtons.forEach(button => {
        button.addEventListener('touchstart', function(e) {
            e.preventDefault();
            this.click();
        }, { passive: false });
    });
    
    // 处理滑动方向
    function handleSwipe() {
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        
        // 确定主要滑动方向（水平或垂直）
        if (Math.abs(dx) > Math.abs(dy)) {
            // 水平滑动
            if (dx > 30) {
                changeDirection('right');
            } else if (dx < -30) {
                changeDirection('left');
            }
        } else {
            // 垂直滑动
            if (dy > 30) {
                changeDirection('down');
            } else if (dy < -30) {
                changeDirection('up');
            }
        }
    }
}

// 加载食物图片
function loadFoodImages() {
    foodTypes.forEach(type => {
        const img = new Image();
        img.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="${getFoodColor(type)}"/></svg>`;
        foodImages.push(img);
    });
}

// 根据食物类型获取颜色
function getFoodColor(type) {
    switch(type) {
        case 'apple': return '%23FF5252';
        case 'banana': return '%23FFEB3B';
        case 'strawberry': return '%23E91E63';
        case 'orange': return '%23FF9800';
        default: return '%23FF5252';
    }
}

// 加载音效 - 已由AudioManager替代
function loadSounds() {
    // 此函数保留以兼容现有代码，但实际音效加载已移至AudioManager
    console.log('音效加载已由AudioManager接管');
}

// 绘制欢迎画面
function drawWelcomeScreen() {
    ctx.fillStyle = '#e8f5e9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#4CAF50';
    ctx.font = '24px "Comic Sans MS"';
    ctx.textAlign = 'center';
    ctx.fillText('小朋友贪吃蛇', canvas.width/2, canvas.height/2 - 30);
    
    ctx.fillStyle = '#FF9800';
    ctx.font = '16px "Comic Sans MS"';
    ctx.fillText('点击开始按钮玩游戏！', canvas.width/2, canvas.height/2 + 10);
    
    // 绘制小蛇图案
    drawSnakeIcon(canvas.width/2 - 40, canvas.height/2 + 40);
}

// 绘制小蛇图标
function drawSnakeIcon(x, y) {
    ctx.fillStyle = '#4CAF50';
    for(let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(x + i*15, y, 8, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 绘制眼睛
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x + 3, y - 3, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(x + 3, y - 3, 1.5, 0, Math.PI * 2);
    ctx.fill();
}

// 开始游戏
function startGame() {
    if (gameRunning) return;
    
    // 播放开始音效
    AudioManager.play('start');
    
    // 初始化游戏状态
    snake = [
        {x: 5, y: 10},
        {x: 4, y: 10},
        {x: 3, y: 10}
    ];
    
    // 随机选择蛇的颜色
    snakeColor = snakeColors[Math.floor(Math.random() * snakeColors.length)];
    
    score = 0;
    document.getElementById('score').textContent = score;
    
    direction = 'right';
    nextDirection = 'right';
    
    // 清除所有动画
    fireworks = [];
    cryingAnimation = null;
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }
    
    createFood();
    
    // 根据设备类型调整游戏速度
    let gameSpeedAdjusted = GAME_SPEED;
    if (isMobileDevice) {
        // 在移动设备上使用更快的速度
        gameSpeedAdjusted = Math.max(150, GAME_SPEED - 100);
    }
    
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeedAdjusted);
    gameRunning = true;
    
    document.getElementById('startBtn').textContent = '重新开始';
    
    // 确保画布尺寸正确
    resizeCanvas();
}

// 创建食物
function createFood() {
    // 随机选择食物类型
    currentFoodType = Math.floor(Math.random() * foodTypes.length);
    
    // 随机位置
    food = {
        x: Math.floor(Math.random() * (canvas.width / GRID_SIZE)),
        y: Math.floor(Math.random() * (canvas.height / GRID_SIZE))
    };
    
    // 确保食物不会出现在蛇身上
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === food.x && snake[i].y === food.y) {
            createFood();
            return;
        }
    }
}

// 游戏主循环
function gameLoop() {
    update();
    draw();
}

// 更新游戏状态
function update() {
    // 更新方向
    direction = nextDirection;
    
    // 移动蛇头
    const head = {x: snake[0].x, y: snake[0].y};
    
    switch(direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }
    
    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        // 增加分数
        score += 10;
        document.getElementById('score').textContent = score;
        
        // 播放吃到食物音效
        AudioManager.play('eat');
        
        // 创建烟花动画
        createFireworks(food.x * GRID_SIZE + GRID_SIZE/2, food.y * GRID_SIZE + GRID_SIZE/2);
        
        // 创建新食物
        createFood();
    } else {
        // 如果没吃到食物，移除蛇尾
        snake.pop();
    }
    
    // 检查游戏结束条件
    if (
        head.x < 0 || head.x >= canvas.width / GRID_SIZE ||
        head.y < 0 || head.y >= canvas.height / GRID_SIZE ||
        checkCollision(head)
    ) {
        // 创建哭泣动画
        createCryingAnimation(head.x * GRID_SIZE + GRID_SIZE/2, head.y * GRID_SIZE + GRID_SIZE/2);
        gameOver();
        return;
    }
    
    // 添加新蛇头
    snake.unshift(head);
}

// 检查碰撞
function checkCollision(head) {
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    return false;
}

// 绘制游戏
function draw() {
    // 清空画布
    ctx.fillStyle = '#e8f5e9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格线（淡色）
    ctx.strokeStyle = '#c8e6c9';
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= canvas.width; i += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    
    for (let i = 0; i <= canvas.height; i += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
    
    // 绘制食物
    const foodImg = foodImages[currentFoodType];
    ctx.drawImage(
        foodImg,
        food.x * GRID_SIZE,
        food.y * GRID_SIZE,
        GRID_SIZE,
        GRID_SIZE
    );
    
    // 绘制蛇
    for (let i = 0; i < snake.length; i++) {
        // 蛇身体
        ctx.fillStyle = snakeColor;
        ctx.beginPath();
        ctx.arc(
            snake[i].x * GRID_SIZE + GRID_SIZE/2,
            snake[i].y * GRID_SIZE + GRID_SIZE/2,
            GRID_SIZE/2 - 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // 如果是蛇头，添加眼睛
        if (i === 0) {
            // 眼白
            ctx.fillStyle = 'white';
            
            let eyeX1, eyeY1, eyeX2, eyeY2;
            
            switch(direction) {
                case 'up':
                    eyeX1 = snake[i].x * GRID_SIZE + GRID_SIZE/3;
                    eyeY1 = snake[i].y * GRID_SIZE + GRID_SIZE/3;
                    eyeX2 = snake[i].x * GRID_SIZE + GRID_SIZE*2/3;
                    eyeY2 = snake[i].y * GRID_SIZE + GRID_SIZE/3;
                    break;
                case 'down':
                    eyeX1 = snake[i].x * GRID_SIZE + GRID_SIZE/3;
                    eyeY1 = snake[i].y * GRID_SIZE + GRID_SIZE*2/3;
                    eyeX2 = snake[i].x * GRID_SIZE + GRID_SIZE*2/3;
                    eyeY2 = snake[i].y * GRID_SIZE + GRID_SIZE*2/3;
                    break;
                case 'left':
                    eyeX1 = snake[i].x * GRID_SIZE + GRID_SIZE/3;
                    eyeY1 = snake[i].y * GRID_SIZE + GRID_SIZE/3;
                    eyeX2 = snake[i].x * GRID_SIZE + GRID_SIZE/3;
                    eyeY2 = snake[i].y * GRID_SIZE + GRID_SIZE*2/3;
                    break;
                case 'right':
                    eyeX1 = snake[i].x * GRID_SIZE + GRID_SIZE*2/3;
                    eyeY1 = snake[i].y * GRID_SIZE + GRID_SIZE/3;
                    eyeX2 = snake[i].x * GRID_SIZE + GRID_SIZE*2/3;
                    eyeY2 = snake[i].y * GRID_SIZE + GRID_SIZE*2/3;
                    break;
            }
            
            ctx.beginPath();
            ctx.arc(eyeX1, eyeY1, 3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(eyeX2, eyeY2, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // 眼珠
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(eyeX1, eyeY1, 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(eyeX2, eyeY2, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 绘制烟花动画
    drawFireworks();
    
    // 绘制哭泣动画
    drawCryingAnimation();
    
    // 如果有动画正在进行，继续请求动画帧
    if (fireworks.length > 0 || cryingAnimation) {
        animationFrame = requestAnimationFrame(draw);
    }
}

// 游戏结束
function gameOver() {
    clearInterval(gameInterval);
    gameRunning = false;
    
    // 播放游戏结束音效
    AudioManager.play('gameover');
    
    // 暂停背景音乐
    AudioManager.pauseBackground();
    
    // 绘制游戏结束画面（延迟一点，让哭泣动画先显示）
    setTimeout(() => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FFEB3B';
        ctx.font = '28px "Comic Sans MS"';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束', canvas.width/2, canvas.height/2 - 30);
        
        ctx.fillStyle = 'white';
        ctx.font = '20px "Comic Sans MS"';
        ctx.fillText(`你的得分: ${score}`, canvas.width/2, canvas.height/2 + 10);
        
        ctx.font = '16px "Comic Sans MS"';
        ctx.fillText('点击开始按钮再玩一次！', canvas.width/2, canvas.height/2 + 50);
        
        document.getElementById('startBtn').textContent = '再玩一次';
    }, 1500); // 1.5秒后显示游戏结束画面
}

// 处理键盘按键
function handleKeyPress(e) {
    switch(e.key) {
        case 'ArrowUp':
            changeDirection('up');
            break;
        case 'ArrowDown':
            changeDirection('down');
            break;
        case 'ArrowLeft':
            changeDirection('left');
            break;
        case 'ArrowRight':
            changeDirection('right');
            break;
    }
}

// 改变方向
function changeDirection(newDirection) {
    // 防止180度转弯
    if (
        (newDirection === 'up' && direction === 'down') ||
        (newDirection === 'down' && direction === 'up') ||
        (newDirection === 'left' && direction === 'right') ||
        (newDirection === 'right' && direction === 'left')
    ) {
        return;
    }
    
    nextDirection = newDirection;
    
    // 如果游戏未开始，点击方向键也可以开始游戏
    if (!gameRunning) {
        startGame();
    }
}

// 创建烟花粒子
function createFireworks(x, y) {
    const particleCount = 30; // 粒子数量
    const colors = ['#FF9800', '#F44336', '#2196F3', '#FFEB3B', '#4CAF50', '#E91E63']; // 烟花颜色
    
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2; // 随机角度
        const speed = 1 + Math.random() * 3; // 随机速度
        const size = 2 + Math.random() * 4; // 随机大小
        const color = colors[Math.floor(Math.random() * colors.length)]; // 随机颜色
        
        fireworks.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed, // x方向速度
            vy: Math.sin(angle) * speed, // y方向速度
            size: size,
            color: color,
            alpha: 1, // 透明度
            life: 30 + Math.random() * 20 // 生命周期
        });
    }
    
    // 启动动画循环
    if (!animationFrame) {
        animationFrame = requestAnimationFrame(draw);
    }
}

// 绘制烟花
function drawFireworks() {
    for (let i = fireworks.length - 1; i >= 0; i--) {
        const p = fireworks[i];
        
        // 更新位置
        p.x += p.vx;
        p.y += p.vy;
        
        // 更新生命周期和透明度
        p.life--;
        p.alpha = p.life / 50;
        
        // 绘制粒子
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // 如果生命周期结束，移除粒子
        if (p.life <= 0) {
            fireworks.splice(i, 1);
        }
    }
}

// 创建哭泣动画
function createCryingAnimation(x, y) {
    cryingAnimation = {
        x: x,
        y: y,
        frame: 0,
        maxFrames: 60, // 动画持续帧数
        tearSize: 0,
        tears: [
            {x: -5, y: 0, speed: 1.5, size: 3},
            {x: 5, y: 0, speed: 1.2, size: 4}
        ]
    };
    
    // 启动动画循环
    if (!animationFrame) {
        animationFrame = requestAnimationFrame(draw);
    }
}

// 绘制哭泣动画
function drawCryingAnimation() {
    if (!cryingAnimation) return;
    
    const ca = cryingAnimation;
    ca.frame++;
    
    // 绘制哭泣的表情
    ctx.fillStyle = snakeColor;
    ctx.beginPath();
    ctx.arc(ca.x, ca.y, GRID_SIZE/2, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制眼睛（哭泣状态）
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(ca.x - 5, ca.y - 3, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(ca.x + 5, ca.y - 3, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制眼珠（闭眼状态）
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.ellipse(ca.x - 5, ca.y - 3, 4, 1, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.ellipse(ca.x + 5, ca.y - 3, 4, 1, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制哭泣的嘴巴
    ctx.beginPath();
    ctx.arc(ca.x, ca.y + 5, 3, 0, Math.PI, true);
    ctx.stroke();
    
    // 绘制眼泪
    ctx.fillStyle = '#2196F3';
    for (let tear of ca.tears) {
        tear.y += tear.speed;
        
        ctx.beginPath();
        ctx.arc(ca.x + tear.x, ca.y - 3 + tear.y, tear.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 如果眼泪掉到底部，重置位置
        if (tear.y > 20) {
            tear.y = 0;
        }
    }
    
    // 如果动画结束，移除动画对象
    if (ca.frame >= ca.maxFrames) {
        cryingAnimation = null;
    }
}