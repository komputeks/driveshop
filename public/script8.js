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
  
  function slugify_(str) {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")     // spaces → dashes
    .replace(/[^a-z0-9-]/g, "")  // drop unsafe chars
    .replace(/-+/g, "-")         // collapse dashes
    .replace(/^-|-$/g, "");      // trim edges
}
  function res(obj) {
    return ContentService
      .createTextOutput(JSON.stringify(obj))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  function ok_(data) {
    return res({ ok: true, ...data });
  }
  
  function errorRes(e) {
    return res({ ok: false, error: e?.message || e });
  }
  
  function json_(obj) {
    return res(obj);
  }
  
  
  function error_(msg) {
    return res({ ok: false, error: msg });
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
    const now = Math.floor(Date.now() / 1000);
  
    const data = cache.get(key);
    let obj = data ? JSON.parse(data) : { count: 0, ts: now };
  
    if (now - obj.ts > windowSec) {
      obj = { count: 0, ts: now };
    }
  
    obj.count++;
    cache.put(key, JSON.stringify(obj), windowSec);
  
    if (obj.count > limit) {
      throw new Error("Rate limit exceeded");
    }
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
  
  // Cache in memory
  let ssCache = null;
  let itemIndexCache = null;
  
  
  /** Open or create main spreadsheet */
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
  
  
  /** Extract Spreadsheet ID from URL */
  function extractSheetId(url) {
    const m = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!m) throw new Error("Invalid Spreadsheet URL");
    return m[1];
  }
  
  
  /** Create new spreadsheet and save URL */
  function createAndSaveSpreadsheet_() {
    const ss = SpreadsheetApp.create("DriveShop Database");
  
    PropertiesService
      .getScriptProperties()
      .setProperty("SPREADSHEET_URL", ss.getUrl());
  
    ssCache = ss;
    return ss;
  }
  
  
  /** Get or create sheet */
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
  
  
  /** Batch write rows */
  function setAllRows(sheetName, rows, headers = []) {
    const sh = getSheet(sheetName, headers);
  
    sh.clearContents();
  
    if (headers.length) sh.appendRow(headers);
  
    if (rows.length) {
      sh
        .getRange(2, 1, rows.length, rows[0].length)
        .setValues(rows);
    }
  }
  
  
  /** Append a single row */
  function appendRow(sheetName, row) {
    const sh = getSheet(sheetName);
    sh.appendRow(row);
  
    if (sheetName === CFG.SHEETS.ITEMS) {
      invalidateItemIndex_();
    }
  }
  
  
  let _itemIndex = null;
  let _slugIndex = null;
  
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
  
  /** Initialize all sheets */
  function setupSheets_() {
  
    const sheets = CFG.SHEETS;
  
    getSheet(sheets.ITEMS, [
      "id", "name", "cat1", "cat2", "cdn",
      "width", "height", "size", "description",
      "createdAt", "updatedAt", "views", "likes", "comments",
      "sig"
    ]);
    
    const EVENTS_HEADERS = [
      "id",
      "itemId",
      "type",
      "value",
      "pageUrl",
      "userEmail",
      "createdAt",
      "updatedAt",
      "deleted"
    ];
    getSheet(sheets.EVENTS, EVENTS_HEADERS);
    
    getSheet(sheets.USERS, [
      "email", "name", "photo", "createdAt", "lastLogin"
    ]);
  
    getSheet(sheets.ERRORS, [
      "time", "jobId", "itemId", "message", "stack"
    ]);
  
    getSheet(sheets.CATEGORY_HELPER, ["cat1", "cat2"])
      .hideSheet();
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
  const CACHE_TTL = 300; // 5 minutes

  let memCache = null; // email -> user

  /* ---------------------------------------------
   * Internal helpers
   --------------------------------------------- */

  function now_() {
    return new Date().toISOString();
  }

  function loadAll_() {
    if (memCache) return memCache;

    const cached = CACHE.get("users:all");
    if (cached) {
      memCache = JSON.parse(cached);
      return memCache;
    }

    const sh = SHEET();
    const values = sh.getDataRange().getValues();
    values.shift(); // headers

    memCache = {};
    values.forEach(r => {
      const [email, name, photo, createdAt, lastLogin] = r;
      if (!email) return;
    
      memCache[email] = {
        email,
        name,
        photo,
        createdAt,
        lastLogin
      };
    });
    CACHE.put("users:all", JSON.stringify(memCache), CACHE_TTL);
    return memCache;
  }

  function invalidate_() {
    memCache = null;
    CACHE.remove("users:all");
  }

  /* ---------------------------------------------
   * Public API
   --------------------------------------------- */

  function getByEmail(email) {
    if (!email) return null;
    const users = loadAll_();
    return users[email] || null;
  }

  /**
   * Create or update user on login
   */
  function touchUser({ email, name, photo }) {
    if (!email) return;

    const sh = SHEET();
    const users = loadAll_();
    const ts = now_();

    if (users[email]) {
      // Update existing
      const rows = sh.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === email) {
          rows[i][1] = name || rows[i][1];
          rows[i][2] = photo || rows[i][2];
          rows[i][4] = ts; // lastLogin
          sh.getRange(i + 1, 1, 1, 5).setValues([rows[i]]);
          break;
        }
      }
    } else {
      // Insert new
      sh.appendRow([
        email,
        name || "",
        photo || "",
        ts,
        ts
      ]);
    }
    invalidate_();
  }

  /**
   * Bulk resolver for comments UI
   */
  function mapByEmails(emails) {
    const users = loadAll_();
    const out = {};
    emails.forEach(e => {
      if (users[e]) out[e] = users[e];
    });
    return out;
  }

  return {
    getByEmail,
    touchUser,
    mapByEmails
  };

})();


