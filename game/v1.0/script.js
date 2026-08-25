// ==============================
// 初期設定と状態管理
// ==============================
let stage = 1;
let coins = 0;
let tickets = 0;
let baseSpins = 25;
let spinBonus = 0;
let coinMultiplier = 1;

let isSpinning = false;
let currentShopOptions = [];
let upgradeHistory = []; // 取得済み強化の履歴

// 各絵柄の「完全初期値」
const INITIAL_SYMBOLS = [
  { symbol: "🍒", reward: 15, weight: 45 },
  { symbol: "🍋", reward: 20, weight: 30 },
  { symbol: "🍀", reward: 30, weight: 15 },
  { symbol: "🔔", reward: 40, weight: 7 },
  { symbol: "7",  reward: 70, weight: 3 }
];

// 引き継ぎのベースとなる値（1周目は完全初期値と同じ）
let inheritedSymbols = JSON.parse(JSON.stringify(INITIAL_SYMBOLS));

// プレイヤーの現在の絵柄ステータス
let symbols = JSON.parse(JSON.stringify(INITIAL_SYMBOLS));

// 目標コイン（難易度曲線）
function getTargetCoins() {
  return Math.floor(25 * stage * stage + 10 * stage);
}

// ==============================
// 抽選ロジック
// ==============================
function getRandomSymbol() {
  const totalWeight = symbols.reduce((sum, item) => sum + item.weight, 0);
  let randomNum = Math.floor(Math.random() * totalWeight);

  for (const item of symbols) {
    if (randomNum < item.weight) {
      return item;
    }
    randomNum -= item.weight;
  }
}

// ==============================
// 強化プールとショップ
// ==============================
const allUpgradesPool = [
  {
    id: "coin-mul",
    name: "コイン倍率UP",
    description: "全体の獲得コイン倍率 +0.5倍",
    cost: 1,
    action: () => { coinMultiplier += 0.5; }
  },
  {
    id: "spin-add",
    name: "スピン回数UP",
    description: "スピン +5回",
    cost: 1,
    action: () => { spinBonus += 5; baseSpins += 5; }
  },
  ...INITIAL_SYMBOLS.map(s => ({
    id: `weight-${s.symbol}`,
    name: `${s.symbol} 出現率UP`,
    description: `${s.symbol} 出現率 +10`,
    cost: 1,
    action: () => {
      const target = symbols.find(item => item.symbol === s.symbol);
      if (target) target.weight += 10;
    }
  })),
  ...INITIAL_SYMBOLS.map(s => ({
    id: `reward-${s.symbol}`,
    name: `${s.symbol} 配当UP`,
    description: `${s.symbol} 獲得コイン +15`,
    cost: 1,
    action: () => {
      const target = symbols.find(item => item.symbol === s.symbol);
      if (target) target.reward += 15;
    }
  }))
];

function generateShopOptions() {
  const shuffled = [...allUpgradesPool].sort(() => 0.5 - Math.random());
  currentShopOptions = shuffled.slice(0, 3);
  renderShop();
}

function buyUpgrade(index) {
  if (isSpinning) return;
  const upgrade = currentShopOptions[index];
  if (tickets < upgrade.cost) {
    document.getElementById("message").textContent = "チケットが足りません。";
    return;
  }

  tickets -= upgrade.cost;
  upgrade.action();
  
  // 取得履歴に追加
  upgradeHistory.push(upgrade.name);

  generateShopOptions();
  updateDisplay();
  document.getElementById("message").textContent = `「${upgrade.name}」を購入！`;
}

// チケット1枚でショップ再抽選
function rerollShop() {
  if (isSpinning) return;
  if (tickets < 1) {
    document.getElementById("message").textContent = "チケットが足りません。";
    return;
  }

  tickets -= 1;
  generateShopOptions();
  updateDisplay();
  document.getElementById("message").textContent = "ショップの品揃えを更新しました！";
}

// ==============================
// 画面描画
// ==============================
function updateDisplay() {
  document.getElementById("stage").textContent = stage;
  document.getElementById("coins").textContent = coins;
  document.getElementById("tickets").textContent = tickets;
  document.getElementById("target").textContent = getTargetCoins();
  document.getElementById("spins").textContent = baseSpins;

  renderSymbolTable();
  renderShop();
  renderStatusSummary();   // RPG風ステータス一括表示
  renderUpgradeHistory();  // 重複カウント対応履歴
}

