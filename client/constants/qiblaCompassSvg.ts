// SVG compass assets for the Qibla screen
// Each variant (dark/light) contains three layers: compass ring, needle, and kaaba icon

// ─── DARK MODE ───────────────────────────────────────

export const compassRingDarkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-155 -155 310 310" width="310" height="310">
  <defs>
    <linearGradient id="cr-bezel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1a1a"/>
      <stop offset="50%" stop-color="#252525"/>
      <stop offset="100%" stop-color="#1a1a1a"/>
    </linearGradient>
    <radialGradient id="cr-face" cx="0.5" cy="0.4" r="0.55">
      <stop offset="0%" stop-color="#161616"/>
      <stop offset="100%" stop-color="#111111"/>
    </radialGradient>
    <filter id="cr-shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>
  <circle cx="0" cy="0" r="150" fill="url(#cr-bezel)" filter="url(#cr-shadow)"/>
  <circle cx="0" cy="0" r="142" fill="url(#cr-face)" stroke="#222" stroke-width="0.5"/>
  <circle cx="0" cy="0" r="136" fill="none" stroke="#2a2a2a" stroke-width="0.5" opacity="0.4"/>
  <g stroke="#3a3a3a" stroke-width="0.7" opacity="0.5">
    ${[5, 10, 15, 20, 25, 35, 40, 50, 55, 65, 70, 75, 80, 85, 95, 100, 105, 110, 115, 125, 130, 140, 145, 155, 160, 165, 170, 175, 185, 190, 195, 200, 205, 215, 220, 230, 235, 245, 250, 255, 260, 265, 275, 280, 285, 290, 295, 305, 310, 320, 325, 335, 340, 345, 350, 355].map(a => `<line x1="0" y1="-135" x2="0" y2="-131" transform="rotate(${a})"/>`).join('')}
  </g>
  <g stroke="#4a4a4a" stroke-width="1.8">
    ${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(a => `<line x1="0" y1="-136" x2="0" y2="${a % 90 === 0 ? -124 : -126}" transform="rotate(${a})"/>`).join('')}
  </g>
  <g font-family="Inter, SF Pro Display, system-ui" font-weight="700" text-anchor="middle" dominant-baseline="central">
    <text x="0" y="-108" fill="#2ecc8f" font-size="18">N</text>
    <text x="110" y="0" fill="#707070" font-size="16">E</text>
    <text x="0" y="112" fill="#707070" font-size="16">S</text>
    <text x="-110" y="0" fill="#707070" font-size="16">W</text>
  </g>
  <g font-family="Inter, SF Pro Display, system-ui" font-weight="400" font-size="10" fill="#505050" text-anchor="middle" dominant-baseline="central">
    <text x="78" y="-78">NE</text>
    <text x="78" y="78">SE</text>
    <text x="-78" y="78">SW</text>
    <text x="-78" y="-78">NW</text>
  </g>
  <circle cx="0" cy="0" r="78" fill="none" stroke="#2a2a2a" stroke-width="0.5" stroke-dasharray="3,5" opacity="0.3"/>
</svg>`;

export const needleDarkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-155 -155 310 310" width="310" height="310">
  <defs>
    <linearGradient id="nd-gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d4a030"/>
      <stop offset="50%" stop-color="#c49228"/>
      <stop offset="100%" stop-color="#a07820"/>
    </linearGradient>
    <linearGradient id="nd-tail" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a3020"/>
      <stop offset="100%" stop-color="#2a2018"/>
    </linearGradient>
    <filter id="nd-shadow">
      <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.3"/>
    </filter>
    <filter id="nd-glow">
      <feGaussianBlur stdDeviation="1.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g filter="url(#nd-shadow)">
    <polygon points="0,-85 -5.5,0 0,-6 5.5,0" fill="url(#nd-gold)" filter="url(#nd-glow)"/>
    <polygon points="-5.5,0 0,28 5.5,0 0,-6" fill="url(#nd-tail)" opacity="0.8"/>
    <circle cx="0" cy="0" r="7" fill="#1a1a1a" stroke="#d4a853" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="3" fill="#d4a853"/>
  </g>
</svg>`;

export const kaabaIconDarkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -20 40 40" width="40" height="40">
  <rect x="-13" y="-13" width="26" height="26" rx="3" fill="#1a1a1a" stroke="#c49228" stroke-width="1.2"/>
  <line x1="-13" y1="-3" x2="13" y2="-3" stroke="#c49228" stroke-width="1.8"/>
  <line x1="-13" y1="-5.5" x2="13" y2="-5.5" stroke="#c49228" stroke-width="0.4" opacity="0.5"/>
  <line x1="-13" y1="-0.5" x2="13" y2="-0.5" stroke="#c49228" stroke-width="0.4" opacity="0.5"/>
  <rect x="-3.5" y="1" width="7" height="10" rx="1.5" fill="none" stroke="#c49228" stroke-width="0.9"/>
  <circle cx="10" cy="8" r="2" fill="#2a2a2a" stroke="#c49228" stroke-width="0.6"/>
  <line x1="-13" y1="-13" x2="13" y2="-13" stroke="#d4a853" stroke-width="0.5" opacity="0.3"/>
