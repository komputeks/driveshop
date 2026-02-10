/*************************************************
 * ConfigService — Centralized configuration (FLATTENED)
 *************************************************/

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
    get ROOT_FOLDER_ID() { return getProp_("AUTO_FOLDER_ID"); }
  },
  API: {
    GEMINI_KEY: getProp_("GEMINI_KEY"),
    API_SIGNING_SECRET: getProp_("API_SIGNING_SECRET")
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

/*************************************************
 * Core response & helpers (CANONICAL)
 *************************************************/

function res(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function ok_(data) {
  return res({ ok: true, data });
}

function error_(msg) {
  return res({ ok: false, error: msg });
}

function errorRes(e) {
  return res({ ok: false, error: e?.message || e });
}

function json_(obj) {
  return res(obj);
}

function withGlobalLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function withItemLock_(itemId, fn) {
  return withGlobalLock_(fn);
}

function rateLimit_(key, limit, windowSec) {
  const cache = CacheService.getScriptCache();
  const nowSec = Math.floor(Date.now() / 1000);

  const data = cache.get(key);
  let obj = data ? JSON.parse(data) : { count: 0, ts: nowSec };

  if (nowSec - obj.ts > windowSec) obj = { count: 0, ts: nowSec };
  obj.count++;
  cache.put(key, JSON.stringify(obj), windowSec);

  if (obj.count > limit) throw new Error("Rate limit exceeded");
}

function idempotent_(key, ttl = 30) {
  const cache = CacheService.getScriptCache();
  if (cache.get(key)) return false;
  cache.put(key, "1", ttl);
  return true;
}

function syncItemCounters_(itemId) {
  const sh = getSheet(CFG.SHEETS.ITEMS);
  buildItemIndex_();
  const entry = _itemIndex[itemId];
  if (!entry) return;

  const stats = EventService.stats(itemId);
  sh.getRange(entry.row, 12, 1, 3).setValues([[
    stats.view || stats.views || 0,
    stats.like || stats.likes || 0,
    stats.comment || stats.comments || 0
  ]]);
}

/*************************************************
 * SpreadsheetService — Efficient Sheet Operations
 *************************************************/

let ssCache = null;
let _itemIndex = null;
let _slugIndex = null;

function getSpreadsheet() {
  if (ssCache) return ssCache;
  const url = getProp_("SPREADSHEET_URL");
  try {
    const id = extractSheetId(url);
    ssCache = SpreadsheetApp.openById(id);
    return ssCache;
  } catch (err) {
    return createAndSaveSpreadsheet_();
  }
}

function extractSheetId(url) {
  const m = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!m) throw new Error("Invalid Spreadsheet URL");
  return m[1];
}

function createAndSaveSpreadsheet_() {
  const ss = SpreadsheetApp.create("DriveShop Database");
  PropertiesService.getScriptProperties().setProperty("SPREADSHEET_URL", ss.getUrl());
  ssCache = ss;
  return ss;
}

function getSheet(name, headers = []) {
  const ss = getSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    if (headers.length) sh.appendRow(headers);
  }
  return sh;
}

function getAllRows(sheetName) {
  const sh = getSheet(sheetName);
  const data = sh.getDataRange().getValues();
  return data.length > 1 ? data.slice(1) : [];
}

