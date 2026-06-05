@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;700&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Space Grotesk", sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}

/* Custom gorgeous animations */
@keyframes pulse-slow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
}

.animate-pulse-slow {
  animation: pulse-slow 3s infinite ease-in-out;
}

/* Customized scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #020617;
}
::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: #6366f1;
}

/* Phone screen mock container to simulate premium tiktok ratio on desktop */
@media (min-width: 640px) {
  .tiktok-container {
    max-width: 440px;
    height: 92vh;
    border: 8px solid rgba(30, 41, 59, 0.7);
    border-radius: 40px;
    box-shadow: 0 25px 50px -12px rgba(99, 102, 241, 0.25);
    overflow: hidden;
    margin: auto;
    position: relative;
    background: #020617;
  }
}

