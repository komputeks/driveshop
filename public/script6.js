/*************************************************
 * CORE
 *************************************************/

function props_() {
  return PropertiesService.getScriptProperties();
}

function prop_(k) {
  const v = props_().getProperty(k);
  if (!v) throw new Error("Missing prop: " + k);
  return v;
}

function now_() {
  return new Date();
}

function uuid_() {
  return Utilities.getUuid();
}

/*************************************************
 * SPREADSHEET
 *************************************************/

function ss_() {
  const props = props_();
  let url = props.getProperty("SPREADSHEET_URL");

  if (!url) return createAndSaveSheet_();

  try {
    const id = extractSheetId_(url);
    return SpreadsheetApp.openById(id);
  } catch {
    return createAndSaveSheet_();
  }
}

function extractSheetId_(url) {
  const m = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : null;
}

function createAndSaveSheet_() {
  const ss = SpreadsheetApp.create("DriveShop Database");
  props_().setProperty("SPREADSHEET_URL", ss.getUrl());
  return ss;
}

function sheet_(name, cols) {
  let sh = ss_().getSheetByName(name);

  if (!sh) {
    sh = ss_().insertSheet(name);
    if (cols.length) sh.appendRow(cols);
  }

  return sh;
}

/*************************************************
 * SETUP SHEETS (NEW SPREADSHEET)
 *************************************************/

function setup_() {

  sheet_(CFG.ITEMS, [
    "id",
    "name",
    "category",     // category-1
    "category2",    // category-2
    "cdnUrl",
    "width",
    "height",
    "size",
    "description",
    "createdAt",
    "updatedAt",
    "views",
    "likes",
    "comments",
  ]);

  sheet_(CFG.EVENTS, [
    "id",
    "itemId",
    "type",
    "value",
    "pageUrl",
    "userEmail",
    "createdAt",
  ]);

  sheet_(CFG.USERS, [
    "email",
    "name",
    "phone",
    "photo",
    "createdAt",
    "lastLogin",
  ]);

  sheet_(CFG.ERRORS, [
    "time",
    "jobId",
    "itemId",
    "message",
    "stack",
  ]);
}

/*************************************************
 * LOGGING
 *************************************************/

function logErr_(job, item, e) {

  sheet_(CFG.ERRORS, []).appendRow([
    now_(),
    job || "",
    item || "",
    e.message || e,
    e.stack || "",
  ]);

  console.error(e);
}

/*************************************************
 * IMAGE
 *************************************************/

function cdnUrl_(id) {
  return "https://lh3.googleusercontent.com/d/" + id + "=w2000";
}

function imageSize_(file) {

  try {
    const img = file.getBlob().getBytes();
    const info = ImagesService.openImage(img).getSize();

    return {
      w: info.width,
      h: info.height,
    };
  } catch {
    return { w: 0, h: 0 };
  }
}

/*************************************************
 * GEMINI (IMAGE DESCRIPTION)
 *************************************************/

function describeImage_(url) {

  const key = prop_("GEMINI_KEY");

  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=" +
    key;

  const payload = {
    contents: [{
      parts: [
        { text: "Describe this image briefly:" },
        { inlineData: { mimeType: "image/jpeg", data: url } }
      ]
    }]
  };

  try {

    const res = UrlFetchApp.fetch(endpoint, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
    });

    const j = JSON.parse(res.getContentText());

    return j.candidates?.[0]?.content?.parts?.[0]?.text || "";

  } catch {
    return "";
  }
}

/*************************************************
 * DRIVE
 *************************************************/

function rootFolder_() {
  return DriveApp.getFolderById(prop_("AUTO_FOLDER_ID"));
}

function ensureCatFolder_(name) {

  const root = rootFolder_();
  const it = root.getFoldersByName(name);

  if (it.hasNext()) return it.next();

  return root.createFolder(name);
}

function moveToCategory_(file, cat) {

  const folder = ensureCatFolder_(cat);

  const parents = file.getParents();

  while (parents.hasNext()) {

    const p = parents.next();

    if (p.getId() === rootFolder_().getId()) {
      file.moveTo(folder);
      break;
    }
  }
}

function listCategories_() {

  const root = rootFolder_();
  const it = root.getFolders();

  const out = [];

  while (it.hasNext()) {
    out.push(it.next().getName());
  }

  return out;
}

/*************************************************
 * DROPDOWN SYNC
 *************************************************/

