-- UPDATE 5 (additive: nothing is deleted, old data and expenses stay as they are)
-- Run once in Supabase > SQL Editor. It is safe to run again. Best to try it on a copy of the project first.

-- 1) Product prices typed by you (per Nug) + dated price history + granule rule
alter table products add column if not exists nug_pieces int not null default 1 check(nug_pieces>0);
alter table products add column if not exists cost_nug numeric(14,2);
alter table products add column if not exists sell_nug numeric(14,2);
alter table products add column if not exists cons_pieces numeric(14,2);   -- rule: cons_pieces pieces need cons_kg KG
alter table products add column if not exists cons_kg numeric(14,2);
update products set cost_nug=buy_price, sell_nug=sell_price where cost_nug is null;
create table if not exists product_prices(id serial primary key, product_id int not null references products(id),
 eff_date date not null, nug_pieces int not null default 1, cost_nug numeric(14,2) not null check(cost_nug>=0), sell_nug numeric(14,2) not null check(sell_nug>=0),
 cost_piece numeric(14,4) not null, sell_piece numeric(14,4) not null, set_by text, created_at timestamptz default now());
insert into product_prices(product_id,eff_date,nug_pieces,cost_nug,sell_nug,cost_piece,sell_piece,set_by)
 select id,date '2000-01-01',1,buy_price,sell_price,buy_price,sell_price,'migration'::text from products p where not exists(select 1 from product_prices x where x.product_id=p.id);

-- 2) Granules: many types, each with its own KG stock
create table if not exists granule_types(id serial primary key, name text not null unique, active boolean not null default true, created_at timestamptz default now());
insert into granule_types(name) values('Green Granules') on conflict do nothing;
create table if not exists granule_purchases(id serial primary key, d date not null default current_date, type_id int references granule_types(id),
 kg numeric(14,2) not null check(kg>0), rate numeric(14,2) not null check(rate>=0),
 total numeric(14,2) generated always as (round(kg*rate,2)) stored, note text, handled_by text,
 voided boolean not null default false, void_reason text, created_at timestamptz default now());
create table if not exists production(id serial primary key, d date not null default current_date, type_id int references granule_types(id),
 product_id int not null references products(id), pieces numeric(14,2) not null check(pieces>0),
 granules_kg numeric(14,2) not null check(granules_kg>=0), mode text not null check(mode in('manual','auto')),
 note text, handled_by text, voided boolean not null default false, void_reason text, created_at timestamptz default now());
alter table granule_purchases add column if not exists type_id int references granule_types(id);
alter table production add column if not exists type_id int references granule_types(id);
update granule_purchases set type_id=(select min(id) from granule_types) where type_id is null;
update production set type_id=(select min(id) from granule_types) where type_id is null;

-- 3) Payment methods (Cash, Bank, Easypaisa, JazzCash, UPaisa and any you add with the + button)
create table if not exists payment_methods(code text primary key, name text not null, details text, active boolean not null default true, sort int not null default 0);
insert into payment_methods(code,name,sort) values('cash','Cash · نقد',1),('bank','Bank · بینک',2),('easypaisa','Easypaisa · ایزی پیسہ',3),('jazzcash','JazzCash · جیز کیش',4),('upaisa','UPaisa · یو پیسہ',5) on conflict do nothing;
do $$ declare r record; begin   -- the old rule "only cash or bank" is removed so new wallets can be saved
 for r in select c.conrelid::regclass as t, c.conname from pg_constraint c
  where c.contype='c' and c.conrelid in('payments'::regclass,'loans'::regclass,'loan_payments'::regclass,'expenses'::regclass) and pg_get_constraintdef(c.oid) ilike '%method%'
 loop execute format('alter table %s drop constraint %I',r.t,r.conname); end loop; end $$;

-- 4) Receipts (each has its own secret token, used by the QR code)
create table if not exists receipts(id serial primary key, no text not null unique, token text not null unique, d date not null,
 party_id int not null references parties(id), party_name text not null, party_mobile text, amount numeric(14,2) not null check(amount>0),
 method text not null, method_name text not null, note text, payment_id int references payments(id), balance_after numeric(14,2),
 issued_by text, voided boolean not null default false, created_at timestamptz default now());

