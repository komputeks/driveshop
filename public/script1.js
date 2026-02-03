/*************************************************
 * DRIVE SHOP — PRODUCTION SCRIPT CLEAN v6.2
 *************************************************/

/*
SCRIPT PROPERTIES
AUTO_FOLDER_ID
GEMINI_KEY
NEXTJS_ISR_ENDPOINT
NEXTJS_ISR_SECRET
API_SIGNING_SECRET
SPREADSHEET_URL (optional)
*/

/*
NEXTJS ENV VARIABLES
NEXT_PUBLIC_API_BASE_URL
NEXTAUTH_URL
NEXTAUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
NEXTJS_ISR_ENDPOINT
NEXTJS_ISR_SECRET
API_SIGNING_SECRET
*/

const CFG = {
  ITEMS: "Items",
  EVENTS: "Events",
  USERS: "Users",
  ERRORS: "Errors",
};

/*************************************************
 * CORE HELPERS
 *************************************************/
function props_() { return PropertiesService.getScriptProperties(); }
function prop_(k) { const v = props_().getProperty(k); if (!v) throw new Error("Missing prop: " + k); return v; }
function now_() { return new Date(); }
function uuid_() { return Utilities.getUuid(); }

/*************************************************
 * SPREADSHEET HELPERS
 *************************************************/
function ss_() {
  const url = props_().getProperty("SPREADSHEET_URL");
  if (!url) return createAndSaveSheet_();
  try {
    const id = url.match(/\/d\/([a-zA-Z0-9-_]+)/)[1];
    return SpreadsheetApp.openById(id);
  } catch { return createAndSaveSheet_(); }
}

function createAndSaveSheet_() {
  const ss = SpreadsheetApp.create("DriveShop Database");
  props_().setProperty("SPREADSHEET_URL", ss.getUrl());
  return ss;
}

function sheet_(name, cols) {
  let sh = ss_().getSheetByName(name);
  if (!sh) { sh = ss_().insertSheet(name); sh.appendRow(cols); }
  return sh;
}

function ensureCategory2Column_() {
  const sh = ss_().getSheetByName(CFG.ITEMS);
  if (!sh) return;
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  if (!headers.includes("category2")) {
    sh.insertColumnAfter(3);
    sh.getRange(1,4).setValue("category2");
  }
}

function ensureSigColumn_() {
  const sh = ss_().getSheetByName(CFG.ITEMS);
  if (!sh) return;
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  if (!headers.includes("_lastSig")) {
    sh.insertColumnAfter(sh.getLastColumn());
    sh.getRange(1,sh.getLastColumn()).setValue("_lastSig");
  }
}

/*************************************************
 * SETUP SHEETS
 *************************************************/
function setup_() {
  sheet_(CFG.ITEMS, [
    "id","name","category","category2","cdnUrl","width","height","size",
    "description","createdAt","updatedAt","views","likes","comments","_lastSig"
  ]);

  sheet_(CFG.EVENTS, [
    "id","itemId","type","value","pageUrl","userEmail","createdAt"
  ]);

  sheet_(CFG.USERS, [
    "email","name","phone","photo","createdAt","lastLogin"
  ]);

  sheet_(CFG.ERRORS, [
    "time","jobId","itemId","message","stack"
  ]);
}

/*************************************************
 * LOGGING
 *************************************************/
function logErr_(job, item, e) {
  sheet_(CFG.ERRORS, []).appendRow([
    now_(),
    job||"",
    item||"",
    e.message||e,
    e.stack||""
  ]);
  console.error(e);
}

/*************************************************
 * DRIVE HELPERS
 *************************************************/
function getOrCreateFolder_(name, parent) {
  parent = parent || DriveApp.getRootFolder();
  const f = parent.getFoldersByName(name);
  return f.hasNext() ? f.next() : parent.createFolder(name);
}

function getOrCreateSubfolder_(parent, name) {
  return getOrCreateFolder_(name, parent);
}

function listFiles_(folder) {
  const files = [];
  const fIter = folder.getFiles();
  while (fIter.hasNext()) files.push(fIter.next());
  return files;
}

function walkFolders_(root) {
  const folders = [];
  const fIter = root.getFolders();
  while (fIter.hasNext()) {
    const f = fIter.next();
    folders.push(f);
    folders.push(...walkFolders_(f));
  }
  return folders;
}

/*************************************************
 * FILE SIGNATURE
 *************************************************/