function syncCategoryDropdown_() {

  const cats = listCategories_();

  if (!cats.length) return;

  const sh = ss_().getSheetByName(CFG.ITEMS);

  const rule = SpreadsheetApp
    .newDataValidation()
    .requireValueInList(cats, true)
    .build();

  sh.getRange("C2:C").setDataValidation(rule);
}

/*************************************************
 * CATEGORY 2 DROPDOWN (DEPENDENT ON CATEGORY 1)
 *************************************************/

function syncCategory2Dropdown_() {

  const ss = ss_();
  let helper = ss.getSheetByName("_cats");

  if (!helper) {
    helper = ss.insertSheet("_cats");
    helper.hideSheet();
  }

  helper.clear();
  helper.appendRow(["category", "category2"]);

  const root = rootFolder_();
  const lvl1 = root.getFolders();

  while (lvl1.hasNext()) {
    const c1 = lvl1.next();
    const c2it = c1.getFolders();

    while (c2it.hasNext()) {
      helper.appendRow([c1.getName(), c2it.next().getName()]);
    }
  }

  const items = ss.getSheetByName(CFG.ITEMS);
  const lastRow = Math.max(items.getLastRow(), 2);

  const rule = SpreadsheetApp.newDataValidation()
    .requireFormulaSatisfied(
      '=COUNTIF(FILTER(_cats!$B:$B,_cats!$A:$A=$C2),D2)'
    )
    .setAllowInvalid(false)
    .build();

  items.getRange(2, 4, lastRow - 1).setDataValidation(rule);
}

/*************************************************
 * INDEX
 *************************************************/

function index_() {

  const sh = ss_().getSheetByName(CFG.ITEMS);
  const rows = sh.getDataRange().getValues();

  const map = {};

  for (let i = 1; i < rows.length; i++) {
    map[rows[i][0]] = {
      row: i + 1,
      name: rows[i][1],
      cat1: rows[i][2],
      cat2: rows[i][3],
      sig: rows[i][rows[0].length - 1] || ""
    };
  }

  return map;
}

/*************************************************
 * CATEGORY v2 — FILENAME PARSING
 *************************************************/

/**
 * Expected filename:
 *   Category1 Category2 - Actual filename.ext
 *
 * Fallback:
 *   Other / Other
 */
function parseCategoriesFromFilename_(fileName) {

  const dash = fileName.indexOf(" - ");

  if (dash === -1) {
    return {
      cat1: "Other",
      cat2: "Other",
      cleanName: fileName
    };
  }

  const left = fileName.substring(0, dash).trim();
  const right = fileName.substring(dash + 3).trim();

  const parts = left.split(/\s+/);

  if (parts.length < 2) {
    return {
      cat1: "Other",
      cat2: "Other",
      cleanName: fileName
    };
  }

  return {
    cat1: parts[0],
    cat2: parts[1],
    cleanName: right
  };
}

/*************************************************
 * FILE SIGNATURE
 *************************************************/

function fileSig_(file, parentId) {
  return [
    file.getId(),
    file.getLastUpdated().getTime(),
    parentId || ""
  ].join("|");
}

/*************************************************
 * DRIVE — 2 LEVEL CATEGORY FOLDERS
 *************************************************/

function ensureCategory2Folder_(cat1, cat2) {

  const root = rootFolder_();

  const it1 = root.getFoldersByName(cat1);
  const lvl1 = it1.hasNext() ? it1.next() : root.createFolder(cat1);

  const it2 = lvl1.getFoldersByName(cat2);
  return it2.hasNext() ? it2.next() : lvl1.createFolder(cat2);
}

/*************************************************
 * DRIVE — SAFE RENAME
 *************************************************/

function renameFileIfNeeded_(file, cleanName) {
  if (cleanName && file.getName() !== cleanName) {
    file.setName(cleanName);
  }
}


/*************************************************
 * WALK FOLDERS RECURSIVE
 *************************************************/
function walkFolders_(folder, out) {
  const files = folder.getFiles();
  while (files.hasNext()) out.push(files.next());

  const subs = folder.getFolders();
  while (subs.hasNext()) walkFolders_(subs.next(), out);
}

/*************************************************
 * RESOLVE FILE PATH
 *************************************************/
function resolvePath_(file) {
  const parents = file.getParents();
  if (!parents.hasNext()) return { parentId: null };

  const p = parents.next();
  return { parentId: p.getId() };
}

/*************************************************
 * NORMALIZE SINGLE ROW
 *************************************************/
