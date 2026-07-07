// ============================================================
// CONFIGURAÇÃO — preencha a URL após deployar o Apps Script
// ============================================================
const APPS_SCRIPT_URL = "https://script.google.com/a/macros/ifood.com.br/s/AKfycbwRb065330AmN4Z5QjOnporfzLD31I_LQxYvZwYQQXRb_-adzSe-Sb1BnbszgH8NV3p/exec";
// ============================================================

let allFranquias = [];
let currentLojas = [];

// -------- bootstrap --------
document.addEventListener("DOMContentLoaded", () => {
  if (!APPS_SCRIPT_URL) {
    showStatus(
      "⚙️ Configure a URL do Apps Script no arquivo <strong>app.js</strong> (variável <code>APPS_SCRIPT_URL</code>).",
      "warning"
    );
    return;
  }
  loadData();
});

// -------- data fetching --------
async function loadData() {
  showStatus("Carregando dados...", "loading");

  try {
    const resp = await fetch(APPS_SCRIPT_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    const data = await resp.json();

    if (!data.franquias || !Array.isArray(data.franquias)) {
      throw new Error("Formato de dados inválido: campo 'franquias' ausente.");
    }

    allFranquias = data.franquias;
    populateDropdown(allFranquias);
    hideStatus();
    document.getElementById("controls").classList.remove("hidden");
  } catch (err) {
    showStatus(
      `❌ Erro ao carregar dados: <strong>${err.message}</strong><br>Verifique a URL do Apps Script e as permissões de acesso.`,
      "error"
    );
    console.error(err);
  }
}

// -------- dropdown --------
function populateDropdown(franquias) {
  const select = document.getElementById("franquiaSelect");
  select.innerHTML = '<option value="">-- Selecione uma franquia --</option>';

  franquias.forEach((f, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = f.nome;
    select.appendChild(opt);
  });

  select.addEventListener("change", onFranquiaChange);
}

function onFranquiaChange() {
  const idx = this.value;
  const searchInput = document.getElementById("searchInput");
  searchInput.value = "";

  if (idx === "") {
    currentLojas = [];
    renderLojas([]);
    document.getElementById("lojaSection").classList.add("hidden");
    return;
  }

  currentLojas = allFranquias[idx].lojas || [];
  document.getElementById("lojaSection").classList.remove("hidden");
  renderLojas(currentLojas);
}

// -------- search --------
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.trim().toLowerCase();
      const filtered = q
        ? currentLojas.filter(
            (l) =>
              l.id.toLowerCase().includes(q) ||
              l.nome.toLowerCase().includes(q)
          )
        : currentLojas;
      renderLojas(filtered);
    });
  }
});

// -------- render --------
function renderLojas(lojas) {
  const container = document.getElementById("lojaList");
  const counter = document.getElementById("lojaCount");

  counter.textContent =
    lojas.length === 1 ? "1 loja encontrada" : `${lojas.length} lojas encontradas`;

  if (lojas.length === 0) {
    container.innerHTML =
      '<p class="empty-msg">Nenhuma loja encontrada para essa busca.</p>';
    return;
  }

  container.innerHTML = lojas
    .map(
      (l) => `
      <div class="loja-card">
        <div class="loja-info">
          <span class="loja-id">${escHtml(l.id)}</span>
          <span class="loja-nome">${escHtml(l.nome)}</span>
        </div>
        <button class="btn-copy" data-id="${escAttr(l.id)}" onclick="copyId(this)">
          Copiar ID
        </button>
      </div>`
    )
    .join("");
}

// -------- copy --------
function copyId(btn) {
  const id = btn.dataset.id;
  navigator.clipboard
    .writeText(id)
    .then(() => {
      btn.textContent = "✓ Copiado!";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = "Copiar ID";
        btn.classList.remove("copied");
      }, 2000);
    })
    .catch(() => {
      // fallback para ambientes sem clipboard API
      const ta = document.createElement("textarea");
      ta.value = id;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      btn.textContent = "✓ Copiado!";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = "Copiar ID";
        btn.classList.remove("copied");
      }, 2000);
    });
}

// -------- status helpers --------
function showStatus(msg, type) {
  const el = document.getElementById("statusMsg");
  el.innerHTML = msg;
  el.className = `status-box status-${type}`;
  el.classList.remove("hidden");
}

function hideStatus() {
  document.getElementById("statusMsg").classList.add("hidden");
}

// -------- sanitisation helpers --------
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escAttr(str) {
  return String(str).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
