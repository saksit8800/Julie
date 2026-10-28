const cfg = window.ANNIVERSARY;

const lockScreen = document.getElementById("lockScreen");
const lockPanel = document.getElementById("lockPanel");
const pinDots = document.getElementById("pinDots");
const pinPad = document.getElementById("pinPad");
const pinFeedback = document.getElementById("pinFeedback");
const gate = document.getElementById("gate");
const world = document.getElementById("world");
const seal = document.getElementById("openSeal");
const petals = document.getElementById("petals");
const bgm = document.getElementById("bgm");
const songPicker = document.getElementById("songPicker");
const songTrack = document.getElementById("songTrack");
const songViewport = document.getElementById("songViewport");
const songPrev = document.getElementById("songPrev");
const songNext = document.getElementById("songNext");
const songConfirm = document.getElementById("songConfirm");
const songPickerKicker = document.getElementById("songPickerKicker");
const songPickerTitle = document.getElementById("songPickerTitle");
const nowPlaying = document.getElementById("nowPlaying");
const nowPlayToggle = document.getElementById("nowPlayToggle");
const nowPlayIcon = document.getElementById("nowPlayIcon");
const nowTitle = document.getElementById("nowTitle");
const nowArtist = document.getElementById("nowArtist");
const quizModal = document.getElementById("quizModal");
const quizChoices = document.getElementById("quizChoices");
const quizFeedback = document.getElementById("quizFeedback");
const popupLayer = document.getElementById("popups");
const photoView = document.getElementById("photoView");
const photoViewImg = document.getElementById("photoViewImg");
const photoViewTitle = document.getElementById("photoViewTitle");
const photoViewNote = document.getElementById("photoViewNote");

const unlocked = new Set();
let activePhoto = -1;
let songIndex = 0;
let songSliding = false;
let selectedSong = null;
let pickerMode = "start";
let swipeStartX = 0;
let pinValue = "";
let pinLocked = false;

function daysBetween(iso) {
  const start = new Date(iso + "T00:00:00");
  const now = new Date();
  return Math.max(0, Math.floor((now - start) / 86400000));
}

function fillStatic() {
  document.getElementById("herName").textContent = cfg.herName;
  document.getElementById("myName").textContent = cfg.myName;
  document.getElementById("eyebrow").textContent = cfg.anniversaryLabel;
  document.getElementById("heroDate").textContent = new Date(
    cfg.startedOn + "T00:00:00"
  ).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const heroLine = document.getElementById("heroLine");
  if (Array.isArray(cfg.heroLine)) {
    heroLine.innerHTML = cfg.heroLine
      .map((line) => `<span>${line}</span>`)
      .join("<br />");
  } else {
    heroLine.textContent = cfg.heroLine;
  }
  document.getElementById("daysTogether").textContent = daysBetween(cfg.startedOn);

  const sealImg = document.getElementById("sealPhotoImg");
  if (sealImg && cfg.sealPhoto) {
    sealImg.setAttribute("href", cfg.sealPhoto);
    sealImg.setAttributeNS("http://www.w3.org/1999/xlink", "href", cfg.sealPhoto);
  }

  document.getElementById("letterBody").innerHTML = "";
  document.getElementById("photoTotal").textContent = cfg.photos.length;

  document.getElementById("timeline").innerHTML = cfg.timeline
    .map((item) => `<li><time>${item.date}</time><p>${item.text}</p></li>`)
    .join("");

  document.getElementById("finaleTitle").textContent = cfg.finaleTitle;
  document.getElementById("finaleBody").textContent = cfg.finaleBody;

  const hint = document.getElementById("lockHint");
  if (hint) hint.textContent = cfg.lockHint || "";
}

function setupPinPad() {
  pinDots.innerHTML = Array.from({ length: 6 }, () => "<span></span>").join("");
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "ล้าง", "0", "ลบ"];
  pinPad.innerHTML = keys
    .map((key) => {
      if (key === "ล้าง") return `<button type="button" class="pin-clear" data-key="clear">ล้าง</button>`;
      if (key === "ลบ") return `<button type="button" class="pin-del" data-key="del">ลบ</button>`;
      return `<button type="button" data-key="${key}">${key}</button>`;
    })
    .join("");
  updatePinDots();
}

function updatePinDots() {
  [...pinDots.children].forEach((dot, i) => {
    dot.classList.toggle("is-filled", i < pinValue.length);
  });
}

