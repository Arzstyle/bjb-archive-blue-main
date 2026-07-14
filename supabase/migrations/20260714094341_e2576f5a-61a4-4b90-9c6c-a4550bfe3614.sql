
-- Storage policies for 'documents' bucket. Path convention: {menu}/{division}/{uuid}-{filename}
CREATE POLICY "docs read by role"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND public.can_access_doc(
    auth.uid(),
    (split_part(name, '/', 1))::public.doc_menu,
    (split_part(name, '/', 2))::public.doc_division
  )
);

CREATE POLICY "docs insert by role"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND public.can_access_doc(
    auth.uid(),
    (split_part(name, '/', 1))::public.doc_menu,
    (split_part(name, '/', 2))::public.doc_division
  )
);

CREATE POLICY "docs update by role"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'documents'
  AND public.can_access_doc(
    auth.uid(),
    (split_part(name, '/', 1))::public.doc_menu,
    (split_part(name, '/', 2))::public.doc_division
  )
);

CREATE POLICY "docs delete by role"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documents'
  AND public.can_access_doc(
    auth.uid(),
    (split_part(name, '/', 1))::public.doc_menu,
    (split_part(name, '/', 2))::public.doc_division
  )
);
