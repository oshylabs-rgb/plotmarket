-- Plotmarket demo seed (applied 2026-08-24)
-- Three demo stakeholder accounts (individual, agent, developer) and eight
-- listings so newcomers see a populated marketplace. The demo auth users get
-- random bcrypt hashes of throwaway uuids, so the accounts cannot be logged
-- into. Every listing says it is a demo in its description.
-- Idempotent: users are keyed by email, listings skipped if any '%Demo%'
-- title already exists.
--
-- All images referenced below live in the property-media bucket: thirteen
-- Laterite Light listing illustrations (pm-*.jpg) and two 360 panoramas
-- (demo_360_interior.jpg, demo_360_plot.jpg), uploaded via the dashboard.

do $$
declare
  v_ind uuid; v_agt uuid; v_dev uuid;
begin
  select id into v_ind from auth.users where email = 'demo.individual@plotmarket.ng';
  if v_ind is null then
    v_ind := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin)
    values ('00000000-0000-0000-0000-000000000000', v_ind, 'authenticated', 'authenticated',
      'demo.individual@plotmarket.ng', crypt(gen_random_uuid()::text, gen_salt('bf')),
      now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Adaeze Okafor","phone":"+234 803 555 0101","user_type":"individual"}'::jsonb, false);
  end if;

  select id into v_agt from auth.users where email = 'demo.agent@plotmarket.ng';
  if v_agt is null then
    v_agt := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin)
    values ('00000000-0000-0000-0000-000000000000', v_agt, 'authenticated', 'authenticated',
      'demo.agent@plotmarket.ng', crypt(gen_random_uuid()::text, gen_salt('bf')),
      now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Tunde Bakare","phone":"+234 805 555 0202","user_type":"agent","company_name":"Bakare Prime Properties","cac_number":"RC-4482913"}'::jsonb, false);
  end if;

  select id into v_dev from auth.users where email = 'demo.developer@plotmarket.ng';
  if v_dev is null then
    v_dev := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin)
    values ('00000000-0000-0000-0000-000000000000', v_dev, 'authenticated', 'authenticated',
      'demo.developer@plotmarket.ng', crypt(gen_random_uuid()::text, gen_salt('bf')),
      now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Ngozi Eze","phone":"+234 809 555 0303","user_type":"developer","company_name":"Crestline Developments Ltd","cac_number":"RC-1907735"}'::jsonb, false);
  end if;

  update public.profiles set is_verified = true, account_type = 'starter' where id = v_agt;
  update public.profiles set is_verified = true, account_type = 'professional' where id = v_dev;

  if not exists (select 1 from public.properties where title like '%Demo%') then
    insert into public.properties (user_id, title, description, type, listing_type, price, location, state, city,
      bedrooms, bathrooms, area, images, videos, images_360, videos_360, title_document, features, status, is_featured, is_verified)
    values
    (v_ind, 'Clean 2 Bedroom Flat, Surulere (Demo)',
     'Well kept two bedroom flat on a quiet street, five minutes from Adeniran Ogunsanya. Demo listing created to show the platform.',
     'apartment', 'rent', 1800000, 'Bode Thomas, Surulere', 'Lagos', 'Surulere',
     2, 2, 85, array['https://lmfsqfwdgxlsuozxyauy.supabase.co/storage/v1/object/public/property-media/pm-flat1.jpg','https://lmfsqfwdgxlsuozxyauy.supabase.co/storage/v1/object/public/property-media/pm-flat2.jpg'],
     '{}', '{}', '{}', 'family_receipt', array['Prepaid meter','Water treatment','Gated street'],
     'approved', false, false),
    (v_ind, 'Half Plot of Family Land, Ikorodu (Demo)',
     'Dry half plot in a developing area, family receipt available for inspection. Demo listing created to show the platform.',
     'land', 'sale', 9500000, 'Agric, Ikorodu', 'Lagos', 'Ikorodu',
     null, null, 300, array['https://lmfsqfwdgxlsuozxyauy.supabase.co/storage/v1/object/public/property-media/pm-land1.jpg'],
     '{}', '{}', '{}', 'family_receipt', array['Dry land','Fenced'],
     'approved', false, false),
    (v_agt, 'Five Bedroom Detached Duplex with BQ, Lekki Phase 1 (Demo)',
     'Contemporary detached duplex with a room and parlour BQ, fitted kitchen and rooftop terrace. Take the 360 tour below. Demo listing created to show the platform.',
     'house', 'sale', 320000000, 'Admiralty Way, Lekki Phase 1', 'Lagos', 'Lekki',
     5, 5, 620, array['https://lmfsqfwdgxlsuozxyauy.supabase.co/storage/v1/object/public/property-media/pm-duplex1.jpg','https://lmfsqfwdgxlsuozxyauy.supabase.co/storage/v1/object/public/property-media/pm-duplex2.jpg','https://lmfsqfwdgxlsuozxyauy.supabase.co/storage/v1/object/public/property-media/pm-duplex3.jpg'],
     '{}', array['https://lmfsqfwdgxlsuozxyauy.supabase.co/storage/v1/object/public/property-media/demo_360_interior.jpg'],
     '{}', 'c_of_o', array['Swimming pool','CCTV','Fitted kitchen','BQ','Rooftop terrace'],
     'approved', true, true),
    (v_agt, 'Serviced 3 Bedroom Apartment, Wuse 2 (Demo)',
     'Serviced apartment with uninterrupted power, in a secured estate close to the corporate district. Demo listing created to show the platform.',
     'apartment', 'rent', 7500000, 'Aminu Kano Crescent, Wuse 2', 'FCT Abuja', 'Abuja',
     3, 3, 140, array['https://lmfsqfwdgxlsuozxyauy.supabase.co/storage/v1/object/public/property-media/pm-wuse1.jpg','https://lmfsqfwdgxlsuozxyauy.supabase.co/storage/v1/object/public/property-media/pm-wuse2.jpg'],
     '{}', '{}', '{}', 'governors_consent', array['24/7 power','Elevator','Gym','Concierge'],
     'approved', false, true),
    (v_agt, 'Open Plan Office Space, GRA Port Harcourt (Demo)',
     'Ground floor commercial space suitable for banking hall or showroom, generous parking. Demo listing created to show the platform.',
     'commercial', 'lease', 15000000, 'Aba Road, GRA Phase 2', 'Rivers', 'Port Harcourt',
     null, 2, 450, array['https://lmfsqfwdgxlsuozxyauy.supabase.co/storage/v1/object/public/property-media/pm-office1.jpg'],
     '{}', '{}', '{}', 'deed_of_assignment', array['Generator house','Parking for 20 cars'],
     'approved', false, false),
    (v_dev, 'Crestline Court: 4 Bedroom Terraces, Sangotedo (Demo)',
     'Off plan terraces in a gated estate of 40 units, paved roads, central sewage and estate power. Completion Q4. Demo listing created to show the platform.',
     'development', 'sale', 95000000, 'Monastery Road, Sangotedo', 'Lagos', 'Ajah',
     4, 4, 280, array['https://lmfsqfwdgxlsuozxyauy.supabase.co/storage/v1/object/public/property-media/pm-estate1.jpg','https://lmfsqfwdgxlsuozxyauy.supabase.co/storage/v1/object/public/property-media/pm-estate2.jpg'],
     '{}', '{}', '{}', 'excision', array['Gated estate','Estate power','Central sewage','Paved roads'],
     'approved', true, true),
    (v_dev, 'Serviced Residential Plots, Kuje Scheme (Demo)',
     'Corner piece plots inside a government approved scheme, gazette available. View the plot in 360 below. Demo listing created to show the platform.',
     'land', 'sale', 28000000, 'Kuje District', 'FCT Abuja', 'Kuje',
     null, null, 600, array['https://lmfsqfwdgxlsuozxyauy.supabase.co/storage/v1/object/public/property-media/pm-plots1.jpg'],
     '{}', array['https://lmfsqfwdgxlsuozxyauy.supabase.co/storage/v1/object/public/property-media/demo_360_plot.jpg'],
     '{}', 'gazette', array['Corner piece','Survey beacons in place'],
     'approved', false, true),
    (v_dev, 'Ibadan Mixed Use Development, Bodija (Demo)',
     'Proposed mixed use development, awaiting review. Demo listing created to show the platform, and to show the admin approval queue.',
     'development', 'sale', 150000000, 'Awolowo Avenue, Bodija', 'Oyo', 'Ibadan',
     null, null, 1200, array['https://lmfsqfwdgxlsuozxyauy.supabase.co/storage/v1/object/public/property-media/pm-mixed1.jpg'],
     '{}', '{}', '{}', 'registered_survey', array['Corner piece'],
     'pending', false, false);

    insert into public.inquiries (property_id, sender_id, receiver_id, message, status)
    select p.id, v_ind, v_agt,
      'Good afternoon, is the Lekki duplex still available? I would like to inspect on Saturday. (Demo inquiry)', 'unread'
    from public.properties p
    where p.user_id = v_agt and p.title like '%Lekki%' limit 1;
  end if;
end $$;
