<template>
  <div class="ganesh-showcase">
    <!-- Floating Sparkles, Marigold Petals and Motes -->
    <div class="sparkles-container" aria-hidden="true">
      <span class="particle p-1">✦</span>
      <span class="particle p-2">🌺</span>
      <span class="particle p-3">✨</span>
      <span class="particle p-4">✧</span>
      <span class="particle p-5">✦</span>
      <span class="particle p-6">🌺</span>
      <span class="particle p-7">✨</span>
      <div class="confetti c-1"></div>
      <div class="confetti c-2"></div>
      <div class="confetti c-3"></div>
      <div class="confetti c-4"></div>
      <div class="confetti c-5"></div>
      <div class="confetti c-6"></div>
    </div>

    <!-- Central Ganesh Utsav Visual Illustration -->
    <div class="ganesh-visual-wrapper">
      <div class="ganesh-glow-backdrop"></div>

      <svg
        class="ganesh-svg"
        viewBox="0 0 560 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Ganesh Utsav Festive Illustration"
      >
        <defs>
          <!-- Gradients -->
          <linearGradient id="goldCrownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fffbeb" />
            <stop offset="25%" stop-color="#fde047" />
            <stop offset="55%" stop-color="#f59e0b" />
            <stop offset="85%" stop-color="#d97706" />
            <stop offset="100%" stop-color="#92400e" />
          </linearGradient>

          <linearGradient id="saffronGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fdba74" />
            <stop offset="40%" stop-color="#f97316" />
            <stop offset="80%" stop-color="#ea580c" />
            <stop offset="100%" stop-color="#c2410c" />
          </linearGradient>

          <linearGradient id="vermilionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fca5a5" />
            <stop offset="40%" stop-color="#ef4444" />
            <stop offset="80%" stop-color="#dc2626" />
            <stop offset="100%" stop-color="#991b1b" />
          </linearGradient>

          <linearGradient id="modakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="35%" stop-color="#fef08a" />
            <stop offset="70%" stop-color="#f59e0b" />
            <stop offset="100%" stop-color="#b45309" />
          </linearGradient>

          <linearGradient id="diyaBrassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a" />
            <stop offset="50%" stop-color="#d97706" />
            <stop offset="100%" stop-color="#78350f" />
          </linearGradient>

          <linearGradient id="flameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#dc2626" />
            <stop offset="35%" stop-color="#ea580c" />
            <stop offset="75%" stop-color="#facc15" />
            <stop offset="100%" stop-color="#ffffff" />
          </linearGradient>

          <radialGradient id="saffronAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#f97316" stop-opacity="0.8" />
            <stop offset="45%" stop-color="#fbbf24" stop-opacity="0.4" />
            <stop offset="80%" stop-color="#ef4444" stop-opacity="0.12" />
            <stop offset="100%" stop-color="#ea580c" stop-opacity="0" />
          </radialGradient>

          <!-- Drop Shadows & Filters -->
          <filter id="elementShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#7c2d12" flood-opacity="0.28" />
          </filter>
          <filter id="flameGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Ambient Background Radial Aura -->
        <circle cx="280" cy="130" r="115" fill="url(#saffronAura)" />

        <!-- HIBISCUS FLOWER (JASWAND) - LEFT ACCENT -->
        <g class="hibiscus-group" transform="translate(110, 150)" filter="url(#elementShadow)">
          <!-- 5 Flower Petals -->
          <path d="M 0 0 C -25 -35 -55 -20 -40 10 C -30 25 -10 15 0 0 Z" fill="url(#vermilionGrad)" />
          <path d="M 0 0 C -45 5 -45 40 -15 45 C 5 40 5 15 0 0 Z" fill="url(#vermilionGrad)" transform="rotate(72)" />
          <path d="M 0 0 C -45 5 -45 40 -15 45 C 5 40 5 15 0 0 Z" fill="url(#vermilionGrad)" transform="rotate(144)" />
          <path d="M 0 0 C -45 5 -45 40 -15 45 C 5 40 5 15 0 0 Z" fill="url(#vermilionGrad)" transform="rotate(216)" />
          <path d="M 0 0 C -45 5 -45 40 -15 45 C 5 40 5 15 0 0 Z" fill="url(#vermilionGrad)" transform="rotate(288)" />

          <!-- Inner Petal Shadow Lines -->
          <circle cx="0" cy="0" r="12" fill="#7f1d1d" opacity="0.6" />

          <!-- Golden Stamen (Central Filament) -->
          <path d="M 0 0 Q -15 -25 -30 -42" stroke="url(#goldCrownGrad)" stroke-width="3" stroke-linecap="round" />
          <!-- Stamen Anthers (Golden Studs) -->
          <circle cx="-30" cy="-42" r="3" fill="#fef08a" />
          <circle cx="-26" cy="-38" r="2.2" fill="#fde047" />
          <circle cx="-32" cy="-36" r="2" fill="#fde047" />
          <circle cx="-22" cy="-44" r="2" fill="#fef08a" />
        </g>

        <!-- BRASS DIYA (LAMP) - RIGHT ACCENT -->
        <g class="diya-group" transform="translate(440, 160)" filter="url(#elementShadow)">
          <!-- Diya Base Stand -->
          <ellipse cx="0" cy="24" rx="22" ry="6" fill="#78350f" />
          <path d="M -12 24 L -6 14 L 6 14 L 12 24 Z" fill="url(#diyaBrassGrad)" />

          <!-- Diya Bowl -->
          <path
            d="M -35 8 C -35 24, -20 28, 0 28 C 20 28, 35 24, 35 8 C 35 0, 22 2, 0 2 C -22 2, -35 0, -35 8 Z"
            fill="url(#diyaBrassGrad)"
          />
          <ellipse cx="0" cy="4" rx="33" ry="7" fill="#f59e0b" stroke="#78350f" stroke-width="1" />
          <ellipse cx="0" cy="4" rx="28" ry="5" fill="#78350f" />

          <!-- Glowing Oil Pool inside Diya -->
          <ellipse cx="0" cy="4" rx="24" ry="4" fill="#d97706" />

          <!-- Flame Wick & Glowing Fire Flame -->
          <path d="M -2 4 L -1 -6 L 1 -6 L 2 4 Z" fill="#451a03" />
          <!-- Flame Body -->
          <g filter="url(#flameGlow)">
            <path
              d="M 0 -8 C -10 -20, -12 -34, 0 -48 C 12 -34, 10 -20, 0 -8 Z"
              fill="url(#flameGrad)"
            />
            <path
              d="M 0 -10 C -5 -20, -6 -28, 0 -38 C 6 -28, 5 -20, 0 -10 Z"
              fill="#ffffff"
              opacity="0.9"
            />
          </g>
        </g>

        <!-- CENTRAL LORD GANESHA MUKUT, TILAK & MODAK SILHOUETTE -->
        <g class="ganesha-center-group" transform="translate(280, 125)" filter="url(#elementShadow)">
          <!-- Aura Backdrop Sunburst Rays -->
          <g class="crown-rays" opacity="0.85">
            <line x1="0" y1="-85" x2="0" y2="-105" stroke="#fde047" stroke-width="2.5" stroke-linecap="round" />
            <line x1="0" y1="-85" x2="0" y2="-105" stroke="#fde047" stroke-width="2.5" stroke-linecap="round" transform="rotate(20)" />
            <line x1="0" y1="-85" x2="0" y2="-105" stroke="#fde047" stroke-width="2.5" stroke-linecap="round" transform="rotate(-20)" />
            <line x1="0" y1="-85" x2="0" y2="-105" stroke="#fde047" stroke-width="2" stroke-linecap="round" transform="rotate(40)" />
            <line x1="0" y1="-85" x2="0" y2="-105" stroke="#fde047" stroke-width="2" stroke-linecap="round" transform="rotate(-40)" />
          </g>

          <!-- Golden Mukut (Crown) -->
          <path
            d="M -45 -35 Q 0 -95 45 -35 Q 30 -30 0 -28 Q -30 -30 -45 -35 Z"
            fill="url(#goldCrownGrad)"
          />
          <!-- Mukut Layers & Jewels -->
          <path
            d="M -35 -45 Q 0 -90 35 -45 Q 22 -42 0 -40 Q -22 -42 -35 -45 Z"
            fill="url(#saffronGrad)"
          />
          <polygon points="0,-88 8,-72 0,-68 -8,-72" fill="#ef4444" />
          <circle cx="0" cy="-60" r="5" fill="#ef4444" stroke="#fde047" stroke-width="1.5" />
          <circle cx="-20" cy="-45" r="3.5" fill="#38bdf8" />
          <circle cx="20" cy="-45" r="3.5" fill="#38bdf8" />

          <!-- Base Band of Crown -->
          <rect x="-42" y="-35" width="84" height="10" rx="4" fill="url(#goldCrownGrad)" />
          <circle cx="0" cy="-30" r="3" fill="#dc2626" />
          <circle cx="-18" cy="-30" r="2.5" fill="#10b981" />
          <circle cx="18" cy="-30" r="2.5" fill="#10b981" />

          <!-- Serene Ganesha Ears (Surpa-Karna) -->
          <!-- Left Ear -->
          <path
            d="M -40 -25 C -75 -25 -85 10 -55 35 C -45 42 -38 32 -38 20 C -38 0 -38 -15 -40 -25 Z"
            fill="url(#goldCrownGrad)"
            opacity="0.95"
          />
          <path
            d="M -45 -18 C -68 -18 -75 8 -52 26 C -44 30 -40 22 -40 12 Z"
            fill="url(#saffronGrad)"
            opacity="0.8"
          />
          <!-- Right Ear -->
          <path
            d="M 40 -25 C 75 -25 85 10 55 35 C 45 42 38 32 38 20 C 38 0 38 -15 40 -25 Z"
            fill="url(#goldCrownGrad)"
            opacity="0.95"
          />
          <path
            d="M 45 -18 C 68 -18 75 8 52 26 C 44 30 40 22 40 12 Z"
            fill="url(#saffronGrad)"
            opacity="0.8"
          />

          <!-- Sacred Vermilion Tilak (Trishul & Red Bindi) -->
          <g class="tilak-motif" transform="translate(0, -12)">
            <path
              d="M -10 -8 Q 0 -4 10 -8 Q 12 8 0 16 Q -12 8 -10 -8 Z"
              fill="url(#vermilionGrad)"
            />
            <path
              d="M -14 -12 C -6 -8 -4 4 0 12 C 4 4 6 -8 14 -12 C 8 -8 4 -4 0 -2 C -4 -4 -8 -8 -14 -12 Z"
              fill="url(#goldCrownGrad)"
            />
            <circle cx="0" cy="2" r="3.5" fill="#fde047" />
          </g>

          <!-- Vakratunda Curved Trunk holding Modak -->
          <path
            d="M -12 8 C -12 35, 12 40, 16 60 C 20 78, -5 95, -28 92 C -38 90, -42 78, -32 75 C -22 72, -10 78, -8 68 C -6 55, -22 45, -22 25 Z"
            fill="url(#goldCrownGrad)"
          />
          <path
            d="M -8 14 C -8 35, 8 40, 12 56 C 14 70, -5 85, -24 82 C -28 81, -30 76, -24 74 C -16 71, -6 75, -4 65 C -2 55, -16 45, -16 25 Z"
            fill="url(#saffronGrad)"
            opacity="0.7"
          />

          <!-- Tusk (Ekadanta) -->
          <path d="M 12 16 L 25 20 L 14 24 Z" fill="#ffffff" />

          <!-- GOLDEN MODAK ON PLATTER (THALI) HELD NEAR TRUNK -->
          <g transform="translate(38, 55)">
            <!-- Brass Thali Base -->
            <ellipse cx="0" cy="20" rx="30" ry="8" fill="url(#diyaBrassGrad)" />
            <ellipse cx="0" cy="18" rx="26" ry="6" fill="#fef08a" opacity="0.9" />

            <!-- Modak Sweet Motif -->
            <!-- Main Modak Body -->
            <path
              d="M -18 16 C -20 5, -14 -8, 0 -22 C 14 -8, 20 5, 18 16 C 18 20, -18 20, -18 16 Z"
              fill="url(#modakGrad)"
              stroke="#d97706"
              stroke-width="1"
            />
            <!-- Modak Ribbed Grooves (Fold Lines) -->
            <path d="M 0 -22 Q -6 0 -10 17" stroke="#b45309" stroke-width="1.2" fill="none" />
            <path d="M 0 -22 Q 0 0 0 18" stroke="#b45309" stroke-width="1.2" fill="none" />
            <path d="M 0 -22 Q 6 0 10 17" stroke="#b45309" stroke-width="1.2" fill="none" />
            <path d="M 0 -22 Q -12 5 -16 16" stroke="#d97706" stroke-width="1" fill="none" />
            <path d="M 0 -22 Q 12 5 16 16" stroke="#d97706" stroke-width="1" fill="none" />

            <!-- Golden Crown Tip on Modak -->
            <circle cx="0" cy="-22" r="2.5" fill="#ffffff" />
          </g>
        </g>

        <!-- Floating Sacred Mantra Text or Sparkles -->
        <g class="festive-mantra-text">
          <text x="210" y="32" fill="#fde047" font-size="13" font-weight="800" letter-spacing="2" opacity="0.85">॥ ॐ गं गणपतये नमः ॥</text>
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup>
// Custom vector visual component for Ganesh Utsav celebration
</script>