/*************************************************
 * UserActivityService — READ ONLY, ORCHESTRATOR
 *************************************************/
const UserActivityService = (() => {

  /**
   * Returns user activity (likes + comments)
   */
  function getActivityByEmail(email) {
    if (!email) {
      return emptyActivity_();
    }

    // 1. Get user (for avatar)
    const user = UserService.getByEmail(email);
    if (!user) {
      return emptyActivity_();
    }

    // 2. Get all events for this user
    const events = EventService.getByUser_(email);

    if (!events.length) {
      return emptyActivity_();
    }

    // 3. Split events
    const likes = [];
    const comments = [];

    for (const e of events) {
      if (!e || !e.type || !e.itemId || !e.createdAt) continue;
    
      if (e.type === "like") likes.push(e);
      if (e.type === "comment") comments.push(e);
    }

    // 4. Resolve items
    const likedItems = likes
      .map(e => buildItemPreview_(e, user))
      .filter(Boolean);

    const commentedItems = comments
      .map(e => buildCommentPreview_(e, user))
      .filter(Boolean);

    return {
      userEmail: email,
      profilePic: user.photo || "",

      likedCount: likedItems.length,
      commentCount: commentedItems.length,

      likes: {
        items: likedItems,
        nextCursor: null,
        hasMore: false,
      },

      comments: {
        items: commentedItems,
        nextCursor: null,
        hasMore: false,
      }
    };
  }

  /* ------------------ helpers ------------------ */

  function buildItemPreview_(event, user) {
    const item = SpreadsheetService.getItemById(event.itemId);
    if (!item) return null;

    return {
      itemId: item.id,
      itemName: item.name || "(untitled)",
      itemImage: item.cdn || "",
      pageUrl: event.pageUrl || "",
      likedAt: event.createdAt,
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
      userImage: user.photo || "",
    };
  }

  function emptyActivity_() {
    return {
      userEmail: "",
      profilePic: "",
      likedCount: 0,
      commentCount: 0,
      likes: { items: [], nextCursor: null, hasMore: false },
      comments: { items: [], nextCursor: null, hasMore: false },
    };
  }

  return {
    getActivityByEmail,
  };

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
 * DriveService — File & Folder Operations (FLATTENED)
 *************************************************/

const folderCache = {};

  /** Get root folder from config */
  function getRootFolder() {
    const rootId = CFG.DRIVE.ROOT_FOLDER_ID;
    if (!rootId) throw new Error("AUTO_FOLDER_ID is not configured");
    return DriveApp.getFolderById(rootId);
  }
  
  /** Ensure a folder exists at root level */
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
  
  /** Ensure two-level category folder */
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
  
  /** List all folders at root */
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
  
  /** Generate file signature */
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
  
  /** Parse categories from filename */
  function parseCategoriesFromFilename(fileName) {
    const dash = fileName.indexOf(" - ");
    if (dash === -1) return { cat1: "Other", cat2: "Other", cleanName: fileName };
  
    const left = fileName.substring(0, dash).trim();
    const right = fileName.substring(dash + 3).trim();
    const parts = left.split(/\s+/);
  
    if (parts.length < 2) return { cat1: "Other", cat2: "Other", cleanName: fileName };
  
    return { cat1: parts[0], cat2: parts[1], cleanName: right };
  }
  
  /** Get image size safely */
  function getImageSize(file) {
    try {
      if (!Drive || !Drive.Files) {
        return getImageDimensions(file);
      }
      
      const fileId = file.getId();
      // Retrieve metadata directly from the Drive API v3
      const metadata = Drive.Files.get(fileId, { fields: 'imageMediaMetadata' });
      
      if (metadata.imageMediaMetadata) {
        return { 
          w: metadata.imageMediaMetadata.width, 
          h: metadata.imageMediaMetadata.height 
        };
      }
      return { w: 0, h: 0 };
    } catch (err) {
      console.error("Error fetching dimensions: " + err);
      return { w: 0, h: 0 };
    }
  }
  
  /** Generate CDN URL for image */
  function getCdnUrl(fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}=w${CFG.IMAGE.CDN_WIDTH}`;
  }


/*************************************************
 * EventService — Unified comments / likes / views
 *************************************************/
const EventService = (() => {

  const SHEET = () => SpreadsheetService.getSheet(CFG.SHEETS.EVENTS);
  const CACHE = CacheService.getScriptCache();
  const CACHE_TTL = 30; // seconds (short on purpose)

  const HEADERS = [
    "id",
    "itemId",
    "type",
    "value",
    "pageUrl",
    "userEmail",
    "createdAt",
    "updatedAt",
    "deleted"
  ];

  function cacheKey_(itemId, type) {
    return `events:${itemId}:${type}`;
  }

  function now_() {
    return new Date().toISOString();
  }

  function readAll_() {
    const sh = SHEET();
    const values = sh.getDataRange().getValues();
    if (values.length <= 1) return [];

    const headers = values.shift();
    return values.map(r => {
      const o = {};
      headers.forEach((h, i) => (o[h] = r[i]));
      return o;
    });
  }

  function writeAll_(rows) {
    const sh = SHEET();
    sh.clearContents();
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    if (rows.length) {
      sh.getRange(2, 1, rows.length, HEADERS.length)
        .setValues(rows.map(r => HEADERS.map(h => r[h] ?? "")));
    }
  }
  
  /**
   * List events by item + type
   */
  function list(itemId, type) {
  if (typeof itemId === "object") {
    type = itemId.type;
    itemId = itemId.itemId;
  }

  if (!itemId || !type) return [];
  const key = cacheKey_(itemId, type);
  const cached = CACHE.get(key);
  if (cached) return JSON.parse(cached);

  const rows = readAll_().filter(r =>
    r.itemId === itemId &&
    r.type === type &&
    r.deleted !== true
  );

  CACHE.put(key, JSON.stringify(rows), CACHE_TTL);
  return rows;
  }

  
  function stats(itemId) {
  const key = `stats:${itemId}`;
  const cached = CACHE.get(key);
  if (cached) return JSON.parse(cached);

  const rows = readAll_().filter(
    r => r.itemId === itemId && r.deleted !== true
  );

  const out = {};
  rows.forEach(r => {
    out[r.type] = (out[r.type] || 0) + 1;
  });

  CACHE.put(key, JSON.stringify(out), CACHE_TTL);
  return out;
  }
  /**
   * Upsert event (comment / like)
   * - Unique by (itemId + type + userEmail)
   */
  function upsert({ itemId, type, value, pageUrl, userEmail }) {
    return withItemLock_(itemId, () => {
    const rows = readAll_();
    const ts = now_();

    let found = false;

    rows.forEach(r => {
      if (
        r.itemId === itemId &&
        r.type === type &&
        r.userEmail === userEmail
      ) {
        r.value = value;
        r.pageUrl = pageUrl || r.pageUrl;
        r.updatedAt = ts;
        r.createdAt = ts; // per your requirement
        r.deleted = false;
        found = true;
      }
    });

    if (!found) {
      rows.push({
        id: Utilities.getUuid(),
        itemId,
        type,
        value,
        pageUrl,
        userEmail,
        createdAt: ts,
        updatedAt: ts,
        deleted: false
      });
    }

    writeAll_(rows);
    CACHE.remove(cacheKey_(itemId, type));
    CACHE.remove(`stats:${itemId}`);
    });
  }

  /**
   * Soft delete (unlike / delete comment)
   */
  function remove({ itemId, type, userEmail }) {
    return withItemLock_(itemId, () => {
    const rows = readAll_();
    let changed = false;

    rows.forEach(r => {
      if (
        r.itemId === itemId &&
        r.type === type &&
        r.userEmail === userEmail
      ) {
        r.deleted = true;
        r.updatedAt = now_();
        changed = true;
      }
    });

    if (changed) {
      writeAll_(rows);
      CACHE.remove(cacheKey_(itemId, type));
      CACHE.remove(`stats:${itemId}`);
    }
    });
  }
  
  
  function batchStats(itemIds) {
    const key = "stats:batch:" + itemIds.sort().join(",");
    const cached = CACHE.get(key);
    if (cached) return JSON.parse(cached);
  
    const rows = readAll_().filter(r =>
      itemIds.includes(r.itemId) && r.deleted !== true
    );
  
    const out = {};
    rows.forEach(r => {
      if (!out[r.itemId]) out[r.itemId] = {};
      out[r.itemId][r.type] = (out[r.itemId][r.type] || 0) + 1;
    });
  
    CACHE.put(key, JSON.stringify(out), CACHE_TTL);
    return out;
  }
  
  function getByUser_(email) {
    if (!email) return [];
  
    const rows = readAll_();
    if (!Array.isArray(rows) || rows.length === 0) return [];
  
    const out = [];
  
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r) continue;
  
      const {
        userEmail,
        itemId,
        type,
        createdAt,
        deleted
      } = r;
  
      // hard validation
      if (deleted === true) continue;
      if (userEmail !== email) continue;
      if (!itemId || !type || !createdAt) continue;
  
      out.push(r);
    }
  
    return out;
  }
  
  
  return {
    list,
    stats,
    batchStats,
    upsert,
    remove,
    getByUser_
  };

})();

/*************************************************
 * CDNService / ImageService (FLATTENED)
 *************************************************/
  
  /** Get image width & height from Drive file */
  function getImageDimensions(file) {
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
    const sh = getSheet(CFG.SHEETS.ITEMS);
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
  
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${CFG.API.GEMINI_KEY}`;
      const res = UrlFetchApp.fetch(endpoint, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload)
      });
  
      const j = JSON.parse(res.getContentText());
      const description = j.candidates?.[0]?.content?.parts?.[0]?.text || "";
  
      // Cache description
      sh.getRange(rowIndex, descCol).setValue(description);
  
      return description;
    } catch (err) {
    logError("describeImage", fileId, err);
    return "";
    }
  }
  
  /** Convert Drive file to Base64 for Gemini API */
  function getImageBlobBase64(fileId) {
    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    return Utilities.base64Encode(blob.getBytes());
  }

