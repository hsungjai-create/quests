// ===== NASA APOD (Astronomy Picture of the Day) 매거진 =====
const API_URL = "https://api.nasa.gov/planetary/apod";
const STORAGE_KEY = "nasaApodApiKey"; // API 키는 여기(브라우저 localStorage)에만 저장, 코드에는 절대 넣지 않음
const FALLBACK_KEY = "DEMO_KEY"; // 키를 등록하지 않아도 동작하도록 NASA 공용 데모 키 사용 (요청 제한 있음)

// DOM 요소
const dateInput = document.getElementById("dateInput");
const todayBtn = document.getElementById("todayBtn");
const settingsBtn = document.getElementById("settingsBtn");
const keyBadge = document.getElementById("keyBadge");
const toastEl = document.getElementById("toast");
const articleEl = document.getElementById("article");

const settingsModal = document.getElementById("settingsModal");
const apiKeyInput = document.getElementById("apiKeyInput");
const saveKeyBtn = document.getElementById("saveKeyBtn");
const cancelKeyBtn = document.getElementById("cancelKeyBtn");
const clearKeyBtn = document.getElementById("clearKeyBtn");

// ===== API 키 관리 (localStorage) =====
function getApiKey() {
  return localStorage.getItem(STORAGE_KEY) || "";
}

function hasCustomKey() {
  return getApiKey().length > 0;
}

function updateKeyBadge() {
  if (hasCustomKey()) {
    keyBadge.hidden = true;
  } else {
    keyBadge.hidden = false;
    keyBadge.textContent =
      "⚠️ 등록된 API 키가 없어 공용 DEMO_KEY로 동작 중입니다 (요청 제한이 자주 발생할 수 있어요). ⚙️ 버튼을 눌러 본인 키를 등록하세요.";
  }
}

function openSettingsModal() {
  apiKeyInput.value = getApiKey();
  settingsModal.hidden = false;
  apiKeyInput.focus();
}

function closeSettingsModal() {
  settingsModal.hidden = true;
}

settingsBtn.addEventListener("click", openSettingsModal);
cancelKeyBtn.addEventListener("click", closeSettingsModal);
settingsModal.addEventListener("click", (e) => {
  if (e.target === settingsModal) closeSettingsModal();
});

saveKeyBtn.addEventListener("click", () => {
  const value = apiKeyInput.value.trim();
  if (value) {
    localStorage.setItem(STORAGE_KEY, value);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  updateKeyBadge();
  closeSettingsModal();
  loadApod(dateInput.value);
});

clearKeyBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  apiKeyInput.value = "";
  updateKeyBadge();
});

// ===== 날짜 처리 =====
const APOD_START_DATE = "1995-06-16"; // APOD 서비스 시작일
function todayString() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

