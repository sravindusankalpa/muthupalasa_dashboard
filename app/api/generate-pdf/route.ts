import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb-client"

// Database configurations
const TEST_EVENT_DB = "test_event_registration"
const TEST_REGISTRATIONS_COLLECTION = "test_registrations"
const BACKGROUND_REMOVAL_DB = "background-removal"
const PROCESSED_IMAGES_COLLECTION = "processed-images"
const KIOSK_DB = "muthupalasa_kiosk"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const reportType = url.searchParams.get("type") || "summary"
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")
    const collectionName = process.env.NEXT_PUBLIC_COLLECTION_NAME || "EventDaySubmission"

    const client = await clientPromise

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

    // Create a simple PDF-like content using HTML that browsers can print to PDF
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>MongoDB Report - ${reportType}</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
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
            border: 1px solid #ddd; 
            border-radius: 5px; 
            background-color: #f9f9f9;
          }
          .summary-card h3 {
            margin: 0 0 10px 0;
            font-size: 24px;
            color: #333;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
            font-size: 12px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
          }
          th { 
            background-color: #f2f2f2; 
            font-weight: bold;
          }
          .footer { 
            margin-top: 30px; 
            text-align: center; 
            font-size: 12px; 
            color: #666; 
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            margin: 30px 0 15px 0;
            color: #333;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
          }
          .no-print {
            background-color: #e3f2fd;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <strong>Instructions:</strong> Use your browser's print function (Ctrl+P or Cmd+P) and select "Save as PDF" to download this report as a PDF file.
        </div>
        
        <div class="header">
          <h1>MongoDB Dashboard Report</h1>
          <h2>Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}</h2>
          <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          ${startDate && endDate ? `<p><strong>Date Range:</strong> ${startDate} to ${endDate}</p>` : ""}
          <p><strong>Collection:</strong> ${collectionName}</p>
        </div>
    `

    if (reportType === "summary" || reportType === "detailed") {
      const [testRegistrations, processedImages, kioskSubmissions] = await Promise.all([
        testRegistrationsCollection.countDocuments(),
        processedImagesCollection.countDocuments(),
        kioskCollection.countDocuments(dateFilter),
      ])

      htmlContent += `
        <div class="section-title">Summary Statistics</div>
        <div class="summary">
          <div class="summary-card">
            <h3>${testRegistrations.toLocaleString()}</h3>
            <p>Test Registrations</p>
          </div>
          <div class="summary-card">
            <h3>${processedImages.toLocaleString()}</h3>
            <p>Processed Images</p>
          </div>
          <div class="summary-card">
            <h3>${kioskSubmissions.toLocaleString()}</h3>
            <p>Kiosk Submissions</p>
          </div>
          <div class="summary-card">
            <h3>${testRegistrations.toLocaleString()}</h3>
            <p>Total Users</p>
          </div>
        </div>
      `
    }

    if (reportType === "registrations" || reportType === "detailed") {
      const registrations = await testRegistrationsCollection.find({}).limit(500).toArray()

      htmlContent += `
        <div class="section-title">Test Registrations (${registrations.length} records)</div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Owner Name</th>
              <th>NIC</th>
              <th>Shop Name</th>
              <th>Classification</th>
              <th>Golden Pass</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
      `

      registrations.forEach((reg) => {
        htmlContent += `
          <tr>
            <td>${reg._id.toString().substring(0, 8)}...</td>
            <td>${reg.dealerInfo?.ownerName || "N/A"}</td>
            <td>${reg.dealerInfo?.ownerNIC || "N/A"}</td>
            <td>${reg.dealerInfo?.shopName || "N/A"}</td>
            <td>${reg.dealerInfo?.classification || "N/A"}</td>
            <td>${reg.goldenPass || "N/A"}</td>
            <td>${reg.dealerInfo?.contactNo || "N/A"}</td>
          </tr>
        `
      })

      htmlContent += `</tbody></table>`
    }

    if (reportType === "kiosk-submissions" || reportType === "detailed") {
      const submissions = await kioskCollection.find(dateFilter).sort({ createdAt: -1 }).limit(500).toArray()

      htmlContent += `
        <div class="section-title">Kiosk Submissions - ${collectionName} (${submissions.length} records)</div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Owner Name</th>
              <th>NIC</th>
              <th>Shop Name</th>
              <th>Classification</th>
              <th>Golden Pass</th>
              <th>Background</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
      `

      submissions.forEach((sub) => {
        htmlContent += `
          <tr>
            <td>${sub._id.toString().substring(0, 8)}...</td>
            <td>${sub.eventuserdata?.ownerName || "N/A"}</td>
            <td>${sub.eventuserdata?.ownerNIC || "N/A"}</td>
            <td>${sub.eventuserdata?.shopName || "N/A"}</td>
            <td>${sub.eventuserdata?.classification || "N/A"}</td>
            <td>${sub.eventuserdata?.goldenPassNumber || "N/A"}</td>
            <td>${sub.eventuserdata?.selectedBackground || "N/A"}</td>
            <td>${new Date(sub.createdAt).toLocaleDateString()}</td>
          </tr>
        `
      })

      htmlContent += `</tbody></table>`
    }

    if (reportType === "processed-images" || reportType === "detailed") {
      const processedImages = await processedImagesCollection.find({}).limit(500).toArray()

      htmlContent += `
        <div class="section-title">Processed Images (${processedImages.length} records)</div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>NIC</th>
              <th>Image URL</th>
              <th>Processed At</th>
            </tr>
          </thead>
          <tbody>
      `

      processedImages.forEach((img) => {
        htmlContent += `
          <tr>
            <td>${img._id.toString().substring(0, 8)}...</td>
            <td>${img.nic || "N/A"}</td>
            <td>${img.imageUrl ? "Available" : "N/A"}</td>
            <td>${img.createdAt ? new Date(img.createdAt).toLocaleDateString() : "N/A"}</td>
          </tr>
        `
      })

      htmlContent += `</tbody></table>`
    }

    htmlContent += `
        <div class="footer">
          <p><strong>Report generated from MongoDB databases:</strong></p>
          <p>${TEST_EVENT_DB}, ${BACKGROUND_REMOVAL_DB}, ${KIOSK_DB}</p>
          <p><strong>Generated by:</strong> MongoDB Dashboard System</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </div>
        
        <script>
          // Auto-print functionality (optional)
          window.onload = function() {
            // Uncomment the next line to auto-print when page loads
            // window.print();
          }
        </script>
      </body>
      </html>
    `

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="mongodb-report-${reportType}-${new Date().toISOString().split("T")[0]}.html"`,
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json(
      { success: false, message: "Failed to generate PDF", error: (error as Error).message },
      { status: 500 },
    )
  }
}
