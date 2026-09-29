import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SIMS Raipur NIMCET Test Series",
    short_name: "SIMS NIMCET",
    description: "Timed NIMCET mock tests with instant results.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d0e10",
    theme_color: "#0d0e10",
    icons: [{ src: "/icon-512.png", sizes: "512x512", type: "image/png" }]
  };
}
