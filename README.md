# 🎤 Smart Vocal Plus
### Your All-in-One Professional Vocal Training & Performance Tool 

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Ready-orange?style=for-the-badge)

**Smart Vocal Plus** is a high-performance Progressive Web App (PWA) designed specifically for vocalists and musicians. It focuses on low-latency audio processing and a high-contrast Neon UI, making it perfect for both studio practice and live stage performances.

**🚀 Live Demo:** [Try Smart Vocal Plus Here!](https://smart-vocal-plus.vercel.app)

---

## ✨ Key Features

### 🎙️ Real-time Vocal Monitor & Tuner
- **Precision Pitch Detection:** Utilizes the *Autocorrelation* algorithm to detect vocal frequency and translate it into musical notes.
- **Tuning Gauge:** Visual feedback for pitch accuracy measured in Cents, featuring a smoothing buffer for stable readings.
- **Interactive Guide Piano:** A built-in touch-optimized piano with Octave shifting (C1-C6) to play guide tones with zero latency.

### 🎹 Automated Warm-up Coach
- **Smart Exercises:** Choose between 5-Tone Scale (1-2-3-4-5) or Arpeggio (1-3-5-8) patterns to match your training goals.
- **Auto-Transpose & Modulation Guide:** The coach automatically shifts the key up by a half-step after each cycle, complete with professional modulation cues to prepare your breath.
- **Custom & Profile-based Targeting:** Set your own warm-up range or let the app automatically use your saved Vocal Range profile.

### 🥁 High-Precision Metronome
- **Web Audio Scheduling:** Uses the Web Audio API for millisecond-accurate timing, overcoming the limitations of standard JavaScript intervals.
- **Tap Tempo:** Effortlessly calculate BPM by tapping along with any song.
- **Time Signatures:** Supports multiple signatures (4/4, 3/4) with distinct accent sounds for the downbeat.

### 📄 Offline Sheet Music & Data Management
- **Offline Storage:** Save and access your sheet music anywhere via *IndexedDB*.
- **Full Backup & Restore:** Export your entire library, vocal profile, and settings into a single `.json` file (using Base64 image serialization) and restore it across devices.
- **Quick Search:** Filter by song title, artist, or musical key instantly.

---

## 🛠️ Tech Stack & Algorithms

- **Frontend Framework:** [React.js](https://reactjs.org/) with [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Audio Processing:** Web Audio API (Native Browser API)
- **Pitch Detection:** Time-domain Autocorrelation Algorithm
- **State Management:** React Context API & React Hooks
- **Database & Storage:** IndexedDB (Local Database) & LocalStorage
- **Data Serialization:** Blob to Base64 String Conversion for JSON export
- **Icons:** [Lucide React](https://lucide.dev/)
