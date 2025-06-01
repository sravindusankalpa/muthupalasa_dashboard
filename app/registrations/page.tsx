"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Upload,
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
  Plus,
  Edit,
  Trash2,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Bug,
  ChevronUp,
  ChevronDown,
  Shield,
  ChevronsUpDown,
  Check,
} from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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
  updatedAt?: string
}

interface RegistrationData {
  registrations: Registration[]
  totalCount: number
  statistics: any
  classificationStats: Array<{ _id: string; count: number }>
  locationStats: Array<{ _id: string; count: number }>
}

// Column Toggle Component
function ColumnToggle({ columns, visibleColumns, setVisibleColumns }: {
  columns: string[]
  visibleColumns: string[]
  setVisibleColumns: (columns: string[]) => void
}) {
  const [open, setOpen] = useState(false)

  const toggleColumn = (column: string) => {
    if (visibleColumns.includes(column)) {
      if (visibleColumns.length > 1) {
        setVisibleColumns(visibleColumns.filter((c) => c !== column))
      }
    } else {
      setVisibleColumns([...visibleColumns, column])
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="justify-between">
          Columns ({visibleColumns.length}/{columns.length})
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search columns..." />
          <CommandList>
            <CommandEmpty>No column found.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {columns.map((column) => (
                <CommandItem key={column} value={column} onSelect={() => toggleColumn(column)}>
                  <Check
                    className={`mr-2 h-4 w-4 ${visibleColumns.includes(column) ? "opacity-100" : "opacity-0"}`}
                  />
                  <span className="truncate">{column}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// CAPTCHA Component for Delete Confirmation
function DeleteConfirmation({ isOpen, onClose, onConfirm, recordInfo }: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  recordInfo: string
}) {
  const [captcha, setCaptcha] = useState("")
  const [userInput, setUserInput] = useState("")
  const [error, setError] = useState("")

  const generateCaptcha = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCaptcha(result)
    setUserInput("")
    setError("")
  }

  useEffect(() => {
    if (isOpen) {
      generateCaptcha()
    }
  }, [isOpen])

  const handleConfirm = () => {
    if (userInput.toUpperCase() === captcha) {
      onConfirm()
      onClose()
      setUserInput("")
      setError("")
    } else {
      setError("CAPTCHA doesn't match. Please try again.")
      generateCaptcha()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Shield className="h-5 w-5" />
            Confirm Delete
          </DialogTitle>
          <DialogDescription>
            You are about to delete: <strong>{recordInfo}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="text-sm text-red-800">
                <strong>Warning:</strong> This action cannot be undone. Please verify by entering the CAPTCHA below.
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Enter the CAPTCHA to confirm deletion:</Label>
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <span className="font-mono text-2xl font-bold tracking-widest text-gray-800 select-none">
                {captcha}
              </span>
            </div>
            <Input
              placeholder="Enter CAPTCHA here"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value.toUpperCase())}
              className="font-mono text-center text-lg tracking-widest"
              maxLength={6}
            />
            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="outline" 
              onClick={generateCaptcha}
              className="border-blue-200 text-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              New CAPTCHA
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirm}
              disabled={userInput.length !== 6}
            >
              Delete Registration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function RegistrationsPage() {
  const [data, setData] = useState<RegistrationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState<"pdf" | "csv" | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [viewMode, setViewMode] = useState<"summary" | "detailed">("summary")
  const [selectedRecord, setSelectedRecord] = useState<Registration | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteRecordId, setDeleteRecordId] = useState<string>("")
  const [deleteRecordInfo, setDeleteRecordInfo] = useState<string>("")
  const [jsonInput, setJsonInput] = useState("")
  const [editData, setEditData] = useState<Registration>({} as Registration)
  const [createData, setCreateData] = useState("")
  const [debugInfo, setDebugInfo] = useState("")
  const [showUploadSection, setShowUploadSection] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [visibleColumns, setVisibleColumns] = useState<string[]>([])

  // Available columns for display
  const availableColumns = [
    "Owner Name", "NIC", "Shop Name", "Contact", "Event", "Classification", "Golden Pass", "Registered"
  ]

  // Default template for new registrations
  const getRegistrationTemplate = () => ({
    dealerInfo: {
      ownerName: "",
      ownerNIC: "",
      shopName: "",
      contactNo: "",
      event: "",
      classification: ""
    },
    goldenPass: "",
    registeredAt: new Date().toISOString()
  })

  const fetchData = async (page = 1, search = "", loadAll = false) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
        ...(search && { search }),
        ...(loadAll && { format: "all" }),
      })

      console.log("Fetching registrations with params:", params.toString())
      
      const response = await fetch(`/api/registrations?${params}`)
      const result = await response.json()

      console.log("API Response:", result)

      if (result.success) {
        if (loadAll) {
          setData(result.data)
        } else {
          if (result.data && Array.isArray(result.data)) {
            setData(prev => ({
              ...prev,
              registrations: result.data,
              totalCount: result.pagination?.total || result.data.length,
              statistics: prev?.statistics || {},
              classificationStats: prev?.classificationStats || [],
              locationStats: prev?.locationStats || []
            }) as RegistrationData)
            setTotalPages(result.pagination?.pages || 1)
            setCurrentPage(page)
          }
        }
        setDebugInfo(JSON.stringify(result, null, 2))
      } else {
        console.error("API error:", result.message)
        alert(result.message || "Failed to fetch registrations")
        setDebugInfo(`Error: ${result.message}`)
      }
    } catch (error) {
      console.error("Error fetching registrations:", error)
      alert("Failed to fetch registrations")
      setDebugInfo(`Fetch Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  const debugApi = async () => {
    try {
      const response = await fetch('/api/registrations?debug=true')
      const result = await response.json()
      setDebugInfo(JSON.stringify(result, null, 2))
      setIsDebugModalOpen(true)
    } catch (error) {
      setDebugInfo(`Debug Error: ${error instanceof Error ? error.message : String(error)}`)
      setIsDebugModalOpen(true)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".json")) {
      alert("Please select a JSON file")
      return
    }

    setUploadLoading(true)
    try {
      const text = await file.text()
      const jsonData = JSON.parse(text)
      
      const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData]

      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataArray),
      })

      const result = await response.json()

      if (result.success) {
        alert(result.message)
        fetchData(currentPage, searchTerm)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } else {
        alert(result.message || "Failed to upload registrations")
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      alert("Invalid JSON file or upload failed")
    } finally {
      setUploadLoading(false)
    }
  }

  const handleManualUpload = async () => {
    if (!jsonInput.trim()) {
      alert("Please enter JSON data")
      return
    }

    setUploadLoading(true)
    try {
      const jsonData = JSON.parse(jsonInput)
      const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData]

      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataArray),
      })

      const result = await response.json()

      if (result.success) {
        alert(result.message)
        setIsUploadModalOpen(false)
        setJsonInput("")
        fetchData(currentPage, searchTerm)
      } else {
        alert(result.message || "Failed to upload registrations")
      }
    } catch (error) {
      console.error("Error uploading registrations:", error)
      alert("Invalid JSON format")
    } finally {
      setUploadLoading(false)
    }
  }

  const handleCreateRecord = async () => {
    if (!createData.trim()) {
      alert("Please enter registration data")
      return
    }

    setCreateLoading(true)
    try {
      const recordData = JSON.parse(createData)

      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recordData),
      })

      const result = await response.json()

      if (result.success) {
        alert("Registration created successfully!")
        setIsCreateModalOpen(false)
        setCreateData("")
        fetchData(currentPage, searchTerm)
      } else {
        alert(result.message || "Failed to create registration")
      }
    } catch (error) {
      console.error("Error creating registration:", error)
      alert("Invalid JSON format")
    } finally {
      setCreateLoading(false)
    }
  }

  const openCreateModal = () => {
    const template = getRegistrationTemplate()
    setCreateData(JSON.stringify(template, null, 2))
    setIsCreateModalOpen(true)
  }

  const handleEdit = async () => {
    if (!selectedRecord) return

    try {
      const response = await fetch(`/api/registrations?id=${selectedRecord._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      })

      const result = await response.json()

      if (result.success) {
        alert("Registration updated successfully")
        setIsEditModalOpen(false)
        setSelectedRecord(null)
        setEditData({} as Registration)
        fetchData(currentPage, searchTerm)
      } else {
        alert(result.message || "Failed to update registration")
      }
    } catch (error) {
      console.error("Error updating registration:", error)
      alert("Failed to update registration")
    }
  }

  const confirmDelete = (id: string, record: Registration) => {
    setDeleteRecordId(id)
    const info = record.dealerInfo?.ownerName || record.dealerInfo?.shopName || `Registration ID: ${id}`
    setDeleteRecordInfo(info)
    setIsDeleteModalOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteRecordId) return

    try {
      const response = await fetch(`/api/registrations?id=${deleteRecordId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        alert("Registration deleted successfully")
        fetchData(currentPage, searchTerm)
      } else {
        alert(result.message || "Failed to delete registration")
      }
    } catch (error) {
      console.error("Error deleting registration:", error)
      alert("Failed to delete registration")
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchData(1, searchTerm)
  }

  const openEditModal = (record: Registration) => {
    setSelectedRecord(record)
    setEditData({ ...record })
    setIsEditModalOpen(true)
  }

  const openViewModal = (record: Registration) => {
    setSelectedRecord(record)
    setIsViewModalOpen(true)
  }

  const loadAllData = () => {
    setViewMode("detailed")
    fetchData(1, searchTerm, true)
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

      alert(`${format.toUpperCase()} file downloaded successfully!`)
    } catch (error) {
      console.error(`Error downloading ${format}:`, error)
      alert(`Failed to download ${format.toUpperCase()} file. Please try again.`)
    } finally {
      setDownloadLoading(null)
    }
  }

  const getClassificationColor = (classification: string) => {
    switch (classification?.toUpperCase()) {
      case "PLATINUM": return "bg-purple-100 text-purple-800"
      case "GOLD": return "bg-yellow-100 text-yellow-800"
      case "SILVER": return "bg-gray-100 text-gray-800"
      case "BRONZE": return "bg-orange-100 text-orange-800"
      default: return "bg-blue-100 text-blue-800"
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    setVisibleColumns(availableColumns.slice(0, 6))
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
          <h1 className="text-3xl font-bold">📋 Event Registration Management</h1>
          <p className="text-muted-foreground">Complete CRUD operations for event registrations</p>
        </div>
        <div className="flex gap-2">
          {/* <Button 
            onClick={() => setShowUploadSection(!showUploadSection)} 
            variant="outline" 
            className="border-green-200 text-green-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            {showUploadSection ? "Hide Upload" : "Show Upload"}
            {showUploadSection ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
          </Button> */}
          <Button onClick={debugApi} variant="outline" className="border-yellow-200 text-yellow-700">
            <Bug className="h-4 w-4 mr-2" />
            Debug API
          </Button>
          <Button asChild variant="outline">
            <a href="/dashboard">
              <Database className="h-4 w-4 mr-2" />
              Dashboard
            </a>
          </Button>
        </div>
      </div>

      {/* Collapsible Upload Section */}
      {/* {showUploadSection && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Upload className="h-5 w-5" />
              Upload Registration Data
            </CardTitle>
            <CardDescription>Upload JSON files or create new registrations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Upload JSON File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    disabled={uploadLoading}
                    ref={fileInputRef}
                  />
                  {uploadLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                <p className="text-xs text-muted-foreground">Select a .json file to upload</p>
              </div>

              <div className="space-y-2">
                <Label>Manual JSON Input</Label>
                <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Paste JSON Data
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Upload Registration Data</DialogTitle>
                      <DialogDescription>Paste your JSON data below (single object or array)</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Textarea
                        placeholder='{"dealerInfo": {"ownerName": "John Doe", ...}, "goldenPass": "GP001"}'
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        rows={15}
                        className="font-mono text-sm"
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleManualUpload} disabled={uploadLoading}>
                          {uploadLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Upload Data
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <p className="text-xs text-muted-foreground">Paste JSON data manually</p>
              </div>

              <div className="space-y-2">
                <Label>Create Single Registration</Label>
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full bg-green-50 border-green-200 hover:bg-green-100">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create New Registration
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Registration</DialogTitle>
                      <DialogDescription>
                        Create a new registration by filling in the JSON template below
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Pre-filled template with standard fields
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCreateData(JSON.stringify(getRegistrationTemplate(), null, 2))}
                        >
                          Reset Template
                        </Button>
                      </div>
                      <Textarea
                        placeholder='{"dealerInfo": {"ownerName": "", ...}}'
                        value={createData}
                        onChange={(e) => setCreateData(e.target.value)}
                        rows={15}
                        className="font-mono text-sm"
                      />
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <div className="text-sm text-green-800">
                            <strong>Tip:</strong> Fill in the dealer information and golden pass details. 
                            The registration will be added to your database once created.
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateRecord} disabled={createLoading} className="bg-green-600 hover:bg-green-700">
                          {createLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                          Create Registration
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <p className="text-xs text-muted-foreground">Create individual registrations</p>
              </div>
            </div>

            <div className="bg-blue-100 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>Supported formats:</strong> Registration objects with dealerInfo and goldenPass fields.
                  The structure will adapt to your data automatically.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )} */}

      {/* Database Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Database className="h-5 w-5" />
            Database Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <strong>Database:</strong> <code className="bg-blue-100 px-2 py-1 rounded">event_registration</code>
            </div>
            <div>
              <strong>Collection:</strong> <code className="bg-blue-100 px-2 py-1 rounded">registrations</code>
            </div>
            <div>
              <strong>Total Records:</strong> <Badge variant="outline">{data?.totalCount?.toLocaleString() || 0}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            Search & Actions
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

          <div className="flex flex-wrap gap-2">
            <Button onClick={openCreateModal} variant="default" className="bg-green-600 hover:bg-green-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Create Registration
            </Button>
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
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Table Columns:</span>
            <ColumnToggle
              columns={availableColumns}
              visibleColumns={visibleColumns}
              setVisibleColumns={setVisibleColumns}
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistics Breakdown */}
      {/* {data?.classificationStats && data?.locationStats && (
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
      )} */}

      {/* Enhanced Data Table */}
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
            {data.registrations.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm flex items-center gap-2 text-blue-600">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <span>
                  Showing {visibleColumns.length} of {availableColumns.length} columns. Use the "Columns" button to
                  customize visible fields. Click "View" to see complete registration details.
                </span>
              </div>
            )}
            
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="mt-2">Loading registrations...</p>
              </div>
            ) : data.registrations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No registrations found. Create or upload registration data to get started.</p>
                <div className="mt-4">
                  <Button onClick={openCreateModal} variant="outline" className="bg-green-50 border-green-200">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Your First Registration
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-black">
                      <th className="text-left p-4 font-bold border-r bg-blue-100">#</th>
                      {visibleColumns.map((column) => (
                        <th key={column} className="text-left p-4 font-bold border-r bg-blue-100 min-w-[120px]">
                          {column}
                        </th>
                      ))}
                      <th className="text-left p-4 font-bold bg-blue-100">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.registrations.map((reg, index) => (
                      <tr key={reg._id} className="border-b hover:bg-blue-50/50 transition-colors">
                        <td className="p-4 font-medium border-r bg-gray-50 text-center text-black">
                          {(currentPage - 1) * 50 + index + 1}
                        </td>
                        {visibleColumns.map((column) => (
                          <td key={column} className="p-4 border-r max-w-[200px]">
                            {column === "Owner Name" && (
                              <span className="font-medium">{reg.dealerInfo?.ownerName || "N/A"}</span>
                            )}
                            {column === "NIC" && (
                              <span className="font-mono text-blue-600">{reg.dealerInfo?.ownerNIC || "N/A"}</span>
                            )}
                            {column === "Shop Name" && (
                              <div className="truncate" title={reg.dealerInfo?.shopName}>
                                {reg.dealerInfo?.shopName || "N/A"}
                              </div>
                            )}
                            {column === "Contact" && (
                              <span className="font-mono">{reg.dealerInfo?.contactNo || "N/A"}</span>
                            )}
                            {column === "Event" && (
                              <div className="truncate" title={reg.dealerInfo?.event}>
                                {reg.dealerInfo?.event || "N/A"}
                              </div>
                            )}
                            {column === "Classification" && (
                              <Badge 
                                variant="secondary" 
                                className={getClassificationColor(reg.dealerInfo?.classification)}
                              >
                                {reg.dealerInfo?.classification || "N/A"}
                              </Badge>
                            )}
                            {column === "Golden Pass" && (
                              reg.goldenPass && reg.goldenPass !== "" ? (
                                <Badge className="bg-yellow-500 hover:bg-yellow-600">{reg.goldenPass}</Badge>
                              ) : (
                                <Badge variant="secondary">No Pass</Badge>
                              )
                            )}
                            {column === "Registered" && (
                              <span className="text-green-600 font-medium">
                                {reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString() : "N/A"}
                              </span>
                            )}
                          </td>
                        ))}
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex gap-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openViewModal(reg)}
                              className="hover:bg-blue-50"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openEditModal(reg)}
                              className="hover:bg-yellow-50"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => confirmDelete(reg._id, reg)}
                              className="hover:bg-red-100"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

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

      {/* Delete Confirmation Modal with CAPTCHA */}
      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        recordInfo={deleteRecordInfo}
      />

      {/* Debug Modal */}
      <Dialog open={isDebugModalOpen} onOpenChange={setIsDebugModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>🔍 API Debug Information</DialogTitle>
            <DialogDescription>Raw API response and data structure analysis</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={debugInfo}
              readOnly
              rows={25}
              className="font-mono text-xs"
              placeholder="Debug information will appear here..."
            />
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsDebugModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Edit Modal with Form Fields */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Edit Registration
            </DialogTitle>
            <DialogDescription>
              Update the registration information using the form below
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRecord && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
                <div className="space-y-2">
                  <Label htmlFor="ownerName" className="text-sm font-medium">Owner Name</Label>
                  <Input
                    id="ownerName"
                    type="text"
                    value={editData.dealerInfo?.ownerName || ""}
                    onChange={(e) => setEditData({
                      ...editData,
                      dealerInfo: { ...editData.dealerInfo, ownerName: e.target.value }
                    })}
                    placeholder="Enter owner name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerNIC" className="text-sm font-medium">Owner NIC</Label>
                  <Input
                    id="ownerNIC"
                    type="text"
                    value={editData.dealerInfo?.ownerNIC || ""}
                    onChange={(e) => setEditData({
                      ...editData,
                      dealerInfo: { ...editData.dealerInfo, ownerNIC: e.target.value }
                    })}
                    className="font-mono"
                    placeholder="Enter NIC number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shopName" className="text-sm font-medium">Shop Name</Label>
                  <Input
                    id="shopName"
                    type="text"
                    value={editData.dealerInfo?.shopName || ""}
                    onChange={(e) => setEditData({
                      ...editData,
                      dealerInfo: { ...editData.dealerInfo, shopName: e.target.value }
                    })}
                    placeholder="Enter shop name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactNo" className="text-sm font-medium">Contact Number</Label>
                  <Input
                    id="contactNo"
                    type="text"
                    value={editData.dealerInfo?.contactNo || ""}
                    onChange={(e) => setEditData({
                      ...editData,
                      dealerInfo: { ...editData.dealerInfo, contactNo: e.target.value }
                    })}
                    className="font-mono"
                    placeholder="Enter contact number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event" className="text-sm font-medium">Event</Label>
                  <Input
                    id="event"
                    type="text"
                    value={editData.dealerInfo?.event || ""}
                    onChange={(e) => setEditData({
                      ...editData,
                      dealerInfo: { ...editData.dealerInfo, event: e.target.value }
                    })}
                    placeholder="Enter event name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="classification" className="text-sm font-medium">Classification</Label>
                  <Select
                    value={editData.dealerInfo?.classification || ""}
                    onValueChange={(value) => setEditData({
                      ...editData,
                      dealerInfo: { ...editData.dealerInfo, classification: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select classification..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLATINUM">Platinum</SelectItem>
                      <SelectItem value="GOLD">Gold</SelectItem>
                      <SelectItem value="SILVER">Silver</SelectItem>
                      <SelectItem value="BRONZE">Bronze</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="goldenPass" className="text-sm font-medium">Golden Pass</Label>
                  <Input
                    id="goldenPass"
                    type="text"
                    value={editData.goldenPass || ""}
                    onChange={(e) => setEditData({ ...editData, goldenPass: e.target.value })}
                    placeholder="Enter golden pass number (if any)"
                  />
                </div>
              </div>
            )}
            
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Preview JSON:</h4>
                <Badge variant="outline" className="text-xs">
                  Auto-updated as you type
                </Badge>
              </div>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto font-mono max-h-32 text-xs text-black">
                {JSON.stringify(editData, null, 2)}
              </pre>
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Update Registration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Registration Details</DialogTitle>
            <DialogDescription>Complete registration information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRecord && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="font-bold text-blue-800 mb-2">Owner Name</div>
                    <div className="text-gray-700 font-medium">
                      {selectedRecord.dealerInfo?.ownerName || "N/A"}
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="font-bold text-blue-800 mb-2">Owner NIC</div>
                    <div className="text-gray-700 font-mono">
                      {selectedRecord.dealerInfo?.ownerNIC || "N/A"}
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="font-bold text-blue-800 mb-2">Shop Name</div>
                    <div className="text-gray-700">
                      {selectedRecord.dealerInfo?.shopName || "N/A"}
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="font-bold text-blue-800 mb-2">Contact Number</div>
                    <div className="text-gray-700 font-mono">
                      {selectedRecord.dealerInfo?.contactNo || "N/A"}
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="font-bold text-blue-800 mb-2">Event</div>
                    <div className="text-gray-700">
                      {selectedRecord.dealerInfo?.event || "N/A"}
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="font-bold text-blue-800 mb-2">Classification</div>
                    <div className="text-gray-700">
                      <Badge className={getClassificationColor(selectedRecord.dealerInfo?.classification)}>
                        {selectedRecord.dealerInfo?.classification || "N/A"}
                      </Badge>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="font-bold text-blue-800 mb-2">Golden Pass</div>
                    <div className="text-gray-700">
                      {selectedRecord.goldenPass && selectedRecord.goldenPass !== "" ? (
                        <Badge className="bg-yellow-500 hover:bg-yellow-600">
                          {selectedRecord.goldenPass}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">No Pass</Badge>
                      )}
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="font-bold text-blue-800 mb-2">Registration Date</div>
                    <div className="text-gray-700">
                      {selectedRecord.registeredAt 
                        ? new Date(selectedRecord.registeredAt).toLocaleString()
                        : "N/A"}
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Raw JSON Data:</h4>
                  <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto font-mono max-h-64 text-black">
                    {JSON.stringify(selectedRecord, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
              <Button 
                onClick={() => {
                  setIsViewModalOpen(false)
                  openEditModal(selectedRecord!)
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Registration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}