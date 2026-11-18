// Roman Urdu: Updated features:
// 1) Granules aur Production ko ek hi page ("Granules & Production") mein merge kiya گیا hai, jahan 20 KG ya jitنے bhi KG select kar ke ek sath Lota, Chaba waghera multiple products select ho sakte hain, sirf simple usage aur granule price/rate calculation hoti hai (no selling/cost price), bane hue pieces seedha Dashboard ke stock mein jama hote hain, aur Granules ka Dashboard ke Profit/Loss ya kisi aur financial calculation se koi talluq nahi.
// 2) Receipt ka alag tab khatam کر کے Receipt sirf Sales section ke andar generate hoti hai (Handwritten design, multiple dynamic product rows, embedded unique QR code, A4 + Thermal 80mm/58mm print).
// 3) Naya product add karne ke baad usay delete (🗑️) karne ka option Products & Stock mein mojood hai. Baqi poori website wesi ki wesi hi hai.

const nP=p=>+p.nug_pieces||1,cN=p=>p.cost_nug!=null?+p.cost_nug:+p.buy_price*nP(p),sN=p=>p.sell_nug!=null?+p.sell_nug:+p.sell_price*nP(p);
const pl2=v=>`<b class="${v<0?'neg':'pos'}">${v<0?L('Loss','نقصان'):L('Profit','منافع')} ${fmt(Math.abs(v))}</b>`;
const mdl=h=>{const m=$('#modal');m.hidden=false;m.innerHTML=`<div class=card>${h}</div>`};
const cancelBtn=()=>`<button type=button class="btn alt" data-act=close>${L('Cancel','منسوخ')}</button>`;
const prod1=async id=>(await sb.from('products').select('*').eq('id',id).single()).data;

// Additional icons for picture products
Object.assign(ICON,{Water:'🚰',Insulated:'🚰',HDPE:'🛢️',Jerry:'🛢️',Tub:'🛁',Lota:'🪣',Bucket:'🪣',Mug:'🪣'});

// ---------- Navigation Adjustment ONLY as requested:
// 1. Merge 'granules' + 'production' into ONE 'granules' ("Granules & Production · گرینیولز اور پیداوار")
// 2. Remove separate 'receipts' tab (Receipts are generated strictly inside Sales section)
(function adjustNav(){
 const gIdx=NAV.findIndex(x=>x[0]==='granules');
 if(gIdx!==-1)NAV[gIdx]=['granules','Granules & Production','گرینیولز اور پیداوار','🧱'];
 const pIdx=NAV.findIndex(x=>x[0]==='production');
 if(pIdx!==-1)NAV.splice(pIdx,1);
 const rIdx=NAV.findIndex(x=>x[0]==='receipts');
 if(rIdx!==-1)NAV.splice(rIdx,1);
})();

// ---------- Payment methods: Cash, Bank, Easypaisa, JazzCash, UPaisa + any wallet added with the + option
const DEFM=[['cash','Cash · نقد'],['bank','Bank · بینک'],['easypaisa','Easypaisa · ایزی پیسہ'],['jazzcash','JazzCash · جیز کیش'],['upaisa','UPaisa · یو پیسہ']];
const setM=l=>{METHOD.length=0;l.forEach(x=>METHOD.push(x));METHOD.push(['__new','＋ '+'Add new wallet…'])};
setM(DEFM);
async function loadPM(){try{const{data,error}=await sb.from('payment_methods').select('*').order('sort').order('code');if(!error&&data&&data.length)setM(data.filter(x=>x.active).map(x=>[x.code,x.name]))}catch(e){}}
const _enter=enter;enter=async()=>{await loadPM();return _enter()};
H.addwallet=()=>mdl(`<h3>＋ ${L('New payment method / wallet','نیا طریقہ / والٹ')}</h3><form data-act=savewallet><div class=form2>${fld('n',L('Name','نام'),'text','','required')}${fld('det',L('Details (number / account, optional)','تفصیل (نمبر، اختیاری)'),'text')}</div><button class=btn>${L('Save','محفوظ کریں')}</button> ${cancelBtn()}</form>`);
H.savewallet=async d=>{await rpc('add_payment_method',{p_name:d.n.trim(),p_details:d.det||null});await loadPM();H.close();toast('✔');route()};
document.addEventListener('change',e=>{const t=e.target;if(t.tagName==='SELECT'&&t.value==='__new'){t.selectedIndex=0;H.addwallet()}
 if(t.name==='product'&&t.closest&&t.closest('form[data-act=trade]'))t.closest('form').querySelectorAll('[data-act=ecost],[data-act=esell]').forEach(b=>b.dataset.id=t.value)});
const _cash=V.cash;V.cash=async(...a)=>{const h=await _cash(...a),[Pay,E,LP,LN]=await Promise.all(['payments','expenses','loan_payments','loans'].map(t=>all(t))),k={};LN.forEach(l=>k[l.id]=l.kind);
 const bal=m=>{const f=x=>x.method===m;return r2(sum(Pay.filter(x=>x.dir==='in'&&f(x)),x=>x.amount)+sum(LN.filter(x=>x.kind==='taken'&&f(x)),x=>x.amount)+sum(LP.filter(x=>k[x.loan_id]==='given'&&f(x)),x=>x.amount)-sum(Pay.filter(x=>x.dir==='out'&&f(x)),x=>x.amount)-sum(E.filter(f),x=>x.amount)-sum(LN.filter(x=>x.kind==='given'&&f(x)),x=>x.amount)-sum(LP.filter(x=>k[x.loan_id]==='taken'&&f(x)),x=>x.amount))};
 return h+`<h3>${L('Mobile wallets & other methods (each has its own balance)','موبائل والٹس (ہر ایک کا الگ بیلنس)')}</h3>`+stats(METHOD.filter(m=>!['cash','bank','__new'].includes(m[0])).map(m=>[m[1],bal(m[0])]))+`<p><button class=btn data-act=addwallet>＋ ${L('Add payment method','نیا طریقہ شامل کریں')}</button></p>`};