function fileSig_(file) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, file.getBlob().getBytes())
    .map(b => ("0" + (b & 0xFF).toString(16)).slice(-2)).join("");
}

/*************************************************
 * PATH / CATEGORY RESOLVERS
 *************************************************/
function resolvePath_(file, rootFolderName) {
  const parents = file.getParents();
  if (!parents.hasNext()) return [rootFolderName];
  let parent = parents.next();
  const path = [file.getName()];
  while (parent && parent.getName() !== rootFolderName) {
    path.unshift(parent.getName());
    const grand = parent.getParents();
    parent = grand.hasNext() ? grand.next() : null;
  }
  return path;
}

function getCategories_(file, rootFolderName) {
  const path = resolvePath_(file, rootFolderName);
  return {
    category: path[1] || "Uncategorized",
    category2: path[2] || ""
  };
}

/*************************************************
 * FILE METADATA EXTRACTOR
 *************************************************/
function fileMeta_(file, rootFolderName) {
  const cat = getCategories_(file, rootFolderName);
  const blob = file.getBlob();
  return {
    id: file.getId(),
    name: file.getName(),
    category: cat.category,
    category2: cat.category2,
    cdnUrl: file.getUrl(),
    width: blob.getWidth ? blob.getWidth() : null,
    height: blob.getHeight ? blob.getHeight() : null,
    size: blob.getBytes().length,
    description: "",
    createdAt: file.getDateCreated(),
    updatedAt: file.getLastUpdated(),
    _lastSig: fileSig_(file)
  };
}

/*************************************************
 * SYNC HELPERS
 *************************************************/
function upsertItem_(item) {
  const sh = sheet_(CFG.ITEMS, []);
  const data = sh.getDataRange().getValues();
  const headers = data.shift();
  const idCol = headers.indexOf("id");
  const sigCol = headers.indexOf("_lastSig");

  const rowIdx = data.findIndex(r => r[idCol] === item.id);
  const row = headers.map(h => item[h] !== undefined ? item[h] : "");

  if (rowIdx >= 0) {
    // update only if signature changed
    if (data[rowIdx][sigCol] !== item._lastSig) {
      sh.getRange(rowIdx + 2, 1, 1, row.length).setValues([row]);
    }
  } else {
    sh.appendRow(row);
  }
}

/*************************************************
 * SCAN ROOT FOLDER
 *************************************************/
function scanRootFolder_() {
  const ROOT = getOrCreateFolder_("UploadedForWeb");
  const files = listFiles_(ROOT);
  files.forEach(f => {
    try { upsertItem_(fileMeta_(f, ROOT.getName())); }
    catch(e) { logErr_("scanRootFolder", f.getName(), e); }
  });

  // walk subfolders
  const folders = walkFolders_(ROOT);
  folders.forEach(folder => {
    listFiles_(folder).forEach(f => {
      try { upsertItem_(fileMeta_(f, ROOT.getName())); }
      catch(e) { logErr_("scanFolder", f.getName(), e); }
    });
  });
}

/*************************************************
 * CONFIG
 *************************************************/
const CFG = {
  ROOT_FOLDER: "UploadedForWeb",
  ITEMS: "AssetsDB",
  TOKEN: "super-secret-token", // replace with your token
  NEXTJS_REVALIDATE_URL: "https://your-site.com/api/revalidate"
};

/*************************************************
 * TOKEN / AUTH
 *************************************************/
function assertToken_(token) {
  if (token !== CFG.TOKEN) throw new Error("Unauthorized: invalid token");
}

/*************************************************
 * LOGGING
 *************************************************/
function logErr_(fn, context, err) {
  console.error(`[${fn}] ${context}: ${err}`);
}

/*************************************************
 * CRON / BOOTSTRAP
 *************************************************/
function bootstrap(token) {
  assertToken_(token);
  scanRootFolder_();
  triggerNextJS_();
}

/*************************************************
 * NEXT.JS ISR / REVALIDATE
 *************************************************/
function triggerNextJS_() {
  try {
    const options = { method: "GET", muteHttpExceptions: true };
    UrlFetchApp.fetch(CFG.NEXTJS_REVALIDATE_URL, options);
  } catch(e) {
    logErr_("triggerNextJS", CFG.NEXTJS_REVALIDATE_URL, e);
  }
}

/*************************************************
 * SCHEDULED INGESTION (Time-driven Trigger)
 *************************************************/
