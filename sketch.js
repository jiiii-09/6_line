let mic;
let recognition;
let lines = [];
let baseLineHeight = 25*10;
let tempTranscript = "";
let scrollOffset = 0;

// 전역 선언
let emotionColors = {};
let mixedColors = {};
let emotionFonts = {};

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(LEFT, CENTER);
  background(255);
  fill(0);
  textSize(12);
  text("▶ 클릭해서 마이크 + 음성인식 시작", width / 2 - 150, height / 2);

  // 🎨 감정별 폰트 세트 (랜덤으로 선택)
  emotionFonts = {
    joy: [
      "HappinessSans",
      "SchoolSafetyRoundedSmile",
      "OngleipParkDahyeon",
      "GabiaOndam",
      "Gowun Dodum"
    ],
    sadness: [
      // 예시 템플릿: 여기에 나중에 네가 폰트 이름을 추가하면 돼
      "Diphylleia",
      "MapodaCapo",
      "GabiaCheongyeon",
      "Yeongwol",
      "KimJeongWonSMiss"
    ],
    surprise: [
      "Do Hyeon",
      // "SurpriseFont2",
      // "SurpriseFont3",
      // "SurpriseFont4",
      // "SurpriseFont5"
    ],
    fear: [
      "Hahmlet",
      // "FearFont2",
      // "FearFont3",
      // "FearFont4",
      // "FearFont5"
    ],
    disgust: [
      "Kirang Haerang",
      // "DisgustFont2",
      // "DisgustFont3",
      // "DisgustFont4",
      // "DisgustFont5"
    ],
    anger: [
      "Noto Serif KR",
      "BookkMyungjo",
      "GapyeongHanseokbongBigBrush’",
      "Simple",
      "JoseonPalace"
    ]
  };

  // 기본 감정 색상
  emotionColors = {
    joy: color('#FFE500'),
    sadness: color('#004DFF'),
    surprise: color('#FFB700'),
    fear: color('#9D00FF'),
    disgust: color('#04EE00'),
    anger: color('#FF0000')
  };

  // 혼합 색상
  mixedColors = {
    "joy_sadness": color('#998A08'),
    "joy_surprise": color('#FFEA00'),
    "joy_fear": color('#AA95B7'),
    "joy_disgust": color('#AEFF00'),
    "joy_anger": color('#FF8400'),
    "sadness_surprise": color('#2000EF'),
    "sadness_fear": color('#6B01C2'),
    "sadness_disgust": color('#7E98C9'),
    "sadness_anger": color('#FF00EA'),
    "surprise_fear": color('#DED74E'),
    "surprise_disgust": color('#C8FF2F'),
    "surprise_anger": color('#FF0059'),
    "fear_disgust": color('#009B36'),
    "fear_anger": color('#D80073'),
    "disgust_anger": color('#820000')
  };
}

function draw() {
  background(0, 40);

let totalHeight = calcTotalTextHeight();
let visibleHeight = height - 150;

// ⭐ 자동스크롤 조건:
// 현재 스크롤 위치가 최하단 근처일 때만 자동으로 내려감
if (scrollOffset < totalHeight - visibleHeight - 20) {
  scrollOffset = totalHeight - visibleHeight;
}

  push();
  translate(0, -scrollOffset);
  let yOffset = 100;

  for (let l of lines) {
    let x = 50;
    let y = yOffset;
    let words = l.txt.split(" ");
    let lineCount = 1;

    for (let w of words) {
      fill(l.colors[w] || color(255));
      textFont(l.fonts[w] || "sans-serif"); // ✅ 단어별 폰트 적용
      textSize(l.size);

      let wWidth = textWidth(w + " ");
      if (x + wWidth > width - 50) {
        x = 50;
        y += l.size * 0.9;   // 🔥 글자 크기 기준으로 줄 높이 자동 결정
        lineCount++;
      }
      text(w, x, y);
      x += wWidth;
    }

    yOffset += lineCount * (l.size * 0.9);
  }

  // 임시 회색 텍스트 (항상 기본 폰트)
  if (tempTranscript.length > 0) {
    let vol = mic.getLevel();
    let scaledVol = pow(vol * 15, 2);
    let size = map(scaledVol, 0, 1, 20, 220);
    size = constrain(size, 20, 220);
    size *= 3; 

    textFont("sans-serif");
    textSize(size);
    fill(180);
    text(tempTranscript, 50, yOffset + baseLineHeight);
  }

  pop();
}

function mousePressed() {
  if (!mic) {
    userStartAudio().then(() => {
      mic = new p5.AudioIn();
      mic.start();
      startRecognition();
    });
  }
}

