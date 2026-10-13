import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AP Blitz",
    short_name: "AP Blitz",
    description: "AP review videos made by students, for students.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#ff914d",
    icons: [
      { src: "/logo-ap-blitz.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/logo-ap-blitz.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
