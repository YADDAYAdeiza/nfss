'use server'

import { createAdminClient } from "../appwrite";
import {InputFile} from "node-appwrite/file";
import { appwriteConfig } from "../appwrite/config";
import { ID, Models, Query } from "node-appwrite";
import { constructFileUrl, getFileType, parseStringify } from "../utils";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./user.actions";

const handleError = (error:unknown, message:string)=>{
    console.log(error, message);
    throw error;
}


export const uploadFile = async({file, ownerId, accountId, path}:UploadFileProps)=>{
    
    const {storage, databases} = await createAdminClient();

    try {
        console.log('Trying...to...')
        console.log(file)
        // const inputFile = InputFile.fromBuffer(file, file.name);
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const inputFile = InputFile.fromBuffer(buffer, file.name);
        console.log(inputFile)
        const bucketFile = await storage.createFile(
            appwriteConfig.bucketId,
            ID.unique(),
            inputFile,
        );

        const fileDocument={
            type:getFileType(bucketFile.name).type,
            name:bucketFile.name,
            url:constructFileUrl(bucketFile.$id),
            extension:getFileType(bucketFile.name).extension,
            size:bucketFile.sizeOriginal,
            owner:ownerId,
            accountId,
            users:[],
            bucketFileId: bucketFile.$id,
        };

        const newFile = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            ID.unique(),
            fileDocument,
        )
        .catch(async (error:unknown)=>{
            await storage.deleteFile(appwriteConfig.bucketId, bucketFile.$id);
            handleError(error, "Failed to create file document");
        })
        revalidatePath(path);
        return parseStringify(newFile);
    }catch (error){
        console.log('Failed...')
        handleError(error, "Failed to upload file")
    }

}

const createQueries = (currentUser:Models.Document, types:string[], searchText:string, sort:string, limit?:number)=>{
    const queries = [
        Query.or([
            Query.equal('owner', [currentUser.$id]),
            Query.contains('users', [currentUser.email]),
        ])
    ]
    if (types.length > 0) queries.push(Query.equal('type', types ));
    if (searchText) queries.push(Query.contains('name', searchText ));
    if (limit) queries.push(Query.limit(limit));

    if(sort){
        const [sortBy, orderBy] = sort.split('-')
    
        queries.push(orderBy === 'asc' ? Query.orderAsc(sortBy) : Query.orderDesc(sortBy))

    }
    //TODO: Search, sort, limits
    return queries;
}

export const getFiles =async({types = [], searchText = '', sort = '$createdAt-desc', limit}:GetFilesProps)=>{
    const {databases} = await createAdminClient();
    
    try {
        console.log('Getting...')
        const currentUser = await getCurrentUser();
        console.log(currentUser)
        if(!currentUser) throw new Error("User not found");

        const queries = createQueries(currentUser, types, searchText, sort, limit);
        console.log(queries)
        const files = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            queries,
        );

        console.log({files})

        return parseStringify(files)
    }catch (error){
        console.log('What')
    }
}

export const renameFile = async ({
    fileId,
    name,
    extension,
    path
}:RenameFileProps) => {
    const { databases } = await createAdminClient();
    
    try {
        console.log('Renaming...')
        const newName = `${name}.${extension}`;
        const updatedFile = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId,
            {name:newName,},)
            revalidatePath(path)
            return parseStringify(updatedFile);
    }catch (error) {
        handleError(error, "Failed to rename file");
    }
}

export const updateFileUsers = async ({
    fileId,
    emails,
    path
}:UpdateFileUsersProps) => {
    const { databases } = await createAdminClient();

    try {
        console.log('Inside here')
        console.log(emails);
        const updatedFile = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId,
            {users:emails,},);
            revalidatePath(path)
            return parseStringify(updatedFile);
    }catch (error) {
        handleError(error, "Failed to rename file");
    }
}

export const deleteFile = async ({
    fileId,
    bucketFileId,
    path
}:DeleteFileProps) => {
    const { databases, storage } = await createAdminClient();

    try {
        const deletedFile = await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId,);

            if(deletedFile){
                await storage.deleteFile(appwriteConfig.bucketId, bucketFileId);
            }
            revalidatePath(path)
            return parseStringify({status:"success"});
    }catch (error) {
        handleError(error, "Failed to rename file");
    }
}
interface MetadataProps {
    fileId:string;
    path:string
}

export const addMetaData = async ({
    fileId,
    path
}:MetadataProps )=>{
    console.log('Adding metadata...')
}


// export const createMetada = async({companyName, companyEmail}:{companyName:string; companyEmail:string})=>{
//     const { databases } = await createAdminClient();

