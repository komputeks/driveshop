/*************************************************
 * DRIVESHOP V2 — ENTERPRISE CORE
 *************************************************/

/* ================= CONFIG ================= */

const CFG = {
  ITEMS: "items",
  EVENTS: "events",
  USERS: "users",
  ERRORS: "errors",
};

/* ================= UTILS ================= */

function prop_(k) {
  return PropertiesService.getScriptProperties().getProperty(k);
}

function ss_() {
  return SpreadsheetApp.openByUrl(prop_("SPREADSHEET_URL"));
}

function now_() {
  return new Date();
}

function uuid_() {
  return Utilities.getUuid();
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

/* ================= DRIVE ================= */

function rootFolder_() {
  return DriveApp.getFolderById(prop_("ROOT_FOLDER_ID"));
}

function resolvePath_(file) {

  const parents = file.getParents();

  while (parents.hasNext()) {

    const p = parents.next();

    if (p.getId() !== rootFolder_().getId()) {

      return {
        parentId: p.getId(),
        parentName: p.getName(),
      };
    }
  }

  return { parentId: null, parentName: null };
}

function ensureCat1_(c1) {

  const root = rootFolder_();
  const it = root.getFoldersByName(c1);

  return it.hasNext() ? it.next() : root.createFolder(c1);
}

function ensureCat2_(c1, c2) {

  const lvl1 = ensureCat1_(c1);
  const it = lvl1.getFoldersByName(c2);

  return it.hasNext() ? it.next() : lvl1.createFolder(c2);
}

/* ================= SHEETS ================= */

function ensureSheet_(name, headers) {

  const ss = ss_();
  let sh = ss.getSheetByName(name);

  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
  }

  return sh;
}

function setup_() {

  ensureSheet_(CFG.ITEMS, [
    "id","name","cat1","cat2","cdn",
    "w","h","size","desc",
    "created","updated",
    "views","likes","comments",
    "sig"
  ]);

  ensureSheet_(CFG.EVENTS, [
    "id","itemId","type","value",
    "page","user","time"
  ]);

  ensureSheet_(CFG.USERS, [
    "email","name","role",
    "photo","created","lastLogin"
  ]);

  ensureSheet_(CFG.ERRORS, [
    "time","job","item","msg","stack"
  ]);
}

/* ================= SECURITY ================= */

function auth_(key) {
  return key === prop_("API_KEY");
}

/* ================= IMAGE ================= */

function cdnUrl_(id) {
  return "https://lh3.googleusercontent.com/d/" + id + "=w2000";
}

function imageSize_(file) {

  try {

    const img = file.getBlob().getBytes();
    const info = ImagesService.openImage(img).getSize();

    return { w: info.width, h: info.height };

  } catch {
    return { w: 0, h: 0 };
  }
}

/* ================= SIGNATURE ================= */

function fileSig_(file, parentId) {

  return [
    file.getId(),
    file.getSize(),
    file.getChecksum(),
    parentId || ""
  ].join("|");
}

/* ================= WALK ================= */

function walk_(folder, out) {

  const files = folder.getFiles();
  while (files.hasNext()) out.push(files.next());

  const subs = folder.getFolders();
  while (subs.hasNext()) walk_(subs.next(), out);
}

/* ================= SCAN CORE ================= */

function scanAll_() {

  return withLock_(() => scanCore_());
}

function scanCore_() {

  const sh = ss_().getSheetByName(CFG.ITEMS);
  const data = sh.getDataRange().getValues();

  const index = {};
  for (let i = 1; i < data.length; i++) {
    index[data[i][0]] = i + 1;
  }

  const root = rootFolder_();
  const files = [];

  walk_(root, files);

  const seen = new Set();

  files.forEach(file => {

    if (!file.getMimeType().startsWith("image/")) return;

    const id = file.getId();
    seen.add(id);

    const path = resolvePath_(file);
    const sig = fileSig_(file, path.parentId);

    /* NEW FILE */
    if (!index[id]) {

      const size = imageSize_(file);

      sh.appendRow([
        id,
        file.getName(),
        path.parentName || "Unsorted",
        "Default",
        cdnUrl_(id),
        size.w,
        size.h,
        file.getSize(),
        "",
        file.getDateCreated(),
        now_(),
        0,0,0,
        sig
      ]);

      return;
    }

    /* UPDATE */
    const row = index[id];

    if (data[row-1][14] !== sig) {

      sh.getRange(row,15).setValue(sig);
      sh.getRange(row,11).setValue(now_());
    }

  });

  /* DELETE MISSING */

  Object.keys(index).forEach(id => {

    if (!seen.has(id)) {
      sh.deleteRow(index[id]);
    }
  });
}

/* ================= API ================= */

function apiRes_(o) {

  const out = ContentService
    .createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);

  out.setHeader("Access-Control-Allow-Origin","*");

  return out;
}

function doGet(e) {

  const p = e.parameter || {};

  if (!auth_(p.key)) {
    return apiRes_({ ok:false, error:"unauthorized" });
  }

  if (p.action === "items") {

    return getItems_();
  }

  return apiRes_({ ok:true, time: now_() });
}

function getItems_() {

  const sh = ss_().getSheetByName(CFG.ITEMS);
  const rows = sh.getDataRange().getValues();

  const out = [];

  for (let i = 1; i < rows.length; i++) {

    const r = rows[i];

    out.push({
      id:r[0],
      name:r[1],
      cat1:r[2],
      cat2:r[3],
      cdn:r[4],
      w:r[5],
      h:r[6],
      views:r[11],
      likes:r[12],
      comments:r[13],
    });
  }

  return apiRes_({ ok:true, items:out });
}

/* ================= BOOT ================= */

function onOpen() {

  SpreadsheetApp.getUi()
    .createMenu("DriveShop v2")
    .addItem("Setup","init_")
    .addItem("Scan","scanAll_")
    .addToUi();
}

function init_() {

  setup_();

  ScriptApp.newTrigger("scanAll_")
    .timeBased()
    .everyDays(1)
    .atHour(3)
    .create();

  SpreadsheetApp.getUi()
    .alert("DriveShop v2 Ready");
}