function normalizeRow_(row) {
  const sh = ss_().getSheetByName(CFG.ITEMS);

  const id   = sh.getRange(row, 1).getValue();
  const name = sh.getRange(row, 2).getValue();
  let cat1   = sh.getRange(row, 3).getValue();
  let cat2   = sh.getRange(row, 4).getValue();

  if (!id) return;

  const file = DriveApp.getFileById(id);
  const path = resolvePath_(file);

  // Missing categories → infer from filename
  if (!cat1 || !cat2) {
    const parsed = parseCategoriesFromFilename_(file.getName());
    cat1 = parsed.cat1;
    cat2 = parsed.cat2;
    sh.getRange(row, 3).setValue(cat1);
    sh.getRange(row, 4).setValue(cat2);
  }

  // Force proper folder placement
  const dest = ensureCategory2Folder_(cat1, cat2);
  if (path.parentId !== dest.getId()) {
    file.moveTo(dest);
  }

  // Strip category prefix if legacy name
  renameFileIfNeeded_(file, name);

  // Update signature
  const sig = fileSig_(file, dest.getId());
  sh.getRange(row, sh.getLastColumn()).setValue(sig);
}

/*************************************************
 * NORMALIZE ALL ROWS
 *************************************************/
function normalizeAllRows_() {
  const sh = ss_().getSheetByName(CFG.ITEMS);
  const last = sh.getLastRow();

  for (let r = 2; r <= last; r++) {
    try {
      normalizeRow_(r);
    } catch (e) {
      logErr_("normalize", sh.getRange(r, 1).getValue(), e);
    }
  }
}

/*************************************************
 * FULL SYNC SCAN
 *************************************************/
function scanAll_() {

  try {
    const sh = ss_().getSheetByName(CFG.ITEMS);
    const index = index_();
    const root = rootFolder_();

    const discovered = [];
    walkFolders_(root, discovered);

    const seenIds = new Set();
    const rowsToDelete = [];

    // 🔍 SCAN DRIVE
    discovered.forEach(file => {

      if (!file.getMimeType().startsWith("image/")) return;

      const id = file.getId();
      seenIds.add(id);

      const path = resolvePath_(file);
      const sig = fileSig_(file, path.parentId);
      const row = index[id];

      // -------------------
      // NEW FILE
      // -------------------
      if (!row) {
        const parsed = parseCategoriesFromFilename_(file.getName());

        let cat1 = parsed.cat1;
        let cat2 = parsed.cat2;

        // BAD NAME → move to Other safely
        if (cat1 === "Other") {
          if (path.parentId === root.getId()) {
            file.moveTo(ensureCatFolder_("Other"));
          } else {
            const other2 = ensureCategory2Folder_(path.parentName, "Other2");
            file.moveTo(other2);
            cat1 = path.parentName;
            cat2 = "Other2";
          }
        } else {
          const dest = ensureCategory2Folder_(cat1, cat2);
          file.moveTo(dest);
        }

        renameFileIfNeeded_(file, parsed.cleanName);

        const size = imageSize_(file);
        const cdn = cdnUrl_(id);

        sh.appendRow([
          id,
          parsed.cleanName,
          cat1,
          cat2,
          cdn,
          size.w,
          size.h,
          file.getSize(),
          "",
          file.getDateCreated(),
          now_(),
          0,
          0,
          0,
          sig
        ]);

        return;
      }

      // -------------------
      // EXISTING FILE
      // -------------------
      if (row.sig !== sig) {
        sh.getRange(row.row, sh.getLastColumn()).setValue(sig);
        sh.getRange(row.row, 11).setValue(now_()); // updatedAt
      }

    });

    // 🗑 DELETED FILES → REMOVE ROWS
    Object.keys(index).forEach(id => {
      if (!seenIds.has(id)) {
        rowsToDelete.push(index[id].row);
      }
    });

    rowsToDelete
      .sort((a, b) => b - a)
      .forEach(r => sh.deleteRow(r));

    syncCategoryDropdown_();
    syncCategory2Dropdown_();
    enforceAllInvariants_();

  } catch (e) {
    logErr_("scan", "", e);
  }
}



/*************************************************
 * EVENTS
 *************************************************/

function logEvent_(itemId, type, value, pageUrl, userEmail) {

  sheet_(CFG.EVENTS, []).appendRow([
    uuid_(),
    itemId,
    type,
    value || "",
    pageUrl || "",
    userEmail || "",
    now_(),
  ]);
}