/*************************************************
 * SyncService — Drive ↔ Sheet Synchronization (FLATTENED)
 *************************************************/
  
  /** Normalize a single item row */
  function normalizeRow(rowIndex) {
    const sh = getSheet(CFG.SHEETS.ITEMS);
    const rowData = sh.getRange(rowIndex, 1, 1, sh.getLastColumn()).getValues()[0];
  
    const id = rowData[0];
    let name = rowData[1];
    let cat1 = rowData[2];
    let cat2 = rowData[3];
  
    if (!id) return;
  
    const file = DriveApp.getFileById(id);
    const path = getParent(file);
  
    // Infer missing categories from filename
    if (!cat1 || !cat2) {
      const parsed = parseCategoriesFromFilename(file.getName());
      cat1 = parsed.cat1;
      cat2 = parsed.cat2;
      name = parsed.cleanName;
  
      sh.getRange(rowIndex, 3).setValue(cat1);
      sh.getRange(rowIndex, 4).setValue(cat2);
      sh.getRange(rowIndex, 2).setValue(name);
    }
  
    // Ensure folder placement
    const destFolder = ensureCategory2Folder(cat1, cat2);
    if (path.parentId !== destFolder.getId()) {
      moveFileToFolder(file, destFolder);
    }
  
    // Ensure filename matches
    renameFile(file, name);
  
    // Update signature
    const sig = getFileSignature(file, destFolder.getId());
    sh.getRange(rowIndex, sh.getLastColumn()).setValue(sig);
    
    SpreadsheetService.invalidateItemIndex_();
  }
  
  /** Normalize all rows */
  function normalizeAll() {
    const sh = getSheet(CFG.SHEETS.ITEMS);
    const lastRow = sh.getLastRow();
    for (let r = 2; r <= lastRow; r++) {
      try {
        normalizeRow(r);
      } catch (err) {
        logError("normalizeAll", sh.getRange(r, 1).getValue(), err);
      }
    }
    SpreadsheetService.invalidateItemIndex_();
    CacheService.getScriptCache().remove("category:tree");
  }
  
  /** Full scan: Drive → Sheet */
  function fullScan() {
    const sh = getSheet(CFG.SHEETS.ITEMS);
    buildItemIndex_();
    const index = _itemIndex;
    const root = getRootFolder();
    const files = walkFiles(root);
  
    const nowTs = now();
    const seen = new Set();
  
    const newRows = [];
    const sigUpdates = [];
    const rowsToDelete = [];
  
    files.forEach(file => {
      if (!file.getMimeType().startsWith("image/")) return;
  
      const id = file.getId();
      seen.add(id);
  
      const parent = getParent(file);
      const sig = getFileSignature(file, parent.parentId);
      const entry = index[id];
  
      if (!entry) {
        const parsed = parseCategoriesFromFilename(file.getName());
        const dest = ensureCategory2Folder(parsed.cat1, parsed.cat2);
  
        moveFileToFolder(file, dest);
        renameFile(file, parsed.cleanName);
  
        const size = getImageSize(file);
  
        newRows.push([
          id,
          parsed.cleanName,
          parsed.cat1,
          parsed.cat2,
          getCdnUrl(id),
          size.w,
          size.h,
          file.getSize(),
          "",
          file.getDateCreated(),
          nowTs,
          0, 0, 0,
          sig
        ]);
        return;
      }
  
      if (entry.sig !== sig) {
        sigUpdates.push({ row: entry.row, sig });
      }
    });
  
    Object.keys(index).forEach(id => {
      if (!seen.has(id)) rowsToDelete.push(index[id].row);
    });
  
    if (newRows.length) {
      sh.getRange(
        sh.getLastRow() + 1,
        1,
        newRows.length,
        newRows[0].length
      ).setValues(newRows);
    }
  
    if (sigUpdates.length) {
      sigUpdates.forEach(u => {
        sh.getRange(u.row, 15).setValue(u.sig);
        sh.getRange(u.row, 11).setValue(nowTs);
      });
    }
  
    rowsToDelete
      .sort((a, b) => b - a)
      .forEach(r => sh.deleteRow(r));
  
    SpreadsheetService.invalidateItemIndex_();
    CacheService.getScriptCache().remove("category:tree");
    syncCategoryDropdown();
    syncCategory2Dropdown();
  }
  
  
  /** Sync Category1 dropdown */
  function syncCategoryDropdown() {
    const cats = listRootCategories();
    if (!cats.length) return;
  
    const sh = getSheet(CFG.SHEETS.ITEMS);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(cats, true)
      .build();
  
    sh.getRange("C2:C").setDataValidation(rule);
  }
  
  /** Sync Category2 dropdown (_dependent on Category1) */
  function syncCategory2Dropdown() {
    const ss = getSpreadsheet();
    const helper = getSheet(CFG.SHEETS.CATEGORY_HELPER);
    helper.clear();
    helper.appendRow(["cat1", "cat2"]);
  
    const root = getRootFolder();
    const lvl1 = root.getFolders();
  
    while (lvl1.hasNext()) {
      const c1 = lvl1.next();
      const lvl2 = c1.getFolders();
      while (lvl2.hasNext()) helper.appendRow([c1.getName(), lvl2.next().getName()]);
    }
  
    const items = getSheet(CFG.SHEETS.ITEMS);
    const lastRow = Math.max(items.getLastRow(), 2);
  
    const rule = SpreadsheetApp.newDataValidation()
      .requireFormulaSatisfied('=COUNTIF(FILTER(_cats!$B:$B,_cats!$A:$A=$C2),D2)')
      .setAllowInvalid(false)
      .build();
  
    items.getRange(2, 4, lastRow - 1).setDataValidation(rule);
  }


