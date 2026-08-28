<template>
  <div class="rakhi-showcase">
    <!-- Floating Sparkles and Confetti Particles -->
    <div class="sparkles-container" aria-hidden="true">
      <span class="particle p-1">✦</span>
      <span class="particle p-2">✧</span>
      <span class="particle p-3">✦</span>
      <span class="particle p-4">✧</span>
      <span class="particle p-5">✨</span>
      <span class="particle p-6">✦</span>
      <span class="particle p-7">✧</span>
      <div class="confetti c-1"></div>
      <div class="confetti c-2"></div>
      <div class="confetti c-3"></div>
      <div class="confetti c-4"></div>
      <div class="confetti c-5"></div>
      <div class="confetti c-6"></div>
    </div>

    <!-- Central Rakhi Illustration -->
    <div class="rakhi-visual-wrapper">
      <div class="rakhi-glow-backdrop"></div>
      
      <svg
        class="rakhi-svg"
        viewBox="0 0 540 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Festive Rakhi Illustration"
      >
        <defs>
          <!-- Gradients -->
          <linearGradient id="threadGradientLeft" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stop-color="#f59e0b" stop-opacity="0" />
            <stop offset="30%" stop-color="#e11d48" />
            <stop offset="70%" stop-color="#fbbf24" />
            <stop offset="100%" stop-color="#f59e0b" />
          </linearGradient>

          <linearGradient id="threadGradientRight" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stop-color="#f59e0b" />
            <stop offset="30%" stop-color="#fbbf24" />
            <stop offset="70%" stop-color="#e11d48" />
            <stop offset="100%" stop-color="#f59e0b" stop-opacity="0" />
          </linearGradient>

          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fffbeb" />
            <stop offset="25%" stop-color="#fcd34d" />
            <stop offset="50%" stop-color="#f59e0b" />
            <stop offset="75%" stop-color="#d97706" />
            <stop offset="100%" stop-color="#fbbf24" />
          </linearGradient>

          <linearGradient id="rubyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fda4af" />
            <stop offset="35%" stop-color="#f43f5e" />
            <stop offset="75%" stop-color="#be123c" />
            <stop offset="100%" stop-color="#881337" />
          </linearGradient>

          <linearGradient id="purpleSilkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#c084fc" />
            <stop offset="50%" stop-color="#7e22ce" />
            <stop offset="100%" stop-color="#4c1d95" />
          </linearGradient>

          <radialGradient id="sunburstGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#fef08a" stop-opacity="0.9" />
            <stop offset="45%" stop-color="#fb923c" stop-opacity="0.45" />
            <stop offset="80%" stop-color="#e11d48" stop-opacity="0.12" />
            <stop offset="100%" stop-color="#7e22ce" stop-opacity="0" />
          </radialGradient>

          <radialGradient id="centerGemLight" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
            <stop offset="35%" stop-color="#fb7185" stop-opacity="0.75" />
            <stop offset="100%" stop-color="#9f1239" stop-opacity="0.95" />
          </radialGradient>

          <!-- Shadows and Filters -->
          <filter id="goldDropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#92400e" flood-opacity="0.3" />
          </filter>
        </defs>

        <!-- Left Braided Sacred Thread (Dori) -->
        <g class="thread-left">
          <path
            d="M 10 110 C 80 80, 150 140, 215 110"
            stroke="url(#threadGradientLeft)"
            stroke-width="5"
            stroke-linecap="round"
            fill="none"
          />
          <path
            d="M 10 110 C 90 140, 160 80, 215 110"
            stroke="#f59e0b"
            stroke-width="2.2"
            stroke-dasharray="6 4"
            stroke-linecap="round"
            fill="none"
            opacity="0.85"
          />
          <!-- Left Decorative Beads -->
          <circle cx="100" cy="108" r="4.5" fill="url(#goldGradient)" />
          <circle cx="135" cy="115" r="5.5" fill="url(#rubyGradient)" />
          <circle cx="170" cy="106" r="6.5" fill="url(#goldGradient)" filter="url(#goldDropShadow)" />
          <circle cx="195" cy="110" r="4.5" fill="#ffffff" stroke="#f59e0b" stroke-width="1.5" />
          <!-- Tassel fringe at far left -->
          <path d="M 15 110 Q 5 105, 0 102" stroke="#e11d48" stroke-width="2" stroke-linecap="round" />
          <path d="M 15 110 Q 5 110, 0 110" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" />
          <path d="M 15 110 Q 5 115, 0 118" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" />
        </g>

        <!-- Right Braided Sacred Thread (Dori) -->
        <g class="thread-right">
          <path
            d="M 325 110 C 390 80, 460 140, 530 110"
            stroke="url(#threadGradientRight)"
            stroke-width="5"
            stroke-linecap="round"
            fill="none"
          />
          <path
            d="M 325 110 C 380 140, 450 80, 530 110"
            stroke="#f59e0b"
            stroke-width="2.2"
            stroke-dasharray="6 4"
            stroke-linecap="round"
            fill="none"
            opacity="0.85"
          />
          <!-- Right Decorative Beads -->
          <circle cx="345" cy="110" r="4.5" fill="#ffffff" stroke="#f59e0b" stroke-width="1.5" />
          <circle cx="370" cy="106" r="6.5" fill="url(#goldGradient)" filter="url(#goldDropShadow)" />
          <circle cx="405" cy="115" r="5.5" fill="url(#rubyGradient)" />
          <circle cx="440" cy="108" r="4.5" fill="url(#goldGradient)" />
          <!-- Tassel fringe at far right -->
          <path d="M 525 110 Q 535 105, 540 102" stroke="#e11d48" stroke-width="2" stroke-linecap="round" />
          <path d="M 525 110 Q 535 110, 540 110" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" />
          <path d="M 525 110 Q 535 115, 540 118" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" />
        </g>

        <!-- Central Rakhi Dial & Mandala Motif -->
        <g class="rakhi-center" transform="translate(270, 110)">
          <!-- Outer Aura Glow -->
          <circle cx="0" cy="0" r="70" fill="url(#sunburstGlow)" />

          <!-- Outer Ray Petals (Sunburst Golden Mandala) -->
          <g class="mandala-petals">
            <path d="M 0 -64 Q 6 -48 0 -38 Q -6 -48 0 -64 Z" fill="url(#goldGradient)" />
            <circle cx="0" cy="-66" r="2.2" fill="#ffffff" />

            <path d="M 0 -64 Q 6 -48 0 -38 Q -6 -48 0 -64 Z" fill="url(#goldGradient)" transform="rotate(22.5)" />
            <circle cx="0" cy="-66" r="2.2" fill="#ffffff" transform="rotate(22.5)" />

            <path d="M 0 -64 Q 6 -48 0 -38 Q -6 -48 0 -64 Z" fill="url(#goldGradient)" transform="rotate(45)" />
            <circle cx="0" cy="-66" r="2.2" fill="#ffffff" transform="rotate(45)" />

            <path d="M 0 -64 Q 6 -48 0 -38 Q -6 -48 0 -64 Z" fill="url(#goldGradient)" transform="rotate(67.5)" />
            <circle cx="0" cy="-66" r="2.2" fill="#ffffff" transform="rotate(67.5)" />

            <path d="M 0 -64 Q 6 -48 0 -38 Q -6 -48 0 -64 Z" fill="url(#goldGradient)" transform="rotate(90)" />
            <circle cx="0" cy="-66" r="2.2" fill="#ffffff" transform="rotate(90)" />

            <path d="M 0 -64 Q 6 -48 0 -38 Q -6 -48 0 -64 Z" fill="url(#goldGradient)" transform="rotate(112.5)" />
            <circle cx="0" cy="-66" r="2.2" fill="#ffffff" transform="rotate(112.5)" />

            <path d="M 0 -64 Q 6 -48 0 -38 Q -6 -48 0 -64 Z" fill="url(#goldGradient)" transform="rotate(135)" />
            <circle cx="0" cy="-66" r="2.2" fill="#ffffff" transform="rotate(135)" />

            <path d="M 0 -64 Q 6 -48 0 -38 Q -6 -48 0 -64 Z" fill="url(#goldGradient)" transform="rotate(157.5)" />
            <circle cx="0" cy="-66" r="2.2" fill="#ffffff" transform="rotate(157.5)" />

            <path d="M 0 -64 Q 6 -48 0 -38 Q -6 -48 0 -64 Z" fill="url(#goldGradient)" transform="rotate(180)" />
            <circle cx="0" cy="-66" r="2.2" fill="#ffffff" transform="rotate(180)" />

            <path d="M 0 -64 Q 6 -48 0 -38 Q -6 -48 0 -64 Z" fill="url(#goldGradient)" transform="rotate(202.5)" />
            <circle cx="0" cy="-66" r="2.2" fill="#ffffff" transform="rotate(202.5)" />

            <path d="M 0 -64 Q 6 -48 0 -38 Q -6 -48 0 -64 Z" fill="url(#goldGradient)" transform="rotate(225)" />
            <circle cx="0" cy="-66" r="2.2" fill="#ffffff" transform="rotate(225)" />

            <path d="M 0 -64 Q 6 -48 0 -38 Q -6 -48 0 -64 Z" fill="url(#goldGradient)" transform="rotate(247.5)" />
            <circle cx="0" cy="-66" r="2.2" fill="#ffffff" transform="rotate(247.5)" />

            <path d="M 0 -64 Q 6 -48 0 -38 Q -6 -48 0 -64 Z" fill="url(#goldGradient)" transform="rotate(270)" />
            <circle cx="0" cy="-66" r="2.2" fill="#ffffff" transform="rotate(270)" />

            <path d="M 0 -64 Q 6 -48 0 -38 Q -6 -48 0 -64 Z" fill="url(#goldGradient)" transform="rotate(292.5)" />
            <circle cx="0" cy="-66" r="2.2" fill="#ffffff" transform="rotate(292.5)" />

            <path d="M 0 -64 Q 6 -48 0 -38 Q -6 -48 0 -64 Z" fill="url(#goldGradient)" transform="rotate(315)" />
            <circle cx="0" cy="-66" r="2.2" fill="#ffffff" transform="rotate(315)" />

            <path d="M 0 -64 Q 6 -48 0 -38 Q -6 -48 0 -64 Z" fill="url(#goldGradient)" transform="rotate(337.5)" />
            <circle cx="0" cy="-66" r="2.2" fill="#ffffff" transform="rotate(337.5)" />
          </g>

          <!-- Outer Velvet/Silk Ring (Royal Purple & Crimson) -->
          <circle cx="0" cy="0" r="48" fill="url(#purpleSilkGradient)" filter="url(#goldDropShadow)" />
          <circle cx="0" cy="0" r="46" stroke="url(#goldGradient)" stroke-width="1.8" stroke-dasharray="4 2.5" fill="none" />

          <!-- Middle Floral Layer (Ruby Red Petals) -->
          <g class="middle-petals">
            <path d="M 0 -44 C 8 -36 8 -22 0 -18 C -8 -22 -8 -36 0 -44 Z" fill="url(#rubyGradient)" />
            <circle cx="0" cy="-36" r="1.8" fill="url(#goldGradient)" />

            <path d="M 0 -44 C 8 -36 8 -22 0 -18 C -8 -22 -8 -36 0 -44 Z" fill="url(#rubyGradient)" transform="rotate(30)" />
            <circle cx="0" cy="-36" r="1.8" fill="url(#goldGradient)" transform="rotate(30)" />

            <path d="M 0 -44 C 8 -36 8 -22 0 -18 C -8 -22 -8 -36 0 -44 Z" fill="url(#rubyGradient)" transform="rotate(60)" />
            <circle cx="0" cy="-36" r="1.8" fill="url(#goldGradient)" transform="rotate(60)" />

            <path d="M 0 -44 C 8 -36 8 -22 0 -18 C -8 -22 -8 -36 0 -44 Z" fill="url(#rubyGradient)" transform="rotate(90)" />
            <circle cx="0" cy="-36" r="1.8" fill="url(#goldGradient)" transform="rotate(90)" />

            <path d="M 0 -44 C 8 -36 8 -22 0 -18 C -8 -22 -8 -36 0 -44 Z" fill="url(#rubyGradient)" transform="rotate(120)" />
            <circle cx="0" cy="-36" r="1.8" fill="url(#goldGradient)" transform="rotate(120)" />

            <path d="M 0 -44 C 8 -36 8 -22 0 -18 C -8 -22 -8 -36 0 -44 Z" fill="url(#rubyGradient)" transform="rotate(150)" />
            <circle cx="0" cy="-36" r="1.8" fill="url(#goldGradient)" transform="rotate(150)" />

            <path d="M 0 -44 C 8 -36 8 -22 0 -18 C -8 -22 -8 -36 0 -44 Z" fill="url(#rubyGradient)" transform="rotate(180)" />
            <circle cx="0" cy="-36" r="1.8" fill="url(#goldGradient)" transform="rotate(180)" />

            <path d="M 0 -44 C 8 -36 8 -22 0 -18 C -8 -22 -8 -36 0 -44 Z" fill="url(#rubyGradient)" transform="rotate(210)" />
            <circle cx="0" cy="-36" r="1.8" fill="url(#goldGradient)" transform="rotate(210)" />

            <path d="M 0 -44 C 8 -36 8 -22 0 -18 C -8 -22 -8 -36 0 -44 Z" fill="url(#rubyGradient)" transform="rotate(240)" />
            <circle cx="0" cy="-36" r="1.8" fill="url(#goldGradient)" transform="rotate(240)" />

            <path d="M 0 -44 C 8 -36 8 -22 0 -18 C -8 -22 -8 -36 0 -44 Z" fill="url(#rubyGradient)" transform="rotate(270)" />
            <circle cx="0" cy="-36" r="1.8" fill="url(#goldGradient)" transform="rotate(270)" />

            <path d="M 0 -44 C 8 -36 8 -22 0 -18 C -8 -22 -8 -36 0 -44 Z" fill="url(#rubyGradient)" transform="rotate(300)" />
            <circle cx="0" cy="-36" r="1.8" fill="url(#goldGradient)" transform="rotate(300)" />

            <path d="M 0 -44 C 8 -36 8 -22 0 -18 C -8 -22 -8 -36 0 -44 Z" fill="url(#rubyGradient)" transform="rotate(330)" />
            <circle cx="0" cy="-36" r="1.8" fill="url(#goldGradient)" transform="rotate(330)" />
          </g>

          <!-- Golden Beaded Inner Ring -->
          <circle cx="0" cy="0" r="26" fill="url(#goldGradient)" filter="url(#goldDropShadow)" />
          <circle cx="0" cy="-21" r="2.6" fill="#ffffff" stroke="#d97706" stroke-width="0.8" />
          <circle cx="0" cy="-21" r="2.6" fill="#ffffff" stroke="#d97706" stroke-width="0.8" transform="rotate(30)" />
          <circle cx="0" cy="-21" r="2.6" fill="#ffffff" stroke="#d97706" stroke-width="0.8" transform="rotate(60)" />
          <circle cx="0" cy="-21" r="2.6" fill="#ffffff" stroke="#d97706" stroke-width="0.8" transform="rotate(90)" />
          <circle cx="0" cy="-21" r="2.6" fill="#ffffff" stroke="#d97706" stroke-width="0.8" transform="rotate(120)" />
          <circle cx="0" cy="-21" r="2.6" fill="#ffffff" stroke="#d97706" stroke-width="0.8" transform="rotate(150)" />
          <circle cx="0" cy="-21" r="2.6" fill="#ffffff" stroke="#d97706" stroke-width="0.8" transform="rotate(180)" />
          <circle cx="0" cy="-21" r="2.6" fill="#ffffff" stroke="#d97706" stroke-width="0.8" transform="rotate(210)" />
          <circle cx="0" cy="-21" r="2.6" fill="#ffffff" stroke="#d97706" stroke-width="0.8" transform="rotate(240)" />
          <circle cx="0" cy="-21" r="2.6" fill="#ffffff" stroke="#d97706" stroke-width="0.8" transform="rotate(270)" />
          <circle cx="0" cy="-21" r="2.6" fill="#ffffff" stroke="#d97706" stroke-width="0.8" transform="rotate(300)" />
          <circle cx="0" cy="-21" r="2.6" fill="#ffffff" stroke="#d97706" stroke-width="0.8" transform="rotate(330)" />

          <!-- Central Ruby / Gemstone -->
          <circle cx="0" cy="0" r="16" fill="url(#rubyGradient)" />
          <circle cx="0" cy="0" r="16" fill="url(#centerGemLight)" />
          <circle cx="0" cy="0" r="15" stroke="#fef08a" stroke-width="1.2" fill="none" opacity="0.65" />

          <!-- Center Star/Bindu Highlight -->
          <path
            d="M 0 -8 L 2.5 -2.5 L 8 0 L 2.5 2.5 L 0 8 L -2.5 2.5 L -8 0 L -2.5 -2.5 Z"
            fill="#ffffff"
            opacity="0.95"
          />
          <circle cx="0" cy="0" r="2" fill="#fffbeb" />
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup>
// Componentized visual asset for Raksha Bandhan celebration
</script>

