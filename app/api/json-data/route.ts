import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb-client"
import { ObjectId } from "mongodb"

const JSON_DATA_DB = "json_data_management"
const JSON_DATA_COLLECTION = "uploaded_data"

// Helper function to get collection
async function getCollection() {
  const client = await clientPromise
  const db = client.db(JSON_DATA_DB)
  return db.collection(JSON_DATA_COLLECTION)
}

// Helper function to flatten nested records if they exist
function flattenRecords(documents: any[]): any[] {
  const flattened: any[] = []
  
  documents.forEach(doc => {
    // If the document contains an array of records, flatten them
    if (doc && typeof doc === 'object') {
      // Check if this is a document containing an array of records
      const keys = Object.keys(doc)
      const arrayKeys = keys.filter(key => Array.isArray(doc[key]))
      
      if (arrayKeys.length === 1 && doc[arrayKeys[0]].length > 0) {
        // This document contains an array of records
        doc[arrayKeys[0]].forEach((record: any, index: number) => {
          flattened.push({
            _id: `${doc._id}_${index}`, // Composite ID for display
            originalDocId: doc._id, // Keep track of original document ID
            recordIndex: index, // Keep track of record index
            ...record,
            uploadedAt: doc.uploadedAt || new Date(),
            updatedAt: doc.updatedAt || new Date()
          })
        })
      } else {
        // This is a regular single record
        flattened.push({
          ...doc,
          originalDocId: doc._id, // For consistency
          recordIndex: null
        })
      }
    }
  })
  
  return flattened
}

// GET - Read operations
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get("id")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "20")
    const search = url.searchParams.get("search")
    const format = url.searchParams.get("format")
    const debug = url.searchParams.get("debug") === "true"

    const collection = await getCollection()

    // Get single document by ID
    if (id) {
      // Check if it's a composite ID (flattened record)
      if (id.includes('_') && id.split('_').length >= 2) {
        const parts = id.split('_')
        const originalId = parts.slice(0, -1).join('_')
        const recordIndex = parseInt(parts[parts.length - 1])
        
        try {
          const document = await collection.findOne({ _id: new ObjectId(originalId) })
          if (document) {
            const flattened = flattenRecords([document])
            const targetRecord = flattened.find(r => r._id === id)
            return NextResponse.json({ success: true, data: targetRecord })
          }
        } catch (error) {
          // If ObjectId is invalid, return not found
          return NextResponse.json({ success: false, message: "Record not found" }, { status: 404 })
        }
      } else {
        // Regular single document lookup
        try {
          const document = await collection.findOne({ _id: new ObjectId(id) })
          return NextResponse.json({ success: true, data: document })
        } catch (error) {
          return NextResponse.json({ success: false, message: "Record not found" }, { status: 404 })
        }
      }
    }

    // Get raw documents first
    const rawDocuments = await collection.find({}).limit(100).toArray()
    
    if (debug) {
      return NextResponse.json({
        success: true,
        debug: true,
        rawDocuments,
        documentCount: rawDocuments.length,
        firstDocumentKeys: rawDocuments.length > 0 ? Object.keys(rawDocuments[0]) : [],
        firstDocumentStructure: rawDocuments.length > 0 ? rawDocuments[0] : null
      })
    }

    // Flatten records if needed
    const allRecords = flattenRecords(rawDocuments)
    
    // Build search query for flattened records
    let filteredRecords = allRecords
    if (search) {
      const searchLower = search.toLowerCase()
      filteredRecords = allRecords.filter(record => {
        return Object.values(record).some(value => 
          String(value).toLowerCase().includes(searchLower)
        )
      })
    }

    if (format === "all") {
      // Get all data for export
      return NextResponse.json({
        success: true,
        data: filteredRecords,
        total: filteredRecords.length,
      })
    }

    // Apply pagination
    const skip = (page - 1) * limit
    const paginatedRecords = filteredRecords.slice(skip, skip + limit)
    const total = filteredRecords.length

    return NextResponse.json({
      success: true,
      data: paginatedRecords,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      debug: {
        rawDocumentCount: rawDocuments.length,
        flattenedRecordCount: allRecords.length,
        filteredRecordCount: filteredRecords.length,
        paginatedRecordCount: paginatedRecords.length
      }
    })
  } catch (error) {
    console.error("Error in GET operation:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch data", 
        error: (error as Error).message,
        stack: (error as Error).stack 
      },
      { status: 500 }
    )
  }
}

