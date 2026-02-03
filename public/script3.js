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
 * CORE UTILITIES
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
 * SPREADSHEET HELPERS
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
    if (cols && cols.length) sh.appendRow(cols);
  }

  return sh;
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
 * SETUP SHEETS
 *************************************************/

function setup_() {
  sheet_(CFG.ITEMS, [
    "id",
    "name",
    "category",   // category-1
    "category2",  // category-2
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
 * IMAGE / CDN / GEMINI
 *************************************************/

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

// Gemini API — describe image
function describeImage_(url) {
  const key = prop_("GEMINI_KEY");
  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=" +
    key;

  const payload = {
    contents: [
      {
        parts: [
          { text: "Describe this image briefly:" },
          { inlineData: { mimeType: "image/jpeg", data: url } }
        ]
      }
    ]
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
 * DRIVE HELPERS
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
  while (it.hasNext()) out.push(it.next().getName());
  return out;
}


/*************************************************
 * FILE / CATEGORY / SIGNATURE HELPERS
 *************************************************/

function parseFilename_(name) {
  // Expect: "Category1-Category2-Name.ext"
  const parts = name.split("-");
  const extIndex = parts[parts.length - 1].lastIndexOf(".");
  let baseName = parts[parts.length - 1];
  let ext = "";
  if (extIndex >= 0) {
    ext = baseName.slice(extIndex + 1);
    baseName = baseName.slice(0, extIndex);
  }

  return {
    category: parts[0] || "Uncategorized",
    category2: parts[1] || "",
    name: baseName,
    ext: ext,
  };
}

function fileSig_(file) {
  return [file.getId(), file.getSize(), file.getDateCreated().getTime()].join("_");
}

function ensureFoldersForFile_(file, cat1, cat2) {
  let folder = ensureCatFolder_(cat1);
  if (cat2) folder = ensureSubfolder_(folder, cat2);
  file.moveTo(folder);
}

function ensureSubfolder_(parent, name) {
  const it = parent.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return parent.createFolder(name);
}

/*************************************************
 * ROW / ITEM NORMALIZATION
 *************************************************/

function normalizeRow_(row) {
  return {
    id: row[0],
    name: row[1],
    category: row[2],
    category2: row[3],
    cdnUrl: row[4],
    width: row[5],
    height: row[6],
    size: row[7],
    description: row[8],
    createdAt: row[9],
    updatedAt: row[10],
    views: row[11],
    likes: row[12],
    comments: row[13],
    _lastSig: row[14],
  };
}

function appendOrUpdateRow_(sh, item) {
  const data = sh.getDataRange().getValues();
  const header = data[0];
  const idIndex = header.indexOf("id");

  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === item.id) {
      sh.getRange(i + 1, 1, 1, header.length).setValues([Object.values(item)]);
      return;
    }
  }

  sh.appendRow(Object.values(item));
}

/*************************************************
 * SCAN / INDEX LOGIC
 *************************************************/

function scanAll_() {
  const root = rootFolder_();
  const shItems = sheet_(CFG.ITEMS);

  const folders = listCategories_().map(name => root.getFoldersByName(name).next());
  const files = [];

  folders.forEach(f => {
    const it = f.getFiles();
    while (it.hasNext()) {
      files.push(it.next());
    }

    // subfolders
    const subIt = f.getFolders();
    while (subIt.hasNext()) {
      const sf = subIt.next();
      const sfit = sf.getFiles();
      while (sfit.hasNext()) files.push(sfit.next());
    }
  });

  files.forEach(file => {
    try {
      const fn = parseFilename_(file.getName());
      const sig = fileSig_(file);

      let item = {
        id: file.getId(),
        name: fn.name,
        category: fn.category,
        category2: fn.category2,
        cdnUrl: cdnUrl_(file.getId()),
        width: 0,
        height: 0,
        size: file.getSize(),
        description: "",
        createdAt: file.getDateCreated(),
        updatedAt: file.getLastUpdated(),
        views: 0,
        likes: 0,
        comments: 0,
        _lastSig: sig,
      };

      // Check if existing row has same signature
      const data = shItems.getDataRange().getValues();
      const existing = data.find(r => r[0] === file.getId());
      if (existing && existing[14] === sig) return;

      // Image dimensions
      if (file.getMimeType().startsWith("image/")) {
        const sz = imageSize_(file);
        item.width = sz.w;
        item.height = sz.h;
      }

      // Auto description
      item.description = describeImage_(item.cdnUrl);

      appendOrUpdateRow_(shItems, item);
    } catch (e) {
      logErr_("scanAll", file.getName(), e);
    }
  });
}

/*************************************************
 * SINGLE FILE INDEXER
 *************************************************/

function indexFile_(file) {
  try {
    const fn = parseFilename_(file.getName());
    const sig = fileSig_(file);

    const shItems = sheet_(CFG.ITEMS);

    let item = {
      id: file.getId(),
      name: fn.name,
      category: fn.category,
      category2: fn.category2,
      cdnUrl: cdnUrl_(file.getId()),
      width: 0,
      height: 0,
      size: file.getSize(),
      description: "",
      createdAt: file.getDateCreated(),
      updatedAt: file.getLastUpdated(),
      views: 0,
      likes: 0,
      comments: 0,
      _lastSig: sig,
    };

    if (file.getMimeType().startsWith("image/")) {
      const sz = imageSize_(file);
      item.width = sz.w;
      item.height = sz.h;
    }

    item.description = describeImage_(item.cdnUrl);
    appendOrUpdateRow_(shItems, item);

    ensureFoldersForFile_(file, fn.category, fn.category2);
  } catch (e) {
    logErr_("indexFile", file.getName(), e);
  }
}


