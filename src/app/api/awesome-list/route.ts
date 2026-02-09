export async function GET() {
  return Response.json(
    {
      success: false,
      error:
        "This endpoint has been deprecated. Please use the new resources API.",
      code: "DEPRECATED",
      migration: {
        newEndpoint: "/api/resources",
        docs: "/about",
      },
    },
    {
      status: 410,
      headers: {
        Sunset: "2025-12-01",
        Link: '</api/resources>; rel="successor-version"',
      },
    }
  )
}
