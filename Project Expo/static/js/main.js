// ============================================
//   VocalEye v2.0 — Complete Main JS
//   Features:
//   1. Speech to Text (Web Speech API)
//   2. Emotion Detection
//   3. Emergency Alert
//   4. Two-Way Voice Reply
//   5. Sign Language Display
//   6. Conversation Summary + Export
// ============================================

// ---- STATE ----
let recognition   = null;
let listening     = false;
let seconds       = 0;
let timerInterval = null;
let wordCount     = 0;
let sentenceCount = 0;
let transcript    = [];   // full conversation log
let currentLang   = 'en-US';
let signQueue     = [];
let signInterval  = null;

// ---- EMERGENCY WORDS ----
const EMERGENCY_WORDS = [
  'help', 'fire', 'danger', 'emergency', 'ambulance',
  'police', 'accident', 'attack', 'hurt', 'bleeding',
  'pain', 'dying', 'save me', 'call 911', 'call 108'
];

// ---- EMOTION CONFIG ----
const EMOTIONS = {
  happy: {
    emoji: '😄', name: 'Happy', color: '#f59e0b',
    keywords: ['great','amazing','wonderful','love','happy','excited','fantastic','yes','awesome','good','thanks','thank'],
    desc: 'Positive and cheerful tone'
  },
  urgent: {
    emoji: '😰', name: 'Urgent', color: '#ff4d6d',
    keywords: ['please','now','quickly','hurry','fast','immediately','urgent','important','must','need'],
    desc: 'Urgency detected in speech'
  },
  worried: {
    emoji: '😟', name: 'Worried', color: '#a78bfa',
    keywords: ['worried','scared','afraid','anxious','nervous','concern','problem','issue','wrong','bad','sorry'],
    desc: 'Concern or anxiety detected'
  },
  calm: {
    emoji: '😌', name: 'Calm', color: '#00e5b0',
    keywords: ['okay','fine','alright','sure','understand','know','think','feel','maybe','perhaps'],
    desc: 'Calm and steady tone'
  },
  neutral: {
    emoji: '😐', name: 'Neutral', color: '#5a6175',
    keywords: [],
    desc: 'No strong emotion detected'
  }
};

