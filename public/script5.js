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
    sh.appendRow(cols);
  }

  return sh;
}

function setup_() {

  sheet_(CFG.ITEMS, [
  "id",
  "name",
  "category",     // category-1 (UNCHANGED)
  "category2",    // category-2 (NEW)
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

function ensureCategory2Column_() {
  const sh = ss_().getSheetByName(CFG.ITEMS);
  if (!sh) return;

  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];

  if (!headers.includes("category2")) {
    sh.insertColumnAfter(3);
    sh.getRange(1, 4).setValue("category2");
  }
}

function ensureSigColumn_() {
  const sh = ss_().getSheetByName(CFG.ITEMS);
  if (!sh) return;

  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];

  if (!headers.includes("_lastSig")) {
    sh.insertColumnAfter(sh.getLastColumn());
    sh.getRange(1, sh.getLastColumn()).setValue("_lastSig");
  }
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
 * GEMINI
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
 * DROPDOWN
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

function fileSig_(file, parentId) {
  return [
    file.getId(),
    file.getLastUpdated().getTime(),
    parentId || ""
  ].join("|");
}



/***********************************
 * DRIVE — 2 LEVEL CATEGORY FOLDERS
 **********************************/

function ensureCategory2Folder_(cat1, cat2) {

  const root = rootFolder_();

  const it1 = root.getFoldersByName(cat1);
  const lvl1 = it1.hasNext() ? it1.next() : root.createFolder(cat1);

  const it2 = lvl1.getFoldersByName(cat2);
  return it2.hasNext() ? it2.next() : lvl1.createFolder(cat2);
}

/**********************
 * DRIVE — SAFE RENAME
 *********************/

function renameFileIfNeeded_(file, cleanName) {
  if (cleanName && file.getName() !== cleanName) {
    file.setName(cleanName);
  }
}

/*************************************************
 * FILE HASH / SIGNATURE
 *************************************************/
function fileSig_(file, parentId) {
  return Utilities.computeDigest(
    Utilities.DigestAlgorithm.MD5,
    file.getName() + file.getLastUpdated().getTime() + (parentId || "")
  ).map(b => ("0" + (b & 0xFF).toString(16)).slice(-2)).join("");
}

function resolvePath_(file) {
  const parents = file.getParents();
  return parents.hasNext() ? { parentId: parents.next().getId() } : { parentId: null };
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
 * SAFE MOVE TO OTHER FOLDER
 *************************************************/
function moveToOther_(file, parentFolderId) {
  const root = rootFolder_();
  const parentFolder = parentFolderId ? DriveApp.getFolderById(parentFolderId) : root;
  const otherFolder = ensureCatFolder_("Other"); // root/Other
  file.moveTo(otherFolder);
}


/*************************************************
 * SHEET → DRIVE SYNC (CATEGORY / RENAME)
 *************************************************/
function onEditRename_(e) {
  const sh = e.range.getSheet();
  if (sh.getName() !== CFG.ITEMS || e.range.getColumn() !== 2 || e.range.getRow() < 2) return;

  const row = e.range.getRow();
  const id = sh.getRange(row, 1).getValue();
  const newName = e.value;
  if (!id || !newName) return;

  try {
    const file = DriveApp.getFileById(id);
    if (file.getName() !== newName) file.setName(newName);
  } catch (err) {
    logErr_("rename-edit", id, err);
  }
}

function onEditCategory2_(e) {
  const sh = e.range.getSheet();
  if (sh.getName() !== CFG.ITEMS || e.range.getColumn() !== 4 || e.range.getRow() < 2) return;

  const row = e.range.getRow();
  const id = sh.getRange(row, 1).getValue();
  const cat1 = sh.getRange(row, 3).getValue();
  const cat2 = e.value;
  if (!id || !cat1 || !cat2) return;

  try {
    const file = DriveApp.getFileById(id);
    const folder = ensureCategory2Folder_(cat1, cat2);
    file.moveTo(folder);
  } catch (err) {
    logErr_("cat2-edit", id, err);
  }
}

/*************************************************
 * LEGACY NORMALIZATION (SAFE)
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
 * MOVE FILES WITH BAD NAMES TO OTHER
 *************************************************/
function enforceOtherFolders_() {
  const root = rootFolder_();
  const allFiles = [];
  walkFolders_(root, allFiles);

  allFiles.forEach(file => {
    const parsed = parseCategoriesFromFilename_(file.getName());
    if (parsed.cat1 === "Other" && parsed.cat2 === "Other") {
      moveToOther_(file, resolvePath_(file).parentId);
    }
  });
}

/********************************************
 * FILE WALK + SIGNATURE
 ********************************************/

// Recursively walk all folders under root and collect files
function walkFolders_(folder, collected) {
  const files = folder.getFiles();
  while (files.hasNext()) collected.push(files.next());

  const subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    walkFolders_(subfolders.next(), collected);
  }
}

// Resolve file path (folder names) for reference
function resolvePath_(file) {
  const parents = file.getParents();
  if (!parents.hasNext()) return { parentId: null, path: "/" };

  const parent = parents.next();
  return {
    parentId: parent.getId(),
    path: "/" + parent.getName(),
  };
}

// Compute a "file signature" based on modified time + folder
function fileSig_(file, parentId) {
  return Utilities.base64Encode(
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.MD5,
      file.getId() + file.getLastUpdated().getTime() + (parentId || "")
    )
  );
}

/*************************************************
 * FILE WALK + SIGNATURE HELPERS
 *************************************************/

function walkFolders_(folder, out) {
  const files = folder.getFiles();
  while (files.hasNext()) out.push(files.next());

  const subs = folder.getFolders();
  while (subs.hasNext()) walkFolders_(subs.next(), out);
}

function resolvePath_(file) {
  const parents = file.getParents();
  if (!parents.hasNext()) return { parentId: "", parentName: "" };

  const p = parents.next();
  return { parentId: p.getId(), parentName: p.getName() };
}

function fileSig_(file, parentId) {
  return [
    file.getId(),
    file.getLastUpdated().getTime(),
    parentId
  ].join("|");
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
    lockCategoryColumn_();
    syncCategoryRenames_();
    revalidate_();

  } catch (e) {
    logErr_("scan", "", e);
  }
}