// ---------- Cost / Sell buttons + Delete Product button (🗑️) on Products & Stock and Product Page
const costSellDel=id=>` <button type=button class="btn sm alt" data-act=ecost data-id=${id}>✏️ ${L('Cost','لاگت')}</button> <button type=button class="btn sm alt" data-act=esell data-id=${id}>✏️ ${L('Sell','فروخت')}</button> <button type=button class="btn sm alt" data-act=delprod data-id=${id} title="${L('Delete product','پروڈکٹ حذف کریں')}">🗑️ ${L('Delete','حذف')}</button>`;
for(const k of['products','product']){const f=V[k];V[k]=async(...a)=>(await f(...a)).replace(/(data-act=adj data-id=(\d+)>[^<]*<\/button>)/g,(m,x,id)=>x+costSellDel(id))}

// Delete newly added / custom product handler
H.delprod=async d=>{
 const p=await prod1(d.id);if(!p)return;
 mdl(`<form data-act=delprodform data-id=${p.id}><h3 class=neg>🗑️ ${L('Delete Product','پروڈکٹ حذف کریں')}: ${esc(p.name_en)}</h3><p>${L('Are you sure you want to delete this product? (Products with no sales history can be removed immediately, or enter password if required).','کیا آپ واقعی اس پروڈکٹ کو حذف کرنا چاہتے ہیں؟')}</p>${fld('reason',L('Reason (optional)','وجہ'),'text','Removed product')}${fld('password',L('Password (if required)','پاس ورڈ'),'password','')}<button class=btn style="background:linear-gradient(180deg,#ff8a7e,var(--bad));color:#fff;text-shadow:none">🗑️ ${L('Delete Product','حذف کریں')}</button> ${cancelBtn()}</form>`);
};
H.delprodform=async(d,f)=>{
 const id=+f.dataset.id;
 try{
  const{error}=await sb.from('products').delete().eq('id',id);
  if(error){
   await rpc('delete_entry',{p_table:'products',p_id:id,p_password:d.password||'',p_reason:d.reason||'Deleted product'});
  }
  H.close();toast('✔ '+L('Product deleted','پروڈکٹ حذف ہو گیا'));location.hash='#/products';route();
 }catch(e){toast('⚠ '+(e.message||'Cannot delete product with existing sales records'))}
};

// ---------- Dashboard: prices and daily profit / loss (Granules strictly excluded from Dashboard Profit/Loss!)
window.priceBlock=(PR,S)=>{
 const rows=PR.map(p=>{const n=nP(p),c=cN(p),s=sN(p);return tr([`<b>${esc(p.name_en)}</b>`,n,fmt(c),fmt(r2(c/n)),fmt(s),fmt(r2(s/n)),pl2(r2(s-c)),pl2(r2((s-c)/n)),`<button class="btn sm alt" data-act=ecost data-id=${p.id}>✏️ ${L('Cost','لاگت')}</button> <button class="btn sm alt" data-act=esell data-id=${p.id}>✏️ ${L('Sell','فروخت')}</button> <button class="btn sm alt" data-act=erule data-id=${p.id}>⚙️ Nug</button>`])});
 const dr=[...Array(14)].map((_,i)=>iso(new Date(Date.now()-i*864e5))).map(d=>{const a=S.filter(x=>x.d===d),r=sum(a,x=>x.total),c=sum(a,x=>x.qty*x.unit_cost);return tr([d,fmt(r),fmt(c),a.length?pl2(r2(r-c)):'-'])});
 return `<h3>${L('Product prices (you type Cost and Selling price)','پروڈکٹ قیمتیں (لاگت اور فروخت قیمت آپ خود لکھتے ہیں)')}</h3>`+tbl([L('Product','پروڈکٹ'),L('Pcs / Nug','نگ میں عدد'),L('Cost / Nug','لاگت / نگ'),L('Cost / pc','لاگت / عدد'),L('Sell / Nug','فروخت / نگ'),L('Sell / pc','فروخت / عدد'),L('Profit / Nug','منافع / نگ'),L('Profit / pc','منافع / عدد'),''],rows)
 +`<h3>${L('Daily profit / loss (last 14 days — Granules excluded)','روزانہ منافع / نقصان (14 دن — گرینیولز شامل نہیں)')}</h3>`+tbl([L('Date','تاریخ'),L('Sales','فروخت'),L('Cost','لاگت'),L('Result','نتیجہ')],dr)};
const priceModal=async(d,k)=>{const p=await prod1(d.id);if(!p)return toast('⚠ '+L('Product not found','پروڈکٹ نہیں ملا'));mdl(`<h3>${esc(p.name_en)}: ${k==='cost'?L('Cost price','لاگت'):L('Selling price','فروخت قیمت')}</h3><form data-act=saveprice data-id=${p.id} data-k=${k}><div class=form2>${fld('d',L('Effective from','سے نافذ'),'date',today())}${sel('u',L('Price is per','قیمت فی'),[['nug','Nug ('+nP(p)+' pcs)'],['piece','Piece']])}${fld('v',L('Price (Rs)','قیمت (روپے)'),'number',k==='cost'?cN(p):sN(p),'min=0 step=any required')}</div><button class=btn>${L('Save','محفوظ کریں')}</button> ${cancelBtn()}</form>`)};
H.ecost=d=>priceModal(d,'cost');H.esell=d=>priceModal(d,'sell');
H.saveprice=async(d,f)=>{const p=await prod1(f.dataset.id),v=d.u==='piece'?+d.v*nP(p):+d.v,k=f.dataset.k;await rpc('set_product_price',{p_product:p.id,p_date:d.d,p_cost_nug:k==='cost'?v:cN(p),p_sell_nug:k==='sell'?v:sN(p),p_by:ME});H.close();toast('✔');route()};
H.erule=async d=>{const p=await prod1(d.id);mdl(`<h3>${esc(p.name_en)}: Nug</h3><form data-act=saverule data-id=${p.id}><div class=form2>${fld('nug',L('Pieces in one Nug','ایک نگ میں عدد'),'number',nP(p),'min=1 step=1 required')}${fld('cp',L('Rule: pieces (optional)','اصول: عدد'),'number',p.cons_pieces||'','step=any')}${fld('ck',L('need granules (KG)','گرینیولز (KG)'),'number',p.cons_kg||'','step=any')}</div><button class=btn>${L('Save','محفوظ کریں')}</button> ${cancelBtn()}</form>`)};
H.saverule=async(d,f)=>{await rpc('set_product_rule',{p_product:+f.dataset.id,p_nug:+d.nug,p_cons_pieces:+d.cp||null,p_cons_kg:+d.ck||null});H.close();toast('✔');route()};
H.editp=async d=>{const p=await prod1(d.id);const ms=prompt('Low-stock alert level / کم اسٹاک حد',p.min_stock);if(ms===null)return;const im=prompt('Image path or URL (e.g. img/lota.jpg)',p.image_url||'');if(im===null)return;const{error}=await sb.from('products').update({min_stock:+ms,image_url:im||null}).eq('id',d.id);error?toast('⚠ '+error.message):(toast(L('Saved. Prices: Dashboard → Cost / Sell buttons','محفوظ۔ قیمتیں: ڈیش بورڈ کے Cost / Sell بٹن')),route())};

