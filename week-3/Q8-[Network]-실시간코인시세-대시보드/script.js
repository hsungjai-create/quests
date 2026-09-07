// ===== 관심 코인 목록: 자유롭게 추가/삭제 가능 =====
const watchList = ["bitcoin", "ethereum", "ripple", "solana", "dogecoin"];

// CoinGecko id에 대응하는 표시용 이름/심볼 (simple/price는 이름 정보를 주지 않으므로 직접 매핑)
const coinMeta = {
  bitcoin: { name: "Bitcoin", symbol: "BTC" },
  ethereum: { name: "Ethereum", symbol: "ETH" },
  ripple: { name: "Ripple", symbol: "XRP" },
  solana: { name: "Solana", symbol: "SOL" },
  dogecoin: { name: "Dogecoin", symbol: "DOGE" },
};

const API_URL = "https://api.coingecko.com/api/v3/simple/price";
const AUTO_REFRESH_INTERVAL_MS = 15000; // 자동 갱신 주기 (최소 10초 이상)

// DOM 요소
const cardGrid = document.getElementById("cardGrid");
const refreshBtn = document.getElementById("refreshBtn");
const autoToggleBtn = document.getElementById("autoToggleBtn");
const lastUpdatedEl = document.getElementById("lastUpdated");
const toastEl = document.getElementById("toast");

let autoRefreshTimer = null;

// config.js가 없거나 API_KEY가 비어있어도 동작해야 하므로 안전하게 참조
function getApiKey() {
  return typeof CONFIG !== "undefined" && CONFIG.COINGECKO_API_KEY
    ? CONFIG.COINGECKO_API_KEY
    : "";
}

// ===== 1. CoinGecko API 호출 =====
async function fetchPrices() {
  const params = new URLSearchParams({
    ids: watchList.join(","),
    vs_currencies: "krw,usd",
    include_24hr_change: "true",
  });

  const headers = {};
  const apiKey = getApiKey();
  // API Key가 있을 때만 헤더에 주입 (없어도 public 엔드포인트는 호출 가능)
  if (apiKey) {
    headers["x-cg-demo-api-key"] = apiKey;
  }

  const response = await fetch(`${API_URL}?${params.toString()}`, { headers });

  if (!response.ok) {
    throw new Error(`API 응답 오류: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log("[fetchPrices] 받아온 데이터:", data);
  return data;
}

// ===== 2. 카드 UI 렌더링 =====
function renderCards(data) {
  cardGrid.innerHTML = "";

  watchList.forEach((id) => {
    const coinData = data[id];
    const meta = coinMeta[id] || { name: id, symbol: id };

    if (!coinData) {
      // 해당 코인 데이터가 없는 경우(잘못된 id 등)
      cardGrid.appendChild(buildErrorCard(`${meta.name} 데이터를 찾을 수 없습니다.`));
      return;
    }

    cardGrid.appendChild(buildCoinCard(meta, coinData));
  });
}

function buildCoinCard(meta, coinData) {
  const price = coinData.krw;
  const changePercent = coinData.krw_24h_change;

  // ===== 3. 상승/하락 색상 분기 + 화살표 아이콘 =====
  let trend = "flat";
  let arrow = "▬";
  if (changePercent > 0) {
    trend = "up";
    arrow = "▲";
  } else if (changePercent < 0) {
    trend = "down";
    arrow = "▼";
  }

  const card = document.createElement("div");
  card.className = `coin-card ${trend}`;

  const formattedPrice =
    typeof price === "number"
      ? `₩${Math.round(price).toLocaleString("ko-KR")}`
      : "가격 정보 없음";

  const formattedChange =
    typeof changePercent === "number" ? `${Math.abs(changePercent).toFixed(2)}%` : "-";

  card.innerHTML = `
    <div class="coin-top">
      <span class="coin-name">${meta.name}</span>
      <span class="coin-symbol">${meta.symbol}</span>
    </div>
    <div class="coin-price">${formattedPrice}</div>
    <div class="coin-change ${trend}">${arrow} ${formattedChange}</div>
  `;

  return card;
}

function buildErrorCard(message) {
  const card = document.createElement("div");
  card.className = "coin-card flat";
  card.innerHTML = `<div class="coin-name">${message}</div>`;
  return card;
}

// ===== 로딩 중 스켈레톤 UI =====
function renderSkeleton() {
  cardGrid.innerHTML = "";
  watchList.forEach(() => {
    const card = document.createElement("div");
    card.className = "coin-card";
    card.innerHTML = `
      <div class="skeleton skeleton-line wide"></div>
      <div class="skeleton skeleton-line medium"></div>
      <div class="skeleton skeleton-line short"></div>
    `;
    cardGrid.appendChild(card);
  });
}

// ===== 4. 에러 토스트 =====
function showToast(message) {
  toastEl.textContent = `⚠️ ${message}`;
  toastEl.hidden = false;
}

function hideToast() {
  toastEl.hidden = true;
}

function updateLastUpdatedTime() {
  const now = new Date();
  lastUpdatedEl.textContent = `마지막 업데이트: ${now.toLocaleTimeString("ko-KR")}`;
}

// ===== 전체 갱신 흐름: 호출 → 렌더링 → 예외 처리 =====
async function refreshDashboard() {
  renderSkeleton();
  hideToast();

  try {
    const data = await fetchPrices();
    renderCards(data);
    updateLastUpdatedTime();
  } catch (error) {
    console.error("[refreshDashboard] 시세 조회 실패:", error);
    cardGrid.innerHTML = "";
    cardGrid.appendChild(
      buildErrorCard("시세를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.")
    );
    showToast("네트워크 오류 또는 API 요청 제한(rate limit)이 발생했습니다.");
  }
}

// ===== 5. 새로고침 버튼 =====
refreshBtn.addEventListener("click", refreshDashboard);

// ===== 자동 갱신 on/off 토글 =====
function startAutoRefresh() {
  autoRefreshTimer = setInterval(refreshDashboard, AUTO_REFRESH_INTERVAL_MS);
  autoToggleBtn.dataset.active = "true";
  autoToggleBtn.textContent = "⏱️ 자동 갱신: ON";
}

function stopAutoRefresh() {
  clearInterval(autoRefreshTimer);
  autoRefreshTimer = null;
  autoToggleBtn.dataset.active = "false";
  autoToggleBtn.textContent = "⏱️ 자동 갱신: OFF";
}

autoToggleBtn.addEventListener("click", () => {
  const isActive = autoToggleBtn.dataset.active === "true";
  if (isActive) {
    stopAutoRefresh();
  } else {
    startAutoRefresh();
  }
});

// 페이지 로드 시 최초 1회 조회
refreshDashboard();
