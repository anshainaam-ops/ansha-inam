// Roman Urdu: raseed ka design (A4 par 4) aur woh public page jo QR scan karne par login ke baghair khulta hai.
(function(){
const o=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'],t=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
const w2=n=>n<20?o[n]:t[n/10|0]+(n%10?' '+o[n%10]:''),w3=n=>(n>99?o[n/100|0]+' Hundred'+(n%100?' ':''):'')+(n%100?w2(n%100):'');
const words=n=>{n=Math.round(+n||0);if(!n)return'Zero Rupees Only';let s='';for(const[v,l]of[[1e7,'Crore'],[1e5,'Lakh'],[1e3,'Thousand']])if(n>=v){s+=w3(n/v|0)+' '+l+' ';n%=v}return(s+(n?w3(n):'')).trim()+' Rupees Only'};
const fm=n=>(+n||0).toLocaleString('en-PK',{maximumFractionDigits:2}),E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const css=`.pgs{display:block}.pg{width:210mm;height:297mm;margin:8px auto;background:#fff;color:#111;display:grid;grid-template:1fr 1fr/1fr 1fr;box-sizing:border-box;break-after:page;font-family:Inter,Arial,sans-serif}
.rc{position:relative;border:1px dashed #9aa;padding:7mm 7mm 5mm;display:flex;flex-direction:column;gap:1.6mm;font-size:11px;overflow:hidden;background:#fff;color:#111;text-align:left}
.rc .rh{display:flex;gap:3mm;align-items:center;border-bottom:2px solid #14365d;padding-bottom:2mm;color:#14365d}.rc .rh img{width:11mm;height:11mm;border-radius:50%;object-fit:cover}.rc .rh div{display:flex;flex-direction:column}.rc .rh b{font-size:11.5px}.rc .rh small{color:#555}
.rc h4{margin:1mm 0 0;text-align:center;letter-spacing:.8px;color:#a87b1f;font-size:11px}.rl{display:flex;justify-content:space-between;gap:6px;border-bottom:1px solid #e3e3e3;padding:.8mm 0}.rl span{color:#666}.rl b{text-align:right}
.rc .amt{font-size:21px;font-weight:700;text-align:center;border:2px solid #14365d;border-radius:4px;padding:1.5mm;margin-top:1mm;color:#14365d}.rc .wd{text-align:center;font-size:10px;color:#444}
.rc .rq{display:flex;flex-direction:column;align-items:center;gap:1mm;margin-top:1mm}.rc .qr svg{width:25mm;height:25mm;display:block}.rc .rq small{color:#666;font-size:9.5px}
.rc .sg{display:flex;justify-content:space-between;margin-top:auto;border-top:1px solid #999;padding-top:1mm;color:#666;font-size:10px}
.rc .stamp{position:absolute;top:38%;left:14%;transform:rotate(-18deg);font-size:28px;font-weight:700;color:#c62828;border:3px solid #c62828;padding:2px 12px;opacity:.75;background:#fff8}
#modal>.card.rw{max-width:none;width:max-content;min-width:min(100%,222mm);background:#6b7280;padding:8px;border:0}.rbar{padding:6px 0;position:sticky;left:0;top:0;z-index:2}
.pubr{max-width:105mm;margin:18px auto;padding:0 10px;font-family:Inter,Arial,sans-serif}.pubr .vok{background:#e7f6ec;color:#17713f;border:1px solid #17713f;border-radius:8px;padding:8px;text-align:center;font-weight:700;margin-bottom:8px}.pubr .vbad{background:#fdeaea;color:#c62828;border-color:#c62828}
.pubr .rc{border:1px solid #ccd;border-radius:8px;min-height:140mm}.pubr button{margin-top:10px;padding:8px 16px;border-radius:8px;border:1px solid #14365d;background:#14365d;color:#fff;font:inherit;cursor:pointer}
@media print{.pg{margin:0;border:0}.rc{border:1px dashed #bbb}.rbar,.pubr button{display:none!important}}`;
const inject=()=>{if(!document.getElementById('rcss')){const s=document.createElement('style');s.id='rcss';s.textContent=css;document.head.appendChild(s)}};
inject();
window.rcWords=words;
window.rcCard=(r,qr)=>`<article class="rc"><div class="rh"><img src="${typeof LOGO!=='undefined'?LOGO:''}" alt=""><div><b>ANSHA INAM PLASTIC INDUSTRY</b><small>Rahimabad, Mingora, Swat</small></div></div><h4>PAYMENT RECEIPT · ادائیگی کی رسید</h4><div class="rl"><span>Receipt No.</span><b>${E(r.no)}</b></div><div class="rl"><span>Date</span><b>${E(r.d)}</b></div><div class="rl"><span>Received from</span><b>${E(r.party_name)}</b></div>${r.party_mobile?`<div class="rl"><span>Mobile</span>${E(r.party_mobile)}</div>`:''}<div class="rl"><span>Method</span><b>${E(r.method_name)}</b></div>${r.note?`<div class="rl"><span>Details</span>${E(r.note)}</div>`:''}<div class="amt">Rs ${fm(r.amount)}</div><div class="wd">${words(r.amount)}</div>${+r.balance_after>0?`<div class="rl"><span>Remaining balance</span>${fm(r.balance_after)}</div>`:''}<div class="rq">${qr?`<div class="qr">${qr}</div><small>Scan to verify this receipt</small>`:''}</div><div class="sg"><span>Customer sign</span><span>Received by</span></div>${r.voided?'<div class="stamp">CANCELLED</div>':''}</article>`;
// Public page: opens from the QR code, needs no login. Only the one receipt with that secret token is returned by the database.
window.rview=async(tok,el)=>{inject();el.innerHTML='<p style="text-align:center;padding:40px">Checking receipt…</p>';
 try{const c=typeof sb!=='undefined'?sb:(window.sb2=window.sb2||supabase.createClient(CFG.url,CFG.key));const{data}=await c.rpc('get_receipt',{p_token:String(tok||'')});
  if(!data){el.innerHTML='<div class="pubr"><div class="vok vbad">Receipt not found</div></div>';return}
  const r={no:data.no,d:data.d,party_name:data.party,party_mobile:data.mobile,amount:data.amount,method_name:data.method,note:data.note,balance_after:data.balance,voided:data.voided};
  el.innerHTML=`<div class="pubr"><div class="vok ${r.voided?'vbad':''}">${r.voided?'✖ This receipt has been CANCELLED':'✔ Verified: genuine receipt of Ansha Inam Plastic Industry'}</div>${window.rcCard(r,'').replace('<div class="rq"></div>','')}${r.voided?'':''}<button onclick="print()">🖨️ Print</button></div>`
 }catch(e){el.innerHTML='<div class="pubr"><div class="vok vbad">Could not check the receipt. Try again.</div></div>'}};
})();