<style scoped>
.rakhi-showcase {
  align-items: center;
  display: flex;
  justify-content: center;
  margin: 6px 0 20px;
  position: relative;
  width: 100%;
}

.rakhi-visual-wrapper {
  align-items: center;
  display: flex;
  justify-content: center;
  max-width: 520px;
  position: relative;
  width: 100%;
  animation: floatRakhi 4.5s ease-in-out infinite alternate;
}

.rakhi-glow-backdrop {
  background: radial-gradient(circle, rgba(251, 191, 36, 0.28) 0%, rgba(225, 29, 72, 0.15) 45%, rgba(126, 34, 206, 0.08) 70%, transparent 85%);
  border-radius: 50%;
  filter: blur(28px);
  height: 220px;
  pointer-events: none;
  position: absolute;
  width: 220px;
  z-index: 0;
  animation: pulseGlow 4s ease-in-out infinite alternate;
}

.rakhi-svg {
  filter: drop-shadow(0 12px 24px rgba(180, 83, 9, 0.16));
  height: auto;
  overflow: visible;
  position: relative;
  width: 100%;
  z-index: 1;
}

/* Floating sparkles */
.sparkles-container {
  inset: 0;
  overflow: visible;
  pointer-events: none;
  position: absolute;
  z-index: 2;
}