// ---- SIGN LANGUAGE MAP ----
// Maps words to hand emoji representations
const SIGN_MAP = {
  'hello':    { hands: '👋',     label: 'Wave hand' },
  'hi':       { hands: '👋',     label: 'Wave hand' },
  'yes':      { hands: '👍',     label: 'Thumbs up' },
  'no':       { hands: '👎',     label: 'Thumbs down' },
  'please':   { hands: '🙏',     label: 'Both palms together' },
  'thank':    { hands: '🙏',     label: 'Both palms together' },
  'you':      { hands: '👉',     label: 'Point forward' },
  'i':        { hands: '👆',     label: 'Point up to self' },
  'me':       { hands: '👆',     label: 'Point to self' },
  'love':     { hands: '🤟',     label: 'ILY hand sign' },
  'help':     { hands: '🆘',     label: 'SOS sign' },
  'stop':     { hands: '✋',     label: 'Open palm stop' },
  'okay':     { hands: '👌',     label: 'OK sign' },
  'good':     { hands: '👍',     label: 'Thumbs up' },
  'bad':      { hands: '👎',     label: 'Thumbs down' },
  'come':     { hands: '🤚',     label: 'Beckoning hand' },
  'go':       { hands: '👉',     label: 'Pointing away' },
  'eat':      { hands: '🤌',     label: 'Fingers to mouth' },
  'water':    { hands: '💧',     label: 'W hand shape' },
  'home':     { hands: '🏠',     label: 'H hand shape' },
  'name':     { hands: '✌️',     label: 'N-M fingerspell' },
  'what':     { hands: '🤷',     label: 'Shrug sign' },
  'where':    { hands: '☝️',     label: 'Point around' },
  'when':     { hands: '🕐',     label: 'Tap wrist' },
  'how':      { hands: '🤲',     label: 'Both palms up' },
  'more':     { hands: '✌️',     label: 'Fingertips together' },
  'again':    { hands: '🔄',     label: 'Arc back sign' },
  'understand':{ hands: '☝️',   label: 'Flick index finger' },
  'sorry':    { hands: '✊',     label: 'Fist on chest' },
  'morning':  { hands: '🌅',     label: 'Rising arm sign' },
  'night':    { hands: '🌙',     label: 'Curved hand down' },
  'today':    { hands: '👇',     label: 'Both index down' },
  'friend':   { hands: '🤝',     label: 'Interlocked hands' },
  'family':   { hands: '👨‍👩‍👧',   label: 'F hand sign' },
  'happy':    { hands: '😊',     label: 'Brush chest up' },
  'sad':      { hands: '😢',     label: 'Draw tears sign' },
  'angry':    { hands: '😤',     label: 'Claw shape' },
  'fine':     { hands: '👌',     label: 'F hand sign' },
  'sick':     { hands: '🤒',     label: 'Middle finger to head' },
  'doctor':   { hands: '🩺',     label: 'D tap on wrist' },
  'hospital': { hands: '🏥',     label: 'H hand sign' },
  'call':     { hands: '🤙',     label: 'Call sign' },
  'work':     { hands: '💼',     label: 'Fists together' },
  'school':   { hands: '🏫',     label: 'S hand sign' },
  'money':    { hands: '💰',     label: 'Rub fingers' },
  'time':     { hands: '⌚',     label: 'Tap wrist' },
  'tired':    { hands: '😴',     label: 'Head on hands' },
  'hungry':   { hands: '🍽️',    label: 'Hand to stomach' },
  'sleep':    { hands: '💤',     label: 'Hands together tilted' },
  'open':     { hands: '🖐️',    label: 'Open palm out' },
  'close':    { hands: '✊',     label: 'Close fist' },
  'big':      { hands: '🤲',     label: 'Both hands wide' },
  'small':    { hands: '🤏',     label: 'Pinch sign' },
  'hot':      { hands: '🌡️',    label: 'Blow on fingers' },
  'cold':     { hands: '🥶',     label: 'Shiver arms' },
  'wait':     { hands: '✋',     label: 'Hold up palm' },
  'want':     { hands: '🤲',     label: 'Both claws pull toward' },
  'need':     { hands: '☝️',    label: 'Bent index down' },
  'number':   { hands: '🔢',     label: 'Fingerspell' },
  'letter':   { hands: '📝',     label: 'Fingerspell' },
  'book':     { hands: '📖',     label: 'Open palms like book' },
  'car':      { hands: '🚗',     label: 'Steer wheel sign' },
  'bus':      { hands: '🚌',     label: 'B hand sign' },
  'food':     { hands: '🍽️',    label: 'Fingers to mouth' },
  'mother':   { hands: '🖐️',    label: 'A on chin' },
  'father':   { hands: '🖐️',    label: 'A on forehead' },
  'boy':      { hands: '🙆',     label: 'Grab brim sign' },
  'girl':     { hands: '🙆‍♀️',  label: 'Thumb on jaw' },
  'baby':     { hands: '👶',     label: 'Rock arms sign' },
  'danger':   { hands: '⚠️',    label: 'Warning sign' },
  'fire':     { hands: '🔥',     label: 'Flame fingers' },
};

// Default sign for unknown words
const DEFAULT_SIGN = { hands: '🤟', label: 'Fingerspell' };