</svg>`;

// ─── LIGHT MODE ──────────────────────────────────────

export const compassRingLightSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-155 -155 310 310" width="310" height="310">
  <defs>
    <linearGradient id="cr-bezel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#d0ddd6"/>
      <stop offset="50%" stop-color="#c4d4cb"/>
      <stop offset="100%" stop-color="#d0ddd6"/>
    </linearGradient>
    <radialGradient id="cr-face" cx="0.5" cy="0.4" r="0.55">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f0f5f2"/>
    </radialGradient>
    <filter id="cr-shadow">
      <feDropShadow dx="0" dy="3" stdDeviation="8" flood-color="#5a7a6a" flood-opacity="0.15"/>
    </filter>
  </defs>
  <circle cx="0" cy="0" r="150" fill="url(#cr-bezel)" filter="url(#cr-shadow)"/>
  <circle cx="0" cy="0" r="142" fill="url(#cr-face)" stroke="#c8d8ce" stroke-width="0.5"/>
  <circle cx="0" cy="0" r="136" fill="none" stroke="#d8e4dc" stroke-width="0.5"/>
  <g stroke="#c0cec6" stroke-width="0.6" opacity="0.7">
    ${[5, 10, 15, 20, 25, 35, 40, 50, 55, 65, 70, 75, 80, 85, 95, 100, 105, 110, 115, 125, 130, 140, 145, 155, 160, 165, 170, 175, 185, 190, 195, 200, 205, 215, 220, 230, 235, 245, 250, 255, 260, 265, 275, 280, 285, 290, 295, 305, 310, 320, 325, 335, 340, 345, 350, 355].map(a => `<line x1="0" y1="-135" x2="0" y2="-131" transform="rotate(${a})"/>`).join('')}
  </g>
  <g stroke="#8aaa98" stroke-width="1.8">
    ${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(a => `<line x1="0" y1="-136" x2="0" y2="${a % 90 === 0 ? -124 : -126}" transform="rotate(${a})"/>`).join('')}
  </g>
  <g font-family="Inter, SF Pro Display, system-ui" font-weight="700" text-anchor="middle" dominant-baseline="central">
    <text x="0" y="-108" fill="#1a8a58" font-size="18">N</text>
    <text x="110" y="0" fill="#5a7a6a" font-size="16">E</text>
    <text x="0" y="112" fill="#5a7a6a" font-size="16">S</text>
    <text x="-110" y="0" fill="#5a7a6a" font-size="16">W</text>
  </g>
  <g font-family="Inter, SF Pro Display, system-ui" font-weight="400" font-size="10" fill="#8aaa98" text-anchor="middle" dominant-baseline="central">
    <text x="78" y="-78">NE</text>
    <text x="78" y="78">SE</text>
    <text x="-78" y="78">SW</text>
    <text x="-78" y="-78">NW</text>
  </g>
  <circle cx="0" cy="0" r="78" fill="none" stroke="#d8e4dc" stroke-width="0.5" stroke-dasharray="3,5"/>
</svg>`;

export const needleLightSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-155 -155 310 310" width="310" height="310">
  <defs>
    <linearGradient id="nd-gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d4a030"/>
      <stop offset="50%" stop-color="#c49228"/>
      <stop offset="100%" stop-color="#a07820"/>
    </linearGradient>
    <linearGradient id="nd-tail" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#b8c4be"/>
      <stop offset="100%" stop-color="#95a89c"/>
    </linearGradient>
    <filter id="nd-shadow">
      <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.15"/>
    </filter>
    <filter id="nd-glow">
      <feGaussianBlur stdDeviation="1.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g filter="url(#nd-shadow)">
    <polygon points="0,-85 -5.5,0 0,-6 5.5,0" fill="url(#nd-gold)" filter="url(#nd-glow)"/>
    <polygon points="-5.5,0 0,28 5.5,0 0,-6" fill="url(#nd-tail)" opacity="0.8"/>
    <circle cx="0" cy="0" r="7" fill="#ffffff" stroke="#c49228" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="3" fill="#c49228"/>
  </g>
</svg>`;

export const kaabaIconLightSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -20 40 40" width="40" height="40">
  <rect x="-13" y="-13" width="26" height="26" rx="3" fill="#1a5c3a" stroke="#c49228" stroke-width="1.2"/>
  <line x1="-13" y1="-3" x2="13" y2="-3" stroke="#c49228" stroke-width="1.8"/>
  <line x1="-13" y1="-5.5" x2="13" y2="-5.5" stroke="#c49228" stroke-width="0.4" opacity="0.5"/>
  <line x1="-13" y1="-0.5" x2="13" y2="-0.5" stroke="#c49228" stroke-width="0.4" opacity="0.5"/>
  <rect x="-3.5" y="1" width="7" height="10" rx="1.5" fill="none" stroke="#c49228" stroke-width="0.9"/>
  <circle cx="10" cy="8" r="2" fill="#1a5c3a" stroke="#c49228" stroke-width="0.6"/>
  <line x1="-13" y1="-13" x2="13" y2="-13" stroke="#d4a853" stroke-width="0.5" opacity="0.3"/>
</svg>`;