/*************************************************
 * Logger — Centralized Error & Job Logging (FLATTENED)
 *************************************************/
  
  /** Log an error */
  function logError(job = "", item = "", e) {
    const sh = getSheet(CFG.SHEETS.ERRORS);
  
    const row = [
      now(),
      job,
      item,
      e?.message || e || "",
      e?.stack || ""
    ];
  
    appendRow(CFG.SHEETS.ERRORS, row);
  
    console.error(`[${job}] Item: ${item}`, e);
  }
  
  /** Log general info */
  function logInfo(message, ...args) {
    console.info(`[INFO] ${message}`, ...args);
  }
  
  /** Clear all errors */
  function clearErrors() {
    const sh = getSheet(CFG.SHEETS.ERRORS);
    sh.clearContents();
    sh.appendRow(["time", "jobId", "itemId", "message", "stack"]);
  }


/*************************************************
 * APIService — Items list
 *************************************************/
  
  function handleItemsList_(params) {
    
    let {
      page = 1,
      limit = 20,
      cat1,
      cat2,
      search
    } = params;
  
    page = Math.max(1, Number(page));
    limit = Math.min(50, Math.max(1, Number(limit)));
  
    const cache = CacheService.getScriptCache();
    const key = "items:list:" + Utilities.base64Encode(JSON.stringify({
      page, limit, cat1, cat2, search
    }));
    
    const cached = cache.get(key);
    if (cached) return json_(JSON.parse(cached));
    let items = SpreadsheetService.getAllItems();
  
    // Filter: category
    if (cat1) {
      items = items.filter(i => i.cat1 === cat1);
    }
  
    if (cat2) {
      items = items.filter(i => i.cat2 === cat2);
    }
  
    // Filter: search
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i =>
        (i.name || "").toLowerCase().includes(q) ||
        (i.description || "").toLowerCase().includes(q)
      );
    }
  
    // Sort: newest first
    items.sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  
    const total = items.length;
    const start = (page - 1) * limit;
    const pageItems = items.slice(start, start + limit);
    
    const payload = {
      page,
      limit,
      total,
      hasMore: start + limit < total,
      items: pageItems
    };
    
    cache.put(key, JSON.stringify(payload), 30);
    return ok_(payload);
  }
  
  function getItemBySlug(params) {
    const slug = params.slug;
    if (!slug) return errorRes("Missing slug");
  
    const item = SpreadsheetService.getItemBySlug(slug);
    if (!item) return errorRes("Not found");
  
    return res({
      ok: true,
      item: {
        ...item,
        slug
      }
    });
  }
  
  /** GET: Categories */
  function getCategories() {
    try {
      const categories = listRootCategories();
      return res({ ok: true, categories });
    } catch (e) {
      logError("apiGetCategories", "", e);
      return errorRes(e);
    }
  }
  
  /** GET: Stats for a single item */
  function getStats(params) {
    const id = params.id;
    if (!id) return errorRes("Missing id");
  
    const item = SpreadsheetService.getItemById(id);
    if (!item) return errorRes("Not found");
  
    const stats = EventService.stats(id);
    return res({ ok: true, stats });
  }
  
  /** POST: User login */
  function apiLogin(data) {
    try {
      const { email, name, photo } = data;
      if (!email) return errorRes("Missing email");
      UserService.touchUser({ email, name, photo });
      return res({ ok: true });
    } catch (e) {
      logError("apiLogin", data.email, e);
      return errorRes(e);
    }
  }
  
  function getItemEvents(params) {
    try {
      const { itemId, type } = params;
      if (!itemId) return errorRes("Missing itemId");
  
      const events = EventService.list({ itemId, type });
  
      const usersRows = getAllRows(CFG.SHEETS.USERS);
      const usersMap = Object.fromEntries(
        usersRows.map(u => [u[0], { name: u[1], photo: u[2] }])
      );
  
      const out = events.map(e => ({
        ...e,
        userName: usersMap[e.userEmail]?.name || "",
        userPhoto: usersMap[e.userEmail]?.photo || ""
      }));
  
      return res({ ok: true, events: out });
    } catch (e) {
      logError("getItemEvents", params.itemId, e);
      return errorRes(e);
    }
  }