// ---- DOM REFS ----
const startBtn          = document.getElementById('startBtn');
const statusDot         = document.getElementById('statusDot');
const statusText        = document.getElementById('statusText');
const micRing           = document.getElementById('micRing');
const micLabel          = document.getElementById('micLabel');
const liveBadge         = document.getElementById('liveBadge');
const transcriptBox     = document.getElementById('transcriptBox');
const transcriptContent = document.getElementById('transcriptContent');
const transcriptPlaceholder = document.getElementById('transcriptPlaceholder');
const interimText       = document.getElementById('interimText');
const emotionEmoji      = document.getElementById('emotionEmoji');
const emotionName       = document.getElementById('emotionName');
const emotionDesc       = document.getElementById('emotionDesc');
const emotionFill       = document.getElementById('emotionFill');
const wordCountEl       = document.getElementById('wordCountEl');
const sessionTimeEl     = document.getElementById('sessionTimeEl');
const sentenceCountEl   = document.getElementById('sentenceCountEl');
const signPlaceholder   = document.getElementById('signPlaceholder');
const signDisplay       = document.getElementById('signDisplay');
const signWordLabel     = document.getElementById('signWordLabel');
const signHands         = document.getElementById('signHands');
const signWordQueue     = document.getElementById('signWordQueue');
const historyBox        = document.getElementById('historyBox');
const speakingIndicator = document.getElementById('speakingIndicator');
const replyInput        = document.getElementById('replyInput');


// ============================================
//   1. SPEECH RECOGNITION SETUP
// ============================================
function setupRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('Speech Recognition is not supported in this browser. Please use Google Chrome.');
    return null;
  }

  const rec = new SpeechRecognition();
  rec.continuous      = true;
  rec.interimResults  = true;
  rec.lang            = currentLang;

  rec.onstart = () => {
    statusDot.className  = 'dot live';
    statusText.textContent = 'Listening...';
    micRing.classList.add('active');
    micLabel.textContent = 'Listening... speak naturally';
    liveBadge.textContent = 'LIVE';
    liveBadge.classList.add('active');
    transcriptPlaceholder.style.display = 'none';
  };

  rec.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        const text = result[0].transcript.trim();
        if (text) processFinalResult(text);
      } else {
        interim += result[0].transcript;
      }
    }
    interimText.textContent = interim;
  };

  rec.onerror = (e) => {
    if (e.error !== 'no-speech') {
      console.error('Speech error:', e.error);
      if (e.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone and refresh.');
        stopListening();
      }
    }
  };

  rec.onend = () => {
    // Auto-restart if still supposed to be listening
    if (listening) {
      try { rec.start(); } catch(e) {}
    }
  };

  return rec;
}

// ============================================
//   PROCESS FINAL SPEECH RESULT
// ============================================
function processFinalResult(text) {
  interimText.textContent = '';

  // Update counts
  const words = text.split(' ').filter(w => w.length > 0);
  wordCount    += words.length;
  sentenceCount++;
  wordCountEl.textContent    = wordCount;
  sentenceCountEl.textContent = sentenceCount;

  // Detect emotion
  const emotion = detectEmotion(text);
  updateEmotionUI(emotion);

  // Check emergency
  checkEmergency(text);

  // Add to transcript UI
  addTranscriptEntry(text, emotion);

  // Add to history
  addHistory('speaker', text);

  // Trigger sign language
  triggerSignLanguage(text);

  // Save to transcript array
  transcript.push({
    role: 'speaker',
    text,
    emotion: emotion.name,
    time: getCurrentTime()
  });

  // Scroll transcript to bottom
  transcriptBox.scrollTop = transcriptBox.scrollHeight;
}


// ============================================
//   2. EMOTION DETECTION
// ============================================
function detectEmotion(text) {
  const lower = text.toLowerCase();

  for (const [key, emotion] of Object.entries(EMOTIONS)) {
    if (key === 'neutral') continue;
    for (const kw of emotion.keywords) {
      if (lower.includes(kw)) {
        return { key, ...emotion };
      }
    }
  }
  return { key: 'neutral', ...EMOTIONS.neutral };
}

function updateEmotionUI(emotion) {
  emotionEmoji.textContent = emotion.emoji;
  emotionName.textContent  = emotion.name;
  emotionDesc.textContent  = emotion.desc;
  emotionFill.style.width  = emotion.key === 'neutral' ? '20%' : '85%';
  emotionFill.style.background = emotion.color || 'var(--accent)';
  emotionName.style.color  = emotion.color || 'var(--text)';
}


