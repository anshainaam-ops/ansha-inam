// Roman Urdu: raseed ka design (Handwritten receipt picture ke mutabiq: A4 + Thermal 80mm/58mm support, multiple products dynamic rows, aur QR code raseed ke andar).
(function(){
const o=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'],t=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
const w2=n=>n<20?o[n]:t[n/10|0]+(n%10?' '+o[n%10]:''),w3=n=>(n>99?o[n/100|0]+' Hundred'+(n%100?' ':''):'')+(n%100?w2(n%100):'');
const words=n=>{n=Math.round(+n||0);if(!n)return'Zero Rupees Only';let s='';for(const[v,l]of[[1e7,'Crore'],[1e5,'Lakh'],[1e3,'Thousand']])if(n>=v){s+=w3(n/v|0)+' '+l+' ';n%=v}return(s+(n?w3(n):'')).trim()+' Rupees Only'};
const fm=n=>(+n||0).toLocaleString('en-PK',{maximumFractionDigits:2}),E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const css=`.pgs{display:block;width:100%}.pg{width:210mm;min-height:297mm;margin:8px auto;padding:8mm;background:#fff;color:#111;display:block;box-sizing:border-box;break-after:page;font-family:Inter,'Noto Nastaliq Urdu',Arial,sans-serif}
.pg.grid4{display:grid;grid-template:1fr 1fr/1fr 1fr;gap:4mm;padding:5mm}
.pg.thermal80{width:80mm;min-height:auto;padding:3mm;margin:8px auto}
.pg.thermal58{width:58mm;min-height:auto;padding:2mm;margin:8px auto;font-size:10px}
.rc{position:relative;border:2px solid #14365d;border-radius:8px;padding:6mm;display:flex;flex-direction:column;gap:2.2mm;font-size:12px;overflow:hidden;background:#fff;color:#111;text-align:left;box-sizing:border-box;max-width:100%}
.pg.thermal80 .rc,.pg.thermal58 .rc{padding:3mm;border:1px dashed #333;border-radius:4px;font-size:11px}
.rc .rh{display:flex;gap:3.5mm;align-items:center;justify-content:space-between;border-bottom:2px solid #14365d;padding-bottom:2.5mm;color:#14365d;flex-wrap:wrap}
.rc .rh-left{display:flex;gap:3mm;align-items:center}
.rc .rh img{width:14mm;height:14mm;border-radius:50%;object-fit:cover;border:1.5px solid #cc9b25}
.pg.thermal80 .rc .rh img,.pg.thermal58 .rc .rh img{width:10mm;height:10mm}
.rc .rh-title b{font-size:15px;letter-spacing:.3px;display:block;color:#14365d}
.pg.thermal80 .rc .rh-title b,.pg.thermal58 .rc .rh-title b{font-size:12px}
.rc .rh-title small{color:#444;font-size:10.5px;display:block}
.rc .rh-contacts{text-align:right;font-size:10.5px;color:#222;line-height:1.4}
.rc h4{margin:.5mm 0;text-align:center;letter-spacing:.8px;color:#8f6606;font-size:12.5px;background:#fcf8ec;padding:1.2mm;border:1px solid #e6d39a;border-radius:4px}
.rc-meta{display:grid;grid-template-columns:1fr 1fr;gap:1.5mm 4mm;border:1px solid #cfd8e3;border-radius:6px;padding:2.2mm 3mm;background:#f8fafc;font-size:11.5px}
.pg.thermal80 .rc-meta,.pg.thermal58 .rc-meta{grid-template-columns:1fr;padding:1.5mm 2mm;font-size:10.5px}
.rc-meta div{display:flex;justify-content:space-between;gap:6px}
.rc-meta span{color:#555}.rc-meta b{color:#111}
.rc-tbl{width:100%;border-collapse:collapse;margin-top:1mm;font-size:11.5px}
.rc-tbl th{background:#14365d;color:#fff;padding:1.8mm 2mm;font-size:10.5px;text-align:left;border:1px solid #14365d;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.rc-tbl th.r,.rc-tbl td.r{text-align:right}
.rc-tbl td{padding:1.6mm 2mm;border:1px solid #cbd5e1;color:#111;background:#fff}
.rc-tbl tbody tr:nth-child(even) td{background:#f8fafc}
.rc-bot{display:grid;grid-template-columns:1.15fr .85fr;gap:3mm;margin-top:1.5mm;align-items:stretch}
.pg.thermal80 .rc-bot,.pg.thermal58 .rc-bot{grid-template-columns:1fr}
.rc-totals{border:1.5px solid #14365d;border-radius:6px;padding:2mm 3mm;background:#fcfdff;display:flex;flex-direction:column;gap:1.2mm}
.rc-totals .rl{display:flex;justify-content:space-between;gap:6px;border-bottom:1px dashed #dde3eb;padding:.7mm 0;font-size:11.5px}
.rc-totals .rl:last-child{border-bottom:0}
.rc-totals .rl.grand{font-size:13.5px;font-weight:700;color:#14365d;border-bottom:1.5px solid #14365d;padding-bottom:1mm}
.rc-totals .rl.rem b{color:#c62828}
.rc .wd{font-size:10px;color:#444;font-style:italic;margin-top:.5mm}
.rc-qrbox{border:1px solid #cfd8e3;border-radius:6px;padding:2mm;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1mm;background:#fff;text-align:center}
.rc-qrbox .qr svg{width:24mm;height:24mm;display:block}
.rc-qrbox small{color:#444;font-size:9.5px;line-height:1.2}
.rc-notes{border:1px dashed #9aa;border-radius:5px;padding:1.6mm 2.5mm;font-size:10.8px;color:#333;background:#fffef8}
.rc .sg{display:flex;justify-content:space-between;align-items:flex-end;margin-top:3mm;padding-top:2.5mm;border-top:1px solid #999;color:#444;font-size:10.5px}
.rc .sg span{border-top:1px solid #333;padding-top:1mm;min-width:34mm;text-align:center}
.rc .stamp{position:absolute;top:38%;left:14%;transform:rotate(-18deg);font-size:28px;font-weight:700;color:#c62828;border:3px solid #c62828;padding:2px 12px;opacity:.75;background:#fff8}
#modal>.card.rw{max-width:none;width:max-content;min-width:min(100%,222mm);background:#475569;padding:10px;border:0}.rbar{padding:6px 0;position:sticky;left:0;top:0;z-index:2;display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.pubr{max-width:145mm;margin:18px auto;padding:0 10px;font-family:Inter,Arial,sans-serif}.pubr .vok{background:#e7f6ec;color:#17713f;border:1px solid #17713f;border-radius:8px;padding:8px;text-align:center;font-weight:700;margin-bottom:8px}.pubr .vbad{background:#fdeaea;color:#c62828;border-color:#c62828}
.pubr .rc{border:2px solid #14365d;border-radius:8px}.pubr button{margin-top:10px;padding:8px 16px;border-radius:8px;border:1px solid #14365d;background:#14365d;color:#fff;font:inherit;cursor:pointer}
@media(max-width:680px){.pg{width:100%!important;min-height:auto;padding:2mm}.rc-bot{grid-template-columns:1fr}#modal>.card.rw{min-width:100%;width:100%}}
@media print{.pg{margin:0;border:0;box-shadow:none}.rbar,.pubr button,.no-print{display:none!important}}`;
const inject=()=>{if(!document.getElementById('rcss')){const s=document.createElement('style');s.id='rcss';s.textContent=css;document.head.appendChild(s)}};
inject();
window.rcWords=words;
window.rcCard=(r,qr)=>{
 const items=Array.isArray(r.items)&&r.items.length?r.items:[{name:r.product_name||r.note||'Plastic Goods',qty:r.qty||1,rate:r.rate||r.amount||0,amount:r.total||r.amount||0}];
 const tot=r.total!=null?+r.total:items.reduce((s,x)=>s+(+x.amount||(+x.qty||0)*(+x.rate||0)),0);
 const paid=r.paid!=null?+r.paid:(+r.amount||0);
 const rem=r.remaining!=null?+r.remaining:Math.max(0,tot-paid);
 const contacts=r.contacts||'0346-9112233 · 0345-8821900';
 return `<article class="rc">
  <div class="rh">
   <div class="rh-left">
    <img src="${typeof LOGO!=='undefined'?LOGO:''}" alt="Logo">
    <div class="rh-title">
     <b>ASHA INAM PLASTIC INDUSTRY</b>
     <small>آشا انعام پلاسٹک انڈسٹری · مینوفیکچرنگ اینڈ ہول سیل</small>
     <small>Rahimabad, Mingora, Swat · رحیم آباد، مینگورہ، سوات</small>
    </div>
   </div>
   <div class="rh-contacts">
    <b>Contact · رابطہ نمبر</b><br>${E(contacts)}<br><small>Inamullah · Aizaz Khan</small>
   </div>
  </div>
  <h4>SALE RECEIPT / INVOICE · بل / رسید</h4>
  <div class="rc-meta">
   <div><span>Receipt No · رسید نمبر:</span><b>${E(r.no)}</b></div>
   <div><span>Date · تاریخ:</span><b>${E(r.d)}</b></div>
   <div><span>Customer · گاہک کا نام:</span><b>${E(r.party_name||'Walk-in Customer')}</b></div>
   <div><span>Mobile / Method · طریقہ:</span><b>${E((r.party_mobile?r.party_mobile+' · ':'')+(r.method_name||r.method||'Cash'))}</b></div>
  </div>
  <table class="rc-tbl">
   <thead>
    <tr>
     <th style="width:32px">#</th>
     <th>Product Details · تفصیل مال</th>
     <th class="r">Qty · مقدار</th>
     <th class="r">Rate · ریٹ</th>
     <th class="r">Amount · رقم</th>
    </tr>
   </thead>
   <tbody>
    ${items.map((it,idx)=>{
     const q=+it.qty||0,rt=+it.rate||0,am=it.amount!=null?+it.amount:Math.round(q*rt*100)/100;
     return `<tr><td>${idx+1}</td><td><b>${E(it.name||it.product_name||'Product')}</b></td><td class="r">${fm(q)}</td><td class="r">${fm(rt)}</td><td class="r"><b>${fm(am)}</b></td></tr>`;
    }).join('')}
   </tbody>
  </table>
  <div class="rc-bot">
   <div class="rc-totals">
    <div class="rl grand"><span>Total Amount · کل رقم:</span><b>Rs ${fm(tot)}</b></div>
    <div class="rl"><span>Received Cash · وصول نقد:</span><b style="color:#12844a">Rs ${fm(paid)}</b></div>
    <div class="rl rem"><span>Remaining Balance · بقایا رقم:</span><b>Rs ${fm(rem)}</b></div>
    ${r.balance_after!=null?`<div class="rl"><span>Total Khata Balance · کل کھاتہ بقایا:</span><b>Rs ${fm(r.balance_after)}</b></div>`:''}
    <div class="wd">${words(tot)}</div>
   </div>
   <div class="rc-qrbox">
    ${qr?`<div class="qr">${qr}</div><small><b>QR Code · کیو آر کوڈ</b><br>Scan inside receipt to verify<br>${E(r.no)}</small>`:`<small>QR Verified · تصدیق شدہ</small>`}
   </div>
  </div>
  <div class="rc-notes"><b>Notes · نوٹ:</b> ${E(r.note||'Goods once sold will be exchanged according to factory policy. شکریہ')}</div>
  <div class="sg">
   <span>Customer Signature · دستخط خریدار</span>
   <span>Signature (${E(r.issued_by||'Inamullah / Aizaz Khan')}) · دستخط</span>
  </div>
  ${r.voided?'<div class="stamp">CANCELLED</div>':''}
 </article>`;
};
// Public page: opens from the QR code, needs no login.
window.rview=async(tok,el)=>{inject();el.innerHTML='<p style="text-align:center;padding:40px">Checking receipt…</p>';
 try{const c=typeof sb!=='undefined'?sb:(window.sb2=window.sb2||supabase.createClient(CFG.url,CFG.key));const{data}=await c.rpc('get_receipt',{p_token:String(tok||'')});
  if(!data){el.innerHTML='<div class="pubr"><div class="vok vbad">Receipt not found</div></div>';return}
  let items=data.items;if(typeof items==='string'){try{items=JSON.parse(items)}catch(_){items=null}}
  const r={no:data.no,d:data.d,party_name:data.party,party_mobile:data.mobile,amount:data.amount,total:data.total||data.amount,paid:data.paid!=null?data.paid:data.amount,remaining:data.remaining!=null?data.remaining:0,method_name:data.method,note:data.note,balance_after:data.balance,issued_by:data.issued_by,items:items,voided:data.voided};
  const q=typeof qrSvg==='function'?qrSvg(location.href):'';
  el.innerHTML=`<div class="pubr"><div class="vok ${r.voided?'vbad':''}">${r.voided?'✖ This receipt has been CANCELLED':'✔ Verified: Genuine Receipt of Asha Inam Plastic Industry'}</div>${window.rcCard(r,q)}<button onclick="print()">🖨️ Print Receipt (A4 / Thermal)</button></div>`
 }catch(e){el.innerHTML='<div class="pubr"><div class="vok vbad">Could not check the receipt. Try again.</div></div>'}};
})();
