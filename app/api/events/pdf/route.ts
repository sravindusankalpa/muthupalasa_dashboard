import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb-client"

// Event configurations
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

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Event Registrations Report</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
            .page-break { page-break-before: always; }
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #2563eb;
            margin: 0 0 10px 0;
            font-size: 28px;
          }
          .summary { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px; 
            margin: 20px 0; 
          }
          .summary-card { 
            text-align: center; 
            padding: 15px; 
            border: 2px solid #e5e7eb; 
            border-radius: 8px; 
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          }
          .summary-card h3 {
            margin: 0 0 10px 0;
            font-size: 24px;
            color: #1e40af;
          }
          .event-section {
            margin: 30px 0;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            overflow: hidden;
          }
          .event-header {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 15px 20px;
            margin: 0;
          }
          .event-header h3 {
            margin: 0 0 5px 0;
            font-size: 20px;
          }
          .event-header p {
            margin: 0;
            opacity: 0.9;
            font-size: 14px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 0;
            font-size: 12px;
          }
          th, td { 
            border: 1px solid #d1d5db; 
            padding: 8px 12px; 
            text-align: left; 
          }
          th { 
            background-color: #f3f4f6; 
            font-weight: bold;
            color: #374151;
          }
          tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .no-data {
            text-align: center;
            padding: 40px;
            color: #6b7280;
            font-style: italic;
          }
          .footer { 
            margin-top: 40px; 
            text-align: center; 
            font-size: 12px; 
            color: #6b7280; 
            border-top: 2px solid #e5e7eb;
            padding-top: 20px;
          }
          .no-print {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #3b82f6;
          }
          .location-badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <strong>📄 PDF Instructions:</strong> Use your browser's print function (Ctrl+P or Cmd+P) and select "Save as PDF" to download this report.
        </div>
        
        <div class="header">
          <h1>🎉 Event Registrations Report</h1>
          <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p><strong>Database:</strong> ${KIOSK_DB}</p>
        </div>
    `

    if (getAllEvents) {
      // Generate report for all events
      const allEventsData = await Promise.all(
        EVENTS.map(async (event) => {
          try {
            const collection = db.collection(event.collection)
            const [registrations, totalCount] = await Promise.all([
              collection.find({}).sort({ createdAt: -1 }).toArray(),
              collection.countDocuments(),
            ])
            return { ...event, registrations, totalCount }
          } catch (error) {
            return { ...event, registrations: [], totalCount: 0 }
          }
        }),
      )

      const totalRegistrations = allEventsData.reduce((sum, event) => sum + event.totalCount, 0)
      const activeEvents = allEventsData.filter((event) => event.totalCount > 0).length

      htmlContent += `
        <div class="summary">
          <div class="summary-card">
            <h3>${EVENTS.length}</h3>
            <p>Total Events</p>
          </div>
          <div class="summary-card">
            <h3>${activeEvents}</h3>
            <p>Active Events</p>
          </div>
          <div class="summary-card">
            <h3>${totalRegistrations.toLocaleString()}</h3>
            <p>Total Registrations</p>
          </div>
          <div class="summary-card">
            <h3>${new Set(EVENTS.map((e) => e.location)).size}</h3>
            <p>Locations</p>
          </div>
        </div>
      `

      // Group events by location
      const eventsByLocation = EVENTS.reduce(
        (acc, event) => {
          if (!acc[event.location]) acc[event.location] = []
          acc[event.location].push(event)
          return acc
        },
        {} as Record<string, typeof EVENTS>,
      )

      Object.entries(eventsByLocation).forEach(([location, locationEvents]) => {
        htmlContent += `<div class="page-break"></div><h2 style="color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">📍 ${location}</h2>`

        locationEvents.forEach((event) => {
          const eventData = allEventsData.find((e) => e.collection === event.collection)
          if (!eventData) return

          htmlContent += `
            <div class="event-section">
              <div class="event-header">
                <h3>${event.name}</h3>
                <p>📍 ${event.location} | 👥 ${eventData.totalCount} registrations | 🔗 ${event.url}</p>
                <p><strong>Collection:</strong> ${event.collection}</p>
              </div>
          `

          if (eventData.registrations.length > 0) {
            htmlContent += `
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Owner Name</th>
                    <th>NIC</th>
                    <th>Shop Name</th>
                    <th>Golden Pass</th>
                    <th>Classification</th>
                    <th>Registered At</th>
                  </tr>
                </thead>
                <tbody>
            `

            eventData.registrations.forEach((reg) => {
              htmlContent += `
                <tr>
                  <td>${reg._id.toString().substring(0, 8)}...</td>
                  <td>${reg.eventuserdata?.ownerName || "N/A"}</td>
                  <td>${reg.eventuserdata?.ownerNIC || "N/A"}</td>
                  <td>${reg.eventuserdata?.shopName || "N/A"}</td>
                  <td>${reg.eventuserdata?.goldenPassNumber || "N/A"}</td>
                  <td>${reg.eventuserdata?.classification || "N/A"}</td>
                  <td>${reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : "N/A"}</td>
                </tr>
              `
            })

            htmlContent += `</tbody></table>`
          } else {
            htmlContent += `<div class="no-data">No registrations found for this event</div>`
          }

          htmlContent += `</div>`
        })
      })
    } else if (location) {
      // Generate report for specific location
      const locationEvents = EVENTS.filter((event) => event.location.toLowerCase() === location.toLowerCase())

      const locationData = await Promise.all(
        locationEvents.map(async (event) => {
          try {
            const collection = db.collection(event.collection)
            const [registrations, totalCount] = await Promise.all([
              collection.find({}).sort({ createdAt: -1 }).toArray(),
              collection.countDocuments(),
            ])
            return { ...event, registrations, totalCount }
          } catch (error) {
            return { ...event, registrations: [], totalCount: 0 }
          }
        }),
      )

      const totalRegistrations = locationData.reduce((sum, event) => sum + event.totalCount, 0)

      htmlContent += `
        <h2 style="color: #1e40af; text-align: center;">📍 ${location} Events</h2>
        <div class="summary">
          <div class="summary-card">
            <h3>${locationEvents.length}</h3>
            <p>Events in ${location}</p>
          </div>
          <div class="summary-card">
            <h3>${totalRegistrations.toLocaleString()}</h3>
            <p>Total Registrations</p>
          </div>
        </div>
      `

      locationData.forEach((eventData) => {
        htmlContent += `
          <div class="event-section">
            <div class="event-header">
              <h3>${eventData.name}</h3>
              <p>📍 ${eventData.location} | 👥 ${eventData.totalCount} registrations</p>
              <p><strong>Collection:</strong> ${eventData.collection}</p>
            </div>
        `

        if (eventData.registrations.length > 0) {
          htmlContent += `
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Owner Name</th>
                  <th>NIC</th>
                  <th>Shop Name</th>
                  <th>Golden Pass</th>
                  <th>Classification</th>
                  <th>Registered At</th>
                </tr>
              </thead>
              <tbody>
          `

          eventData.registrations.forEach((reg) => {
            htmlContent += `
              <tr>
                <td>${reg._id.toString().substring(0, 8)}...</td>
                <td>${reg.eventuserdata?.ownerName || "N/A"}</td>
                <td>${reg.eventuserdata?.ownerNIC || "N/A"}</td>
                <td>${reg.eventuserdata?.shopName || "N/A"}</td>
                <td>${reg.eventuserdata?.goldenPassNumber || "N/A"}</td>
                <td>${reg.eventuserdata?.classification || "N/A"}</td>
                <td>${reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : "N/A"}</td>
              </tr>
            `
          })

          htmlContent += `</tbody></table>`
        } else {
          htmlContent += `<div class="no-data">No registrations found for this event</div>`
        }

        htmlContent += `</div>`
      })
    } else if (eventCollection) {
      // Generate report for specific event
      const event = EVENTS.find((e) => e.collection === eventCollection)
      if (!event) {
        return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
      }

      const collection = db.collection(eventCollection)
      const registrations = await collection.find({}).sort({ createdAt: -1 }).toArray()

      htmlContent += `
        <h2 style="color: #1e40af; text-align: center;">${event.name} - ${event.location}</h2>
        <div class="summary">
          <div class="summary-card">
            <h3>${registrations.length}</h3>
            <p>Total Registrations</p>
          </div>
          <div class="summary-card">
            <h3>${event.collection}</h3>
            <p>Collection Name</p>
          </div>
        </div>

        <div class="event-section">
          <div class="event-header">
            <h3>${event.name}</h3>
            <p>📍 ${event.location} | 🔗 ${event.url}</p>
            <p><strong>Collection:</strong> ${event.collection}</p>
          </div>
      `

      if (registrations.length > 0) {
        htmlContent += `
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Owner Name</th>
                <th>NIC</th>
                <th>Shop Name</th>
                <th>Golden Pass</th>
                <th>Classification</th>
                <th>Registered At</th>
              </tr>
            </thead>
            <tbody>
        `

        registrations.forEach((reg) => {
          htmlContent += `
            <tr>
              <td>${reg._id.toString().substring(0, 8)}...</td>
              <td>${reg.eventuserdata?.ownerName || "N/A"}</td>
              <td>${reg.eventuserdata?.ownerNIC || "N/A"}</td>
              <td>${reg.eventuserdata?.shopName || "N/A"}</td>
              <td>${reg.eventuserdata?.goldenPassNumber || "N/A"}</td>
              <td>${reg.eventuserdata?.classification || "N/A"}</td>
              <td>${reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : "N/A"}</td>
            </tr>
          `
        })

        htmlContent += `</tbody></table>`
      } else {
        htmlContent += `<div class="no-data">No registrations found for this event</div>`
      }

      htmlContent += `</div>`
    }

    htmlContent += `
        <div class="footer">
          <p><strong>📊 Event Management System Report</strong></p>
          <p>Generated from MongoDB Database: ${KIOSK_DB}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p>🌐 All event URLs: muthupalasa.com</p>
        </div>
      </body>
      </html>
    `

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="events-report-${new Date().toISOString().split("T")[0]}.html"`,
      },
    })
  } catch (error) {
    console.error("Error generating events PDF:", error)
    return NextResponse.json(
      { success: false, message: "Failed to generate events PDF", error: (error as Error).message },
      { status: 500 },
    )
  }
}