// ============================================
//   3. EMERGENCY DETECTION
// ============================================
function checkEmergency(text) {
  const lower = text.toLowerCase();
  for (const word of EMERGENCY_WORDS) {
    if (lower.includes(word)) {
      triggerEmergency(word);
      break;
    }
  }
}

function triggerEmergency(word) {
  document.getElementById('emergencyWord').textContent =
    `"${word}" detected in speech`;
  document.getElementById('emergencyOverlay').style.display = 'flex';

  // Also speak alert
  speakText('Emergency detected! ' + word + ' was said. Please check immediately.');
}

function dismissEmergency() {
  document.getElementById('emergencyOverlay').style.display = 'none';
}


// ============================================
//   ADD TRANSCRIPT ENTRY TO UI
// ============================================
function addTranscriptEntry(text, emotion) {
  const entry = document.createElement('div');
  entry.className = `transcript-entry ${emotion.key}`;
  entry.innerHTML = `
    <div class="entry-meta">
      <span class="entry-time">${getCurrentTime()}</span>
      <span class="entry-emotion-tag" style="color:${emotion.color}">${emotion.emoji} ${emotion.name}</span>
    </div>
    <div class="entry-text">${text}</div>
  `;
  transcriptContent.appendChild(entry);
}


// ============================================
//   5. SIGN LANGUAGE DISPLAY
// ============================================
function triggerSignLanguage(text) {
  // Extract meaningful words
  const stopWords = ['the','a','an','is','are','was','were','i','you','he','she','it','we','they','and','or','but','in','on','at','to','of'];
  const words = text.toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(' ')
    .filter(w => w.length > 1 && !stopWords.includes(w));

  if (words.length === 0) return;

  // Show sign display
  signPlaceholder.style.display = 'none';
  signDisplay.style.display = 'block';

  // Build queue
  signQueue = words;

  // Render word queue chips
  signWordQueue.innerHTML = words.map((w, i) =>
    `<span class="sign-queue-chip${i === 0 ? ' current' : ''}" id="chip-${i}">${w}</span>`
  ).join('');

  // Animate through words
  if (signInterval) clearInterval(signInterval);
  let idx = 0;
  showSign(words[idx], idx);

  signInterval = setInterval(() => {
    idx++;
    if (idx >= words.length) {
      clearInterval(signInterval);
      return;
    }
    showSign(words[idx], idx);
    // Update active chip
    document.querySelectorAll('.sign-queue-chip').forEach((c, i) => {
      c.classList.toggle('current', i === idx);
    });
  }, 1400);
}

function showSign(word, idx) {
  const sign = SIGN_MAP[word] || DEFAULT_SIGN;
  signWordLabel.textContent = `SIGNING: "${word.toUpperCase()}"  —  ${sign.label}`;
  signHands.innerHTML = `<span class="sign-hand">${sign.hands}</span>`;
}


// ============================================
//   4. TWO-WAY REPLY
// ============================================
function sendReply() {
  const text = replyInput.value.trim();
  if (!text) return;
  speakReply(text);
  replyInput.value = '';
}

function speakReply(text) {
  speakText(text);
  addHistory('reply', text);
  transcript.push({
    role: 'reply',
    text,
    time: getCurrentTime()
  });
}

function speakText(text) {
  if (!window.speechSynthesis) {
    alert('Text-to-speech not supported in this browser.');
    return;
  }

  window.speechSynthesis.cancel();

  const utterance    = new SpeechSynthesisUtterance(text);
  utterance.lang     = currentLang;
  utterance.rate     = 0.92;
  utterance.pitch    = 1.0;
  utterance.volume   = 1.0;

  utterance.onstart = () => {
    speakingIndicator.style.display = 'flex';
    statusDot.className = 'dot speaking';
    statusText.textContent = 'Speaking...';
  };

  utterance.onend = () => {
    speakingIndicator.style.display = 'none';
    if (listening) {
      statusDot.className = 'dot live';
      statusText.textContent = 'Listening...';
    } else {
      statusDot.className = 'dot';
      statusText.textContent = 'Ready';
    }
  };

  window.speechSynthesis.speak(utterance);
}


