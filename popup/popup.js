document.addEventListener("DOMContentLoaded", () => {
  const globalToggle = document.getElementById("globalToggle");
  const rulesList = document.getElementById("rulesList");
  const fromInput = document.getElementById("fromInput");
  const toInput = document.getElementById("toInput");
  const addRuleBtn = document.getElementById("addRuleBtn");
  const sitesList = document.getElementById("sitesList");
  const siteInput = document.getElementById("siteInput");
  const addSiteBtn = document.getElementById("addSiteBtn");
  const addCurrentSiteBtn = document.getElementById("addCurrentSiteBtn");
  const applyBtn = document.getElementById("applyBtn");
  const optionsBtn = document.getElementById("optionsBtn");

  let data = { rules: [], sites: [], globalEnabled: true };

  function loadData() {
    chrome.storage.sync.get({ rules: [], sites: [], globalEnabled: true }, (stored) => {
      if (chrome.runtime.lastError) {
        // storage read failed
        return;
      }
      data = stored;
      globalToggle.checked = data.globalEnabled;
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
          // storage write failed
          return;
        }
        if (callback) callback();
      });
    }, 300);
  }

  function renderRules() {
    rulesList.textContent = "";
    if (data.rules.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "ルールがありません";
      rulesList.appendChild(empty);
      return;
    }
    data.rules.forEach((rule, i) => {
      const div = document.createElement("div");
      div.className = "rule-item";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = rule.enabled;
      cb.addEventListener("change", () => {
        data.rules[i].enabled = cb.checked;
        saveData();
      });

      const ruleText = document.createElement("span");
      ruleText.className = "rule-text";

      const fromSpan = document.createElement("span");
      fromSpan.className = "from";
      fromSpan.textContent = rule.from;

      const arrowSpan = document.createElement("span");
      arrowSpan.className = "arrow";
      arrowSpan.textContent = "→";

      const toSpan = document.createElement("span");
      toSpan.className = "to";
      toSpan.textContent = rule.to;

      ruleText.append(fromSpan, arrowSpan, toSpan);

      if (rule.regex) {
        fromSpan.classList.add("regex");
      }

      const delBtn = document.createElement("button");
      delBtn.className = "delete-btn";
      delBtn.title = "削除";
      delBtn.textContent = "×";
      delBtn.addEventListener("click", () => {
        data.rules.splice(i, 1);
        saveData(() => renderRules());
      });

      div.append(cb, ruleText, delBtn);
      rulesList.appendChild(div);
    });
  }

  function renderSites() {
    sitesList.textContent = "";
    if (data.sites.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "対象サイトがありません";
      sitesList.appendChild(empty);
      return;
    }
    data.sites.forEach((site, i) => {
      const div = document.createElement("div");
      div.className = "site-item";

      const siteText = document.createElement("span");
      siteText.className = "site-text";
      siteText.textContent = site;

      const delBtn = document.createElement("button");
      delBtn.className = "delete-btn";
      delBtn.title = "削除";
      delBtn.textContent = "×";
      delBtn.addEventListener("click", () => {
        data.sites.splice(i, 1);
        saveData(() => renderSites());
      });

      div.append(siteText, delBtn);
      sitesList.appendChild(div);
    });
  }

  globalToggle.addEventListener("change", () => {
    data.globalEnabled = globalToggle.checked;
    saveData();
  });

  addRuleBtn.addEventListener("click", () => {
    const from = fromInput.value.trim();
    const to = toInput.value.trim();
    if (!from) return;
    const regexToggle = document.getElementById("regexToggle");
    const isRegex = regexToggle ? regexToggle.checked : false;
    data.rules.push({ from, to, enabled: true, regex: isRegex });
    saveData(() => {
      fromInput.value = "";
      toInput.value = "";
      renderRules();
    });
  });

  fromInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") toInput.focus();
  });

  toInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addRuleBtn.click();
  });

  addSiteBtn.addEventListener("click", () => {
    const site = siteInput.value.trim();
    if (!site) return;
    if (!data.sites.includes(site)) {
      data.sites.push(site);
      saveData(() => {
        siteInput.value = "";
        renderSites();
      });
    }
  });

  siteInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addSiteBtn.click();
  });

  addCurrentSiteBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "getCurrentTab" }, (tab) => {
      if (chrome.runtime.lastError) {
        // tab query failed
        return;
      }
      if (!tab || !tab.url) return;
      try {
        const hostname = new URL(tab.url).hostname;
        if (hostname && !data.sites.includes(hostname)) {
          data.sites.push(hostname);
          saveData(() => renderSites());
        }
      } catch {
        // 無効なURL
      }
    });
  });

  applyBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "triggerReplace" }, () => {
      if (chrome.runtime.lastError) {
        // message send failed
      }
    });
  });

  optionsBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  loadData();
});
