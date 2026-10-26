create table public.social_hub_organizations (
 slug text primary key check (slug ~ '^[a-z0-9][a-z0-9-]{0,59}$'),
 name text not null,
 crm_organization_id uuid references public.organizations(id),
 color text not null default '#2563eb' check(color ~ '^#[0-9a-fA-F]{6}$'),
 enabled boolean not null default true,
 created_at timestamptz not null default now()
);
create table public.social_hub_access (
 email text not null check(email=lower(email)),
 organization_slug text not null references public.social_hub_organizations(slug),
 granted_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 primary key(email,organization_slug)
);
create table public.social_hub_posts (
 monday_id text primary key,
 title text not null,
 organization_slug text not null,
 audience text[] not null default '{}',
 campaign text not null default '',
 publish_at_et text not null default '',
 platform text not null default '',
 caption text not null default '',
 destination_link text not null default '',
 asset_link text not null default '',
 asset_type text not null default 'Image',
 instructions text not null default '',
 approval text not null default 'Draft',
 assigned_to text not null default '',
 content_role text not null default 'Main Post',
 original_post_link text not null default '',
 archived boolean not null default false,
 synced_at timestamptz not null default now()
);
create table public.social_hub_publications (
 monday_id text not null references public.social_hub_posts(monday_id),
 organization_slug text not null references public.social_hub_organizations(slug),
 platform text not null,
 published_link text not null default '',
 published_by uuid not null references auth.users(id),
 published_at timestamptz not null default now(),
 primary key(monday_id,organization_slug,platform)
);
alter table public.social_hub_organizations enable row level security;
alter table public.social_hub_access enable row level security;
alter table public.social_hub_posts enable row level security;
alter table public.social_hub_publications enable row level security;
revoke all on public.social_hub_organizations,public.social_hub_access,public.social_hub_posts,public.social_hub_publications from anon,authenticated;
grant all on public.social_hub_organizations,public.social_hub_access,public.social_hub_posts,public.social_hub_publications to service_role;
-- All access is through blueprint-social, which verifies JWTs and organization access.
insert into public.social_hub_organizations(slug,name,crm_organization_id,color)
select 'blueprint','Blueprint Collective',id,'#2563eb' from public.organizations where name='Blueprint Collective';
insert into public.social_hub_organizations(slug,name,crm_organization_id,color)
select 'wheeling-miners','Wheeling Miners',id,'#C99A2E' from public.organizations where name='Wheeling Miners';
insert into public.social_hub_organizations(slug,name,color) values ('nal','National Arena League','#df2745');
