
ALTER FUNCTION public.tg_set_updated_at() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_username(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_access_doc(uuid, public.doc_menu, public.doc_division) FROM PUBLIC, anon;