// ============================================================================
// UNIFIED GRANULES & PRODUCTION SECTION (Merged into ONE page!)
// - Pick Granule Type & Total KG (e.g. 20 KG) and select one or multiple products (Lota, Chaba, etc.) at once.
// - Shows simple usage & granule rate/price calculation ONLY (NOT product selling & cost price).
// - Adds produced pieces (e.g. Lota, Chaba made) directly to Dashboard product stock.
// - Strictly excluded from Dashboard profit/loss or any financial calculation of main dashboard.
// ============================================================================
let GT=[];const kgOf=(a,f,t,fn)=>sum(a.filter(x=>x.type_id===t&&fn(x.d)),f);
const gTypes=async()=>{GT=(await all('granule_types')).filter(x=>x.active!==false)};

V.granules=async()=>{
 const[PR,G,PD]=await Promise.all([all('products'),all('granule_purchases'),all('production'),gTypes()]);
 window.PD0=PD;window.PR0=PR;window.G0=G;
 const nm=Object.fromEntries(PR.map(p=>[p.id,p.name_en])),gn=Object.fromEntries(GT.map(g=>[g.id,g.name]));
 const lastRate=tid=>{const ls=G.filter(x=>x.type_id===tid).sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:a.id-b.id).pop();return ls?+ls.rate:0};
 const leftKg=tid=>r2(kgOf(G,x=>x.kg,tid,()=>1)-kgOf(PD,x=>x.granules_kg,tid,()=>1));

 const tr0=GT.map(g=>{
  const ad=kgOf(G,x=>x.kg,g.id,()=>1),us=kgOf(PD,x=>x.granules_kg,g.id,()=>1),lf=r2(ad-us),rt=lastRate(g.id);
  return tr([`<b>${esc(g.name)}</b>`,rt?'Rs '+fmt(rt):'-',fmt(ad)+' KG',fmt(us)+' KG',`<b class="${lf<=0?'neg':'pos'}">${fmt(lf)} KG</b>`,rt?'Rs '+fmt(r2(lf*rt)):'-']);
 });

 const add=sum(G,x=>x.kg),used=sum(PD,x=>x.granules_kg),leftAll=r2(add-used);
 const totalSpent=sum(G,x=>x.total),totalUsedPrice=sum(PD,x=>r2((+x.granules_kg||0)*lastRate(x.type_id)));

 // Product checkboxes / rows for multi-product selection in a single batch (e.g., 20 KG -> Lota, Chaba, etc.)
 const prodPickRows=PR.map((p,i)=>`
  <tr class="gp-prow" data-pid="${p.id}">
   <td><label style="margin:0;display:flex;align-items:center;gap:8px;cursor:pointer;color:var(--ink)"><input type="checkbox" class="gp-chk" value="${p.id}" ${i<2?'checked':''} style="width:18px;height:18px;margin:0"> <b>${esc(p.name_en)}</b> <span class="muted">${esc(p.name_ur||'')}</span></label></td>
   <td><span class="badge">${fmt(p.stock)} pcs</span></td>
   <td><input type="number" class="gp-pcs" data-pid="${p.id}" min="0" step="1" placeholder="${L('Pieces made (e.g. 50)','بنے ہوئے عدد')}" value="${i===0?40:i===1?30:''}" style="margin:0;padding:8px"></td>
   <td><input type="number" class="gp-kg" data-pid="${p.id}" min="0" step="any" placeholder="${L('KG used (auto/manual)','استعمال شدہ KG')}" value="${i===0?12:i===1?8:''}" style="margin:0;padding:8px"></td>
   <td class="gp-rowprice muted" data-pid="${p.id}">Rs 0</td>
  </tr>`).join('');

 const prodLedgerRows=[...PD].reverse().slice(0,80).map(x=>{
  const rt=lastRate(x.type_id),uPrice=r2((+x.granules_kg||0)*rt);
  return tr([x.d,`<b>${esc(nm[x.product_id]||'')}</b>`,esc(gn[x.type_id]||''),`<b class="pos">+${fmt(x.pieces)} pcs</b>`,fmt(x.granules_kg)+' KG',rt?'Rs '+fmt(rt):'-','<b>Rs '+fmt(uPrice)+'</b>',esc(x.handled_by||'')]);
 });

 const ds=[...new Set([...G.map(x=>x.d),...PD.map(x=>x.d)])].sort().reverse();
 const dailyRows=ds.flatMap(d=>GT.map(g=>{
  const op=r2(kgOf(G,x=>x.kg,g.id,x=>x<d)-kgOf(PD,x=>x.granules_kg,g.id,x=>x<d)),b=G.filter(x=>x.d===d&&x.type_id===g.id),bk=sum(b,x=>x.kg),u=kgOf(PD,x=>x.granules_kg,g.id,x=>x===d);
  const rt=b.length?+b[b.length-1].rate:lastRate(g.id);
  const madeList=PD.filter(x=>x.d===d&&x.type_id===g.id).map(x=>`${nm[x.product_id]||'Item'} (${fmt(x.pieces)})`).join(', ')||'-';
  return bk||u?tr([d,esc(g.name),fmt(op)+' KG',fmt(bk)+' KG',rt?'Rs '+fmt(rt):'-','Rs '+fmt(sum(b,x=>x.total)),fmt(u)+' KG','Rs '+fmt(r2(u*rt)),esc(madeList),`<b>${fmt(r2(op+bk-u))} KG</b>`]):'';
 }));

 post=()=>calcGranuleBatch();

 return `<h2>${L('Granules & Production (One Unified Section)','گرینیولز اور پیداوار (مشترکہ سیکشن)')}</h2>`
 +tip(
  'Granules & Production are unified here. Pick a granule amount (e.g. 20 KG) and select Lota, Chaba, or multiple products at once. It calculates simple granule usage & price only (no selling/cost price), adds produced pieces directly to the Dashboard stock, and stays 100% excluded from Dashboard Profit/Loss calculations.',
  'گرینیولز اور پیداوار کو یہاں یکجا کر دیا گیا ہے۔ مثلاً 20 KG دانہ منتخب کریں اور ایک ساتھ لوٹا، چھابہ وغیرہ جتنے چاہیں پروڈکٹس چنیں۔ یہاں صرف سادہ استعمال اور دانے کی قیمت کا حساب ہوتا ہے (فروخت یا لاگت قیمت نہیں)، بنے ہوئے عدد سیدھا ڈیش بورڈ اسٹاک میں جمع ہوتے ہیں، اور ڈیش بورڈ کے منافع/نقصان سے اس کا کوئی تعلق نہیں۔'
 )
 +stats([
  [L('Total Granules Added','کل شامل شدہ دانہ'),add,'','KG '],
  [L('Used in Production','پیداوار میں استعمال'),used,'','KG '],
  [L('Remaining Granules','باقی دانہ (اسٹاک)'),leftAll,leftAll<=0?'neg':'pos','KG '],
  [L('Granules Purchase Value','دانہ خریداری رقم'),totalSpent],
  [L('Granules Usage Value','استعمال شدہ دانہ قیمت'),totalUsedPrice]
 ])
 +`<div class="card" style="border:2px solid var(--g2)">
   <h3>🔨 ${L('1. Use Granules & Make Products at Once (e.g. Take 20 KG → Pick Lota, Chaba, etc.)','1. دانہ استعمال کریں اور ایک ساتھ پروڈکٹس بنائیں (مثلاً 20 KG میں لوٹا، چھابہ وغیرہ)')}</h3>
   <form data-act="runbatch" id="gpBatchForm">
    <div class="form2">
     ${fld('d',L('Date · تاریخ','تاریخ'),'date',today(),'required')}
     <label>${L('Granule Type · دانے کی قسم','دانے کی قسم')}
      <select name="t" id="gpTypeSel">
       ${GT.map(g=>`<option value="${g.id}" data-rate="${lastRate(g.id)}" data-left="${leftKg(g.id)}">${esc(g.name)} (${fmt(leftKg(g.id))} KG left · Rs ${fmt(lastRate(g.id))}/KG)</option>`).join('')}
      </select>
     </label>
     ${fld('totkg',L('Total Granules Taken (KG) · کل دانہ (مثلاً 20 KG)','کل دانہ (KG)'),'number',20,'min=0.01 step=any required id="gpTotalKg"')}
     ${fld('grate',L('Granule Rate / KG (Rs) · فی کلو ریٹ','فی کلو ریٹ (روپے)'),'number',GT[0]?lastRate(GT[0].id):390,'min=0 step=any required id="gpRate"')}
     ${byf()}
    </div>
    <p style="margin:10px 0 6px"><b>${L('Select Products Made from this Granule Batch (Tick 1 or multiple products like Lota, Chaba, etc.):','اس دانے سے بننے والی مصنوعات منتخب کریں (ایک یا زیادہ مثلاً لوٹا، چھابہ چنیں):')}</b>
     <button type="button" class="btn sm alt" data-act=" gpsplit">${L('⚖️ Split KG Evenly Among Ticked','منتخب پروڈکٹس میں KG برابر تقسیم کریں')}</button>
    </p>
    <div class="tw" style="margin-bottom:10px">
     <table>
      <thead>
       <tr>
        <th>${L('Tick Product (Lota, Chaba, etc.)','پروڈکٹ منتخب کریں')}</th>
        <th>${L('Current Dashboard Stock','موجودہ ڈیش بورڈ اسٹاک')}</th>
        <th>${L('Pieces Made (+ to Dashboard)','بنے ہوئے عدد (ڈیش بورڈ میں جمع)')}</th>
        <th>${L('Granules KG Used','استعمال شدہ KG')}</th>
        <th>${L('Simple Usage Price (KG × Rate)','سادہ استعمال قیمت')}</th>
       </tr>
      </thead>
      <tbody>${prodPickRows}</tbody>
     </table>
    </div>
    <div id="gpSummary" class="grid" style="margin-bottom:10px"></div>
    <button class="btn" type="submit">✅ ${L('Save Production & Add Pieces to Dashboard','پیداوار محفوظ کریں اور ڈیش بورڈ اسٹاک میں شامل کریں')}</button>
   </form>
  </div>`
 +`<form class=card data-act=addgran><h3>＋ ${L('2. Add / Buy New Granules Stock (KG & Price Only)','2. نیا دانہ (گرینیولز) اسٹاک میں شامل کریں')}</h3><div class=form2>${sel('t',L('Granule type','گرینیولز کی قسم'),GT.map(g=>[g.id,g.name]))}${fld('d',L('Date','تاریخ'),'date',today())}${fld('kg','KG','number','','min=0.01 step=any required')}${fld('rate',L('Price / Rate per KG (Rs)','فی KG قیمت / ریٹ'),'number',GT[0]?lastRate(GT[0].id):390,'min=0 step=any required')}${byf()}</div><button class=btn>＋ ${L('Add Granules','دانہ شامل کریں')}</button> <button type=button class="btn alt" data-act=addgtype>＋ ${L('New granule type','نئی قسم شامل کریں')}</button></form>`
 +`<h3>${L('Stock by Granule Type (Simple Price & Usage Tracking)','قسم کے لحاظ سے دانے کا اسٹاک اور سادہ حساب')}</h3>`+tbl([L('Type','قسم'),L('Rate / KG','ریٹ / KG'),L('Added KG','شامل KG'),L('Used KG','استعمال KG'),L('Left KG','باقی KG'),L('Remaining Value (Price)','باقی دانے کی قیمت')],tr0)
 +`<h3>${L('Production & Usage History (Pieces Added to Dashboard)','پیداوار اور دانے کے استعمال کا ریکارڈ')}</h3>`+tbl([L('Date','تاریخ'),L('Product Made','پروڈکٹ'),L('Granule Type','دانے کی قسم'),L('Added to Dashboard','ڈیش بورڈ میں جمع'),L('Granules Used','استعمال شدہ KG'),L('Rate / KG','ریٹ / KG'),L('Usage Price','استعمال قیمت'),L('By','کس نے')],prodLedgerRows)
 +`<h3>${L('Daily Granules & Production Account (KG & Simple Price)','روزانہ گرینیولز اور پیداوار کا کھاتہ')}</h3>`+tbl([L('Date','تاریخ'),L('Type','قسم'),L('Opening','شروع'),L('Added','شامل'),L('Rate/KG','ریٹ'),L('Added Price','شامل قیمت'),L('Used','استعمال'),L('Used Price','استعمال قیمت'),L('Products Made','بنے ہوئے پروڈکٹس'),L('Closing','اختتام')],dailyRows);
};
V.production=V.granules;