function openDoorsToGate() {
  pinLocked = true;
  gate.hidden = false;
  rainPetals();
  lockScreen.classList.add("is-opening");
  window.setTimeout(() => {
    lockScreen.hidden = true;
    lockScreen.classList.remove("is-opening");
  }, 1450);
}

function submitPin() {
  const expected = String(cfg.lockPin || "").trim();
  if (pinValue === expected) {
    pinFeedback.hidden = false;
    pinFeedback.style.color = "#c9e6b8";
    pinFeedback.textContent = "ถูกต้อง — กำลังเปิดประตู";
    window.setTimeout(openDoorsToGate, 280);
    return;
  }

  lockPanel.classList.remove("is-wrong");
  void lockPanel.offsetWidth;
  lockPanel.classList.add("is-wrong");
  pinFeedback.hidden = false;
  pinFeedback.style.color = "#f0a0a8";
  pinFeedback.textContent = "รหัสยังไม่ถูก ลองใหม่นะ";
  window.setTimeout(() => {
    pinValue = "";
    updatePinDots();
    pinLocked = false;
  }, 420);
}

function pressPin(key) {
  if (pinLocked || lockScreen.hidden) return;
  if (key === "clear") {
    pinValue = "";
    pinFeedback.hidden = true;
    updatePinDots();
    return;
  }
  if (key === "del") {
    pinValue = pinValue.slice(0, -1);
    pinFeedback.hidden = true;
    updatePinDots();
    return;
  }
  if (!/^\d$/.test(key) || pinValue.length >= 6) return;
  pinValue += key;
  updatePinDots();
  if (pinValue.length === 6) {
    pinLocked = true;
    window.setTimeout(submitPin, 120);
  }
}

function renderGallery() {
  document.getElementById("unlockedCount").textContent = unlocked.size;
  const polaroids = document.getElementById("polaroids");
  polaroids.innerHTML = cfg.photos
    .map((photo, i) => {
      const tilt = [-6, 3, -2, 5][i % 4];
      const open = unlocked.has(i);
      const caption = open ? photo.caption : "???";
      return `<figure class="polaroid ${open ? "unlocked" : "locked"}" style="--tilt:${tilt}deg" data-i="${i}" tabindex="0" role="button" aria-label="${open ? photo.caption : "รูปที่ล็อก ข้อที่ " + (i + 1)}">
        <div class="ph" data-src="${photo.src}" data-open="${open}">♥</div>
        ${open ? "" : `<span class="lock-veil">🔒</span>`}
        <figcaption>${caption}</figcaption>
      </figure>`;
    })
    .join("");

  polaroids.querySelectorAll(".ph[data-open='true']").forEach((slot) => {
    const img = new Image();
    img.alt = slot.parentElement.querySelector("figcaption").textContent;
    img.onload = () => slot.replaceWith(img);
    img.src = slot.dataset.src;
  });
}

function openQuiz(index) {
  if (unlocked.has(index)) {
    openPhotoView(index);
    return;
  }
  activePhoto = index;
  const photo = cfg.photos[index];
  document.getElementById("quizIndex").textContent = String(index + 1);
  document.getElementById("quizQuestion").textContent = photo.question;
  quizFeedback.hidden = true;
  quizChoices.innerHTML = photo.choices
    .map((choice) => `<button type="button" data-choice="${choice}">${choice}</button>`)
    .join("");
  quizModal.hidden = false;
}

function closeQuiz() {
  quizModal.hidden = true;
  activePhoto = -1;
}

function openPhotoView(index) {
  const photo = cfg.photos[index];
  if (!photo) return;
  photoViewImg.src = photo.src;
  photoViewImg.alt = photo.caption;
  photoViewTitle.textContent = photo.caption;
  photoViewNote.textContent = photo.note || "";
  photoView.hidden = false;
}

function closePhotoView() {
  photoView.hidden = true;
  photoViewImg.removeAttribute("src");
}

function burstPopups(times) {
  const messages = cfg.popups || [];
  const layer = document.getElementById("popups");
  if (!layer || !messages.length) return;

  function spawn(i) {
    const el = document.createElement("span");
    el.className = "float-msg";
    el.textContent = messages[i % messages.length];
    el.style.left = 10 + Math.random() * 55 + "vw";
    el.style.top = 16 + Math.random() * 55 + "vh";
    el.style.fontSize = 1.05 + Math.random() * 0.45 + "rem";
    layer.appendChild(el);
    window.setTimeout(() => el.remove(), 5200);
  }

  for (let i = 0; i < Math.min(6, times); i++) spawn(i);
  for (let i = 6; i < times; i++) {
    window.setTimeout(() => spawn(i), (i - 5) * 110);
  }
}