/**********
 * EVENTS
 **********/

function addEvent_(itemId, type, val, page, email) {

  sheet_(CFG.EVENTS, []).appendRow([
    uuid_(),
    itemId,
    type,
    val || "",
    page || "",
    email || "",
    now_(),
  ]);

  bumpStats_(itemId, type);
}

function bumpStats_(id, type) {

  const sh = ss_().getSheetByName(CFG.ITEMS);
  const r = sh.getDataRange().getValues();

  for (let i = 1; i < r.length; i++) {

    if (r[i][0] === id) {

      const col =
        type === "view" ? 11 :
        type === "like" ? 12 : 13;

      const cell = sh.getRange(i + 1, col);

      cell.setValue((cell.getValue() || 0) + 1);

      return;
    }
  }
}


/*******
 * API
 *******/

function doPost(e) {
  try {
    const b = JSON.parse(e.postData.contents || "{}");
    const p = e.parameter.path || "";

    // Always ensure user if present
    const user = ensureUser_(b.user || {
      email: b.email,
      name: b.name,
      photo: b.photo,
    });

    if (user) {
      b.__user = user;
    }
    
    if (p === "items") {
      return getItems_(e);
    }

    if (p === "event") {
      addEvent_(
        b.itemId,
        b.type,
        b.value,
        b.page,
        b.email || b.__user?.email || ""
      );
      return ok_();
    }

    if (p === "event/batch") {
      if (!Array.isArray(b.items)) {
        return err_("Bad batch");
      }
        b.items.forEach(ev => {
          addEvent_(
            ev.itemId,
            ev.type,
            ev.value,
            ev.page,
            ev.email || b.__user?.email || ""
          );
      });

      return ok_();
    }

    if (p === "user") {
      const email = b.email;
      const name = b.name;
      const photo = b.photo || b.image || "";
      upsertUser_(email, name, photo);
      return ok_();
    }

    if (p === "user/update") {
      return updateUser_(b);
    }

    if (p === "user/get") {
      return getUser_(b.email);
    }

    if (p === "user/activity") {
      return getUserActivity_(b.email);
    }

    return err_("404");

  } catch (e) {
    logErr_("api", "", e);
    return err_(e.message);
  }
}

/******************
 * RESPONSE HELPERS
 *******************/
function json_(obj) {
  const out = ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);

}

function ok_() {
  return json_({ ok: true });
}

function err_(msg) {
  return json_({
    ok: false,
    error: msg
  });
}

/***************************
 * GET HANDLER (PUBLIC API)
 ***************************/

function doGet(e) {

  try {

    const p = e.parameter.path || "";

    // Homepage / search / category
    if (p === "items") {
      return getItems_(e);
    }
    if (p === "user") {
      return getUser_(e.parameter.email);
    }

    // Health check
    if (p === "ping") {
      return json_({
        ok: true,
        time: now_()
      });
    }

    return err_("Not found");

  } catch (e) {

    logErr_("get", "", e);

    return err_(e.message || "Server error");

  }
}


function json_(obj) {
  const out = ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);

  return cors_(out);
}


/********
 * ITEMS
 ********/

function getItems_(e) {

  const q = e.parameter.q || "";
  const cat = e.parameter.cat || "";

  const sh = ss_().getSheetByName(CFG.ITEMS);
  const rows = sh.getDataRange().getValues();

  const out = [];

  for (let i = 1; i < rows.length; i++) {

    const r = rows[i];

    const item = {
      id: r[0],
      name: r[1],
      category: r[2],
      cdnUrl: r[3],
      width: r[4],
      height: r[5],
      size: r[6],
      description: r[7],
      createdAt: r[8],
      updatedAt: r[9],
      views: r[10],
      likes: r[11],
      comments: r[12],
    };

    // Search filter
    if (q && !item.name.toLowerCase().includes(q.toLowerCase())) {
      continue;
    }

    // Category filter
    if (cat && item.category !== cat) {
      continue;
    }

    out.push(item);
  }

  return json_({
    items: out
  });
}


