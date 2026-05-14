// ============ 音效系统 ============
class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            this.enabled = false;
        }
    }

    play(type) {
        if (!this.enabled || !this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        const now = this.ctx.currentTime;

        switch(type) {
            case 'shoot':
                osc.type = 'square';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            case 'explosion':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;
            case 'hit':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            case 'powerup':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.linearRampToValueAtTime(800, now + 0.1);
                osc.frequency.linearRampToValueAtTime(1200, now + 0.2);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
        }
    }
}

// ============ 粒子系统 ============
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6;
        this.life = 1;
        this.decay = 0.02 + Math.random() * 0.03;
        this.size = 2 + Math.random() * 3;
        this.color = color;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.size *= 0.95;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.fillRect(Math.floor(this.x), Math.floor(this.y), Math.floor(this.size), Math.floor(this.size));
        ctx.globalAlpha = 1;
    }
}

// ============ 子弹 ============
class Bullet {
    constructor(x, y, isEnemy = false) {
        this.x = x;
        this.y = y;
        this.width = isEnemy ? 6 : 4;
        this.height = isEnemy ? 12 : 14;
        this.speed = isEnemy ? 4 : 10;
        this.isEnemy = isEnemy;
        this.active = true;
    }

    update() {
        this.y += this.isEnemy ? this.speed : -this.speed;
        if (this.y < -20 || this.y > 660) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (this.isEnemy) {
            ctx.fillStyle = '#ff4444';
        } else {
            ctx.fillStyle = '#00ffff';
        }
        ctx.fillRect(Math.floor(this.x - this.width/2), Math.floor(this.y - this.height/2), this.width, this.height);

        // 子弹光晕
        ctx.fillStyle = this.isEnemy ? '#ff8888' : '#88ffff';
        ctx.globalAlpha = 0.5;
        ctx.fillRect(Math.floor(this.x - this.width/2) - 1, Math.floor(this.y - this.height/2) - 1, this.width + 2, this.height + 2);
        ctx.globalAlpha = 1;
    }
}

// ============ 敌机 ============
class Enemy {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 32;
        this.height = 32;
        this.active = true;
        this.hp = 1;
        this.score = 10;
        this.shootTimer = 0;
        this.shootInterval = 120;

        switch(type) {
            case 'fast':
                this.speed = 3;
                this.width = 24;
                this.height = 24;
                this.score = 15;
                break;
            case 'elite':
                this.speed = 1.5;
                this.width = 40;
                this.height = 40;
                this.hp = 3;
                this.score = 30;
                this.shootInterval = 60;
                break;
            default:
                this.speed = 2;
        }
    }

    update(game) {
        this.y += this.speed;
        if (this.y > 660) {
            this.active = false;
        }

        // 精英敌机射击
        if (this.type === 'elite') {
            this.shootTimer++;
            if (this.shootTimer >= this.shootInterval) {
                this.shootTimer = 0;
                game.bullets.push(new Bullet(this.x, this.y + this.height/2, true));
            }
        }
    }

    draw(ctx) {
        const x = Math.floor(this.x - this.width/2);
        const y = Math.floor(this.y - this.height/2);

        // 像素风敌机
        if (this.type === 'elite') {
            ctx.fillStyle = '#9b59b6';
            ctx.fillRect(x + 8, y, 24, 40);
            ctx.fillStyle = '#8e44ad';
            ctx.fillRect(x + 4, y + 8, 32, 24);
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(x + 12, y + 12, 8, 16);
        } else if (this.type === 'fast') {
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(x + 8, y + 4, 8, 16);
            ctx.fillRect(x, y + 8, 24, 8);
            ctx.fillStyle = '#c0392b';
            ctx.fillRect(x + 10, y + 10, 4, 8);
        } else {
            ctx.fillStyle = '#e67e22';
            ctx.fillRect(x + 12, y, 8, 32);
            ctx.fillRect(x + 4, y + 8, 24, 16);
            ctx.fillStyle = '#d35400';
            ctx.fillRect(x + 14, y + 4, 4, 24);
        }
    }

    hit() {
        this.hp--;
        if (this.hp <= 0) {
            this.active = false;
            return true;
        }
        return false;
    }
}