/*************************************************
 * APIService — Events endpoints
 *************************************************/

  function handleEventsGet_(params) {
    const { itemId, type } = params;
  
    if (!itemId || !type) {
      return error_("Missing itemId or type");
    }
  
    const events = EventService.list({ itemId, type });
    return ok_({ events });
  }
  
  function handleEventsUpsert_(body) {
    const idemKey = [
      body.itemId,
      body.type,
      body.userEmail,
      body.value
    ].join("|");
    
    if (!idempotent_(idemKey)) {
      return ok_({ ok: true, deduped: true });
    }
  
    rateLimit_(
      `evt:${body.userEmail}:${body.type}`,
      body.type === "comment" ? 5 : 20,
      60
    );
    const { itemId, type, value, pageUrl, userEmail } = body;
  
    if (!itemId || !type || !userEmail) {
      return error_("Missing required fields");
    }
  
    // Value required for comments, optional for likes
    if (type === "comment" && !value) {
      return error_("Comment value required");
    }
  
    EventService.upsert({
      itemId,
      type,
      value: value || "1",
      pageUrl: pageUrl || "",
      userEmail
    });
    const stats = EventService.stats(itemId);
    syncItemCounters_(itemId);
    revalidateNext([
    `item:${itemId}`,
    "items:list"
  ]);
  
    return ok_({ ok: true });
  }
  
  function handleEventsRemove_(body) {
    const { itemId, type, userEmail } = body;
  
    if (!itemId || !type || !userEmail) {
      return error_("Missing required fields");
    }
  
    EventService.remove({ itemId, type, userEmail });
    const stats = EventService.stats(itemId);
    syncItemCounters_(itemId);
    revalidateNext([
    `item:${itemId}`,
    "items:list"
  ]);
    return ok_({ ok: true });
  }
  
  function getCategoryTree() {
    return res({ ok: true, categories: CategoryService.getTree() });
  }
  
  
  /*************************************************
 * Resolve public handle → email
 * Priority:
 *   1. slugified name column (if exists)
 *   2. email handle fallback
 *************************************************/
