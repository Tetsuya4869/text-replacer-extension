// ページ内テキスト変換ロジック

const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "CODE", "PRE"
]);

// 元のテキストを保持するMap（重複変換防止）
const originalTexts = new WeakMap();

function isEditable(node) {
  let el = node.parentElement;
  while (el) {
    if (el.isContentEditable) return true;
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") return true;
    el = el.parentElement;
  }
  return false;
}

function shouldSkipNode(node) {
  const parent = node.parentElement;
  if (!parent) return true;
  if (SKIP_TAGS.has(parent.tagName)) return true;
  if (isEditable(node)) return true;
  return false;
}

function replaceTextInNode(textNode, rules) {
  // 初回はオリジナルを保存、2回目以降はオリジナルから変換し直す
  if (!originalTexts.has(textNode)) {
    originalTexts.set(textNode, textNode.nodeValue);
  }

  let text = originalTexts.get(textNode);
  let changed = false;

  for (const rule of rules) {
    const newText = applyRule(text, rule);
    if (newText !== text) {
      text = newText;
      changed = true;
    }
  }

  if (changed) {
    textNode.nodeValue = text;
  } else {
    // ルールが変わって該当しなくなった場合、元に戻す
    textNode.nodeValue = originalTexts.get(textNode);
  }
}

function walkAndReplace(root, rules) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (shouldSkipNode(node)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  for (const node of textNodes) {
    replaceTextInNode(node, rules);
  }
}

// 動的に追加される要素も変換対象にする（デバウンス付き）
let observer = null;
let currentRules = [];
let debounceTimer = null;

function startObserver(rules) {
  if (observer) observer.disconnect();
  currentRules = rules;

  observer = new MutationObserver((mutations) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      // Observer自身の変更を無視するため一時停止
      observer.disconnect();

      for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes) {
          if (addedNode.nodeType === Node.TEXT_NODE) {
            if (!shouldSkipNode(addedNode)) {
              replaceTextInNode(addedNode, currentRules);
            }
          } else if (addedNode.nodeType === Node.ELEMENT_NODE) {
            if (!SKIP_TAGS.has(addedNode.tagName)) {
              walkAndReplace(addedNode, currentRules);
            }
          }
        }
      }

      // 再開
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }, 50);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// background.jsからのメッセージを受信
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "replaceText" && message.rules) {
    walkAndReplace(document.body, message.rules);
    startObserver(message.rules);
    sendResponse({ ok: true });
  }
});

// ページロード時にも自動実行
chrome.storage.sync.get({ rules: [], sites: [], globalEnabled: true }, (data) => {
  if (chrome.runtime.lastError) return;
  if (!data.globalEnabled) return;
  if (data.sites.length === 0) return;

  const hostname = window.location.hostname;
  if (!matchesSite(hostname, data.sites)) return;

  const enabledRules = data.rules.filter((r) => r.enabled);
  if (enabledRules.length === 0) return;

  walkAndReplace(document.body, enabledRules);
  startObserver(enabledRules);
});
