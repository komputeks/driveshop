/******************************************************
 * CONFIG
 ******************************************************/

const CFG = {
  ROOT: "ROOT_FOLDER_ID", // <-- SET IN SCRIPT PROPERTIES
  ITEMS: "Items",
  EVENTS: "Events",
  USERS: "Users",
  ERRORS: "Errors",
  CATS: "Categories",
  OTHER: "Other",
};


/******************************************************
 * CORE
 ******************************************************/

function ss_() {
  const props = PropertiesService.getScriptProperties();
  let url = props.getProperty("SPREADSHEET_URL");

  if (url) return SpreadsheetApp.openByUrl(url);

  const ss = SpreadsheetApp.create("DriveShop DB");
  props.setProperty("SPREADSHEET_URL", ss.getUrl());
  return ss;
}

function rootFolder_() {
  const id = PropertiesService
    .getScriptProperties()
    .getProperty("ROOT_FOLDER_ID");

  if (!id) throw new Error("Missing ROOT_FOLDER_ID");

  return DriveApp.getFolderById(id);
}

function err_(msg, e) {
  try {
    ss_()
      .getSheetByName(CFG.ERRORS)
      .appendRow([
        new Date(),
        msg,
        e?.stack || e || "",
      ]);
  } catch {}

  return json_({ error: msg });
}

function json_(o) {
  return ContentService
    .createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}


/******************************************************
 * BOOTSTRAP
 ******************************************************/

function bootstrap() {
  const ss = ss_();

  ensureSheet_(CFG.ITEMS, [
    "id",
    "title",
    "category",
    "url",
    "width",
    "height",
    "created",
  ]);

  ensureSheet_(CFG.EVENTS, [
    "id",
    "itemId",
    "type",
    "text",
    "meta",
    "email",
    "at",
  ]);

  ensureSheet_(CFG.USERS, [
    "email",
    "name",
    "phone",
    "created",
  ]);

  ensureSheet_(CFG.ERRORS, [
    "at",
    "msg",
    "stack",
  ]);

  ensureSheet_(CFG.CATS, ["name"]);

  ensureOtherFolder_();
  syncCategoryDropdown_();
  scanAll_();
}

function ensureSheet_(name, headers) {
  const ss = ss_();
  let sh = ss.getSheetByName(name);

  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
  }
}

function ensureOtherFolder_() {
  ensureCatFolder_(CFG.OTHER);
}


/******************************************************
 * CATEGORY FOLDERS
 ******************************************************/

function getCategoryFolders_() {
  const root = rootFolder_();
  const it = root.getFolders();

  const map = {};

  while (it.hasNext()) {
    const f = it.next();
    map[f.getName()] = f;
  }

  if (!map[CFG.OTHER]) {
    map[CFG.OTHER] = root.createFolder(CFG.OTHER);
  }

  return map;
}

function listCategories_() {
  return Object.keys(getCategoryFolders_());
}

function ensureCatFolder_(name) {
  const map = getCategoryFolders_();
  if (map[name]) return map[name];

  return rootFolder_().createFolder(name);
}


/******************************************************
 * IMAGE HELPERS
 ******************************************************/

function imageSize_(file) {
  try {
    const blob = file.getBlob();
    const img = ImagesService.openImage(blob);
    return {
      w: img.getWidth(),
      h: img.getHeight(),
    };
  } catch {
    return { w: 0, h: 0 };
  }
}


/******************************************************
 * INDEX
 ******************************************************/

function index_() {
  const sh = ss_().getSheetByName(CFG.ITEMS);
  const rows = sh.getDataRange().getValues();

  const map = {};

  rows.slice(1).forEach(r => {
    map[r[0]] = true;
  });

  return map;
}


/******************************************************
 * SCAN + SYNC
 ******************************************************/

function scanAll_() {
  try {
    const seen = index_();
    const ss = ss_();
    const sh = ss.getSheetByName(CFG.ITEMS);

    const folders = [
      rootFolder_(),
      ...Object.values(getCategoryFolders_()),
    ];

    folders.forEach(folder => {
      const files = folder.getFiles();

      while (files.hasNext()) {
        const f = files.next();

        if (!f.getMimeType().startsWith("image/")) continue;
        if (seen[f.getId()]) continue;

        const size = imageSize_(f);
        const cat = inferCategory_(f);

        moveToCategory_(f, cat);

        sh.appendRow([
          f.getId(),
          f.getName(),
          cat,
          "/item/" + f.getId(),
          size.w,
          size.h,
          new Date(),
        ]);
      }
    });

    removeDeletedFiles_();
    syncCategoryDropdown_();

  } catch (e) {
    err_("scanAll", e);
  }
}


function inferCategory_(file) {
  const cats = listCategories_();
  let it = file.getParents();

  while (it.hasNext()) {
    const p = it.next();
    if (cats.includes(p.getName())) {
      return p.getName();
    }
  }

  return CFG.OTHER;
}


function moveToCategory_(file, cat) {
  const target = ensureCatFolder_(cat);
  const root = rootFolder_();

  const parents = file.getParents();

  while (parents.hasNext()) {
    const p = parents.next();
    if (p.getId() !== root.getId()) {
      p.removeFile(file);
    }
  }

  target.addFile(file);
}


/******************************************************
 * DELETE SYNC
 ******************************************************/