function resolveUserHandle(data) {
  const handle = String(data.handle || "")
    .toLowerCase()
    .trim();

  if (!handle) return error_("Missing handle");

  const sh = getSheet(CFG.SHEETS.USERS);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return error_("User not found");

  const rows = sh
    .getRange(2, 1, lastRow - 1, sh.getLastColumn())
    .getValues();

  // Users sheet columns:
  // 0 = email | 1 = name | 2 = photo | 3 = createdAt | 4 = lastLogin
  for (let i = 0; i < rows.length; i++) {
    const email = String(rows[i][0] || "").toLowerCase().trim();
    const name = String(rows[i][1] || "").toLowerCase().trim();

    if (!email) continue;

    // 1️⃣ name → handle (slugified)
    if (name) {
      const nameHandle = slugify_(name);
      if (nameHandle === handle) {
        return ok_({ email });
      }
    }

    // 2️⃣ email fallback
    const emailHandle = email.split("@")[0];
    if (emailHandle === handle) {
      return ok_({ email });
    }
  }

  return error_("User not found");
}

    
  // function assertNonceUnused_(action, nonce) {
  //   const cache = CacheService.getScriptCache();
  //   const key = `nonce:${action}:${nonce}`;
  //   if (cache.get(key)) {
  //     throw new Error("Replay detected");
  //   }
  //   cache.put(key, "1", 120); // 2 min
  // }

    
  // function verifySignedRequest_(e) {
    
  //   const h = e?.headers || {};
  
  //   const action    = h["x-action"];
  //   const timestamp = Number(h["x-timestamp"]);
  //   const nonce     = h["x-nonce"];
  //   const signature = h["x-signature"];
  
  //   if (!action || !timestamp || !nonce || !signature) {
  //     throw new Error("Missing HMAC headers");
  //   }
  
  //   if (Math.abs(Date.now()/1000 - timestamp) > 60) {
  //     throw new Error("Expired request");
  //   }
  
  //   assertNonceUnused_(action, nonce);
  
  //   const secret = getProp_("NEXTJS_HMAC_SECRET");
  //   const payload = e.postData?.contents || "";
  
  //   const base = [
  //   "POST",
  //     action,
  //     timestamp,
  //     nonce,
  //     Utilities.base64Encode(payload)
  //   ].join(".");
  
  //   const raw = Utilities.computeHmacSha256Signature(base, secret);
  //   const expected = raw.map(b =>
  //     ('0' + (b & 0xff).toString(16)).slice(-2)
  //   ).join("");
  
  //   if (expected !== signature) {
  //     throw new Error("Invalid HMAC signature");
  //   }
  // }
  
  // function verifySignature_(raw, signature) {
  //   const secret =  getProp_("API_SIGNING_SECRET");
  
  //   const bytes = Utilities.computeHmacSha256Signature(raw, secret);
  //   const expected = bytes
  //     .map(b => ('0' + (b & 0xff).toString(16)).slice(-2))
  //     .join('');
  
  //   if (expected !== signature) {
  //     throw new Error("Invalid signature");
  //   }
  // }

