import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb-client"

// Database configurations
const TEST_EVENT_DB = "test_event_registration"
const TEST_REGISTRATIONS_COLLECTION = "test_registrations"
const BACKGROUND_REMOVAL_DB = "background-removal"
const PROCESSED_IMAGES_COLLECTION = "processed-images"
const KIOSK_DB = "muthupalasa_kiosk"

export async function GET(req: NextRequest) {
  console.log("GET request received at /api/dashboard-data")

  try {
    const url = new URL(req.url)
    const reportType = url.searchParams.get("type") || "summary"
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")
    const collectionName = process.env.NEXT_PUBLIC_COLLECTION_NAME || "EventDaySubmission"

    console.log(`Fetching ${reportType} data from ${startDate} to ${endDate}`)

    const client = await clientPromise
    console.log("MongoDB client connected")

    // Get databases and collections
    const testEventDb = client.db(TEST_EVENT_DB)
    const testRegistrationsCollection = testEventDb.collection(TEST_REGISTRATIONS_COLLECTION)

    const backgroundRemovalDb = client.db(BACKGROUND_REMOVAL_DB)
    const processedImagesCollection = backgroundRemovalDb.collection(PROCESSED_IMAGES_COLLECTION)

    const kioskDb = client.db(KIOSK_DB)
    const kioskCollection = kioskDb.collection(collectionName)

    let dateFilter = {}
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      }
    }

    let result = {}

    switch (reportType) {
      case "summary":
        const [testRegistrations, processedImages, kioskSubmissions] = await Promise.all([
          testRegistrationsCollection.countDocuments(),
          processedImagesCollection.countDocuments(),
          kioskCollection.countDocuments(dateFilter),
        ])

        result = {
          summary: {
            testRegistrations,
            processedImages,
            kioskSubmissions,
            totalUsers: testRegistrations,
          },
        }
        break

      case "registrations":
        const registrations = await testRegistrationsCollection.find({}).toArray()
        result = { registrations }
        break

      case "kiosk-submissions":
        const submissions = await kioskCollection.find(dateFilter).sort({ createdAt: -1 }).toArray()
        result = { submissions }
        break

      case "detailed":
        const [allRegistrations, allSubmissions, allProcessedImages] = await Promise.all([
          testRegistrationsCollection.find({}).toArray(),
          kioskCollection.find(dateFilter).sort({ createdAt: -1 }).toArray(),
          processedImagesCollection.find({}).toArray(),
        ])

        result = {
          registrations: allRegistrations,
          submissions: allSubmissions,
          processedImages: allProcessedImages,
          summary: {
            testRegistrations: allRegistrations.length,
            processedImages: allProcessedImages.length,
            kioskSubmissions: allSubmissions.length,
            totalUsers: allRegistrations.length,
          },
        }
        break

      default:
        return NextResponse.json({ success: false, message: "Invalid report type" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result,
      collectionName,
      databases: {
        testEvent: TEST_EVENT_DB,
        backgroundRemoval: BACKGROUND_REMOVAL_DB,
        kiosk: KIOSK_DB,
      },
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch dashboard data", error: (error as Error).message },
      { status: 500 },
    )
  }
}
