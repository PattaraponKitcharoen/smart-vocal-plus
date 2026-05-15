let audioCtx;
let timerID;
let nextNoteTime = 0.0;
let currentBeat = 0;
let lookahead = 25.0; // มิลลิวินาที (ความถี่ในการตื่นขึ้นมาเช็คคิว)
let scheduleAheadTime = 0.1; // วินาที (จองคิวเล่นเสียงล่วงหน้า)

// สร้างความถี่เสียงติ๊กต็อก (Oscillator)
const playClick = (time, isFirstBeat) => {
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  // สร้างเสียง (Sine wave) 
  osc.type = 'sine';
  if (isFirstBeat) {
    osc.frequency.value = 1200; // เสียงแหลม (หัวโน้ต จังหวะที่ 1)
  } else {
    osc.frequency.value = 800;  // เสียงทุ้ม (จังหวะอื่นๆ)
  }
  
  // กำหนดความดังให้ดังขึ้นทันที แล้วเฟดดับลงอย่างรวดเร็ว (เสียง "ติ๊ก" สั้นๆ)
  gainNode.gain.setValueAtTime(1, time);
  gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
  
  osc.start(time);
  osc.stop(time + 0.05);
};

// ฟังก์ชันหลักที่คอยเช็คและจองคิวเล่นเสียง
const scheduler = (bpm, timeSig) => {
  // วงจรลอจิก: ถ้าเวลาปัจจุบัน + เวลาล่วงหน้า ไปถึงคิวโน้ตตัวต่อไปแล้ว ก็สั่งจองคิวเล่นเสียง
  while (nextNoteTime < audioCtx.currentTime + scheduleAheadTime) {
    playClick(nextNoteTime, currentBeat === 0);
    
    // คำนวณเวลาสำหรับโน้ตตัวถัดไป
    const secondsPerBeat = 60.0 / bpm;
    nextNoteTime += secondsPerBeat;
    
    // นับจังหวะ (เช่น 0, 1, 2, 3 แล้ววนกลับไป 0 ใหม่ถ้าเป็น 4/4)
    currentBeat = (currentBeat + 1) % timeSig;
  }
  
  // ตั้งปลุกตัวเองให้ตื่นมาเช็คคิวใหม่ในอีก 25ms
  timerID = setTimeout(() => scheduler(bpm, timeSig), lookahead);
};

export const startMetronome = (bpm, timeSig) => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // ถ้าเบราว์เซอร์พักการทำงาน Audio ไว้ ให้ปลุกขึ้นมา
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  // ตั้งค่าเริ่มต้นจังหวะ
  currentBeat = 0;
  nextNoteTime = audioCtx.currentTime + 0.05;
  
  scheduler(bpm, timeSig);
};

export const stopMetronome = () => {
  clearTimeout(timerID);
};