/*  
Project Settings → Script Properties

AUTO_FOLDER_ID=XXXX  
GEMINI_KEY=XXXX  
NEXTJS_ISR_ENDPOINT=https://yourapp.vercel.app/api/revalidate  
NEXTJS_ISR_SECRET=XXXX  

SPREADSHEET_URL (optional) — script will auto-create if missing
*/

const CFG = {
  ITEMS: "Items",
  EVENTS: "Events",
  USERS: "Users",
  JOBS: "Jobs",
  ERRORS: "Errors",
  CATS: "Categories",
};

function props_() {
  return PropertiesService.getScriptProperties();
}

function prop_(k) {
  const v = props_().getProperty(k);
  if (!v) throw new Error("Missing prop: " + k);
  return v;
}

// Returns existing Sheet or auto-creates one
function ss_() {
  const props = props_();
  let url = props.getProperty("SPREADSHEET_URL");
  if (!url) {
    return createAndSaveSheet_();
  }
  try {
    const id = extractSheetId_(url);
    if (!id) throw new Error("Invalid Sheet URL");
    return SpreadsheetApp.openById(id);
  } catch (e) {
    console.warn("Bad Sheet URL, creating new one:", e);
    return createAndSaveSheet_();
  }
}

// Extract sheet id from URL
function extractSheetId_(url) {
  const m = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : null;
}

// Create and save new sheet url
function createAndSaveSheet_() {
  const ss = SpreadsheetApp.create("DriveShop Database");
  const url = ss.getUrl();
  props_().setProperty("SPREADSHEET_URL", url);
  console.log("New Sheet Created:", url);
  return ss;
}

function now_() {
  return new Date();
}

function uuid_() {
  return Utilities.getUuid();
}

/***********************
 * SCHEMA
 ***********************/

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
    "comments"
  ]);

  sheet_(CFG.EVENTS, [
    "id",
    "itemId",
    "type",     // view | like | comment
    "value",    // comment text
    "pageUrl",
    "userEmail",
    "createdAt"
  ]);

  sheet_(CFG.USERS, [
    "email",
    "name",
    "phone",
    "photo",
    "createdAt",
    "lastLogin"
  ]);

  sheet_(CFG.JOBS, [
    "id",
    "type",
    "status",
    "progress",
    "meta",
    "createdAt",
    "updatedAt"
  ]);

  sheet_(CFG.ERRORS, [
    "time",
    "jobId",
    "itemId",
    "message",
    "stack"
  ]);

  sheet_(CFG.CATS, [
    "pattern",
    "category",
    "priority"
  ]);
}

function sheet_(name, cols) {
  let sh = ss_().getSheetByName(name);
  if (!sh) {
    sh = ss_().insertSheet(name);
    sh.appendRow(cols);
  }
  return sh;
}

/***********************
 * LOGGING
 ***********************/

function logErr_(job, item, e) {
  sheet_(CFG.ERRORS, []).appendRow([
    now_(),
    job || "",
    item || "",
    e.message || e,
    e.stack || ""
  ]);
  console.error(e);
}

/***********************
 * IMAGE UTIL
 ***********************/

function cdnUrl_(id) {
  return "https://lh3.googleusercontent.com/d/" + id + "=w2000";
}

function imageSize_(file) {
  try {
    const blob = file.getBlob();
    const img = Utilities.newBlob(blob).getBytes();
    const info = ImagesService.openImage(img).getSize();
    return { w: info.width, h: info.height };
  } catch {
    return { w: 0, h: 0 };
  }
}

/***********************
 * GEMINI
 ***********************/

function describeImage_(url) {
  const key = prop_("GEMINI_KEY");
  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=" +
    key;

  const payload = {
    contents: [{
      parts: [
        { text: "Describe this image briefly for a gallery:" },
        { inlineData: { mimeType: "image/jpeg", data: url } }
      ]
    }]
  };

  try {
    const res = UrlFetchApp.fetch(endpoint, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload)
    });
    const j = JSON.parse(res.getContentText());
    return j.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch {
    return "";
  }
}

/***********************
 * CATEGORIZATION
 ***********************/

function inferCategory_(file, w, h) {
  const name = file.getName().toLowerCase();

  if (name.includes("portrait")) return "portrait";
  if (name.includes("landscape")) return "landscape";

  if (w > h) return "landscape";
  if (h > w) return "portrait";

  const sh = ss_().getSheetByName(CFG.CATS);
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (name.match(rows[i][0])) {
      return rows[i][1];
    }
  }
  return "general";
}

