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
  Search,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  FileText,
  Database,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronsUpDown,
  Check,
  Bug,
  UserPlus,
  ChevronUp,
  ChevronDown,
  Shield,
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

interface JsonRecord {
  _id: string
  [key: string]: any
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

  const selectAll = () => {
    setVisibleColumns([...columns])
  }

  const clearAll = () => {
    setVisibleColumns([columns[0]])
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
          <div className="flex border-t p-2 gap-2">
            <Button size="sm" variant="outline" onClick={selectAll} className="text-xs">
              Select All
            </Button>
            <Button size="sm" variant="outline" onClick={clearAll} className="text-xs">
              Clear All
            </Button>
          </div>
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
              Delete Record
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function JsonDataPage() {
  const [data, setData] = useState<JsonRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState<"json" | "csv" | "pdf" | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchType, setSearchType] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [selectedRecord, setSelectedRecord] = useState<JsonRecord | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteRecordId, setDeleteRecordId] = useState<string>("")
  const [deleteRecordInfo, setDeleteRecordInfo] = useState<string>("")
  const [jsonInput, setJsonInput] = useState("")
  const [editData, setEditData] = useState<JsonRecord>({} as JsonRecord)
  const [createData, setCreateData] = useState("")
  const [debugInfo, setDebugInfo] = useState("")
  const [showUploadSection, setShowUploadSection] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [visibleColumns, setVisibleColumns] = useState<string[]>([])

  // Predefined column order with better formatting
  const columnOrder = [
    "AREA", "BP CODE", "BP NAME", "OUTLET CODE", "OUTLET NAME", 
    "CLASSIFICATION", "DEALER NAME", "NICNUMBER", "CONTACTNO", 
    "EVENT DATE", "HOTEL"
  ]

  // Column display names
  const columnDisplayNames: { [key: string]: string } = {
    "AREA": "Area",
    "BP CODE": "BP Code",
    "BP NAME": "BP Name", 
    "OUTLET CODE": "Outlet Code",
    "OUTLET NAME": "Outlet Name",
    "CLASSIFICATION": "Classification",
    "DEALER NAME": "Dealer Name",
    "NICNUMBER": "NIC Number",
    "CONTACTNO": "Contact No",
    "EVENT DATE": "Event Date",
    "HOTEL": "Hotel"
  }

  // Search types
  const searchTypes = [
    { value: "all", label: "All Fields" },
    { value: "nic", label: "NIC Number" },
    { value: "name", label: "Names (BP/Dealer/Outlet)" },
    { value: "area", label: "Area" },
    { value: "classification", label: "Classification" },
    { value: "contact", label: "Contact Number" }
  ]

  // Template for new records
  const getRecordTemplate = () => {
    const template: { [key: string]: string } = {}
    columnOrder.forEach(field => {
      template[field] = ""
    })
    return template
  }