// ============================================
//   HISTORY LOG
// ============================================
function addHistory(role, text) {
  // Remove placeholder
  const placeholder = historyBox.querySelector('.history-placeholder');
  if (placeholder) placeholder.remove();

  const entry = document.createElement('div');
  entry.className = 'history-entry';
  entry.innerHTML = `
    <span class="history-who ${role}">${role === 'speaker' ? '🎤 Heard' : '🔊 Replied'}</span>
    <span class="history-msg">${text}</span>
  `;
  historyBox.appendChild(entry);
  historyBox.scrollTop = historyBox.scrollHeight;
}


// ============================================
//   TOGGLE LISTENING
// ============================================
function toggleListening() {
  listening ? stopListening() : startListening();
}

function startListening() {
  recognition = setupRecognition();
  if (!recognition) return;

  listening = true;
  recognition.start();

  startBtn.innerHTML = '⏹ &nbsp;Stop Listening';
  startBtn.classList.add('stop');

  startTimer();
}

function stopListening() {
  listening = false;
  if (recognition) {
    recognition.stop();
    recognition = null;
  }

  startBtn.innerHTML = '▶ &nbsp;Start Listening';
  startBtn.classList.remove('stop');

  statusDot.className   = 'dot';
  statusText.textContent = 'Stopped';
  micRing.classList.remove('active');
  micLabel.textContent  = 'Press Start to begin';
  liveBadge.textContent = 'IDLE';
  liveBadge.classList.remove('active');
  interimText.textContent = '';

  clearInterval(timerInterval);

  if (signInterval) { clearInterval(signInterval); signInterval = null; }
}


// ============================================
//   TIMER
// ============================================
function startTimer() {
  seconds = 0;
  timerInterval = setInterval(() => {
    seconds++;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    sessionTimeEl.textContent = m + ':' + (s < 10 ? '0' : '') + s;
  }, 1000);
}


// ============================================
//   LANGUAGE CHANGE
// ============================================
function changeLanguage() {
  currentLang = document.getElementById('langSelect').value;
  if (listening) {
    stopListening();
    setTimeout(startListening, 300);
  }
}


// ============================================
//   6. SUMMARY + EXPORT
// ============================================
function openSummary() {
  if (transcript.length === 0) {
    alert('No conversation recorded yet. Start listening first.');
    return;
  }

  document.getElementById('summaryModal').style.display = 'flex';

  // Meta info
  const speakers = transcript.filter(t => t.role === 'speaker').length;
  const replies  = transcript.filter(t => t.role === 'reply').length;
  document.getElementById('summaryMeta').innerHTML = `
    <span>📅 ${new Date().toLocaleDateString()}</span>
    <span>⏱ Duration: ${sessionTimeEl.textContent}</span>
    <span>🎤 Spoken: ${speakers} sentences</span>
    <span>🔊 Replied: ${replies} times</span>
    <span>📝 Words: ${wordCount}</span>
  `;

  // Generate summary
  generateSummary();

  // Full transcript
  document.getElementById('summaryTranscript').innerHTML =
    transcript.map(t =>
      `[${t.time}] ${t.role === 'speaker' ? '🎤' : '🔊'} ${t.text}`
    ).join('\n');
}