/**********
 * USERS
 **********/
function ensureUser_(profile) {
  if (!profile || !profile.email) return null;

  const sh = sheet_(CFG.USERS, ["email","name","phone","photo","createdAt","lastLogin"]);
  const rows = sh.getDataRange().getValues();

  const email = String(profile.email).toLowerCase().trim();
  if (!email.includes("@")) return null;

  const avatar = profile.photo || "https://www.gravatar.com/avatar/?d=mp&s=200";

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === email) {
      // update
      sh.getRange(i+1,2).setValue(profile.name || rows[i][1]);
      sh.getRange(i+1,4).setValue(avatar);
      sh.getRange(i+1,6).setValue(now_());
      return { email, name: profile.name, phone: rows[i][2], photo: avatar };
    }
  }

  // new user
  sh.appendRow([email, profile.name||"", "", avatar, now_(), now_()]);
  return { email, name: profile.name, phone: "", photo: avatar };
}




function getUser_(email) {
  if (!email) return err_("Missing email");

  const sh = sheet_(CFG.USERS, []);
  const rows = sh.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === email) {
      return json_({
        ok: true,
        user: {
          email: rows[i][0],
          name: rows[i][1],
          phone: rows[i][2],
          photo: rows[i][3],
          createdAt: rows[i][4],
          lastLogin: rows[i][5],
        }
      });
    }
  }

  return err_("User not found");
}




function getUserActivity_(email) {
  if (!email) return err_("Missing email");

  const sh = sheet_(CFG.EVENTS, []);
  const rows = sh.getDataRange().getValues();

  const out = [];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][5] === email) {
      out.push({
        id: rows[i][0],
        itemId: rows[i][1],
        type: rows[i][2],
        value: rows[i][3],
        pageUrl: rows[i][4],
        createdAt: rows[i][6],
      });
    }
  }

  return json_({
    ok: true,
    items: out
  });
}



function updateUser_(data) {
  if (!data || !data.email) {
    return err_("Missing email");
  }

  const sh = sheet_(CFG.USERS, []);
  const rows = sh.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.email) {

      if (data.name !== undefined) {
        sh.getRange(i + 1, 2).setValue(data.name);
      }

      if (data.phone !== undefined) {
        sh.getRange(i + 1, 3).setValue(data.phone);
      }

      sh.getRange(i + 1, 6).setValue(now_());

      return json_({
        ok: true
      });
    }
  }

  return err_("User not found");
}



function upsertUser_(email, name, photo) {
  if (!email) {
    throw new Error("Missing email");
  }

  const sh = sheet_(CFG.USERS, [
    "email",
    "name",
    "phone",
    "photo",
    "createdAt",
    "lastLogin",
  ]);

  const rows = sh.getDataRange().getValues();

  const cleanEmail = String(email).toLowerCase().trim();
  const avatar =
    photo || "https://www.gravatar.com/avatar/?d=mp&s=200";

  // Update if exists
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === cleanEmail) {
      sh.getRange(i + 1, 2).setValue(name || rows[i][1]);
      sh.getRange(i + 1, 4).setValue(avatar);
      sh.getRange(i + 1, 6).setValue(now_());
      return;
    }
  }

  // Insert new
  sh.appendRow([
    cleanEmail,
    name || "",
    "",
    avatar,
    now_(),
    now_(),
  ]);
}


/*******
 * ISR
 *******/

function revalidate_() {

  try {

    UrlFetchApp.fetch(prop_("NEXTJS_ISR_ENDPOINT"), {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        secret: prop_("NEXTJS_ISR_SECRET"),
      }),
    });

  } catch (e) {

    logErr_("isr", "", e);
  }
}

/***********
 * SECURITY
 ***********/

function verifySig_(e, body) {

  const ts = e.parameter.ts || e.headers["x-ts"];
  const sig = e.parameter.sig || e.headers["x-sig"];

  if (!ts || !sig) throw new Error("Missing signature");

  const now = Date.now();

  if (Math.abs(now - Number(ts)) > 300000)
    throw new Error("Expired");

  const secret = prop_("API_SIGNING_SECRET");

  const base = ts + JSON.stringify(body || {});

  const calc =
    Utilities.computeHmacSha256Signature(base, secret);

  const hash = calc
    .map(b => ("0" + (b & 255).toString(16)).slice(-2))
    .join("");

  if (hash !== sig) throw new Error("Bad signature");
}






/****************
 * SHEET → DRIVE
 *****************/
function onEdit(e) {

  if (!e || !e.range) return;

  try {
    onEditRename_(e);
    onEditCategory2_(e);
    onEditCategory1_(e);
  } catch (err) {
    logErr_("onEdit", "", err);
  }
}