function addLine(txt) {
  if (!txt) return;
  let vol = mic.getLevel();
  let baseSize = map(pow(vol * 15, 2), 0, 1, 20, 220);
  baseSize = constrain(baseSize, 20, 220);
  baseSize *= 3;     // 🔥 전체 글자 크기 3배 증가

  let wordColors = {};
  let wordFonts = {}; // 🎯 단어별 폰트 저장용
  let words = txt.split(" ");

  let currentLineEmotion = null;
  for (let w of words) {
    currentLineEmotion = getEmotionFromWord(w);
    if (currentLineEmotion) break;
  }

  // 이전 줄 감정 혼합 색상 처리
  let prevLine = lines[lines.length - 1];
  if (
    prevLine &&
    prevLine.lineEmotion &&
    currentLineEmotion &&
    prevLine.lineEmotion !== currentLineEmotion
  ) {
    let key1 = `${prevLine.lineEmotion}_${currentLineEmotion}`;
    let key2 = `${currentLineEmotion}_${prevLine.lineEmotion}`;
    let mixed =
      mixedColors[key1] ||
      mixedColors[key2] ||
      emotionColors[currentLineEmotion];
    for (let w in prevLine.colors) {
      prevLine.colors[w] = mixed;
    }
  }

  // 🎨 단어별 감정 색상 + 폰트 지정
  for (let w of words) {
    let emo = getEmotionFromWord(w);
    if (emo) {
      wordColors[w] = emotionColors[emo];
      wordFonts[w] = random(emotionFonts[emo]); // 감정 단어만 폰트 변경
    } else {
      wordColors[w] = color(255);
      wordFonts[w] = "sans-serif"; // 기본 폰트 유지
    }
  }

  // 💾 저장
  lines.push({
    txt: txt,
    size: baseSize,
    colors: wordColors,
    fonts: wordFonts,
    lineEmotion: currentLineEmotion
  });
}


function calcTotalTextHeight() {
  let totalHeight = 0;
  for (let l of lines) {
    let x = 50;
    let lineCount = 1;
    textSize(l.size);
    let words = l.txt.split(" ");
    let thisLineHeight = l.size * 0.9;   // 🔥 글자 크기 기준 줄 높이

    for (let w of words) {
      let wWidth = textWidth(w + " ");
      if (x + wWidth > width - 50) {
        x = 50;
        lineCount++;
      }
      x += wWidth;
    }
    totalHeight += lineCount * thisLineHeight;
  }
  return totalHeight;
}

function startRecognition() {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "ko-KR";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let lastResult = event.results[event.results.length - 1];
    let transcript = lastResult[0].transcript.trim();

    if (lastResult.isFinal) {
      addLine(transcript);
      tempTranscript = "";
    } else {
      tempTranscript = transcript;
    }
  };

  recognition.start();
}

function getEmotionFromWord(txt) {
  if (["기뻐", "기쁘", "행복", "좋", "즐거워", "웃", "아름", "훌륭", "평화", "만족","빛","사랑","가볍","안녕"].some(w => txt.includes(w))) return "joy";
  if (["슬퍼", "우울", "눈물", "외로", "잃", "그리","망각","죄송","아비규환","그림자","패배","무겁","슬픈","슬프"].some(w => txt.includes(w))) return "sadness";
  if (["놀라", "깜짝", "충격"].some(w => txt.includes(w))) return "surprise";
  if (["무서", "불안", "공포", "긴장", "염려","두려","몸부림","걱정"].some(w => txt.includes(w))) return "fear";
  if (["싫", "혐오", "불쾌", "않", "징그러", "나쁘"].some(w => txt.includes(w))) return "disgust";
  if (["화", "짜증", "분노", "불행","투쟁","파멸"].some(w => txt.includes(w))) return "anger";
  return null;
}

function getColorFromWord(txt, prevEmotion = null) {
  let currentEmotion = getEmotionFromWord(txt);
  if (!currentEmotion) return color(255);

  if (prevEmotion && prevEmotion !== currentEmotion) {
    let key1 = `${prevEmotion}_${currentEmotion}`;
    let key2 = `${currentEmotion}_${prevEmotion}`;
    return mixedColors[key1] || mixedColors[key2] || emotionColors[currentEmotion];
  }
  return emotionColors[currentEmotion];
}

function startRecognition() {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "ko-KR";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let lastResult = event.results[event.results.length - 1];
    let transcript = lastResult[0].transcript.trim();

    if (lastResult.isFinal) {
      addLine(transcript);
      tempTranscript = "";
    } else {
      tempTranscript = transcript;
    }
  };

  //------------------------------------------------------------------
  // 🚀 핵심: 인식이 끝나면 자동 재시작
  //------------------------------------------------------------------
  recognition.onend = () => {
    console.warn("⛔ Recognition ended → restarting...");
    restartRecognition();
  };

  //------------------------------------------------------------------
  // 🚀 에러 발생해도 자동 재시작
  //------------------------------------------------------------------
  recognition.onerror = (event) => {
    console.warn("⚠️ Recognition error:", event.error);
    restartRecognition();
  };

  recognition.start();
}

// 🔁 안전한 재시작
function restartRecognition() {
  // 잠깐 딜레이 후 다시 재부팅
  setTimeout(() => {
    try {
      startRecognition();
    } catch (e) {
      console.error("Restart failed:", e);
    }
  }, 300);
}

// -----------------------------------------------------
// 🖱 마우스 휠로 과거 텍스트 보기 기능
// -----------------------------------------------------
function mouseWheel(event) {
  scrollOffset += event.delta;

  // 최소/최대 범위 제한
  let totalHeight = calcTotalTextHeight();
  let visibleHeight = height - 150;
  let maxOffset = max(0, totalHeight - visibleHeight);

  scrollOffset = constrain(scrollOffset, 0, maxOffset);
}
