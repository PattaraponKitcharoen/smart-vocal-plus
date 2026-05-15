# 🎤 Smart Vocal Plus
### Your All-in-One Professional Vocal Training & Performance Tool 

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Ready-orange?style=for-the-badge)

**Smart Vocal Plus** is a high-performance Progressive Web App (PWA) designed specifically for vocalists and musicians. It focuses on low-latency audio processing and a high-contrast Neon UI, making it perfect for both studio practice and live stage performances.

---

## ✨ Key Features

### 🎙️ Real-time Vocal Monitor & Tuner
- **Precision Pitch Detection:** Utilizes the *Autocorrelation* algorithm to detect vocal frequency and translate it into musical notes.
- **Tuning Gauge:** Visual feedback for pitch accuracy measured in Cents, featuring a smoothing buffer for stable readings.
- **Live Waveform:** Real-time visualization of vocal amplitude and vibrato patterns.

### 🥁 High-Precision Metronome
- **Web Audio Scheduling:** Uses the Web Audio API for millisecond-accurate timing, overcoming the limitations of standard JavaScript intervals.
- **Tap Tempo:** Effortlessly calculate BPM by tapping along with any song.
- **Time Signatures:** Supports multiple signatures (4/4, 3/4) with distinct accent sounds for the downbeat.

### 📄 Offline Sheet Music Library
- **Offline Storage:** Save and access your sheet music anywhere via *IndexedDB*.
- **Quick Search:** Filter by song title, artist, or musical key instantly.

---

## 🛠️ Tech Stack & Algorithms

- **Frontend Framework:** [React.js](https://reactjs.org/) with [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Audio Processing:** Web Audio API (Native Browser API)
- **Pitch Detection:** Time-domain Autocorrelation Algorithm
- **State Management:** React Hooks (useState, useEffect, useRef)
- **Icons:** [Lucide React](https://lucide.dev/)
