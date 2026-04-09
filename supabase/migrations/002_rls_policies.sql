-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- Enforced at DB level — no frontend bypass possible
-- ============================================================

alter table organizations   enable row level security;
alter table profiles         enable row level security;
alter table farms            enable row level security;
alter table seasons          enable row level security;
alter table budget_lines     enable row level security;
alter table operation_logs   enable row level security;
alter table alerts           enable row level security;
alter table exchange_rates   enable row level security;

-- Helper: get current user's org
create or replace function get_my_org_id()
returns uuid language sql security definer as $$
  select org_id from profiles where id = auth.uid()
$$;

-- Helper: get current user's role
create or replace function get_my_role()
returns user_role language sql security definer as $$
  select role from profiles where id = auth.uid()
$$;

-- Helper: get farms accessible to current user
-- Farm managers see only their assigned farm; owner/finance see all
create or replace function get_my_farm_ids()
returns setof uuid language sql security definer as $$
  select f.id from farms f
  join profiles p on p.org_id = f.org_id
  where p.id = auth.uid()
$$;

-- -------- ORGANIZATIONS --------
create policy "Members see their org"
  on organizations for select
  using (id = get_my_org_id());

-- -------- PROFILES --------
create policy "Own profile always visible"
  on profiles for select using (id = auth.uid());

create policy "Owner sees all profiles in org"
  on profiles for select
  using (get_my_role() in ('owner', 'finance') and org_id = get_my_org_id());

create policy "Update own profile"
  on profiles for update using (id = auth.uid());

-- -------- FARMS --------
create policy "Org members see farms"
  on farms for select
  using (org_id = get_my_org_id());

create policy "Owner manages farms"
  on farms for all
  using (get_my_role() = 'owner' and org_id = get_my_org_id());

-- -------- SEASONS --------
create policy "See seasons of accessible farms"
  on seasons for select
  using (farm_id in (select get_my_farm_ids()));

create policy "Owner and finance manage seasons"
  on seasons for all
  using (get_my_role() in ('owner', 'finance') and
         farm_id in (select get_my_farm_ids()));

-- -------- BUDGET LINES --------
create policy "Owner and finance see budget"
  on budget_lines for select
  using (get_my_role() in ('owner', 'finance'));

create policy "Finance creates/edits budget"
  on budget_lines for insert
  with check (get_my_role() = 'finance');

create policy "Finance updates budget"
  on budget_lines for update
  using (get_my_role() = 'finance');

create policy "Owner approves (read only for now)"
  on budget_lines for select
  using (get_my_role() = 'owner');

-- -------- OPERATION LOGS --------
create policy "Farm managers insert their logs"
  on operation_logs for insert
  with check (
    get_my_role() = 'farm_manager'
    and farm_id in (select get_my_farm_ids())
  );

create policy "All roles can read operation logs of their farms"
  on operation_logs for select
  using (farm_id in (select get_my_farm_ids()));

create policy "Farm managers update their own logs"
  on operation_logs for update
  using (logged_by = auth.uid() and get_my_role() = 'farm_manager');

-- -------- ALERTS --------
create policy "Owner and finance see alerts"
  on alerts for select
  using (org_id = get_my_org_id() and get_my_role() in ('owner', 'finance'));

create policy "Owner dismisses alerts"
  on alerts for update
  using (get_my_role() = 'owner' and org_id = get_my_org_id());

-- -------- EXCHANGE RATES --------
create policy "Everyone reads exchange rates"
  on exchange_rates for select using (true);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP (Supabase trigger)
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, org_id, full_name, role)
  values (
    new.id,
    (new.raw_user_meta_data->>'org_id')::uuid,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'farm_manager')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
