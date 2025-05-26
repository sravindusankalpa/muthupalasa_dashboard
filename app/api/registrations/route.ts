import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb-client"

const TEST_EVENT_DB = "test_event_registration"
const TEST_REGISTRATIONS_COLLECTION = "test_registrations"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const format = url.searchParams.get("format") || "json"
    const search = url.searchParams.get("search")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "50")

    const client = await clientPromise
    const db = client.db(TEST_EVENT_DB)
    const collection = db.collection(TEST_REGISTRATIONS_COLLECTION)

    // Build search query
    let query = {}
    if (search) {
      const searchRegex = { $regex: search, $options: "i" }
      query = {
        $or: [
          { "dealerInfo.ownerName": searchRegex },
          { "dealerInfo.ownerNIC": searchRegex },
          { "dealerInfo.shopName": searchRegex },
          { "dealerInfo.contactNo": searchRegex },
          { "dealerInfo.classification": searchRegex },
          { goldenPass: searchRegex },
        ],
      }
    }

    if (format === "all") {
      // Get all registrations for PDF generation
      const [registrations, totalCount] = await Promise.all([
        collection.find(query).sort({ _id: -1 }).toArray(),
        collection.countDocuments(query),
      ])

      // Get statistics
      const stats = await collection
        .aggregate([
          { $match: query },
          {
            $group: {
              _id: null,
              totalRegistrations: { $sum: 1 },
              classifications: { $addToSet: "$dealerInfo.classification" },
              goldenPassHolders: {
                $sum: { $cond: [{ $ne: ["$goldenPass", null] }, 1, 0] },
              },
              avgContactLength: { $avg: { $strLenCP: "$dealerInfo.contactNo" } },
            },
          },
        ])
        .toArray()

      const classificationStats = await collection
        .aggregate([
          { $match: query },
          { $group: { _id: "$dealerInfo.classification", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
        .toArray()

      const locationStats = await collection
        .aggregate([
          { $match: query },
          { $group: { _id: "$dealerInfo.event", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
        .toArray()

      return NextResponse.json({
        success: true,
        data: {
          registrations,
          totalCount,
          statistics: stats[0] || {},
          classificationStats,
          locationStats,
        },
      })
    }

    // Paginated results for regular viewing
    const skip = (page - 1) * limit
    const [registrations, totalCount] = await Promise.all([
      collection.find(query).skip(skip).limit(limit).sort({ _id: -1 }).toArray(),
      collection.countDocuments(query),
    ])

    return NextResponse.json({
      success: true,
      data: registrations,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching registrations:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch registrations", error: (error as Error).message },
      { status: 500 },
    )
  }
}