function generateSummary() {
  const summaryEl = document.getElementById('summaryText');
  summaryEl.textContent = 'Generating summary...';

  // Get all spoken text
  const spokenLines = transcript
    .filter(t => t.role === 'speaker')
    .map(t => t.text);

  const replyLines = transcript
    .filter(t => t.role === 'reply')
    .map(t => t.text);

  // Detect dominant emotion
  const emotions = transcript
    .filter(t => t.emotion)
    .map(t => t.emotion);
  const dominant = emotions.length > 0
    ? emotions.sort((a,b) =>
        emotions.filter(v=>v===a).length - emotions.filter(v=>v===b).length
      ).pop()
    : 'Neutral';

  // Build local summary (no API needed)
  const summary = `This conversation had ${spokenLines.length} spoken sentence(s) and ${replyLines.length} reply(s). ` +
    `The dominant emotion detected was "${dominant}". ` +
    (spokenLines.length > 0 ? `The conversation started with: "${spokenLines[0]}". ` : '') +
    (spokenLines.length > 1 ? `Key topics included discussions about: ${spokenLines.slice(0,3).join(' | ')}. ` : '') +
    (replyLines.length > 0 ? `Replies included: "${replyLines[0]}". ` : '') +
    `Total duration: ${sessionTimeEl.textContent}, total words spoken: ${wordCount}.`;

  summaryEl.textContent = summary;
}

function closeSummary() {
  document.getElementById('summaryModal').style.display = 'none';
}

function exportTXT() {
  if (transcript.length === 0) {
    alert('No conversation to export.');
    return;
  }

  const date = new Date().toLocaleDateString();
  const time = new Date().toLocaleTimeString();

  let content = `VOCALEYE — CONVERSATION TRANSCRIPT\n`;
  content += `Date: ${date}  Time: ${time}\n`;
  content += `Duration: ${sessionTimeEl.textContent}  Words: ${wordCount}\n`;
  content += `${'='.repeat(50)}\n\n`;

  transcript.forEach(t => {
    const role = t.role === 'speaker' ? '[HEARD]  ' : '[REPLY]  ';
    const emo  = t.emotion ? ` (${t.emotion})` : '';
    content += `${t.time} ${role}${t.text}${emo}\n`;
  });

  content += `\n${'='.repeat(50)}\n`;
  content += `Generated by VocalEye v2.0 — AI Communication Assistant\n`;

  const blob = new Blob([content], { type: 'text/plain' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `vocaleye_${date.replace(/\//g, '-')}.txt`;
  a.click();
}

function exportPDF() {
  // Use browser print as PDF
  const content = document.getElementById('summaryTranscript').textContent;
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>VocalEye Transcript</title>
    <style>
      body { font-family: monospace; padding: 40px; color: #111; }
      h1   { font-size: 22px; margin-bottom: 8px; }
      p    { color: #555; margin-bottom: 24px; }
      pre  { font-size: 13px; line-height: 1.8; white-space: pre-wrap; }
    </style></head><body>
    <h1>VocalEye — Conversation Transcript</h1>
    <p>Date: ${new Date().toLocaleString()} | Words: ${wordCount} | Duration: ${sessionTimeEl.textContent}</p>
    <pre>${content}</pre>
    </body></html>
  `);
  win.document.close();
  win.print();
}


// ============================================
//   CLEAR ALL
// ============================================
function clearAll() {
  if (transcript.length > 0 && !confirm('Clear all conversation data?')) return;

  transcript      = [];
  wordCount       = 0;
  sentenceCount   = 0;
  seconds         = 0;

  transcriptContent.innerHTML  = '';
  transcriptPlaceholder.style.display = 'block';
  interimText.textContent      = '';
  historyBox.innerHTML         = '<div class="history-placeholder">Conversation will appear here...</div>';
  signPlaceholder.style.display = 'flex';
  signDisplay.style.display    = 'none';

  wordCountEl.textContent      = '0';
  sentenceCountEl.textContent  = '0';
  sessionTimeEl.textContent    = '0:00';

  emotionEmoji.textContent     = '😐';
  emotionName.textContent      = 'Neutral';
  emotionDesc.textContent      = 'Waiting for speech...';
  emotionFill.style.width      = '0%';

  if (signInterval) { clearInterval(signInterval); signInterval = null; }
}


// ============================================
//   UTILS
// ============================================
function getCurrentTime() {
  const now = new Date();
  const h   = now.getHours().toString().padStart(2, '0');
  const m   = now.getMinutes().toString().padStart(2, '0');
  const s   = now.getSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}