function unlockPhoto(index) {
  unlocked.add(index);
  closeQuiz();
  renderGallery();
  rainPetals();
  burstPopups(16);
  openPhotoView(index);
  if (unlocked.size === cfg.photos.length) {
    window.setTimeout(() => burstPopups(26), 700);
  }
}

function handleChoice(choice) {
  const photo = cfg.photos[activePhoto];
  if (!photo) return;
  if (choice === photo.answer) {
    quizFeedback.hidden = false;
    quizFeedback.textContent = "ถูกแล้ว — ปลดล็อครูปให้เธอ";
    burstPopups(24);
    window.setTimeout(() => unlockPhoto(activePhoto), 500);
    return;
  }
  const hints = cfg.wrongHints;
  quizFeedback.hidden = false;
  quizFeedback.textContent = hints[Math.floor(Math.random() * hints.length)];
  const btn = quizChoices.querySelector(`[data-choice="${choice}"]`);
  if (btn) {
    btn.classList.add("is-wrong");
    window.setTimeout(() => btn.classList.remove("is-wrong"), 400);
  }
}

function rainPetals() {
  for (let i = 0; i < 28; i++) {
    const p = document.createElement("i");
    p.className = "petal";
    p.style.left = Math.random() * 100 + "vw";
    p.style.animationDuration = 4 + Math.random() * 5 + "s";
    p.style.animationDelay = Math.random() * 1.4 + "s";
    p.style.transform = `scale(${0.6 + Math.random()})`;
    petals.appendChild(p);
    setTimeout(() => p.remove(), 9000);
  }
}

let typeTimer = null;
let letterTyped = false;

function stopTypeLetter() {
  if (typeTimer) {
    window.clearTimeout(typeTimer);
    typeTimer = null;
  }
}

function typeLetter() {
  const body = document.getElementById("letterBody");
  const paragraphs = cfg.letter || [];
  if (!paragraphs.length || letterTyped) return;

  letterTyped = true;
  body.innerHTML = "";
  let pIndex = 0;
  let cIndex = 0;
  let current = null;

  function tick() {
    if (pIndex >= paragraphs.length) {
      const caret = body.querySelector(".type-caret");
      if (caret) caret.remove();
      typeTimer = null;
      return;
    }

    if (!current) {
      current = document.createElement("p");
      current.className = "typing";
      body.appendChild(current);
      cIndex = 0;
    }

    const text = paragraphs[pIndex];
    current.textContent = text.slice(0, cIndex + 1);
    cIndex += 1;

    let caret = body.querySelector(".type-caret");
    if (!caret) {
      caret = document.createElement("span");
      caret.className = "type-caret";
      caret.setAttribute("aria-hidden", "true");
    }
    current.appendChild(caret);

    if (cIndex >= text.length) {
      current.classList.remove("typing");
      current = null;
      pIndex += 1;
      typeTimer = window.setTimeout(tick, 380);
      return;
    }

    const ch = text[cIndex - 1];
    const delay = ch === " " ? 18 : ch === "," || ch === "!" || ch === "?" ? 90 : 22 + Math.random() * 18;
    typeTimer = window.setTimeout(tick, delay);
  }

  tick();
}

function resetReveals() {
  stopTypeLetter();
  letterTyped = false;
  document.getElementById("letterBody").innerHTML = "";
  world.classList.remove("is-entering");
  world.querySelectorAll(".reveal, .reveal-section").forEach((el) => {
    el.classList.remove("is-in");
  });
}

function assembleHero() {
  const pieces = [...world.querySelectorAll(".hero .reveal")].sort(
    (a, b) => Number(a.dataset.reveal || 0) - Number(b.dataset.reveal || 0)
  );
  pieces.forEach((el, i) => {
    window.setTimeout(() => el.classList.add("is-in"), 180 + i * 220);
  });
}

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      if (entry.target.classList.contains("letter")) typeLetter();
      sectionObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
);

function watchSections() {
  world.querySelectorAll(".reveal-section").forEach((section) => {
    sectionObserver.observe(section);
  });
}

function songs() {
  return cfg.songs || [];
}

function renderSongPicker() {
  const list = songs();
  songTrack.innerHTML = list
    .map(
      (song, i) => `<button class="song-card" type="button" data-song="${i}" aria-label="${song.title}">
        <span class="song-card-inner">
          <span class="song-disc" aria-hidden="true"></span>
          <strong>${song.title}</strong>
          <span>${song.artist || ""}</span>
        </span>
      </button>`
    )
    .join("");
  updateSongCarousel(false);
}

