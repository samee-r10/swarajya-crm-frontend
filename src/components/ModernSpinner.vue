<template>
  <div :class="['modern-spinner-container', { 'full-screen': fullScreen, 'inline': inline }]">
    <div class="modern-spinner-wrapper" :style="wrapperStyle">
      <svg class="modern-spinner-svg" viewBox="0 0 50 50">
        <defs>
          <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" :stop-color="primaryColor" stop-opacity="1" />
            <stop offset="50%" :stop-color="accentColor" stop-opacity="0.8" />
            <stop offset="100%" :stop-color="secondaryColor" stop-opacity="0.2" />
          </linearGradient>
        </defs>
        <!-- Background Track -->
        <circle
          class="modern-spinner-track"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          :stroke-width="strokeWidth"
        />
        <!-- Animated Glowing Ring -->
        <circle
          class="modern-spinner-ring"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          :stroke="`url(#${gradientId})`"
          :stroke-width="strokeWidth"
          stroke-linecap="round"
        />
      </svg>
      <!-- Center Pulsing Core -->
      <div v-if="showCore" class="modern-spinner-core" :style="{ backgroundColor: primaryColor }"></div>
    </div>
    <span v-if="label" class="modern-spinner-label">{{ label }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: [Number, String],
    default: 36 // or 'sm' (20), 'md' (36), 'lg' (48), 'xl' (64)
  },
  label: {
    type: String,
    default: ''
  },
  fullScreen: {
    type: Boolean,
    default: false
  },
  inline: {
    type: Boolean,
    default: false
  },
  primaryColor: {
    type: String,
    default: '#0284c7' // Enterprise Sky Blue / Primary
  },
  accentColor: {
    type: String,
    default: '#6366f1' // Indigo accent
  },
  secondaryColor: {
    type: String,
    default: '#06b6d4' // Cyan accent
  },
  showCore: {
    type: Boolean,
    default: false
  }
})

const gradientId = computed(() => `spinner-grad-${Math.random().toString(36).substr(2, 9)}`)

const pixelSize = computed(() => {
  if (typeof props.size === 'number') return props.size
  switch (props.size) {
    case 'xs': return 16
    case 'sm': return 22
    case 'lg': return 48
    case 'xl': return 64
    case 'md':
    default: return 36
  }
})

const strokeWidth = computed(() => {
  return pixelSize.value <= 24 ? 3.5 : 4
})

const wrapperStyle = computed(() => ({
  width: `${pixelSize.value}px`,
  height: `${pixelSize.value}px`
}))
</script>

<style scoped>
.modern-spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.modern-spinner-container.inline {
  display: inline-flex;
  flex-direction: row;
  vertical-align: middle;
}

.modern-spinner-container.full-screen {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 9999;
}

.modern-spinner-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modern-spinner-svg {
  width: 100%;
  height: 100%;
  animation: modernSpin 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  filter: drop-shadow(0 2px 6px rgba(2, 132, 199, 0.25));
}

.modern-spinner-track {
  stroke: rgba(226, 232, 240, 0.45);
}

:global(.dark) .modern-spinner-track {
  stroke: rgba(255, 255, 255, 0.1);
}

.modern-spinner-ring {
  stroke-dasharray: 90, 150;
  stroke-dashoffset: 0;
  animation: modernRingDash 1.4s ease-in-out infinite;
}

.modern-spinner-core {
  position: absolute;
  width: 18%;
  height: 18%;
  border-radius: 50%;
  box-shadow: 0 0 8px currentColor;
  animation: modernCorePulse 1.4s ease-in-out infinite alternate;
}

.modern-spinner-label {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  letter-spacing: -0.01em;
}

@keyframes modernSpin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes modernRingDash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

@keyframes modernCorePulse {
  0% {
    transform: scale(0.7);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.2);
    opacity: 1;
  }
}
</style>