function setAllRows(sheetName, rows, headers = []) {
  const sh = getSheet(sheetName, headers);
  sh.clearContents();
  if (headers.length) sh.appendRow(headers);
  if (rows.length) sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function appendRow(sheetName, row) {
  const sh = getSheet(sheetName);
  sh.appendRow(row);
  if (sheetName === CFG.SHEETS.ITEMS) invalidateItemIndex_();
}

function buildItemIndex_() {
  if (_itemIndex) return;
  const sh = getSheet(CFG.SHEETS.ITEMS);
  const values = sh.getDataRange().getValues();
  const headers = values.shift();
  const idx = {};
  const slugIdx = {};
  values.forEach((r, i) => {
    const item = {};
    headers.forEach((h, j) => item[h] = r[j]);
    if (!item.id) return;
    item.row = i + 2;
    idx[item.id] = item;
    slugIdx[slugify_(item.name)] = item.id;
  });
  _itemIndex = idx;
  _slugIndex = slugIdx;
}

function invalidateItemIndex_() {
  _itemIndex = null;
  _slugIndex = null;
}

function getItemById(id) {
  buildItemIndex_();
  return _itemIndex[id] || null;
}

function getItemBySlug(slug) {
  buildItemIndex_();
  const id = _slugIndex[slug];
  return id ? _itemIndex[id] : null;
}

function getAllItems() {
  buildItemIndex_();
  return Object.values(_itemIndex);
}

function setupSheets_() {
  const sheets = CFG.SHEETS;
  getSheet(sheets.ITEMS, [
    "id", "name", "cat1", "cat2", "cdn",
    "width", "height", "size", "description",
    "createdAt", "updatedAt", "views", "likes", "comments",
    "sig"
  ]);
  getSheet(sheets.EVENTS, [
    "id", "itemId", "type", "value", "pageUrl",
    "userEmail", "createdAt", "updatedAt", "deleted"
  ]);
  getSheet(sheets.USERS, ["email", "name", "photo", "createdAt", "lastLogin"]);
  getSheet(sheets.ERRORS, ["time", "jobId", "itemId", "message", "stack"]);
  getSheet(sheets.CATEGORY_HELPER, ["cat1", "cat2"]).hideSheet();
}

/*************************************************
 * SpreadsheetService compatibility shim
 *************************************************/
const SpreadsheetService = {
  getSheet,
  getAllRows,
  setAllRows,
  appendRow,
  invalidateItemIndex_,
  getItemById,
  getItemBySlug,
  getAllItems
};

/*************************************************
 * UserService — cached user lookup & upsert
 *************************************************/
const UserService = (() => {
  const SHEET = () => SpreadsheetService.getSheet(CFG.SHEETS.USERS);
  const CACHE = CacheService.getScriptCache();
  const CACHE_TTL = 300;
  let memCache = null;

  function now_() { return new Date().toISOString(); }

  function loadAll_() {
    if (memCache) return memCache;
    const cached = CACHE.get("users:all");
    if (cached) { memCache = JSON.parse(cached); return memCache; }
    const sh = SHEET();
    const values = sh.getDataRange().getValues();
    values.shift();
    memCache = {};
    values.forEach(r => {
      const [email, name, photo, createdAt, lastLogin] = r;
      if (!email) return;
      memCache[email] = { email, name, photo, createdAt, lastLogin };
    });
    CACHE.put("users:all", JSON.stringify(memCache), CACHE_TTL);
    return memCache;
  }

  function invalidate_() { memCache = null; CACHE.remove("users:all"); }

  function getByEmail(email) { if (!email) return null; return loadAll_()[email] || null; }

  function touchUser({ email, name, photo }) {
    if (!email) return;
    const sh = SHEET();
    const users = loadAll_();
    const ts = now_();
    if (users[email]) {
      const rows = sh.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === email) {
          rows[i][1] = name || rows[i][1];
          rows[i][2] = photo || rows[i][2];
          rows[i][4] = ts;
          sh.getRange(i + 1, 1, 1, 5).setValues([rows[i]]);
          break;
        }
      }
    } else {
      sh.appendRow([email, name || "", photo || "", ts, ts]);
    }
    invalidate_();
  }

  function mapByEmails(emails) {
    const users = loadAll_();
    const out = {};
    emails.forEach(e => { if (users[e]) out[e] = users[e]; });
    return out;
  }

  return { getByEmail, touchUser, mapByEmails };
})();

/*************************************************
 * UserActivityService — READ ONLY, ORCHESTRATOR
 *************************************************/
const UserActivityService = (() => {
  function emptyActivity_() {
    return {
      userEmail: "",
      profilePic: "",
      likedCount: 0,
      commentCount: 0,
      likes: { items: [], nextCursor: null, hasMore: false },
      comments: { items: [], nextCursor: null, hasMore: false }
    };
  }

  function buildItemPreview_(event, user) {
    const item = SpreadsheetService.getItemById(event.itemId);
    if (!item) return null;
    return {
      itemId: item.id,
      itemName: item.name || "(untitled)",
      itemImage: item.cdn || "",
      pageUrl: event.pageUrl || "",
      likedAt: event.createdAt
    };
  }

  function buildCommentPreview_(event, user) {
    const item = SpreadsheetService.getItemById(event.itemId);
    if (!item) return null;
    return {
      itemId: item.id,
      itemName: item.name || "(untitled)",
      itemImage: item.cdn || "",
      pageUrl: event.pageUrl || "",
      comment: event.value || "",
      commentedAt: event.createdAt,
      userImage: user.photo || ""
    };
  }

  function getActivityByEmail(email) {
    if (!email) return emptyActivity_();
    const user = UserService.getByEmail(email);
    if (!user) return emptyActivity_();
    const events = EventService.getByUser_(email);

    const likes = [];
    const comments = [];
    for (const e of events) {
      if (!e || !e.type || !e.itemId || !e.createdAt) continue;
      if (e.type === "like") likes.push(e);
      if (e.type === "comment") comments.push(e);
    }

    const likedItems = likes.map(e => buildItemPreview_(e, user)).filter(Boolean);
    const commentedItems = comments.map(e => buildCommentPreview_(e, user)).filter(Boolean);

    return {
      userEmail: email,
      profilePic: user.photo || "",
      likedCount: likedItems.length,
      commentCount: commentedItems.length,
      likes: { items: likedItems, nextCursor: null, hasMore: false },
      comments: { items: commentedItems, nextCursor: null, hasMore: false }
    };
  }

  return { getActivityByEmail };
})();

