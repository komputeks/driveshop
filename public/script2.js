/*************************************************

DRIVE SHOP — PRODUCTION SCRIPT v6.1 *************************************************/


/* SCRIPT PROPERTIES AUTO_FOLDER_ID GEMINI_KEY NEXTJS_ISR_ENDPOINT NEXTJS_ISR_SECRET API_SIGNING_SECRET SPREADSHEET_URL (optional) */

/* NEXTJS ENV VARIABLES NEXT_PUBLIC_API_BASE_URL NEXTAUTH_URL NEXTAUTH_SECRET GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET NEXTJS_ISR_ENDPOINT NEXTJS_ISR_SECRET API_SIGNING_SECRET */

const CFG = { ITEMS: "Items", EVENTS: "Events", USERS: "Users", ERRORS: "Errors", };

/*************************************************

CORE HELPERS *************************************************/ function props_() { return PropertiesService.getScriptProperties(); } function prop_(k) { const v = props_().getProperty(k); if (!v) throw new Error("Missing prop: " + k); return v; } function now_() { return new Date(); } function uuid_() { return Utilities.getUuid(); }


/*************************************************

SPREADSHEET HELPERS *************************************************/ function ss_() { const url = props_().getProperty("SPREADSHEET_URL"); if (!url) return createAndSaveSheet_(); try { const id = extractSheetId_(url); return SpreadsheetApp.openById(id); } catch { return createAndSaveSheet_(); } } function extractSheetId_(url) { const m = url.match(//d/([a-zA-Z0-9-]+)/); return m ? m[1] : null; } function createAndSaveSheet() { const ss = SpreadsheetApp.create("DriveShop Database"); props_().setProperty("SPREADSHEET_URL", ss.getUrl()); return ss; } function sheet_(name, cols) { let sh = ss_().getSheetByName(name); if (!sh) { sh = ss_().insertSheet(name); sh.appendRow(cols); } return sh; }


function ensureCategory2Column_() { const sh = ss_().getSheetByName(CFG.ITEMS); if (!sh) return; const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0]; if (!headers.includes("category2")) { sh.insertColumnAfter(3); sh.getRange(1,4).setValue("category2"); } } function ensureSigColumn_() { const sh = ss_().getSheetByName(CFG.ITEMS); if (!sh) return; const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0]; if (!headers.includes("_lastSig")) { sh.insertColumnAfter(sh.getLastColumn()); sh.getRange(1, sh.getLastColumn()).setValue("_lastSig"); } }

/*************************************************

SETUP *************************************************/ function setup_() { sheet_(CFG.ITEMS,["id","name","category","category2","cdnUrl","width","height","size","description","createdAt","updatedAt","views","likes","comments"]); sheet_(CFG.EVENTS,["id","itemId","type","value","pageUrl","userEmail","createdAt"]); sheet_(CFG.USERS,["email","name","phone","photo","createdAt","lastLogin"]); sheet_(CFG.ERRORS,["time","jobId","itemId","message","stack"]); }


/*************************************************

LOGGING *************************************************/ function logErr_(job,item,e) { sheet_(CFG.ERRORS,[]).appendRow([now_(),job||"",item||"",e.message||e,e.stack||""]); console.error(e); }


/*************************************************

DRIVE HELPERS *************************************************/ function rootFolder_() { return DriveApp.getFolderById(prop_("AUTO_FOLDER_ID")); } function ensureCatFolder_(name) { const root = rootFolder_(); const it = root.getFoldersByName(name); return it.hasNext() ? it.next() : root.createFolder(name); } function moveToCategory_(file,cat) { const folder = ensureCatFolder_(cat); const parents = file.getParents(); while(parents.hasNext()){ const p = parents.next(); if(p.getId()===rootFolder_().getId()){ file.moveTo(folder); break; } } } function listCategories_() { const root=rootFolder_(); const it=root.getFolders(); const out=[]; while(it.hasNext()){ out.push(it.next().getName()); } return out; }


/*************************************************

DROPDOWN SYNC *************************************************/ function syncCategoryDropdown_() { const cats=listCategories_(); if(!cats.length) return; const sh=ss_().getSheetByName(CFG.ITEMS); const rule=SpreadsheetApp.newDataValidation().requireValueInList(cats,true).build(); sh.getRange("C2:C").setDataValidation(rule); }