function calcGranuleBatch(){
 const f=$('#gpBatchForm');if(!f)return;
 const totKg=+($('#gpTotalKg')?.value||0),rate=+($('#gpRate')?.value||0);
 const rows=[...f.querySelectorAll('.gp-prow')];
 let sumPcs=0,sumKg=0,picked=[];
 rows.forEach(r=>{
  const chk=r.querySelector('.gp-chk'),pcsInp=r.querySelector('.gp-pcs'),kgInp=r.querySelector('.gp-kg'),prCell=r.querySelector('.gp-rowprice');
  const on=chk&&chk.checked;
  if(pcsInp)pcsInp.disabled=!on;
  if(kgInp)kgInp.disabled=!on;
  const pcs=on?(+pcsInp.value||0):0,kg=on?(+kgInp.value||0):0,price=r2(kg*rate);
  if(prCell)prCell.innerHTML=on?`<b>Rs ${fmt(price)}</b> (${fmt(kg)} KG)`:`<span class="muted">—</span>`;
  if(on&&pcs>0){sumPcs+=pcs;sumKg=r2(sumKg+kg);picked.push(`${r.querySelector('b')?.textContent||''}: +${fmt(pcs)} pcs`)}
 });
 const totPrice=r2(totKg*rate),usedPrice=r2(sumKg*rate),diffKg=r2(totKg-sumKg);
 const box=$('#gpSummary');
 if(box){
  box.innerHTML=`
   <div class="stat"><small>${L('Granules Taken','لیا گیا دانہ')}</small><b>${fmt(totKg)} KG</b></div>
   <div class="stat"><small>${L('Simple Granule Price','دانے کی سادہ قیمت')}</small><b>Rs ${fmt(totPrice)}</b></div>
   <div class="stat"><small>${L('Allocated to Products','پروڈکٹس میں لگا دانہ')}</small><b class="${Math.abs(diffKg)>0.01?'neg':'pos'}">${fmt(sumKg)} KG (Rs ${fmt(usedPrice)})</b></div>
   <div class="stat"><small>${L('Total Pieces Added to Dashboard','ڈیش بورڈ میں جمع ہونے والے عدد')}</small><b class="pos">+${fmt(sumPcs)} pcs</b></div>`;
 }
}