<style scoped>
.ganesh-showcase {
  align-items: center;
  display: flex;
  justify-content: center;
  margin: 4px 0 16px;
  position: relative;
  width: 100%;
}

.ganesh-visual-wrapper {
  align-items: center;
  display: flex;
  justify-content: center;
  max-width: 530px;
  position: relative;
  width: 100%;
  animation: floatGanesh 4.8s ease-in-out infinite alternate;
}

.ganesh-glow-backdrop {
  background: radial-gradient(
    circle,
    rgba(249, 115, 22, 0.3) 0%,
    rgba(251, 191, 36, 0.22) 40%,
    rgba(220, 38, 38, 0.12) 68%,
    transparent 88%
  );
  border-radius: 50%;
  filter: blur(32px);
  height: 240px;
  pointer-events: none;
  position: absolute;
  width: 240px;
  z-index: 0;
  animation: pulseGlow 4s ease-in-out infinite alternate;
}

.ganesh-svg {
  filter: drop-shadow(0 12px 28px rgba(234, 88, 12, 0.2));
  height: auto;
  overflow: visible;
  position: relative;
  width: 100%;
  z-index: 1;
}

/* Floating particles & marigold motes */
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
  text-shadow: 0 0 12px rgba(249, 115, 22, 0.8);
  user-select: none;
  animation: twinkle 3.2s ease-in-out infinite alternate;
}

