-- Enable pgcrypto for gen_random_bytes
create extension if not exists pgcrypto;

-- PROFILES
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  nome text,
  cognome text,
  email text,
  telefono text,
  verification_level int not null default 0,
  share_token text unique default encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz not null default now()
);

-- ADMIN USERS
create table admin_users (
  id uuid references auth.users on delete cascade primary key
);

-- PROPERTIES
create table properties (
  id uuid primary key default gen_random_uuid(),
  indirizzo text not null,
  citta text not null,
  cap text,
  provincia text,
  dati_catastali jsonb,
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);

-- TENANCIES
create table tenancies (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties on delete restrict not null,
  landlord_id uuid references auth.users on delete set null,
  tenant_id uuid references auth.users on delete set null,
  landlord_invite_email text,
  tenant_invite_email text,
  estremi_registrazione_rli text,
  data_inizio date not null,
  data_fine date,
  stato text not null default 'proposta' check (stato in ('proposta','confermata','attiva','chiusa')),
  landlord_confirmed_at timestamptz,
  tenant_confirmed_at timestamptz,
  review_window_closes_at timestamptz,
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);

-- REVIEWS
create table reviews (
  id uuid primary key default gen_random_uuid(),
  tenancy_id uuid references tenancies on delete cascade not null,
  author_id uuid references auth.users on delete set null,
  recipient_id uuid references auth.users on delete set null,
  recipient_email text,
  direction text not null check (direction in ('tenant_to_landlord','landlord_to_tenant')),
  ratings jsonb not null default '{}',
  testo text check (char_length(testo) <= 1500),
  stato text not null default 'bozza' check (stato in ('bozza','depositata','pubblicata','contestata','sospesa','archiviata')),
  expires_at timestamptz not null default now() + interval '24 months',
  published_at timestamptz,
  created_at timestamptz not null default now()
);

-- CERTIFIED CHECKINS
create table certified_checkins (
  id uuid primary key default gen_random_uuid(),
  tenancy_id uuid references tenancies on delete cascade not null,
  requested_by uuid references auth.users on delete set null,
  periodo text,
  dichiarazioni jsonb,
  landlord_signed_at timestamptz,
  tenant_signed_at timestamptz,
  stato text not null default 'attesa',
  payment_status text not null default 'unpaid',
  created_at timestamptz not null default now()
);

-- DISPUTES
create table disputes (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references reviews on delete cascade not null,
  opened_by uuid references auth.users on delete set null,
  motivo text,
  evidenze jsonb,
  replica_pubblica text,
  stato text not null default 'aperta',
  esito_note text,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

-- IDENTITY VERIFICATIONS
create table identity_verifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles on delete cascade not null,
  stato text not null default 'pending' check (stato in ('pending','approved','rejected')),
  note_admin text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- SHARE TOKENS
create table share_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles on delete cascade not null,
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz not null default now() + interval '30 days',
  created_at timestamptz not null default now()
);

-- NOTIFICATIONS
create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient uuid references auth.users on delete cascade,
  tipo text not null,
  payload jsonb,
  sent_at timestamptz not null default now()
);

-- ========================
-- FUNCTIONS & TRIGGERS
-- ========================

create or replace function is_admin()
returns boolean language sql security definer as $$
  select exists (select 1 from admin_users where id = auth.uid());
$$;

create or replace function is_tenancy_member(t_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from tenancies
    where id = t_id and (landlord_id = auth.uid() or tenant_id = auth.uid())
  );
$$;

-- Trigger: crea profilo automaticamente alla registrazione
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, nome, cognome)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', ''),
    coalesce(new.raw_user_meta_data->>'cognome', '')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Trigger: aggiorna stato tenancy quando entrambi confermano
create or replace function check_tenancy_confirmation()
returns trigger language plpgsql as $$
begin
  if new.landlord_confirmed_at is not null and new.tenant_confirmed_at is not null
     and old.stato = 'proposta' then
    new.stato := 'confermata';
  end if;
  return new;
end;
$$;

create or replace trigger on_tenancy_update
  before update on tenancies
  for each row execute function check_tenancy_confirmation();

-- Trigger: apre disputa → mette review in contestata
create or replace function on_dispute_opened()
returns trigger language plpgsql as $$
begin
  update reviews set stato = 'contestata' where id = new.review_id;
  return new;