.particle {
  color: #fbbf24;
  font-size: 14px;
  opacity: 0.85;
  position: absolute;
  text-shadow: 0 0 10px rgba(251, 191, 36, 0.8);
  user-select: none;
  animation: twinkle 3s ease-in-out infinite alternate;
}

.p-1 { top: 5%; left: 14%; font-size: 16px; color: #f59e0b; animation-delay: 0.2s; }
.p-2 { top: 15%; right: 16%; font-size: 12px; color: #fda4af; animation-delay: 0.8s; }
.p-3 { bottom: 12%; left: 20%; font-size: 15px; color: #fbbf24; animation-delay: 1.4s; }
.p-4 { bottom: 8%; right: 22%; font-size: 13px; color: #c084fc; animation-delay: 0.5s; }
.p-5 { top: 2%; right: 35%; font-size: 17px; color: #fde047; animation-delay: 1.1s; }
.p-6 { top: 78%; left: 42%; font-size: 11px; color: #fb7185; animation-delay: 1.7s; }
.p-7 { top: 30%; left: 6%; font-size: 14px; color: #fbbf24; animation-delay: 0.9s; }

/* Subtle Confetti Dots */
.confetti {
  border-radius: 50%;
  opacity: 0.75;
  position: absolute;
  animation: floatConfetti 5s ease-in-out infinite alternate;
}

.c-1 { width: 7px; height: 7px; background: #e11d48; top: 18%; left: 24%; animation-delay: 0.3s; }
.c-2 { width: 6px; height: 6px; background: #9333ea; top: 22%; right: 26%; animation-delay: 1.2s; }
.c-3 { width: 8px; height: 8px; background: #f59e0b; bottom: 20%; left: 28%; animation-delay: 0.7s; }
.c-4 { width: 5px; height: 5px; background: #ec4899; bottom: 18%; right: 18%; animation-delay: 1.5s; }
.c-5 { width: 6px; height: 6px; background: #fbbf24; top: 38%; right: 10%; animation-delay: 0.4s; }
.c-6 { width: 7px; height: 7px; background: #d946ef; bottom: 32%; left: 12%; animation-delay: 1.9s; }

@keyframes floatRakhi {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
  100% { transform: translateY(4px); }
}

@keyframes pulseGlow {
  0% { transform: scale(0.94); opacity: 0.6; }
  100% { transform: scale(1.08); opacity: 0.92; }
}

@keyframes twinkle {
  0% { transform: scale(0.7) rotate(0deg); opacity: 0.35; }
  50% { transform: scale(1.15) rotate(45deg); opacity: 1; }
  100% { transform: scale(0.85) rotate(90deg); opacity: 0.45; }
}

@keyframes floatConfetti {
  0% { transform: translateY(0) scale(0.9); }
  50% { transform: translateY(-7px) scale(1.1); }
  100% { transform: translateY(5px) scale(1); }
}

@media (max-width: 980px) {
  .rakhi-showcase {
    margin: 4px 0 14px;
  }
  .rakhi-visual-wrapper {
    max-width: 360px;
  }
}
</style>
