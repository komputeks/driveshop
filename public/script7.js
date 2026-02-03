/*************************************************
 * ConfigService — Centralized configuration
 *************************************************/
const ConfigService = (() => {

  const PROPS = PropertiesService.getScriptProperties();

  const CFG = {
    SHEETS: {
      ITEMS: "items",
      EVENTS: "events",
      USERS: "users",
      ERRORS: "errors",
      CATEGORY_HELPER: "_cats"
    },
    DRIVE: {
      ROOT_FOLDER_ID: getProp_("AUTO_FOLDER_ID")
    },
    API: {
      GEMINI_KEY: getProp_("GEMINI_KEY"),
      API_KEY: getProp_("API_KEY") // for securing endpoints
    },
    IMAGE: {
      CDN_WIDTH: 2000
    }
  };

  function getProp_(key) {
    const val = PROPS.getProperty(key);
    if (!val) throw new Error(`Missing ScriptProperty: ${key}`);
    return val;
  }

  function now() {
    return new Date();
  }

  function uuid() {
    return Utilities.getUuid();
  }

  return {
    CFG,
    getProp_,
    now,
    uuid
  };

})();


/*************************************************
 * SpreadsheetService — Efficient Sheet Operations
 *************************************************/
const SpreadsheetService = (() => {

  // Cache in memory to reduce repeated calls
  let ssCache = null;
  let itemIndexCache = null;

  /** Open or create main spreadsheet */
  function getSpreadsheet() {
    if (ssCache) return ssCache;

    const url = ConfigService.CFG.getProp_("SPREADSHEET_URL");
    try {
      const id = extractSheetId(url);
      ssCache = SpreadsheetApp.openById(id);
      return ssCache;
    } catch (err) {
      return createAndSaveSpreadsheet_();
    }
  }

  /** Extract Spreadsheet ID from URL */
  function extractSheetId(url) {
    const m = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!m) throw new Error("Invalid Spreadsheet URL");
    return m[1];
  }

  /** Create new spreadsheet and save URL to properties */
  function createAndSaveSpreadsheet_() {
    const ss = SpreadsheetApp.create("DriveShop Database");
    PropertiesService.getScriptProperties().setProperty("SPREADSHEET_URL", ss.getUrl());
    ssCache = ss;
    return ss;
  }

  /** Get or create sheet with optional header row */
  function getSheet(name, headers = []) {
    const ss = getSpreadsheet();
    let sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      if (headers.length) sh.appendRow(headers);
    }
    return sh;
  }

  /** Batch read all rows */
  function getAllRows(sheetName) {
    const sh = getSheet(sheetName);
    const data = sh.getDataRange().getValues();
    return data.length > 1 ? data.slice(1) : [];
  }

  /** Batch write rows to sheet (overwrite) */
  function setAllRows(sheetName, rows, headers = []) {
    const sh = getSheet(sheetName, headers);
    sh.clearContents();
    if (headers.length) sh.appendRow(headers);
    if (rows.length) sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }

  /** Append a single row efficiently */
  function appendRow(sheetName, row) {
    const sh = getSheet(sheetName);
    sh.appendRow(row);
  }

  /** Build in-memory index for items by ID (fast lookup) */
  function buildItemIndex() {
    const rows = getAllRows(ConfigService.CFG.SHEETS.ITEMS);
    const index = {};
    rows.forEach((r, i) => {
      const id = r[0];
      if (!id) return;
      index[id] = {
        row: i + 2, // actual sheet row
        data: r
      };
    });
    itemIndexCache = index;
    return index;
  }

  /** Get item by ID from index */
  function getItemById(id) {
    if (!itemIndexCache) buildItemIndex();
    return itemIndexCache[id] || null;
  }

  /** Increment counter in a cell (views, likes, comments) */
  function incCounter(sheetName, row, col) {
    const sh = getSheet(sheetName);
    const cell = sh.getRange(row, col);
    const v = Number(cell.getValue()) || 0;
    cell.setValue(v + 1);
  }

  /** Initialize all sheets (items, events, users, errors) */
  function setupSheets() {
    const sheets = ConfigService.CFG.SHEETS;

    getSheet(sheets.ITEMS, [
      "id", "name", "category", "category2", "cdnUrl",
      "width", "height", "size", "description",
      "createdAt", "updatedAt", "views", "likes", "comments",
      "sig"
    ]);

    getSheet(sheets.EVENTS, [
      "id", "itemId", "type", "value", "pageUrl", "userEmail", "createdAt"
    ]);

    getSheet(sheets.USERS, [
      "email", "name", "phone", "photo", "createdAt", "lastLogin"
    ]);

    getSheet(sheets.ERRORS, [
      "time", "jobId", "itemId", "message", "stack"
    ]);

    getSheet(sheets.CATEGORY_HELPER, ["category", "category2"]).hideSheet();
  }

  return {
    getSpreadsheet,
    getSheet,
    getAllRows,
    setAllRows,
    appendRow,
    buildItemIndex,
    getItemById,
    incCounter,
    setupSheets
  };

})();

