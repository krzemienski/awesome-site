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
    { status: 501 }
  )
}
