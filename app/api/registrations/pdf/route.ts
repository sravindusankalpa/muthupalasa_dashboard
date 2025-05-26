import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb-client"

const TEST_EVENT_DB = "test_event_registration"
const TEST_REGISTRATIONS_COLLECTION = "test_registrations"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const search = url.searchParams.get("search")

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

    // Get all data
    const [registrations, totalCount] = await Promise.all([
      collection.find(query).sort({ _id: -1 }).toArray(),
      collection.countDocuments(query),
    ])

    // Get statistics
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

    const goldenPassCount = registrations.filter((reg) => reg.goldenPass && reg.goldenPass !== "").length

    // Generate beautiful HTML for PDF
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Complete Registration Report</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
            .page-break { page-break-before: always; }
          }
          
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0;
            padding: 20px;
            line-height: 1.6;
            color: #333;
            background: #f8fafc;
          }
          
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          
          .header { 
            text-align: center; 
            margin-bottom: 40px; 
            border-bottom: 4px solid #3b82f6;
            padding-bottom: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: -30px -30px 40px -30px;
            padding: 40px 30px 30px 30px;
            border-radius: 10px 10px 0 0;
          }
          
          .header h1 {
            margin: 0 0 15px 0;
            font-size: 36px;
            font-weight: 700;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          }
          
          .header .subtitle {
            font-size: 18px;
            opacity: 0.9;
            margin: 10px 0;
          }
          
          .header .meta {
            font-size: 14px;
            opacity: 0.8;
            margin-top: 20px;
          }
          
          .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 25px; 
            margin: 30px 0; 
          }
          
          .stat-card { 
            text-align: center; 
            padding: 25px; 
            border: 2px solid #e5e7eb; 
            border-radius: 12px; 
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            transition: transform 0.2s;
          }
          
          .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          }
          
          .stat-card h3 {
            margin: 0 0 10px 0;
            font-size: 32px;
            color: #1e40af;
            font-weight: 700;
          }
          
          .stat-card p {
            margin: 0;
            color: #64748b;
            font-weight: 500;
          }
          
          .section-title {
            font-size: 24px;
            font-weight: 700;
            margin: 40px 0 20px 0;
            color: #1e293b;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .section-title::before {
            content: "📊";
            font-size: 28px;
          }
          
          .breakdown-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin: 30px 0;
          }
          
          .breakdown-card {
            background: white;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          }
          
          .breakdown-card h4 {
            margin: 0 0 20px 0;
            color: #1e40af;
            font-size: 18px;
            font-weight: 600;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
          }
          
          .breakdown-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #f1f5f9;
          }
          
          .breakdown-item:last-child {
            border-bottom: none;
          }
          
          .breakdown-label {
            font-weight: 500;
            color: #475569;
          }
          
          .breakdown-value {
            font-weight: 700;
            color: #1e40af;
            background: #dbeafe;
            padding: 4px 8px;
            border-radius: 6px;
          }
          
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 30px 0; 
            font-size: 13px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          
          th, td { 
            border: 1px solid #e2e8f0; 
            padding: 12px 8px; 
            text-align: left; 
          }
          
          th { 
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
          }
          
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          
          tr:hover {
            background-color: #e0f2fe;
          }
          
          .golden-pass {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: white;
            padding: 4px 8px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 11px;
          }
          
          .no-golden-pass {
            background: #e5e7eb;
            color: #6b7280;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 11px;
          }
          
          .footer { 
            margin-top: 50px; 
            text-align: center; 
            font-size: 12px; 
            color: #64748b; 
            border-top: 3px solid #e2e8f0;
            padding-top: 30px;
            background: #f8fafc;
            margin-left: -30px;
            margin-right: -30px;
            margin-bottom: -30px;
            padding-left: 30px;
            padding-right: 30px;
            padding-bottom: 30px;
          }
          
          .no-print {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 30px;
            border-left: 6px solid #3b82f6;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          
          .highlight {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
          }
          
          .table-container {
            overflow-x: auto;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="no-print">
            <strong>📄 PDF Generation Instructions:</strong> Use your browser's print function (Ctrl+P or Cmd+P) and select "Save as PDF" to download this comprehensive registration report.
          </div>
          
          <div class="header">
            <h1>🎯 Complete Registration Report</h1>
            <div class="subtitle">Test Event Registration Database Analysis</div>
            <div class="meta">
              <strong>Database:</strong> ${TEST_EVENT_DB} | <strong>Collection:</strong> ${TEST_REGISTRATIONS_COLLECTION}<br>
              <strong>Generated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}<br>
              ${search ? `<strong>Search Filter:</strong> "${search}"<br>` : ""}
              <strong>Total Records:</strong> ${totalCount.toLocaleString()}
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <h3>${totalCount.toLocaleString()}</h3>
              <p>Total Registrations</p>
            </div>
            <div class="stat-card">
              <h3>${goldenPassCount.toLocaleString()}</h3>
              <p>Golden Pass Holders</p>
            </div>
            <div class="stat-card">
              <h3>${classificationStats.length}</h3>
              <p>Different Classifications</p>
            </div>
            <div class="stat-card">
              <h3>${locationStats.length}</h3>
              <p>Different Event Location</p>
            </div>
          </div>

          <div class="section-title">Statistical Breakdown</div>
          
          <div class="breakdown-grid">
            <div class="breakdown-card">
              <h4>📈 By Classification</h4>
    `

    classificationStats.forEach((stat) => {
      const percentage = ((stat.count / totalCount) * 100).toFixed(1)
      htmlContent += `
        <div class="breakdown-item">
          <span class="breakdown-label">${stat._id || "Unspecified"}</span>
          <span class="breakdown-value">${stat.count} (${percentage}%)</span>
        </div>
      `
    })

    htmlContent += `
            </div>
            
            <div class="breakdown-card">
              <h4>🌍 By Event Location</h4>
    `

    locationStats.slice(0, 10).forEach((stat) => {
      const percentage = ((stat.count / totalCount) * 100).toFixed(1)
      htmlContent += `
        <div class="breakdown-item">
          <span class="breakdown-label">${stat._id || "Unspecified"}</span>
          <span class="breakdown-value">${stat.count} (${percentage}%)</span>
        </div>
      `
    })

    if (locationStats.length > 10) {
      const remaining = locationStats.slice(10).reduce((sum, stat) => sum + stat.count, 0)
      const percentage = ((remaining / totalCount) * 100).toFixed(1)
      htmlContent += `
        <div class="breakdown-item">
          <span class="breakdown-label">Others (${locationStats.length - 10} events)</span>
          <span class="breakdown-value">${remaining} (${percentage}%)</span>
        </div>
      `
    }

    htmlContent += `
            </div>
          </div>

          <div class="section-title">Complete Registration Data</div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Owner Name</th>
                  <th>NIC Number</th>
                  <th>Shop Name</th>
                  <th>Contact Number</th>
                  <th>Event</th>
                  <th>Classification</th>
                  <th>Golden Pass</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
    `

    registrations.forEach((reg, index) => {
      const goldenPassDisplay =
        reg.goldenPass && reg.goldenPass !== ""
          ? `<span class="golden-pass">${reg.goldenPass}</span>`
          : `<span class="no-golden-pass">No Pass</span>`

      htmlContent += `
        <tr>
          <td><strong>${index + 1}</strong></td>
          <td><strong>${reg.dealerInfo?.ownerName || "N/A"}</strong></td>
          <td>${reg.dealerInfo?.ownerNIC || "N/A"}</td>
          <td>${reg.dealerInfo?.shopName || "N/A"}</td>
          <td>${reg.dealerInfo?.contactNo || "N/A"}</td>
          <td>${reg.dealerInfo?.event || "N/A"}</td>
          <td><span class="highlight">${reg.dealerInfo?.classification || "N/A"}</span></td>
          <td>${goldenPassDisplay}</td>
          <td>${reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString() : "N/A"}</td>
        </tr>
      `
    })

    htmlContent += `
              </tbody>
            </table>
          </div>

          <div class="footer">
            <h3>📊 Report Summary</h3>
            <p><strong>Database Source:</strong> MongoDB - ${TEST_EVENT_DB}.${TEST_REGISTRATIONS_COLLECTION}</p>
            <p><strong>Report Type:</strong> Complete Registration Analysis</p>
            <p><strong>Generated By:</strong> MongoDB Dashboard System</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>Total Records Processed:</strong> ${totalCount.toLocaleString()} registrations</p>
            ${search ? `<p><strong>Applied Filter:</strong> "${search}"</p>` : ""}
          </div>
        </div>
      </body>
      </html>
    `

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="complete-registration-report-${new Date().toISOString().split("T")[0]}.html"`,
      },
    })
  } catch (error) {
    console.error("Error generating registration PDF:", error)
    return NextResponse.json(
      { success: false, message: "Failed to generate registration PDF", error: (error as Error).message },
      { status: 500 },
    )
  }
}
