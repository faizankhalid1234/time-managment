import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Time Management";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background:
            "linear-gradient(145deg, #0b1220 0%, #102033 45%, #0f3d3a 100%)",
          color: "#eef4fb",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              background: "linear-gradient(145deg, #14b8a6, #0f766e)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            TM
          </div>
          <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -1 }}>
            Time Management
          </div>
        </div>
        <div style={{ fontSize: 28, opacity: 0.9 }}>
          Start · End · History · Graph
        </div>
      </div>
    ),
    { ...size }
  );
}
