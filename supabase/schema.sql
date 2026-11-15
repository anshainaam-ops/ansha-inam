-- ANSHA INAM PLASTIC INDUSTRY — run once in Supabase > SQL Editor
create table allowed_users(user_id uuid primary key);
create table products(id serial primary key,name_en text not null,name_ur text,buy_price numeric(14,2) not null default 0,sell_price numeric(14,2) not null default 0,stock numeric(14,2) not null default 0 check(stock>=0),min_stock numeric(14,2) not null default 100,image_url text);
create table parties(id serial primary key,kind text not null check(kind in('customer','supplier')),name text not null,mobile text);
create table sales(id serial primary key,d date not null,party_id int not null references parties,product_id int not null references products,qty numeric(14,2) not null check(qty>0),unit_price numeric(14,2) not null check(unit_price>=0),unit_cost numeric(14,2) not null,total numeric(14,2) generated always as (round(qty*unit_price,2)) stored);
create table purchases(id serial primary key,d date not null,party_id int not null references parties,product_id int not null references products,qty numeric(14,2) not null check(qty>0),unit_price numeric(14,2) not null check(unit_price>=0),total numeric(14,2) generated always as (round(qty*unit_price,2)) stored);
create table payments(id serial primary key,d date not null,party_id int references parties,dir text not null check(dir in('in','out')),amount numeric(14,2) not null check(amount>0),method text not null default 'cash' check(method in('cash','bank')),ref text,note text);
create table loans(id serial primary key,kind text not null check(kind in('given','taken')),person text not null,mobile text,amount numeric(14,2) not null check(amount>0),d date not null,reason text,due date,method text not null default 'cash' check(method in('cash','bank')));
create table loan_payments(id serial primary key,loan_id int not null references loans,amount numeric(14,2) not null check(amount>0),d date not null,method text not null default 'cash' check(method in('cash','bank')));
create table expenses(id serial primary key,d date not null,category text not null,amount numeric(14,2) not null check(amount>0),method text not null default 'cash' check(method in('cash','bank')),note text);
create table stock_adjustments(id serial primary key,d date not null default current_date,product_id int not null references products,delta numeric(14,2) not null,reason text);
create table audit_log(id bigserial primary key,at timestamptz default now(),user_id uuid,email text,tbl text,op text,row jsonb);

create function is_allowed() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from allowed_users where user_id=auth.uid()) $$;
create function audit() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into audit_log(user_id,email,tbl,op,row) values(auth.uid(),auth.jwt()->>'email',tg_table_name,tg_op,to_jsonb(new)); return new; end $$;

-- every table: who/when, RLS, audit. No DELETE policy exists anywhere => records are permanent.
do $$ declare t text; begin foreach t in array array['products','parties','sales','purchases','payments','loans','loan_payments','expenses','stock_adjustments'] loop
 execute format('alter table %I add column created_by uuid default auth.uid(), add column created_at timestamptz default now()',t);
 execute format('create trigger aud after insert or update on %I for each row execute function audit()',t);
 execute format('alter table %I enable row level security',t);
 execute format('create policy sel on %I for select using (is_allowed())',t);
 if t in('parties','payments','loans','expenses','products') then execute format('create policy ins on %I for insert with check (is_allowed())',t); end if;
 if t in('products','parties') then execute format('create policy upd on %I for update using (is_allowed()) with check (is_allowed())',t); end if;
end loop; end $$;
alter table audit_log enable row level security; create policy sel on audit_log for select using (is_allowed());
alter table allowed_users enable row level security;  -- no policies: nobody can read/write directly

