"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Download, Database, Users, FileText, Loader2, ExternalLink, Calendar } from "lucide-react"

interface DashboardData {
  summary?: {
    testRegistrations: number
    processedImages: number
    kioskSubmissions: number
    totalUsers: number
  }
  registrations?: any[]
  submissions?: any[]
  processedImages?: any[]
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({})
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState("summary")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [collectionName, setCollectionName] = useState("")

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: reportType,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      })

      const response = await fetch(`/api/dashboard-data?${params}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
        setCollectionName(result.collectionName)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const generatePDFReport = async () => {
    try {
      const params = new URLSearchParams({
        type: reportType,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      })

      // Open the PDF report in a new tab
      const url = `/api/generate-pdf?${params}`
      window.open(url, "_blank")
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF report")
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">MongoDB Dashboard</h1>
          <p className="text-muted-foreground">Event Registration & Kiosk Data Reports</p>
        </div>
        <div className="flex items-center gap-4">
          <Button asChild variant="outline">
            <a href="/events">
              <Calendar className="h-4 w-4 mr-2" />
              Events
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/registrations">
              <FileText className="h-4 w-4 mr-2" />
              Registrations
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/crud">
              <Database className="h-4 w-4 mr-2" />
              Manage Data
            </a>
          </Button>
          <Badge variant="outline" className="text-sm">
            Collection: {collectionName}
          </Badge>
        </div>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Generator
          </CardTitle>
          <CardDescription>Configure and generate reports from your MongoDB databases</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary Report</SelectItem>
                  <SelectItem value="registrations">Registrations Report</SelectItem>
                  <SelectItem value="kiosk-submissions">Kiosk Submissions</SelectItem>
                  <SelectItem value="detailed">Detailed Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={fetchData} disabled={loading} className="flex-1">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
              </Button>
              <Button onClick={generatePDFReport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                PDF
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
            <strong>PDF Instructions:</strong> Click the PDF button to open the report in a new tab. Use your browser's
            print function (Ctrl+P or Cmd+P) and select "Save as PDF" to download the report.
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {data.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Test Registrations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.testRegistrations.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processed Images</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.processedImages.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Background removed images</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kiosk Submissions</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.kioskSubmissions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Event day submissions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all databases</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Tables */}
      {reportType === "registrations" && data.registrations && (
        <Card>
          <CardHeader>
            <CardTitle>Test Registrations</CardTitle>
            <CardDescription>All registered users from test_event_registration database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Owner Name</th>
                    <th className="text-left p-2">NIC</th>
                    <th className="text-left p-2">Shop Name</th>
                    <th className="text-left p-2">Classification</th>
                    <th className="text-left p-2">Golden Pass</th>
                  </tr>
                </thead>
                <tbody>
                  {data.registrations.slice(0, 50).map((reg, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{reg.dealerInfo?.ownerName || "N/A"}</td>
                      <td className="p-2">{reg.dealerInfo?.ownerNIC || "N/A"}</td>
                      <td className="p-2">{reg.dealerInfo?.shopName || "N/A"}</td>
                      <td className="p-2">{reg.dealerInfo?.classification || "N/A"}</td>
                      <td className="p-2">{reg.goldenPass || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.registrations.length > 50 && (
                <p className="text-sm text-muted-foreground mt-2">Showing 50 of {data.registrations.length} records</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {reportType === "kiosk-submissions" && data.submissions && (
        <Card>
          <CardHeader>
            <CardTitle>Kiosk Submissions</CardTitle>
            <CardDescription>Event day submissions from {collectionName} collection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Owner Name</th>
                    <th className="text-left p-2">NIC</th>
                    <th className="text-left p-2">Shop Name</th>
                    <th className="text-left p-2">Classification</th>
                    <th className="text-left p-2">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {data.submissions.slice(0, 50).map((sub, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{sub.eventuserdata?.ownerName || "N/A"}</td>
                      <td className="p-2">{sub.eventuserdata?.ownerNIC || "N/A"}</td>
                      <td className="p-2">{sub.eventuserdata?.shopName || "N/A"}</td>
                      <td className="p-2">{sub.eventuserdata?.classification || "N/A"}</td>
                      <td className="p-2">{new Date(sub.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.submissions.length > 50 && (
                <p className="text-sm text-muted-foreground mt-2">Showing 50 of {data.submissions.length} records</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
