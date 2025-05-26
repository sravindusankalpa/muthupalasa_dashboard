"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Download,
  Users,
  Search,
  RefreshCw,
  Database,
  Award,
  MapPin,
  Loader2,
  Eye,
  Filter,
  FileText,
} from "lucide-react"

interface Registration {
  _id: string
  dealerInfo: {
    ownerName: string
    ownerNIC: string
    shopName: string
    contactNo: string
    event: string
    classification: string
  }
  goldenPass: string
  registeredAt: string
}

interface RegistrationData {
  registrations: Registration[]
  totalCount: number
  statistics: any
  classificationStats: Array<{ _id: string; count: number }>
  locationStats: Array<{ _id: string; count: number }>
}

export default function RegistrationsPage() {
  const [data, setData] = useState<RegistrationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState<"pdf" | "csv" | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [viewMode, setViewMode] = useState<"summary" | "detailed">("summary")

  const fetchData = async (page = 1, search = "", loadAll = false) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
        ...(search && { search }),
        ...(loadAll && { format: "all" }),
      })

      const response = await fetch(`/api/registrations?${params}`)
      const result = await response.json()

      if (result.success) {
        if (loadAll) {
          setData(result.data)
        } else {
          setData(
            (prev) =>
              ({
                ...prev,
                registrations: result.data,
                totalCount: result.pagination.total,
              }) as RegistrationData,
          )
          setTotalPages(result.pagination.pages)
          setCurrentPage(page)
        }
      }
    } catch (error) {
      console.error("Error fetching registrations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchData(1, searchTerm)
  }

  const downloadFile = async (format: "pdf" | "csv") => {
    setDownloadLoading(format)
    try {
      const params = new URLSearchParams({
        format,
        ...(searchTerm && { search: searchTerm }),
      })

      const response = await fetch(`/api/registrations/download?${params}`)

      if (!response.ok) {
        throw new Error("Download failed")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url

      const filename = `registration-report-${new Date().toISOString().split("T")[0]}.${format}`
      link.download = filename

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Show success message
      alert(`${format.toUpperCase()} file downloaded successfully!`)
    } catch (error) {
      console.error(`Error downloading ${format}:`, error)
      alert(`Failed to download ${format.toUpperCase()} file. Please try again.`)
    } finally {
      setDownloadLoading(null)
    }
  }

  const loadAllData = () => {
    setViewMode("detailed")
    fetchData(1, searchTerm, true)
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading && !data) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading registration data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📋 Complete Registration Report</h1>
          <p className="text-muted-foreground">All data from test_event_registration.test_registrations</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => downloadFile("pdf")}
            className="flex items-center gap-2"
            disabled={downloadLoading === "pdf"}
          >
            {downloadLoading === "pdf" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download PDF
          </Button>
          <Button
            onClick={() => downloadFile("csv")}
            variant="outline"
            className="flex items-center gap-2"
            disabled={downloadLoading === "csv"}
          >
            {downloadLoading === "csv" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Download CSV
          </Button>
          <Button asChild variant="outline">
            <a href="/dashboard">
              <Database className="h-4 w-4 mr-2" />
              Dashboard
            </a>
          </Button>
        </div>
      </div>
    

      {/* Database Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Database className="h-5 w-5" />
            Database Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm  text-blue-800">
            <div>
              <strong>Database:</strong> <code className="bg-blue-100 px-2 py-1 rounded">test_event_registration</code>
            </div>
            <div>
              <strong>Collection:</strong> <code className="bg-blue-100 px-2 py-1 rounded">test_registrations</code>
            </div>
            <div>
              <strong>Total Records:</strong> <Badge variant="outline">{data?.totalCount?.toLocaleString() || 0}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4  text-blue-800">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalCount?.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Golden Pass Holders</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.registrations?.filter((reg) => reg.goldenPass && reg.goldenPass !== "").length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Special pass holders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classifications</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.classificationStats?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Different types</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Events</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.locationStats?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Different locations</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
          <CardDescription>Search by name, NIC, shop name, contact number, or classification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search registrations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4" />
            </Button>
            <Button onClick={() => fetchData(currentPage, searchTerm)} variant="outline" disabled={loading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button onClick={loadAllData} variant={viewMode === "detailed" ? "default" : "outline"} disabled={loading}>
              <Eye className="h-4 w-4 mr-2" />
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Load All Data
            </Button>
            <Button onClick={() => downloadFile("pdf")} variant="outline" disabled={downloadLoading === "pdf"}>
              {downloadLoading === "pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              PDF
            </Button>
            <Button onClick={() => downloadFile("csv")} variant="outline" disabled={downloadLoading === "csv"}>
              {downloadLoading === "csv" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Breakdown */}
      {data?.classificationStats && data?.locationStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>📊 By Classification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.classificationStats.slice(0, 8).map((stat) => {
                  const percentage = ((stat.count / data.totalCount) * 100).toFixed(1)
                  return (
                    <div key={stat._id} className="flex justify-between items-center">
                      <span className="text-sm">{stat._id || "Unspecified"}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{stat.count}</Badge>
                        <span className="text-xs text-muted-foreground">({percentage}%)</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🌍 By Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.locationStats.slice(0, 8).map((stat) => {
                  const percentage = ((stat.count / data.totalCount) * 100).toFixed(1)
                  return (
                    <div key={stat._id} className="flex justify-between items-center">
                      <span className="text-sm">{stat._id || "Unspecified"}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{stat.count}</Badge>
                        <span className="text-xs text-muted-foreground">({percentage}%)</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Table */}
      {data?.registrations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>📋 Registration Data</span>
              <Badge variant="outline">
                {viewMode === "detailed" ? "All Records" : `Page ${currentPage} of ${totalPages}`}
              </Badge>
            </CardTitle>
            <CardDescription>
              {viewMode === "detailed"
                ? `Showing all ${data.totalCount.toLocaleString()} registrations`
                : `Showing ${data.registrations.length} of ${data.totalCount?.toLocaleString()} registrations`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-semibold">#</th>
                    <th className="text-left p-3 font-semibold">Owner Name</th>
                    <th className="text-left p-3 font-semibold">NIC</th>
                    <th className="text-left p-3 font-semibold">Shop Name</th>
                    <th className="text-left p-3 font-semibold">Contact</th>
                    <th className="text-left p-3 font-semibold">Events</th>
                    <th className="text-left p-3 font-semibold">Classification</th>
                    <th className="text-left p-3 font-semibold">Golden Pass</th>
                    <th className="text-left p-3 font-semibold">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {data.registrations.map((reg, index) => (
                    <tr key={reg._id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{(currentPage - 1) * 50 + index + 1}</td>
                      <td className="p-3 font-medium">{reg.dealerInfo?.ownerName || "N/A"}</td>
                      <td className="p-3">{reg.dealerInfo?.ownerNIC || "N/A"}</td>
                      <td className="p-3">{reg.dealerInfo?.shopName || "N/A"}</td>
                      <td className="p-3">{reg.dealerInfo?.contactNo || "N/A"}</td>
                      <td className="p-3">{reg.dealerInfo?.event || "N/A"}</td>
                      <td className="p-3">
                        <Badge variant="outline">{reg.dealerInfo?.classification || "N/A"}</Badge>
                      </td>
                      <td className="p-3">
                        {reg.goldenPass && reg.goldenPass !== "" ? (
                          <Badge className="bg-yellow-500 hover:bg-yellow-600">{reg.goldenPass}</Badge>
                        ) : (
                          <Badge variant="secondary">No Pass</Badge>
                        )}
                      </td>
                      <td className="p-3">{reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString() : "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {viewMode === "summary" && totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1 || loading}
                    onClick={() => fetchData(currentPage - 1, searchTerm)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages || loading}
                    onClick={() => fetchData(currentPage + 1, searchTerm)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