function renderSymbolTable() {
  const tbody = document.getElementById("symbol-table-body");
  tbody.innerHTML = "";
  const totalWeight = symbols.reduce((sum, item) => sum + item.weight, 0);

  symbols.forEach(item => {
    const chance = ((item.weight / totalWeight) * 100).toFixed(1);
    const actualReward = Math.floor(item.reward * coinMultiplier);
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.symbol}</td>
      <td>${actualReward} 枚 <small style="color:#888;">(${item.reward})</small></td>
      <td>${chance}% (${item.weight})</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderShop() {
  const container = document.getElementById("shop-options");
  container.innerHTML = "";

  // 3つの強化オプションを描画
  currentShopOptions.forEach((option, index) => {
    const div = document.createElement("div");
    div.className = "upgrade";
    div.innerHTML = `
      <p><strong>${option.name}</strong></p>
      <p>${option.description}</p>
      <button onclick="buyUpgrade(${index})" ${tickets < option.cost || isSpinning ? "disabled" : ""}>
        チケット${option.cost}枚
      </button>
    `;
    container.appendChild(div);
  });

  // ショップ再抽選ボタンの追加
  const rerollDiv = document.createElement("div");
  rerollDiv.style.marginTop = "10px";
  rerollDiv.innerHTML = `
    <button onclick="rerollShop()" ${tickets < 1 || isSpinning ? "disabled" : ""} style="background-color: #f0ad4e; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
      品揃えを更新（チケット1枚）
    </button>
  `;
  container.appendChild(rerollDiv);
}

// 現在のステータス一括表示（RPG風）
function renderStatusSummary() {
  const container = document.getElementById("status-summary-list");
  if (!container) return;
  
  let html = `
    <p><strong>全体倍率:</strong> ×${coinMultiplier.toFixed(1)}</p>
    <p><strong>スピン:</strong> ${baseSpins} 回 (＋${spinBonus})</p>
    <hr style="border:0; border-top:1px solid #eee; margin:5px 0;">
  `;

  symbols.forEach((s, index) => {
    const initSymbol = INITIAL_SYMBOLS[index];
    const baseReward = initSymbol ? initSymbol.reward : s.reward;
    const baseWeight = initSymbol ? initSymbol.weight : s.weight;

    html += `<p><strong>${s.symbol}:</strong>  ${Math.floor(s.reward * coinMultiplier)} (初期:${baseReward}) / 確率 ${s.weight} (初期:${baseWeight})</p>`;
  });

  container.innerHTML = html;
}

// 取得履歴の重複集計表示
function renderUpgradeHistory() {
  const ul = document.getElementById("upgrades-history-list");
  if (!ul) return;
  ul.innerHTML = "";

  if (upgradeHistory.length === 0) {
    ul.innerHTML = "<li style='color:#888;'>まだ強化はありません</li>";
    return;
  }

  const counts = {};
  upgradeHistory.forEach(name => {
    counts[name] = (counts[name] || 0) + 1;
  });

  Object.keys(counts).forEach(name => {
    const count = counts[name];
    const li = document.createElement("li");
    
    if (count > 1) {
      li.textContent = `・${name} ×${count}`;
    } else {
      li.textContent = `・${name}`;
    }
    
    ul.appendChild(li);
  });
}

// ==============================
// スロット回転処理（演出ON/OFF対応）
// ==============================
function spin() {
  if (isSpinning) return;
  if (baseSpins <= 0) {
    document.getElementById("message").textContent = "スピン回数がありません。";
    return;
  }

  isSpinning = true;
  baseSpins--;
  document.getElementById("spin-button").disabled = true;
  updateDisplay();

  const reel1 = document.getElementById("reel1");
  const reel2 = document.getElementById("reel2");
  const reel3 = document.getElementById("reel3");

  const res1 = getRandomSymbol();
  const res2 = getRandomSymbol();
  const res3 = getRandomSymbol();

  const animToggle = document.getElementById("animation-toggle");
  const isAnimationOn = animToggle ? animToggle.checked : true;

  if (isAnimationOn) {
    document.getElementById("message").textContent = "スロット回転中...";
    reel1.classList.add("spinning");
    reel2.classList.add("spinning");
    reel3.classList.add("spinning");

    const interval = setInterval(() => {
      reel1.textContent = getRandomSymbol().symbol;
      reel2.textContent = getRandomSymbol().symbol;
      reel3.textContent = getRandomSymbol().symbol;
    }, 50);

    setTimeout(() => {
      reel1.classList.remove("spinning");
      reel1.textContent = res1.symbol;
    }, 500);

    setTimeout(() => {
      reel2.classList.remove("spinning");
      reel2.textContent = res2.symbol;
    }, 900);

    setTimeout(() => {
      clearInterval(interval);
      reel3.classList.remove("spinning");
      reel3.textContent = res3.symbol;

      evaluateResult(res1, res2, res3);
    }, 1300);

  } else {
    reel1.textContent = res1.symbol;
    reel2.textContent = res2.symbol;
    reel3.textContent = res3.symbol;

    evaluateResult(res1, res2, res3);
  }
}

function evaluateResult(r1, r2, r3) {
  let reward = 0;
  if (r1.symbol === r2.symbol && r2.symbol === r3.symbol) {
    reward = r1.reward;
  }

  reward = Math.floor(reward * coinMultiplier);
  coins += reward;

  if (reward > 0) {
    document.getElementById("message").textContent = `${reward} コイン獲得！`;
  } else {
    document.getElementById("message").textContent = "ハズレ！";
  }

  isSpinning = false;
  document.getElementById("spin-button").disabled = false;
  
  updateDisplay();
  checkStageClear();
  checkGameOver();
}

// ==============================
// ステージクリア & ゲームオーバー
// ==============================
function checkStageClear() {
  if (coins >= getTargetCoins()) {
    tickets += stage;
    stage++;
    baseSpins = 25 + spinBonus;
    generateShopOptions();
    document.getElementById("message").textContent = `ステージクリア！ チケットを${stage - 1}枚獲得！`;
    updateDisplay();
  }
}

function checkGameOver() {
  if (baseSpins <= 0 && coins < getTargetCoins()) {
    document.getElementById("message").textContent = "ゲームオーバー... 強化の一部を引き継いで再挑戦できます。";
    document.getElementById("spin-button").style.display = "none";
    document.getElementById("retry-button").style.display = "inline-block";
  }
}

function retryGame() {
  upgradeHistory = [];

  symbols.forEach((sym, i) => {
    const base = inheritedSymbols[i];

    const newlyAddedReward = sym.reward - base.reward;
    const rewardBonusToKeep = Math.floor(newlyAddedReward * 0.5);
    
    base.reward += rewardBonusToKeep;
    sym.reward = base.reward;

    const newlyAddedWeight = sym.weight - base.weight;
    const weightBonusToKeep = Math.floor(newlyAddedWeight * 0.5);

    base.weight += weightBonusToKeep;
    sym.weight = base.weight;

    const totalBonusReward = base.reward - INITIAL_SYMBOLS[i].reward;
    const totalBonusWeight = base.weight - INITIAL_SYMBOLS[i].weight;

    if (totalBonusReward > 0 || totalBonusWeight > 0) {
      upgradeHistory.push(`[引き継ぎ累計] ${sym.symbol} 配当+${totalBonusReward} / 重み+${totalBonusWeight}`);
    }
  });

  if (upgradeHistory.length === 0) {
    upgradeHistory.push("(引き継ぎ強化なし)");
  }

  stage = 1;
  coins = 0;
  tickets = 0;
  baseSpins = 25;
  spinBonus = 0;
  coinMultiplier = 1;

  document.getElementById("spin-button").style.display = "inline-block";
  document.getElementById("retry-button").style.display = "none";
  document.getElementById("message").textContent = "過去の蓄積＋今回の成果の一部を引き継いでリトライ！";

  generateShopOptions();
  updateDisplay();
}

// ==============================
// セーブ & ロード機能
// ==============================
function saveData(slotNumber) {
  if (isSpinning) return;

  const saveDataObj = {
    stage: stage,
    coins: coins,
    tickets: tickets,
    baseSpins: baseSpins,
    spinBonus: spinBonus,
    coinMultiplier: coinMultiplier,
    symbols: symbols,
    inheritedSymbols: inheritedSymbols,
    currentShopOptions: currentShopOptions,
    upgradeHistory: upgradeHistory,
    savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  localStorage.setItem(`slot_game_save_${slotNumber}`, JSON.stringify(saveDataObj));
  document.getElementById("message").textContent = `スロット ${slotNumber} にデータを保存しました！`;
  updateSaveSlotsDisplay();
}

function loadData(slotNumber) {
  if (isSpinning) return;

  const savedDataRaw = localStorage.getItem(`slot_game_save_${slotNumber}`);
  if (!savedDataRaw) {
    document.getElementById("message").textContent = `スロット ${slotNumber} にはデータがありません。`;
    return;
  }

  const saveDataObj = JSON.parse(savedDataRaw);

  stage = saveDataObj.stage;
  coins = saveDataObj.coins;
  tickets = saveDataObj.tickets;
  baseSpins = saveDataObj.baseSpins;
  spinBonus = saveDataObj.spinBonus;
  coinMultiplier = saveDataObj.coinMultiplier;
  symbols = saveDataObj.symbols;
  inheritedSymbols = saveDataObj.inheritedSymbols || JSON.parse(JSON.stringify(INITIAL_SYMBOLS));
  currentShopOptions = saveDataObj.currentShopOptions;
  upgradeHistory = saveDataObj.upgradeHistory || [];

  document.getElementById("spin-button").style.display = "inline-block";
  document.getElementById("retry-button").style.display = "none";

  document.getElementById("message").textContent = `スロット ${slotNumber} のデータを読み込みました！`;
  updateDisplay();
}

function updateSaveSlotsDisplay() {
  for (let i = 1; i <= 3; i++) {
    const savedDataRaw = localStorage.getItem(`slot_game_save_${i}`);
    const infoElem = document.getElementById(`slot-info-${i}`);

    if (infoElem) {
      if (savedDataRaw) {
        const data = JSON.parse(savedDataRaw);
        infoElem.innerHTML = `Stage ${data.stage}<br><small>(${data.savedAt})</small>`;
      } else {
        infoElem.textContent = "データなし";
      }
    }
  }
}

// ==============================
// イベントリスナー & 初期化
// ==============================
document.getElementById("spin-button").addEventListener("click", spin);
document.getElementById("retry-button").addEventListener("click", retryGame);

generateShopOptions();
updateSaveSlotsDisplay();
updateDisplay();