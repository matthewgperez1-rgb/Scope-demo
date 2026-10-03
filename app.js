const APP_VERSION='0.1.2';
const PACKAGE_VERSION='1.0';
const DB_NAME='scope-mobile-v1';
const STORE='receipts';
let db;
let editingId=null;
let stream=null;
let detector=null;
let scanning=false;

const $=id=>document.getElementById(id);
const fields=['barcodeRaw','sdn','tcn','niin','qty','condition','packages','notes'];

function openDb(){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB_NAME,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'id'})};
  req.onsuccess=()=>{db=req.result;resolve(db)};
  req.onerror=()=>reject(req.error);
 });
}
function tx(mode='readonly'){return db.transaction(STORE,mode).objectStore(STORE)}
function getAll(){return new Promise((res,rej)=>{const r=tx().getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)})}
function put(v){return new Promise((res,rej)=>{const r=tx('readwrite').put(v);r.onsuccess=()=>res(v);r.onerror=()=>rej(r.error)})}
function del(id){return new Promise((res,rej)=>{const r=tx('readwrite').delete(id);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
function clearAll(){return new Promise((res,rej)=>{const r=tx('readwrite').clear();r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}

function uid(){return crypto.randomUUID?crypto.randomUUID():'m-'+Date.now()+'-'+Math.random().toString(16).slice(2)}
function normalize(v){return (v||'').trim()}
function labeledValue(raw,label){
 const m=raw.match(new RegExp('(?:^|[\\s|,;])'+label+'\\s*[:=#-]?\\s*([A-Za-z0-9-]+)','i'));
 return m?m[1]:'';
}
function autoExtract(raw){
 const patch={};
 for(const [label,id] of [['SDN','sdn'],['TCN','tcn'],['NIIN','niin']]){
  const val=labeledValue(raw,label);
  if(val && !$(id).value)patch[id]=val;
 }
 Object.entries(patch).forEach(([id,v])=>$(id).value=v);
 return patch;
}
function formRecord(){
 return {
  id:editingId||uid(),
  barcodeRaw:normalize($('barcodeRaw').value),
  sdn:normalize($('sdn').value).toUpperCase(),
  tcn:normalize($('tcn').value).toUpperCase(),
  niin:normalize($('niin').value).replace(/\s+/g,''),
  qtyReceived:$('qty').value===''?null:Number($('qty').value),
  conditionCode:normalize($('condition').value).toUpperCase(),
  packageCount:$('packages').value===''?null:Number($('packages').value),
  notes:normalize($('notes').value),
  capturedAt:new Date().toISOString(),
  source:'SCOPE_MOBILE',
  matchStatus:'AWAITING_DASF_MATCH'
 };
}
function validateRecord(r){
 const errs=[];
 if(!r.barcodeRaw && !r.sdn && !r.tcn && !r.niin)errs.push('Scan a barcode or enter at least one identifier.');
 if(r.qtyReceived!==null && (!Number.isFinite(r.qtyReceived)||r.qtyReceived<0))errs.push('Quantity must be zero or greater.');
 if(r.packageCount!==null && (!Number.isFinite(r.packageCount)||r.packageCount<0))errs.push('Package count must be zero or greater.');
 return errs;
}
function showNotice(msg,cls=''){
 const el=$('scanStatus');el.textContent=msg;el.className='notice '+cls;
}
function clearForm(){
 editingId=null;fields.forEach(id=>$(id).value='');$('saveBtn').textContent='Add to Batch';$('scanStatus').classList.add('hidden');
}
async function duplicateWarning(r){
 const rows=await getAll();
 return rows.find(x=>x.id!==r.id && ((r.barcodeRaw&&x.barcodeRaw===r.barcodeRaw)||(r.sdn&&x.sdn===r.sdn)));
}
async function save(){
 const r=formRecord();const errs=validateRecord(r);
 if(errs.length)return showNotice(errs.join(' '),'bad');
 const dup=await duplicateWarning(r);
 if(dup && !confirm('Possible duplicate scan/SDN already exists in this batch. Save anyway?'))return;
 if(editingId){
  const old=(await getAll()).find(x=>x.id===editingId);
  if(old)r.createdAt=old.createdAt||old.capturedAt;
 }
 r.updatedAt=new Date().toISOString();
 await put(r);clearForm();await render();
 showNotice('Receipt draft saved to this device.','');
}
async function render(){
 const rows=(await getAll()).sort((a,b)=>new Date(b.capturedAt)-new Date(a.capturedAt));
 $('batchCount').textContent=rows.length;
 $('emptyState').classList.toggle('hidden',rows.length>0);
 const box=$('batchList');box.innerHTML='';
 for(const r of rows){
  const n=$('rowTemplate').content.cloneNode(true);
  const title=r.sdn||r.tcn||r.niin||'Unidentified scan';
  n.querySelector('.receipt-title').textContent=title;
  n.querySelector('.receipt-meta').textContent=[r.qtyReceived!==null?'Qty '+r.qtyReceived:'Qty not entered',r.conditionCode?'CC '+r.conditionCode:'CC not entered',new Date(r.capturedAt).toLocaleString()].join(' · ');
  n.querySelector('.receipt-note').textContent=r.barcodeRaw?'Scan: '+r.barcodeRaw:'Manual record';
  n.querySelector('[data-action="edit"]').onclick=()=>edit(r.id);
  n.querySelector('[data-action="delete"]').onclick=async()=>{if(confirm('Delete this draft?')){await del(r.id);await render()}};
  box.appendChild(n);
 }
}
async function edit(id){
 const r=(await getAll()).find(x=>x.id===id);if(!r)return;
 editingId=id;
 $('barcodeRaw').value=r.barcodeRaw||'';$('sdn').value=r.sdn||'';$('tcn').value=r.tcn||'';$('niin').value=r.niin||'';
 $('qty').value=r.qtyReceived??'';$('condition').value=r.conditionCode||'';$('packages').value=r.packageCount??'';$('notes').value=r.notes||'';
 $('saveBtn').textContent='Update Draft';window.scrollTo({top:0,behavior:'smooth'});
}
async function sha256(text){
 const bytes=new TextEncoder().encode(text);const digest=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function buildPackage(){
 const records=(await getAll()).sort((a,b)=>new Date(a.capturedAt)-new Date(b.capturedAt));
 const payload={packageVersion:PACKAGE_VERSION,packageType:'mobile-receiving-handoff',sourceApp:'SCOPE Mobile',sourceAppVersion:APP_VERSION,exportedAt:new Date().toISOString(),recordCount:records.length,records};
 payload.recordsSha256=await sha256(JSON.stringify(records));
 return payload;
}
async function preview(){
 const p=await buildPackage();$('jsonPreview').textContent=JSON.stringify(p,null,2);$('jsonDialog').showModal();
}
async function exportPackage(){
 const p=await buildPackage();
 if(!p.records.length)return showNotice('Nothing to export yet.','warn');
 const text=JSON.stringify(p,null,2);
 const stamp=new Date().toISOString().replace(/[:.]/g,'-');
 const name='SCOPE_MOBILE_HANDOFF_'+stamp+'.scopepkg';
 const file=new File([text],name,{type:'application/json'});
 if(navigator.canShare && navigator.canShare({files:[file]})){
  try{await navigator.share({title:'SCOPE Mobile Handoff',text:'Import this package into operational SCOPE.',files:[file]});return}catch(e){if(e.name==='AbortError')return}
 }
 const a=document.createElement('a');a.href=URL.createObjectURL(file);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
async function captureBarcode(raw){
 raw=String(raw||'').trim();
 if(!raw)return;
 $('barcodeRaw').value=raw;
 autoExtract(raw);
 await stopScan();
 showNotice('Barcode captured. Verify the identifiers, quantity, and condition before saving.','');
}

async function startHtml5Scan(){
 html5Scanner=new Html5Qrcode('reader',false);
 scannerMode='html5';
 $('cameraWrap').classList.remove('hidden');
 $('reader').classList.remove('hidden');
 $('camera').classList.add('hidden');
 $('scanBox').classList.add('hidden');
 scanning=true;
 await html5Scanner.start(
  {facingMode:'environment'},
  {fps:12,qrbox:(w,h)=>({width:Math.floor(w*.88),height:Math.max(100,Math.floor(h*.34))}),aspectRatio:1.333334},
  decodedText=>captureBarcode(decodedText),
  ()=>{}
 );
}

async function startNativeScan(){
 detector=new BarcodeDetector({formats:['code_128','code_39','code_93','qr_code','data_matrix','itf','codabar','ean_13','ean_8','upc_a','upc_e']});
 stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
 scannerMode='native';
 $('camera').srcObject=stream;
 $('reader').classList.add('hidden');
 $('camera').classList.remove('hidden');
 $('scanBox').classList.remove('hidden');
 $('cameraWrap').classList.remove('hidden');
 await $('camera').play();
 scanning=true;
 scanLoop();
}

async function startScan(){
 showNotice('Starting rear camera…','');
 try{
  if(window.Html5Qrcode){
   await startHtml5Scan();
   showNotice('Camera ready. Hold the barcode inside the scan area.','');
   return;
  }
  if('BarcodeDetector' in window){
   await startNativeScan();
   showNotice('Camera ready. Hold the barcode inside the scan area.','');
   return;
  }
  showNotice('The scanner component did not load. Open SCOPE Mobile once while online, then try again. Manual entry remains available.','warn');
 }catch(e){
  console.error(e);
  await stopScan();
  const name=e?.name||'';
  if(name==='NotAllowedError'||/permission|denied/i.test(String(e?.message||e))){
   showNotice('Camera permission was denied. Allow camera access for this site in iPhone Settings/Safari, then tap Scan Barcode again.','bad');
  }else if(name==='NotFoundError'){
   showNotice('No usable camera was found on this device.','bad');
  }else{
   showNotice('Camera could not start: '+(e?.message||e),'bad');
  }
 }
}
async function scanLoop(){
 if(!scanning||!detector||scannerMode!=='native')return;
 try{
  const codes=await detector.detect($('camera'));
  if(codes.length){await captureBarcode(codes[0].rawValue||'');return;}
 }catch(e){}
 requestAnimationFrame(scanLoop);
}
async function stopScan(){
 scanning=false;
 if(html5Scanner){
  try{if(html5Scanner.isScanning)await html5Scanner.stop()}catch(e){}
  try{html5Scanner.clear()}catch(e){}
  html5Scanner=null;
 }
 if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}
 detector=null;scannerMode=null;
 $('camera').srcObject=null;
 $('reader').innerHTML='';
 $('reader').classList.add('hidden');
 $('camera').classList.remove('hidden');
 $('scanBox').classList.remove('hidden');
 $('cameraWrap').classList.add('hidden');
}
function setConnectivity(){
 $('offlineBadge').textContent=navigator.onLine?'Online / Offline-ready':'Offline';
 $('offlineBadge').style.color=navigator.onLine?'var(--accent)':'var(--warn)';
}
$('barcodeRaw').addEventListener('change',e=>autoExtract(e.target.value));
$('saveBtn').onclick=save;$('clearBtn').onclick=clearForm;$('scanBtn').onclick=startScan;$('stopScanBtn').onclick=stopScan;
$('previewBtn').onclick=preview;$('exportBtn').onclick=exportPackage;$('closeJsonBtn').onclick=()=>$('jsonDialog').close();
$('newBatchBtn').onclick=async()=>{if(confirm('Clear every draft in this batch?')){await clearAll();clearForm();await render()}};
window.addEventListener('online',setConnectivity);window.addEventListener('offline',setConnectivity);
window.addEventListener('beforeunload',stopScan);
(async()=>{await openDb();await render();setConnectivity();if('serviceWorker' in navigator)navigator.serviceWorker.register('./service-worker.js').catch(()=>{})})();