-- Money/stock only change through these functions (atomic, row-locked => safe for 2 users at once)
create function create_sale(p_party int,p_product int,p_qty numeric,p_price numeric,p_paid numeric,p_method text,p_date date) returns int language plpgsql security definer set search_path=public as $$
declare c numeric; s numeric; sid int; begin
 if not is_allowed() then raise exception 'Access denied'; end if;
 if p_qty<=0 or p_price<0 or p_paid<0 then raise exception 'Invalid amounts'; end if;
 select stock,buy_price into s,c from products where id=p_product for update;
 if not found then raise exception 'Product not found'; end if;
 if s<p_qty then raise exception 'Insufficient stock: only % available',s; end if;
 update products set stock=stock-p_qty where id=p_product;
 insert into sales(d,party_id,product_id,qty,unit_price,unit_cost) values(p_date,p_party,p_product,p_qty,p_price,c) returning id into sid;
 if p_paid>0 then insert into payments(d,party_id,dir,amount,method,ref,note) values(p_date,p_party,'in',p_paid,p_method,'S-'||lpad(sid::text,6,'0'),'Paid with sale'); end if;
 return sid; end $$;
create function create_purchase(p_party int,p_product int,p_qty numeric,p_price numeric,p_paid numeric,p_method text,p_date date) returns int language plpgsql security definer set search_path=public as $$
declare pid int; begin
 if not is_allowed() then raise exception 'Access denied'; end if;
 if p_qty<=0 or p_price<0 or p_paid<0 then raise exception 'Invalid amounts'; end if;
 perform 1 from products where id=p_product for update; if not found then raise exception 'Product not found'; end if;
 -- weighted-average cost keeps profit accurate
 update products set buy_price=case when stock+p_qty>0 then round((stock*buy_price+p_qty*p_price)/(stock+p_qty),2) else p_price end, stock=stock+p_qty where id=p_product;
 insert into purchases(d,party_id,product_id,qty,unit_price) values(p_date,p_party,p_product,p_qty,p_price) returning id into pid;
 if p_paid>0 then insert into payments(d,party_id,dir,amount,method,ref,note) values(p_date,p_party,'out',p_paid,p_method,'P-'||lpad(pid::text,6,'0'),'Paid with purchase'); end if;
 return pid; end $$;
create function pay_loan(p_loan int,p_amount numeric,p_method text,p_date date) returns void language plpgsql security definer set search_path=public as $$
declare l loans; paid numeric; begin
 if not is_allowed() then raise exception 'Access denied'; end if;
 select * into l from loans where id=p_loan for update; if not found then raise exception 'Loan not found'; end if;
 select coalesce(sum(amount),0) into paid from loan_payments where loan_id=p_loan;
 if p_amount<=0 or p_amount>l.amount-paid then raise exception 'Amount must be between 0 and remaining %',l.amount-paid; end if;
 insert into loan_payments(loan_id,amount,d,method) values(p_loan,p_amount,p_date,p_method); end $$;
create function adjust_stock(p_product int,p_delta numeric,p_reason text) returns void language plpgsql security definer set search_path=public as $$
begin if not is_allowed() then raise exception 'Access denied'; end if;
 update products set stock=stock+p_delta where id=p_product;
 insert into stock_adjustments(product_id,delta,reason) values(p_product,p_delta,p_reason); end $$;

create view party_balance with(security_invoker=true) as select p.*, case when p.kind='customer'
 then coalesce((select sum(total) from sales where party_id=p.id),0)-coalesce((select sum(amount) from payments where party_id=p.id and dir='in'),0)
 else coalesce((select sum(total) from purchases where party_id=p.id),0)-coalesce((select sum(amount) from payments where party_id=p.id and dir='out'),0) end as balance from parties p;
create view loan_status with(security_invoker=true) as select l.*,coalesce(x.paid,0) paid,l.amount-coalesce(x.paid,0) remaining,
 case when l.amount-coalesce(x.paid,0)=0 then 'Paid' when x.paid>0 then 'Partial' else 'Open' end status
 from loans l left join (select loan_id,sum(amount) paid from loan_payments group by 1) x on x.loan_id=l.id;

-- lock down privileges
revoke all on all tables in schema public from anon,authenticated;
revoke execute on all functions in schema public from public,anon;
grant select on all tables in schema public to authenticated;
grant insert on parties,payments,loans,expenses,products to authenticated;
grant update(name_en,name_ur,sell_price,min_stock,image_url) on products to authenticated;
grant update(name,mobile) on parties to authenticated;
grant usage on all sequences in schema public to authenticated;
grant execute on function is_allowed(),create_sale(int,int,numeric,numeric,numeric,text,date),create_purchase(int,int,numeric,numeric,numeric,text,date),pay_loan(int,numeric,text,date),adjust_stock(int,numeric,text) to authenticated;

