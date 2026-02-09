/*************************************************
 * ConfigService — Centralized configuration
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

/**
 * Get script property, throw if missing
 */
function getProp_(key) {
  const val = PROPS.getProperty(key);
  if (!val) throw new Error(`Missing ScriptProperty: ${key}`);
  return val;
}

/**
 * Utility: current timestamp
 */
function now() { return new Date(); }

/**
 * Utility: UUID generator
 */
function uuid() { return Utilities.getUuid(); }

/*************************************************
 * Core Helpers — Response, Slug, Lock, Rate
 *************************************************/

/**
 * Slugify string
 */
function slugify_(str) {
  if (!str) return "";
  return str.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Standard API response wrapper
 */
function res(obj) { return obj; }
function ok_(data) { return res({ ok: true, ...data }); }
function errorRes(e) { return res({ ok:false, error:e?.message||e }); }
function json_(obj) { return res(obj); }
function error_(msg) { return res({ ok:false, error: msg }); }

/**
 * Global lock wrapper
 */
function withGlobalLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

/**
 * Item-specific lock wrapper
 */
function withItemLock_(itemId, fn) {
  return withGlobalLock_(fn);
}

/**
 * Rate limiter stub
 */
function rateLimit_(key, limit, windowSec) {
  // Implement rate-limiting logic here
  return true;
}

/**
 * Idempotent call wrapper
 */
function idempotent_(key, ttl=30) {
  // Implement idempotent cache here
  return true;
}

/*************************************************
 * SpreadsheetService — Efficient Sheet Operations
 *************************************************/

// In-memory caches
let ssCache = null;
let _itemIndex = null;
let _slugIndex = null;

/**
 * Open or create main spreadsheet
 */
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

/**
 * Extract Spreadsheet ID from URL
 */
function extractSheetId(url) {
  const m = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!m) throw new Error("Invalid Spreadsheet URL");
  return m[1];
}

/**
 * Create a new spreadsheet and save its URL
 */
function createAndSaveSpreadsheet_() {
  const ss = SpreadsheetApp.create("DriveShop Database");
  PROPS.setProperty("SPREADSHEET_URL", ss.getUrl());
  ssCache = ss;
  return ss;
}

/**
 * Get or create a sheet with optional headers
 */
function getSheet(name, headers = []) {
  const ss = getSpreadsheet();
  let sh = ss.getSheetByName(name);

  if (!sh) {
    sh = ss.insertSheet(name);
    if (headers.length) sh.appendRow(headers);
  }
  return sh;
}

/**
 * Batch read all rows
 */
function getAllRows(sheetName) {
  const sh = getSheet(sheetName);
  const data = sh.getDataRange().getValues();
  return data.length > 1 ? data.slice(1) : [];
}

/**
 * Batch write rows with optional headers
 */
function setAllRows(sheetName, rows, headers = []) {
  const sh = getSheet(sheetName, headers);
  sh.clearContents();
  if (headers.length) sh.appendRow(headers);
  if (rows.length) sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

/**
 * Append a single row
 */
function appendRow(sheetName, row) {
  const sh = getSheet(sheetName);
  sh.appendRow(row);
  if (sheetName === CFG.SHEETS.ITEMS) invalidateItemIndex_();
}

/**
 * Build in-memory index of items
 */
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

/**
 * Invalidate cached item index
 */
function invalidateItemIndex_() {
  _itemIndex = null;
  _slugIndex = null;
}

/**
 * Get item by ID or slug
 */
function getItemById(id) {
  buildItemIndex_();
  return _itemIndex[id] || null;
}

function getItemBySlug(slug) {
  buildItemIndex_();
  const id = _slugIndex[slug];
  return id ? _itemIndex[id] : null;
}

/**
 * Get all items as array
 */
function getAllItems() {
  buildItemIndex_();
  return Object.values(_itemIndex);
}

/**
 * Initialize sheets with headers
 */
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

  getSheet(sheets.USERS, [
    "email", "name", "photo", "createdAt", "lastLogin"
  ]);

  getSheet(sheets.ERRORS, [
    "time", "jobId", "itemId", "message", "stack"
  ]);

  getSheet(sheets.CATEGORY_HELPER, ["cat1", "cat2"]).hideSheet();
}

/*************************************************
 * SpreadsheetService Export
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
 * UserService — User Management & Lookup
 *************************************************/

// In-memory cache
let _userCache = null;

/**
 * Build in-memory user cache
 */
