import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://brokr-suite-sparkle.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}



export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [{ path: "/", changefreq: "weekly", priority: "1.0" }];

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data } = await (
            supabaseAdmin.rpc as unknown as (
              fn: string,
            ) => Promise<{ data: { slug: string }[] | null }>
          )("list_published_property_slugs");
          for (const row of data ?? []) {
            if (row.slug) {
              entries.push({
                path: `/property/${row.slug}`,
                changefreq: "weekly",
                priority: "0.8",
              });
            }
          }
        } catch {
          // A backend hiccup shouldn't break the sitemap; ship the static routes.
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