function onEditCategory1_(e) {

  const sh = e.range.getSheet();
  if (sh.getName() !== CFG.ITEMS) return;
  if (e.range.getColumn() !== 3) return;

  const row = e.range.getRow();
  if (row < 2) return;

  const id   = sh.getRange(row, 1).getValue();
  const cat1 = e.value;
  const cat2 = sh.getRange(row, 4).getValue() || "Other";

  if (!id || !cat1) return;

  try {
    const file = DriveApp.getFileById(id);
    const dest = ensureCategory2Folder_(cat1, cat2);
    file.moveTo(dest);

    // Update signature
    const sig = fileSig_(file, dest.getId());
    sh.getRange(row, sh.getLastColumn()).setValue(sig);

  } catch (err) {
    logErr_("cat1-edit", id, err);
  }
}

/******************************
 * SHEET → DRIVE (RENAME SYNC 
 ******************************/

function onEditRename_(e) {

  const sh = e.range.getSheet();

  if (sh.getName() !== CFG.ITEMS) return;
  if (e.range.getColumn() !== 2) return; // name column

  const row = e.range.getRow();
  if (row < 2) return;

  const id = sh.getRange(row, 1).getValue();
  const newName = e.value;

  if (!id || !newName) return;

  try {

    const file = DriveApp.getFileById(id);

    if (file.getName() !== newName) {
      file.setName(newName);
    }

  } catch (err) {
    logErr_("rename-edit", id, err);
  }
}


/****************************
 * SHEET → DRIVE (CATEGORY 2 
 ****************************/

function onEditCategory2_(e) {

  const sh = e.range.getSheet();

  if (sh.getName() !== CFG.ITEMS) return;
  if (e.range.getColumn() !== 4) return; // category2 column

  const row = e.range.getRow();
  if (row < 2) return;

  const id = sh.getRange(row, 1).getValue();
  const cat1 = sh.getRange(row, 3).getValue();
  const cat2 = e.value;

  if (!id || !cat1 || !cat2) return;

  try {

    const file = DriveApp.getFileById(id);
    const folder = ensureCategory2Folder_(cat1, cat2);

    file.moveTo(folder);

  } catch (err) {
    logErr_("cat2-edit", id, err);
  }
}




function resolvePath_(file) {

  const parents = file.getParents();
  if (!parents.hasNext()) return {};

  const p = parents.next();
  const root = rootFolder_();

  // ROOT/file.ext
  if (p.getId() === root.getId()) {
    return { cat1: "", cat2: "", parentId: root.getId() };
  }

  const gpIt = p.getParents();
  if (!gpIt.hasNext()) {
    return { cat1: "", cat2: "", parentId: p.getId() };
  }

  const gp = gpIt.next();

  // ROOT/Cat1/file.ext
  if (gp.getId() === root.getId()) {
    return {
      cat1: p.getName(),
      cat2: "",
      parentId: p.getId()
    };
  }

  // ROOT/Cat1/Cat2/file.ext
  if (gp.getParents().hasNext() &&
      gp.getParents().next().getId() === root.getId()) {
    return {
      cat1: gp.getName(),
      cat2: p.getName(),
      parentId: p.getId()
    };
  }

  return {};
}





function walkFolders_(folder, out) {

  const files = folder.getFiles();
  while (files.hasNext()) {
    out.push(files.next());
  }

  const folders = folder.getFolders();
  while (folders.hasNext()) {
    walkFolders_(folders.next(), out);
  }
}


/*************************************************
 * INVARIANT ENFORCEMENT (DRIVE → SHEET AUTHORITY)
 *************************************************/

function enforceInvariantsForFile_(file) {

  const sh = ss_().getSheetByName(CFG.ITEMS);
  const index = index_();
  const id = file.getId();

  const row = index[id];
  if (!row) return; // not indexed yet

  const sheetCat1 = sh.getRange(row.row, 3).getValue();
  const sheetCat2 = sh.getRange(row.row, 4).getValue();

  const path = resolvePath_(file);

  // 🔹 Rule: no files directly under root
  if (path.parentId === rootFolder_().getId()) {
    const dest = ensureCategory2Folder_(sheetCat1 || "Other", sheetCat2 || "Other2");
    file.moveTo(dest);
    return;
  }

  // 🔹 Rule: no files under root/category1
  const cat1Folder = rootFolder_().getFoldersByName(sheetCat1);
  if (cat1Folder.hasNext() && path.parentId === cat1Folder.next().getId()) {
    const dest = ensureCategory2Folder_(sheetCat1, sheetCat2 || "Other2");
    file.moveTo(dest);
    return;
  }

  // 🔹 Rule: must match sheet category path
  const expected = ensureCategory2Folder_(sheetCat1, sheetCat2);
  if (path.parentId !== expected.getId()) {
    file.moveTo(expected);
  }
}


function enforceAllInvariants_() {

  const root = rootFolder_();
  const files = [];
  walkFolders_(root, files);

  files.forEach(file => {
    try {
      if (!file.getMimeType().startsWith("image/")) return;
      enforceInvariantsForFile_(file);
    } catch (e) {
      logErr_("enforce", file.getId(), e);
    }
  });
}



