import type { NextConfig } from "next";
const config: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // All storefront routes are dynamic; no ISR cache, image optimizer or server actions.
};
export default config;