function removeDeletedFiles_() {
  const ss = ss_();
  const sh = ss.getSheetByName(CFG.ITEMS);
  const rows = sh.getDataRange().getValues();

  const alive = {};
  const root = rootFolder_();

  const it = root.getFiles();
  while (it.hasNext()) {
    alive[it.next().getId()] = true;
  }

  for (let i = rows.length - 1; i > 0; i--) {
    const id = rows[i][0];
    if (!alive[id]) {
      sh.deleteRow(i + 1);
    }
  }
}


/******************************************************
 * DRIVE → SHEET WATCHER
 ******************************************************/

function syncDriveChanges_() {
  try {
    const ss = ss_();
    const sh = ss.getSheetByName(CFG.ITEMS);
    const rows = sh.getDataRange().getValues();

    const cats = listCategories_();

    rows.slice(1).forEach((r, i) => {
      const id = r[0];

      try {
        const f = DriveApp.getFileById(id);
        let it = f.getParents();
        let found = CFG.OTHER;

        while (it.hasNext()) {
          const p = it.next();
          if (cats.includes(p.getName())) {
            found = p.getName();
          }
        }

        if (found !== r[2]) {
          sh.getRange(i + 2, 3).setValue(found);
        }

      } catch {}
    });

  } catch (e) {
    err_("syncDriveChanges", e);
  }
}


/******************************************************
 * SHEET → DRIVE
 ******************************************************/

function onEdit(e) {
  try {
    const r = e.range;
    const sh = r.getSheet();

    if (sh.getName() !== CFG.ITEMS) return;
    if (r.getColumn() !== 3) return;
    if (r.getRow() === 1) return;

    const id = sh.getRange(r.getRow(), 1).getValue();
    const cat = r.getValue();

    const f = DriveApp.getFileById(id);
    moveToCategory_(f, cat);

  } catch (e) {
    err_("onEdit", e);
  }
}


/******************************************************
 * DROPDOWN
 ******************************************************/

function syncCategoryDropdown_() {
  const cats = listCategories_();

  const sh = ss_().getSheetByName(CFG.ITEMS);

  const rule = SpreadsheetApp
    .newDataValidation()
    .requireValueInList(cats, true)
    .build();

  sh.getRange("C2:C")
    .clearDataValidations()
    .setDataValidation(rule);
}


/******************************************************
 * USERS
 ******************************************************/

function getUser_(email) {
  const sh = ss_().getSheetByName(CFG.USERS);
  const rows = sh.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === email) {
      return rows[i];
    }
  }

  return null;
}

function upsertUser_(email, name) {
  const sh = ss_().getSheetByName(CFG.USERS);
  const rows = sh.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === email) {
      return;
    }
  }

  sh.appendRow([
    email,
    name || "",
    "",
    new Date(),
  ]);
}

function updateUser_(email, data) {
  const sh = ss_().getSheetByName(CFG.USERS);
  const rows = sh.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === email) {
      sh.getRange(i + 1, 2).setValue(data.name || "");
      sh.getRange(i + 1, 3).setValue(data.phone || "");
      return true;
    }
  }

  return false;
}


/******************************************************
 * EVENTS / ACTIVITY
 ******************************************************/

function addEvent_(itemId, type, text, meta, email) {
  ss_()
    .getSheetByName(CFG.EVENTS)
    .appendRow([
      Utilities.getUuid(),
      itemId,
      type,
      text || "",
      meta || "",
      email || "",
      new Date(),
    ]);
}


function getUserActivity_(email) {

  if (!email) return err_("Missing email");

  const evSh = ss_().getSheetByName(CFG.EVENTS);
  const itSh = ss_().getSheetByName(CFG.ITEMS);

  const evRows = evSh.getDataRange().getValues();
  const itRows = itSh.getDataRange().getValues();

  const items = {};

  for (let i = 1; i < itRows.length; i++) {
    items[itRows[i][0]] = {
      id: itRows[i][0],
      name: itRows[i][1],
      url: "/item/" + itRows[i][0],
    };
  }

  const likes = {};
  const comments = [];

  for (let i = evRows.length - 1; i > 0; i--) {

    const row = evRows[i];
    if (row[5] !== email) continue;

    const itemId = row[1];
    const type = row[2];

    if (type === "like") {
      if (!likes[itemId]) {
        likes[itemId] = items[itemId];
      }
    }

    if (type === "comment") {
      comments.push({
        item: items[itemId],
        text: row[3],
        at: row[6],
      });
    }

    if (
      Object.keys(likes).length >= 50 &&
      comments.length >= 50
    ) break;
  }

  return json_({
    likes: Object.values(likes),
    comments,
  });
}


/******************************************************
 * API ROUTER
 ******************************************************/

function doPost(e) {
  try {
    const p = e.parameter.path || "";
    const body = JSON.parse(e.postData.contents || "{}");

    switch (p) {

      case "user/get":
        return json_(getUser_(body.email));

      case "user/update":
        return json_(updateUser_(body.email, body));

      case "user/activity":
        return getUserActivity_(body.email);

      case "event/add":
        addEvent_(
          body.itemId,
          body.type,
          body.text,
          body.meta,
          body.email
        );
        return json_({ ok: true });

      default:
        return err_("Unknown path " + p);
    }

  } catch (e) {
    return err_("doPost", e);
  }
}