/*************************************************
 * DriveService — File & Folder Operations
 *************************************************/
const DriveService = (() => {

  // Cache folders to avoid repeated API calls
  const folderCache = {};

  /** Get root folder from config */
  function getRootFolder() {
    const rootId = ConfigService.CFG.DRIVE.ROOT_FOLDER_ID;
    if (!rootId) throw new Error("AUTO_FOLDER_ID is not configured");
    return DriveApp.getFolderById(rootId);
  }

  /** Ensure a folder exists at root level, return Folder object */
  function ensureFolder(name, parent = null) {
    const key = (parent ? parent.getId() : "ROOT") + "|" + name;
    if (folderCache[key]) return folderCache[key];

    const searchFolder = parent || getRootFolder();
    const folders = searchFolder.getFoldersByName(name);
    let folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = (parent ? parent : getRootFolder()).createFolder(name);
    }

    folderCache[key] = folder;
    return folder;
  }

  /** Ensure two-level category folder (Category1 / Category2) */
  function ensureCategory2Folder(cat1, cat2) {
    const lvl1 = ensureFolder(cat1);
    const lvl2 = ensureFolder(cat2, lvl1);
    return lvl2;
  }

  /** Move file to target folder safely */
  function moveFileToFolder(file, folder) {
    const parents = file.getParents();
    let moved = false;
    while (parents.hasNext()) {
      const p = parents.next();
      // Remove only from root folder
      if (p.getId() === getRootFolder().getId()) {
        file.moveTo(folder);
        moved = true;
        break;
      }
    }
    return moved;
  }

  /** List all folders at root level */
  function listRootCategories() {
    const root = getRootFolder();
    const folders = root.getFolders();
    const out = [];
    while (folders.hasNext()) out.push(folders.next().getName());
    return out;
  }

  /** Get all files recursively under folder */
  function walkFiles(folder, out = []) {
    const files = folder.getFiles();
    while (files.hasNext()) out.push(files.next());

    const subfolders = folder.getFolders();
    while (subfolders.hasNext()) walkFiles(subfolders.next(), out);
    return out;
  }

  /** Generate a unique file signature (ID + lastUpdated + parentId) */
  function getFileSignature(file, parentId = null) {
    return [
      file.getId(),
      file.getLastUpdated().getTime(),
      parentId || ""
    ].join("|");
  }

  /** Resolve parent folder of a file */
  function getParent(file) {
    const parents = file.getParents();
    if (!parents.hasNext()) return { parentId: null };
    const p = parents.next();
    return { parentId: p.getId(), parentName: p.getName() };
  }

  /** Rename file safely if needed */
  function renameFile(file, newName) {
    if (!newName || file.getName() === newName) return;
    file.setName(newName);
  }

  /** Parse categories from filename: "Cat1 Cat2 - Name.ext" */
  function parseCategoriesFromFilename(fileName) {
    const dash = fileName.indexOf(" - ");
    if (dash === -1) return { cat1: "Other", cat2: "Other", cleanName: fileName };

    const left = fileName.substring(0, dash).trim();
    const right = fileName.substring(dash + 3).trim();
    const parts = left.split(/\s+/);

    if (parts.length < 2) return { cat1: "Other", cat2: "Other", cleanName: fileName };

    return { cat1: parts[0], cat2: parts[1], cleanName: right };
  }

  /** Get image size (width, height) safely */
  function getImageSize(file) {
    try {
      const blob = file.getBlob();
      const info = ImagesService.openImage(blob).getSize();
      return { w: info.width, h: info.height };
    } catch (err) {
      return { w: 0, h: 0 };
    }
  }

  /** Generate CDN URL for image */
  function getCdnUrl(fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}=w${ConfigService.CFG.IMAGE.CDN_WIDTH}`;
  }

  return {
    getRootFolder,
    ensureFolder,
    ensureCategory2Folder,
    moveFileToFolder,
    listRootCategories,
    walkFiles,
    getFileSignature,
    getParent,
    renameFile,
    parseCategoriesFromFilename,
    getImageSize,
    getCdnUrl
  };

})();

/*************************************************
 * EventService — Track views, likes, comments
 *************************************************/
const EventService = (() => {

  const SHEETS = ConfigService.CFG.SHEETS;

  /** Log an event (view, like, comment) */
  function logEvent(itemId, type, value = "", pageUrl = "", userEmail = "") {
    if (!itemId || !type) return;

    const row = [
      ConfigService.uuid(),
      itemId,
      type,
      value,
      pageUrl,
      userEmail,
      ConfigService.now()
    ];

    SpreadsheetService.appendRow(SHEETS.EVENTS, row);
  }

  /** Log a view event and increment counter */
  function logView(itemId, pageUrl = "", userEmail = "") {
    logEvent(itemId, "view", 1, pageUrl, userEmail);
    const item = SpreadsheetService.getItemById(itemId);
    if (item) {
      SpreadsheetService.incCounter(SHEETS.ITEMS, item.row, 12); // column 12 = views
    }
  }

  /** Log a like event and increment counter */
  function logLike(itemId, pageUrl = "", userEmail = "") {
    logEvent(itemId, "like", 1, pageUrl, userEmail);
    const item = SpreadsheetService.getItemById(itemId);
    if (item) {
      SpreadsheetService.incCounter(SHEETS.ITEMS, item.row, 13); // column 13 = likes
    }
  }

  /** Log a comment event and increment counter */
  function logComment(itemId, commentText, pageUrl = "", userEmail = "") {
    if (!commentText) commentText = "";
    logEvent(itemId, "comment", commentText, pageUrl, userEmail);
    const item = SpreadsheetService.getItemById(itemId);
    if (item) {
      SpreadsheetService.incCounter(SHEETS.ITEMS, item.row, 14); // column 14 = comments
    }
  }

  return {
    logEvent,
    logView,
    logLike,
    logComment
  };

})();



/*************************************************
 * CDNService / ImageService — Image Utilities
 *************************************************/
const CDNService = (() => {

  const SHEETS = ConfigService.CFG.SHEETS;
  const GEMINI_KEY = ConfigService.CFG.API.GEMINI_KEY;

  /** Generate CDN URL for image by file ID */
  function getCdnUrl(fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}=w${ConfigService.CFG.IMAGE.CDN_WIDTH}`;
  }

  /** Get image width & height from Drive file */
  function getImageSize(file) {
    try {
      const blob = file.getBlob();
      const size = ImagesService.openImage(blob).getSize();
      return { w: size.width, h: size.height };
    } catch (err) {
      return { w: 0, h: 0 };
    }
  }

  /** Generate image description via Gemini API with caching */
  function describeImage(fileId, forceRefresh = false) {
    // Use helper sheet to cache descriptions
    const sh = SpreadsheetService.getSheet(SHEETS.ITEMS);
    const data = sh.getDataRange().getValues();
    const headers = data[0];
    const descCol = headers.indexOf("description") + 1;

    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === fileId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) return "";

    const cached = sh.getRange(rowIndex, descCol).getValue();
    if (cached && !forceRefresh) return cached;

    // Generate description via Gemini
    try {
      const payload = {
        contents: [{
          parts: [
            { text: "Describe this image briefly:" },
            { inlineData: { mimeType: "image/jpeg", data: getImageBlobBase64(fileId) } }
          ]
        }]
      };

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${GEMINI_KEY}`;
      const res = UrlFetchApp.fetch(endpoint, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload)
      });

      const j = JSON.parse(res.getContentText());
      const description = j.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // Cache description in sheet
      sh.getRange(rowIndex, descCol).setValue(description);

      return description;

    } catch (err) {
      Logger.log(`Gemini describeImage error: ${err}`);
      return "";
    }
  }

  /** Convert Drive file to Base64 for Gemini API */
  function getImageBlobBase64(fileId) {
    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    return Utilities.base64Encode(blob.getBytes());
  }

  return {
    getCdnUrl,
    getImageSize,
    describeImage
  };

})();

/*************************************************
 * SyncService — Drive ↔ Sheet Synchronization
 *************************************************/
const SyncService = (() => {

  const SHEETS = ConfigService.CFG.SHEETS;

  /** Normalize a single item row */
  function normalizeRow(rowIndex) {
    const sh = SpreadsheetService.getSheet(SHEETS.ITEMS);
    const rowData = sh.getRange(rowIndex, 1, 1, sh.getLastColumn()).getValues()[0];

    const id = rowData[0];
    let name = rowData[1];
    let cat1 = rowData[2];
    let cat2 = rowData[3];

    if (!id) return;

    const file = DriveApp.getFileById(id);
    const path = DriveService.getParent(file);

    // Infer missing categories from filename
    if (!cat1 || !cat2) {
      const parsed = DriveService.parseCategoriesFromFilename(file.getName());
      cat1 = parsed.cat1;
      cat2 = parsed.cat2;
      name = parsed.cleanName;

      sh.getRange(rowIndex, 3).setValue(cat1);
      sh.getRange(rowIndex, 4).setValue(cat2);
      sh.getRange(rowIndex, 2).setValue(name);
    }

    // Ensure proper folder placement
    const destFolder = DriveService.ensureCategory2Folder(cat1, cat2);
    if (path.parentId !== destFolder.getId()) {
      DriveService.moveFileToFolder(file, destFolder);
    }

    // Ensure filename matches
    DriveService.renameFile(file, name);

    // Update signature
    const sig = DriveService.getFileSignature(file, destFolder.getId());
    sh.getRange(rowIndex, sh.getLastColumn()).setValue(sig);
  }

  /** Normalize all rows */
  function normalizeAll() {
    const sh = SpreadsheetService.getSheet(SHEETS.ITEMS);
    const lastRow = sh.getLastRow();
    for (let r = 2; r <= lastRow; r++) {
      try {
        normalizeRow(r);
      } catch (err) {
        Logger.logError("normalizeAll", sh.getRange(r, 1).getValue(), err);
      }
    }
  }

  /** Full scan: Drive → Sheet */
  function fullScan() {
    const sh = SpreadsheetService.getSheet(SHEETS.ITEMS);
    const index = SpreadsheetService.buildItemIndex();
    const root = DriveService.getRootFolder();

    const discoveredFiles = DriveService.walkFiles(root);
    const seenIds = new Set();
    const rowsToDelete = [];

    discoveredFiles.forEach(file => {
      if (!file.getMimeType().startsWith("image/")) return;

      const id = file.getId();
      seenIds.add(id);

      const path = DriveService.getParent(file);
      const sig = DriveService.getFileSignature(file, path.parentId);
      const row = index[id];

      if (!row) {
        // NEW FILE → parse categories, move, append row
        const parsed = DriveService.parseCategoriesFromFilename(file.getName());
        let cat1 = parsed.cat1;
        let cat2 = parsed.cat2;

        // Move file safely
        const destFolder = DriveService.ensureCategory2Folder(cat1, cat2);
        DriveService.moveFileToFolder(file, destFolder);
        DriveService.renameFile(file, parsed.cleanName);

        const size = DriveService.getImageSize(file);
        const cdn = DriveService.getCdnUrl(id);

        const newRow = [
          id, parsed.cleanName, cat1, cat2, cdn,
          size.w, size.h, file.getSize(), "",  // description empty
          file.getDateCreated(), ConfigService.now(),
          0, 0, 0,  // views, likes, comments
          sig
        ];

        SpreadsheetService.appendRow(SHEETS.ITEMS, newRow);
        return;
      }

      // EXISTING FILE → update signature & timestamp if changed
      if (row.data[row.data.length - 1] !== sig) {
        sh.getRange(row.row, sh.getLastColumn()).setValue(sig);
        sh.getRange(row.row, 11).setValue(ConfigService.now()); // updatedAt
      }
    });

    // DELETE removed files
    Object.keys(index).forEach(id => {
      if (!seenIds.has(id)) rowsToDelete.push(index[id].row);
    });

    rowsToDelete.sort((a, b) => b - a).forEach(r => sh.deleteRow(r));

    // Sync dropdowns
    syncCategoryDropdown();
    syncCategory2Dropdown();
  }

  /** Sync Category1 dropdown */
  function syncCategoryDropdown() {
    const cats = DriveService.listRootCategories();
    if (!cats.length) return;

    const sh = SpreadsheetService.getSheet(SHEETS.ITEMS);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(cats, true)
      .build();

    sh.getRange("C2:C").setDataValidation(rule);
  }

  /** Sync Category2 dropdown (_dependent on Category1) */
  function syncCategory2Dropdown() {
    const ss = SpreadsheetService.getSpreadsheet();
    const helper = SpreadsheetService.getSheet(SHEETS.CATEGORY_HELPER);
    helper.clear();
    helper.appendRow(["category", "category2"]);

    const root = DriveService.getRootFolder();
    const lvl1 = root.getFolders();

    while (lvl1.hasNext()) {
      const c1 = lvl1.next();
      const lvl2 = c1.getFolders();
      while (lvl2.hasNext()) helper.appendRow([c1.getName(), lvl2.next().getName()]);
    }

    const items = SpreadsheetService.getSheet(SHEETS.ITEMS);
    const lastRow = Math.max(items.getLastRow(), 2);

    const rule = SpreadsheetApp.newDataValidation()
      .requireFormulaSatisfied('=COUNTIF(FILTER(_cats!$B:$B,_cats!$A:$A=$C2),D2)')
      .setAllowInvalid(false)
      .build();

    items.getRange(2, 4, lastRow - 1).setDataValidation(rule);
  }

  return {
    normalizeRow,
    normalizeAll,
    fullScan,
    syncCategoryDropdown,
    syncCategory2Dropdown
  };

})();


/*************************************************
 * Logger — Centralized Error & Job Logging
 *************************************************/
const Logger = (() => {

  const SHEETS = ConfigService.CFG.SHEETS;

  /** Log an error to the Errors sheet and console */
  function logError(job = "", item = "", e) {
    const sh = SpreadsheetService.getSheet(SHEETS.ERRORS);

    const row = [
      ConfigService.now(),
      job,
      item,
      e?.message || e || "",
      e?.stack || ""
    ];

    // Append row
    SpreadsheetService.appendRow(SHEETS.ERRORS, row);

    // Also log to console for immediate debugging
    console.error(`[${job}] Item: ${item}`, e);
  }

  /** Log a general info message (optional console only) */
  function logInfo(message, ...args) {
    console.info(`[INFO] ${message}`, ...args);
  }

  /** Clear all errors from the sheet */
  function clearErrors() {
    const sh = SpreadsheetService.getSheet(SHEETS.ERRORS);
    sh.clearContents();
    sh.appendRow(["time", "jobId", "itemId", "message", "stack"]);
  }

  return {
    logError,
    logInfo,
    clearErrors
  };

})();


/*************************************************
 * APIService — HTTP Entrypoints
 *************************************************/
const APIService = (() => {

  /** Standard JSON response */
  function res(obj) {
    return ContentService.createTextOutput(JSON.stringify(obj))
      .setMimeType(ContentService.MimeType.JSON);
  }

  /** Standard error response */
  function errorRes(e) {
    return res({ ok: false, error: e?.message || e });
  }

  /** Ping endpoint */
  function ping() {
    return res({ ok: true, time: ConfigService.now() });
  }

  /** GET: List items */
  function getItems(params) {
    try {
      const q = (params.q || "").toLowerCase();
      const category = params.category || "";

      const items = SpreadsheetService.getAllItems().filter(r => {
        if (category && r.cat1 !== category) return false;
        if (q && !r.name.toLowerCase().includes(q)) return false;
        return true;
      });

      return res({ ok: true, items });

    } catch (e) {
      Logger.logError("apiGetItems", "", e);
      return errorRes(e);
    }
  }

  /** GET: Single item by ID */
  function getItem(params) {
    const id = params.id;
    if (!id) return errorRes("Missing id");

    const item = SpreadsheetService.getItemById(id);
    if (!item) return errorRes("Not found");

    return res({ ok: true, item: item.data });
  }

  /** GET: Categories */
  function getCategories() {
    try {
      const categories = DriveService.listRootCategories();
      return res({ ok: true, categories });
    } catch (e) {
      Logger.logError("apiGetCategories", "", e);
      return errorRes(e);
    }
  }

  /** GET: Stats for a single item */
  function getStats(params) {
    const id = params.id;
    if (!id) return errorRes("Missing id");

    const item = SpreadsheetService.getItemById(id);
    if (!item) return errorRes("Not found");

    const { views, likes, comments } = item.data;
    return res({ ok: true, stats: { views, likes, comments } });
  }

  /** POST: Log a view */
  function logView(data) {
    try {
      const { id, pageUrl, email } = data;
      if (!id) return errorRes("Missing id");
      EventService.logView(id, pageUrl, email);
      return res({ ok: true });
    } catch (e) {
      Logger.logError("apiLogView", data.id, e);
      return errorRes(e);
    }
  }

  /** POST: Log a like */
  function logLike(data) {
    try {
      const { id, pageUrl, email } = data;
      if (!id) return errorRes("Missing id");
      EventService.logLike(id, pageUrl, email);
      return res({ ok: true });
    } catch (e) {
      Logger.logError("apiLogLike", data.id, e);
      return errorRes(e);
    }
  }

  /** POST: Add a comment */
  function addComment(data) {
    try {
      const { id, text, pageUrl, email } = data;
      if (!id) return errorRes("Missing id");
      EventService.logComment(id, text, pageUrl, email);
      return res({ ok: true });
    } catch (e) {
      Logger.logError("apiAddComment", data.id, e);
      return errorRes(e);
    }
  }

  /** POST: User login */
  function login(data) {
    try {
      const { email, name, photo } = data;
      if (!email) return errorRes("Missing email");
      SpreadsheetService.touchUser(email, name, photo);
      return res({ ok: true });
    } catch (e) {
      Logger.logError("apiLogin", data.email, e);
      return errorRes(e);
    }
  }

  /** doGet entrypoint */
  function doGet(e) {
    try {
      const p = e.parameter || {};
      switch ((p.action || "").toLowerCase()) {
        case "items": return getItems(p);
        case "item": return getItem(p);
        case "categories": return getCategories();
        case "stats": return getStats(p);
        default: return ping();
      }
    } catch (e) {
      Logger.logError("doGet", "", e);
      return errorRes(e);
    }
  }

  /** doPost entrypoint */
  function doPost(e) {
    try {
      const data = JSON.parse(e.postData.contents || "{}");
      switch ((data.action || "").toLowerCase()) {
        case "view": return logView(data);
        case "like": return logLike(data);
        case "comment": return addComment(data);
        case "login": return login(data);
        default: return errorRes("Unknown action");
      }
    } catch (e) {
      Logger.logError("doPost", "", e);
      return errorRes(e);
    }
  }

  return {
    doGet,
    doPost,
    getItems,
    getItem,
    getCategories,
    getStats,
    logView,
    logLike,
    addComment,
    login
  };

})();


/*************************************************
 * BootstrapService — Initialization & Triggers
 *************************************************/
const BootstrapService = (() => {

  const SHEETS = ConfigService.CFG.SHEETS;

  /** Initial setup: create sheets and columns */
  function setupSheets() {
    const itemsCols = [
      "id","name","cat1","cat2","cdn","w","h","size","description",
      "createdAt","updatedAt","views","likes","comments","sig"
    ];

    const eventsCols = ["id","itemId","type","value","pageUrl","userEmail","createdAt"];
    const usersCols  = ["email","name","phone","photo","createdAt","lastLogin"];
    const errorsCols = ["time","jobId","itemId","message","stack"];

    SpreadsheetService.ensureSheet(SHEETS.ITEMS, itemsCols);
    SpreadsheetService.ensureSheet(SHEETS.EVENTS, eventsCols);
    SpreadsheetService.ensureSheet(SHEETS.USERS, usersCols);
    SpreadsheetService.ensureSheet(SHEETS.ERRORS, errorsCols);

    // Helper sheet for category2 dropdown
    SpreadsheetService.ensureSheet(SHEETS.CATEGORY_HELPER, ["category","category2"], true);
  }

  /** Sync all dropdowns (category1 & category2) */
  function syncDropdowns() {
    SyncService.syncCategoryDropdown();
    SyncService.syncCategory2Dropdown();
  }

  /** Install all triggers */
  function installTriggers() {
    // Remove old triggers
    ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));

    const ss = SpreadsheetService.getSpreadsheet();

    // On edit trigger
    ScriptApp.newTrigger("onEdit")
      .forSpreadsheet(ss)
      .onEdit()
      .create();

    // Nightly full scan trigger
    ScriptApp.newTrigger("fullScan")
      .timeBased()
      .everyDays(1)
      .atHour(3)
      .create();
  }

  /** Initialize system */
  function init() {
    setupSheets();
    syncDropdowns();
    installTriggers();
    SpreadsheetApp.getUi().alert("DriveShop initialized successfully.");
  }

  return {
    init,
    setupSheets,
    syncDropdowns,
    installTriggers
  };

})();