function buildUserCache_() {
  if (_userCache) return;

  const users = SpreadsheetService.getAllRows(CFG.SHEETS.USERS);
  const headers = SpreadsheetService.getSheet(CFG.SHEETS.USERS).getDataRange().getValues()[0];

  _userCache = {};
  users.forEach(r => {
    const user = {};
    headers.forEach((h, i) => user[h] = r[i]);
    if (!user.email) return;
    _userCache[user.email] = user;
  });
}

/**
 * Invalidate cache
 */
function invalidateUserCache_() {
  _userCache = null;
}

/**
 * Get user by email
 */
function getUser(email) {
  buildUserCache_();
  return _userCache[email] || null;
}

/**
 * Upsert user (create or update)
 */
function upsertUser(userData) {
  buildUserCache_();
  const existing = _userCache[userData.email];

  const now = new Date().toISOString();
  const user = {
    email: userData.email,
    name: userData.name || existing?.name || "",
    photo: userData.photo || existing?.photo || "",
    createdAt: existing?.createdAt || now,
    lastLogin: now
  };

  _userCache[user.email] = user;

  // Write back to sheet
  const allUsers = Object.values(_userCache).map(u => [
    u.email, u.name, u.photo, u.createdAt, u.lastLogin
  ]);
  SpreadsheetService.setAllRows(CFG.SHEETS.USERS, allUsers, [
    "email", "name", "photo", "createdAt", "lastLogin"
  ]);
}

/**
 * Enrich item events with user info
 */
function enrichEventsWithUsers(events) {
  buildUserCache_();
  return events.map(ev => ({
    ...ev,
    user: _userCache[ev.userEmail] || null
  }));
}

/**
 * Map multiple emails to user data
 */
function mapEmailsToUsers(emails) {
  buildUserCache_();
  return emails.map(email => _userCache[email] || null);
}

/*************************************************
 * UserService Export
 *************************************************/
const UserService = {
  getUser,
  upsertUser,
  enrichEventsWithUsers,
  mapEmailsToUsers,
  invalidateUserCache_
};

/*************************************************
 * EventService — Comments, Likes, Views
 *************************************************/

// Short-term cache for performance
const _eventCacheTTL = 30; // seconds

function buildEventCacheKey_(itemId, type) {
  return `events:${itemId}:${type}`;
}

/**
 * Read all events from sheet
 */
function readAllEvents_() {
  const rows = SpreadsheetService.getAllRows(CFG.SHEETS.EVENTS);
  const headers = SpreadsheetService.getSheet(CFG.SHEETS.EVENTS).getDataRange().getValues()[0];

  return rows.map(r => {
    const ev = {};
    headers.forEach((h, i) => ev[h] = r[i]);
    return ev;
  });
}

/**
 * Write all events to sheet
 */
function writeAllEvents_(events) {
  const headers = [
    "id", "itemId", "type", "value", "pageUrl",
    "userEmail", "createdAt", "updatedAt", "deleted"
  ];
  const rows = events.map(ev => headers.map(h => ev[h] ?? ""));
  SpreadsheetService.setAllRows(CFG.SHEETS.EVENTS, rows, headers);
}

/**
 * List events by itemId and type
 */
function listEvents({ itemId, type }) {
  if (!itemId || !type) return [];
  const cacheKey = buildEventCacheKey_(itemId, type);
  const cached = CacheService.getScriptCache().get(cacheKey);
  if (cached) return JSON.parse(cached);

  const all = readAllEvents_().filter(ev =>
    ev.itemId === itemId && ev.type === type && !ev.deleted
  );

  CacheService.getScriptCache().put(cacheKey, JSON.stringify(all), _eventCacheTTL);
  return all;
}

/**
 * Upsert an event
 * - Unique by (itemId + type + userEmail)
 */
function upsertEvent({ itemId, type, value, pageUrl, userEmail }) {
  return withItemLock_(itemId, () => {
    const events = readAllEvents_();
    const now = new Date().toISOString();
    let found = false;

    events.forEach(ev => {
      if (ev.itemId === itemId && ev.type === type && ev.userEmail === userEmail) {
        ev.value = value;
        ev.pageUrl = pageUrl || ev.pageUrl;
        ev.updatedAt = now;
        ev.createdAt = now; // per requirement
        ev.deleted = false;
        found = true;
      }
    });

    if (!found) {
      events.push({
        id: Utilities.getUuid(),
        itemId,
        type,
        value,
        pageUrl,
        userEmail,
        createdAt: now,
        updatedAt: now,
        deleted: false
      });
    }

    writeAllEvents_(events);
    CacheService.getScriptCache().remove(buildEventCacheKey_(itemId, type));
    CacheService.getScriptCache().remove(`stats:${itemId}`);
  });
}