function runScheduledIngestion() {
  try {
    scanRootFolder_();
    triggerNextJS_();
  } catch(e) {
    logErr_("runScheduledIngestion", "scheduled run", e);
  }
}

/*************************************************
 * MANUAL API ENDPOINT
 *************************************************/
function doGet(e) {
  try {
    const token = e.parameter.token;
    bootstrap(token);
    return ContentService.createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  return doGet(e); // same behavior for simplicity
}


/*************************************************
 * SPREADSHEET HELPERS
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

/*************************************************
 * SPREADSHEET / SHEETS
 *************************************************/
function ss_() {
  const url = props_().getProperty("SPREADSHEET_URL");
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

/*************************************************
 * ENSURE CATEGORY2 COLUMN
 *************************************************/
function ensureCategory2Column_() {
  const sh = ss_().getSheetByName(CFG.ITEMS);
  if (!sh) return;

  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  if (!headers.includes("category2")) {
    sh.insertColumnAfter(3);
    sh.getRange(1,4).setValue("category2");
  }
}

/*************************************************
 * ENSURE _lastSig COLUMN
 *************************************************/
function ensureSigColumn_() {
  const sh = ss_().getSheetByName(CFG.ITEMS);
  if (!sh) return;

  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  if (!headers.includes("_lastSig")) {
    sh.insertColumnAfter(sh.getLastColumn());
    sh.getRange(1,sh.getLastColumn()).setValue("_lastSig");
  }
}

/*************************************************
 * SHEET SETUP
 *************************************************/
function setup_() {
  // ITEMS sheet
  sheet_(CFG.ITEMS, [
    "fileId",
    "name",
    "category",
    "category2",
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
    "_lastSig"
  ]);

  // USERS sheet
  sheet_("Users", [
    "email",
    "name",
    "phone",
    "photo",
    "createdAt",
    "lastLogin"
  ]);

  // EVENTS sheet
  sheet_("Events", [
    "id",
    "itemId",
    "type",
    "value",
    "pageUrl",
    "userEmail",
    "createdAt"
  ]);

  // ERRORS sheet
  sheet_("Errors", [
    "time",
    "jobId",
    "itemId",
    "message",
    "stack"
  ]);
}



/*************************************************
 * DRIVE HELPERS
 *************************************************/
function getOrCreateFolder_(name, parent) {
  const folders = parent ? parent.getFoldersByName(name) : DriveApp.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parent ? parent.createFolder(name) : DriveApp.createFolder(name);
}

function getOrCreateSubfolder_(parent, name) {
  return getOrCreateFolder_(name, parent);
}

/*************************************************
 * ROOT / SPECIAL FOLDERS
 *************************************************/
function getRootFolder_() {
  return getOrCreateFolder_(ROOT_FOLDER_NAME);
}

function getUncategorizedFolder_() {
  return getOrCreateSubfolder_(getRootFolder_(), UNCATEGORIZED);
}

function getAutoFolder_() {
  return getOrCreateSubfolder_(getRootFolder_(), AUTO_CATEGORIZED);
}

/*************************************************
 * FILE SIGNATURES
 *************************************************/
function fileSignature_(file) {
  return `${file.getId()}_${file.getLastUpdated().getTime()}`;
}

/*************************************************
 * NORMALIZE FILE DATA
 *************************************************/
function normalizeFile_(file, category, category2) {
  const type = file.getMimeType();
  const url = "https://drive.google.com/uc?export=view&id=" + file.getId();
  return {
    fileId: file.getId(),
    name: file.getName(),
    category: category || UNCATEGORIZED,
    category2: category2 || "",
    cdnUrl: url,
    width: type.startsWith("image/") ? getImageWidth_(file) : "",
    height: type.startsWith("image/") ? getImageHeight_(file) : "",
    size: file.getSize(),
    description: "",
    createdAt: file.getDateCreated(),
    updatedAt: file.getLastUpdated(),
    views: 0,
    likes: 0,
    comments: 0,
    _lastSig: fileSignature_(file)
  };
}

/*************************************************
 * IMAGE DIMENSIONS
 *************************************************/
function getImageWidth_(file) {
  try {
    const blob = file.getBlob();
    const img = ImagesService.openImage(blob);
    return img.getWidth();
  } catch {
    return "";
  }
}

function getImageHeight_(file) {
  try {
    const blob = file.getBlob();
    const img = ImagesService.openImage(blob);
    return img.getHeight();
  } catch {
    return "";
  }
}

/*************************************************
 * LIST FILES IN FOLDER RECURSIVELY
 *************************************************/
function listFilesRecursive_(folder, parentCat, parentCat2) {
  const files = [];
  const subfolders = folder.getFolders();

  while (subfolders.hasNext()) {
    const sub = subfolders.next();
    const subCat = sub.getName();
    files.push(...listFilesRecursive_(sub, parentCat, subCat));
  }

  const fs = folder.getFiles();
  while (fs.hasNext()) {
    const file = fs.next();
    files.push(normalizeFile_(file, parentCat, parentCat2));
  }

  return files;
}



/*************************************************
 * SCAN DRIVE AND SYNC TO SHEET
 *************************************************/
function scanDriveAndSync_() {
  const sh = sheet_(CFG.ITEMS, [
    "fileId", "name", "category", "category2",
    "cdnUrl", "width", "height", "size",
    "description", "createdAt", "updatedAt",
    "views", "likes", "comments", "_lastSig"
  ]);

  const index = index_(); // existing rows by fileId
  const root = getRootFolder_();
  const allFiles = listFilesRecursive_(root);

  const seen = new Set();
  const rowsToDelete = [];

  allFiles.forEach(file => {
    const id = file.fileId;
    seen.add(id);

    const row = index[id];

    // New file
    if (!row) {
      const cat1 = file.category || "Other";
      const cat2 = file.category2 || "Other2";

      // Move bad names to Other folders
      if (cat1 === "Other") {
        moveToOtherFolder_(id, root);
      }

      // Append new row
      sh.appendRow([
        file.fileId,
        file.name,
        cat1,
        cat2,
        file.cdnUrl,
        file.width,
        file.height,
        file.size,
        file.description,
        file.createdAt,
        file.updatedAt,
        file.views,
        file.likes,
        file.comments,
        file._lastSig
      ]);
      return;
    }

    // Existing file → check signature
    if (row._lastSig !== file._lastSig) {
      sh.getRange(row.row, sh.getLastColumn()).setValue(file._lastSig);
      sh.getRange(row.row, 11).setValue(new Date()); // updatedAt
    }
  });

  // Deleted files → remove rows
  Object.keys(index).forEach(id => {
    if (!seen.has(id)) rowsToDelete.push(index[id].row);
  });

  rowsToDelete.sort((a, b) => b - a).forEach(r => sh.deleteRow(r));

  // Sync dropdowns
  syncCategoryDropdown_();
  syncCategory2Dropdown_();

  // Enforce folder-sheet invariants
  enforceAllInvariants_();

  // Lock Category column
  lockCategoryColumn_();

  // Propagate Drive renames → sheet
  syncCategoryRenames_();

  // Revalidate Next.js ISR
  revalidate_();
};

/*************************************************
 * MOVE BAD FILES TO "OTHER" FOLDER
 *************************************************/
function moveToOtherFolder_(fileId, rootFolder) {
  try {
    const file = DriveApp.getFileById(fileId);
    const otherFolder = getOrCreateSubfolder_(rootFolder, "Other");
    file.moveTo(otherFolder);
  } catch (e) {
    logErr_("move-other", fileId, e);
  }
}


/*************************************************
 * EVENTS — TRACK USER ACTIONS
 *************************************************/
function addEvent_(itemId, type, value, pageUrl, userEmail) {
  const sh = sheet_(CFG.EVENTS, [
    "id", "itemId", "type", "value", "pageUrl", "userEmail", "createdAt"
  ]);

  const id = uuid_();
  const now = new Date();

  sh.appendRow([id, itemId, type, value || "", pageUrl || "", userEmail || "", now]);

  bumpStats_(itemId, type);
}

/*************************************************
 * BUMP STATS (views, likes, comments)
 *************************************************/
function bumpStats_(itemId, type) {
  const sh = sheet_(CFG.ITEMS, []);
  const rows = sh.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === itemId) {
      const col =
        type === "view" ? 11 :
        type === "like" ? 12 :
        type === "comment" ? 13 : null;

      if (col) {
        const cell = sh.getRange(i + 1, col);
        cell.setValue((cell.getValue() || 0) + 1);
      }
      break;
    }
  }
}

