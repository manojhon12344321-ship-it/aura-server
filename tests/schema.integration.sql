\set ON_ERROR_STOP on
insert into auth.users(id,raw_user_meta_data) values('00000000-0000-0000-0000-000000000001','{"name":"Admin Test"}'),('00000000-0000-0000-0000-000000000002','{"name":"Client Test"}');
do $$begin
assert (select role='admin' from public.profiles where id='00000000-0000-0000-0000-000000000001'),'First user must be admin';
assert (select role='client' from public.profiles where id='00000000-0000-0000-0000-000000000002'),'Subsequent users must be clients';
assert (select count(*)=12 from public.products),'12 seed products required';
assert (select bool_and(jsonb_array_length(images)=5) from public.products),'Five images per product required';
end$$;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$declare result jsonb;pid uuid;before_stock int;begin
select id,stock into pid,before_stock from public.products where sku='DG-0001';
result:=public.checkout(jsonb_build_array(jsonb_build_object('product_id',pid,'quantity',2)),'{"name":"Client Test","cep":"45995-000","street":"Rua Teste","number":"10","city":"Teste","state":"BA"}','mock_pix','DIVINOS10');
assert public.checkout(jsonb_build_array(jsonb_build_object('product_id',pid,'quantity',2)),'{"name":"Client Test","cep":"45995-000","street":"Rua Teste","number":"10","city":"Teste","state":"BA"}','mock_pix','DIVINOS10',(result->>'request_id')::uuid)->>'id'=result->>'id','Retry must return the same order';
assert (result->>'status')='paid','Mock checkout must transition to paid';
assert (result->>'subtotal')::numeric=6999.8,'Subtotal must use database prices';
assert (result->>'discount')::numeric=699.98,'10 percent coupon must apply';
assert (result->>'total')::numeric=6299.82,'Total must match discount and free shipping';
assert (select stock=before_stock-2 from public.products where id=pid),'Stock must decrement';
assert (select count(*)=1 from public.orders),'Owner can read order';
assert (select count(*)=1 from public.order_items),'Owner can read order items';
begin
perform public.checkout(jsonb_build_array(jsonb_build_object('product_id',pid,'quantity',999)),'{"name":"Client Test","cep":"45995-000","street":"Rua Teste","number":"10","city":"Teste","state":"BA"}','mock_pix','');
raise exception 'Oversell unexpectedly succeeded';
exception when raise_exception then assert sqlerrm='Produto indisponível ou estoque insuficiente','Oversell must reject';end;
assert (select count(*)=1 from public.orders),'Failed checkout must not create order';
assert (select stock=before_stock-2 from public.products where id=pid),'Failed checkout must preserve stock';
begin update public.profiles set role='admin' where id=auth.uid();raise exception 'Role escalation succeeded';exception when insufficient_privilege then null;end;
update public.profiles set name='Updated Client' where id=auth.uid();
assert (select name='Updated Client' from public.profiles where id=auth.uid()),'Owner must be able to update name';
assert (select count(*)=0 from public.coupons),'Client cannot enumerate coupons';
end$$;
reset role;
insert into auth.users(id,raw_user_meta_data) values('00000000-0000-0000-0000-000000000003','{"name":"Other Client"}');
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
do $$begin assert (select count(*)=0 from public.orders),'Other clients cannot read orders';assert (select count(*)=0 from public.order_items),'Other clients cannot read order items';end$$;
reset role;
do $$begin assert (select used_count=1 from public.coupons where code='DIVINOS10'),'Coupon usage must increment exactly once';end$$;
select 'PASS: seed, roles, checkout totals, stock, rollback, profile privileges, order isolation, coupon usage' as result;