function updateSongCarousel(animate = true) {
  const list = songs();
  if (!list.length) return;
  songIndex = Math.max(0, Math.min(songIndex, list.length - 1));
  songTrack.style.transition = animate ? "" : "none";
  const offset = songViewport.clientWidth * 0.25 - songIndex * (songViewport.clientWidth * 0.5);
  songTrack.style.transform = `translateX(${offset}px)`;
  songTrack.querySelectorAll(".song-card").forEach((card, i) => {
    card.classList.toggle("is-active", i === songIndex);
  });
  songPrev.disabled = songIndex <= 0;
  songNext.disabled = songIndex >= list.length - 1;
  if (!animate) {
    songTrack.getBoundingClientRect();
    songTrack.style.transition = "";
  }
}

function shiftSong(dir) {
  if (songSliding) return;
  const next = songIndex + dir;
  if (next < 0 || next >= songs().length) return;
  songSliding = true;
  songIndex = next;
  updateSongCarousel(true);
  window.setTimeout(() => {
    songSliding = false;
  }, 460);
}

function openSongPicker(mode = "start") {
  pickerMode = mode;
  if (mode === "change") {
    songPickerKicker.textContent = "กำลังฟังอยู่";
    songPickerTitle.textContent = "เปลี่ยนเพลง";
    songConfirm.textContent = "เล่นเพลงนี้";
  } else {
    songPickerKicker.textContent = "ก่อนเปิดจดหมาย";
    songPickerTitle.textContent = "เลือกเพลงประกอบ";
    songConfirm.textContent = "เปิดด้วยเพลงนี้";
  }
  songIndex = Math.min(songIndex, Math.max(0, songs().length - 1));
  songPicker.hidden = false;
  renderSongPicker();
  window.requestAnimationFrame(() => updateSongCarousel(false));
}

function closeSongPicker() {
  songPicker.hidden = true;
}

function updateNowPlayingUI() {
  const song = selectedSong || songs()[songIndex];
  if (!song) return;
  nowTitle.textContent = song.title;
  nowArtist.textContent = song.artist || "";
  nowPlaying.hidden = false;
  nowPlaying.classList.toggle("is-playing", !bgm.paused);
  nowPlayIcon.textContent = bgm.paused ? "▶" : "❚❚";
}

async function playSelectedSong(autoplay = true) {
  const song = songs()[songIndex];
  if (!song) return;
  selectedSong = song;
  bgm.src = song.src;
  updateNowPlayingUI();
  if (!autoplay) return;
  try {
    await bgm.play();
    updateNowPlayingUI();
  } catch {
    updateNowPlayingUI();
  }
}

async function playSongAt(index, autoplay = true) {
  const list = songs();
  if (!list.length) return;
  songIndex = ((index % list.length) + list.length) % list.length;
  await playSelectedSong(autoplay);
}

function enterLetterWorld() {
  resetReveals();
  world.hidden = false;
  world.classList.add("is-entering");
  window.scrollTo({ top: 0, behavior: "instant" });
  assembleHero();
  watchSections();
}

function openLetter() {
  if (gate.classList.contains("is-leaving") || !songPicker.hidden) return;
  rainPetals();
  gate.classList.add("is-leaving");

  window.setTimeout(() => {
    gate.hidden = true;
    gate.classList.remove("is-leaving");
    openSongPicker("start");
  }, 480);
}

async function confirmSong() {
  closeSongPicker();
  await playSelectedSong(true);
  if (pickerMode === "start") enterLetterWorld();
}

async function togglePlayback() {
  if (!selectedSong) {
    openSongPicker(world.hidden ? "start" : "change");
    return;
  }
  if (bgm.paused) {
    try {
      await bgm.play();
    } catch {
      /* browser may block until tap */
    }
  } else {
    bgm.pause();
  }
  updateNowPlayingUI();
}

document.getElementById("polaroids").addEventListener("click", (event) => {
  const card = event.target.closest(".polaroid");
  if (!card) return;
  openQuiz(Number(card.dataset.i));
});

document.getElementById("polaroids").addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest(".polaroid");
  if (!card) return;
  event.preventDefault();
  openQuiz(Number(card.dataset.i));
});

quizChoices.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-choice]");
  if (!btn) return;
  handleChoice(btn.dataset.choice);
});