/*************************************************
 * USER MANAGEMENT
 *************************************************/
function ensureUser_(profile) {
  if (!profile || !profile.email) return null;

  const sh = sheet_(CFG.USERS, ["email", "name", "phone", "photo", "createdAt", "lastLogin"]);
  const rows = sh.getDataRange().getValues();

  const email = String(profile.email).toLowerCase().trim();
  if (!email.includes("@")) return null;

  const avatar = profile.photo || "https://www.gravatar.com/avatar/?d=mp&s=200";

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === email) {
      // update existing user
      sh.getRange(i + 1, 2).setValue(profile.name || rows[i][1]);
      sh.getRange(i + 1, 4).setValue(avatar);
      sh.getRange(i + 1, 6).setValue(now_());
      return { email, name: profile.name, phone: rows[i][2], photo: avatar };
    }
  }

  // insert new user
  sh.appendRow([email, profile.name || "", "", avatar, now_(), now_()]);
  return { email, name: profile.name, phone: "", photo: avatar };
}

/*************************************************
 * GET USER
 *************************************************/
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
          lastLogin: rows[i][5]
        }
      });
    }
  }

  return err_("User not found");
}

/*************************************************
 * GET USER ACTIVITY
 *************************************************/
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
        createdAt: rows[i][6]
      });
    }
  }

  return json_({ ok: true, items: out });
}

