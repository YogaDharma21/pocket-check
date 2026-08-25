import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: "https://evolved-starling-42.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
