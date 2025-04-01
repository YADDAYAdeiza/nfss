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
        async function createCompany(){
            console.log('Working...')
            // if the company exists in metadata
            
            const document = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.companiesCollectionId,
                [Query.equal("CompanyName", companyName)]);
                let cId:string;
                if (document.total > 0){ //if company exists
                    // cId = document.documents[0].FileIds;
                    updateCompany(fileId,document.documents[0]);
    // async function updateCompanyAddress(fileId:string, oldCompanyAdd:any){

                    cId = document.documents[0].$id;
                    console.log('This is cId: ',cId);
                    console.log('This is companyAddress: ',companyAddress);
                    checkIfAddressExists(cId, companyAddress, fileId).then(exists => { // fileId is passed in case address exists, still to update it
                        if (exists) {
                            console.log("Address already exists, do not insert again.");
                            //update existing address with fileStorage id;
                            console.log('This is exists: ');
                            console.log(exists);
                            updateCompanyAddress(fileId, exists.documents[0]);
                            // return 0;
                        } else {
                            console.log("No entry found, you can add this address.");
                            createCompanyAddress(cId, fileId);
                            
                        }
                    });
                }else { //create new company
                    console.log('Company Does not Exists...');
                    createNewCompany().then(id=>{
                        if (id){
                            createCompanyAddress(id, fileId)
                        }
                    })
                }
            }
                
            async function checkIfAddressExists(companyId:string, address:string, fileId:string) {
                try {
                    const response = await databases.listDocuments(
                        appwriteConfig.databaseId,
                        appwriteConfig.companiesAddressCollectionId,
                        [
                            Query.equal('CompanyId', companyId),
                            Query.equal('Location', address) // Assuming address field exists
                    ]);
                    console.log('Company address exists, here it is: ')
                    console.log(response)

                    //update address with storage fileIds -inspection file reports
                    // response.documents[0]?.FileIds.push(fileId)
                    // return response; // Returns true if entry exists, false otherwise
                    return response.total > 0 && response; // Returns entire response if entry exists, false otherwise
                } catch (error) {
                    console.error(error);
                    return false;
                }
            }

            async function createNewCompany(){
                console.log('Creating new company ...');
                let updatedFileIds:string[] = [];
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
            

    async function createCompanyAddress(companyId:string, fileId:string) { 
        const companiesAddressDocument={
            Location:companyAddress,
            State:state,
            Email:companyEmail,
            PhoneNo:phoneNo,
            Lat:latitude,
            Lng:longitude,
            CompanyId:companyId,
            FileIds:[]
        };
        
        const newCompanyAddress = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.companiesAddressCollectionId,
            ID.unique(),
            companiesAddressDocument,
        )
        .catch(async (error:unknown)=>{
            handleError(error, "Failed to create CompaniesAddress document");
        }).then( async (newCompanyAdd)=>{
            console.log('This is the new address')
            console.log(newCompanyAdd)

            updateCompanyAddress(fileId, newCompanyAdd);
            
        })
    }

        (async () => {
            const companyId = await createCompany(); // Create company and get ID
                // await createCompanyAddress(companyId); // Link Address to Company
            // }
            //         return parseStringify(updatedFile);
        })();
        
    } catch(error:unknown){
        handleError(error, "Failed to create file document");
    }finally{
        revalidatePath(path)

    }

    async function updateCompanyAddress(fileId:string, oldCompanyAdd:any){
                if (oldCompanyAdd.FileIds.includes(fileId)){
                    //do nothing
                    console.log('Already contains file')
                } else { //push the fileId in storage to the address database

                    oldCompanyAdd.FileIds.push(fileId);
                    let updatedFileIds = oldCompanyAdd.FileIds;
                    
                    const updatedFile = await databases.updateDocument(
                        appwriteConfig.databaseId,
                        appwriteConfig.companiesAddressCollectionId,
                        oldCompanyAdd.$id,
                        {FileIds:updatedFileIds})
                    }
    }

    async function updateCompany(fileId:string, oldCompany:any){
        if (oldCompany.FileIds.includes(fileId)){
                    //do nothing
                    console.log('Already contains file')
                } else { //push the fileId in storage to the address database

                    // oldCompany.FileIds.push(fileId);
                    let updatedFileIds = [ ...oldCompany.FileIds, fileId];
                    
                    const updatedFile = await databases.updateDocument(
                        appwriteConfig.databaseId,
                        appwriteConfig.companiesCollectionId,
                        oldCompany.$id,
                        {FileIds:updatedFileIds})
                    }
    }

}