export async function POST() {
  return Response.json(
    {
      success: false,
      error:
        "This endpoint has been deprecated. Please use the new journeys API.",
      code: "DEPRECATED",
      migration: {
        newEndpoint: "/api/journeys",
      },
    },
    {
      status: 410,
      headers: {
        Sunset: "2025-12-01",
        Link: '</api/journeys>; rel="successor-version"',
      },
    }
  )
}
