-- Plotmarket migration 0004
-- Standard Supabase role grants. Tables created through the SQL editor did
-- not receive these, so every PostgREST request failed with 42501
-- "permission denied for table profiles" regardless of RLS policy.
-- Row level security remains the real gate; these grants only let the
-- API roles reach the tables at all.

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables    in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