/**
 * Remove an event (soft delete)
 */
function removeEvent({ itemId, type, userEmail }) {
  return withItemLock_(itemId, () => {
    const events = readAllEvents_();
    let changed = false;
    const now = new Date().toISOString();

    events.forEach(ev => {
      if (ev.itemId === itemId && ev.type === type && ev.userEmail === userEmail) {
        ev.deleted = true;
        ev.updatedAt = now;
        changed = true;
      }
    });

    if (changed) {
      writeAllEvents_(events);
      CacheService.getScriptCache().remove(buildEventCacheKey_(itemId, type));
      CacheService.getScriptCache().remove(`stats:${itemId}`);
    }
  });
}

/**
 * Get stats for a single item (count per type)
 */
function getItemStats(itemId) {
  const cacheKey = `stats:${itemId}`;
  const cached = CacheService.getScriptCache().get(cacheKey);
  if (cached) return JSON.parse(cached);

  const events = readAllEvents_().filter(ev => ev.itemId === itemId && !ev.deleted);
  const stats = {};
  events.forEach(ev => stats[ev.type] = (stats[ev.type] || 0) + 1);

  CacheService.getScriptCache().put(cacheKey, JSON.stringify(stats), _eventCacheTTL);
  return stats;
}

/**
 * Batch stats for multiple items
 */
function getBatchStats(itemIds) {
  const key = "stats:batch:" + itemIds.sort().join(",");
  const cached = CacheService.getScriptCache().get(key);
  if (cached) return JSON.parse(cached);

  const events = readAllEvents_().filter(ev => itemIds.includes(ev.itemId) && !ev.deleted);
  const out = {};

  events.forEach(ev => {
    if (!out[ev.itemId]) out[ev.itemId] = {};
    out[ev.itemId][ev.type] = (out[ev.itemId][ev.type] || 0) + 1;
  });

  CacheService.getScriptCache().put(key, JSON.stringify(out), _eventCacheTTL);
  return out;
}

/**
 * Get all events by user email
 */
function getEventsByUser(email) {
  if (!email) return [];
  return readAllEvents_().filter(ev =>
    ev.userEmail === email && !ev.deleted && ev.itemId && ev.type && ev.createdAt
  );
}

/*************************************************
 * EventService Export
 *************************************************/
const EventService = {
  list: listEvents,
  upsert: upsertEvent,
  remove: removeEvent,
  stats: getItemStats,
  batchStats: getBatchStats,
  getByUser_: getEventsByUser
};


/*************************************************
 * EventService — Comments, Likes, Views
 *************************************************/

// Short-term cache for performance
const _eventCacheTTL = 30; // seconds

function buildEventCacheKey_(itemId, type) {
  return `events:${itemId}:${type}`;
}

/**
 * Read all events from sheet
 */
function readAllEvents_() {
  const rows = SpreadsheetService.getAllRows(CFG.SHEETS.EVENTS);
  const headers = SpreadsheetService.getSheet(CFG.SHEETS.EVENTS).getDataRange().getValues()[0];

  return rows.map(r => {
    const ev = {};
    headers.forEach((h, i) => ev[h] = r[i]);
    return ev;
  });
}

/**
 * Write all events to sheet
 */
function writeAllEvents_(events) {
  const headers = [
    "id", "itemId", "type", "value", "pageUrl",
    "userEmail", "createdAt", "updatedAt", "deleted"
  ];
  const rows = events.map(ev => headers.map(h => ev[h] ?? ""));
  SpreadsheetService.setAllRows(CFG.SHEETS.EVENTS, rows, headers);
}

/**
 * List events by itemId and type
 */
function listEvents({ itemId, type }) {
  if (!itemId || !type) return [];
  const cacheKey = buildEventCacheKey_(itemId, type);
  const cached = CacheService.getScriptCache().get(cacheKey);
  if (cached) return JSON.parse(cached);

  const all = readAllEvents_().filter(ev =>
    ev.itemId === itemId && ev.type === type && !ev.deleted
  );

  CacheService.getScriptCache().put(cacheKey, JSON.stringify(all), _eventCacheTTL);
  return all;
}

/**
 * Upsert an event
 * - Unique by (itemId + type + userEmail)
 */
