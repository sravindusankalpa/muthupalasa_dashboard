import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb-client"

// Event configurations with their collection names and details
const EVENTS = [
  {
    name: "Muthupalasa 1",
    location: "Kandalama",
    collection: "MP1_KANDALAMA",
    url: "https://muthupalasa.com/mp1-kandalama",
  },
  {
    name: "Muthupalasa 2",
    location: "Kandalama",
    collection: "MP2_KANDALAMA",
    url: "https://muthupalasa.com/mp2-kandalama",
  },
  {
    name: "Muthupalasa 3",
    location: "Kandalama",
    collection: "MP3_KANDALAMA",
    url: "https://muthupalasa.com/mp3-kandalama",
  },
  {
    name: "Start Club 1",
    location: "Kandalama",
    collection: "SC1_KANDALAMA",
    url: "https://muthupalasa.com/startclub1-kandalama",
  },
  {
    name: "Start Club 2",
    location: "Kandalama",
    collection: "SC2_KANDALAMA",
    url: "https://muthupalasa.com/startclub2-kandalama",
  },
  {
    name: "Muthupalasa 4",
    location: "Nuwara Eliya",
    collection: "MP4_NUWARAELIYA",
    url: "https://muthupalasa.com/mp4-nuwaraeliya",
  },
  {
    name: "Muthupalasa 5",
    location: "Embilipitiya",
    collection: "mp5-embilipitiya",
    url: "https://muthupalasa.com/mp5-embilipitiya",
  },
  { name: "Muthupalasa 6", location: "Galle", collection: "mp6-galle", url: "https://muthupalasa.com/mp6-galle" },
  {
    name: "Start Club 3",
    location: "Galle",
    collection: "startclub3-galle",
    url: "https://muthupalasa.com/startclub3-galle",
  },
  { name: "Muthupalasa 7", location: "Monarch", collection: "mp7-monarch", url: "https://muthupalasa.com/mp7-monarch" },
  { name: "Muthupalasa 8", location: "Monarch", collection: "mp8-monarch", url: "https://muthupalasa.com/mp8-monarch" },
  {
    name: "Start Club 4",
    location: "Monarch",
    collection: "startclub4-monarch",
    url: "https://muthupalasa.com/startclub4-monarch",
  },
]

const KIOSK_DB = "muthupalasa_kiosk"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const eventCollection = url.searchParams.get("collection")
    const location = url.searchParams.get("location")
    const getAllEvents = url.searchParams.get("all") === "true"

    const client = await clientPromise
    const db = client.db(KIOSK_DB)

    if (getAllEvents) {
      // Get data from all events
      const allEventsData = await Promise.all(
        EVENTS.map(async (event) => {
          try {
            const collection = db.collection(event.collection)
            const [registrations, totalCount] = await Promise.all([
              collection.find({}).sort({ createdAt: -1 }).limit(100).toArray(),
              collection.countDocuments(),
            ])

            return {
              ...event,
              registrations,
              totalCount,
            }
          } catch (error) {
            console.log(`Collection ${event.collection} not found or empty`)
            return {
              ...event,
              registrations: [],
              totalCount: 0,
            }
          }
        }),
      )

      return NextResponse.json({
        success: true,
        data: allEventsData,
        summary: {
          totalEvents: EVENTS.length,
          totalRegistrations: allEventsData.reduce((sum, event) => sum + event.totalCount, 0),
          activeEvents: allEventsData.filter((event) => event.totalCount > 0).length,
        },
      })
    }

    if (location) {
      // Get data for specific location
      const locationEvents = EVENTS.filter((event) => event.location.toLowerCase() === location.toLowerCase())

      const locationData = await Promise.all(
        locationEvents.map(async (event) => {
          try {
            const collection = db.collection(event.collection)
            const [registrations, totalCount] = await Promise.all([
              collection.find({}).sort({ createdAt: -1 }).toArray(),
              collection.countDocuments(),
            ])

            return {
              ...event,
              registrations,
              totalCount,
            }
          } catch (error) {
            return {
              ...event,
              registrations: [],
              totalCount: 0,
            }
          }
        }),
      )

      return NextResponse.json({
        success: true,
        data: locationData,
        location,
        summary: {
          totalEvents: locationEvents.length,
          totalRegistrations: locationData.reduce((sum, event) => sum + event.totalCount, 0),
        },
      })
    }

    if (eventCollection) {
      // Get data for specific event
      const event = EVENTS.find((e) => e.collection === eventCollection)
      if (!event) {
        return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
      }

      const collection = db.collection(eventCollection)
      const [registrations, totalCount] = await Promise.all([
        collection.find({}).sort({ createdAt: -1 }).toArray(),
        collection.countDocuments(),
      ])

      return NextResponse.json({
        success: true,
        data: {
          ...event,
          registrations,
          totalCount,
        },
      })
    }

    // Return list of all events with basic info
    const eventsWithCounts = await Promise.all(
      EVENTS.map(async (event) => {
        try {
          const collection = db.collection(event.collection)
          const totalCount = await collection.countDocuments()
          return { ...event, totalCount }
        } catch (error) {
          return { ...event, totalCount: 0 }
        }
      }),
    )

    return NextResponse.json({
      success: true,
      data: eventsWithCounts,
      summary: {
        totalEvents: EVENTS.length,
        totalRegistrations: eventsWithCounts.reduce((sum, event) => sum + event.totalCount, 0),
        activeEvents: eventsWithCounts.filter((event) => event.totalCount > 0).length,
      },
    })
  } catch (error) {
    console.error("Error fetching events data:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch events data", error: (error as Error).message },
      { status: 500 },
    )
  }
}
