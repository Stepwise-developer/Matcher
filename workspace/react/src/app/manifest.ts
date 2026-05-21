import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Omatcha",
    short_name: "Omatcha",
    description: "Matching app web test product",
    display: "standalone",
    start_url: "/matcha",
    scope: "/matcha",
    background_color: "#f7f7f4",
    theme_color: "#111111",
    orientation: "portrait",
  };
}