/*************************************************
 * getUserProfile — public profile (activity only)
 *************************************************/
function getUserProfile(data) {
  const email = data.email;
  if (!email) return error_("Missing email");
  const user = UserService.getByEmail(email);
  if (!user) return error_("User not found");
  const activity = UserActivityService.getActivityByEmail(email);
  return ok_(activity);
}


/*************************************************
 * EventService — items interactions
 *************************************************/
const EventService = (() => {
  const SHEET = () => SpreadsheetService.getSheet(CFG.SHEETS.EVENTS);

  function now_() { return new Date().toISOString(); }

  function getAll_() {
    const rows = SHEET().getDataRange().getValues();
    if (rows.length <= 1) return [];
    const headers = rows.shift();
    return rows.map(r => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = r[i]);
      return obj;
    });
  }

  function addEvent({ itemId, type, value, pageUrl, userEmail }) {
    const ts = now_();
    const id = uuid();
    SHEET().appendRow([id, itemId, type, value || "", pageUrl || "", userEmail || "", ts, ts, ""]);
    return { id, itemId, type, value, pageUrl, userEmail, createdAt: ts, updatedAt: ts };
  }

  function getByItem_(itemId) {
    return getAll_().filter(e => e.itemId === itemId && !e.deleted);
  }

  function getByUser_(email) {
    return getAll_().filter(e => e.userEmail === email && !e.deleted);
  }

  function stats(itemId) {
    const events = getByItem_(itemId);
    const out = { views: 0, likes: 0, comments: 0 };
    for (const e of events) {
      if (e.type === "view") out.views++;
      else if (e.type === "like") out.likes++;
      else if (e.type === "comment") out.comments++;
    }
    return out;
  }

  return { addEvent, getByItem_, getByUser_, stats };
})();

/*************************************************
 * DriveService / ImageService — helper for CDN
 *************************************************/
const DriveService = (() => {
  function getCdnUrl(fileId, width = CFG.IMAGE.CDN_WIDTH) {
    if (!fileId) return "";
    return `https://drive.google.com/uc?export=view&id=${fileId}&w=${width}`;
  }

  function getFileMetadata(fileId) {
    try {
      const file = DriveApp.getFileById(fileId);
      return {
        name: file.getName(),
        size: file.getSize(),
        url: file.getUrl(),
        createdAt: file.getDateCreated(),
        updatedAt: file.getLastUpdated()
      };
    } catch (e) {
      return null;
    }
  }

  return { getCdnUrl, getFileMetadata };
})();

/*************************************************
 * LoggerService
 *************************************************/
const LoggerService = (() => {
  const SHEET = () => SpreadsheetService.getSheet(CFG.SHEETS.ERRORS);

  function log(jobId, itemId, message, stack) {
    const ts = new Date().toISOString();
    SHEET().appendRow([ts, jobId || "", itemId || "", message || "", stack || ""]);
  }

  return { log };
})();

/*************************************************
 * APIService — entry point
 *************************************************/
function doGet(e) {
  try {
    return ok_({ message: "DriveShop API GET — ready" });
  } catch (err) {
    LoggerService.log("doGet", "", err.message, err.stack);
    return errorRes(err);
  }
}

function doPost(e) {
  try {
    const body = e.postData?.contents;
    if (!body) return error_("Missing request body");
    const data = JSON.parse(body);

    const { action, payload } = data;
    if (!action) return error_("Missing action");

    switch (action) {
      case "getUserProfile":
        return getUserProfile(payload);

      case "addEvent":
        if (!payload || !payload.itemId || !payload.type) return error_("Missing payload fields");
        const ev = EventService.addEvent(payload);
        return ok_(ev);

      case "getItemById":
        if (!payload || !payload.id) return error_("Missing item id");
        const item = SpreadsheetService.getItemById(payload.id);
        return item ? ok_(item) : error_("Item not found");

      case "getAllItems":
        return ok_(SpreadsheetService.getAllItems());

      default:
        return error_("Unknown action: " + action);
    }
  } catch (err) {
    LoggerService.log("doPost", "", err.message, err.stack);
    return errorRes(err);
  }
}

/*************************************************
 * Utility
 *************************************************/
function slugify_(str) {
  return (str || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/*************************************************
 * Initialize everything
 *************************************************/
function init_() {
  setupSheets_();
  buildItemIndex_();
}

init_();