// POST - Create operations
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const collection = await getCollection()

    console.log("Received data for upload:", data)

    // Check if it's bulk upload (array) or single record
    if (Array.isArray(data)) {
      // Bulk upload - store each record individually
      const documentsToInsert = data.map((item) => ({
        ...item,
        uploadedAt: new Date(),
        updatedAt: new Date(),
      }))

      const result = await collection.insertMany(documentsToInsert)

      return NextResponse.json({
        success: true,
        message: `${result.insertedCount} records uploaded successfully`,
        data: {
          insertedCount: result.insertedCount,
          insertedIds: result.insertedIds,
        },
      })
    } else {
      // Single record
      const documentToInsert = {
        ...data,
        uploadedAt: new Date(),
        updatedAt: new Date(),
      }

      const result = await collection.insertOne(documentToInsert)

      return NextResponse.json({
        success: true,
        message: "Record created successfully",
        data: { _id: result.insertedId, ...documentToInsert },
      })
    }
  } catch (error) {
    console.error("Error in POST operation:", error)
    return NextResponse.json(
      { success: false, message: "Failed to create record(s)", error: (error as Error).message },
      { status: 500 },
    )
  }
}

// PUT - Update operations  
export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, message: "ID is required for update" }, { status: 400 })
    }

    const data = await req.json()
    const collection = await getCollection()

    // Check if it's a composite ID (flattened record)
    if (id.includes('_') && id.split('_').length >= 2) {
      const parts = id.split('_')
      const originalId = parts.slice(0, -1).join('_')
      const recordIndex = parseInt(parts[parts.length - 1])
      
      if (isNaN(recordIndex)) {
        return NextResponse.json({ success: false, message: "Invalid record ID format" }, { status: 400 })
      }

      try {
        // Find the original document
        const originalDoc = await collection.findOne({ _id: new ObjectId(originalId) })
        
        if (!originalDoc) {
          return NextResponse.json({ success: false, message: "Original document not found" }, { status: 404 })
        }

        // Find the array key in the document
        const keys = Object.keys(originalDoc)
        const arrayKey = keys.find(key => Array.isArray(originalDoc[key]))
        
        if (arrayKey && originalDoc[arrayKey][recordIndex] !== undefined) {
          // Update the specific record in the array
          const updatePath = `${arrayKey}.${recordIndex}`
          const { _id, originalDocId, recordIndex: _, uploadedAt, ...updateData } = data
          
          const result = await collection.updateOne(
            { _id: new ObjectId(originalId) },
            { 
              $set: { 
                [updatePath]: updateData,
                updatedAt: new Date()
              }
            }
          )

          if (result.matchedCount === 0) {
            return NextResponse.json({ success: false, message: "Record not found" }, { status: 404 })
          }

          return NextResponse.json({
            success: true,
            message: "Record updated successfully",
            data: result,
          })
        } else {
          return NextResponse.json({ success: false, message: "Record not found in array" }, { status: 404 })
        }
      } catch (error) {
        console.error("Error updating flattened record:", error)
        return NextResponse.json({ success: false, message: "Invalid document ID" }, { status: 400 })
      }
    } else {
      // Regular single document update
      try {
        const { _id, uploadedAt, originalDocId, recordIndex, ...updateData } = data
        const documentToUpdate = {
          ...updateData,
          updatedAt: new Date(),
        }

        const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: documentToUpdate })

        if (result.matchedCount === 0) {
          return NextResponse.json({ success: false, message: "Record not found" }, { status: 404 })
        }

        return NextResponse.json({
          success: true,
          message: "Record updated successfully",
          data: result,
        })
      } catch (error) {
        console.error("Error updating single record:", error)
        return NextResponse.json({ success: false, message: "Invalid document ID" }, { status: 400 })
      }
    }
  } catch (error) {
    console.error("Error in PUT operation:", error)
    return NextResponse.json(
      { success: false, message: "Failed to update record", error: (error as Error).message },
      { status: 500 },
    )
  }
}

