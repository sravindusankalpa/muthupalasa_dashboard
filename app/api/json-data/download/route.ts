import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb-client"

const JSON_DATA_DB = "json_data_management"
const JSON_DATA_COLLECTION = "uploaded_data"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const format = url.searchParams.get("format") || "json"
    const search = url.searchParams.get("search")

    const client = await clientPromise
    const db = client.db(JSON_DATA_DB)
    const collection = db.collection(JSON_DATA_COLLECTION)

    // Build search query
    let query = {}
    if (search) {
      const searchRegex = { $regex: search, $options: "i" }
      query = {
        $or: [
          { "BP NAME": searchRegex },
          { "DEALER NAME": searchRegex },
          { "OUTLET NAME": searchRegex },
          { NICNUMBER: searchRegex },
          { AREA: searchRegex },
          { CLASSIFICATION: searchRegex },
        ],
      }
    }

    // Get all data
    const documents = await collection.find(query).sort({ _id: -1 }).toArray()

    if (format === "csv") {
      // Generate CSV
      if (documents.length === 0) {
        return NextResponse.json({ success: false, message: "No data to export" }, { status: 400 })
      }

      // Get all unique keys from all documents (dynamic structure)
      const allKeys = new Set<string>()
      documents.forEach((doc) => {
        Object.keys(doc).forEach((key) => {
          if (key !== "_id" && key !== "uploadedAt" && key !== "updatedAt") {
            allKeys.add(key)
          }
        })
      })

      const csvHeaders = ["ID", ...Array.from(allKeys), "Uploaded At", "Updated At"]

      const csvRows = documents.map((doc, index) => {
        const row = [index + 1]
        allKeys.forEach((key) => {
          row.push(doc[key] || "")
        })
       row.push(doc.uploadedAt ? new Date(doc.uploadedAt).getTime() : 0);
       row.push(doc.updatedAt ? new Date(doc.updatedAt).getTime() : 0);
       return row;
      })

      const csvContent = [csvHeaders, ...csvRows]
        .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
        .join("\n")

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="json-data-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    if (format === "json") {
      // Generate JSON file
      const jsonContent = JSON.stringify(documents, null, 2)

      return new NextResponse(jsonContent, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="json-data-export-${new Date().toISOString().split("T")[0]}.json"`,
        },
      })
    }

    // Generate PDF
    const htmlContent = await generatePDFHTML(documents, search)

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="json-data-report-${new Date().toISOString().split("T")[0]}.html"`,
      },
    })
  } catch (error) {
    console.error("Error generating download:", error)
    return NextResponse.json(
      { success: false, message: "Failed to generate download", error: (error as Error).message },
      { status: 500 },
    )
  }
}

async function generatePDFHTML(documents: any[], search?: string | null) {
  if (documents.length === 0) {
    return "<html><body><h1>No data to export</h1></body></html>"
  }

  // Get all unique keys from all documents
  const allKeys = new Set<string>()
  documents.forEach((doc) => {
    Object.keys(doc).forEach((key) => {
      if (key !== "_id" && key !== "uploadedAt" && key !== "updatedAt") {
        allKeys.add(key)
      }
    })
  })

  const keyArray = Array.from(allKeys)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>JSON Data Report</title>
      <style>
        @page { margin: 0.5in; size: A4 landscape; }
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; padding: 20px; 
          line-height: 1.4; color: #333; font-size: 11px;
        }
        .header { 
          text-align: center; margin-bottom: 30px; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; padding: 20px; border-radius: 8px;
        }
        .header h1 { margin: 0 0 10px 0; font-size: 24px; }
        .stats { 
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 15px; margin: 20px 0; 
        }
        .stat-card { 
          text-align: center; padding: 15px; 
          border: 2px solid #e5e7eb; border-radius: 8px; background: #f8fafc;
        }
        .stat-card h3 { margin: 0 0 5px 0; font-size: 18px; color: #1e40af; }
        table { 
          width: 100%; border-collapse: collapse; 
          margin: 20px 0; font-size: 9px;
        }
        th, td { 
          border: 1px solid #e2e8f0; padding: 4px 2px; text-align: left; 
        }
        th { 
          background: #3b82f6; color: white; font-weight: 600; font-size: 8px;
        }
        tr:nth-child(even) { background-color: #f8fafc; }
        .footer { 
          margin-top: 30px; text-align: center; font-size: 10px; 
          color: #64748b; border-top: 2px solid #e2e8f0; padding-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 JSON Data Report</h1>
        <p><strong>Database:</strong> ${JSON_DATA_DB}.${JSON_DATA_COLLECTION}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        ${search ? `<p><strong>Filter:</strong> "${search}"</p>` : ""}
        <p><strong>Total Records:</strong> ${documents.length.toLocaleString()}</p>
      </div>

      <div class="stats">
        <div class="stat-card">
          <h3>${documents.length.toLocaleString()}</h3>
          <p>Total Records</p>
        </div>
        <div class="stat-card">
          <h3>${keyArray.length}</h3>
          <p>Data Fields</p>
        </div>
        <div class="stat-card">
          <h3>${new Set(documents.map((d) => d.AREA)).size}</h3>
          <p>Unique Areas</p>
        </div>
        <div class="stat-card">
          <h3>${new Set(documents.map((d) => d.CLASSIFICATION)).size}</h3>
          <p>Classifications</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            ${keyArray.map((key) => `<th>${key}</th>`).join("")}
            <th>Uploaded</th>
          </tr>
        </thead>
        <tbody>
          ${documents
            .map(
              (doc, index) => `
            <tr>
              <td>${index + 1}</td>
              ${keyArray.map((key) => `<td>${doc[key] || ""}</td>`).join("")}
              <td>${doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ""}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>

      <div class="footer">
        <p><strong>JSON Data Management System</strong></p>
        <p>Generated: ${new Date().toISOString()}</p>
      </div>
    </body>
    </html>
  `
}