document.getElementById("quizClose").addEventListener("click", closeQuiz);
quizModal.addEventListener("click", (event) => {
  if (event.target === quizModal) closeQuiz();
});

document.getElementById("photoViewClose").addEventListener("click", closePhotoView);
document.getElementById("photoViewDone").addEventListener("click", closePhotoView);
photoView.addEventListener("click", (event) => {
  if (event.target === photoView) closePhotoView();
});

document.addEventListener("keydown", (event) => {
  if (!lockScreen.hidden) {
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      pressPin(event.key);
    } else if (event.key === "Backspace") {
      event.preventDefault();
      pressPin("del");
    } else if (event.key === "Escape") {
      event.preventDefault();
      pressPin("clear");
    }
    return;
  }
  if (!songPicker.hidden) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      shiftSong(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      shiftSong(1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      confirmSong();
    }
    return;
  }
  if (event.key !== "Escape") return;
  if (!photoView.hidden) closePhotoView();
  else if (!quizModal.hidden) closeQuiz();
});

pinPad.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-key]");
  if (!btn) return;
  pressPin(btn.dataset.key);
});

seal.addEventListener("click", openLetter);

songPrev.addEventListener("click", () => shiftSong(-1));
songNext.addEventListener("click", () => shiftSong(1));
songConfirm.addEventListener("click", confirmSong);

songTrack.addEventListener("click", (event) => {
  const card = event.target.closest(".song-card");
  if (!card) return;
  const index = Number(card.dataset.song);
  if (Number.isNaN(index)) return;
  if (index === songIndex) return;
  songIndex = index;
  updateSongCarousel(true);
});

songViewport.addEventListener(
  "touchstart",
  (event) => {
    swipeStartX = event.changedTouches[0].clientX;
  },
  { passive: true }
);

songViewport.addEventListener(
  "touchend",
  (event) => {
    const dx = event.changedTouches[0].clientX - swipeStartX;
    if (Math.abs(dx) < 40) return;
    shiftSong(dx < 0 ? 1 : -1);
  },
  { passive: true }
);

window.addEventListener("resize", () => {
  if (!songPicker.hidden) updateSongCarousel(false);
});

document.getElementById("replay").addEventListener("click", () => {
  unlocked.clear();
  renderGallery();
  closeQuiz();
  closePhotoView();
  closeSongPicker();
  resetReveals();
  bgm.pause();
  bgm.currentTime = 0;
  selectedSong = null;
  nowPlaying.hidden = true;
  nowPlaying.classList.remove("is-playing");
  world.hidden = true;
  world.classList.remove("is-entering");
  gate.hidden = false;
  gate.classList.remove("is-leaving");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

nowPlayToggle.addEventListener("click", togglePlayback);
document.getElementById("nowChange").addEventListener("click", () => openSongPicker("change"));
document.getElementById("nowPrev").addEventListener("click", () => playSongAt(songIndex - 1));
document.getElementById("nowNext").addEventListener("click", () => playSongAt(songIndex + 1));

bgm.addEventListener("play", updateNowPlayingUI);
bgm.addEventListener("pause", updateNowPlayingUI);
bgm.addEventListener("ended", () => {
  playSongAt(songIndex + 1, true);
});

function seedGateStars() {
  const layer = document.getElementById("gateStars");
  if (!layer || layer.childElementCount) return;
  for (let i = 0; i < 36; i++) {
    const star = document.createElement("i");
    star.className = "gate-star";
    star.style.left = Math.random() * 100 + "%";
    star.style.top = Math.random() * 100 + "%";
    star.style.setProperty("--dur", 2.2 + Math.random() * 3.8 + "s");
    star.style.animationDelay = Math.random() * 4 + "s";
    star.style.width = star.style.height = 1.5 + Math.random() * 2.5 + "px";
    layer.appendChild(star);
  }
}

function softGatePetals() {
  for (let i = 0; i < 10; i++) {
    const p = document.createElement("i");
    p.className = "petal";
    p.style.left = Math.random() * 100 + "vw";
    p.style.animationDuration = 8 + Math.random() * 7 + "s";
    p.style.animationDelay = Math.random() * 5 + "s";
    p.style.opacity = "0.35";
    p.style.transform = `scale(${0.4 + Math.random() * 0.5})`;
    petals.appendChild(p);
    setTimeout(() => p.remove(), 16000);
  }
}

fillStatic();
setupPinPad();
renderGallery();
seedGateStars();
softGatePetals();
setInterval(softGatePetals, 9000);