// DELETE - Delete operations
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get("id")
    const deleteAll = url.searchParams.get("deleteAll") === "true"

    const collection = await getCollection()

    if (deleteAll) {
      // Delete all records
      const result = await collection.deleteMany({})
      return NextResponse.json({
        success: true,
        message: `${result.deletedCount} records deleted successfully`,
        data: result,
      })
    }

    if (!id) {
      return NextResponse.json({ success: false, message: "ID is required for delete" }, { status: 400 })
    }

    // Check if it's a composite ID (flattened record)
    if (id.includes('_') && id.split('_').length >= 2) {
      const parts = id.split('_')
      const originalId = parts.slice(0, -1).join('_')
      const recordIndex = parseInt(parts[parts.length - 1])
      
      if (isNaN(recordIndex)) {
        return NextResponse.json({ success: false, message: "Invalid record ID format" }, { status: 400 })
      }

      try {
        // Find the original document
        const originalDoc = await collection.findOne({ _id: new ObjectId(originalId) })
        
        if (!originalDoc) {
          return NextResponse.json({ success: false, message: "Original document not found" }, { status: 404 })
        }

        // Find the array key in the document
        const keys = Object.keys(originalDoc)
        const arrayKey = keys.find(key => Array.isArray(originalDoc[key]))
        
        if (arrayKey && originalDoc[arrayKey][recordIndex] !== undefined) {
          // Remove the specific record from the array
          const updatedArray = [...originalDoc[arrayKey]]
          updatedArray.splice(recordIndex, 1)
          
          if (updatedArray.length === 0) {
            // If array becomes empty, delete the entire document
            const result = await collection.deleteOne({ _id: new ObjectId(originalId) })
            return NextResponse.json({
              success: true,
              message: "Record deleted successfully (document removed as array became empty)",
              data: result,
            })
          } else {
            // Update the document with the modified array
            const result = await collection.updateOne(
              { _id: new ObjectId(originalId) },
              { 
                $set: { 
                  [arrayKey]: updatedArray,
                  updatedAt: new Date()
                }
              }
            )

            if (result.matchedCount === 0) {
              return NextResponse.json({ success: false, message: "Record not found" }, { status: 404 })
            }

            return NextResponse.json({
              success: true,
              message: "Record deleted successfully",
              data: result,
            })
          }
        } else {
          return NextResponse.json({ success: false, message: "Record not found in array" }, { status: 404 })
        }
      } catch (error) {
        console.error("Error deleting flattened record:", error)
        return NextResponse.json({ success: false, message: "Invalid document ID" }, { status: 400 })
      }
    } else {
      // Regular single document delete
      try {
        const result = await collection.deleteOne({ _id: new ObjectId(id) })

        if (result.deletedCount === 0) {
          return NextResponse.json({ success: false, message: "Record not found" }, { status: 404 })
        }

        return NextResponse.json({
          success: true,
          message: "Record deleted successfully",
          data: result,
        })
      } catch (error) {
        console.error("Error deleting single record:", error)
        return NextResponse.json({ success: false, message: "Invalid document ID" }, { status: 400 })
      }
    }
  } catch (error) {
    console.error("Error in DELETE operation:", error)
    return NextResponse.json(
      { success: false, message: "Failed to delete record", error: (error as Error).message },
      { status: 500 },
    )
  }
}