end;
$$;

create or replace trigger on_dispute_insert
  after insert on disputes
  for each row execute function on_dispute_opened();

-- Trigger: verifica approvata → aggiorna verification_level
create or replace function on_verification_approved()
returns trigger language plpgsql as $$
begin
  if new.stato = 'approved' and old.stato != 'approved' then
    update profiles set verification_level = 1 where id = new.profile_id;
  end if;
  return new;
end;
$$;

create or replace trigger on_verification_update
  after update on identity_verifications
  for each row execute function on_verification_approved();

-- try_publish_reviews: pubblica le due review di una tenancy se entrambe depositate
create or replace function try_publish_reviews(t_id uuid)
returns void language plpgsql security definer as $$
declare
  cnt int;
begin
  select count(*) into cnt from reviews
  where tenancy_id = t_id and stato = 'depositata';
  if cnt = 2 then
    update reviews
    set stato = 'pubblicata', published_at = now()
    where tenancy_id = t_id and stato = 'depositata';
  end if;
end;
$$;

-- get_public_profile: restituisce profilo pubblico via share token
create or replace function get_public_profile(p_token text)
returns json language plpgsql security definer as $$
declare
  result json;
begin
  select json_build_object(
    'nome', p.nome,
    'cognome', p.cognome,
    'verification_level', p.verification_level,
    'reviews', (
      select json_agg(json_build_object(
        'direction', r.direction,
        'ratings', r.ratings,
        'testo', r.testo,
        'published_at', r.published_at
      ))
      from reviews r
      where r.recipient_id = p.id and r.stato = 'pubblicata'
    )
  ) into result
  from profiles p
  join share_tokens st on st.profile_id = p.id
  where st.token = p_token and st.expires_at > now();
  return result;
end;
$$;

-- ========================
-- RLS
-- ========================

alter table profiles enable row level security;
alter table admin_users enable row level security;
alter table properties enable row level security;
alter table tenancies enable row level security;
alter table reviews enable row level security;
alter table certified_checkins enable row level security;
alter table disputes enable row level security;
alter table identity_verifications enable row level security;
alter table share_tokens enable row level security;
alter table notifications enable row level security;

-- profiles
create policy "profilo proprio" on profiles for all using (auth.uid() = id);
create policy "admin legge tutto" on profiles for select using (is_admin());

-- admin_users
create policy "solo admin" on admin_users for all using (is_admin());

-- properties
create policy "proprietario gestisce" on properties for all using (auth.uid() = created_by);
create policy "membro tenancy vede" on properties for select using (
  exists (select 1 from tenancies t where t.property_id = id and (t.landlord_id = auth.uid() or t.tenant_id = auth.uid()))
);

-- tenancies
create policy "membro vede" on tenancies for select using (
  landlord_id = auth.uid() or tenant_id = auth.uid() or created_by = auth.uid()
);
create policy "creatore gestisce" on tenancies for all using (created_by = auth.uid());

-- reviews: GDPR — stato 'depositata' invisibile a tutti tranne admin
create policy "review pubblica o propria" on reviews for select using (
  is_admin()
  or (stato != 'depositata' and (author_id = auth.uid() or recipient_id = auth.uid()))
);
create policy "autore inserisce" on reviews for insert with check (author_id = auth.uid());
create policy "autore aggiorna bozza" on reviews for update using (
  author_id = auth.uid() and stato = 'bozza'
);

-- certified_checkins
create policy "membro vede checkin" on certified_checkins for select using (
  is_tenancy_member(tenancy_id)
);
create policy "membro crea checkin" on certified_checkins for insert with check (
  is_tenancy_member(tenancy_id)
);

-- disputes
create policy "membro vede disputa" on disputes for select using (
  opened_by = auth.uid() or is_admin()
);
create policy "membro apre disputa" on disputes for insert with check (
  exists (select 1 from reviews r where r.id = review_id and (r.author_id = auth.uid() or r.recipient_id = auth.uid()))
);

-- identity_verifications
create policy "propria verifica" on identity_verifications for all using (profile_id = auth.uid());
create policy "admin gestisce verifiche" on identity_verifications for all using (is_admin());

-- share_tokens
create policy "proprio token" on share_tokens for all using (profile_id = auth.uid());

-- notifications
create policy "proprie notifiche" on notifications for select using (recipient = auth.uid());