/*************************************************
 * UPDATE USER
 *************************************************/
function updateUser_(data) {
  if (!data || !data.email) return err_("Missing email");

  const sh = sheet_(CFG.USERS, []);
  const rows = sh.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.email) {
      if (data.name !== undefined) sh.getRange(i + 1, 2).setValue(data.name);
      if (data.phone !== undefined) sh.getRange(i + 1, 3).setValue(data.phone);
      sh.getRange(i + 1, 6).setValue(now_());
      return json_({ ok: true });
    }
  }

  return err_("User not found");
}

/*************************************************
 * UPSERT USER
 *************************************************/
function upsertUser_(email, name, photo) {
  if (!email) throw new Error("Missing email");

  const sh = sheet_(CFG.USERS, ["email", "name", "phone", "photo", "createdAt", "lastLogin"]);
  const rows = sh.getDataRange().getValues();

  const cleanEmail = String(email).toLowerCase().trim();
  const avatar = photo || "https://www.gravatar.com/avatar/?d=mp&s=200";

  // Update existing
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === cleanEmail) {
      sh.getRange(i + 1, 2).setValue(name || rows[i][1]);
      sh.getRange(i + 1, 4).setValue(avatar);
      sh.getRange(i + 1, 6).setValue(now_());
      return;
    }
  }

  // Insert new
  sh.appendRow([cleanEmail, name || "", "", avatar, now_(), now_()]);
}



/*************************************************
 * DO GET — API ENTRY POINT
 *************************************************/
function doGet(e) {
  try {
    const params = e.parameter || {};
    const route = (params.route || "").toLowerCase();

    switch (route) {
      case "items":
        return json_(getItems_(params));
      case "item":
        return json_(getItem_(params.id));
      case "categories":
        return json_(getCategories_());
      case "user":
        return getUser_(params.email);
      case "useractivity":
        return getUserActivity_(params.email);
      default:
        return json_({ ok: false, error: "Unknown route" });
    }
  } catch (err) {
    return err_(err);
  }
}

/*************************************************
 * DO POST — API ENTRY POINT
 *************************************************/
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents || "{}");
    const route = (params.route || "").toLowerCase();

    switch (route) {
      case "additem":
        return json_(addItem_(params));
      case "updateitem":
        return json_(updateItem_(params));
      case "deleteitem":
        return json_(deleteItem_(params.id));
      case "addevent":
        addEvent_(params.itemId, params.type, params.value, params.pageUrl, params.userEmail);
        return json_({ ok: true });
      case "ensureuser":
        return json_(ensureUser_(params.profile));
      case "updateuser":
        return updateUser_(params);
      case "upsertuser":
        upsertUser_(params.email, params.name, params.photo);
        return json_({ ok: true });
      default:
        return json_({ ok: false, error: "Unknown route" });
    }
  } catch (err) {
    return err_(err);
  }
}

/*************************************************
 * CROSS-DOMAIN / CORS SETUP
 *************************************************/
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}

/*************************************************
 * HELPER FOR PARAM PARSING
 *************************************************/
function param_(params, key, defaultValue) {
  return params && params[key] !== undefined ? params[key] : defaultValue;
}