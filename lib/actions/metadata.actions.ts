// lib/actions/metadata.actions.ts

"use server"

import { createSessionClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { Query } from "node-appwrite";

export const getAllMetadata = async (
  limit = 5,
  cursor?: string,
  direction: "next" | "previous" = "next"
) => {
  try {
    const { databases } = await createSessionClient();
    const queries = [Query.limit(limit), Query.isNull("files")];

    if (cursor) {
      const cursorQuery =
        direction === "next"
          ? Query.cursorAfter(cursor)
          : Query.cursorBefore(cursor);
      queries.push(cursorQuery);
    }

    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.fileSummaryCollectionId,
      queries
    );

    return {
      documents: response.documents,
      nextCursor: response.documents.length > 0 ? response.documents[response.documents.length - 1].$id : null,
      prevCursor: response.documents.length > 0 ? response.documents[0].$id : null
    };
  } catch (error) {
    console.error("Error fetching metadata:", error);
    return { documents: [], nextCursor: null, prevCursor: null };
  }
};