/*************************************************
 * USER TRACKING
 *************************************************/

function touchUser_(email, name, photo) {

  if (!email) return;

  const sh = ss_().getSheetByName(CFG.USERS);
  const rows = sh.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {

    if (rows[i][0] === email) {

      sh.getRange(i + 1, 6).setValue(now_()); // lastLogin
      return;
    }
  }

  sh.appendRow([
    email,
    name || "",
    "",
    photo || "",
    now_(),
    now_(),
  ]);
}

/*************************************************
 * COUNTERS
 *************************************************/

function incCounter_(row, col) {

  const sh = ss_().getSheetByName(CFG.ITEMS);

  const cell = sh.getRange(row, col);
  const v = Number(cell.getValue()) || 0;

  cell.setValue(v + 1);
}

/*************************************************
 * SHEET → DRIVE SYNC (ON EDIT)
 *************************************************/

function onEdit(e) {

  try {

    const r = e.range;
    const sh = r.getSheet();

    if (sh.getName() !== CFG.ITEMS) return;
    if (r.getRow() === 1) return;

    const row = r.getRow();
    const col = r.getColumn();

    const id = sh.getRange(row, 1).getValue();

    if (!id) return;

    const file = DriveApp.getFileById(id);

    // Category 1 or 2 edited
    if (col === 3 || col === 4) {

      const cat1 = sh.getRange(row, 3).getValue();
      const cat2 = sh.getRange(row, 4).getValue();

      if (!cat1 || !cat2) return;

      const dest = ensureCategory2Folder_(cat1, cat2);
      file.moveTo(dest);

      const sig = fileSig_(file, dest.getId());
      sh.getRange(row, sh.getLastColumn()).setValue(sig);
    }

    // Name edited
    if (col === 2) {

      const name = sh.getRange(row, 2).getValue();
      renameFileIfNeeded_(file, name);

      const sig = fileSig_(file, resolvePath_(file).parentId);
      sh.getRange(row, sh.getLastColumn()).setValue(sig);
    }

    // Update timestamp
    sh.getRange(row, 11).setValue(now_());

  } catch (e) {
    logErr_("onEdit", "", e);
  }
}


/*************************************************
 * API — HTTP ENTRYPOINT
 *************************************************/

function doGet(e) {

  try {

    const p = e.parameter || {};
    const action = p.action || "";

    switch (action) {

      case "items":
        return apiGetItems_(p);

      case "item":
        return apiGetItem_(p);

      case "categories":
        return apiGetCategories_();

      case "stats":
        return apiGetStats_(p);

      default:
        return apiPing_();
    }

  } catch (e) {
    return apiError_(e);
  }
}

function doPost(e) {

  try {

    const data = JSON.parse(e.postData.contents || "{}");
    const action = data.action || "";

    switch (action) {

      case "view":
        return apiLogView_(data);

      case "like":
        return apiLogLike_(data);

      case "comment":
        return apiAddComment_(data);

      case "login":
        return apiLogin_(data);

      default:
        return apiError_("Unknown action");
    }

  } catch (e) {
    return apiError_(e);
  }
}

/*************************************************
 * API HELPERS
 *************************************************/

