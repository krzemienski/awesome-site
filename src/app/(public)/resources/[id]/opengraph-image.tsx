import { ImageResponse } from "next/og"
import { getResource } from "@/features/resources/resource-service"

export const runtime = "nodejs"
export const alt = "Resource - Awesome Video Dashboard"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const resourceId = Number(id)

  let title = "Resource"
  let category = ""
  let tags: readonly string[] = []
  let description = ""

  if (Number.isInteger(resourceId) && resourceId > 0) {
    try {
      const resource = await getResource(resourceId)
      title = resource.title
      category = resource.category.name
      tags = resource.tags.map(({ tag }) => tag.name).slice(0, 5)
      description = resource.description?.slice(0, 120) ?? ""
    } catch {
      // fallback to defaults
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0a0a0f",
          padding: "60px",
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

        {/* Glow effect */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(0, 255, 157, 0.1) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background:
              "linear-gradient(90deg, #00ff9d, rgba(0, 255, 157, 0.3), transparent)",
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            zIndex: 1,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: "#00ff9d",
                  display: "flex",
                }}
              />
              <span
                style={{
                  color: "#00ff9d",
                  fontSize: "18px",
                  fontFamily: "monospace",
                  fontWeight: 600,
                }}
              >
                Awesome Video Dashboard
              </span>
            </div>
            {category && (
              <div
                style={{
                  display: "flex",
                  padding: "6px 16px",
                  border: "1px solid rgba(0, 255, 157, 0.3)",
                  borderRadius: "6px",
                  backgroundColor: "rgba(0, 255, 157, 0.08)",
                }}
              >
                <span
                  style={{
                    color: "#00ff9d",
                    fontSize: "16px",
                    fontFamily: "monospace",
                  }}
                >
                  {category}
                </span>
              </div>
            )}
          </div>

          {/* Title and description */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                fontSize: title.length > 40 ? "42px" : "52px",
                fontWeight: 800,
                color: "#e0e0e8",
                fontFamily: "monospace",
                lineHeight: 1.15,
                letterSpacing: "-1px",
                display: "flex",
              }}
            >
              {title.length > 60 ? `${title.slice(0, 57)}...` : title}
            </div>
            {description && (
              <div
                style={{
                  fontSize: "20px",
                  color: "#8888a0",
                  fontFamily: "monospace",
                  lineHeight: 1.4,
                  display: "flex",
                }}
              >
                {description}
                {description.length >= 120 ? "..." : ""}
              </div>
            )}
          </div>

          {/* Tags row */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            {tags.map((tag) => (
              <div
                key={tag}
                style={{
                  display: "flex",
                  padding: "6px 14px",
                  border: "1px solid rgba(0, 255, 157, 0.15)",
                  borderRadius: "6px",
                  backgroundColor: "rgba(0, 255, 157, 0.05)",
                }}
              >
                <span
                  style={{
                    color: "#c0c0d0",
                    fontSize: "15px",
                    fontFamily: "monospace",
                  }}
                >
                  #{tag}
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
            left: 0,
            right: 0,
            height: "3px",
            background:
              "linear-gradient(90deg, transparent, rgba(0, 255, 157, 0.3), #00ff9d)",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  )
}
