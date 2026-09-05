<template>
  <div class="janmashtami-showcase">
    <!-- Floating Sparkles and Feather Motes -->
    <div class="sparkles-container" aria-hidden="true">
      <span class="particle p-1">✦</span>
      <span class="particle p-2">🪶</span>
      <span class="particle p-3">✨</span>
      <span class="particle p-4">✧</span>
      <span class="particle p-5">✦</span>
      <span class="particle p-6">🪶</span>
      <span class="particle p-7">✨</span>
      <div class="confetti c-1"></div>
      <div class="confetti c-2"></div>
      <div class="confetti c-3"></div>
      <div class="confetti c-4"></div>
      <div class="confetti c-5"></div>
      <div class="confetti c-6"></div>
    </div>

    <!-- Central Janmashtami Visual Illustration -->
    <div class="janmashtami-visual-wrapper">
      <div class="janmashtami-glow-backdrop"></div>

      <svg
        class="janmashtami-svg"
        viewBox="0 0 560 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Krishna Janmashtami Festive Illustration"
      >
        <defs>
          <!-- Color Gradients -->
          <linearGradient id="fluteGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a" />
            <stop offset="30%" stop-color="#fcd34d" />
            <stop offset="60%" stop-color="#f59e0b" />
            <stop offset="85%" stop-color="#d97706" />
            <stop offset="100%" stop-color="#92400e" />
          </linearGradient>

          <linearGradient id="fluteHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8" />
            <stop offset="50%" stop-color="#fef08a" stop-opacity="0.2" />
            <stop offset="100%" stop-color="#b45309" stop-opacity="0.6" />
          </linearGradient>

          <linearGradient id="peacockBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8" />
            <stop offset="40%" stop-color="#0284c7" />
            <stop offset="80%" stop-color="#1e3a8a" />
            <stop offset="100%" stop-color="#0f172a" />
          </linearGradient>

          <linearGradient id="peacockTealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2dd4bf" />
            <stop offset="50%" stop-color="#0d9488" />
            <stop offset="100%" stop-color="#064e3b" />
          </linearGradient>

          <linearGradient id="featherStemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a" />
            <stop offset="100%" stop-color="#10b981" />
          </linearGradient>

          <linearGradient id="handiPotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fb923c" />
            <stop offset="35%" stop-color="#ea580c" />
            <stop offset="75%" stop-color="#c2410c" />
            <stop offset="100%" stop-color="#7c2d12" />
          </linearGradient>

          <linearGradient id="butterCreamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="50%" stop-color="#fef9c3" />
            <stop offset="100%" stop-color="#fef08a" />
          </linearGradient>

          <linearGradient id="ropeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#fde047" />
            <stop offset="50%" stop-color="#d97706" />
            <stop offset="100%" stop-color="#92400e" />
          </linearGradient>

          <radialGradient id="auraGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.8" />
            <stop offset="40%" stop-color="#fbbf24" stop-opacity="0.35" />
            <stop offset="80%" stop-color="#6366f1" stop-opacity="0.1" />
            <stop offset="100%" stop-color="#0284c7" stop-opacity="0" />
          </radialGradient>

          <!-- Drop Shadows & Filters -->
          <filter id="elementShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#030712" flood-opacity="0.25" />
          </filter>
        </defs>

        <!-- Ambient Background Radial Aura -->
        <circle cx="280" cy="130" r="110" fill="url(#auraGlow)" />

        <!-- HANGING ROPES & DAHI HANDI (POT OF BUTTER) -->
        <g class="dahi-handi-group" filter="url(#elementShadow)">
          <!-- Hanging Ropes (Sikka) -->
          <path d="M 120 0 L 165 82" stroke="url(#ropeGrad)" stroke-width="3" stroke-dasharray="6 3" />
          <path d="M 230 0 L 195 82" stroke="url(#ropeGrad)" stroke-width="3" stroke-dasharray="6 3" />
          <!-- Center tassel hanging loop -->
          <path d="M 175 0 L 180 80" stroke="#f59e0b" stroke-width="2.5" />

          <!-- Handi Pot Body -->
          <g transform="translate(180, 140)">
            <!-- Outer Pot Silhouette -->
            <path
              d="M -38 -50 C -42 -35, -55 -20, -55 10 C -55 42, -32 60, 0 60 C 32 60, 55 42, 55 10 C 55 -20, 42 -35, 38 -50 Z"
              fill="url(#handiPotGrad)"
            />

            <!-- Pot Decorative Bands -->
            <!-- Golden Top Rim Ring -->
            <ellipse cx="0" cy="-50" rx="38" ry="10" fill="url(#fluteGoldGrad)" />
            <ellipse cx="0" cy="-50" rx="33" ry="8" fill="#7c2d12" />

            <!-- Middle Geometric Pattern Band -->
            <path
              d="M -50 0 C -52 12, -45 25, -35 34 Q 0 44 35 34 C 45 25, 52 12, 50 0 Z"
              fill="none"
              stroke="url(#fluteGoldGrad)"
              stroke-width="3"
            />
            <!-- Diamond decorative studs on pot -->
            <polygon points="0,-10 6,-3 0,4 -6,-3" fill="#38bdf8" />
            <polygon points="-22,-8 -17,-2 -22,4 -27,-2" fill="#fde047" />
            <polygon points="22,-8 27,-2 22,4 17,-2" fill="#fde047" />
            <polygon points="-38,-2 -34,3 -38,8 -42,3" fill="#38bdf8" />
            <polygon points="38,-2 42,3 38,8 34,3" fill="#38bdf8" />

            <!-- Cream Butter Overflowing Top -->
            <ellipse cx="0" cy="-52" rx="32" ry="14" fill="url(#butterCreamGrad)" />
            <!-- Fluffy Makkhan Dollops -->
            <circle cx="-12" cy="-56" r="14" fill="url(#butterCreamGrad)" />
            <circle cx="10" cy="-58" r="16" fill="#ffffff" />
            <circle cx="-2" cy="-62" r="12" fill="url(#butterCreamGrad)" />
            <circle cx="20" cy="-52" r="10" fill="url(#butterCreamGrad)" />

            <!-- Butter Drips hanging off pot -->
            <path d="M -18 -44 Q -22 -30 -16 -24 Q -12 -35 -10 -44 Z" fill="url(#butterCreamGrad)" />
            <path d="M 8 -42 Q 12 -22 18 -18 Q 20 -32 22 -44 Z" fill="#ffffff" />
            <path d="M 28 -46 Q 32 -36 30 -30 Q 34 -40 34 -46 Z" fill="url(#butterCreamGrad)" />

            <!-- Tulsi Leaf on Butter -->
            <path d="M -2 -68 C -8 -78 0 -84 6 -74 C 4 -68 0 -66 -2 -68 Z" fill="#15803d" />
            <path d="M 4 -72 C 12 -78 16 -70 8 -66 Z" fill="#16a34a" />
          </g>
        </g>

        <!-- PEACOCK FEATHER (MAYUR PANKH) -->
        <g class="peacock-feather-group" transform="translate(350, 115) rotate(-18)" filter="url(#elementShadow)">
          <!-- Feather Main Curved Spine / Stem -->
          <path
            d="M -160 110 Q -60 60 50 -10 Q 100 -40 140 -70"
            stroke="url(#featherStemGrad)"
            stroke-width="3.5"
            stroke-linecap="round"
            fill="none"
          />

          <!-- Feather Barbs / Strands spreading out -->
          <g class="feather-barbs" stroke-linecap="round" opacity="0.9">
            <!-- Left side barbs -->
            <path d="M 30 -22 Q -10 -40 5 -60" stroke="#0d9488" stroke-width="1.8" />
            <path d="M 50 -32 Q 10 -55 25 -75" stroke="#38bdf8" stroke-width="1.8" />
            <path d="M 70 -44 Q 30 -70 50 -90" stroke="#10b981" stroke-width="1.8" />
            <path d="M 90 -55 Q 55 -85 75 -105" stroke="#0284c7" stroke-width="1.8" />

            <!-- Right side barbs -->
            <path d="M 30 -22 Q 40 10 70 0" stroke="#0d9488" stroke-width="1.8" />
            <path d="M 50 -32 Q 70 5 95 -10" stroke="#38bdf8" stroke-width="1.8" />
            <path d="M 70 -44 Q 95 -10 120 -25" stroke="#10b981" stroke-width="1.8" />
            <path d="M 90 -55 Q 120 -25 145 -45" stroke="#0284c7" stroke-width="1.8" />
          </g>

          <!-- Peacock Feather Eye (The Crown Motif) -->
          <g transform="translate(105, -62) rotate(20)">
            <!-- Outer Emerald/Teal Fluff Ring -->
            <ellipse cx="0" cy="0" rx="36" ry="46" fill="url(#peacockTealGrad)" />
            <!-- Shimmering Cyan Ring -->
            <ellipse cx="0" cy="2" rx="28" ry="36" fill="url(#peacockBlueGrad)" />
            <!-- Radiant Golden Amber Ring -->
            <ellipse cx="0" cy="4" rx="20" ry="26" fill="url(#fluteGoldGrad)" />
            <!-- Deep Royal Sapphire Center Eye -->
            <ellipse cx="0" cy="6" rx="13" ry="17" fill="#0f172a" />
            <ellipse cx="0" cy="7" rx="10" ry="13" fill="#1e1b4b" />
            <!-- Iridescent Highlight Arc -->
            <path d="M -6 4 A 7 9 0 0 1 6 4 A 5 7 0 0 0 -6 4 Z" fill="#38bdf8" opacity="0.95" />
            <circle cx="-3" cy="2" r="2.5" fill="#ffffff" />
          </g>
        </g>

        <!-- GOLDEN BANSURI (FLUTE) -->
        <g class="flute-group" transform="translate(270, 168) rotate(-12)" filter="url(#elementShadow)">
          <!-- Flute Outer Shadow & Body -->
          <rect x="-190" y="-10" width="380" height="20" rx="10" fill="url(#fluteGoldGrad)" />
          <!-- Flute Metallic Highlight Line -->
          <rect x="-190" y="-8" width="380" height="6" rx="3" fill="url(#fluteHighlight)" />

          <!-- Flute Metallic Decorative Rings / Bands -->
          <g fill="#7c2d12">
            <!-- Left Decorative Thread Bands (Red Silk Tassel Ring) -->
            <rect x="-175" y="-11" width="12" height="22" rx="2" fill="#be123c" />
            <rect x="-172" y="-11" width="3" height="22" fill="#fde047" />
            <rect x="-167" y="-11" width="3" height="22" fill="#fde047" />

            <rect x="-130" y="-11" width="6" height="22" rx="1" fill="#b45309" />
            <rect x="-122" y="-11" width="4" height="22" rx="1" fill="#fde047" />

            <!-- Right Decorative Thread Bands -->
            <rect x="120" y="-11" width="4" height="22" rx="1" fill="#fde047" />
            <rect x="128" y="-11" width="6" height="22" rx="1" fill="#b45309" />

            <rect x="165" y="-11" width="12" height="22" rx="2" fill="#be123c" />
            <rect x="168" y="-11" width="3" height="22" fill="#fde047" />
            <rect x="173" y="-11" width="3" height="22" fill="#fde047" />
          </g>

          <!-- Flute Blowing Hole (Blowhole) -->
          <ellipse cx="-150" cy="0" rx="4.5" ry="5.5" fill="#451a03" stroke="#fde047" stroke-width="1" />

          <!-- Flute 6 Finger Holes -->
          <g fill="#451a03" stroke="#b45309" stroke-width="0.8">
            <ellipse cx="-50" cy="0" rx="3.8" ry="4.8" />
            <ellipse cx="-10" cy="0" rx="3.8" ry="4.8" />
            <ellipse cx="30" cy="0" rx="3.8" ry="4.8" />
            <ellipse cx="70" cy="0" rx="3.8" ry="4.8" />
            <ellipse cx="105" cy="0" rx="3.8" ry="4.8" />
            <ellipse cx="140" cy="0" rx="3.8" ry="4.8" />
          </g>

          <!-- Hanging Tassel from Flute Left End -->
          <g transform="translate(-170, 10)">
            <path d="M 0 0 Q -5 15 -2 28" stroke="#be123c" stroke-width="2.5" fill="none" />
            <path d="M 0 0 Q 3 15 6 28" stroke="#f59e0b" stroke-width="2" fill="none" />
            <!-- Pearl bead on tassel -->
            <circle cx="-2" cy="16" r="3.5" fill="#ffffff" stroke="#d97706" stroke-width="1" />
            <!-- Tassel Fringe -->
            <path d="M -4 28 L -8 44 M -2 28 L -2 46 M 2 28 L 3 45 M 6 28 L 8 43" stroke="#be123c" stroke-width="1.8" />
            <path d="M -3 28 L -5 42 M 0 28 L 1 44 M 4 28 L 5 42" stroke="#fde047" stroke-width="1.2" />
          </g>
        </g>

        <!-- Musical Sparkles emanating from Flute -->
        <g class="musical-notes">
          <text x="210" y="125" fill="#fde047" font-size="16" font-weight="bold" opacity="0.85">♪</text>
          <text x="235" y="105" fill="#38bdf8" font-size="20" font-weight="bold" opacity="0.9">♫</text>
          <text x="270" y="95" fill="#2dd4bf" font-size="15" font-weight="bold" opacity="0.8">♪</text>
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup>
// Custom vector visual component for Krishna Janmashtami celebration
</script>

