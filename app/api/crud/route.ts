import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb-client"
import { ObjectId } from "mongodb"

// Database configurations
const TEST_EVENT_DB = "test_event_registration"
const TEST_REGISTRATIONS_COLLECTION = "test_registrations"
const BACKGROUND_REMOVAL_DB = "background-removal"
const PROCESSED_IMAGES_COLLECTION = "processed-images"
const KIOSK_DB = "muthupalasa_kiosk"

// Helper function to get database and collection
async function getCollection(database: string, collection: string) {
  const client = await clientPromise
  const db = client.db(database)
  return db.collection(collection)
}

// GET - Read operations
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const database = url.searchParams.get("database")
    const collectionName = url.searchParams.get("collection")
    const id = url.searchParams.get("id")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const search = url.searchParams.get("search")

    if (!database || !collectionName) {
      return NextResponse.json({ success: false, message: "Database and collection are required" }, { status: 400 })
    }

    const collection = await getCollection(database, collectionName)

    // Get single document by ID
    if (id) {
      const document = await collection.findOne({ _id: new ObjectId(id) })
      return NextResponse.json({ success: true, data: document })
    }

    // Build search query
    let query = {}
    if (search) {
      // Create a flexible search across multiple fields
      const searchRegex = { $regex: search, $options: "i" }
      query = {
        $or: [
          { "dealerInfo.ownerName": searchRegex },
          { "dealerInfo.ownerNIC": searchRegex },
          { "dealerInfo.shopName": searchRegex },
          { "eventuserdata.ownerName": searchRegex },
          { "eventuserdata.ownerNIC": searchRegex },
          { "eventuserdata.shopName": searchRegex },
          { nic: searchRegex },
        ],
      }
    }

    // Get paginated results
    const skip = (page - 1) * limit
    const [documents, total] = await Promise.all([
      collection.find(query).skip(skip).limit(limit).sort({ _id: -1 }).toArray(),
      collection.countDocuments(query),
    ])

    return NextResponse.json({
      success: true,
      data: documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error in GET operation:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch data", error: (error as Error).message },
      { status: 500 },
    )
  }
}

// POST - Create operations
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const database = url.searchParams.get("database")
    const collectionName = url.searchParams.get("collection")

    if (!database || !collectionName) {
      return NextResponse.json({ success: false, message: "Database and collection are required" }, { status: 400 })
    }

    const data = await req.json()
    const collection = await getCollection(database, collectionName)

    // Add timestamps
    const documentToInsert = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(documentToInsert)

    return NextResponse.json({
      success: true,
      message: "Document created successfully",
      data: { _id: result.insertedId, ...documentToInsert },
    })
  } catch (error) {
    console.error("Error in POST operation:", error)
    return NextResponse.json(
      { success: false, message: "Failed to create document", error: (error as Error).message },
      { status: 500 },
    )
  }
}

// PUT - Update operations
export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const database = url.searchParams.get("database")
    const collectionName = url.searchParams.get("collection")
    const id = url.searchParams.get("id")

    if (!database || !collectionName || !id) {
      return NextResponse.json(
        { success: false, message: "Database, collection, and ID are required" },
        { status: 400 },
      )
    }

    const data = await req.json()
    const collection = await getCollection(database, collectionName)

    // Remove _id from update data and add updatedAt
    const { _id, ...updateData } = data
    const documentToUpdate = {
      ...updateData,
      updatedAt: new Date(),
    }

    const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: documentToUpdate })

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: "Document not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Document updated successfully",
      data: result,
    })
  } catch (error) {
    console.error("Error in PUT operation:", error)
    return NextResponse.json(
      { success: false, message: "Failed to update document", error: (error as Error).message },
      { status: 500 },
    )
  }
}

// DELETE - Delete operations
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const database = url.searchParams.get("database")
    const collectionName = url.searchParams.get("collection")
    const id = url.searchParams.get("id")

    if (!database || !collectionName || !id) {
      return NextResponse.json(
        { success: false, message: "Database, collection, and ID are required" },
        { status: 400 },
      )
    }

    const collection = await getCollection(database, collectionName)
    const result = await collection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: "Document not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
      data: result,
    })
  } catch (error) {
    console.error("Error in DELETE operation:", error)
    return NextResponse.json(
      { success: false, message: "Failed to delete document", error: (error as Error).message },
      { status: 500 },
    )
  }
}
