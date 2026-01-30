/*************************************************
 * DRIVE SHOP — PRODUCTION SCRIPT v6.1
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

const CFG = {
  ITEMS: "Items",
  EVENTS: "Events",
  USERS: "Users",
  ERRORS: "Errors",
};

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

/*************************************************
 * SETUP
 *************************************************/

function setup_() {

  sheet_(CFG.ITEMS, [
    "id",
    "name",
    "category",
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
 * CATEGORIZATION (DRIVE BASED)
 *************************************************/

function inferCategory_(file, w, h) {

  const name = file.getName().toLowerCase();

  if (name.includes("portrait")) return "Portrait";
  if (name.includes("landscape")) return "Landscape";
  if (name.includes("product")) return "Product";
  if (name.includes("logo")) return "Logo";
  if (name.includes("banner")) return "Banner";

  if (w && h) {

    if (w > h * 1.2) return "Landscape";
    if (h > w * 1.2) return "Portrait";
    if (Math.abs(w - h) < 50) return "Square";
  }

  return "Other";
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
 * INDEX
 *************************************************/

function index_() {

  const sh = ss_().getSheetByName(CFG.ITEMS);
  const r = sh.getDataRange().getValues();

  const map = {};

  for (let i = 1; i < r.length; i++) {
    map[r[i][0]] = {
      row: i + 1,
      name: r[i][1],
    };
  }

  return map;
}

/*************************************************
 * SCAN + RENAME DETECTION
 *************************************************/

function scanAll_() {

  try {

    const seen = index_();
    const sh = ss_().getSheetByName(CFG.ITEMS);

    const root = rootFolder_();
    const files = root.getFiles();

    const newRows = [];

    while (files.hasNext()) {

      const f = files.next();

      if (!f.getMimeType().startsWith("image/")) continue;

      const id = f.getId();
      const name = f.getName();

      // Already indexed
      if (seen[id]) {

        // Rename detection
        if (seen[id].name !== name) {

          sh.getRange(seen[id].row, 2).setValue(name);
          sh.getRange(seen[id].row, 10).setValue(now_());
        }

        continue;
      }

      // New file
      const size = imageSize_(f);

      const cat = inferCategory_(f, size.w, size.h);

      moveToCategory_(f, cat);

      const cdn = cdnUrl_(id);

      const desc = describeImage_(cdn);

      newRows.push([
        id,
        name,
        cat,
        cdn,
        size.w,
        size.h,
        f.getSize(),
        desc,
        f.getDateCreated(),
        now_(),
        0,
        0,
        0,
      ]);
    }

    if (newRows.length) {

      sh.getRange(
        sh.getLastRow() + 1,
        1,
        newRows.length,
        newRows[0].length
      ).setValues(newRows);
    }

    syncCategoryDropdown_();
    revalidate_();

  } catch (e) {

    logErr_("scan", "", e);
  }
}

/*************************************************
 * EVENTS
 *************************************************/

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

/*************************************************
 * API
 *************************************************/

function doPost(e) {
  try {
    const b = JSON.parse(e.postData.contents || "{}");

    const p = e.parameter.path || "";

    if (p === "items") {
      return getItems_(e);
    }

    if (p === "event") {
      addEvent_(b.itemId, b.type, b.value, b.page, b.email);
      return ok_();
    }

    if (p === "event/batch") {
      if (!Array.isArray(b.items)) {
        return err_("Bad batch");
      }

      b.items.forEach(e => {
        addEvent_(
          e.itemId,
          e.type,
          e.value,
          e.page,
          e.email
        );
      });

      return ok_();
    }

    if (p === "user") {
      upsertUser_(b.email, b.name, b.photo);
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

    if (p === "user/dashboard") {
      return getUserDashboard_(b.email);
    }

    return err_("404");

  } catch (e) {
    logErr_("api", "", e);
    return err_(e.message);
  }
}


/*************************************************
 * RESPONSE HELPERS
 *************************************************/
function json_(obj) {
  return ContentService
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


/*************************************************
 * GET HANDLER (PUBLIC API)
 *************************************************/

function doGet(e) {

  try {

    const p = e.parameter.path || "";

    // Homepage / search / category
    if (p === "items") {
      return getItems_(e);
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

/*************************************************
 * ITEMS
 *************************************************/

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

/*************************************************
 * USERS
 *************************************************/

function upsertUser_(email, name, photo) {

  const sh = sheet_(CFG.USERS, []);
  const r = sh.getDataRange().getValues();

  const avatar =
    photo ||
    "https://www.gravatar.com/avatar/?d=mp&s=200";

  for (let i = 1; i < r.length; i++) {

    if (r[i][0] === email) {

      sh.getRange(i + 1, 4).setValue(avatar);
      sh.getRange(i + 1, 6).setValue(now_());

      return;
    }
  }

  sh.appendRow([
    email,
    name || "",
    "",
    avatar,
    now_(),
    now_(),
  ]);
}

/*************************************************
 * ISR
 *************************************************/

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

/*************************************************
 * SECURITY
 *************************************************/

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

/*************************************************
 * SHEET → DRIVE
 *************************************************/

function onEdit(e) {

  const sh = e.range.getSheet();

  if (sh.getName() !== CFG.ITEMS) return;

  if (e.range.getColumn() !== 3) return;

  const row = e.range.getRow();

  if (row < 2) return;

  const id = sh.getRange(row, 1).getValue();
  const cat = e.value;

  if (!id || !cat) return;

  try {

    const file = DriveApp.getFileById(id);

    moveToCategory_(file, cat);

  } catch (err) {

    logErr_("cat-edit", id, err);
  }
}

/*************************************************
 * BOOTSTRAP
 *************************************************/

function bootstrap() {

  setup_();

  syncCategoryDropdown_();

  scanAll_();

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