H[' gpsplit']=H.gpsplit=()=>{
 const f=$('#gpBatchForm');if(!f)return;
 const totKg=+($('#gpTotalKg')?.value||0);
 const chks=[...f.querySelectorAll('.gp-chk:checked')];
 if(!chks.length)return toast(L('Tick at least one product first','پہلے کم از کم ایک پروڈکٹ منتخب کریں'));
 const each=r2(totKg/chks.length);
 chks.forEach((c,i)=>{
  const r=c.closest('.gp-prow'),kgInp=r.querySelector('.gp-kg'),pcsInp=r.querySelector('.gp-pcs');
  kgInp.value=i===chks.length-1?r2(totKg-each*(chks.length-1)):each;
  if(!+pcsInp.value)pcsInp.value=10;
 });
 calcGranuleBatch();
};

document.addEventListener('input',e=>{
 if(e.target.closest('#gpBatchForm')){
  if(e.target.id==='gpTotalKg'){
   const f=$('#gpBatchForm'),chks=[...f.querySelectorAll('.gp-chk:checked')];
   if(chks.length===1){chks[0].closest('.gp-prow').querySelector('.gp-kg').value=e.target.value}
  }
  calcGranuleBatch();
 }
});
document.addEventListener('change',e=>{
 if(e.target.id==='gpTypeSel'){
  const o=e.target.selectedOptions[0];
  if(o&&o.dataset.rate&&$('#gpRate'))$('#gpRate').value=o.dataset.rate;
  calcGranuleBatch();
 }else if(e.target.classList?.contains('gp-chk')){
  calcGranuleBatch();
 }
});

H.runbatch=async(d,f)=>{
 const rows=[...f.querySelectorAll('.gp-prow')].filter(r=>r.querySelector('.gp-chk')?.checked);
 const items=rows.map(r=>({pid:+r.dataset.pid,pcs:+r.querySelector('.gp-pcs').value||0,kg:+r.querySelector('.gp-kg').value||0})).filter(x=>x.pcs>0);
 if(!items.length)return toast(L('Tick at least one product and enter Pieces made','کم از کم ایک پروڈکٹ چنیں اور بنے ہوئے عدد لکھیں'));
 const totKg=+d.totkg||0,sumKg=sum(items,x=>x.kg);
 if(sumKg<=0&&totKg>0){
  const each=r2(totKg/items.length);
  items.forEach((x,i)=>x.kg=i===items.length-1?r2(totKg-each*(items.length-1)):each);
 }
 for(const it of items){
  await rpc('create_production',{p_date:d.d,p_product:it.pid,p_pieces:it.pcs,p_kg:it.kg,p_mode:'manual',p_note:`Rate Rs ${+d.grate||0}/KG`,p_by:d.by,p_type:+d.t});
 }
 localStorage.by=d.by;
 toast('✔ '+L('Production saved & pieces added to Dashboard!','پیداوار محفوظ ہو گئی اور عدد ڈیش بورڈ میں جمع ہو گئے!'));
 route();
};