// ============ 玩家 ============
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 40;
        this.speed = 5;
        this.hp = 3;
        this.maxHp = 3;
        this.invincible = 0;
        this.shootTimer = 0;
        this.shootInterval = 10;
        this.powerLevel = 1;
        this.powerTimer = 0;
    }

    update(keys, game) {
        // 移动
        if (keys['ArrowLeft'] || keys['KeyA']) this.x -= this.speed;
        if (keys['ArrowRight'] || keys['KeyD']) this.x += this.speed;
        if (keys['ArrowUp'] || keys['KeyW']) this.y -= this.speed;
        if (keys['ArrowDown'] || keys['KeyS']) this.y += this.speed;

        // 边界限制
        this.x = Math.max(this.width/2, Math.min(480 - this.width/2, this.x));
        this.y = Math.max(this.height/2, Math.min(640 - this.height/2, this.y));

        // 无敌时间
        if (this.invincible > 0) this.invincible--;
        if (this.powerTimer > 0) this.powerTimer--;
        else this.powerLevel = 1;

        // 射击
        this.shootTimer++;
        if (keys['Space'] || keys['KeyZ']) {
            if (this.shootTimer >= this.shootInterval) {
                this.shootTimer = 0;
                this.shoot(game);
            }
        }
    }

    shoot(game) {
        game.sound.play('shoot');
        if (this.powerLevel >= 1) {
            game.bullets.push(new Bullet(this.x, this.y - this.height/2));
        }
        if (this.powerLevel >= 2) {
            game.bullets.push(new Bullet(this.x - 10, this.y - this.height/2 + 5));
            game.bullets.push(new Bullet(this.x + 10, this.y - this.height/2 + 5));
        }
        if (this.powerLevel >= 3) {
            game.bullets.push(new Bullet(this.x, this.y - this.height/2 - 5));
        }
    }

    draw(ctx) {
        if (this.invincible > 0 && Math.floor(this.invincible / 4) % 2) return;

        const x = Math.floor(this.x - this.width/2);
        const y = Math.floor(this.y - this.height/2);

        // 飞机主体
        ctx.fillStyle = '#3498db';
        ctx.fillRect(x + 12, y, 8, 40);
        ctx.fillRect(x + 4, y + 12, 24, 16);
        ctx.fillRect(x, y + 20, 32, 8);

        // 驾驶舱
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(x + 14, y + 16, 4, 8);

        // 机翼
        ctx.fillStyle = '#2980b9';
        ctx.fillRect(x, y + 24, 12, 8);
        ctx.fillRect(x + 20, y + 24, 12, 8);

        // 尾焰
        if (Math.random() > 0.3) {
            ctx.fillStyle = '#f39c12';
            ctx.fillRect(x + 13, y + 38, 6, 4 + Math.random() * 4);
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(x + 14, y + 40, 4, 2 + Math.random() * 3);
        }

        // 强化状态发光
        if (this.powerLevel > 1) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.3;
            ctx.strokeRect(x - 2, y - 2, this.width + 4, this.height + 4);
            ctx.globalAlpha = 1;
        }
    }

    hit(game) {
        if (this.invincible > 0) return false;
        this.hp--;
        this.invincible = 120;
        game.sound.play('hit');
        return this.hp <= 0;
    }
}

