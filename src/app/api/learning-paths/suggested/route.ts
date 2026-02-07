export async function GET() {
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
    { status: 501 }
  )
}
