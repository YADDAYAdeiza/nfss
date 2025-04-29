export const appwriteConfig = {
    endpointURL:process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
    projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT!,
    databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
    usersCollectionId: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION!,
    companiesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_COMPANIES_COLLECTION!,
    companiesAddressCollectionId:process.env.NEXT_PUBLIC_APPWRITE_COMPANIESADDRESS_COLLECTION!,
    filesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_FILES_COLLECTION!,
    fileSummaryCollectionId: process.env.NEXT_PUBLIC_APPWRITE_FILE_SUMMARY_COLLECTION!,
    bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET!,
    secretKey: process.env.NEXT_APPWRITE_KEY!
}