/*************************************************
 * doGet — public read-only API
 *************************************************/
  function doGet(e) {
    try {
      const params = e?.parameter || {};
      const action = (params.action || "").toLowerCase();
  
      switch (action) {
        case "items.list":
          return handleItemsList_(params);
  
        case "item-by-slug":
          return getItemBySlug(params);
  
        case "categories":
          return getCategories();
  
        case "category-tree":
          return getCategoryTree();
  
        case "stats":
          return getStats(params);
  
        case "events.list":
          return handleEventsGet_(params);
  
        default:
          return error_("Unknown GET action: " + action);
      }
    } catch (e) {
      logError("doGet", "", e);
      return errorRes(e);
    }
  }


/** doGet entrypoint */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return errorRes("Missing request body");
    }

    const body = JSON.parse(e.postData.contents || "{}");
    const action = (body.action || "").toLowerCase();

    switch (action) {
      
      case "item":
        if (!body.id) return errorRes("Missing id");
        return res({ ok: true, item: getItemById(body.id) });
        
      case "getuserprofile":
        return getUserProfile(body);

      case "item-by-slug":
        return getItemBySlug(body);

      case "categories":
        return getCategories();

      case "category-tree":
        return getCategoryTree();

      case "stats":
        return getStats(body);

      case "events.list":
        return json_(handleEventsGet_(body));

      case "items.list":
        return json_(handleItemsList_(body));

      case "login":
        return apiLogin(body);

      case "events.upsert":
        return json_(handleEventsUpsert_(body));

      case "events.remove":
        return json_(handleEventsRemove_(body));

      default:
        return errorRes("Unknown action: " + action);
    }

  } catch (err) {
    logError("doPost", "", err);
    return errorRes(err.message || err);
  }
}


