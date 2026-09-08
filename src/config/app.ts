/**
 * Product-level configuration for applications created from this starter.
 *
 * Keep deploy-time secrets and infrastructure settings in environment variables.
 * This file is intentionally limited to public product identity, navigation, and
 * starter copy so a cloned application can be rebranded in one place.
 */
export const appConfig = {
  name: "Agentic ERP",
  company: "MPTWork",
  description:
    "Bring your team, agents, data, and knowledge together with intelligence built into every workflow.",
  logo: {
    src: "/aiappstarter-mark.svg",
    primaryText: "Agentic",
    accentText: "ERP",
  },
  routes: {
    home: "/",
    login: "/login",
    workspace: "/chat",
  },
  landing: {
    navigation: [
      { label: "Platform", href: "#platform" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Trust", href: "#trust" },
    ],
    eyebrow: "Intelligence, built into the work",
    headline: "Get started with",
    headlineAccent: "Agentic ERP.",
    supportingText:
      "Your team, your agents, your data, and your knowledge—working together. Intelligence built into every workflow and interaction helps your business operate at its best.",
    authenticatedAction: "Enter your workspace",
    unauthenticatedAction: "Get started",
    secondaryAction: "Explore the platform",
    secondaryActionHref: "#platform",
    trustPoints: ["Human-led", "Connected by design", "Secure by default"],
    footerTagline: "People and intelligent agents, operating as one.",
  },
  chat: {
    emptyStateHeading: "How can your business move forward?",
    emptyStateDescription:
      "Plan, analyze, and coordinate work across your people, agents, data, and knowledge.",
    starterPrompts: [
      "Plan an inventory replenishment workflow",
      "Draft a month-end close checklist",
      "Design an agent for customer order exceptions",
    ],
  },
} as const;

export type AppConfig = typeof appConfig;