//     await databases.createDocument(
//         appwriteConfig.databaseId,
//         appwriteConfig.usersCollectionId,
//         ID.unique(),
//         {
//             fullName,
//             email,
//             avatar:avatarPlaceholderUrl,
//             accountId,
//         },

//     )

//     const company = await databases.createDocument(
//     "database_id",
//     "Companys",
//     "unique()",
//     {
//         name: "TechCorp",
//         industry: "Software",
//         location: "New York",
//         website: "https://techcorp.com"
//     }
// );

//     // const existingUser =  await getUserByEmail(email)
//     // const accountId = await sendEmailOTP({ email })

//     // if (!accountId) throw new Error("Failed to send an OTP")

//     //     if(!existingUser){
//     //         const { databases } = await createAdminClient();

//     //         await databases.createDocument(
//     //             appwriteConfig.databaseId,
//     //             appwriteConfig.usersCollectionId,
//     //             ID.unique(),
//     //             {
//     //                 fullName,
//     //                 email,
//     //                 avatar:avatarPlaceholderUrl,
//     //                 accountId,
//     //             },

//     //         )
//     //     }
//     let accountId = 12;
//     console.log('creating metadata', companyName);


//         // return parseStringify({accountId})
        
// }

export const updateMetadata = async ({companyEmail}:{companyEmail:string})=>{
    console.log('Updating metadata');
}
//we need to consider fileId and see if it should be used in updating the product Line;
export const updateFileMetadata = async ({
    fileId,
    companyName,
        companyAddress,
        state,
        companyEmail,
        phoneNo,
        latitude,
        longitude,
        inspectionType,
        inspectedProductLine,
        gmpStatus,
        inspectors,
        path
}:{
    fileId:string;
    companyName:string;
        companyAddress:string;
        state:string;
        companyEmail:string;
        phoneNo:string;
        latitude:unknown;
        longitude:unknown;
        inspectionType:string;
        inspectedProductLine:string;
        gmpStatus:string;
        inspectors:string;
        path:string;
}) => {
    const { databases } = await createAdminClient();

    try {
        console.log('Inside here')

    async function createCompany(){
        //if the company exists in metadata
        const document = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.companiesCollectionId,
            [Query.equal("CompanyName", companyName)]);
            
            console.log('This is document: ', document);
            let updatedFileIds:string[] = [];

         if (document.total){ //update the company fileIds with the storage fileId
             //run update operation
             updatedFileIds = document.documents[0].FileIds;
             updatedFileIds.push(fileId); //if this document has not been linked, add it to the company; a company can have many inspection reports
             console.log('This is updatedFileIds', updatedFileIds);
             const companiesDocument={
                CompanyName:companyName,
                FileIds:updatedFileIds
            };
            const response = await databases.updateDocument(
                appwriteConfig.databaseId,
                 appwriteConfig.companiesCollectionId,
                document.documents[0].$id, 
                companiesDocument);

                console.log('This is response,', response)

         }   else{ //create the company
           console.log('About to create document');
           updatedFileIds.push(fileId);
           const companiesDocument={
                CompanyName:companyName,
                FileIds:updatedFileIds
            };

            const newCompany = await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.companiesCollectionId,
                ID.unique(),
                companiesDocument,
            ).catch(async (error:unknown)=>{
                handleError(error, "Failed to create Companies document");
            })
            return newCompany.$id;
         }
            // if (document.documents[0].FileIds.contains(fileId)) return; //if this document has been linked to this company, return

    }

    async function createCompanyAddress(companyId:string) { 
        const companiesAddressDocument={
            Location:companyAddress,
            State:state,
            Email:companyEmail,
            PhoneNo:phoneNo,
            Lat:latitude,
            Lng:longitude,
            CompanyId:companyId
        };
        
        const newCompanyAddress = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.companiesAddressCollectionId,
            ID.unique(),
            companiesAddressDocument,
        )
        .catch(async (error:unknown)=>{
            handleError(error, "Failed to create CompaniesAddress document");
        })
        console.log(newCompanyAddress);
    }

        (async () => {
            const companyId = await createCompany(); // Create company and get ID
            await createCompanyAddress(companyId); // Link Address to Company
            //         return parseStringify(updatedFile);
        })();
        
    } catch(error:unknown){
        handleError(error, "Failed to create file document");
    }finally{
        revalidatePath(path)

    }











    //     const updatedFile = await databases.updateDocument(
    //         appwriteConfig.databaseId,
    //         appwriteConfig.companiesCollection,
    //         fileId,
    //         {users:emails,},);
    //         revalidatePath(path)
    //         return parseStringify(updatedFile);
    // }catch (error) {
    //     handleError(error, "Failed to rename file");
    // }
}