function apiRes_(obj) {

  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function apiError_(e) {

  return apiRes_({
    ok: false,
    error: e.message || e
  });
}

function apiPing_() {

  return apiRes_({
    ok: true,
    time: now_()
  });
}

/*************************************************
 * API — READ
 *************************************************/

function apiGetItems_(p) {

  const sh = ss_().getSheetByName(CFG.ITEMS);
  const rows = sh.getDataRange().getValues();

  const out = [];

  const q = (p.q || "").toLowerCase();
  const cat = p.category || "";

  for (let i = 1; i < rows.length; i++) {

    const r = rows[i];

    if (cat && r[2] !== cat) continue;

    if (q && !r[1].toLowerCase().includes(q)) continue;

    out.push({
      id: r[0],
      name: r[1],
      cat1: r[2],
      cat2: r[3],
      cdn: r[4],
      w: r[5],
      h: r[6],
      size: r[7],
      desc: r[8],
      created: r[9],
      updated: r[10],
      views: r[11],
      likes: r[12],
      comments: r[13],
    });
  }

  return apiRes_({ ok: true, items: out });
}

function apiGetItem_(p) {

  const id = p.id;
  if (!id) return apiError_("Missing id");

  const sh = ss_().getSheetByName(CFG.ITEMS);
  const rows = sh.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {

    const r = rows[i];

    if (r[0] === id) {

      return apiRes_({
        ok: true,
        item: {
          id: r[0],
          name: r[1],
          cat1: r[2],
          cat2: r[3],
          cdn: r[4],
          w: r[5],
          h: r[6],
          size: r[7],
          desc: r[8],
          created: r[9],
          updated: r[10],
          views: r[11],
          likes: r[12],
          comments: r[13],
        }
      });
    }
  }

  return apiError_("Not found");
}

function apiGetCategories_() {

  const cats = listCategories_();

  return apiRes_({
    ok: true,
    categories: cats
  });
}

function apiGetStats_(p) {

  const id = p.id;
  if (!id) return apiError_("Missing id");

  const sh = ss_().getSheetByName(CFG.ITEMS);
  const rows = sh.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {

    if (rows[i][0] === id) {

      return apiRes_({
        ok: true,
        stats: {
          views: rows[i][11],
          likes: rows[i][12],
          comments: rows[i][13],
        }
      });
    }
  }

  return apiError_("Not found");
}

/*************************************************
 * API — WRITE
 *************************************************/

function apiLogView_(d) {

  const id = d.id;
  if (!id) return apiError_("Missing id");

  const sh = ss_().getSheetByName(CFG.ITEMS);
  const rows = sh.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {

    if (rows[i][0] === id) {

      incCounter_(i + 1, 12);
      logEvent_(id, "view", 1, d.pageUrl, d.email);

      return apiRes_({ ok: true });
    }
  }

  return apiError_("Not found");
}

function apiLogLike_(d) {

  const id = d.id;
  if (!id) return apiError_("Missing id");

  const sh = ss_().getSheetByName(CFG.ITEMS);
  const rows = sh.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {

    if (rows[i][0] === id) {

      incCounter_(i + 1, 13);
      logEvent_(id, "like", 1, d.pageUrl, d.email);

      return apiRes_({ ok: true });
    }
  }

  return apiError_("Not found");
}

function apiAddComment_(d) {

  const id = d.id;
  if (!id) return apiError_("Missing id");

  logEvent_(id, "comment", d.text, d.pageUrl, d.email);

  const sh = ss_().getSheetByName(CFG.ITEMS);
  const rows = sh.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {

    if (rows[i][0] === id) {

      incCounter_(i + 1, 14);

      return apiRes_({ ok: true });
    }
  }

  return apiError_("Not found");
}

function apiLogin_(d) {

  touchUser_(d.email, d.name, d.photo);

  return apiRes_({ ok: true });
}


/*************************************************
 * CONFIG
 *************************************************/

const CFG = {

  ITEMS: "items",
  EVENTS: "events",
  USERS: "users",
  ERRORS: "errors",

};

/*************************************************
 * MENUS
 *************************************************/

function onOpen() {

  SpreadsheetApp.getUi()
    .createMenu("DriveShop")
    .addItem("Initial Setup", "init_")
    .addItem("Full Scan / Sync", "scanAll_")
    .addItem("Normalize All", "normalizeAllRows_")
    .addItem("Sync Categories", "syncCategoryDropdown_")
    .addItem("Sync Category2", "syncCategory2Dropdown_")
    .addItem("Reinstall Triggers", "installTriggers_")
    .addSeparator()
    .addItem("Clear Errors", "clearErrors_")
    .addToUi();
}

/*************************************************
 * INSTALLERS
 *************************************************/

function installTriggers_() {

  // Remove old
  ScriptApp.getProjectTriggers().forEach(t => {
    ScriptApp.deleteTrigger(t);
  });

  // On edit
  ScriptApp.newTrigger("onEdit")
    .forSpreadsheet(ss_())
    .onEdit()
    .create();

  // Nightly scan
  ScriptApp.newTrigger("scanAll_")
    .timeBased()
    .everyDays(1)
    .atHour(3)
    .create();
}

/*************************************************
 * BOOTSTRAP
 *************************************************/

function init_() {

  setup_();

  syncCategoryDropdown_();
  syncCategory2Dropdown_();

  installTriggers_();

  SpreadsheetApp.getUi()
    .alert("DriveShop initialized successfully.");
}

/*************************************************
 * MAINTENANCE
 *************************************************/

function clearErrors_() {

  const sh = ss_().getSheetByName(CFG.ERRORS);

  if (sh) {
    sh.clearContents();
    sh.appendRow(["time", "jobId", "itemId", "message", "stack"]);
  }
}