insert into products(name_en,name_ur) values('Magga (Lota)','مگہ (لوٹا)'),('Sabzi Rack','سبزی ریکس'),('Katkay','کٹکے'),('Basket','باسکٹ'),('Hangers','ہینگرز'),('Chaba','چھابہ'),('Glass','گلاس');

-- AFTER creating the 2 users in Authentication > Users, run (put their real emails):
-- insert into allowed_users select id from auth.users where email in ('inamullah@EMAIL.com','aizaz@EMAIL.com');
-- UPDATE 1 — run in Supabase > SQL Editor ONLY if you already ran the first schema.sql.
-- (Fresh install? Just run the new full schema.sql — it already includes this.)
alter table sales add column handled_by text check(handled_by in('Inamullah','Aizaz Khan'));
alter table purchases add column handled_by text check(handled_by in('Inamullah','Aizaz Khan'));
alter table payments add column handled_by text check(handled_by in('Inamullah','Aizaz Khan'));
alter table loans add column handled_by text check(handled_by in('Inamullah','Aizaz Khan')), add column party_id int references parties;

drop function create_sale(int,int,numeric,numeric,numeric,text,date);
drop function create_purchase(int,int,numeric,numeric,numeric,text,date);
create function create_sale(p_party int,p_product int,p_qty numeric,p_price numeric,p_paid numeric,p_method text,p_date date,p_by text) returns int language plpgsql security definer set search_path=public as $$
declare c numeric; s numeric; sid int; begin
 if not is_allowed() then raise exception 'Access denied'; end if;
 if p_qty<=0 or p_price<0 or p_paid<0 then raise exception 'Invalid amounts'; end if;
 select stock,buy_price into s,c from products where id=p_product for update;
 if not found then raise exception 'Product not found'; end if;
 if s<p_qty then raise exception 'Insufficient stock: only % available',s; end if;
 update products set stock=stock-p_qty where id=p_product;
 insert into sales(d,party_id,product_id,qty,unit_price,unit_cost,handled_by) values(p_date,p_party,p_product,p_qty,p_price,c,p_by) returning id into sid;
 if p_paid>0 then insert into payments(d,party_id,dir,amount,method,ref,note,handled_by) values(p_date,p_party,'in',p_paid,p_method,'S-'||lpad(sid::text,6,'0'),'Paid with sale',p_by); end if;
 return sid; end $$;
create function create_purchase(p_party int,p_product int,p_qty numeric,p_price numeric,p_paid numeric,p_method text,p_date date,p_by text) returns int language plpgsql security definer set search_path=public as $$
declare pid int; begin
 if not is_allowed() then raise exception 'Access denied'; end if;
 if p_qty<=0 or p_price<0 or p_paid<0 then raise exception 'Invalid amounts'; end if;
 perform 1 from products where id=p_product for update; if not found then raise exception 'Product not found'; end if;
 update products set buy_price=case when stock+p_qty>0 then round((stock*buy_price+p_qty*p_price)/(stock+p_qty),2) else p_price end, stock=stock+p_qty where id=p_product;
 insert into purchases(d,party_id,product_id,qty,unit_price,handled_by) values(p_date,p_party,p_product,p_qty,p_price,p_by) returning id into pid;
 if p_paid>0 then insert into payments(d,party_id,dir,amount,method,ref,note,handled_by) values(p_date,p_party,'out',p_paid,p_method,'P-'||lpad(pid::text,6,'0'),'Paid with purchase',p_by); end if;
 return pid; end $$;
revoke execute on function create_sale(int,int,numeric,numeric,numeric,text,date,text),create_purchase(int,int,numeric,numeric,numeric,text,date,text) from public,anon;
grant execute on function create_sale(int,int,numeric,numeric,numeric,text,date,text),create_purchase(int,int,numeric,numeric,numeric,text,date,text) to authenticated;