<style scoped>
.janmashtami-showcase {
  align-items: center;
  display: flex;
  justify-content: center;
  margin: 4px 0 16px;
  position: relative;
  width: 100%;
}

.janmashtami-visual-wrapper {
  align-items: center;
  display: flex;
  justify-content: center;
  max-width: 530px;
  position: relative;
  width: 100%;
  animation: floatJanmashtami 4.8s ease-in-out infinite alternate;
}

.janmashtami-glow-backdrop {
  background: radial-gradient(
    circle,
    rgba(56, 189, 248, 0.28) 0%,
    rgba(251, 191, 36, 0.18) 40%,
    rgba(13, 148, 136, 0.12) 65%,
    transparent 85%
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

.janmashtami-svg {
  filter: drop-shadow(0 12px 28px rgba(2, 132, 199, 0.18));
  height: auto;
  overflow: visible;
  position: relative;
  width: 100%;
  z-index: 1;
}

/* Floating particles & feather motes */
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
  text-shadow: 0 0 12px rgba(56, 189, 248, 0.8);
  user-select: none;
  animation: twinkle 3.2s ease-in-out infinite alternate;
}

.p-1 { top: 4%; left: 12%; font-size: 16px; color: #38bdf8; animation-delay: 0.1s; }
.p-2 { top: 12%; right: 14%; font-size: 15px; color: #2dd4bf; animation-delay: 0.7s; }
.p-3 { bottom: 14%; left: 18%; font-size: 17px; color: #fbbf24; animation-delay: 1.3s; }
.p-4 { bottom: 6%; right: 20%; font-size: 13px; color: #818cf8; animation-delay: 0.4s; }
.p-5 { top: 2%; right: 32%; font-size: 18px; color: #fde047; animation-delay: 1.0s; }
.p-6 { top: 76%; left: 40%; font-size: 14px; color: #38bdf8; animation-delay: 1.6s; }
.p-7 { top: 28%; left: 4%; font-size: 16px; color: #fbbf24; animation-delay: 0.8s; }

/* Subtle Confetti Dots */
.confetti {
  border-radius: 50%;
  opacity: 0.75;
  position: absolute;
  animation: floatConfetti 5s ease-in-out infinite alternate;
}

.c-1 { width: 7px; height: 7px; background: #0284c7; top: 16%; left: 22%; animation-delay: 0.2s; }
.c-2 { width: 6px; height: 6px; background: #0d9488; top: 20%; right: 24%; animation-delay: 1.1s; }
.c-3 { width: 8px; height: 8px; background: #f59e0b; bottom: 22%; left: 26%; animation-delay: 0.6s; }
.c-4 { width: 5px; height: 5px; background: #6366f1; bottom: 16%; right: 16%; animation-delay: 1.4s; }
.c-5 { width: 6px; height: 6px; background: #fde047; top: 36%; right: 8%; animation-delay: 0.3s; }
.c-6 { width: 7px; height: 7px; background: #38bdf8; bottom: 30%; left: 10%; animation-delay: 1.8s; }

@keyframes floatJanmashtami {
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
  .janmashtami-showcase {
    margin: 2px 0 12px;
  }
  .janmashtami-visual-wrapper {
    max-width: 370px;
  }
}
</style>
