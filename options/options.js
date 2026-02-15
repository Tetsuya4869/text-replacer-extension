document.addEventListener("DOMContentLoaded", () => {
  const rulesBody = document.getElementById("rulesBody");
  const newFrom = document.getElementById("newFrom");
  const newTo = document.getElementById("newTo");
  const newRegex = document.getElementById("newRegex");
  const addRuleBtn = document.getElementById("addRuleBtn");
  const clearAllRulesBtn = document.getElementById("clearAllRulesBtn");
  const sitesContainer = document.getElementById("sitesContainer");
  const newSite = document.getElementById("newSite");
  const addSiteBtn = document.getElementById("addSiteBtn");
  const clearAllSitesBtn = document.getElementById("clearAllSitesBtn");
  const exportBtn = document.getElementById("exportBtn");
  const importBtn = document.getElementById("importBtn");
  const importFile = document.getElementById("importFile");
  const toast = document.getElementById("toast");

  let data = { rules: [], sites: [], globalEnabled: true };

  function loadData() {
    chrome.storage.sync.get({ rules: [], sites: [], globalEnabled: true }, (stored) => {
      if (chrome.runtime.lastError) {
        showToast("データの読み込みに失敗しました");
        return;
      }
      data = stored;
      renderRules();
      renderSites();
    });
  }

  let saveTimer = null;
  function saveData(callback) {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      chrome.storage.sync.set(data, () => {
        if (chrome.runtime.lastError) {
          showToast("保存に失敗しました");
          return;
        }
        showToast("保存しました");
        if (callback) callback();
      });
    }, 300);
  }

  function renderRules() {
    rulesBody.textContent = "";
    if (data.rules.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 6;
      td.style.cssText = "text-align:center;color:#aaa;padding:16px;";
      td.textContent = "ルールがありません。下のフォームから追加してください。";
      tr.appendChild(td);
      rulesBody.appendChild(tr);
      return;
    }

    data.rules.forEach((rule, i) => {
      const tr = document.createElement("tr");

      // 有効チェックボックス
      const tdEnabled = document.createElement("td");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = rule.enabled;
      cb.className = "rule-toggle";
      cb.addEventListener("change", () => {
        data.rules[i].enabled = cb.checked;
        saveData();
      });
      tdEnabled.appendChild(cb);

      // 変換前
      const tdFrom = document.createElement("td");
      const inputFrom = document.createElement("input");
      inputFrom.type = "text";
      inputFrom.value = rule.from;
      inputFrom.className = "rule-edit";
      if (rule.regex) inputFrom.classList.add("regex-input");
      inputFrom.addEventListener("change", () => {
        data.rules[i].from = inputFrom.value;
        saveData();
      });
      tdFrom.appendChild(inputFrom);

      // 矢印
      const tdArrow = document.createElement("td");
      tdArrow.className = "arrow-cell";
      tdArrow.textContent = "→";

      // 変換後
      const tdTo = document.createElement("td");
      const inputTo = document.createElement("input");
      inputTo.type = "text";
      inputTo.value = rule.to;
      inputTo.className = "rule-edit";
      inputTo.addEventListener("change", () => {
        data.rules[i].to = inputTo.value;
        saveData();
      });
      tdTo.appendChild(inputTo);

      // 正規表現チェックボックス
      const tdRegex = document.createElement("td");
      tdRegex.style.textAlign = "center";
      const regexCb = document.createElement("input");
      regexCb.type = "checkbox";
      regexCb.checked = !!rule.regex;
      regexCb.addEventListener("change", () => {
        data.rules[i].regex = regexCb.checked;
        inputFrom.classList.toggle("regex-input", regexCb.checked);
        saveData();
      });
      tdRegex.appendChild(regexCb);

      // 操作ボタン
      const tdActions = document.createElement("td");
      tdActions.className = "actions-cell";

      const upBtn = document.createElement("button");
      upBtn.className = "move-btn";
      upBtn.textContent = "↑";
      upBtn.title = "上へ";
      upBtn.disabled = i === 0;
      upBtn.addEventListener("click", () => {
        [data.rules[i], data.rules[i - 1]] = [data.rules[i - 1], data.rules[i]];
        saveData(() => renderRules());
      });

      const downBtn = document.createElement("button");
      downBtn.className = "move-btn";
      downBtn.textContent = "↓";
      downBtn.title = "下へ";
      downBtn.disabled = i === data.rules.length - 1;
      downBtn.addEventListener("click", () => {
        [data.rules[i], data.rules[i + 1]] = [data.rules[i + 1], data.rules[i]];
        saveData(() => renderRules());
      });

      const delBtn = document.createElement("button");
      delBtn.className = "del-btn";
      delBtn.textContent = "×";
      delBtn.title = "削除";
      delBtn.addEventListener("click", () => {
        data.rules.splice(i, 1);
        saveData(() => renderRules());
      });

      tdActions.append(upBtn, downBtn, delBtn);
      tr.append(tdEnabled, tdFrom, tdArrow, tdTo, tdRegex, tdActions);
      rulesBody.appendChild(tr);
    });
  }

  function renderSites() {
    sitesContainer.textContent = "";
    if (data.sites.length === 0) {
      const empty = document.createElement("div");
      empty.style.cssText = "color:#aaa;font-size:13px;margin-bottom:8px;";
      empty.textContent = "対象サイトがありません";
      sitesContainer.appendChild(empty);
      return;
    }
    data.sites.forEach((site, i) => {
      const tag = document.createElement("span");
      tag.className = "site-tag";

      const text = document.createTextNode(site + " ");
      const delBtn = document.createElement("button");
      delBtn.textContent = "×";
      delBtn.title = "削除";
      delBtn.addEventListener("click", () => {
        data.sites.splice(i, 1);
        saveData(() => renderSites());
      });

      tag.append(text, delBtn);
      sitesContainer.appendChild(tag);
    });
  }

  // ルール追加
  addRuleBtn.addEventListener("click", () => {
    const from = newFrom.value.trim();
    const to = newTo.value.trim();
    if (!from) return;
    data.rules.push({ from, to, enabled: true, regex: newRegex.checked });
    saveData(() => {
      newFrom.value = "";
      newTo.value = "";
      newRegex.checked = false;
      renderRules();
    });
  });

  newTo.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addRuleBtn.click();
  });

  // ルール一括削除
  clearAllRulesBtn.addEventListener("click", () => {
    if (data.rules.length === 0) return;
    if (!confirm(`${data.rules.length}件のルールをすべて削除しますか？`)) return;
    data.rules = [];
    saveData(() => renderRules());
  });

  // サイト追加
  addSiteBtn.addEventListener("click", () => {
    const site = newSite.value.trim();
    if (!site) return;
    if (!data.sites.includes(site)) {
      data.sites.push(site);
      saveData(() => {
        newSite.value = "";
        renderSites();
      });
    }
  });

  newSite.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addSiteBtn.click();
  });

  // サイト一括削除
  clearAllSitesBtn.addEventListener("click", () => {
    if (data.sites.length === 0) return;
    if (!confirm(`${data.sites.length}件のサイトをすべて削除しますか？`)) return;
    data.sites = [];
    saveData(() => renderSites());
  });

  // エクスポート
  exportBtn.addEventListener("click", () => {
    const json = JSON.stringify({ rules: data.rules, sites: data.sites }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "text-replacer-dictionary.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("エクスポートしました");
  });

  // インポート
  importBtn.addEventListener("click", () => {
    importFile.click();
  });

  importFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (Array.isArray(imported.rules)) {
          data.rules = imported.rules.map((r) => ({
            from: String(r.from || ""),
            to: String(r.to || ""),
            enabled: r.enabled !== false,
            regex: !!r.regex
          }));
        }
        if (Array.isArray(imported.sites)) {
          data.sites = imported.sites.map(String);
        }
        saveData(() => {
          renderRules();
          renderSites();
          showToast("インポートしました");
        });
      } catch {
        showToast("JSONの読み込みに失敗しました");
      }
    };
    reader.readAsText(file);
    importFile.value = "";
  });

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    setTimeout(() => { toast.hidden = true; }, 2000);
  }

  loadData();
});
