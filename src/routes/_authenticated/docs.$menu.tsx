import { createFileRoute } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { DocumentManager } from "@/components/document-manager";
import { menuLabel, type MenuKey, type Division } from "@/lib/menus";

const searchSchema = z.object({
  division: fallback(z.string(), "konsumer").default("konsumer"),
});

export const Route = createFileRoute("/_authenticated/docs/$menu")({
  validateSearch: zodValidator(searchSchema),
  head: ({ params }) => ({
    meta: [{ title: `${menuLabel((params as { menu: string }).menu as MenuKey)} — Arsip BJB` }],
  }),
  component: DocsPage,
});

function DocsPage() {
  const { menu } = Route.useParams();
  const { division } = Route.useSearch();
  return <DocumentManager menu={menu as MenuKey} division={division as Division} />;
}