let audioContext;
let analyser;
let microphone;
let dataArray;

export const startAudio = async () => {
  try {
    // 1. สร้าง Audio Context (รองรับทั้ง Chrome และ Safari)
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();

    // 2. ขออนุญาตใช้ไมโครโฟน
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: false, // ปิดตัดเสียงสะท้อน เพื่อให้ได้เสียงร้องดิบๆ ธรรมชาติที่สุด
        autoGainControl: false,  // ปิดการปรับลดเสียงอัตโนมัติ
        noiseSuppression: false  // ปิดการตัดเสียงรบกวน (หรือเปิดถ้าห้องซ้อมเสียงดังมาก)
      } 
    });

    // 3. เอาสัญญาณไมค์มาต่อเข้ากับ Context
    microphone = audioContext.createMediaStreamSource(stream);
    
    // 4. สร้างตัววิเคราะห์เสียง (Analyser)
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048; // ขนาด Sample Rate ยิ่งเยอะกราฟยิ่งเนียน
    
    // 5. เสียบสายไมค์เข้าตัววิเคราะห์
    microphone.connect(analyser);

    // 6. เตรียม Array ว่างๆ ไว้รอรับข้อมูลคลื่นเสียง
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Float32Array(bufferLength);

    return true; // สำเร็จ!
  } catch (error) {
    console.error("Mic access denied:", error);
    return false; // โดนผู้ใช้ปฏิเสธการเข้าถึงไมค์
  }
};

export const stopAudio = () => {
  // เช็คก่อนว่ามี audioContext ไหม และสถานะต้องยังไม่ถูกปิด
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close();
  }
  
  if (microphone) {
    // สั่งปิดการทำงานของไมค์ที่ไฟขึ้นสีแดงบนเบราว์เซอร์
    microphone.mediaStream.getTracks().forEach(track => track.stop());
  }
};

// ฟังก์ชันสำหรับดูดข้อมูลคลื่นเสียง ณ เสี้ยววินาทีนั้นๆ ออกไปใช้วาดกราฟ
export const getAudioData = () => {
  if (!analyser) return null;
  analyser.getFloatTimeDomainData(dataArray);
  return dataArray;
};

// --- ส่วนที่เพิ่มใหม่: อัลกอริทึมจับความถี่ (Pitch Detection) ---

// อาเรย์เก็บชื่อตัวโน้ตทั้งหมด
const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// 1. อัลกอริทึม Autocorrelation หาค่าความถี่ (Hz) จากคลื่นเสียง
export const autoCorrelate = (buf, sampleRate) => {
  let SIZE = buf.length;
  let rms = 0; // Root Mean Square (หาความดัง)

  // เช็คความดังก่อน ถ้าเบาไป (ไม่ได้พูด) ให้ข้ามไปเลย จะได้ไม่จับมั่ว
  for (let i = 0; i < SIZE; i++) {
    let val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1; // เสียงเบาเกินไป (Noise)

  // กระบวนการ Autocorrelation (หาจุดที่คลื่นเสียงตัดกันเพื่อหารอบความถี่)
  let r1 = 0, r2 = SIZE - 1, thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++)
    if (Math.abs(buf[i]) < thres) { r1 = i; break; }
  for (let i = 1; i < SIZE / 2; i++)
    if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }

  buf = buf.slice(r1, r2);
  SIZE = buf.length;

  let c = new Array(SIZE).fill(0);
  for (let i = 0; i < SIZE; i++)
    for (let j = 0; j < SIZE - i; j++)
      c[i] = c[i] + buf[j] * buf[j + i];

  let d = 0; while (c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < SIZE; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  let T0 = maxpos;
  return sampleRate / T0;
};

// 2. แปลง Hz เป็นลำดับตัวโน้ต (MIDI Note Number)
export const noteFromPitch = (frequency) => {
  const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
  return Math.round(noteNum) + 69; // 69 คือโน้ต A4 (440Hz)
};

// 3. แปลงลำดับตัวโน้ต เป็นชื่อโน้ต (เช่น C4, D#5)
export const getNoteString = (noteNumber) => {
  const octave = Math.floor(noteNumber / 12) - 1;
  const noteName = noteStrings[noteNumber % 12];
  return `${noteName}${octave}`;
};

// ฟังก์ชันดึงค่า Sample Rate จากระบบ
export const getSampleRate = () => {
  return audioContext ? audioContext.sampleRate : 44100;
};

// --- ส่วนที่เพิ่มใหม่: คำนวณความเพี้ยน (Cents) ---

// คำนวณหาความถี่ (Hz) ที่ถูกต้อง 100% ของตัวโน้ตนั้นๆ ตามมาตรฐาน
export const getStandardFrequency = (noteNumber) => {
  return 440 * Math.pow(2, (noteNumber - 69) / 12);
};

// คำนวณว่าเสียงที่ร้อง ห่างจากโน้ตที่ถูกต้องกี่ Cents (-50 ถึง +50)
export const getCentsOffPitch = (frequency, noteNumber) => {
  const standardFreq = getStandardFrequency(noteNumber);
  // สมการเปรียบเทียบระยะห่างของความถี่
  return Math.floor(1200 * Math.log2(frequency / standardFreq));
};

export const playGuideNote = (noteNumber) => {
  // เช็คว่ามี AudioContext หรือยัง
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') audioContext.resume();

  // คำนวณความถี่จาก MIDI Note Number (A4 = 69 = 440Hz)
  const freq = 440 * Math.pow(2, (noteNumber - 69) / 12);
  
  const osc = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  osc.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // ใช้คลื่น Triangle ให้เสียงมีความกังวานคล้ายเปียโนไฟฟ้า/คีย์บอร์ด
  osc.type = 'triangle'; 
  osc.frequency.value = freq;
  
  // สร้าง Envelope (ADSR) ให้เสียงค่อยๆ จางหายไป ไม่ตัดฉับให้เจ็บหู
  const now = audioContext.currentTime;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.6, now + 0.02); // Attack เร็ว
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5); // Decay ค่อยๆ เบาลงใน 1.5 วิ
  
  osc.start(now);
  osc.stop(now + 1.5);
};