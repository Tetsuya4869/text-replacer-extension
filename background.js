// サイトマッチング判定とcontent scriptへのメッセージング

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get({ rules: [], sites: [], globalEnabled: true }, (data) => {
    if (chrome.runtime.lastError) return;
    if (data.rules.length === 0 && data.sites.length === 0) {
      chrome.storage.sync.set({
        rules: [],
        sites: [],
        globalEnabled: true
      });
    }
  });
});

// ホスト名がサイトリストにマッチするか判定
function matchesSite(hostname, sites) {
  return sites.some((pattern) => {
    if (pattern.startsWith("*.")) {
      const suffix = pattern.slice(2);
      return hostname === suffix || hostname.endsWith("." + suffix);
    }
    return hostname === pattern;
  });
}

// タブ更新時にcontent scriptへ変換指示を送信
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;

  let hostname;
  try {
    hostname = new URL(tab.url).hostname;
  } catch {
    return;
  }

  chrome.storage.sync.get({ rules: [], sites: [], globalEnabled: true }, (data) => {
    if (chrome.runtime.lastError) return;
    if (!data.globalEnabled) return;
    if (data.sites.length === 0) return;

    const shouldReplace = matchesSite(hostname, data.sites);
    if (!shouldReplace) return;

    const enabledRules = data.rules.filter((r) => r.enabled);
    if (enabledRules.length === 0) return;

    chrome.tabs.sendMessage(tabId, {
      action: "replaceText",
      rules: enabledRules
    }).catch(() => {
      // content scriptがまだロードされていない場合は無視
    });
  });
});

// ポップアップやオプションページからのメッセージ処理
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getCurrentTab") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        sendResponse(null);
        return;
      }
      sendResponse(tabs[0] || null);
    });
    return true;
  }

  if (message.action === "triggerReplace") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError || !tabs[0]) return;
      chrome.storage.sync.get({ rules: [], sites: [], globalEnabled: true }, (data) => {
        if (chrome.runtime.lastError) return;
        const enabledRules = data.rules.filter((r) => r.enabled);
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "replaceText",
          rules: enabledRules
        }).catch(() => {});
      });
    });
    sendResponse({ ok: true });
    return true;
  }
});
