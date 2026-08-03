import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchProperties from "./tools/search-properties";
import getProperty from "./tools/get-property";
import listLeads from "./tools/list-leads";
import createLead from "./tools/create-lead";
import updateLead from "./tools/update-lead";
import portfolioSummary from "./tools/portfolio-summary";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "brokrsuite-pro",
  title: "BrokrSuite Pro",
  version: "0.1.0",
  instructions:
    "Tools for BrokrSuite, a real estate brokerage CRM. Search and read the property inventory, log and update buyer leads (status, notes, assignee, follow-up dates) and pull a portfolio + pipeline summary. All calls act as the signed-in agency user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchProperties, getProperty, listLeads, createLead, updateLead, portfolioSummary],
});
