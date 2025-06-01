import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb-client"
import { ObjectId } from "mongodb"

const TEST_EVENT_DB = "event_registration"
const TEST_REGISTRATIONS_COLLECTION = "registrations"

// Helper function to get collection
async function getCollection() {
  const client = await clientPromise
  const db = client.db(TEST_EVENT_DB)
  return db.collection(TEST_REGISTRATIONS_COLLECTION)
}

// GET - Read operations
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get("id")
    const format = url.searchParams.get("format") || "json"
    const search = url.searchParams.get("search")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "50")
    const debug = url.searchParams.get("debug") === "true"

    const collection = await getCollection()

    // Get single registration by ID
    if (id) {
      try {
        const registration = await collection.findOne({ _id: new ObjectId(id) })
        if (!registration) {
          return NextResponse.json({ success: false, message: "Registration not found" }, { status: 404 })
        }
        return NextResponse.json({ success: true, data: registration })
      } catch (error) {
        return NextResponse.json({ success: false, message: "Invalid registration ID" }, { status: 400 })
      }
    }

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
          { "dealerInfo.event": searchRegex },
          { goldenPass: searchRegex },
        ],
      }
    }

    if (debug) {
      const rawRegistrations = await collection.find({}).limit(10).toArray()
      return NextResponse.json({
        success: true,
        debug: true,
        rawRegistrations,
        documentCount: rawRegistrations.length,
        firstDocumentKeys: rawRegistrations.length > 0 ? Object.keys(rawRegistrations[0]) : [],
        firstDocumentStructure: rawRegistrations.length > 0 ? rawRegistrations[0] : null,
        query
      })
    }

    if (format === "all") {
      // Get all registrations for export
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
    console.error("Error in GET operation:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch registrations", 
        error: (error as Error).message,
        stack: (error as Error).stack 
      },
      { status: 500 }
    )
  }
}

// POST - Create operations
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const collection = await getCollection()

    console.log("Received registration data for creation:", data)

    // Check if it's bulk upload (array) or single registration
    if (Array.isArray(data)) {
      // Bulk upload - store each registration individually
      const registrationsToInsert = data.map((item) => ({
        ...item,
        registeredAt: item.registeredAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))

      const result = await collection.insertMany(registrationsToInsert)

      return NextResponse.json({
        success: true,
        message: `${result.insertedCount} registrations created successfully`,
        data: {
          insertedCount: result.insertedCount,
          insertedIds: result.insertedIds,
        },
      })
    } else {
      // Single registration
      const registrationToInsert = {
        dealerInfo: {
          ownerName: data.dealerInfo?.ownerName || "",
          ownerNIC: data.dealerInfo?.ownerNIC || "",
          shopName: data.dealerInfo?.shopName || "",
          contactNo: data.dealerInfo?.contactNo || "",
          event: data.dealerInfo?.event || "",
          classification: data.dealerInfo?.classification || "",
        },
        goldenPass: data.goldenPass || "",
        registeredAt: data.registeredAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const result = await collection.insertOne(registrationToInsert)

      return NextResponse.json({
        success: true,
        message: "Registration created successfully",
        data: { _id: result.insertedId, ...registrationToInsert },
      })
    }
  } catch (error) {
    console.error("Error in POST operation:", error)
    return NextResponse.json(
      { success: false, message: "Failed to create registration(s)", error: (error as Error).message },
      { status: 500 },
    )
  }
}

// PUT - Update operations
export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, message: "ID is required for update" }, { status: 400 })
    }

    const data = await req.json()
    const collection = await getCollection()

    try {
      // Prepare update data
      const updateData: {
        dealerInfo: {
          ownerName: string
          ownerNIC: string
          shopName: string
          contactNo: string
          event: string
          classification: string
        }
        goldenPass: string
        updatedAt: string
        registeredAt?: string
      } = {
        dealerInfo: {
          ownerName: data.dealerInfo?.ownerName || "",
          ownerNIC: data.dealerInfo?.ownerNIC || "",
          shopName: data.dealerInfo?.shopName || "",
          contactNo: data.dealerInfo?.contactNo || "",
          event: data.dealerInfo?.event || "",
          classification: data.dealerInfo?.classification || "",
        },
        goldenPass: data.goldenPass || "",
        updatedAt: new Date().toISOString(),
      }

      // Keep original registeredAt if it exists
      if (data.registeredAt) {
        updateData.registeredAt = data.registeredAt
      }

      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      )

      if (result.matchedCount === 0) {
        return NextResponse.json({ success: false, message: "Registration not found" }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        message: "Registration updated successfully",
        data: result,
      })
    } catch (error) {
      console.error("Error updating registration:", error)
      return NextResponse.json({ success: false, message: "Invalid registration ID" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in PUT operation:", error)
    return NextResponse.json(
      { success: false, message: "Failed to update registration", error: (error as Error).message },
      { status: 500 },
    )
  }
}

// DELETE - Delete operations
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get("id")
    const deleteAll = url.searchParams.get("deleteAll") === "true"

    const collection = await getCollection()

    if (deleteAll) {
      // Delete all registrations
      const result = await collection.deleteMany({})
      return NextResponse.json({
        success: true,
        message: `${result.deletedCount} registrations deleted successfully`,
        data: result,
      })
    }

    if (!id) {
      return NextResponse.json({ success: false, message: "ID is required for delete" }, { status: 400 })
    }

    try {
      const result = await collection.deleteOne({ _id: new ObjectId(id) })

      if (result.deletedCount === 0) {
        return NextResponse.json({ success: false, message: "Registration not found" }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        message: "Registration deleted successfully",
        data: result,
      })
    } catch (error) {
      console.error("Error deleting registration:", error)
      return NextResponse.json({ success: false, message: "Invalid registration ID" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in DELETE operation:", error)
    return NextResponse.json(
      { success: false, message: "Failed to delete registration", error: (error as Error).message },
      { status: 500 },
    )
  }
}