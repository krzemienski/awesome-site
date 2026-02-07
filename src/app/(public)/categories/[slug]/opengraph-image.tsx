import { ImageResponse } from "next/og"
import { getCategoryBySlug } from "@/features/categories/category-service"

export const runtime = "nodejs"
export const alt = "Category - Awesome Video Dashboard"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let name = "Category"
  let description = ""
  let resourceCount = 0
  let subcategoryCount = 0
  let icon = ""

  try {
    const category = await getCategoryBySlug(slug)
    name = category.name
    description = category.description?.slice(0, 100) ?? ""
    subcategoryCount = category.subcategories.length
    icon = category.icon ?? ""
    resourceCount =
      category._count.resources +
      category.subcategories.reduce(
        (sum, sub) =>
          sum +
          sub._count.resources +
          sub.subSubcategories.reduce((s, ss) => s + ss._count.resources, 0),
        0
      )
  } catch {
    // fallback to defaults
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
            bottom: "-100px",
            left: "50%",
            width: "500px",
            height: "300px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(0, 255, 157, 0.12) 0%, transparent 70%)",
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
                Category
              </span>
            </div>
          </div>

          {/* Category name */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
              }}
            >
              {icon && (
                <span style={{ fontSize: "64px", display: "flex" }}>{icon}</span>
              )}
              <div
                style={{
                  fontSize: name.length > 25 ? "48px" : "58px",
                  fontWeight: 800,
                  color: "#e0e0e8",
                  fontFamily: "monospace",
                  lineHeight: 1.15,
                  letterSpacing: "-1px",
                  display: "flex",
                }}
              >
                {name}
              </div>
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
                {description.length >= 100 ? "..." : ""}
              </div>
            )}
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              gap: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 24px",
                border: "1px solid rgba(0, 255, 157, 0.2)",
                borderRadius: "8px",
                backgroundColor: "rgba(0, 255, 157, 0.05)",
              }}
            >
              <span
                style={{
                  color: "#00ff9d",
                  fontSize: "28px",
                  fontWeight: 700,
                  fontFamily: "monospace",
                  display: "flex",
                }}
              >
                {resourceCount}
              </span>
              <span
                style={{
                  color: "#c0c0d0",
                  fontSize: "16px",
                  fontFamily: "monospace",
                  display: "flex",
                }}
              >
                {resourceCount === 1 ? "resource" : "resources"}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 24px",
                border: "1px solid rgba(0, 255, 157, 0.2)",
                borderRadius: "8px",
                backgroundColor: "rgba(0, 255, 157, 0.05)",
              }}
            >
              <span
                style={{
                  color: "#00ff9d",
                  fontSize: "28px",
                  fontWeight: 700,
                  fontFamily: "monospace",
                  display: "flex",
                }}
              >
                {subcategoryCount}
              </span>
              <span
                style={{
                  color: "#c0c0d0",
                  fontSize: "16px",
                  fontFamily: "monospace",
                  display: "flex",
                }}
              >
                {subcategoryCount === 1 ? "subcategory" : "subcategories"}
              </span>
            </div>
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
