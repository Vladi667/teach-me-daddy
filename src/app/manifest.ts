import type { MetadataRoute } from "next";
import { BASE_PATH, asset } from "@/lib/base-path";

// Generated rather than static: start_url and the icon path differ between the
// root deployment on Vercel and the subpath one on GitHub Pages.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Teach me Daddy",
    short_name: "Teach me Daddy",
    description: "Hebrew, one letter at a time.",
    start_url: `${BASE_PATH}/`,
    scope: `${BASE_PATH}/`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: asset("/icon.svg"),
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: asset("/icon.svg"),
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