H.addgran=async d=>{await rpc('add_granules',{p_date:d.d,p_kg:+d.kg,p_rate:+d.rate,p_note:null,p_by:d.by,p_type:+d.t});localStorage.by=d.by;toast('✔');route()};
H.addgtype=()=>mdl(`<h3>＋ ${L('New granule type','نئی قسم')}</h3><form data-act=savegtype><div class=form2>${fld('n',L('Name (e.g. White PP Granules)','نام'),'text','','required')}</div><button class=btn>${L('Save','محفوظ کریں')}</button> ${cancelBtn()}</form>`);
H.savegtype=async d=>{await rpc('add_granule_type',{p_name:d.n});H.close();toast('✔');route()};

// ============================================================================
// MULTI-PRODUCT SALES & EMBEDDED QR RECEIPT INSIDE SALES SECTION ONLY
// (Satisfies Points 1, 2, 3, 4: No separate Receipt tab, generated inside Sales,
// dynamic product rows, handwritten receipt design, embedded QR, A4 + Thermal)
// ============================================================================
const rurl=t=>window.RCPT_URL?RCPT_URL(t):new URL('receipt.html',location.href).href+'?t='+t;
const rcHtml=r=>{let q='';try{q=qrSvg(rurl(r.token||'S-'+r.id))}catch(e){}return rcCard(r,q)};

let salePR=[];
function saleRowHtml(PR,idx){
 const first=PR[0]||{id:0,sell_price:0};
 return `<tr class="s-item-row">
  <td class="s-idx">${idx}</td>
  <td><select class="s-prod" required style="margin:0;padding:8px">${PR.map(x=>`<option value="${x.id}" data-p="${x.sell_price}" data-name="${esc(x.name_en+(x.name_ur?' · '+x.name_ur:''))}">${esc(x.name_en)} (${fmt(x.stock)} pcs)</option>`).join('')}</select></td>
  <td><input type="number" class="s-qty" min="1" step="any" value="1" required style="margin:0;padding:8px"></td>
  <td><input type="number" class="s-rate" min="0" step="any" value="${first.sell_price||0}" required style="margin:0;padding:8px"></td>
  <td><b class="s-amt">Rs ${fmt(first.sell_price||0)}</b></td>
  <td><button type="button" class="btn sm alt" data-act="rmsalerow" title="Remove row">✖</button></td>
 </tr>`;
}

function calcSaleForm(){
 const f=document.querySelector('form[data-act=multisale]');if(!f)return;
 const rows=[...f.querySelectorAll('.s-item-row')];
 let grand=0;
 rows.forEach((r,i)=>{
  const idxCell=r.querySelector('.s-idx');if(idxCell)idxCell.textContent=i+1;
  const q=+r.querySelector('.s-qty')?.value||0,rt=+r.querySelector('.s-rate')?.value||0,am=r2(q*rt);
  grand=r2(grand+am);
  const amCell=r.querySelector('.s-amt');if(amCell)amCell.textContent='Rs '+fmt(am);
 });
 const paid=+(f.elements.paid?.value||0),rem=r2(grand-paid);
 const b=+(f.elements.party?.selectedOptions[0]?.dataset.p||0);
 const prev=b>0?L('Previous balance: this customer owes you','پچھلا حساب: اس گاہک نے آپ کو دینا ہے')+' Rs '+fmt(b):b<0?L('Advance: you owe this customer','ایڈوانس: آپ نے اسے دینا ہے')+' Rs '+fmt(-b):'';
 const pv=f.querySelector('.pv');
 if(pv){
  pv.innerHTML=`<div class=grid style="margin:0 0 8px">
   <div class=stat><small>${L('Products Count','پروڈکٹس کی تعداد')}</small><b>${rows.length}</b></div>
   <div class=stat><small>${L('Grand Total Amount','کل بل (ٹوٹل رقم)')}</small><b>Rs ${fmt(grand)}</b></div>
   <div class=stat><small>${L('Received Cash','وصول نقد')}</small><b class=pos>Rs ${fmt(paid)}</b></div>
   <div class=stat><small>${L('Remaining Balance','بقایا رقم')}</small><b class="${rem>0?'neg':'pos'}">Rs ${fmt(rem)}</b></div>
  </div>${prev?`<b class=neg>⚠ ${prev}</b><br>`:''}${b||rem?`<span class=muted>${L('Total Khata Balance after this bill','اس بل کے بعد کل کھاتہ بقایا')}: <b>Rs ${fmt(r2(b+rem))}</b></span>`:''}`;
 }
}

