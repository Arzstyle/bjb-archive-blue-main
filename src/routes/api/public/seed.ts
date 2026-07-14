import { createFileRoute } from "@tanstack/react-router";

const ACCOUNTS: { username: string; password: string; role: "admin" | "konsumer" | "ritel" | "mikro" }[] = [
  { username: "ADM1", password: "Admin@2024", role: "admin" },
  { username: "KON1", password: "Konsumer@24", role: "konsumer" },
  { username: "RTL1", password: "Ritel@2024", role: "ritel" },
  { username: "MIK1", password: "Mikro@2024", role: "mikro" },
];

export const Route = createFileRoute("/api/public/seed")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const created: string[] = [];
        const skipped: string[] = [];
        for (const a of ACCOUNTS) {
          const email = `${a.username}@bjb.internal`;
          const { data: existing } = await supabaseAdmin
            .from("user_roles")
            .select("user_id")
            .eq("username", a.username)
            .maybeSingle();
          if (existing) {
            skipped.push(a.username);
            continue;
          }
          const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: a.password,
            email_confirm: true,
            user_metadata: { username: a.username, role: a.role },
          });
          let userId = userData?.user?.id;
          if (userErr || !userId) {
            const { data: list } = await supabaseAdmin.auth.admin.listUsers();
            const found = list?.users.find((u) => u.email === email);
            if (!found) continue;
            userId = found.id;
          }
          await supabaseAdmin.from("user_roles").insert({
            user_id: userId,
            role: a.role,
            username: a.username,
          });
          created.push(a.username);
        }
        return new Response(JSON.stringify({ ok: true, created, skipped }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});