function shiftDate(dateStr, deltaDays) {
  // toISOString()은 UTC로 변환하므로 UTC+9(한국) 등에서는 자정 기준 날짜가 하루 더 당겨진다.
  // 로컬 getter/setter만 사용해 그 문제를 피한다.
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + deltaDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

dateInput.max = todayString();
dateInput.min = APOD_START_DATE;
dateInput.value = todayString();

todayBtn.addEventListener("click", () => {
  dateInput.value = todayString();
  loadApod(dateInput.value);
});

dateInput.addEventListener("change", () => {
  if (dateInput.value) loadApod(dateInput.value);
});

// ===== 토스트 =====
function showToast(message) {
  toastEl.textContent = `⚠️ ${message}`;
  toastEl.hidden = false;
}

function hideToast() {
  toastEl.hidden = true;
}

// ===== 스켈레톤 UI =====
function renderSkeleton() {
  articleEl.innerHTML = `
    <div class="skel-hero skeleton"></div>
    <div class="skel-title skeleton"></div>
    <div class="skel-line skeleton" style="width: 40%;"></div>
    <div class="skel-line skeleton" style="width: 90%;"></div>
    <div class="skel-line skeleton" style="width: 85%;"></div>
    <div class="skel-line skeleton" style="width: 88%;"></div>
    <div class="skel-line skeleton" style="width: 60%;"></div>
  `;
}

// ===== 설명 텍스트를 문단으로 분리 =====
function paragraphsFrom(text) {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p}</p>`)
    .join("");
}

// ===== 1. NASA APOD API 호출 =====
async function fetchApod(dateStr) {
  const apiKey = hasCustomKey() ? getApiKey() : FALLBACK_KEY;
  const params = new URLSearchParams({ api_key: apiKey, date: dateStr });

  const response = await fetch(`${API_URL}?${params.toString()}`);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const err = new Error(body.msg || body.error?.message || `API 오류 (${response.status})`);
    err.status = response.status;
    throw err;
  }

  return response.json();
}

// ===== 2. 매거진 기사 렌더링 =====
function renderArticle(data, { fallbackFromToday = false } = {}) {
  const dateLabel = new Date(`${data.date}T00:00:00`).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const heroMedia =
    data.media_type === "video"
      ? `<iframe src="${data.url}" allow="encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>`
      : `<img src="${data.url}" alt="${escapeHtml(data.title)}" loading="lazy" />`;

  const hdLink =
    data.media_type === "image" && data.hdurl
      ? `<a href="${data.hdurl}" target="_blank" rel="noopener">🔍 원본 고화질 이미지 보기</a>`
      : "";

  const officialLink = `<a href="https://apod.nasa.gov/apod/ap${data.date.slice(2).replace(/-/g, "")}.html" target="_blank" rel="noopener">🛰️ NASA 원문 페이지</a>`;

  const fallbackNote = fallbackFromToday
    ? `<p class="fallback-note">📅 오늘 사진은 NASA가 아직 발행하지 않아, 가장 최근에 발행된 전날 사진을 보여드립니다.</p>`
    : "";

  articleEl.innerHTML = `
    ${fallbackNote}
    <div class="hero-media">${heroMedia}</div>
    ${data.copyright ? `<p class="hero-caption">© ${escapeHtml(data.copyright.trim())}</p>` : ""}
    <div class="issue-body">
      <div class="issue-meta">
        <span>${dateLabel}</span>
        <span class="dot">·</span>
        <span>NASA 오늘의 우주 사진</span>
      </div>
      <h2 class="issue-title">${escapeHtml(data.title)}</h2>
      <div class="issue-explanation">${paragraphsFrom(data.explanation)}</div>
      <p class="explanation-note">※ 설명은 NASA가 제공하는 영문 원문 그대로 표시됩니다.</p>
      <div class="issue-links">${hdLink}${officialLink}</div>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// ===== 3. 에러 카드 =====
function renderError(error) {
  let title = "사진을 불러오지 못했어요";
  let message = error.message || "잠시 후 다시 시도해주세요.";

  if (error.status === 403 || error.status === 401) {
    title = "API 키가 올바르지 않아요";
    message = "⚙️ 버튼을 눌러 API 키를 다시 확인해주세요.";
  } else if (error.status === 429) {
    title = "요청이 너무 많아요";
    message = "DEMO_KEY는 요청 제한이 낮습니다. 본인의 NASA API 키를 등록하면 훨씬 여유롭게 사용할 수 있어요.";
  }

  articleEl.innerHTML = `
    <div class="error-card">
      <span class="emoji">🛸</span>
      <h3>${title}</h3>
      <p>${message}</p>
    </div>
  `;
}

// ===== 전체 로딩 흐름 =====
// NASA는 미국 동부 시간 기준으로 발행하므로, 한국 시간으로 "오늘"을 요청하면
// 아직 발행 전이라 404가 나는 경우가 많다. 이때는 자동으로 전날 사진으로 대체한다.
async function loadApod(dateStr) {
  hideToast();
  renderSkeleton();

  try {
    const data = await fetchApod(dateStr);
    renderArticle(data);
  } catch (error) {
    const notPublishedYet = error.status === 404 && dateStr === todayString();

    if (notPublishedYet) {
      try {
        const data = await fetchApod(shiftDate(dateStr, -1));
        renderArticle(data, { fallbackFromToday: true });
        return;
      } catch (fallbackError) {
        console.error("[loadApod] 전날 사진 대체 조회도 실패:", fallbackError);
      }
    }

    console.error("[loadApod] APOD 조회 실패:", error);
    renderError(error);
    showToast(error.message);
  }
}

// ===== 초기 실행 =====
updateKeyBadge();
loadApod(dateInput.value);
