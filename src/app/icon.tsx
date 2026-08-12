import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        background: "linear-gradient(145deg, #0f1c2e 0%, #0f766e 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          width: 16,
          height: 16,
          borderRadius: 999,
          border: "2.5px solid #99f6e4",
        }}
      />
    </div>,
    { ...size },
  );
}
