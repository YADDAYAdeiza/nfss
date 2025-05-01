"use server"

import { createSessionClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config"
import { Query } from "node-appwrite"

export const getAllMetadata = async () => { 
    console.log('Are we in getAllMetadata?');
    try { 
        const { databases } = await createSessionClient();
        const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.fileSummaryCollectionId, 
         [
            // Query.equal("files", null), // Filter: files == "n/a"
            // Query.equal("InspectionType", "Routine"), // Filter: files == "n/a"
            Query.limit(5),          // Limit: return up to 50 documents
            Query.isNull("files")
        ] )
        console.log('This is getAllMetadata response: ', response)
        return response.documents
    } catch (error) {
        console.error("Error fetching metadata:", error)
        return [] 
    } 
}