/***********************
 * DRIVE → SHEET SYNC
 ***********************/

function index_() {
  const sh = ss_().getSheetByName(CFG.ITEMS);
  const r = sh.getDataRange().getValues();
  const map = {};
  for (let i = 1; i < r.length; i++) {
    map[r[i][0]] = true;
  }
  return map;
}

function scanAll_() {
  const job = startJob_("scan");
  try {
    const seen = index_();
    const sh = ss_().getSheetByName(CFG.ITEMS);
    const out = [];
    const root = DriveApp.getFolderById(prop_("AUTO_FOLDER_ID"));
    const files = root.getFiles();

    while (files.hasNext()) {
      const f = files.next();
      if (!f.getMimeType().startsWith("image/")) continue;
      if (seen[f.getId()]) continue;

      const size = imageSize_(f);
      const cat = inferCategory_(f, size.w, size.h);
      moveToCategory_(f, cat);

      const cdn = cdnUrl_(f.getId());
      const desc = describeImage_(cdn);

      out.push([
        f.getId(),
        f.getName(),
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
        0
      ]);
    }

    if (out.length) {
      sh.getRange(sh.getLastRow() + 1, 1, out.length, out[0].length).setValues(out);
    }

    syncCategoryDropdown_();
    updateJob_(job, "done", 100);
    revalidate_();
  } catch (e) {
    logErr_(job, "", e);
    updateJob_(job, "fail");
  }
}

/***********************
 * EVENTS
 ***********************/

function addEvent_(itemId, type, val, page, email) {
  sheet_(CFG.EVENTS, []).appendRow([
    uuid_(),
    itemId,
    type,
    val || "",
    page || "",
    email || "",
    now_()
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
        type === "like" ? 12 :
        13;
      const cell = sh.getRange(i + 1, col);
      cell.setValue((cell.getValue() || 0) + 1);
      return;
    }
  }
}

/***********************
 * API
 ***********************/

function doPost(e) {
  try {
    const b = JSON.parse(e.postData.contents);
    verifySig_(e, b);

    const p = e.parameter.path || "";

    if (p === "event") {
      addEvent_(b.itemId, b.type, b.value, b.page, b.email);
      return ok_();
    }

    if (p === "user") {
      upsertUser_(b.email, b.name, b.photo);
      return ok_();
    }

    if (p === "phone") {
      updatePhone_(b.email, b.phone);
      return ok_();
    }

    if (p === "userGet") {
      return getUser_(b.email);
    }

    return err_("404");
  } catch (e) {
    logErr_("", "", e);
    return err_(e.message);
  }
}

/* … rest unchanged … */
// =================================================
// GET USER BY EMAIL
// =================================================
function getUser_(email) {

  if (!email) {
    return json_({ error: "Missing email" });
  }

  const sh = ss_().getSheetByName(CFG.USERS);

  if (!sh) {
    return json_({ error: "Users sheet missing" });
  }

  const rows = sh.getDataRange().getValues();

  if (rows.length < 2) {
    return json_({ email, role: "user" });
  }

  const headers = rows[0];

  for (let i = 1; i < rows.length; i++) {

    const row = rows[i];

    if (row[0] === email) {

      const user = {};

      for (let j = 0; j < headers.length; j++) {
        user[headers[j]] = row[j];
      }

      // Safety defaults
      user.role = user.role || "user";
      user.phone = user.phone || null;
      user.photo = user.photo || null;

      return json_(user);
    }
  }

  // Not found → auto-register minimal profile
  return json_({
    email,
    role: "user",
    phone: null,
    photo: null,
  });
}


// =================================================
// USER ACTIVITY
// =================================================
function getUserActivity_(email) {

  if (!email) return err_("Missing email");

  const sh = ss_().getSheetByName(CFG.EVENTS);
  const rows = sh.getDataRange().getValues();

  const out = [];

  // newest first
  for (let i = rows.length - 1; i > 0; i--) {

    if (rows[i][5] === email) {

      out.push({
        id: rows[i][0],
        itemId: rows[i][1],
        type: rows[i][2],
        value: rows[i][3],
        page: rows[i][4],
        at: rows[i][6]
      });
    }

    // limit
    if (out.length >= 50) break;
  }

  return json_({ items: out });
}




function ok_() {
  return json_({ ok: true });
}

function err_(m) {
  return json_({ error: m }, 400);
}

function json_(o, c) {

  return ContentService
    .createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON)
    .setResponseCode(c || 200);
}


