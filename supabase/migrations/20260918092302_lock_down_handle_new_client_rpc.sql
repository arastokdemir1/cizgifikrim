-- handle_new_client() sadece auth.users trigger'ı için var, doğrudan REST API
-- üzerinden (anon/authenticated) çağrılabilir olmamalı. Security advisor
-- bunu "anon_security_definer_function_executable" olarak işaretledi.
revoke execute on function public.handle_new_client() from anon, authenticated, public;
