import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Building2, BarChart3, Users, Share2, Images, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BrokrSuite — Real Estate CRM for Modern Brokerages" },
      {
        name: "description",
        content:
          "BrokrSuite gives real estate agencies inventory management, lead capture, analytics and instant shareable property pages in one portal.",
      },
      { property: "og:title", content: "BrokrSuite — Real Estate CRM for Modern Brokerages" },
      {
        property: "og:description",
        content: "Manage listings, capture leads and publish property pages in minutes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Building2, title: "Inventory that stays tidy", body: "Auto-generated property codes, slugs and duplicate-in-one-click drafts." },
  { icon: Images, title: "Media without the mess", body: "Bulk uploads with client-side compression and reorderable galleries." },
  { icon: Share2, title: "Shareable listing pages", body: "Every published property gets an SEO-ready page with WhatsApp and QR sharing." },
  { icon: Users, title: "Leads in one pipeline", body: "Enquiries land straight in your CRM with status, notes and contact shortcuts." },
  { icon: BarChart3, title: "Analytics that matter", body: "Views, conversion rate and city-level performance at a glance." },
  { icon: ShieldCheck, title: "Secure by default", body: "Row-level security keeps drafts private and published pages public." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <span className="brand-gradient flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground">
            <Building2 className="h-4 w-4" />
          </span>
          <span className="display-title text-lg">BrokrSuite</span>
        </div>
        <Button asChild size="sm">
          <Link to="/auth">Open portal</Link>
        </Button>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
          >
            Built for Deep Real Estate · Gurgaon · Sohna · Manesar
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="display-title mx-auto mt-5 max-w-3xl text-4xl leading-tight sm:text-6xl"
          >
            The quiet operating system for modern brokerages.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mx-auto mt-5 max-w-xl text-sm/relaxed text-muted-foreground sm:text-base"
          >
            Manage every listing, capture every enquiry and publish beautiful property pages —
            without touching a line of code.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            <Button asChild size="lg">
              <Link to="/auth">Sign in to your portal</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth">Try the demo account</Link>
            </Button>
          </motion.div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="surface p-6"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </span>
                <h2 className="display-title mt-4 text-lg">{feature.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
              </motion.article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()} BrokrSuite · Powering Deep Real Estate.
        </div>
      </footer>
    </div>
  );
}