// ============ 主游戏类 ============
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalScoreEl = document.getElementById('finalScore');

        this.sound = new SoundManager();
        this.keys = {};
        this.state = 'start';
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('airplaneHighScore')) || 0;

        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.bgY = 0;
        this.difficulty = 1;
        this.enemyTimer = 0;
        this.starfield = [];

        this.initStarfield();
        this.setupControls();
        this.gameLoop();
    }

    initStarfield() {
        for (let i = 0; i < 50; i++) {
            this.starfield.push({
                x: Math.random() * 480,
                y: Math.random() * 640,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 2 + 1
            });
        }
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Enter') {
                if (this.state === 'start') this.start();
                else if (this.state === 'gameover') this.restart();
            }
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // 触摸控制
        let touchStartX, touchStartY;
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.state === 'start') { this.start(); return; }
            if (this.state === 'gameover') { this.restart(); return; }
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            this.keys['Space'] = true;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.state !== 'playing') return;
            const touch = e.touches[0];
            const dx = touch.clientX - touchStartX;
            const dy = touch.clientY - touchStartY;
            this.player.x += dx * 0.5;
            this.player.y += dy * 0.5;
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys['Space'] = false;
        });
    }

    start() {
        this.state = 'playing';
        this.score = 0;
        this.difficulty = 1;
        this.enemyTimer = 0;
        this.player = new Player(240, 560);
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
    }

    restart() {
        this.start();
    }

    gameOver() {
        this.state = 'gameover';
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('airplaneHighScore', this.highScore);
        }
        this.finalScoreEl.textContent = this.score;
        this.gameOverScreen.classList.remove('hidden');
    }

    spawnEnemy() {
        const x = 40 + Math.random() * 400;
        const rand = Math.random();
        let type = 'normal';
        if (rand > 0.9) type = 'elite';
        else if (rand > 0.6) type = 'fast';
        this.enemies.push(new Enemy(x, -40, type));
    }

    createExplosion(x, y, color = '#ff6b6b') {
        for (let i = 0; i < 12; i++) {
            this.particles.push(new Particle(x, y, color));
        }
        this.sound.play('explosion');
    }

    checkCollisions() {
        // 玩家子弹 vs 敌机
        for (let bullet of this.bullets) {
            if (bullet.isEnemy) continue;
            for (let enemy of this.enemies) {
                if (!enemy.active) continue;
                if (bullet.x > enemy.x - enemy.width/2 &&
                    bullet.x < enemy.x + enemy.width/2 &&
                    bullet.y > enemy.y - enemy.height/2 &&
                    bullet.y < enemy.y + enemy.height/2) {
                    bullet.active = false;
                    if (enemy.hit()) {
                        this.score += enemy.score;
                        this.createExplosion(enemy.x, enemy.y);
                        // 随机掉落强化道具
                        if (Math.random() < 0.15) {
                            this.player.powerLevel = Math.min(3, this.player.powerLevel + 1);
                            this.player.powerTimer = 600;
                            this.sound.play('powerup');
                        }
                    }
                    break;
                }
            }
        }

        // 敌方子弹 vs 玩家
        for (let bullet of this.bullets) {
            if (!bullet.isEnemy) continue;
            if (bullet.x > this.player.x - this.player.width/2 &&
                bullet.x < this.player.x + this.player.width/2 &&
                bullet.y > this.player.y - this.player.height/2 &&
                bullet.y < this.player.y + this.player.height/2) {
                bullet.active = false;
                if (this.player.hit(this)) {
                    this.createExplosion(this.player.x, this.player.y, '#3498db');
                    this.gameOver();
                }
            }
        }

        // 敌机 vs 玩家
        for (let enemy of this.enemies) {
            if (!enemy.active) continue;
            const dx = Math.abs(enemy.x - this.player.x);
            const dy = Math.abs(enemy.y - this.player.y);
            if (dx < (enemy.width + this.player.width) / 2 &&
                dy < (enemy.height + this.player.height) / 2) {
                enemy.active = false;
                this.createExplosion(enemy.x, enemy.y);
                if (this.player.hit(this)) {
                    this.createExplosion(this.player.x, this.player.y, '#3498db');
                    this.gameOver();
                }
            }
        }
    }

    update() {
        if (this.state !== 'playing') return;

        // 更新星空背景
        for (let star of this.starfield) {
            star.y += star.speed;
            if (star.y > 640) {
                star.y = 0;
                star.x = Math.random() * 480;
            }
        }

        // 更新玩家
        this.player.update(this.keys, this);

        // 更新子弹
        for (let bullet of this.bullets) {
            bullet.update();
        }
        this.bullets = this.bullets.filter(b => b.active);

        // 生成敌机
        this.enemyTimer++;
        const spawnRate = Math.max(30, 90 - this.difficulty * 5);
        if (this.enemyTimer >= spawnRate) {
            this.enemyTimer = 0;
            this.spawnEnemy();
        }

        // 更新敌机
        for (let enemy of this.enemies) {
            enemy.update(this);
        }
        this.enemies = this.enemies.filter(e => e.active);

        // 更新粒子
        for (let p of this.particles) {
            p.update();
        }
        this.particles = this.particles.filter(p => p.life > 0);

        // 碰撞检测
        this.checkCollisions();

        // 难度递增
        if (this.score > 0 && this.score % 100 === 0) {
            this.difficulty = Math.floor(this.score / 100) + 1;
        }
    }

    draw() {
        // 清空画布
        this.ctx.fillStyle = '#0a0a15';
        this.ctx.fillRect(0, 0, 480, 640);

        // 绘制星空
        this.ctx.fillStyle = '#fff';
        for (let star of this.starfield) {
            this.ctx.globalAlpha = 0.3 + star.size * 0.2;
            this.ctx.fillRect(Math.floor(star.x), Math.floor(star.y), Math.floor(star.size), Math.floor(star.size));
        }
        this.ctx.globalAlpha = 1;

        if (this.state === 'playing' || this.state === 'gameover') {
            // 绘制敌机
            for (let enemy of this.enemies) {
                enemy.draw(this.ctx);
            }

            // 绘制子弹
            for (let bullet of this.bullets) {
                bullet.draw(this.ctx);
            }

            // 绘制粒子
            for (let p of this.particles) {
                p.draw(this.ctx);
            }

            // 绘制玩家
            if (this.player && this.state === 'playing') {
                this.player.draw(this.ctx);
            }

            // 绘制 HUD
            this.drawHUD();
        }
    }

    drawHUD() {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px "Press Start 2P"';

        // 分数
        this.ctx.fillStyle = '#ffe66d';
        this.ctx.fillText('SCORE', 10, 25);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(this.score.toString().padStart(6, '0'), 10, 45);

        // 最高分
        this.ctx.fillStyle = '#888';
        this.ctx.font = '8px "Press Start 2P"';
        this.ctx.fillText('HI ' + this.highScore.toString().padStart(6, '0'), 10, 60);

        // 生命值
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.font = '12px "Press Start 2P"';
        this.ctx.fillText('HP', 400, 25);
        for (let i = 0; i < this.player.maxHp; i++) {
            if (i < this.player.hp) {
                this.ctx.fillStyle = '#ff6b6b';
            } else {
                this.ctx.fillStyle = '#333';
            }
            this.ctx.fillRect(400 + i * 22, 35, 16, 12);
        }

        // 强化等级
        if (this.player.powerLevel > 1) {
            this.ctx.fillStyle = '#00ffff';
            this.ctx.font = '10px "Press Start 2P"';
            this.ctx.fillText('PWR ' + this.player.powerLevel, 380, 60);
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 启动游戏
const game = new Game();