  const fetchData = async (page = 1, search = "", searchBy = "all") => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      })

      // Add search parameters
      if (search && search.trim()) {
        params.append("search", search.trim())
        if (searchBy && searchBy !== "all") {
          params.append("searchBy", searchBy)
        }
      }

      console.log("Fetching data with params:", params.toString())
      
      const response = await fetch(`/api/json-data?${params}`)
      const result = await response.json()

      console.log("API Response:", result)

      if (result.success) {
        // Handle different response structures
        let records: JsonRecord[] = []
        
        if (Array.isArray(result.data)) {
          records = result.data
        } else if (result.data && typeof result.data === 'object') {
          // If data is an object, check if it contains an array
          const keys = Object.keys(result.data)
          const arrayKey = keys.find(key => Array.isArray(result.data[key]))
          if (arrayKey) {
            records = result.data[arrayKey]
          } else {
            records = [result.data] // Single record
          }
        }

        // Client-side filtering if API doesn't support searchBy
        if (search && search.trim() && searchBy !== "all") {
          records = records.filter(record => {
            const searchLower = search.toLowerCase()
            switch (searchBy) {
              case "nic":
                return record.NICNUMBER && record.NICNUMBER.toLowerCase().includes(searchLower)
              case "name":
                return (
                  (record["BP NAME"] && record["BP NAME"].toLowerCase().includes(searchLower)) ||
                  (record["DEALER NAME"] && record["DEALER NAME"].toLowerCase().includes(searchLower)) ||
                  (record["OUTLET NAME"] && record["OUTLET NAME"].toLowerCase().includes(searchLower))
                )
              case "area":
                return record.AREA && record.AREA.toLowerCase().includes(searchLower)
              case "classification":
                return record.CLASSIFICATION && record.CLASSIFICATION.toLowerCase().includes(searchLower)
              case "contact":
                return record.CONTACTNO && record.CONTACTNO.toLowerCase().includes(searchLower)
              default:
                return true
            }
          })
        }

        // Ensure all records have valid _id
        records = records.map((record, index) => ({
          ...record,
          _id: record._id || `temp_${Date.now()}_${index}`
        }))

        console.log("Processed records:", records)
        setData(records)
        
        // Handle pagination
        const pagination = result.pagination || {}
        setTotalPages(pagination.pages || Math.ceil(records.length / 20))
        setTotalRecords(pagination.total || records.length)
        setCurrentPage(page)
        
        setDebugInfo(JSON.stringify(result, null, 2))
      } else {
        console.error("API error:", result.message)
        alert(result.message || "Failed to fetch data")
        setDebugInfo(`Error: ${result.message}`)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      alert("Failed to fetch data")
      setDebugInfo(
        `Fetch Error: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    } finally {
      setLoading(false)
    }
  }

  const debugApi = async () => {
    try {
      const response = await fetch('/api/json-data?debug=true')
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
      
      // Ensure it's an array for bulk upload
      const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData]

      const response = await fetch("/api/json-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataArray),
      })

      const result = await response.json()

      if (result.success) {
        alert(result.message)
        fetchData(currentPage, searchTerm, searchType)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } else {
        alert(result.message || "Failed to upload data")
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

      const response = await fetch("/api/json-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataArray),
      })

      const result = await response.json()

      if (result.success) {
        alert(result.message)
        setIsUploadModalOpen(false)
        setJsonInput("")
        fetchData(currentPage, searchTerm, searchType)
      } else {
        alert(result.message || "Failed to upload data")
      }
    } catch (error) {
      console.error("Error uploading data:", error)
      alert("Invalid JSON format")
    } finally {
      setUploadLoading(false)
    }
  }

  const handleCreateRecord = async () => {
    if (!createData.trim()) {
      alert("Please enter record data")
      return
    }

    setCreateLoading(true)
    try {
      const recordData = JSON.parse(createData)

      const response = await fetch("/api/json-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recordData),
      })

      const result = await response.json()

      if (result.success) {
        alert("Record created successfully!")
        setIsCreateModalOpen(false)
        setCreateData("")
        fetchData(currentPage, searchTerm, searchType)
      } else {
        alert(result.message || "Failed to create record")
      }
    } catch (error) {
      console.error("Error creating record:", error)
      alert("Invalid JSON format")
    } finally {
      setCreateLoading(false)
    }
  }

  const openCreateModal = () => {
    const template = getRecordTemplate()
    setCreateData(JSON.stringify(template, null, 2))
    setIsCreateModalOpen(true)
  }

  const handleEdit = async () => {
    if (!selectedRecord) return

    try {
      const response = await fetch(`/api/json-data?id=${selectedRecord._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      })

      const result = await response.json()

      if (result.success) {
        alert("Record updated successfully")
        setIsEditModalOpen(false)
        setSelectedRecord(null)
        setEditData({} as JsonRecord)
        fetchData(currentPage, searchTerm, searchType)
      } else {
        alert(result.message || "Failed to update record")
      }
    } catch (error) {
      console.error("Error updating record:", error)
      alert("Failed to update record")
    }
  }

  const confirmDelete = (id: string, record: JsonRecord) => {
    setDeleteRecordId(id)
    const info = record["BP NAME"] || record["DEALER NAME"] || record["OUTLET NAME"] || `Record ID: ${id}`
    setDeleteRecordInfo(info)
    setIsDeleteModalOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteRecordId) return

    try {
      const response = await fetch(`/api/json-data?id=${deleteRecordId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        alert("Record deleted successfully")
        fetchData(currentPage, searchTerm, searchType)
      } else {
        alert(result.message || "Failed to delete record")
      }
    } catch (error) {
      console.error("Error deleting record:", error)
      alert("Failed to delete record")
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure you want to delete ALL records? This action cannot be undone.")) return

    try {
      const response = await fetch("/api/json-data?deleteAll=true", {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        alert(result.message)
        fetchData(currentPage, searchTerm, searchType)
      } else {
        alert(result.message || "Failed to delete records")
      }
    } catch (error) {
      console.error("Error deleting all records:", error)
      alert("Failed to delete records")
    }
  }

  const downloadFile = async (format: "json" | "csv") => {
    setDownloadLoading(format)
    try {
      const params = new URLSearchParams({
        format: "all",
      })

      // Add search parameters for download
      if (searchTerm && searchTerm.trim()) {
        params.append("search", searchTerm.trim())
        if (searchType && searchType !== "all") {
          params.append("searchBy", searchType)
        }
      }

      const response = await fetch(`/api/json-data?${params}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch data for download")
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.message || "Failed to fetch data")
      }

      let allRecords = result.data

      // Apply client-side filtering if needed
      if (searchTerm && searchTerm.trim() && searchType !== "all") {
        allRecords = allRecords.filter((record: JsonRecord) => {
          const searchLower = searchTerm.toLowerCase()
          switch (searchType) {
            case "nic":
              return record.NICNUMBER && record.NICNUMBER.toLowerCase().includes(searchLower)
            case "name":
              return (
                (record["BP NAME"] && record["BP NAME"].toLowerCase().includes(searchLower)) ||
                (record["DEALER NAME"] && record["DEALER NAME"].toLowerCase().includes(searchLower)) ||
                (record["OUTLET NAME"] && record["OUTLET NAME"].toLowerCase().includes(searchLower))
              )
            case "area":
              return record.AREA && record.AREA.toLowerCase().includes(searchLower)
            case "classification":
              return record.CLASSIFICATION && record.CLASSIFICATION.toLowerCase().includes(searchLower)
            case "contact":
              return record.CONTACTNO && record.CONTACTNO.toLowerCase().includes(searchLower)
            default:
              return true
          }
        })
      }

      let content = ""
      let mimeType = ""
      let filename = `json-data-export-${new Date().toISOString().split("T")[0]}`

      if (format === "json") {
        content = JSON.stringify(allRecords, null, 2)
        mimeType = "application/json"
        filename += ".json"
      } else if (format === "csv") {
        const headers = visibleColumns.join(",")
        const rows = allRecords.map((record: JsonRecord) => 
          visibleColumns.map(col => `"${String(record[col] || "")}"`).join(",")
        ).join("\n")
        content = headers + "\n" + rows
        mimeType = "text/csv"
        filename += ".csv"
      }

      const blob = new Blob([content], { type: mimeType })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      alert(`${format.toUpperCase()} file downloaded successfully!`)
    } catch (error) {
      console.error(`Error downloading ${format}:`, error)
      alert(`Failed to download ${format.toUpperCase()} file`)
    } finally {
      setDownloadLoading(null)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchData(1, searchTerm, searchType)
  }

  const openEditModal = (record: JsonRecord) => {
    setSelectedRecord(record)
    setEditData({ ...record })
    setIsEditModalOpen(true)
  }

  const openViewModal = (record: JsonRecord) => {
    setSelectedRecord(record)
    setIsViewModalOpen(true)
  }

  const getDisplayFields = () => {
    if (data.length === 0) return columnOrder
    
    // Get all unique fields from all records
    const allFields = new Set<string>()
    data.forEach(record => {
      Object.keys(record).forEach(key => {
        if (key !== "_id" && key !== "uploadedAt" && key !== "updatedAt" && key !== "originalDocId") {
          allFields.add(key)
        }
      })
    })
    
    const availableFields = Array.from(allFields)
    
    // Return fields in predefined order, then any additional fields
    const orderedFields = columnOrder.filter(col => availableFields.includes(col))
    const additionalFields = availableFields.filter(field => !columnOrder.includes(field))
    
    return [...orderedFields, ...additionalFields]
  }

  const formatCellValue = (value: any) => {
    if (value === null || value === undefined) return ""
    if (typeof value === "object") return JSON.stringify(value)
    return String(value)
  }

  const getClassificationColor = (classification: string) => {
    switch (classification?.toUpperCase()) {
      case "PLATINUM": return "bg-purple-100 text-purple-800"
      case "GOLD": return "bg-yellow-100 text-yellow-800"
      case "SILVER": return "bg-gray-100 text-gray-800"
      default: return "bg-blue-100 text-blue-800"
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (data.length > 0) {
      const fields = getDisplayFields()
      setVisibleColumns(fields.slice(0, 8))
    }
  }, [data])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📊 JSON Data Management</h1>
          <p className="text-muted-foreground">Manage and export JSON data with advanced search and security</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowUploadSection(!showUploadSection)} 
            variant="outline" 
            className="border-green-200 text-green-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            {showUploadSection ? "Hide Upload" : "Show Upload"}
            {showUploadSection ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
          </Button>
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
      {showUploadSection && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-black">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Upload className="h-5 w-5" />
              Upload JSON Data
            </CardTitle>
            <CardDescription>Upload JSON files or paste JSON data directly</CardDescription>
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
                      <DialogTitle>Upload JSON Data</DialogTitle>
                      <DialogDescription>Paste your JSON data below (single object or array)</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Textarea
                        placeholder='{"AREA": "Colombo Metro", "BP CODE": 803567, ...}'
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
                <Label>Create Single Record</Label>
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full bg-green-50 border-green-200 hover:bg-green-100">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create New Record
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Record</DialogTitle>
                      <DialogDescription>
                        Create a new record by filling in the JSON template below
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
                          onClick={() => setCreateData(JSON.stringify(getRecordTemplate(), null, 2))}
                        >
                          Reset Template
                        </Button>
                      </div>
                      <Textarea
                        placeholder='{"AREA": "", "BP CODE": "", ...}'
                        value={createData}
                        onChange={(e) => setCreateData(e.target.value)}
                        rows={15}
                        className="font-mono text-sm"
                      />
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <div className="text-sm text-green-800">
                            <strong>Tip:</strong> Fill in the values for each field. Leave empty ("") for fields you don't need.
                            The record will be added to your table once created.
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateRecord} disabled={createLoading} className="bg-green-600 hover:bg-green-700">
                          {createLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                          Create Record
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <p className="text-xs text-muted-foreground">Create individual records</p>
              </div>
            </div>

            <div className="bg-blue-100 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>Supported formats:</strong> Single JSON object or array of objects. The structure is flexible
                  and will adapt to your data fields automatically.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">JSON records stored</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Fields</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getDisplayFields().length}</div>
            <p className="text-xs text-muted-foreground">Unique fields detected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Page</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentPage} / {totalPages}
            </div>
            <p className="text-xs text-muted-foreground">Page navigation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Records on Page</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
            <p className="text-xs text-muted-foreground">Currently displayed</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Search and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Search & Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Search by..." />
              </SelectTrigger>
              <SelectContent>
                {searchTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder={
                searchType === "nic" ? "Search by NIC Number..." :
                searchType === "name" ? "Search by BP/Dealer/Outlet names..." :
                searchType === "area" ? "Search by Area..." :
                searchType === "classification" ? "Search by Classification..." :
                searchType === "contact" ? "Search by Contact Number..." :
                "Search all fields..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4" />
            </Button>
            <Button onClick={() => fetchData(currentPage, searchTerm, searchType)} variant="outline" disabled={loading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={openCreateModal} variant="default" className="bg-green-600 hover:bg-green-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Create Record
            </Button>
            <Button onClick={() => downloadFile("json")} variant="outline" disabled={downloadLoading === "json"}>
              {downloadLoading === "json" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              JSON
            </Button>
            <Button onClick={() => downloadFile("csv")} variant="outline" disabled={downloadLoading === "csv"}>
              {downloadLoading === "csv" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              CSV
            </Button>
            {/* <Button onClick={handleDeleteAll} variant="destructive" disabled={totalRecords === 0}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete All
            </Button> */}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Table Columns:</span>
            <ColumnToggle
              columns={getDisplayFields()}
              visibleColumns={visibleColumns}
              setVisibleColumns={setVisibleColumns}
            />
            {searchType !== "all" && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Searching: {searchTypes.find(t => t.value === searchType)?.label}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>📋 JSON Data Records</span>
            <Badge variant="outline">{totalRecords.toLocaleString()} total records</Badge>
          </CardTitle>
          <CardDescription>
            Showing {data.length} of {totalRecords.toLocaleString()} records (Page {currentPage} of {totalPages})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.length > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm flex items-center gap-2 text-black">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span>
                Showing {visibleColumns.length} of {getDisplayFields().length} columns. Use the "Columns" button to
                customize visible fields. Click "View" to see complete record details.
              </span>
              <div className="ml-auto text-xs bg-white px-2 py-1 rounded">
                Debug: {data.length} records loaded
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-2">Loading data...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No data found. Upload some JSON data to get started.</p>
              <div className="mt-4">
                <Button onClick={openCreateModal} variant="outline" className="bg-green-50 border-green-200">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Your First Record
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-black">
                    <th className="text-left p-4 font-bold border-r bg-blue-100">#</th>
                    {visibleColumns.map((field) => (
                      <th key={field} className="text-left p-4 font-bold border-r bg-blue-100 min-w-[120px]">
                        {columnDisplayNames[field] || field}
                      </th>
                    ))}
                    <th className="text-left p-4 font-bold bg-blue-100">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((record, index) => {
                    if (!record || typeof record !== 'object' || !record._id) {
                      console.warn("Invalid record at index", index, record)
                      return null
                    }
                    
                    return (
                      <tr key={record._id} className="border-b hover:bg-blue-50/50 transition-colors">
                        <td className="p-4 font-medium border-r bg-gray-50 text-center">
                          {(currentPage - 1) * 20 + index + 1}
                        </td>
                        {visibleColumns.map((field) => (
                          <td key={field} className="p-4 border-r max-w-[200px]">
                            {field === "CLASSIFICATION" ? (
                              <Badge 
                                variant="secondary" 
                                className={getClassificationColor(record[field])}
                              >
                                {formatCellValue(record[field])}
                              </Badge>
                            ) : field === "CONTACTNO" ? (
                              <span className="font-mono">
                                {formatCellValue(record[field])}
                              </span>
                            ) : field === "NICNUMBER" ? (
                              <span className="font-mono text-blue-600">
                                {formatCellValue(record[field])}
                              </span>
                            ) : field === "EVENT DATE" ? (
                              <span className="text-green-600 font-medium">
                                {formatCellValue(record[field])}
                              </span>
                            ) : (
                              <div className="truncate" title={formatCellValue(record[field])}>
                                {formatCellValue(record[field])}
                              </div>
                            )}
                          </td>
                        ))}
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex gap-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openViewModal(record)}
                              className="hover:bg-blue-50"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openEditModal(record)}
                              className="hover:bg-yellow-50"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => confirmDelete(record._id, record)}
                              className="hover:bg-red-100"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, totalRecords)} of{" "}
                {totalRecords.toLocaleString()} records
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1 || loading}
                  onClick={() => fetchData(currentPage - 1, searchTerm, searchType)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages || loading}
                  onClick={() => fetchData(currentPage + 1, searchTerm, searchType)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
              Edit Record
            </DialogTitle>
            <DialogDescription>
              Update the record information using the form below
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRecord && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
                {getDisplayFields().map((field) => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={field} className="text-sm font-medium">
                      {columnDisplayNames[field] || field}
                    </Label>
                    {field === "CLASSIFICATION" ? (
                      <Select
                        value={editData[field] || ""}
                        onValueChange={(value) => setEditData({ ...editData, [field]: value })}
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
                    ) : field === "EVENT DATE" ? (
                      <Input
                        id={field}
                        type="date"
                        value={editData[field] || ""}
                        onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
                        className="w-full"
                      />
                    ) : field === "CONTACTNO" || field === "NICNUMBER" ? (
                      <Input
                        id={field}
                        type="text"
                        value={editData[field] || ""}
                        onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
                        className="font-mono"
                        placeholder={field === "CONTACTNO" ? "Enter contact number" : "Enter NIC number"}
                      />
                    ) : field === "BP CODE" || field === "OUTLETCODE" ? (
                      <Input
                        id={field}
                        type="number"
                        value={editData[field] || ""}
                        onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
                        placeholder={`Enter ${field.toLowerCase()}`}
                      />
                    ) : (
                      <Input
                        id={field}
                        type="text"
                        value={editData[field] || ""}
                        onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
                        placeholder={`Enter ${(columnDisplayNames[field] || field).toLowerCase()}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Preview JSON:</h4>
                <Badge variant="outline" className="text-xs">
                  Auto-updated as you type
                </Badge>
              </div>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto font-mono max-h-32 text-black text-xs">
                {JSON.stringify(editData, null, 2)}
              </pre>
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Update Record
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Record Details</DialogTitle>
            <DialogDescription>Complete record information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRecord && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(selectedRecord)
                    .filter(([key]) => key !== "_id")
                    .map(([key, value]) => (
                      <div key={key} className="border rounded-lg p-4 bg-gray-50">
                        <div className="font-bold text-blue-800 mb-2">
                          {columnDisplayNames[key] || key}
                        </div>
                        <div className="text-gray-700">
                          {key === "CLASSIFICATION" ? (
                            <Badge className={getClassificationColor(String(value))}>
                              {String(value)}
                            </Badge>
                          ) : typeof value === "object" ? (
                            <pre className="text-xs bg-white p-2 rounded border">
                              {JSON.stringify(value, null, 2)}
                            </pre>
                          ) : (
                            <span className={
                              key === "CONTACTNO" || key === "NICNUMBER" ? "font-mono" : ""
                            }>
                              {String(value || "")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Raw JSON Data:</h4>
                  <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto font-mono max-h-64">
                    {JSON.stringify(selectedRecord, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}