function upsertUser_(email, name, photo) {

  const sh = sheet_(CFG.USERS, []);
  const r = sh.getDataRange().getValues();

  const avatar =
    photo ||
    "https://www.gravatar.com/avatar/?d=mp&s=200";

  for (let i = 1; i < r.length; i++) {

    if (r[i][0] === email) {

      // update photo + lastLogin
      sh.getRange(i + 1, 4).setValue(avatar);
      sh.getRange(i + 1, 6).setValue(now_());

      return;
    }
  }

  // new user
  sh.appendRow([
    email,
    name || "",
    "",
    avatar,
    now_(),
    now_(),
    "user" // default role
  ]);
}


// =================================================
// UPDATE USER PROFILE
// =================================================
function updateUser_(data) {

  if (!data.email) {
    return err_("Missing email");
  }

  const sh = ss_().getSheetByName(CFG.USERS);
  const rows = sh.getDataRange().getValues();

  const headers = rows[0];

  const emailCol = headers.indexOf("email") + 1;
  const phoneCol = headers.indexOf("phone") + 1;
  const nameCol  = headers.indexOf("name") + 1;

  if (!emailCol) return err_("Schema error");

  for (let i = 1; i < rows.length; i++) {

    if (rows[i][emailCol - 1] === data.email) {

      if (phoneCol && data.phone !== undefined) {
        sh.getRange(i + 1, phoneCol).setValue(data.phone);
      }

      if (nameCol && data.name !== undefined) {
        sh.getRange(i + 1, nameCol).setValue(data.name);
      }

      // update lastLogin
      sh.getRange(i + 1, 6).setValue(now_());

      return ok_();
    }
  }

  return err_("User not found");
}


function updatePhone_(email, phone) {

  const sh = ss_().getSheetByName(CFG.USERS);
  const r = sh.getDataRange().getValues();

  for (let i = 1; i < r.length; i++) {

    if (r[i][0] === email) {

      sh.getRange(i + 1, 3).setValue(phone);
      return;
    }
  }
}


/***********************
 * ISR
 ***********************/

function revalidate_() {

  try {

    UrlFetchApp.fetch(prop_("NEXTJS_ISR_ENDPOINT"), {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        secret: prop_("NEXTJS_ISR_SECRET")
      })
    });

  } catch (e) {
    logErr_("isr", "", e);
  }
}


/***********************
 * CATEGORY SYNC
 ***********************/

function rootFolder_() {
  return DriveApp.getFolderById(
    prop_("AUTO_FOLDER_ID")
  );
}


function ensureCatFolder_(name) {

  const root = rootFolder_();

  const it = root.getFoldersByName(name);

  if (it.hasNext()) return it.next();

  return root.createFolder(name);
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


function syncCategoryDropdown_() {

  const cats = listCategories_();

  if (!cats.length) return;

  const sh = ss_().getSheetByName(CFG.ITEMS);

  const rule = SpreadsheetApp
    .newDataValidation()
    .requireValueInList(cats, true)
    .build();

  sh.getRange("C2:C")
    .setDataValidation(rule);
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

/***********************
 * SHEET → DRIVE SYNC
 ***********************/

function onEdit(e) {

  const sh = e.range.getSheet();

  if (sh.getName() !== CFG.ITEMS) return;

  // only Category column
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


function verifySig_(e, body) {

  const ts = e.parameter.ts || e.headers["x-ts"];
  const sig = e.parameter.sig || e.headers["x-sig"];

  if (!ts || !sig) {
    throw new Error("Missing signature");
  }

  // Prevent replay (5 min window)
  const now = Date.now();
  if (Math.abs(now - Number(ts)) > 5 * 60 * 1000) {
    throw new Error("Expired request");
  }

  const secret = prop_("API_SIGNING_SECRET");

  const base = ts + JSON.stringify(body || {});

  const calc = Utilities.computeHmacSha256Signature(base, secret);
  const hash = calc.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');

  if (hash !== sig) {
    throw new Error("Bad signature");
  }
}


/***********************
 * SHEET → DRIVE SYNC
 ***********************/
function onEdit(e) {
  const sh = e.range.getSheet();
  if (sh.getName() !== CFG.ITEMS) return;

  // Only category column (3rd in Items)
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


/***********************
 * BOOTSTRAP
 ***********************/

function bootstrap() {

  setup_();

  syncCategoryDropdown_();

  scanAll_();
  
  ScriptApp.newTrigger("scanAll_")
    .timeBased()
    .everyHours(1)
    .create();
}