function syncCategory2Dropdown_() { const ss=ss_(); let helper=ss.getSheetByName("_cats"); if(!helper){ helper=ss.insertSheet("cats"); helper.hideSheet(); } helper.clear(); helper.appendRow(["category","category2"]); const root=rootFolder(); const lvl1=root.getFolders(); while(lvl1.hasNext()){ const c1=lvl1.next(); const c2it=c1.getFolders(); while(c2it.hasNext()){ helper.appendRow([c1.getName(),c2it.next().getName()]); } } const items=ss.getSheetByName(CFG.ITEMS); const lastRow=Math.max(items.getLastRow(),2); const rule=SpreadsheetApp.newDataValidation().requireFormulaSatisfied('=COUNTIF(FILTER(_cats!$B:$B,_cats!$A:$A=$C2),D2)').setAllowInvalid(false).build(); items.getRange(2,4,lastRow-1).setDataValidation(rule); }

/*************************************************

INDEX / SIGNATURE *************************************************/ function index_() { const sh=ss_().getSheetByName(CFG.ITEMS); const rows=sh.getDataRange().getValues(); const map={}; for(let i=1;i<rows.length;i++){ map[rows[i][0]]={row:i+1,name:rows[i][1],cat1:rows[i][2],cat2:rows[i][3],sig:rows[i][rows[0].length-1]||""}; } return map; } function fileSig_(file,parentId){ return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5,file.getId()+file.getLastUpdated().getTime()+(parentId||""))); } function resolvePath_(file){ const parents=file.getParents(); if(!parents.hasNext()) return {}; const p=parents.next(); const root=rootFolder_(); if(p.getId()===root.getId()) return {cat1:"",cat2:"",parentId:root.getId()}; const gpIt=p.getParents(); if(!gpIt.hasNext()) return {cat1:"",cat2:"",parentId:p.getId()}; const gp=gpIt.next(); if(gp.getId()===root.getId()) return {cat1:p.getName(),cat2:"",parentId:p.getId()}; if(gp.getParents().hasNext()&&gp.getParents().next().getId()===root.getId()) return {cat1:gp.getName(),cat2:p.getName(),parentId:p.getId()}; return {}; } function walkFolders_(folder,out){ const files=folder.getFiles(); while(files.hasNext()){ out.push(files.next()); } const folders=folder.getFolders(); while(folders.hasNext()){ walkFolders_(folders.next(),out); } }


/*************************************************

CATEGORY PARSING / FOLDER CREATION *************************************************/ function parseCategoriesFromFilename_(fileName){ const dash=fileName.indexOf(" - "); if(dash===-1) return {cat1:"Other",cat2:"Other",cleanName:fileName}; const left=fileName.substring(0,dash).trim(); const right=fileName.substring(dash+3).trim(); const parts=left.split(/\s+/); if(parts.length<2) return {cat1:"Other",cat2:"Other",cleanName:fileName}; return {cat1:parts[0],cat2:parts[1],cleanName:right}; } function ensureCategory2Folder_(cat1,cat2){ const root=rootFolder_(); const it1=root.getFoldersByName(cat1); const lvl1=it1.hasNext()?it1.next():root.createFolder(cat1); const it2=lvl1.getFoldersByName(cat2); return it2.hasNext()?it2.next():lvl1.createFolder(cat2); } function renameFileIfNeeded_(file,cleanName){ if(cleanName && file.getName()!==cleanName){ file.setName(cleanName); } }


/*************************************************

IMAGE HELPERS *************************************************/ function cdnUrl_(id){ return "https://lh3.googleusercontent.com/d/"+id+"=w2000"; } function imageSize_(file){ try{ const img=file.getBlob().getBytes(); const info=ImagesService.openImage(img).getSize(); return {w:info.width,h:info.height}; }catch{return {w:0,h:0};} }


