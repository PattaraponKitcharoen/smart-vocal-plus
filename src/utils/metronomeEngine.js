let audioCtx;
let timerID;
let nextNoteTime = 0.0;
let currentBeat = 0;
let lookahead = 25.0; 
let scheduleAheadTime = 0.1; 

// เพิ่มตัวแปรสำหรับคุมเสียง
let masterVolume = 0.8; // 0.0 ถึง 1.0
let isMuted = false;

export const setMetronomeVolume = (vol) => {
  masterVolume = vol;
};

export const setMetronomeMute = (muted) => {
  isMuted = muted;
};

const playClick = (time, isFirstBeat) => {
  // ถัาถูก Mute หรือปรับเสียงลงสุด ไม่ต้องสร้างเสียง
  if (isMuted || masterVolume <= 0) return;

  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  osc.type = 'sine';
  if (isFirstBeat) {
    osc.frequency.value = 1200; 
  } else {
    osc.frequency.value = 800;  
  }
  
  // ใช้ masterVolume มาคูณเพื่อปรับระดับเสียง
  gainNode.gain.setValueAtTime(masterVolume, time);
  gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
  
  osc.start(time);
  osc.stop(time + 0.05);
};

const scheduler = (bpm, timeSig) => {
  while (nextNoteTime < audioCtx.currentTime + scheduleAheadTime) {
    playClick(nextNoteTime, currentBeat === 0);
    
    const secondsPerBeat = 60.0 / bpm;
    nextNoteTime += secondsPerBeat;
    
    currentBeat = (currentBeat + 1) % timeSig;
  }
  timerID = setTimeout(() => scheduler(bpm, timeSig), lookahead);
};

export const startMetronome = (bpm, timeSig) => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  currentBeat = 0;
  nextNoteTime = audioCtx.currentTime + 0.05;
  scheduler(bpm, timeSig);
};

export const stopMetronome = () => {
  clearTimeout(timerID);
};