function upsertEvent({ itemId, type, value, pageUrl, userEmail }) {
  return withItemLock_(itemId, () => {
    const events = readAllEvents_();
    const now = new Date().toISOString();
    let found = false;

    events.forEach(ev => {
      if (ev.itemId === itemId && ev.type === type && ev.userEmail === userEmail) {
        ev.value = value;
        ev.pageUrl = pageUrl || ev.pageUrl;
        ev.updatedAt = now;
        ev.createdAt = now; // per requirement
        ev.deleted = false;
        found = true;
      }
    });

    if (!found) {
      events.push({
        id: Utilities.getUuid(),
        itemId,
        type,
        value,
        pageUrl,
        userEmail,
        createdAt: now,
        updatedAt: now,
        deleted: false
      });
    }

    writeAllEvents_(events);
    CacheService.getScriptCache().remove(buildEventCacheKey_(itemId, type));
    CacheService.getScriptCache().remove(`stats:${itemId}`);
  });
}

/**
 * Remove an event (soft delete)
 */
function removeEvent({ itemId, type, userEmail }) {
  return withItemLock_(itemId, () => {
    const events = readAllEvents_();
    let changed = false;
    const now = new Date().toISOString();

    events.forEach(ev => {
      if (ev.itemId === itemId && ev.type === type && ev.userEmail === userEmail) {
        ev.deleted = true;
        ev.updatedAt = now;
        changed = true;
      }
    });

    if (changed) {
      writeAllEvents_(events);
      CacheService.getScriptCache().remove(buildEventCacheKey_(itemId, type));
      CacheService.getScriptCache().remove(`stats:${itemId}`);
    }
  });
}

/**
 * Get stats for a single item (count per type)
 */
function getItemStats(itemId) {
  const cacheKey = `stats:${itemId}`;
  const cached = CacheService.getScriptCache().get(cacheKey);
  if (cached) return JSON.parse(cached);

  const events = readAllEvents_().filter(ev => ev.itemId === itemId && !ev.deleted);
  const stats = {};
  events.forEach(ev => stats[ev.type] = (stats[ev.type] || 0) + 1);

  CacheService.getScriptCache().put(cacheKey, JSON.stringify(stats), _eventCacheTTL);
  return stats;
}

/**
 * Batch stats for multiple items
 */
function getBatchStats(itemIds) {
  const key = "stats:batch:" + itemIds.sort().join(",");
  const cached = CacheService.getScriptCache().get(key);
  if (cached) return JSON.parse(cached);

  const events = readAllEvents_().filter(ev => itemIds.includes(ev.itemId) && !ev.deleted);
  const out = {};

  events.forEach(ev => {
    if (!out[ev.itemId]) out[ev.itemId] = {};
    out[ev.itemId][ev.type] = (out[ev.itemId][ev.type] || 0) + 1;
  });

  CacheService.getScriptCache().put(key, JSON.stringify(out), _eventCacheTTL);
  return out;
}

/**
 * Get all events by user email
 */
function getEventsByUser(email) {
  if (!email) return [];
  return readAllEvents_().filter(ev =>
    ev.userEmail === email && !ev.deleted && ev.itemId && ev.type && ev.createdAt
  );
}

/*************************************************
 * EventService Export
 *************************************************/
const EventService = {
  list: listEvents,
  upsert: upsertEvent,
  remove: removeEvent,
  stats: getItemStats,
  batchStats: getBatchStats,
  getByUser_: getEventsByUser
};



/*************************************************
 * DriveService — File & Folder Operations
 *************************************************/

/**
 * Get root folder
 */
function getRootFolder_() {
  return DriveApp.getFolderById(CFG.DRIVE.ROOT_FOLDER_ID);
}

/**
 * Create folder under parent (or root)
 */
function createFolder_(name, parentId) {
  const parent = parentId ? DriveApp.getFolderById(parentId) : getRootFolder_();
  return parent.createFolder(name);
}

/**
 * Get folder by name (first match)
 */
function getFolderByName_(name, parentId) {
  const parent = parentId ? DriveApp.getFolderById(parentId) : getRootFolder_();
  const folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : null;
}

/**
 * Get file by ID
 */
function getFileById_(id) {
  return DriveApp.getFileById(id);
}

/**
 * Upload file to folder
 */
function uploadFile_(blob, folderId, fileName) {
  const folder = folderId ? DriveApp.getFolderById(folderId) : getRootFolder_();
  return folder.createFile(blob).setName(fileName);
}

/**
 * Delete file (soft or permanent)
 */