/** revalidateNext */
  function revalidateNext(tags = []) {
  if (!Array.isArray(tags) || !tags.length) return;

  const url = getProp_("NEXTJS_ISR_ENDPOINT");

  const res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ tags }),
    muteHttpExceptions: true,
  });

  return res.getResponseCode();
}
  /*************************************************
   * HMAC Signing — canonical & per-action
   *************************************************/
  
  function signPayload_(action, body) {
    const secret = getProp_("NEXTJS_HMAC_SECRET");
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = Utilities.getUuid();
  
    const payload = JSON.stringify(body || {});
    const base = [
      "POST",
      action,
      timestamp,
      nonce,
      Utilities.base64Encode(payload)
    ].join(".");
  
    const raw = Utilities.computeHmacSha256Signature(base, secret);
    const signature = raw.map(b =>
      ('0' + (b & 0xff).toString(16)).slice(-2)
    ).join("");
  
    return { action, timestamp, nonce, signature, payload };
  }
/*************************************************
 * CategoryService — canonical category tree API
 *************************************************/
const CategoryService = (() => {

  function getTree() {
    const cache = CacheService.getScriptCache();
    const cached = cache.get("category:tree");
    if (cached) return JSON.parse(cached);
  
    const items = SpreadsheetService.getAllItems();
    const map = {};
  
    items.forEach(it => {
      const c1 = it.cat1 || "other";
      const c2 = it.cat2 || null;
  
      if (!map[c1]) {
        map[c1] = {
          slug: slugify_(c1),
          name: c1,
          children: {}
        };
      }
      if (c2) {
        map[c1].children[c2] = {
          slug: slugify_(c2),
          name: c2
        };
      }
    });
  
    const tree = Object.values(map).map(c => ({
      slug: c.slug,
      name: c.name,
      children: Object.values(c.children)
    }));
  
    cache.put("category:tree", JSON.stringify(tree), 300);
    return tree;
  }
  return { getTree };
})();




/*************************************************
 * BootstrapService — Initialization & Triggers (FLATTENED)
 *************************************************/

/** Initialize sheets & columns */
  function bootstrapSetupSheets() {
    const itemsCols = [
      "id","name","cat1","cat2","cdn","w","h","size","description",
      "createdAt","updatedAt","views","likes","comments","sig"
    ];
  
    const eventsCols = [
      "id",
      "itemId",
      "type",
      "value",
      "pageUrl",
      "userEmail",
      "createdAt",
      "updatedAt",
      "deleted"
    ];
    
    const usersCols  = ["email","name","photo","createdAt","lastLogin"];
    const errorsCols = ["time","jobId","itemId","message","stack"];
  
    getSheet(CFG.SHEETS.ITEMS, itemsCols);
    getSheet(CFG.SHEETS.EVENTS, eventsCols);
    getSheet(CFG.SHEETS.USERS, usersCols);
    getSheet(CFG.SHEETS.ERRORS, errorsCols);
  
    // Helper sheet for category2 dropdown
    getSheet(CFG.SHEETS.CATEGORY_HELPER, ["cat1","cat2"]);
  }

/** Sync all dropdowns */
  function bootstrapSyncDropdowns() {
    syncCategoryDropdown();
    syncCategory2Dropdown();
  }
  
  
  /** onEdit */
  function onEdit(e) {
    // reserved for future use
  }
  
  
  /** Install triggers */
  function bootstrapInstallTriggers() {
    ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  
    const ss = getSpreadsheet();
  
    ScriptApp.newTrigger("onEdit")
      .forSpreadsheet(ss)
      .onEdit()
      .create();
  
    ScriptApp.newTrigger("fullScan")
      .timeBased()
      .everyDays(1)
      .atHour(3)
      .create();
  }
  
  /** Initialize DriveShop */
  function initDriveShop() {
    bootstrapSetupSheets();
    bootstrapSyncDropdowns();
    bootstrapInstallTriggers();
  
    return {
      ok: true,
      message: "DriveShop initialized"
    };
  }
  
  function initDriveShopUI() {
    const ui = SpreadsheetApp.getUi();
    try {
      initDriveShop();
      ui.alert("✅ DriveShop initialized successfully");
    } catch (e) {
      ui.alert("❌ Init failed:\n\n" + e.message);
      throw e;
    }
  }
  
  function onOpen() {
    SpreadsheetApp.getUi()
      .createMenu("DriveShop")
      .addItem("Initialize", "initDriveShopUI")
      .addToUi();
  }


