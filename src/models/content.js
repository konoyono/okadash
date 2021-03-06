/**
 * ボード内の各ペインに表示する、okadashの構成要素の最小単位
 */
class Content {
  /**
   * 設定ファイルから直接設定するフィールド
   */
  static configuableFields = ["name", "url", "zoom", "customCSS", "customUA"];

  /**
   * @param {object}   params
   * @param {string}   params.name
   * @param {string}   params.url
   * @param {string}   params.zoom
   * @param {string}   params.allWidth
   * @param {string}   params.width
   * @param {string}   params.height
   * @param {[string]} params.customCSS
   * @param {string}   params.customUA
   */
  constructor(params = {}) {
    this.name = params.name || "";
    this.url = params.url || "";
    this.zoom = params.zoom || 1.0;
    this.allWidth = params.allWidth || undefined;
    this.width = params.width || undefined;
    this.height = params.height || undefined;
    this.customCSS = params.customCSS || [];
    this.customUA = params.customUA || "";
  }

  /**
   * Slackワークスペースであるか
   */
  isWorkspace() {
    return /workspace/.test(this.url);
  }

  /**
   * Name属性が保存可能な内容であるかチェックする
   */
  validateName() {
    if (this.name === "") return "Item Name Needed";
    if (/\"/.test(this.name)) return `Cannot use " in Item (${this.name})`;
    return true;
  }

  /**
   * URL属性が保存可能な内容であるかチェックする
   */
  validateUrl() {
    const re = /^(https?|file)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+)$/;
    if (this.url == "") return "URL is Needed";
    if (!this.url.match(re)) return `Invalid URL: (${this.url})`;
    if (/\"/.test(this.url)) return `Cannot use " in Item (${url})`;
    return true;
  }

  /**
   * Zoom属性が保存可能な内容であるかチェックする
   */
  validateZoom() {
    const zoomNum = Number(this.zoom);
    if (this.zoom == "") return "Zoom is Needed";
    if (isNaN(zoomNum) || zoomNum < 0.25 || zoomNum > 5.0) {
      return "Zoom must be a number between 0.25 and 5.0";
    }
    return true;
  }

  /**
   * JSONに変換可能なオブジェクトを取得する
   */
  toObject() {
    return {
      name: this.name,
      url: this.url,
      zoom: this.zoom,
      allWidth: this.allWidth,
      width: this.width,
      height: this.height,
      customCSS: this.customCSS,
      customUA: this.customUA
    };
  }

  /**
   * JSON文字列にして戻す
   */
  toJSON() {
    return JSON.stringify(this.toObject());
  }
}
module.exports = Content;