function deleteFile_(fileId) {
  const file = DriveApp.getFileById(fileId);
  file.setTrashed(true);
}

/**
 * Generate public CDN URL (or signed if needed)
 */
function generateCdnUrl_(fileId) {
  const file = DriveApp.getFileById(fileId);
  return `https://drive.google.com/uc?id=${file.getId()}`;
}

/*************************************************
 * SyncService — Sheets ↔ Drive Synchronization
 *************************************************/

/**
 * Sync a single file metadata to sheet
 */
function syncFileToSheet_(fileId) {
  const file = getFileById_(fileId);
  const data = {
    id: file.getId(),
    name: file.getName(),
    url: generateCdnUrl_(fileId),
    createdAt: file.getDateCreated().toISOString(),
    updatedAt: file.getLastUpdated().toISOString()
  };
  SpreadsheetService.upsertRow(CFG.SHEETS.ITEMS, "id", data);
}

/**
 * Sync folder contents to sheet
 */
function syncFolderToSheet_(folderId) {
  const folder = folderId ? DriveApp.getFolderById(folderId) : getRootFolder_();
  const files = folder.getFiles();
  while (files.hasNext()) {
    syncFileToSheet_(files.next().getId());
  }
}

/**
 * Sync categories (folders) to helper sheet
 */
function syncCategories_() {
  const root = getRootFolder_();
  const folders = root.getFolders();
  const cats = [];
  while (folders.hasNext()) {
    cats.push({ name: folders.next().getName() });
  }
  SpreadsheetService.setAllRows(CFG.SHEETS.CATEGORY_HELPER, cats, ["name"]);
}

/*************************************************
 * DriveService Export
 *************************************************/
const DriveService = {
  root: getRootFolder_,
  createFolder: createFolder_,
  getFolderByName: getFolderByName_,
  getFileById: getFileById_,
  uploadFile: uploadFile_,
  deleteFile: deleteFile_,
  cdnUrl: generateCdnUrl_,
  sync: {
    file: syncFileToSheet_,
    folder: syncFolderToSheet_,
    categories: syncCategories_
  }
};

/*************************************************
 * ApiService — Centralized Request Handling
 *************************************************/

/**
 * Main POST router
 */
function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents || "{}");
    const action = req.action;
    const payload = req.payload || {};
    const timestamp = req.timestamp || Date.now();

    // Security check (optional signing)
    SecurityService.validateRequest_(req);

    // Route action
    const result = ApiService.routeAction_(action, payload);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: result
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    logError_(err);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * GET router (optional)
 */
function doGet(e) {
  return ContentService.createTextOutput("DriveShop API is live!");
}

/*************************************************
 * ApiService — Action Routing
 *************************************************/

const ApiService = (() => {
  
  /**
   * Route action to proper handler
   */
  function routeAction_(action, payload) {
    switch (action) {
      case "login":
        return UserService.login_(payload);
      case "upload":
        return DriveService.uploadFile(payload.blob, payload.folderId, payload.fileName);
      case "syncFile":
        return DriveService.sync.file(payload.fileId);
      case "syncFolder":
        return DriveService.sync.folder(payload.folderId);
      case "syncCategories":
        return DriveService.sync.categories();
      case "listEvents":
        return EventService.list_(payload);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  return {
    routeAction_: routeAction_
  };

})();

/*************************************************
 * SecurityService — Request Validation & Signing
 *************************************************/

const SecurityService = (() => {

  /**
   * Validate incoming request
   * - Optional HMAC or API key
   */
  function validateRequest_(req) {
    if (!req) throw new Error("Invalid request payload");

    // Optional: API key check
    if (CFG.API.API_SIGNING_SECRET) {
      const signature = req.signature;
      const expected = computeSignature_(req);
      if (signature !== expected) {
        throw new Error("Invalid request signature");
      }
    }

    return true;
  }

  /**
   * Compute HMAC signature for request
   */
  function computeSignature_(req) {
    const secret = CFG.API.API_SIGNING_SECRET;
    const payload = JSON.stringify(req.payload || {});
    return Utilities.computeHmacSha256Signature(payload, secret)
      .map(b => ('0' + (b & 0xFF).toString(16)).slice(-2))
      .join('');
  }

  /**
   * Optional nonce check to prevent replay
   */
  function assertNonceUnused_(action, nonce) {
    const cache = CacheService.getScriptCache();
    const key = `nonce:${action}:${nonce}`;
    if (cache.get(key)) {
      throw new Error("Replay detected");
    }
    cache.put(key, "1", 60); // 1 min TTL
  }

  return {
    validateRequest_,
    computeSignature_,
    assertNonceUnused_
  };

})();


/*************************************************
 * GAS Router — doPost / API Entrypoint
 *************************************************/

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    const action = body.action;
    const payload = body.payload || {};

    if (!action) return error_("Missing action");

    switch (action) {

      // -------------------- Auth --------------------
      case "login":
        return apiLogin(payload);

      // -------------------- Items --------------------
      case "items:list":
        return handleItemsList_(payload);

      case "item:get":
        return getItemBySlug(payload);

      case "item:stats":
        return getStats(payload);

      case "item:events":
        return getItemEvents(payload);

      case "categories:list":
        return getCategories();

      case "categories:tree":
        return getCategoryTree();

      // -------------------- Events --------------------
      case "event:upsert":
        return handleEventsUpsert_(payload);

      case "event:remove":
        return handleEventsRemove_(payload);

      // -------------------- Users --------------------
      case "user:profile":
        return getUserProfile(payload);

      case "user:resolveHandle":
        return resolveUserHandle(payload);

      // -------------------- Admin / Maintenance --------------------
      case "sync:normalizeAll":
        normalizeAll();
        return ok_({ ok: true });

      case "sync:fullScan":
        fullScan();
        return ok_({ ok: true });

      case "errors:clear":
        clearErrors();
        return ok_({ ok: true });

      default:
        return error_("Unknown action: " + action);
    }

  } catch (err) {
    logError("doPost", "", err);
    return errorRes(err);
  }
}

