// 共通ユーティリティ（content.js / background.js で共有）

/**
 * ホスト名がサイトパターンリストにマッチするか判定
 * ワイルドカード (*.example.com) 対応
 */
function matchesSite(hostname, sites) {
  return sites.some((pattern) => {
    if (pattern.startsWith("*.")) {
      const suffix = pattern.slice(2);
      return hostname === suffix || hostname.endsWith("." + suffix);
    }
    return hostname === pattern;
  });
}

/**
 * ルールに基づいてテキストを変換
 * regex: true のルールは正規表現として扱う
 */
function applyRule(text, rule) {
  if (rule.regex) {
    try {
      const re = new RegExp(rule.from, "g");
      return text.replace(re, rule.to);
    } catch {
      return text;
    }
  }
  return text.replaceAll(rule.from, rule.to);
}
