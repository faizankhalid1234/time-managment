import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Time Management",
    short_name: "Time Mgmt",
    description:
      "Private project time tracker with countdown, history, and weekly graphs.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1220",
    theme_color: "#0f9d8a",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