function forceOtherIfBadName_(file) {

  const parsed = parseCategoriesFromFilename_(file.getName());
  if (parsed.cat1 !== "Other") return;

  const path = resolvePath_(file);

  if (path.parentId === rootFolder_().getId()) {
    file.moveTo(ensureCatFolder_("Other"));
    return;
  }

  const other2 = ensureCategory2Folder_(path.parentName, "Other2");
  file.moveTo(other2);
}



/************************************************
 * - Lock Category column (read-only for humans)
 * - Propagate Drive folder renames → Sheet categories
 ******************************************************/

/**
 * Lock the Category column so only the script can modify it
 */
function lockCategoryColumn_() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const categoryCol = headers.indexOf('category') + 1;
  if (categoryCol === 0) return;

  const protections = sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
  const alreadyProtected = protections.some(p =>
    p.getRange().getColumn() === categoryCol
  );
  if (alreadyProtected) return;

  const range = sheet.getRange(2, categoryCol, sheet.getMaxRows());
  const protection = range.protect().setDescription('Lock Category Column');

  protection.removeEditors(protection.getEditors());
  protection.setWarningOnly(false);
}

/**
 * Build a map of folderId → folderName
 */
function buildFolderMap_(rootFolder) {
  const map = {};
  (function walk(folder) {
    map[folder.getId()] = folder.getName();
    const subs = folder.getFolders();
    while (subs.hasNext()) walk(subs.next());
  })(rootFolder);
  return map;
}

/**
 * Update sheet categories if Drive folders were renamed
 */
function syncCategoryRenames_() {
  const root = getOrCreateFolder_(ROOT_FOLDER_NAME);
  const folderMap = buildFolderMap_(root);

  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('fileId');
  const catCol = headers.indexOf('category');

  if (idCol === -1 || catCol === -1) return;

  let changed = false;

  for (let i = 1; i < data.length; i++) {
    const fileId = data[i][idCol];
    if (!fileId) continue;

    let file;
    try {
      file = DriveApp.getFileById(fileId);
    } catch (e) {
      continue; // deleted files handled elsewhere
    }

    const parents = file.getParents();
    if (!parents.hasNext()) continue;

    const folder = parents.next();
    const realCategory = folderMap[folder.getId()];
    if (!realCategory) continue;

    if (data[i][catCol] !== realCategory) {
      sheet.getRange(i + 1, catCol).setValue(realCategory);
      changed = true;
    }
  }

  if (changed) {
    Logger.log('Category rename propagation applied');
  }
}


/**************
 * BOOTSTRAP
 **************/

function bootstrap() {

  setup_();
  
  ensureCategory2Column_();

  syncCategoryDropdown_();
  
  syncCategory2Dropdown_();

  scanAll_();
  
  normalizeAllRows_();

  // Clear old triggers
  ScriptApp.getProjectTriggers().forEach(t => {
    ScriptApp.deleteTrigger(t);
  });

  // Near realtime scan
  ScriptApp.newTrigger("scanAll_")
    .timeBased()
    .everyMinutes(5)
    .create();

}



function testRevalidate() {
  const url = PropertiesService.getScriptProperties()
    .getProperty("NEXTJS_ISR_ENDPOINT");

  const secret = PropertiesService.getScriptProperties()
    .getProperty("NEXTJS_ISR_SECRET");

  const res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ secret }),
  });

  Logger.log(res.getContentText());
}


/*******
 * API
 *******/

function doPost(e) {
  try {
    const b = JSON.parse(e.postData.contents || "{}");
    const p = e.parameter.path || "";

    // Always ensure user if present
    const user = ensureUser_(b.user || {
      email: b.email,
      name: b.name,
      photo: b.photo,
    });

    if (user) {
      b.__user = user;
    }
    
    if (p === "items") {
      return getItems_(e);
    }

    if (p === "event") {
      addEvent_(
        b.itemId,
        b.type,
        b.value,
        b.page,
        b.email || b.__user?.email || ""
      );
      return ok_();
    }

    if (p === "event/batch") {
      if (!Array.isArray(b.items)) {
        return err_("Bad batch");
      }
        b.items.forEach(ev => {
          addEvent_(
            ev.itemId,
            ev.type,
            ev.value,
            ev.page,
            ev.email || b.__user?.email || ""
          );
      });

      return ok_();
    }

    if (p === "user") {
      const email = b.email;
      const name = b.name;
      const photo = b.photo || b.image || "";
      upsertUser_(email, name, photo);
      return ok_();
    }

    if (p === "user/update") {
      return updateUser_(b);
    }

    if (p === "user/get") {
      return getUser_(b.email);
    }

    if (p === "user/activity") {
      return getUserActivity_(b.email);
    }

    return err_("404");

  } catch (e) {
    logErr_("api", "", e);
    return err_(e.message);
  }
}




/******************
 * RESPONSE HELPERS
 *******************/