/*************************************************
 * doGet — Optional GET handler
 *************************************************/
function doGet(e) {
  return res({ ok: true, msg: "DriveShop API is running" });
}

/*************************************************
 * Next.js Revalidation / Misc Helpers
 *************************************************/

/**
 * Trigger revalidation for Next.js pages (ISR)
 * Placeholder: actual HTTP call can be added if using Vercel revalidate API
 */
function revalidateNext(paths = []) {
  paths.forEach(p => {
    logInfo("Revalidate page:", p);
    // Example: UrlFetchApp.fetch(`${NEXT_PUBLIC_URL}/api/revalidate?path=${p}`);
  });
}

/*************************************************
 * CategoryService — Build / Cache Category Tree
 *************************************************/
const CategoryService = (() => {

  const CACHE = CacheService.getScriptCache();
  const CACHE_KEY = "category:tree";
  const TTL = 60 * 5; // 5 minutes

  function getTree(forceRefresh = false) {
    if (!forceRefresh) {
      const cached = CACHE.get(CACHE_KEY);
      if (cached) return JSON.parse(cached);
    }

    const root = getRootFolder();
    const out = {};

    const lvl1 = root.getFolders();
    while (lvl1.hasNext()) {
      const c1 = lvl1.next();
      out[c1.getName()] = [];
      const lvl2 = c1.getFolders();
      while (lvl2.hasNext()) {
        out[c1.getName()].push(lvl2.next().getName());
      }
    }

    CACHE.put(CACHE_KEY, JSON.stringify(out), TTL);
    return out;
  }

  return { getTree };

})();
 
 /*************************************************
 * bootstrap — Initialize Sheets & Sync
 *************************************************/
function bootstrap() {
  try {
    logInfo("Bootstrapping DriveShop GAS...");

    // 1️⃣ Initialize all sheets
    setupSheets_();

    // 2️⃣ Build in-memory caches
    buildItemIndex_();
    UserService.getByEmail(""); // force load cache

    // 3️⃣ Sync category dropdowns
    syncCategoryDropdown();
    syncCategory2Dropdown();

    logInfo("DriveShop bootstrap complete ✅");
  } catch (err) {
    logError("bootstrap", "", err);
  }
}

/*************************************************
 * createSyncTrigger — schedule fullScan periodically
 *************************************************/
function createSyncTrigger() {
  // Remove existing triggers for fullScan to avoid duplicates
  const allTriggers = ScriptApp.getProjectTriggers();
  allTriggers.forEach(t => {
    if (t.getHandlerFunction() === "fullScan") {
      ScriptApp.deleteTrigger(t);
    }
  });

  // Create new time-based trigger every hour
  ScriptApp.newTrigger("fullScan")
    .timeBased()
    .everyHours(1)
    .create();

  logInfo("Time trigger for fullScan created ✅");
}



/*************************************************
 * End of GAS Script
 *************************************************/