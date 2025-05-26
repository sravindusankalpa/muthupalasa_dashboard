"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, MapPin, Users, Calendar, ExternalLink, Loader2, FileText, Globe } from "lucide-react"

interface Event {
  name: string
  location: string
  collection: string
  url: string
  totalCount: number
  registrations?: any[]
}

interface EventsData {
  summary: {
    totalEvents: number
    totalRegistrations: number
    activeEvents: number
  }
  data: Event[]
}

export default function EventsPage() {
  const [eventsData, setEventsData] = useState<EventsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)

  const fetchEventsData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/events")
      const result = await response.json()

      if (result.success) {
        setEventsData(result)
      }
    } catch (error) {
      console.error("Error fetching events data:", error)
    } finally {
      setLoading(false)
    }
  }

  const downloadEventsPDF = async (type: "all" | "location" | "event", identifier?: string) => {
    try {
      let url = "/api/events/pdf?"

      if (type === "all") {
        url += "all=true"
      } else if (type === "location" && identifier) {
        url += `location=${encodeURIComponent(identifier)}`
      } else if (type === "event" && identifier) {
        url += `collection=${encodeURIComponent(identifier)}`
      }

      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl

      const filename = `events-report-${type}-${new Date().toISOString().split("T")[0]}.pdf`
      link.download = filename

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      alert("PDF downloaded successfully!")
    } catch (error) {
      console.error("Error downloading PDF:", error)
      alert("Failed to download PDF. Please try again.")
    }
  }

  useEffect(() => {
    fetchEventsData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading events data...</span>
        </div>
      </div>
    )
  }

  if (!eventsData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p>Failed to load events data</p>
          <Button onClick={fetchEventsData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // Group events by location
  const eventsByLocation = eventsData.data.reduce(
    (acc, event) => {
      if (!acc[event.location]) acc[event.location] = []
      acc[event.location].push(event)
      return acc
    },
    {} as Record<string, Event[]>,
  )

  const locations = Object.keys(eventsByLocation)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🎉 Event Management</h1>
          <p className="text-muted-foreground">All registered users for Muthupalasa & Start Club events</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => downloadEventsPDF("all")} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download All Events PDF
          </Button>
          <Button asChild variant="outline">
            <a href="/dashboard">
              <FileText className="h-4 w-4 mr-2" />
              Dashboard
            </a>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventsData.summary.totalEvents}</div>
            <p className="text-xs text-muted-foreground">Across all locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventsData.summary.activeEvents}</div>
            <p className="text-xs text-muted-foreground">With registrations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventsData.summary.totalRegistrations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All events combined</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locations.length}</div>
            <p className="text-xs text-muted-foreground">Event locations</p>
          </CardContent>
        </Card>
      </div>

      {/* Events by Location */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All Events</TabsTrigger>
          {locations.map((location) => (
            <TabsTrigger key={location} value={location}>
              {location}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">All Events Overview</h2>
              <Button onClick={() => downloadEventsPDF("all")} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                PDF Report
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventsData.data.map((event) => (
                <Card key={event.collection} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">{event.name}</span>
                      <Badge variant={event.totalCount > 0 ? "default" : "secondary"}>{event.totalCount} users</Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {event.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <strong>Collection:</strong>{" "}
                      <code className="bg-muted px-2 py-1 rounded">{event.collection}</code>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <a href={event.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {event.url}
                        <ExternalLink className="h-3 w-3 inline ml-1" />
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadEventsPDF("event", event.collection)}
                        disabled={event.totalCount === 0}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {locations.map((location) => (
          <TabsContent key={location} value={location}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">📍 {location} Events</h2>
                <Button onClick={() => downloadEventsPDF("location", location)} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  PDF Report for {location}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eventsByLocation[location].map((event) => (
                  <Card key={event.collection} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{event.name}</span>
                        <Badge variant={event.totalCount > 0 ? "default" : "secondary"}>
                          {event.totalCount} registrations
                        </Badge>
                      </CardTitle>
                      <CardDescription>Collection: {event.collection}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        <a href={event.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          Registration URL
                          <ExternalLink className="h-3 w-3 inline ml-1" />
                        </a>
                      </div>

                      {event.totalCount > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Recent Registrations:</p>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>• {event.totalCount} total users registered</p>
                            <p>
                              • Collection: <code className="bg-muted px-1 rounded">{event.collection}</code>
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadEventsPDF("event", event.collection)}
                          disabled={event.totalCount === 0}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Event PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