-- 5) Security: read-only for logged-in users, all changes go through the functions below, and every change is logged
do $$ declare t text; begin foreach t in array array['product_prices','granule_types','granule_purchases','production','payment_methods','receipts'] loop
 execute format('alter table %I enable row level security',t);
 execute format('drop policy if exists sel on %I',t);
 execute format('create policy sel on %I for select using (is_allowed())',t);
 execute format('revoke all on %I from anon,authenticated',t);
 execute format('grant select on %I to authenticated',t);
 execute format('drop trigger if exists aud on %I',t);
 execute format('create trigger aud after insert or update or delete on %I for each row execute function audit()',t); end loop; end $$;

-- 6) Functions
drop function if exists granules_left();
drop function if exists add_granules(date,numeric,numeric,text,text);
drop function if exists create_production(date,int,numeric,numeric,text,text,text);
drop function if exists set_product_price(int,date,numeric,numeric,text);

create or replace function granules_left(p_type int) returns numeric language sql stable security definer set search_path=public as $$
 select coalesce((select sum(kg) from granule_purchases where not voided and type_id=p_type),0)-coalesce((select sum(granules_kg) from production where not voided and type_id=p_type),0) $$;

create or replace function add_granule_type(p_name text) returns int language plpgsql security definer set search_path=public as $$ declare i int; begin
 if not is_allowed() then raise exception 'Access denied'; end if;
 if length(trim(coalesce(p_name,'')))=0 then raise exception 'Type a name'; end if;
 if exists(select 1 from granule_types where lower(name)=lower(trim(p_name))) then raise exception 'This granule type already exists'; end if;
 insert into granule_types(name) values(trim(p_name)) returning id into i; return i; end $$;

create or replace function add_granules(p_date date,p_kg numeric,p_rate numeric,p_note text,p_by text,p_type int) returns int
language plpgsql security definer set search_path=public as $$ declare i int; begin
 if not is_allowed() then raise exception 'Access denied'; end if;
 if not exists(select 1 from granule_types where id=p_type) then raise exception 'Choose a granule type'; end if;
 insert into granule_purchases(d,kg,rate,note,handled_by,type_id) values(p_date,p_kg,p_rate,p_note,p_by,p_type) returning id into i; return i; end $$;

create function set_product_price(p_product int,p_date date,p_cost_nug numeric,p_sell_nug numeric,p_by text) returns int
language plpgsql security definer set search_path=public as $$ declare i int; n int; r product_prices; begin
 if not is_allowed() then raise exception 'Access denied'; end if;
 if p_date>current_date then raise exception 'Date cannot be in the future'; end if;
 select nug_pieces into n from products where id=p_product; if not found then raise exception 'Product not found'; end if;
 insert into product_prices(product_id,eff_date,nug_pieces,cost_nug,sell_nug,cost_piece,sell_piece,set_by)
  values(p_product,p_date,n,p_cost_nug,p_sell_nug,p_cost_nug/n,p_sell_nug/n,p_by) returning id into i;
 select * into r from product_prices where product_id=p_product and eff_date<=current_date order by eff_date desc,id desc limit 1;
 -- the sale form keeps using buy_price/sell_price, so new sales take the price you typed
 update products set cost_nug=r.cost_nug,sell_nug=r.sell_nug,buy_price=round(r.cost_nug/n,2),sell_price=round(r.sell_nug/n,2) where id=p_product;
 return i; end $$;

create or replace function set_product_rule(p_product int,p_nug int,p_cons_pieces numeric,p_cons_kg numeric) returns void
language plpgsql security definer set search_path=public as $$ begin
 if not is_allowed() then raise exception 'Access denied'; end if;
 if p_nug<1 then raise exception 'Nug must be 1 or more'; end if;
 update products set nug_pieces=p_nug,cons_pieces=p_cons_pieces,cons_kg=p_cons_kg,   -- per-piece prices stay the same
  cost_nug=round(buy_price*p_nug,2),sell_nug=round(sell_price*p_nug,2) where id=p_product; end $$;

