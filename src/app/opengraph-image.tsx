import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Awesome Video Dashboard"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0f",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(rgba(0, 255, 157, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 157, 0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Glow effect top */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "50%",
            width: "600px",
            height: "300px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(0, 255, 157, 0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "10%",
            right: "10%",
            height: "2px",
            background:
              "linear-gradient(90deg, transparent, #00ff9d, transparent)",
            display: "flex",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
          }}
        >
          {/* Terminal bracket decoration */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: "#00ff9d",
              fontSize: "20px",
              fontFamily: "monospace",
              opacity: 0.6,
            }}
          >
            {"// awesome-video-dashboard"}
          </div>

          {/* Title */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                fontSize: "64px",
                fontWeight: 800,
                color: "#00ff9d",
                fontFamily: "monospace",
                letterSpacing: "-2px",
                display: "flex",
              }}
            >
              Awesome Video
            </div>
            <div
              style={{
                fontSize: "56px",
                fontWeight: 700,
                color: "#e0e0e8",
                fontFamily: "monospace",
                letterSpacing: "-1px",
                display: "flex",
              }}
            >
              Dashboard
            </div>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: "22px",
              color: "#8888a0",
              fontFamily: "monospace",
              maxWidth: "700px",
              textAlign: "center",
              display: "flex",
            }}
          >
            Curated video resources with AI-enriched metadata
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              gap: "32px",
              marginTop: "16px",
            }}
          >
            {["Categories", "Resources", "AI Enriched"].map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 20px",
                  border: "1px solid rgba(0, 255, 157, 0.2)",
                  borderRadius: "8px",
                  backgroundColor: "rgba(0, 255, 157, 0.05)",
                }}
              >
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "#00ff9d",
                    display: "flex",
                  }}
                />
                <span
                  style={{
                    color: "#c0c0d0",
                    fontSize: "16px",
                    fontFamily: "monospace",
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "10%",
            right: "10%",
            height: "2px",
            background:
              "linear-gradient(90deg, transparent, #00ff9d, transparent)",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  )
}
