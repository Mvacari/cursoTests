'use client';

import { useEffect, useRef, useState } from 'react';

interface Bullet {
  x: number;
  y: number;
  speed: number;
  isPlayerBullet: boolean;
}

interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Explosion {
  x: number;
  y: number;
  particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
  }>;
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 30;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 7;
const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 30;
const ENEMY_SPEED = 1;
const ENEMY_ROWS = 5;
const ENEMY_COLS = 10;
const ENEMY_SPACING = 60;
const ENEMY_START_Y = 50;

export default function SpaceInvaders() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  
  const playerXRef = useRef(CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2);
  const playerYRef = useRef(CANVAS_HEIGHT - 50);
  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const starsRef = useRef<Star[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const enemyDirectionRef = useRef(1);
  const enemyMoveTimerRef = useRef(0);
  const enemyShootTimerRef = useRef(0);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Initialize enemies and stars
  useEffect(() => {
    const enemies: Enemy[] = [];
    for (let row = 0; row < ENEMY_ROWS; row++) {
      for (let col = 0; col < ENEMY_COLS; col++) {
        enemies.push({
          x: col * ENEMY_SPACING + 50,
          y: row * ENEMY_SPACING + ENEMY_START_Y,
          width: ENEMY_WIDTH,
          height: ENEMY_HEIGHT,
        });
      }
    }
    enemiesRef.current = enemies;

    // Initialize stars
    const stars: Star[] = [];
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.2,
        opacity: Math.random() * 0.5 + 0.5,
      });
    }
    starsRef.current = stars;
  }, []);

  // Function to create explosion
  const createExplosion = (x: number, y: number) => {
    const particles = [];
    for (let i = 0; i < 15; i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        maxLife: 1,
      });
    }
    explosionsRef.current.push({ x, y, particles });
  };

  // Function to draw alien sprite (mosquito-like)
  const drawAlien = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    ctx.save();
    
    // Alien body (elongated mosquito body)
    ctx.fillStyle = '#2d5016';
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + height * 0.6, width * 0.35, height * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Mosquito head (round)
    ctx.fillStyle = '#1a3009';
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height * 0.25, width * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Large compound eyes (mosquito-style)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x + width * 0.35, y + height * 0.2, width * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + width * 0.65, y + height * 0.2, width * 0.12, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye highlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + width * 0.37, y + height * 0.18, width * 0.03, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + width * 0.67, y + height * 0.18, width * 0.03, 0, Math.PI * 2);
    ctx.fill();
    
    // Proboscis (mosquito mouth/nose - long and pointy)
    ctx.strokeStyle = '#1a3009';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y + height * 0.35);
    ctx.lineTo(x + width / 2, y + height * 0.55);
    ctx.stroke();
    
    // Proboscis tip
    ctx.fillStyle = '#8b0000';
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height * 0.55, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Antennae (mosquito-style, feathery)
    ctx.strokeStyle = '#1a3009';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + width * 0.3, y + height * 0.15);
    ctx.lineTo(x + width * 0.2, y + height * 0.05);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + width * 0.7, y + height * 0.15);
    ctx.lineTo(x + width * 0.8, y + height * 0.05);
    ctx.stroke();
    
    // Antennae tips (feathery)
    ctx.strokeStyle = '#1a3009';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + width * 0.2, y + height * 0.05);
    ctx.lineTo(x + width * 0.15, y + height * 0.02);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + width * 0.2, y + height * 0.05);
    ctx.lineTo(x + width * 0.25, y + height * 0.02);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + width * 0.8, y + height * 0.05);
    ctx.lineTo(x + width * 0.75, y + height * 0.02);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + width * 0.8, y + height * 0.05);
    ctx.lineTo(x + width * 0.85, y + height * 0.02);
    ctx.stroke();
    
    // Legs (mosquito-style, thin and segmented)
    ctx.strokeStyle = '#1a3009';
    ctx.lineWidth = 2;
    // Front legs
    ctx.beginPath();
    ctx.moveTo(x + width * 0.25, y + height * 0.4);
    ctx.lineTo(x + width * 0.15, y + height * 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + width * 0.75, y + height * 0.4);
    ctx.lineTo(x + width * 0.85, y + height * 0.7);
    ctx.stroke();
    // Middle legs
    ctx.beginPath();
    ctx.moveTo(x + width * 0.4, y + height * 0.5);
    ctx.lineTo(x + width * 0.35, y + height * 0.75);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + width * 0.6, y + height * 0.5);
    ctx.lineTo(x + width * 0.65, y + height * 0.75);
    ctx.stroke();
    // Back legs
    ctx.beginPath();
    ctx.moveTo(x + width * 0.5, y + height * 0.6);
    ctx.lineTo(x + width * 0.45, y + height * 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + width * 0.5, y + height * 0.6);
    ctx.lineTo(x + width * 0.55, y + height * 0.8);
    ctx.stroke();
    
    ctx.restore();
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (e.key === ' ' && !gameOver) {
        e.preventDefault();
        // Add player bullet
        bulletsRef.current.push({
          x: playerXRef.current + PLAYER_WIDTH / 2,
          y: playerYRef.current,
          speed: -BULLET_SPEED,
          isPlayerBullet: true,
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameOver]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = (timestamp: number) => {
      if (gameOver) return;

      // Draw pink background
      ctx.fillStyle = '#ff69b4';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Update and draw stars
      starsRef.current.forEach((star) => {
        star.y += star.speed;
        if (star.y > CANVAS_HEIGHT) {
          star.y = 0;
          star.x = Math.random() * CANVAS_WIDTH;
        }
        
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Handle player movement
      if (keysRef.current['ArrowLeft'] && playerXRef.current > 0) {
        playerXRef.current -= PLAYER_SPEED;
      }
      if (keysRef.current['ArrowRight'] && playerXRef.current < CANVAS_WIDTH - PLAYER_WIDTH) {
        playerXRef.current += PLAYER_SPEED;
      }

      // Move enemies
      enemyMoveTimerRef.current += 1;
      if (enemyMoveTimerRef.current >= 30) {
        enemyMoveTimerRef.current = 0;
        let shouldMoveDown = false;

        enemiesRef.current.forEach((enemy) => {
          if (
            (enemy.x <= 0 && enemyDirectionRef.current < 0) ||
            (enemy.x + ENEMY_WIDTH >= CANVAS_WIDTH && enemyDirectionRef.current > 0)
          ) {
            shouldMoveDown = true;
          }
        });

        if (shouldMoveDown) {
          enemyDirectionRef.current *= -1;
          enemiesRef.current.forEach((enemy) => {
            enemy.y += 20;
          });
        } else {
          enemiesRef.current.forEach((enemy) => {
            enemy.x += ENEMY_SPEED * enemyDirectionRef.current;
          });
        }
      }

      // Enemy shooting
      enemyShootTimerRef.current += 1;
      if (enemyShootTimerRef.current >= 60 && enemiesRef.current.length > 0) {
        enemyShootTimerRef.current = 0;
        const randomEnemy = enemiesRef.current[Math.floor(Math.random() * enemiesRef.current.length)];
        bulletsRef.current.push({
          x: randomEnemy.x + ENEMY_WIDTH / 2,
          y: randomEnemy.y + ENEMY_HEIGHT,
          speed: BULLET_SPEED,
          isPlayerBullet: false,
        });
      }

      // Update bullets
      bulletsRef.current = bulletsRef.current.filter((bullet) => {
        bullet.y += bullet.speed;
        return bullet.y > 0 && bullet.y < CANVAS_HEIGHT;
      });

      // Collision detection: player bullets vs enemies
      bulletsRef.current = bulletsRef.current.filter((bullet) => {
        if (!bullet.isPlayerBullet) return true;

        let hit = false;
        enemiesRef.current = enemiesRef.current.filter((enemy) => {
          if (
            bullet.x >= enemy.x &&
            bullet.x <= enemy.x + ENEMY_WIDTH &&
            bullet.y >= enemy.y &&
            bullet.y <= enemy.y + ENEMY_HEIGHT
          ) {
            hit = true;
            createExplosion(enemy.x + ENEMY_WIDTH / 2, enemy.y + ENEMY_HEIGHT / 2);
            setScore((prev) => prev + 10);
            return false;
          }
          return true;
        });

        return !hit;
      });

      // Update explosions
      explosionsRef.current = explosionsRef.current.filter((explosion) => {
        explosion.particles = explosion.particles.filter((particle) => {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.life -= 0.02;
          return particle.life > 0;
        });
        return explosion.particles.length > 0;
      });

      // Collision detection: enemy bullets vs player
      bulletsRef.current = bulletsRef.current.filter((bullet) => {
        if (bullet.isPlayerBullet) return true;

        if (
          bullet.x >= playerXRef.current &&
          bullet.x <= playerXRef.current + PLAYER_WIDTH &&
          bullet.y >= playerYRef.current &&
          bullet.y <= playerYRef.current + PLAYER_HEIGHT
        ) {
          setGameOver(true);
          return false;
        }
        return true;
      });

      // Check if enemies reached player
      enemiesRef.current.forEach((enemy) => {
        if (enemy.y + ENEMY_HEIGHT >= playerYRef.current) {
          setGameOver(true);
        }
      });

      // Check win condition
      if (enemiesRef.current.length === 0) {
        setGameOver(true);
      }

      // Draw explosions
      explosionsRef.current.forEach((explosion) => {
        explosion.particles.forEach((particle) => {
          const alpha = particle.life / particle.maxLife;
          const size = 3 * alpha;
          ctx.fillStyle = `rgba(255, ${Math.floor(255 * (1 - alpha))}, 0, ${alpha})`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      // Draw player (spaceship)
      ctx.fillStyle = '#0f0';
      ctx.beginPath();
      ctx.moveTo(playerXRef.current + PLAYER_WIDTH / 2, playerYRef.current);
      ctx.lineTo(playerXRef.current, playerYRef.current + PLAYER_HEIGHT);
      ctx.lineTo(playerXRef.current + PLAYER_WIDTH * 0.3, playerYRef.current + PLAYER_HEIGHT * 0.7);
      ctx.lineTo(playerXRef.current + PLAYER_WIDTH * 0.7, playerYRef.current + PLAYER_HEIGHT * 0.7);
      ctx.lineTo(playerXRef.current + PLAYER_WIDTH, playerYRef.current + PLAYER_HEIGHT);
      ctx.closePath();
      ctx.fill();

      // Draw aliens
      enemiesRef.current.forEach((enemy) => {
        drawAlien(ctx, enemy.x, enemy.y, enemy.width, enemy.height);
      });

      // Draw bullets
      ctx.fillStyle = '#fff';
      bulletsRef.current.forEach((bullet) => {
        ctx.fillRect(bullet.x - 2, bullet.y - 5, 4, 10);
      });

      // Draw score
      ctx.fillStyle = '#fff';
      ctx.font = '20px Arial';
      ctx.fillText(`Score: ${score}`, 10, 30);

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameOver, score]);

  const handleRestart = () => {
    setGameOver(false);
    setScore(0);
    playerXRef.current = CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2;
    playerYRef.current = CANVAS_HEIGHT - 50;
    bulletsRef.current = [];
    explosionsRef.current = [];
    enemyDirectionRef.current = 1;
    enemyMoveTimerRef.current = 0;
    enemyShootTimerRef.current = 0;
    
    // Reinitialize enemies
    const enemies: Enemy[] = [];
    for (let row = 0; row < ENEMY_ROWS; row++) {
      for (let col = 0; col < ENEMY_COLS; col++) {
        enemies.push({
          x: col * ENEMY_SPACING + 50,
          y: row * ENEMY_SPACING + ENEMY_START_Y,
          width: ENEMY_WIDTH,
          height: ENEMY_HEIGHT,
        });
      }
    }
    enemiesRef.current = enemies;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-pink-500 p-4">
      <h1 className="text-white text-3xl font-bold mb-4">Space Invaders</h1>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-white"
        />
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80">
            <div className="text-white text-center">
              <h2 className="text-4xl font-bold mb-4">
                {enemiesRef.current.length === 0 ? 'You Win!' : 'Game Over'}
              </h2>
              <p className="text-2xl mb-4">Final Score: {score}</p>
              <button
                onClick={handleRestart}
                className="px-6 py-3 bg-green-600 text-white font-bold rounded hover:bg-green-700 transition-colors"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="text-white mt-4 text-center">
        <p>Use ← → arrow keys to move, Spacebar to shoot</p>
      </div>
    </div>
  );
}

