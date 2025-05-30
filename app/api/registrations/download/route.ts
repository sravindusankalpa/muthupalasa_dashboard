import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb-client"
import puppeteer from 'puppeteer'
import outletData from '@/public/mpdata.json'; 

const TEST_EVENT_DB = "event_registration"
const TEST_REGISTRATIONS_COLLECTION = "registrations"

// Create mappings for both BP Code and Outlet Code
const nicToBPCodeMap = new Map<string, string>();
const phoneToBPCodeMap = new Map<string, string>();
const nicToOutletCodeMap = new Map<string, string>();
const phoneToOutletCodeMap = new Map<string, string>();

(outletData.dealers || []).forEach((outlet: any) => {
  if (outlet.NICNUMBER) {
    const nicString = String(outlet.NICNUMBER).toUpperCase().trim();
    // Map to BP Code
    nicToBPCodeMap.set(nicString, outlet["BP CODE"] || "N/A");
    // Map to Outlet Code (assuming there's an OUTLET_CODE field, adjust as needed)
    nicToOutletCodeMap.set(nicString, outlet["OUTLET CODE"] || outlet["CODE"] || outlet["OUTLET CODE"] || "N/A");
  }
  if (outlet.CONTACTNO) {
    const phone = String(outlet.CONTACTNO).replace(/\D/g, '');
    // Map to BP Code
    phoneToBPCodeMap.set(phone, outlet["BP CODE"] || "N/A");
    // Map to Outlet Code
    phoneToOutletCodeMap.set(phone, outlet["OUTLET CODE"] || outlet["CODE"] || outlet["OUTLET CODE"] || "N/A");
  }
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const format = url.searchParams.get("format") || "pdf"
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

    // Enhance registrations with both BP Code and Outlet Code
    type RegistrationWithCodes = typeof registrations[number] & { 
      bpCode: string;
      outletCode: string;
    };
    
    const enhancedRegistrations: RegistrationWithCodes[] = registrations.map(reg => {
      let bpCode = "N/A";
      let outletCode = "N/A";
      
      // Try NIC first for both codes
      if (reg.dealerInfo?.ownerNIC) {
        const nicString = String(reg.dealerInfo.ownerNIC).toUpperCase().trim();
        bpCode = nicToBPCodeMap.get(nicString) || "N/A";
        outletCode = nicToOutletCodeMap.get(nicString) || "N/A";
        
        console.log(`NIC Lookup - Original: ${reg.dealerInfo.ownerNIC}, BP Code: ${bpCode}, Outlet Code: ${outletCode}`);
      }
      
      // If NIC lookup failed, try phone number as fallback
      if ((bpCode === "N/A" || outletCode === "N/A") && reg.dealerInfo?.contactNo) {
        const phoneString = String(reg.dealerInfo.contactNo).replace(/\D/g, '');
        if (bpCode === "N/A") {
          bpCode = phoneToBPCodeMap.get(phoneString) || "N/A";
        }
        if (outletCode === "N/A") {
          outletCode = phoneToOutletCodeMap.get(phoneString) || "N/A";
        }
        
        console.log(`Phone Lookup - Original: ${reg.dealerInfo.contactNo}, BP Code: ${bpCode}, Outlet Code: ${outletCode}`);
      }
      
      return {
        ...reg,
        bpCode,
        outletCode
      };
    });

    if (format === "csv") {
      // Updated CSV headers to include both codes
      const csvHeaders = [
        "ID",
        "Owner Name",
        "NIC Number",
        "Shop Name",
        "Contact Number",
        "Event",
        "Classification",
        "BP Code",
        "Outlet Code",
        "Golden Pass",
        "Registered Date",
      ]

      const csvRows = enhancedRegistrations.map((reg, index) => [
        index + 1,
        reg.dealerInfo?.ownerName || "N/A",
        reg.dealerInfo?.ownerNIC || "N/A",
        reg.dealerInfo?.shopName || "N/A",
        reg.dealerInfo?.contactNo || "N/A",
        reg.dealerInfo?.event || "N/A",
        reg.dealerInfo?.classification || "N/A",
        reg.bpCode,
        reg.outletCode,
        reg.goldenPass || "No Pass",
        reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString() : "N/A",
      ])

      const csvContent = [csvHeaders, ...csvRows]
        .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
        .join("\n")

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="registration-report-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    // Generate PDF using Puppeteer
    const htmlContent = await generatePDFHTML(enhancedRegistrations, totalCount, search)
    
    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0'
    })
    
    // Generate PDF buffer
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    })
    
    await browser.close()

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="registration-report-${new Date().toISOString().split("T")[0]}.pdf"`,
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

async function generatePDFHTML(registrations: any[], totalCount: number, search?: string | null) {
  // Get statistics
  const classificationStats = registrations.reduce((acc, reg) => {
    const classification = reg.dealerInfo?.classification || "Unspecified"
    acc[classification] = (acc[classification] || 0) + 1
    return acc
  }, {})

  const locationStats = registrations.reduce((acc, reg) => {
    const event = reg.dealerInfo?.event || "Unspecified"
    acc[event] = (acc[event] || 0) + 1
    return acc
  }, {})

  const goldenPassCount = registrations.filter((reg) => reg.goldenPass && reg.goldenPass !== "").length

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Registration Report</title>
      <style>
        @page {
          margin: 0.5in;
          size: A4;
        }
        
        body { 
          font-family: 'Arial', sans-serif; 
          margin: 0;
          padding: 0;
          line-height: 1.4;
          color: #333;
          font-size: 12px;
        }
        
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
        }
        
        .header h1 {
          margin: 0 0 10px 0;
          font-size: 24px;
          font-weight: 700;
        }
        
        .stats-grid { 
          display: grid; 
          grid-template-columns: repeat(4, 1fr);
          gap: 15px; 
          margin: 20px 0; 
        }
        
        .stat-card { 
          text-align: center; 
          padding: 15px; 
          border: 2px solid #e5e7eb; 
          border-radius: 8px; 
          background: #f8fafc;
        }
        
        .stat-card h3 {
          margin: 0 0 5px 0;
          font-size: 20px;
          color: #1e40af;
          font-weight: 700;
        }
        
        .stat-card p {
          margin: 0;
          color: #64748b;
          font-size: 11px;
        }
        
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0; 
          font-size: 9px;
        }
        
        th, td { 
          border: 1px solid #e2e8f0; 
          padding: 4px 3px; 
          text-align: left; 
        }
        
        th { 
          background: #3b82f6;
          color: white;
          font-weight: 600;
          font-size: 8px;
        }
        
        tr:nth-child(even) {
          background-color: #f8fafc;
        }
        
        .golden-pass {
          background: #fbbf24;
          color: white;
          padding: 2px 4px;
          border-radius: 3px;
          font-weight: 600;
          font-size: 7px;
        }
        
        .no-golden-pass {
          background: #e5e7eb;
          color: #6b7280;
          padding: 2px 4px;
          border-radius: 3px;
          font-size: 7px;
        }
        
        .bp-code {
          background: #10b981;
          color: white;
          padding: 2px 4px;
          border-radius: 3px;
          font-weight: 600;
          font-size: 7px;
        }
        
        .outlet-code {
          background: #8b5cf6;
          color: white;
          padding: 2px 4px;
          border-radius: 3px;
          font-weight: 600;
          font-size: 7px;
        }
        
        .footer { 
          margin-top: 30px; 
          text-align: center; 
          font-size: 10px; 
          color: #64748b; 
          border-top: 2px solid #e2e8f0;
          padding-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📋 Complete Registration Report</h1>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        ${search ? `<p><strong>Filter:</strong> "${search}"</p>` : ""}
        <p><strong>Total Records:</strong> ${totalCount.toLocaleString()}</p>
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
          <h3>${Object.keys(classificationStats).length}</h3>
          <p>Classifications</p>
        </div>
        <div class="stat-card">
          <h3>${Object.keys(locationStats).length}</h3>
          <p>Events</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Owner Name</th>
            <th>NIC</th>
            <th>Shop Name</th>
            <th>Contact</th>
            <th>Event</th>
            <th>Classification</th>
            <th>BP Code</th>
            <th>Outlet Code</th>
            <th>Golden Pass</th>
            <th>Registered</th>
          </tr>
        </thead>
        <tbody>
          ${registrations
            .map(
              (reg, index) => `
            <tr>
              <td>${index + 1}</td>
              <td><strong>${reg.dealerInfo?.ownerName || "N/A"}</strong></td>
              <td>${reg.dealerInfo?.ownerNIC || "N/A"}</td>
              <td>${reg.dealerInfo?.shopName || "N/A"}</td>
              <td>${reg.dealerInfo?.contactNo || "N/A"}</td>
              <td>${reg.dealerInfo?.event || "N/A"}</td>
              <td>${reg.dealerInfo?.classification || "N/A"}</td>
              <td>${
                reg.bpCode !== "N/A"
                  ? `<span class="bp-code">${reg.bpCode}</span>`
                  : "N/A"
              }</td>
              <td>${
                reg.outletCode !== "N/A"
                  ? `<span class="outlet-code">${reg.outletCode}</span>`
                  : "N/A"
              }</td>
              <td>${
                reg.goldenPass && reg.goldenPass !== ""
                  ? `<span class="golden-pass">${reg.goldenPass}</span>`
                  : `<span class="no-golden-pass">No Pass</span>`
              }</td>
              <td>${reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString() : "N/A"}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>

      <div class="footer">
        <p><strong>Report Generated by MongoDB Dashboard System</strong></p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      </div>
    </body>
    </html>
  `
}