function json_(obj) {
  const out = ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);

}

function ok_() {
  return json_({ ok: true });
}

function err_(msg) {
  return json_({
    ok: false,
    error: msg
  });
}


/***************************
 * GET HANDLER (PUBLIC API)
 ***************************/

function doGet(e) {

  try {

    const p = e.parameter.path || "";

    // Homepage / search / category
    if (p === "items") {
      return getItems_(e);
    }
    if (p === "user") {
      return getUser_(e.parameter.email);
    }

    // Health check
    if (p === "ping") {
      return json_({
        ok: true,
        time: now_()
      });
    }

    return err_("Not found");

  } catch (e) {

    logErr_("get", "", e);

    return err_(e.message || "Server error");

  }
}


function json_(obj) {
  const out = ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);

  return cors_(out);
}


/********
 * ITEMS
 ********/

function getItems_(e) {

  const q = e.parameter.q || "";
  const cat = e.parameter.cat || "";

  const sh = ss_().getSheetByName(CFG.ITEMS);
  const rows = sh.getDataRange().getValues();

  const out = [];

  for (let i = 1; i < rows.length; i++) {

    const r = rows[i];

    const item = {
      id: r[0],
      name: r[1],
      category: r[2],
      cdnUrl: r[3],
      width: r[4],
      height: r[5],
      size: r[6],
      description: r[7],
      createdAt: r[8],
      updatedAt: r[9],
      views: r[10],
      likes: r[11],
      comments: r[12],
    };

    // Search filter
    if (q && !item.name.toLowerCase().includes(q.toLowerCase())) {
      continue;
    }

    // Category filter
    if (cat && item.category !== cat) {
      continue;
    }

    out.push(item);
  }

  return json_({
    items: out
  });
}




/**********
 * USERS
 **********/
function ensureUser_(profile) {
  if (!profile || !profile.email) return null;

  const sh = sheet_(CFG.USERS, ["email","name","phone","photo","createdAt","lastLogin"]);
  const rows = sh.getDataRange().getValues();

  const email = String(profile.email).toLowerCase().trim();
  if (!email.includes("@")) return null;

  const avatar = profile.photo || "https://www.gravatar.com/avatar/?d=mp&s=200";

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === email) {
      // update
      sh.getRange(i+1,2).setValue(profile.name || rows[i][1]);
      sh.getRange(i+1,4).setValue(avatar);
      sh.getRange(i+1,6).setValue(now_());
      return { email, name: profile.name, phone: rows[i][2], photo: avatar };
    }
  }

  // new user
  sh.appendRow([email, profile.name||"", "", avatar, now_(), now_()]);
  return { email, name: profile.name, phone: "", photo: avatar };
}




function getUser_(email) {
  if (!email) return err_("Missing email");

  const sh = sheet_(CFG.USERS, []);
  const rows = sh.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === email) {
      return json_({
        ok: true,
        user: {
          email: rows[i][0],
          name: rows[i][1],
          phone: rows[i][2],
          photo: rows[i][3],
          createdAt: rows[i][4],
          lastLogin: rows[i][5],
        }
      });
    }
  }

  return err_("User not found");
}




function getUserActivity_(email) {
  if (!email) return err_("Missing email");

  const sh = sheet_(CFG.EVENTS, []);
  const rows = sh.getDataRange().getValues();

  const out = [];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][5] === email) {
      out.push({
        id: rows[i][0],
        itemId: rows[i][1],
        type: rows[i][2],
        value: rows[i][3],
        pageUrl: rows[i][4],
        createdAt: rows[i][6],
      });
    }
  }

  return json_({
    ok: true,
    items: out
  });
}



function updateUser_(data) {
  if (!data || !data.email) {
    return err_("Missing email");
  }

  const sh = sheet_(CFG.USERS, []);
  const rows = sh.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.email) {

      if (data.name !== undefined) {
        sh.getRange(i + 1, 2).setValue(data.name);
      }

      if (data.phone !== undefined) {
        sh.getRange(i + 1, 3).setValue(data.phone);
      }

      sh.getRange(i + 1, 6).setValue(now_());

      return json_({
        ok: true
      });
    }
  }

  return err_("User not found");
}



function upsertUser_(email, name, photo) {
  if (!email) {
    throw new Error("Missing email");
  }

  const sh = sheet_(CFG.USERS, [
    "email",
    "name",
    "phone",
    "photo",
    "createdAt",
    "lastLogin",
  ]);

  const rows = sh.getDataRange().getValues();

  const cleanEmail = String(email).toLowerCase().trim();
  const avatar =
    photo || "https://www.gravatar.com/avatar/?d=mp&s=200";

  // Update if exists
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === cleanEmail) {
      sh.getRange(i + 1, 2).setValue(name || rows[i][1]);
      sh.getRange(i + 1, 4).setValue(avatar);
      sh.getRange(i + 1, 6).setValue(now_());
      return;
    }
  }

  // Insert new
  sh.appendRow([
    cleanEmail,
    name || "",
    "",
    avatar,
    now_(),
    now_(),
  ]);
}

