var { remote } = require("electron");
var { dialog } = remote;
const fs = require("fs");
const Store = require("electron-store");
const store = new Store();
const app = remote.app;
const path = require("path");
const Board = require("./models/board");
const Content = require("./models/content");
const ContentForm = require("./components/contentForm");

/**
 * アプリケーションのバージョン情報
 */
const VERSION = "1.6.1";

/**
 * 読み込み済みの定義済みボード一覧
 * @type {[Board]}
 */
let definedBoardList = [];

/**
 * 描画中のコンテントフォームコンポーネントのリスト
 * @type {[ContentForm]}
 */
let contentFormList = [];

initialize();

/**
 * Preference画面の初期描画を行う
 */
function initialize() {
  const configFilePath = path.join(app.getPath("userData"), "config.json");
  fs.readFile(configFilePath, (_, data) => {
    createBoardList(data);
  });
}

/**
 * 定義ファイルの内容を元に、ボードの一覧を描画する
 * @param {Buffer} data 定義ファイルの内容
 */
function createBoardList(data) {
  const settings = JSON.parse(data);
  const container = document.getElementById("boards-container");

  definedBoardList = settings["options"].map(option => {
    return new Board({
      name: option["name"],
      contents: option["contents"].map(content => new Content(content))
    });
  });

  definedBoardList.forEach(definedBoard => {
    const liElem = document.createElement("li");
    const aElem = document.createElement("a");
    aElem.onclick = function () {
      container.childNodes.forEach(node => node.classList.remove("active"));
      liElem.classList.add("active");
      showBoardContents(definedBoard);
    };
    aElem.innerHTML = definedBoard.name;
    liElem.appendChild(aElem);
    container.appendChild(liElem);
  });
  if (container.firstChild === null) importNewBoard("default", "Default Board");
  container.firstChild.querySelector("a").click();
}

/**
 * 定義済みボードの内容を描画する
 * @param {Board} definedBoard
 */
function showBoardContents(definedBoard) {
  const container = document.getElementById("items-container");

  window.scrollTo(0, 0);
  document.getElementById("board-name-textbox").innerText = definedBoard["name"];

  // 既に描画済みの内容を破棄
  contentFormList = [];
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  // ボード内のコンテンツの数だけフォームを繰り返し描画する
  definedBoard.contents.forEach(content => {
    const contentForm = createContentForm(content);
    contentFormList.push(contentForm);
    container.appendChild(contentForm.$element[0]);
  });

  // ボード追加ボタンの描画と、クリック時のボート追加処理を定義
  const addBtnElem = document.createElement("button");
  addBtnElem.className = "add-board-btn";
  addBtnElem.innerHTML = "+";
  addBtnElem.onclick = function () {
    addBtnElem.remove();
    const contentForm = createContentForm();
    contentFormList.push(contentForm);
    container.appendChild(contentForm.$element[0]);
    container.appendChild(addBtnElem);
  };
  container.appendChild(addBtnElem);
}

/**
 * Contentオブジェクトに基づいてコンテントフォームを生成する
 * @param {Content} content
 */
function createContentForm(content = new Content()) {
  return new ContentForm(content, contentForm => {
    if (confirm("Sure?")) {
      const targetIndex = contentFormList.findIndex(cf => cf.id === contentForm.id);
      contentFormList.splice(targetIndex, 1);
      contentForm.$element[0].remove();
    }
  });
}

/**
 * JSONファイルを選択して新規ボードを作成する
 */
function openFileAndSave() {
  const win = remote.getCurrentWindow();
  remote.dialog.showOpenDialog(
    win,
    {
      properties: ["openFile"],
      filters: [
        {
          name: "settings",
          extensions: ["json"]
        }
      ]
    },
    filePath => {
      if (filePath) {
        showModalDialogElement(filePath[0]);
      }
    }
  );
}

/**
 * 新規ボード名を入力するモーダルを表示する
 * モーダルのOKボタンが押下されたらインポート処理を行う
 * @param {string} filePath 選択されたファイルパス
 */
function showModalDialogElement(filePath) {
  return new Promise((resolve, reject) => {
    const filename = path.basename(filePath, ".json");
    const dlg = document.querySelector("#input-dialog");
    dlg.style.display = "block";
    dlg.querySelector("input").value = filename;
    dlg.addEventListener("cancel", event => {
      event.preventDefault();
    });
    dlg.showModal();
    function onClose() {
      if (dlg.returnValue === "ok") {
        const inputValue = document.querySelector("#input").value;
        if (checkDuplicateNameExists(inputValue)) {
          alert(`Board name '${inputValue}' is already in use`);
          remote.getCurrentWindow().reload();
        } else {
          resolve(importNewBoard(filePath, inputValue));
        }
      } else {
        reject();
        remote.getCurrentWindow().reload();
      }
    }
    dlg.addEventListener("close", onClose, { once: true });
  });
}

/**
 * 新規ボードを作成する
 * @param {string} source ファイルパスまたは "default"
 * @param {string} boardName
 */
