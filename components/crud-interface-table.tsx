"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Plus, Search, RefreshCw, Eye } from "lucide-react"

interface Document {
  _id: string
  [key: string]: any
}

interface CrudInterfaceProps {
  database: string
  collection: string
  title: string
  description: string
}

export function CrudInterface({ database, collection, title, description }: CrudInterfaceProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [newDocumentData, setNewDocumentData] = useState("")
  const [editDocumentData, setEditDocumentData] = useState("")

  const fetchDocuments = async (page = 1, search = "") => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        database,
        collection,
        page: page.toString(),
        limit: "20",
        ...(search && { search }),
      })

      const response = await fetch(`/api/crud?${params}`)
      const result = await response.json()

      if (result.success) {
        setDocuments(result.data)
        setTotalPages(result.pagination.pages)
        setTotalRecords(result.pagination.total)
        setCurrentPage(page)
      } else {
        alert(result.message || "Failed to fetch documents")
      }
    } catch (error) {
      alert("Failed to fetch documents")
    } finally {
      setLoading(false)
    }
  }

  const createDocument = async () => {
    try {
      const data = JSON.parse(newDocumentData)
      const params = new URLSearchParams({ database, collection })

      const response = await fetch(`/api/crud?${params}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        alert("Document created successfully")
        setIsCreateModalOpen(false)
        setNewDocumentData("")
        fetchDocuments(currentPage, searchTerm)
      } else {
        alert(result.message || "Failed to create document")
      }
    } catch (error) {
      alert("Invalid JSON format")
    }
  }

  const updateDocument = async () => {
    if (!selectedDocument) return

    try {
      const data = JSON.parse(editDocumentData)
      const params = new URLSearchParams({
        database,
        collection,
        id: selectedDocument._id,
      })

      const response = await fetch(`/api/crud?${params}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        alert("Document updated successfully")
        setIsEditModalOpen(false)
        setSelectedDocument(null)
        setEditDocumentData("")
        fetchDocuments(currentPage, searchTerm)
      } else {
        alert(result.message || "Failed to update document")
      }
    } catch (error) {
      alert("Invalid JSON format")
    }
  }

  const deleteDocument = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return

    try {
      const params = new URLSearchParams({ database, collection, id })

      const response = await fetch(`/api/crud?${params}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        alert("Document deleted successfully")
        fetchDocuments(currentPage, searchTerm)
      } else {
        alert(result.message || "Failed to delete document")
      }
    } catch (error) {
      alert("Failed to delete document")
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchDocuments(1, searchTerm)
  }

  const openEditModal = (document: Document) => {
    setSelectedDocument(document)
    setEditDocumentData(JSON.stringify(document, null, 2))
    setIsEditModalOpen(true)
  }

  const openViewModal = (document: Document) => {
    setSelectedDocument(document)
    setIsViewModalOpen(true)
  }

  useEffect(() => {
    fetchDocuments()
  }, [database, collection])

  const getDisplayValue = (obj: any, path: string) => {
    return path.split(".").reduce((current, key) => current?.[key], obj) || "N/A"
  }

  const renderTableHeaders = () => {
    if (collection === "test_registrations") {
      return (
        <tr>
          <th className="px-4 py-2 text-left">ID</th>
          <th className="px-4 py-2 text-left">Owner Name</th>
          <th className="px-4 py-2 text-left">NIC</th>
          <th className="px-4 py-2 text-left">Shop Name</th>
          <th className="px-4 py-2 text-left">Golden Pass</th>
          <th className="px-4 py-2 text-left">Classification</th>
          <th className="px-4 py-2 text-left">Actions</th>
        </tr>
      )
    } else if (collection.includes("EventDaySubmission") || collection.includes("MP1")) {
      return (
        <tr>
          <th className="px-4 py-2 text-left">ID</th>
          <th className="px-4 py-2 text-left">Owner Name</th>
          <th className="px-4 py-2 text-left">NIC</th>
          <th className="px-4 py-2 text-left">Shop Name</th>
          <th className="px-4 py-2 text-left">Golden Pass</th>
          <th className="px-4 py-2 text-left">Classification</th>
          <th className="px-4 py-2 text-left">Created At</th>
          <th className="px-4 py-2 text-left">Actions</th>
        </tr>
      )
    } else if (collection === "processed-images") {
      return (
        <tr>
          <th className="px-4 py-2 text-left">ID</th>
          <th className="px-4 py-2 text-left">NIC</th>
          <th className="px-4 py-2 text-left">Image URL</th>
          <th className="px-4 py-2 text-left">Processed At</th>
          <th className="px-4 py-2 text-left">Actions</th>
        </tr>
      )
    } else {
      return (
        <tr>
          <th className="px-4 py-2 text-left">ID</th>
          <th className="px-4 py-2 text-left">Data</th>
          <th className="px-4 py-2 text-left">Actions</th>
        </tr>
      )
    }
  }

  const renderTableRow = (doc: Document) => {
    if (collection === "test_registrations") {
      return (
        <tr key={doc._id} className="border-b hover:bg-gray-50">
          <td className="px-4 py-2 text-sm font-mono">{doc._id.toString().substring(0, 8)}...</td>
          <td className="px-4 py-2">{getDisplayValue(doc, "dealerInfo.ownerName")}</td>
          <td className="px-4 py-2">{getDisplayValue(doc, "dealerInfo.ownerNIC")}</td>
          <td className="px-4 py-2">{getDisplayValue(doc, "dealerInfo.shopName")}</td>
          <td className="px-4 py-2">
            <Badge variant="outline">{getDisplayValue(doc, "goldenPass")}</Badge>
          </td>
          <td className="px-4 py-2">{getDisplayValue(doc, "dealerInfo.classification")}</td>
          <td className="px-4 py-2">
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => openViewModal(doc)}>
                <Eye className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => openEditModal(doc)}>
                <Edit className="h-3 w-3" />
              </Button>
              <Button variant="destructive" size="sm" onClick={() => deleteDocument(doc._id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </td>
        </tr>
      )
    } else if (collection.includes("EventDaySubmission") || collection.includes("MP1")) {
      return (
        <tr key={doc._id} className="border-b hover:bg-gray-50">
          <td className="px-4 py-2 text-sm font-mono">{doc._id.toString().substring(0, 8)}...</td>
          <td className="px-4 py-2">{getDisplayValue(doc, "eventuserdata.ownerName")}</td>
          <td className="px-4 py-2">{getDisplayValue(doc, "eventuserdata.ownerNIC")}</td>
          <td className="px-4 py-2">{getDisplayValue(doc, "eventuserdata.shopName")}</td>
          <td className="px-4 py-2">
            <Badge variant="outline">{getDisplayValue(doc, "eventuserdata.goldenPassNumber")}</Badge>
          </td>
          <td className="px-4 py-2">{getDisplayValue(doc, "eventuserdata.classification")}</td>
          <td className="px-4 py-2 text-sm">{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "N/A"}</td>
          <td className="px-4 py-2">
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => openViewModal(doc)}>
                <Eye className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => openEditModal(doc)}>
                <Edit className="h-3 w-3" />
              </Button>
              <Button variant="destructive" size="sm" onClick={() => deleteDocument(doc._id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </td>
        </tr>
      )
    } else if (collection === "processed-images") {
      return (
        <tr key={doc._id} className="border-b hover:bg-gray-50">
          <td className="px-4 py-2 text-sm font-mono">{doc._id.toString().substring(0, 8)}...</td>
          <td className="px-4 py-2">{getDisplayValue(doc, "nic")}</td>
          <td className="px-4 py-2">
            {getDisplayValue(doc, "imageUrl") ? (
              <Badge variant="default">Available</Badge>
            ) : (
              <Badge variant="secondary">N/A</Badge>
            )}
          </td>
          <td className="px-4 py-2 text-sm">{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "N/A"}</td>
          <td className="px-4 py-2">
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => openViewModal(doc)}>
                <Eye className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => openEditModal(doc)}>
                <Edit className="h-3 w-3" />
              </Button>
              <Button variant="destructive" size="sm" onClick={() => deleteDocument(doc._id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </td>
        </tr>
      )
    } else {
      // Generic fallback for unknown collections
      const keys = Object.keys(doc).filter((key) => key !== "_id")
      const preview = keys
        .slice(0, 2)
        .map((key) => `${key}: ${String(doc[key]).substring(0, 20)}`)
        .join(", ")

      return (
        <tr key={doc._id} className="border-b hover:bg-gray-50">
          <td className="px-4 py-2 text-sm font-mono">{doc._id.toString().substring(0, 8)}...</td>
          <td className="px-4 py-2">{preview}...</td>
          <td className="px-4 py-2">
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => openViewModal(doc)}>
                <Eye className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => openEditModal(doc)}>
                <Edit className="h-3 w-3" />
              </Button>
              <Button variant="destructive" size="sm" onClick={() => deleteDocument(doc._id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </td>
        </tr>
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <div className="flex gap-2">
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Document</DialogTitle>
                  <DialogDescription>Add a new document to {collection}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newDocument">Document Data (JSON)</Label>
                    <Textarea
                      id="newDocument"
                      placeholder='{"field": "value"}'
                      value={newDocumentData}
                      onChange={(e) => setNewDocumentData(e.target.value)}
                      rows={10}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createDocument}>Create Document</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={() => fetchDocuments(currentPage, searchTerm)}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          {description} - Total: {totalRecords.toLocaleString()} records
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <Input
            placeholder="Search by name, NIC, shop name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Data Table */}
        <div className="border rounded-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2">Loading...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No documents found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">{renderTableHeaders()}</thead>
                <tbody>{documents.map((doc) => renderTableRow(doc))}</tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, totalRecords)} of{" "}
              {totalRecords.toLocaleString()} records (Page {currentPage} of {totalPages})
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => fetchDocuments(currentPage - 1, searchTerm)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => fetchDocuments(currentPage + 1, searchTerm)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Document</DialogTitle>
              <DialogDescription>Modify the document data</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editDocument">Document Data (JSON)</Label>
                <Textarea
                  id="editDocument"
                  value={editDocumentData}
                  onChange={(e) => setEditDocumentData(e.target.value)}
                  rows={20}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={updateDocument}>Update Document</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>View Document</DialogTitle>
              <DialogDescription>Document details (Read-only)</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto font-mono">
                {selectedDocument ? JSON.stringify(selectedDocument, null, 2) : ""}
              </pre>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