/*******
 * ISR
 *******/

function revalidate_() {

  try {

    UrlFetchApp.fetch(prop_("NEXTJS_ISR_ENDPOINT"), {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        secret: prop_("NEXTJS_ISR_SECRET"),
      }),
    });

  } catch (e) {

    logErr_("isr", "", e);
  }
}

/***********
 * SECURITY
 ***********/

function verifySig_(e, body) {

  const ts = e.parameter.ts || e.headers["x-ts"];
  const sig = e.parameter.sig || e.headers["x-sig"];

  if (!ts || !sig) throw new Error("Missing signature");

  const now = Date.now();

  if (Math.abs(now - Number(ts)) > 300000)
    throw new Error("Expired");

  const secret = prop_("API_SIGNING_SECRET");

  const base = ts + JSON.stringify(body || {});

  const calc =
    Utilities.computeHmacSha256Signature(base, secret);

  const hash = calc
    .map(b => ("0" + (b & 255).toString(16)).slice(-2))
    .join("");

  if (hash !== sig) throw new Error("Bad signature");
}

/****************
 * SHEET → DRIVE
 *****************/
function onEdit(e) {

  if (!e || !e.range) return;

  try {
    onEditRename_(e);
    onEditCategory2_(e);
    onEditCategory1_(e);
  } catch (err) {
    logErr_("onEdit", "", err);
  }
}


function onEditCategory1_(e) {

  const sh = e.range.getSheet();
  if (sh.getName() !== CFG.ITEMS) return;
  if (e.range.getColumn() !== 3) return;

  const row = e.range.getRow();
  if (row < 2) return;

  const id   = sh.getRange(row, 1).getValue();
  const cat1 = e.value;
  const cat2 = sh.getRange(row, 4).getValue() || "Other";

  if (!id || !cat1) return;

  try {
    const file = DriveApp.getFileById(id);
    const dest = ensureCategory2Folder_(cat1, cat2);
    file.moveTo(dest);

    // Update signature
    const sig = fileSig_(file, dest.getId());
    sh.getRange(row, sh.getLastColumn()).setValue(sig);

  } catch (err) {
    logErr_("cat1-edit", id, err);
  }
}

/******************************
 * SHEET → DRIVE (RENAME SYNC 
 ******************************/

function onEditRename_(e) {

  const sh = e.range.getSheet();

  if (sh.getName() !== CFG.ITEMS) return;
  if (e.range.getColumn() !== 2) return; // name column

  const row = e.range.getRow();
  if (row < 2) return;

  const id = sh.getRange(row, 1).getValue();
  const newName = e.value;

  if (!id || !newName) return;

  try {

    const file = DriveApp.getFileById(id);

    if (file.getName() !== newName) {
      file.setName(newName);
    }

  } catch (err) {
    logErr_("rename-edit", id, err);
  }
}


/****************************
 * SHEET → DRIVE (CATEGORY 2 
 ****************************/

function onEditCategory2_(e) {

  const sh = e.range.getSheet();

  if (sh.getName() !== CFG.ITEMS) return;
  if (e.range.getColumn() !== 4) return; // category2 column

  const row = e.range.getRow();
  if (row < 2) return;

  const id = sh.getRange(row, 1).getValue();
  const cat1 = sh.getRange(row, 3).getValue();
  const cat2 = e.value;

  if (!id || !cat1 || !cat2) return;

  try {

    const file = DriveApp.getFileById(id);
    const folder = ensureCategory2Folder_(cat1, cat2);

    file.moveTo(folder);

  } catch (err) {
    logErr_("cat2-edit", id, err);
  }
}








function resolvePath_(file) {

  const parents = file.getParents();
  if (!parents.hasNext()) return {};

  const p = parents.next();
  const root = rootFolder_();

  // ROOT/file.ext
  if (p.getId() === root.getId()) {
    return { cat1: "", cat2: "", parentId: root.getId() };
  }

  const gpIt = p.getParents();
  if (!gpIt.hasNext()) {
    return { cat1: "", cat2: "", parentId: p.getId() };
  }

  const gp = gpIt.next();

  // ROOT/Cat1/file.ext
  if (gp.getId() === root.getId()) {
    return {
      cat1: p.getName(),
      cat2: "",
      parentId: p.getId()
    };
  }

  // ROOT/Cat1/Cat2/file.ext
  if (gp.getParents().hasNext() &&
      gp.getParents().next().getId() === root.getId()) {
    return {
      cat1: gp.getName(),
      cat2: p.getName(),
      parentId: p.getId()
    };
  }

  return {};
}





function walkFolders_(folder, out) {

  const files = folder.getFiles();
  while (files.hasNext()) {
    out.push(files.next());
  }

  const folders = folder.getFolders();
  while (folders.hasNext()) {
    walkFolders_(folders.next(), out);
  }
}


/*************************************************
 * INVARIANT ENFORCEMENT (DRIVE → SHEET AUTHORITY)
 *************************************************/