function importNewBoard(source, boardName) {
  if (source === "default") {
    const workspaceName = document.getElementById("workspace-name").value;
    var settings = JSON.parse(`
    {
      "contents": [
        {
          "name": "Slack",
          "url": "https://${workspaceName}.slack.com",
          "size": "large",
          "zoom": 1.0,
          "customCSS": [
            ".p-channel_sidebar { width: 160px !important; }",
            ".p-classic_nav__team_header { display: none !important; }",
            ".p-workspace--context-pane-collapsed { grid-template-columns: 160px auto !important; }"
          ]
        },
        {
          "name": "Google News",
          "url": "https://news.google.com/",
          "size": "medium",
          "zoom": 1.0,
          "customCSS": []
        },
        {
          "name": "Slack(body)",
          "url": "https://${workspaceName}.slack.com",
          "zoom": 1.0,
          "customCSS": [
            ".p-workspace__sidebar { display: none !important; }",
            ".p-classic_nav__team_header { display: none !important;}",
            ".p-workspace--context-pane-collapsed { grid-template-columns: 0px auto !important;}",
            ".p-workspace--context-pane-expanded { grid-template-columns: 0px auto !important;}"
          ]
        },
        {
          "name": "twitter",
          "url": "https://twitter.com",
          "zoom": 1.0,
          "customCSS": ["header { display: none !important; }"]
        },
        {
          "name": "calendar",
          "zoom": 1.0,
          "url": "https://okadash-files.s3-ap-northeast-1.amazonaws.com/calendar.html"
        }
      ]
    }
  `);
  } else {
    var settings = JSON.parse(fs.readFileSync(source));
  }
  if (!validateJson(settings)) {
    return null;
  }

  const newOption = { name: boardName, contents: settings["contents"] };
  let optList = store.get("options");
  let brdList = store.get("boards");
  if (optList) {
    optList.push(newOption);
    brdList.push(newOption);
    store.set("options", optList);
    store.set("boards", brdList);
  } else {
    store.set("version", VERSION);
    store.set("options", [newOption]);
    store.set("boards", [newOption]);
  }
  if (source === "default") {
    const window = remote.getCurrentWindow();
    window.close();
  } else {
    remote.getCurrentWindow().reload();
  }
}

/**
 * 指定したボード名が既に存在するかを戻す
 * @param {string} boardName
 */
function checkDuplicateNameExists(boardName) {
  return definedBoardList.some(board => board.name === boardName);
}

/**
 * @param {Object} jsonObj インポートした設定ファイル
 */
function validateJson(jsonObj) {
  if (!jsonObj.contents) {
    alert("Error in settings: contents is invalid");
    return false;
  }
  // FIXME: validateといいつつ、内容の改変まで行っているので分離するべき
  jsonObj.contents.forEach(function (content) {
    if (content["customCSS"] === undefined) content["customCSS"] = [];
  });

  return true;
}

/**
 * 現在開いているボードを削除する
 */
function deleteBoard() {
  const currentBoardName = $("#boards-container li.active").text();
  const allUsingBoards = store.get("boards");
  const allDefinedBoards = store.get("options");

  const confirmMessage = `Delete board name '${currentBoardName}'. OK?`;
  if (!confirm(confirmMessage)) return;

  for (i in allDefinedBoards) {
    if (currentBoardName == allDefinedBoards[i]["name"]) {
      allDefinedBoards.splice(i, 1);
      allUsingBoards.splice(i, 1);
    }
  }
  store.set("options", allDefinedBoards);
  store.set("boards", allUsingBoards);
  remote.getCurrentWindow().reload();
}

/**
 * 現在開いているボードの、定義済みバージョンをJSON形式でエクスポートする
 */
function exportDefinedBoard() {
  exportBoard("options");
}

/**
 * 現在開いているボードの、使用中バージョンをJSON形式でエクスポートする
 */
function exportUsingBoard() {
  exportBoard("boards");
}

/**
 * ボードの設定情報をJSON形式でエクスポートする
 * @params {string} baseKey "boards" or "options"
 */
function exportBoard(baseKey) {
  const targetBoard = document.getElementById("board-name-textbox").innerText;
  let board = {};
  for (i in store.get(baseKey)) {
    if (store.get(baseKey)[i]["name"] == targetBoard) {
      board = store.get(baseKey)[i];
    }
  }
  delete board.name;
  const win = remote.getCurrentWindow();
  dialog.showSaveDialog(
    win,
    {
      defaultPath: document.getElementById("board-name-textbox").innerText,
      properties: ["openFile"],
      filters: [
        {
          name: "Documents",
          extensions: ["json"]
        }
      ]
    },
    fileName => {
      if (fileName) {
        const data = JSON.stringify(board, null, 2);
        writeFile(fileName, data);
      }
    }
  );
}

/**
 * テキストをファイル出力する
 * @param {string} path
 * @param {string} data
 */
function writeFile(path, data) {
  fs.writeFile(path, data, error => {
    if (error != null) {
      alert("save error.");
      return;
    }
  });
}

/**
 * ボードの設定をStoreに保存する
 */
function saveBoardSetting() {
  const targetBoardName = document.getElementById("board-name-textbox").innerText;
  const newContents = [];
  let errors = [];

  // フォーム内容のバリデーションしつつ取得
  contentFormList.forEach((contentForm, idx) => {
    const size = ["large", "medium"][idx] || "small";
    newContents.push(contentForm.toObject({ size }));
    errors = errors.concat(contentForm.validate());
  });

  // 1件以上エラーがあった場合、アラートし、保存は拒否する
  if (errors.length > 0) {
    errors.forEach(error => alert(error));
    document.getElementById("save-btn").innerText = "Save failed...";
    document.getElementById("save-btn").className = "btn btn-danger";
    const reloadMessage = function () {
      document.getElementById("save-btn").innerText = "Save Board Setting";
      document.getElementById("save-btn").className = "btn btn-primary";
    };
    setTimeout(reloadMessage, 2000);
    return;
  }

  // 保存処理
  let options = store.get("options");
  options.forEach(option => {
    if (option["name"] === targetBoardName) {
      option["contents"] = newContents;
    }
  });
  store.set("options", options);
  store.set("boards", options);
  document.getElementById("save-btn").innerText = "Saved!";
  const reloadMessage = function () {
    document.getElementById("save-btn").innerText = "Save Board Setting";
  };
  setTimeout(reloadMessage, 2000);
}