V.sales=async()=>{
 const[PR,B,S,Pay,RC]=await Promise.all([all('products'),all('party_balance'),all('sales'),all('payments'),all('receipts').catch(()=>[])]);
 salePR=PR;
 const pt=B.filter(x=>x.kind==='customer'&&!x.archived),pn=Object.fromEntries(B.map(x=>[x.id,x.name])),pm=Object.fromEntries(B.map(x=>[x.id,x.mobile||''])),pr=Object.fromEntries(PR.map(x=>[x.id,x.name_en+(x.name_ur?' · '+x.name_ur:'')]));
 window._saleCtx={PR,B,S,Pay,RC,pn,pm,pr};
 post=()=>calcSaleForm();

 return `<h2>${L('Sales & Receipt System (Multiple Products + QR Receipt)','فروخت اور رسید سسٹم (ایک یا زیادہ پروڈکٹس + کیو آر رسید)')}</h2>`
 +tip(
  'Add 1, 2, 3, or any number of products to a single customer sale. Rows adjust automatically. Saving generates the Handwritten-style Sale Receipt with its unique embedded QR code (printable on A4 & Thermal printers).',
  'ایک گاہک کے بل میں 1، 2، 3 یا جتنے چاہیں پروڈکٹس شامل کریں۔ قطاریں خودکار طریقے سے بڑھتی ہیں۔ محفوظ کرنے پر ہاتھ کی لکھی رسید کے ڈیزائن کے مطابق منفرد QR کوڈ والی رسید نکلے گی (A4 اور تھرمل پرنٹر سپورٹ کے ساتھ)۔'
 )
 +`<form class="card" data-act="multisale">
   <div class="form2">
    ${sel('party',L('Customer Name · گاہک کا نام','گاہک کا نام'),pt.map(x=>[x.id,x.name+(x.mobile?' ('+x.mobile+')':''),x.balance]))}
    ${fld('date',L('Date · تاریخ','تاریخ'),'date',today(),'required')}
    ${sel('method',L('Payment Method · طریقہ','ادائیگی کا طریقہ'),METHOD)}
    ${byf()}
   </div>
   <div style="margin:12px 0 6px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
    <b>📦 ${L('Product Details (Dynamic Rows — Add 1 or Multiple Products)','تفصیل مال (ایک یا جتنے چاہیں پروڈکٹس شامل کریں)')}</b>
    <div>
     <button type="button" class="btn sm" data-act="addsalerow">＋ ${L('Add Another Product Row','ایک اور پروڈکٹ شامل کریں')}</button>
     ${PR[0]?`<button type="button" class="btn sm alt" data-act="ecost" data-id="${PR[0].id}">✏️ ${L('Cost','لاگت')}</button> <button type="button" class="btn sm alt" data-act="esell" data-id="${PR[0].id}">✏️ ${L('Sell','فروخت')}</button>`:''}
    </div>
   </div>
   <div class="tw" style="margin-bottom:10px">
    <table>
     <thead>
      <tr>
       <th style="width:36px">#</th>
       <th>${L('Product · پروڈکٹ','پروڈکٹ')}</th>
       <th style="width:130px">${L('Quantity · مقدار','مقدار')}</th>
       <th style="width:150px">${L('Rate · ریٹ','ریٹ')}</th>
       <th style="width:150px">${L('Amount · رقم','رقم')}</th>
       <th style="width:50px"></th>
      </tr>
     </thead>
     <tbody id="saleItemsBody">
      ${saleRowHtml(PR,1)}
     </tbody>
    </table>
   </div>
   <div class="form2">
    ${fld('paid',L('Received Cash · وصول نقد','وصول نقد'),'number',0,'min=0 step=any')}
    ${fld('note',L('Notes · نوٹ (اختیاری)','نوٹ (اختیاری)'),'text','')}
   </div>
   <div class="pv" style="margin-top:8px"></div>
   <button class="btn" type="submit">💾🧾 ${L('Save Sale & Generate QR Receipt','بل محفوظ کریں اور کیو آر رسید بنائیں')}</button>
   <button type="button" class="btn alt" data-act="setpaid" data-v="full">${L('Full Cash Received','مکمل نقد وصولی')}</button>
   <button type="button" class="btn alt" data-act="setpaid" data-v="credit">${L('Credit (Udhaar)','ادھار (بقایا)')}</button>
   <button type="button" class="btn alt" data-act="newparty" data-kind="customer">＋ ${L('New Customer','نیا گاہک')}</button>
  </form>`
 +`<h3>${L('Sales & Receipts History (Tap 🧾 Receipt to View / Print A4 or Thermal)','فروخت اور رسیدوں کا ریکارڈ (🧾 دبا کر رسید دیکھیں اور پرنٹ کریں)')}</h3>`
 +tbl(
  ['Receipt No.',L('Date','تاریخ'),L('Customer','گاہک'),L('Product Details','تفصیل مال'),L('Qty','مقدار'),L('Rate','ریٹ'),L('Amount','رقم'),L('By','کس نے'),L('Receipt / Action','رسید / ایکشن')],
  S.slice().reverse().slice(0,200).map(x=>tr([
   `<b>${pad('S-',x.id)}</b>`,
   x.d,
   esc(pn[x.party_id]||''),
   esc(pr[x.product_id]||''),
   fmt(x.qty),
   fmt(x.unit_price),
   `<b>Rs ${fmt(x.total)}</b>`,
   esc(x.handled_by||''),
   `<button class="btn sm" data-act="saleinv" data-id="${x.id}">🧾 ${L('Receipt & QR','رسید اور QR')}</button> <button class="btn sm alt" data-act="del" data-t="sales" data-id="${x.id}" title="Delete">✖</button>`
  ]))
 );
};

H.addsalerow=()=>{
 const tb=$('#saleItemsBody');if(!tb)return;
 const n=tb.querySelectorAll('.s-item-row').length+1;
 tb.insertAdjacentHTML('beforeend',saleRowHtml(salePR,n));
 calcSaleForm();
};

H.rmsalerow=(d,b)=>{
 const tb=$('#saleItemsBody');if(!tb)return;
 if(tb.querySelectorAll('.s-item-row').length<=1)return toast(L('At least 1 product row is required','کم از کم ایک پروڈکٹ ضروری ہے'));
 b.closest('.s-item-row')?.remove();
 calcSaleForm();
};

document.addEventListener('change',e=>{
 if(e.target.classList?.contains('s-prod')){
  const r=e.target.closest('.s-item-row'),o=e.target.selectedOptions[0];
  if(r&&o?.dataset.p!=null){r.querySelector('.s-rate').value=o.dataset.p;calcSaleForm()}
 }
 if(e.target.name==='party'&&e.target.closest('form[data-act=multisale]'))calcSaleForm();
});

document.addEventListener('input',e=>{
 if(e.target.closest('form[data-act=multisale]'))calcSaleForm();
});

H.setpaid=(d,b)=>{
 const f=b.closest('form');if(!f)return;
 if(f.dataset.act==='multisale'){
  const rows=[...f.querySelectorAll('.s-item-row')];
  const grand=sum(rows,r=>(+r.querySelector('.s-qty').value||0)*(+r.querySelector('.s-rate').value||0));
  f.elements.paid.value=d.v==='full'?r2(grand):0;
  calcSaleForm();
 }else{
  const x=f.elements;x.paid.value=d.v==='full'?r2(x.qty.value*x.price.value):0;
  x.paid.dispatchEvent(new Event('input',{bubbles:true}));
 }
};