function enforceInvariantsForFile_(file) {

  const sh = ss_().getSheetByName(CFG.ITEMS);
  const index = index_();
  const id = file.getId();

  const row = index[id];
  if (!row) return; // not indexed yet

  const sheetCat1 = sh.getRange(row.row, 3).getValue();
  const sheetCat2 = sh.getRange(row.row, 4).getValue();

  const path = resolvePath_(file);

  // 🔹 Rule: no files directly under root
  if (path.parentId === rootFolder_().getId()) {
    const dest = ensureCategory2Folder_(sheetCat1 || "Other", sheetCat2 || "Other2");
    file.moveTo(dest);
    return;
  }

  // 🔹 Rule: no files under root/category1
  const cat1Folder = rootFolder_().getFoldersByName(sheetCat1);
  if (cat1Folder.hasNext() && path.parentId === cat1Folder.next().getId()) {
    const dest = ensureCategory2Folder_(sheetCat1, sheetCat2 || "Other2");
    file.moveTo(dest);
    return;
  }

  // 🔹 Rule: must match sheet category path
  const expected = ensureCategory2Folder_(sheetCat1, sheetCat2);
  if (path.parentId !== expected.getId()) {
    file.moveTo(expected);
  }
}


function enforceAllInvariants_() {

  const root = rootFolder_();
  const files = [];
  walkFolders_(root, files);

  files.forEach(file => {
    try {
      if (!file.getMimeType().startsWith("image/")) return;
      enforceInvariantsForFile_(file);
    } catch (e) {
      logErr_("enforce", file.getId(), e);
    }
  });
}



function forceOtherIfBadName_(file) {

  const parsed = parseCategoriesFromFilename_(file.getName());
  if (parsed.cat1 !== "Other") return;

  const path = resolvePath_(file);

  if (path.parentId === rootFolder_().getId()) {
    file.moveTo(ensureCatFolder_("Other"));
    return;
  }

  const other2 = ensureCategory2Folder_(path.parentName, "Other2");
  file.moveTo(other2);
}



/************************************************
 * - Lock Category column (read-only for humans)
 * - Propagate Drive folder renames → Sheet categories
 ******************************************************/

/**
 * Lock the Category column so only the script can modify it
 */
function lockCategoryColumn_() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const categoryCol = headers.indexOf('category') + 1;
  if (categoryCol === 0) return;

  const protections = sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
  const alreadyProtected = protections.some(p =>
    p.getRange().getColumn() === categoryCol
  );
  if (alreadyProtected) return;

  const range = sheet.getRange(2, categoryCol, sheet.getMaxRows());
  const protection = range.protect().setDescription('Lock Category Column');

  protection.removeEditors(protection.getEditors());
  protection.setWarningOnly(false);
}

/**
 * Build a map of folderId → folderName
 */
function buildFolderMap_(rootFolder) {
  const map = {};
  (function walk(folder) {
    map[folder.getId()] = folder.getName();
    const subs = folder.getFolders();
    while (subs.hasNext()) walk(subs.next());
  })(rootFolder);
  return map;
}

/**
 * Update sheet categories if Drive folders were renamed
 */
function syncCategoryRenames_() {
  const root = getOrCreateFolder_(ROOT_FOLDER_NAME);
  const folderMap = buildFolderMap_(root);

  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('fileId');
  const catCol = headers.indexOf('category');

  if (idCol === -1 || catCol === -1) return;

  let changed = false;

  for (let i = 1; i < data.length; i++) {
    const fileId = data[i][idCol];
    if (!fileId) continue;

    let file;
    try {
      file = DriveApp.getFileById(fileId);
    } catch (e) {
      continue; // deleted files handled elsewhere
    }

    const parents = file.getParents();
    if (!parents.hasNext()) continue;

    const folder = parents.next();
    const realCategory = folderMap[folder.getId()];
    if (!realCategory) continue;

    if (data[i][catCol] !== realCategory) {
      sheet.getRange(i + 1, catCol).setValue(realCategory);
      changed = true;
    }
  }

  if (changed) {
    Logger.log('Category rename propagation applied');
  }
}


/**************
 * BOOTSTRAP
 **************/

function bootstrap() {

  setup_();
  
  ensureCategory2Column_();

  syncCategoryDropdown_();
  
  syncCategory2Dropdown_();

  scanAll_();
  
  normalizeAllRows_();

  // Clear old triggers
  ScriptApp.getProjectTriggers().forEach(t => {
    ScriptApp.deleteTrigger(t);
  });

  // Near realtime scan
  ScriptApp.newTrigger("scanAll_")
    .timeBased()
    .everyMinutes(5)
    .create();

}



function testRevalidate() {
  const url = PropertiesService.getScriptProperties()
    .getProperty("NEXTJS_ISR_ENDPOINT");

  const secret = PropertiesService.getScriptProperties()
    .getProperty("NEXTJS_ISR_SECRET");

  const res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ secret }),
  });

  Logger.log(res.getContentText());
}