.p-1 { top: 4%; left: 10%; font-size: 16px; color: #f97316; animation-delay: 0.1s; }
.p-2 { top: 10%; right: 12%; font-size: 16px; color: #ef4444; animation-delay: 0.7s; }
.p-3 { bottom: 14%; left: 16%; font-size: 17px; color: #fbbf24; animation-delay: 1.3s; }
.p-4 { bottom: 6%; right: 18%; font-size: 13px; color: #fdba74; animation-delay: 0.4s; }
.p-5 { top: 2%; right: 30%; font-size: 18px; color: #fde047; animation-delay: 1.0s; }
.p-6 { top: 76%; left: 38%; font-size: 15px; color: #ef4444; animation-delay: 1.6s; }
.p-7 { top: 28%; left: 4%; font-size: 16px; color: #fbbf24; animation-delay: 0.8s; }

/* Subtle Confetti Dots */
.confetti {
  border-radius: 50%;
  opacity: 0.75;
  position: absolute;
  animation: floatConfetti 5s ease-in-out infinite alternate;
}

.c-1 { width: 7px; height: 7px; background: #ea580c; top: 16%; left: 20%; animation-delay: 0.2s; }
.c-2 { width: 6px; height: 6px; background: #dc2626; top: 20%; right: 22%; animation-delay: 1.1s; }
.c-3 { width: 8px; height: 8px; background: #f59e0b; bottom: 22%; left: 24%; animation-delay: 0.6s; }
.c-4 { width: 5px; height: 5px; background: #f97316; bottom: 16%; right: 14%; animation-delay: 1.4s; }
.c-5 { width: 6px; height: 6px; background: #fde047; top: 36%; right: 6%; animation-delay: 0.3s; }
.c-6 { width: 7px; height: 7px; background: #b91c1c; bottom: 30%; left: 8%; animation-delay: 1.8s; }

@keyframes floatGanesh {
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-7px) rotate(0.5deg); }
  100% { transform: translateY(5px) rotate(-0.5deg); }
}

@keyframes pulseGlow {
  0% { transform: scale(0.92); opacity: 0.55; }
  100% { transform: scale(1.1); opacity: 0.95; }
}

@keyframes twinkle {
  0% { transform: scale(0.7) rotate(0deg); opacity: 0.3; }
  50% { transform: scale(1.18) rotate(45deg); opacity: 1; }
  100% { transform: scale(0.85) rotate(90deg); opacity: 0.4; }
}

@keyframes floatConfetti {
  0% { transform: translateY(0) scale(0.9); }
  50% { transform: translateY(-8px) scale(1.1); }
  100% { transform: translateY(6px) scale(1); }
}

@media (max-width: 980px) {
  .ganesh-showcase {
    margin: 2px 0 12px;
  }
  .ganesh-visual-wrapper {
    max-width: 370px;
  }
}
</style>
