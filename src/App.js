import React, { useEffect, useRef, useState } from 'react';
import styles from './App.module.css';
import './App.css';

function getParam(key) {
  try {
    return new URLSearchParams(window.location.search).get(key);
  } catch (e) {
    return null;
  }
}

const QUESTIONS = [
  "It's your special day — are you ready to celebrate?",
  'Did you enjoy your birthday?',
  'Do you love me? ❤️',
];

function randomPosition(containerRect, btnRect) {
  const maxLeft = Math.max(8, containerRect.width - btnRect.width - 8);
  const maxTop = Math.max(8, containerRect.height - btnRect.height - 8);
  return {
    left: Math.floor(Math.random() * maxLeft) + 'px',
    top: Math.floor(Math.random() * maxTop) + 'px',
  };
}

function App() {
  const friend = getParam('friend') || 'Friend';
  // If you want to use a local image, place `hadi.jpeg` in `public/images/`
  // and open the app with `?photo=/images/hadi.jpeg`. Default to that path.
  const photo = getParam('photo') || '/images/zod.jpeg';

  const [index, setIndex] = useState(0);
  const [noCounts, setNoCounts] = useState({});
  const [emoji, setEmoji] = useState(null);
  const [emojiMsg, setEmojiMsg] = useState('');
  const [noStyle, setNoStyle] = useState({});
  const containerRef = useRef(null);
  const noRef = useRef(null);
  const buttonsRef = useRef(null);
  const fxRef = useRef(null);
  const roamIntervalRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    // Reset no button position when question changes
    setNoStyle({});
    setEmoji(null);
    setEmojiMsg('');
  }, [index]);

  useEffect(() => {
    // launch short fireworks on initial load
    const canvas = fxRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);

    const particles = [];
    function spawnBurst(x, y, color) {
      const count = 24 + Math.floor(Math.random() * 20);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = 1 + Math.random() * 4;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed * (0.6 + Math.random()),
          vy: Math.sin(angle) * speed * (0.6 + Math.random()),
          life: 60 + Math.random() * 40,
          age: 0,
          color,
          size: 2 + Math.random() * 3,
        });
      }
    }

    const colors = ['#ffd166', '#ff6b81', '#9ad3bc', '#a0e7ff', '#ffd1dc'];

    let frames = 0;
    function loop() {
      rafRef.current = requestAnimationFrame(loop);
      frames++;
      ctx.clearRect(0, 0, w, h);
      if (frames < 90 && Math.random() < 0.08) {
        spawnBurst(Math.random() * w, Math.random() * (h * 0.6) + 40, colors[Math.floor(Math.random() * colors.length)]);
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += 0.04; // gravity
        p.x += p.vx;
        p.y += p.vy;
        p.age++;
        const alpha = 1 - p.age / p.life;
        if (alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // stop after short duration
      if (frames > 220 && particles.length === 0) {
        cancelAnimationFrame(rafRef.current);
      }
    }
    loop();

    // one more central burst
    setTimeout(() => spawnBurst(w / 2, h / 3, colors[1]), 120);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      // cleanup roaming interval and any RAF
      if (roamIntervalRef.current) {
        clearInterval(roamIntervalRef.current);
        roamIntervalRef.current = null;
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleYes = () => {
    if (index < QUESTIONS.length - 1) {
      setIndex((i) => i + 1);
    } else {
      setIndex((i) => i + 1); // show success state
    }
  };

  const handleNo = () => {
    const key = index;
    const count = (noCounts[key] || 0) + 1;
    setNoCounts((s) => ({ ...s, [key]: count }));

    const q = QUESTIONS[index] || '';
    if (q.includes('Do you love me')) {
      if (count === 1) {
        setEmoji('😢');
        setEmojiMsg('Soch ke batao 💔');
      } else if (count === 2) {
        setEmoji('😭');
        setEmojiMsg('Please dobara socho 😭');
      } else {
        setEmoji('🥺');
        setEmojiMsg('...' );
        // start avoiding cursor
        moveNoToRandom();
      }
    } else {
      // for other questions show a gentle sad reaction on first no
      if (count === 1) {
        setEmoji('😔');
        setEmojiMsg('Oh no!');
      } else {
        moveNoToRandom();
      }
    }
  };

  const moveNoToRandom = () => {
    // compute position relative to the buttons container to avoid scrolling
    const box = buttonsRef.current || containerRef.current;
    const btn = noRef.current;
    if (!box || !btn) return;
    const cRect = box.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();
    const pos = randomPosition({ width: cRect.width, height: cRect.height }, { width: bRect.width, height: bRect.height });
    setNoStyle({ position: 'absolute', left: pos.left, top: pos.top });
  };

  const handleNoHover = () => {
    const key = index;
    const count = noCounts[key] || 0;
    // after the third No click start roaming continuously while hovered
    if (count >= 3) {
      if (roamIntervalRef.current) return;
      roamIntervalRef.current = setInterval(() => {
        moveNoToRandom();
      }, 360);
    } else if (count >= 2) {
      moveNoToRandom();
    }
  };

  const stopRoam = () => {
    if (roamIntervalRef.current) {
      clearInterval(roamIntervalRef.current);
      roamIntervalRef.current = null;
    }
  };

  const [giftOpened, setGiftOpened] = useState(false);
  const [balloons, setBalloons] = useState([]);

  const startCelebration = () => {
    const canvas = fxRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let particles = [];
    function spawnBurst(x, y, color) {
      const count = 28 + Math.floor(Math.random() * 24);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 5;
        particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 70 + Math.random() * 60, age: 0, color, size: 2 + Math.random() * 3 });
      }
    }

    const colors = ['#ffd166', '#ff6b81', '#9ad3bc', '#a0e7ff', '#ffd1dc', '#ffe8a1'];
    const start = Date.now();
    function loop() {
      rafRef.current = requestAnimationFrame(loop);
      ctx.clearRect(0, 0, w, h);
      // spawn for 5s
      if (Date.now() - start < 5000 && Math.random() < 0.25) {
        spawnBurst(Math.random() * w, Math.random() * h * 0.6 + 40, colors[Math.floor(Math.random() * colors.length)]);
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += 0.03;
        p.x += p.vx;
        p.y += p.vy;
        p.age++;
        const alpha = 1 - p.age / p.life;
        if (alpha <= 0) particles.splice(i, 1);
        else {
          ctx.beginPath();
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, alpha);
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      if (Date.now() - start > 7000 && particles.length === 0) {
        cancelAnimationFrame(rafRef.current);
      }
    }
    loop();
  };

  const openGift = () => {
    setGiftOpened(true);
    // spawn some balloon descriptors
    const items = Array.from({ length: 8 }).map((_, i) => ({ id: i, left: Math.random() * 80 + '%', delay: Math.random() * 1000 }));
    setBalloons(items);
    startCelebration();
  };

  const isFinished = index >= QUESTIONS.length;

  return (
    <div className={styles.app} ref={containerRef}>
      <div className={styles.fireworks} />
      <canvas ref={fxRef} className={styles.fxCanvas} />
      <div className={styles.centerCard}>
        <div className={styles.photoRing}>
          <img src={photo} alt={friend} className={styles.photo} />
        </div>
        <h1 className={styles.heading}>Happy Birthday 🎉</h1>
        <h2 className={styles.friendName}>{friend}</h2>

        {!isFinished ? (
          <div className={styles.questionBox}>
            <div className={styles.questionInner}>
              {emoji && (
                <div className={styles.emojiWrap} key={emoji}>
                  <span className={styles.emoji}>{emoji}</span>
                  <div className={styles.emojiMsg}>{emojiMsg}</div>
                </div>
              )}
              <div className={styles.questionText}>{QUESTIONS[index]}</div>
              <div className={styles.buttonsRow} ref={buttonsRef}>
                <button className={styles.yesBtn} onClick={handleYes}>
                  Yes
                </button>
                <div style={{ position: 'relative' }} onMouseLeave={stopRoam} onTouchEnd={stopRoam}>
                  <button
                    ref={noRef}
                    className={styles.noBtn}
                    onClick={handleNo}
                    onMouseEnter={handleNoHover}
                    onTouchStart={handleNoHover}
                    onTouchEnd={stopRoam}
                    style={noStyle}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.successBox}>
            {!giftOpened ? (
              <div className={styles.giftBoxWrap}>
                <img 
                  src="https://images.emojiterra.com/mozilla/512px/1f381.png" 
                  alt="Closed gift box" 
                  className={styles.giftBoxImage}
                />
                <div className={styles.giftControls}>
                  <div className={styles.giftTitle}>Your birthday gift</div>
                  <button className={styles.openBtn} onClick={openGift}>Open</button>
                </div>
              </div>
            ) : (
              <div className={styles.celebrationWrap}>
                <div className={styles.celebrationMsg}>May you live long My dear bestie 🎂🎈❤️</div>
                <img 
                  src="https://images.emojiterra.com/mozilla/512px/1f381.png" 
                  alt="Opened gift box" 
                  className={styles.openedBoxImage}
                />
                <div className={styles.balloonLayer}>
                  {balloons.map((b) => (
                    <span key={b.id} className={styles.balloon} style={{ left: b.left, animationDelay: b.delay + 'ms' }}>
                      🎈
                    </span>
                  ))}
                </div>
                
              </div>
            )}
          </div>
        )}
      </div>
      {/* <div className={styles.footer}>Share this link with someone special</div> */}
    </div>
  );
}

export default App;