/*************************************************

USER HELPERS *************************************************/ function ensureUser_(profile){ if(!profile||!profile.email) return null; const sh=sheet_(CFG.USERS,["email","name","phone","photo","createdAt","lastLogin"]); const rows=sh.getDataRange().getValues(); const email=String(profile.email).toLowerCase().trim(); if(!email.includes("@")) return null; const avatar=profile.photo||"https://www.gravatar.com/avatar/?d=mp&s=200"; for(let i=1;i<rows.length;i++){ if(rows[i][0]===email){ sh.getRange(i+1,2).setValue(profile.name||rows[i][1]); sh.getRange(i+1,4).setValue(avatar); sh.getRange(i+1,6).setValue(now_()); return {email,name:profile.name,phone:rows[i][2],photo:avatar}; } } sh.appendRow([email,profile.name||"","",avatar,now_(),now_()]); return {email,name:profile.name,phone:"",photo:avatar}; } function getUser_(email){ if(!email) return err_("Missing email"); const sh=sheet_(CFG.USERS,[]); const rows=sh.getDataRange().getValues(); for(let i=1;i<rows.length;i++){ if(rows[i][0]===email){ return json_({ok:true,user:{email:rows[i][0],name:rows[i][1],phone:rows[i][2],photo:rows[i][3],createdAt:rows[i][4],lastLogin:rows[i][5]}}); } } return err_("User not found"); } function updateUser_(data){ if(!data||!data.email) return err_("Missing email"); const sh=sheet_(CFG.USERS,[]); const rows=sh.getDataRange().getValues(); for(let i=1;i<rows.length;i++){ if(rows[i][0]===data.email){ if(data.name!==undefined) sh.getRange(i+1,2).setValue(data.name); if(data.phone!==undefined) sh.getRange(i+1,3).setValue(data.phone); sh.getRange(i+1,6).setValue(now_()); return json_({ok:true}); } } return err_("User not found"); } function upsertUser_(email,name,photo){ if(!email) throw new Error("Missing email"); const sh=sheet_(CFG.USERS,["email","name","phone","photo","createdAt","lastLogin"]); const rows=sh.getDataRange().getValues(); const cleanEmail=String(email).toLowerCase().trim(); const avatar=photo||"https://www.gravatar.com/avatar/?d=mp&s=200"; for(let i=1;i<rows.length;i++){ if(rows[i][0]===cleanEmail){ sh.getRange(i+1,2).setValue(name||rows[i][1]); sh.getRange(i+1,4).setValue(avatar); sh.getRange(i+1,6).setValue(now_()); return; } } sh.appendRow([cleanEmail,name||"","",avatar,now_(),now_()]); }


/*************************************************

EVENTS *************************************************/ function addEvent_(itemId,type,val,page,email){ sheet_(CFG.EVENTS,[]).appendRow([uuid_(),itemId,type,val||"",page||"",email||"",now_()]); bumpStats_(itemId,type); } function bumpStats_(id,type){ const sh=ss_().getSheetByName(CFG.ITEMS); const r=sh.getDataRange().getValues(); for(let i=1;i<r.length;i++){ if(r[i][0]===id){ const col=type==="view"?11:type==="like"?12:13; const cell=sh.getRange(i+1,col); cell.setValue((cell.getValue()||0)+1); return; } } }


/*************************************************

ITEMS API *************************************************/ function getItems_(params){ const q=(params.q||"").toLowerCase(); const cat=params.cat||""; const sh=ss_().getSheetByName(CFG.ITEMS); const rows=sh.getDataRange().getValues(); const out=[]; for(let i=1;i<rows.length;i++){ const r=rows[i]; const item={id:r[0],name:r[1],category:r[2],cdnUrl:r[3],width:r[4],height:r[5],size:r[6],description:r[7],createdAt:r[8],updatedAt:r[9],views:r[10],likes:r[11],comments:r[12]}; if(q&&!item.name.toLowerCase().includes(q)) continue; if(cat&&item.category!==cat) continue; out.push(item); } return {items:out}; }


/*************************************************

JSON RESPONSE HELPERS *************************************************/ function json_(obj){ return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); } function ok_(){ return json_({ok:true}); } function err_(msg){ return json_({ok:false,error:msg}); }


/*************************************************

BOOTSTRAP *************************************************/ function bootstrap(){ setup_(); ensureCategory2Column_(); syncCategoryDropdown_(); syncCategory2Dropdown_(); scanAll_(); normalizeAllRows_(); ScriptApp.getProjectTriggers().forEach(t=>ScriptApp.deleteTrigger(t)); ScriptApp.newTrigger("scanAll_").timeBased().everyMinutes(5).create(); }