"use server"

import { createSessionClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config"
import { Query } from "node-appwrite"

export const getAllMetadata = async () => { 
    try { const { databases } = await createSessionClient();
    const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.fileSummaryCollectionId, 
        [Query.limit(100)] )
        return response.documents
    } catch (error) {
        console.error("Error fetching metadata:", error)
        return [] 
    } 
}