// Save Multi-Product Sale & Open Handwritten Design Receipt with Embedded QR
H.multisale=async(d,f)=>{
 if(!d.party)return toast(L('Add or select a customer first','پہلے گاہک منتخب کریں'));
 const rows=[...f.querySelectorAll('.s-item-row')];
 const items=rows.map(r=>{
  const selEl=r.querySelector('.s-prod'),o=selEl.selectedOptions[0];
  const q=+r.querySelector('.s-qty').value||0,rt=+r.querySelector('.s-rate').value||0;
  return{product_id:+selEl.value,name:o?.dataset.name||o?.textContent||'Product',qty:q,rate:rt,amount:r2(q*rt)};
 }).filter(x=>x.qty>0);
 if(!items.length)return toast(L('Enter valid quantity','درست مقدار لکھیں'));

 let remPaid=+d.paid||0,ids=[];
 for(let i=0;i<items.length;i++){
  const it=items[i];
  const payHere=i===items.length-1?r2(Math.max(0,remPaid)):r2(Math.min(it.amount,Math.max(0,remPaid)));
  remPaid=r2(remPaid-payHere);
  const sid=await rpc('create_sale',{p_party:+d.party,p_product:it.product_id,p_qty:it.qty,p_price:it.rate,p_paid:payHere,p_method:d.method,p_date:d.date,p_by:d.by});
  ids.push(sid);
 }
 localStorage.by=d.by;
 // Store multi-item receipt group in localStorage so multi-item bills display all rows together
 const mainId=ids[0],no=pad('S-',mainId),tok='QR-'+no+'-'+Date.now().toString(36).toUpperCase();
 try{
  const map=JSON.parse(localStorage.saleReceipts||'{}');
  map[mainId]={ids,no,token:tok,d:d.date,party_id:+d.party,method:d.method,paid:+d.paid||0,note:d.note||'',by:d.by,items};
  ids.forEach(id=>{map[id]=map[mainId]});
  localStorage.saleReceipts=JSON.stringify(map);
 }catch(_){}
 toast('✔ '+L('Sale saved & Receipt generated','فروخت محفوظ ہو گئی اور رسید بن گئی'));
 await route();
 openSaleReceipt(mainId);
};

async function openSaleReceipt(id){
 const ctx=window._saleCtx||{};
 const[S,B,Pay,PR]=await Promise.all([all('sales'),all('party_balance'),all('payments'),all('products')]);
 const s=S.find(x=>x.id==id);if(!s)return toast(L('Sale not found','بل نہیں ملا'));
 const p=B.find(x=>x.id==s.party_id)||{name:'Customer',mobile:'',balance:0};
 const prMap=Object.fromEntries(PR.map(x=>[x.id,x.name_en+(x.name_ur?' · '+x.name_ur:'')]));
 let saved=null;
 try{saved=JSON.parse(localStorage.saleReceipts||'{}')[id]}catch(_){}
 // Also group same-party, same-date batch if not in localStorage
 let items=saved?.items;
 let tot=0,paid=0;
 if(items&&items.length){
  tot=sum(items,x=>x.amount);
  paid=saved.paid!=null?+saved.paid:sum(Pay.filter(x=>saved.ids?.includes(+String(x.ref||'').replace('S-',''))),x=>x.amount);
 }else{
  items=[{name:prMap[s.product_id]||'Product',qty:s.qty,rate:s.unit_price,amount:s.total}];
  tot=+s.total;
  paid=sum(Pay.filter(x=>x.ref===pad('S-',s.id)&&!x.voided),x=>x.amount);
 }
 const rem=r2(tot-paid);
 const mName=(METHOD.find(m=>m[0]===(saved?.method||'cash'))||['','Cash · نقد'])[1];
 const rObj={
  id:s.id,
  no:saved?.no||pad('S-',s.id),
  token:saved?.token||('S-'+String(s.id).padStart(6,'0')),
  d:s.d,
  party_name:p.name,
  party_mobile:p.mobile||'',
  method_name:mName,
  items,
  total:tot,
  paid,
  remaining:rem,
  balance_after:p.balance,
  note:saved?.note||'',
  issued_by:s.handled_by||saved?.by||ME
 };
 window._curReceipt=rObj;
 renderReceiptModal('a4');
}

function renderReceiptModal(fmtMode='a4'){
 const r=window._curReceipt;if(!r)return;
 const pgClass=fmtMode==='thermal80'?'pg thermal80':fmtMode==='thermal58'?'pg thermal58':fmtMode==='grid4'?'pg grid4':'pg';
 const pageRule=fmtMode.startsWith('thermal')?'@media print{@page{size:80mm auto;margin:0}}':'@media print{@page{size:A4;margin:6mm}}';
 let sp=$('#rp');if(!sp){sp=document.createElement('style');sp.id='rp';document.head.appendChild(sp)}
 sp.textContent=pageRule;
 const cards=fmtMode==='grid4'?[r,r,r,r].map(rcHtml).join(''):rcHtml(r);
 const msg=`Asha Inam Plastic Industry\nReceipt ${r.no} (${r.d})\nCustomer: ${r.party_name}\n`+r.items.map((x,i)=>`${i+1}. ${x.name}: ${fmt(x.qty)} × Rs ${fmt(x.rate)} = Rs ${fmt(x.amount)}`).join('\n')+`\nTotal: Rs ${fmt(r.total)}\nReceived Cash: Rs ${fmt(r.paid)}\nRemaining Balance: Rs ${fmt(r.remaining)}`;
 const m=$('#modal');m.hidden=false;
 m.innerHTML=`<div class="card rw">
  <div class="rbar no-print">
   <button class="btn" data-act="doprint">🖨️ ${L('Print / Save PDF','پرنٹ / PDF')}</button>
   <button class="btn sm ${fmtMode==='a4'?'':'alt'}" data-act="rfmt" data-f="a4">📄 A4 Full Receipt</button>
   <button class="btn sm ${fmtMode==='grid4'?'':'alt'}" data-act="rfmt" data-f="grid4">▦ A4 (4 per page)</button>
   <button class="btn sm ${fmtMode==='thermal80'?'':'alt'}" data-act="rfmt" data-f="thermal80">🧾 Thermal 80mm</button>
   <button class="btn sm ${fmtMode==='thermal58'?'':'alt'}" data-act="rfmt" data-f="thermal58">🧾 Thermal 58mm</button>
   <a class="btn sm alt" style="text-decoration:none" target="_blank" href="${wa(r.party_mobile,msg)}">💬 WhatsApp</a>
   <button class="btn sm alt" data-act="close">✖ ${L('Close','بند کریں')}</button>
  </div>
  <div class="pgs"><section class="${pgClass}">${cards}</section></div>
 </div>`;
}

H.saleinv=d=>openSaleReceipt(+d.id);
H.inv=d=>d.k==='sales'?openSaleReceipt(+d.id):inv(d);
H.rfmt=d=>renderReceiptModal(d.f);
H.doprint=()=>print();
const _cl=H.close;H.close=()=>{_cl();const s=$('#rp');s&&s.remove()};