create function create_production(p_date date,p_product int,p_pieces numeric,p_kg numeric,p_mode text,p_note text,p_by text,p_type int) returns int
language plpgsql security definer set search_path=public as $$ declare i int; k numeric:=p_kg; pr products; begin
 if not is_allowed() then raise exception 'Access denied'; end if;
 perform pg_advisory_xact_lock(7001);                       -- stops two entries deducting at the same moment
 select * into pr from products where id=p_product; if not found then raise exception 'Product not found'; end if;
 if not exists(select 1 from granule_types where id=p_type) then raise exception 'Choose a granule type'; end if;
 if p_mode='auto' then
  if coalesce(pr.cons_pieces,0)<=0 or coalesce(pr.cons_kg,0)<=0 then raise exception 'Set the granule rule for this product first (Dashboard > Nug button)'; end if;
  k:=round(p_pieces*pr.cons_kg/pr.cons_pieces,2); end if;
 if k>granules_left(p_type) then raise exception 'Only % KG of this granule type is left, this needs % KG',granules_left(p_type),k; end if;
 insert into production(d,product_id,pieces,granules_kg,mode,note,handled_by,type_id) values(p_date,p_product,p_pieces,k,p_mode,p_note,p_by,p_type) returning id into i;
 update products set stock=stock+p_pieces where id=p_product; return i; end $$;

create or replace function add_payment_method(p_name text,p_details text) returns text language plpgsql security definer set search_path=public as $$ declare c text; begin
 if not is_allowed() then raise exception 'Access denied'; end if;
 c:=lower(regexp_replace(coalesce(p_name,''),'[^A-Za-z0-9]','','g'));
 if c='' then raise exception 'Type a name using letters or numbers'; end if;
 if exists(select 1 from payment_methods where code=c or lower(name)=lower(trim(p_name))) then raise exception 'This payment method already exists'; end if;
 insert into payment_methods(code,name,details,sort) values(c,trim(p_name),p_details,(select coalesce(max(sort),0)+1 from payment_methods)); return c; end $$;

create or replace function create_receipt(p_party int,p_amount numeric,p_method text,p_date date,p_note text,p_by text) returns int
language plpgsql security definer set search_path=public as $$
declare rid int; pid int; pn parties; mn text; bal numeric; tok text:=replace(gen_random_uuid()::text,'-',''); begin
 if not is_allowed() then raise exception 'Access denied'; end if;
 if p_amount<=0 then raise exception 'Invalid amount'; end if;
 select * into pn from parties where id=p_party; if not found then raise exception 'Customer not found'; end if;
 select name into mn from payment_methods where code=p_method and active; if not found then raise exception 'Unknown payment method'; end if;
 rid:=nextval(pg_get_serial_sequence('receipts','id'));
 insert into payments(d,party_id,dir,amount,method,ref,note) values(p_date,p_party,'in',p_amount,p_method,'R-'||lpad(rid::text,6,'0'),coalesce(nullif(p_note,''),'Payment received')) returning id into pid;
 select balance into bal from party_balance where id=p_party;
 insert into receipts(id,no,token,d,party_id,party_name,party_mobile,amount,method,method_name,note,payment_id,balance_after,issued_by)
  values(rid,'R-'||lpad(rid::text,6,'0'),tok,p_date,p_party,pn.name,pn.mobile,p_amount,p_method,mn,nullif(p_note,''),pid,bal,p_by);
 return rid; end $$;

-- Used by the public receipt page (QR code). Returns only the one receipt whose secret token is given.
create or replace function get_receipt(p_token text) returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object('no',r.no,'d',r.d,'party',r.party_name,'mobile',r.party_mobile,'amount',r.amount,'method',r.method_name,'note',r.note,'balance',r.balance_after,
  'voided',(r.voided or coalesce((select p.voided from payments p where p.id=r.payment_id),false)))
 from receipts r where r.token=p_token $$;

revoke execute on function granules_left(int),add_granule_type(text),add_granules(date,numeric,numeric,text,text,int),set_product_price(int,date,numeric,numeric,text),set_product_rule(int,int,numeric,numeric),create_production(date,int,numeric,numeric,text,text,text,int),add_payment_method(text,text),create_receipt(int,numeric,text,date,text,text),get_receipt(text) from public,anon;
grant execute on function granules_left(int),add_granule_type(text),add_granules(date,numeric,numeric,text,text,int),set_product_price(int,date,numeric,numeric,text),set_product_rule(int,int,numeric,numeric),create_production(date,int,numeric,numeric,text,text,text,int),add_payment_method(text,text),create_receipt(int,numeric,text,date,text,text) to authenticated;
grant execute on function get_receipt(text) to anon,authenticated;
notify pgrst,'reload schema';
