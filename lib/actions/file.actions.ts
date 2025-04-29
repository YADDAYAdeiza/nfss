'use server'

import { createAdminClient } from "../appwrite";
import {InputFile} from "node-appwrite/file";
import { appwriteConfig } from "../appwrite/config";
import { Account, Client, ID, Models, Query } from "node-appwrite";
import { constructFileUrl, getFileType, parseStringify } from "../utils";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./user.actions";

const client = new Client()
        .setEndpoint(appwriteConfig.endpointURL)
        .setProject(appwriteConfig.projectId)
        .setKey(appwriteConfig.secretKey)

const account = new Account(client);

const handleError = (error:unknown, message:string)=>{
    console.log(error, message);
    throw error;
}


// export const uploadFile = async({file, ownerId, accountId, path}:UploadFileProps)=>{
    
//     const {storage, databases} = await createAdminClient();

//     try {
//         console.log('Trying...to...')
//         console.log(file)
//         // const inputFile = InputFile.fromBuffer(file, file.name);
//         const arrayBuffer = await file.arrayBuffer();
//         const buffer = Buffer.from(arrayBuffer);
//         const inputFile = InputFile.fromBuffer(buffer, file.name);
//         console.log(inputFile)
//         const bucketFile = await storage.createFile(
//             appwriteConfig.bucketId,
//             ID.unique(),
//             inputFile,
//         );

//         const fileDocument={
//             type:getFileType(bucketFile.name).type,
//             name:bucketFile.name,
//             url:constructFileUrl(bucketFile.$id),
//             extension:getFileType(bucketFile.name).extension,
//             size:bucketFile.sizeOriginal,
//             owner:ownerId,
//             accountId,
//             users:[],
//             bucketFileId: bucketFile.$id,
//             CompanyAddressIds:[],
//             CompanyAddress:[],
//             InspectionType:'',
//             InspectedProductLine:'',
//             GMPStatus:'',
//             Inspectors:''
//         };

//         const newFile = await databases.createDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.filesCollectionId,
//             ID.unique(),
//             fileDocument,
//         )
//         .catch(async (error:unknown)=>{
//             await storage.deleteFile(appwriteConfig.bucketId, bucketFile.$id);
//             handleError(error, "Failed to create file document");
//         })
//         revalidatePath(path);
//         return parseStringify(newFile);
//     }catch (error){
//         console.log('Failed...')
//         handleError(error, "Failed to upload file")
//     }

// }

export const uploadFile = async({file, ownerId, accountId, path, metadata}:UploadFileProps2)=>{
    console.log('This is path1:', path)
    console.log('This is accountId1:', accountId)

    // Get current user
      account.get()
      .then(response => {
        console.log('Logged in user:', response);
      })
      .catch(error => {
        console.error('Error fetching user:', error);
      });
    const {storage, databases} = await createAdminClient();

    try {
        console.log('Trying...to...')
        console.log(file)
        if (file){

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
                CompanyAddressIds:[],
                CompanyAddress:[],
                InspectionType:'',
                InspectedProductLine:'',
                GMPStatus:'',
                Inspectors:''
            };
    
            await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.filesCollectionId,
                ID.unique(),
                fileDocument,
            )
            .catch(async (error:unknown)=>{
                await storage.deleteFile(appwriteConfig.bucketId, bucketFile.$id);
                handleError(error, "Failed to create file document");
            }).then (newFile=>{
                console.log('This is metadata: ', metadata);
                console.log('This is new File Id', newFile.$id);
                updateFileMetadata2({...metadata, fileId: newFile.$id, path:path,owner:ownerId, accountId:accountId});
                revalidatePath(path);
                return parseStringify(newFile);
                
            })
        } else{
            console.log('Caling upateFileMetadata3')
           return updateFileMetadata3({...metadata, fileId: 'ToBeLinked', path:path, owner:ownerId, accountId});
        }
        
        
        //call update the other fields?
    }catch (error){
        console.log('Failed...')
        handleError(error, "Failed to upload file")
    }

}

// file.actions.ts

// export const uploadMetadata = async ({
//   metadata,
//   ownerId,
//   accountId,
//   path,
// }: {
//   metadata: any;
//   ownerId: string;
//   accountId: string;
//   path: string;
// }) => {
//   try {
//     const {storage, databases} = await createAdminClient();
//     console.log('This is metadata: ', metadata);
//     const response = await databases.createDocument(
//       appwriteConfig.databaseId,
//       appwriteConfig.filesCollectionId,
//       ID.unique(),
//       {
//         ...metadata,
//         ownerId,
//         accountId,
//         uploadPath: path,
//       }
//     );

//     return { success: true, data: response };
//   } catch (error) {
//     console.error('Metadata upload error:', error);
//     return { success: false, error };
//   }
// };


const createQueries = (currentUser:Models.Document, types:string[], searchText:string, sort:string, limit?:number)=>{
    const queries = [
        Query.or([
            Query.equal('owner', [currentUser.$id]),
            Query.contains('users', [currentUser.email]),
        ])
    ]
    console.log('In queries')
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
        // console.log(currentUser)
        if(!currentUser) throw new Error("User not found");

        const queries = createQueries(currentUser, types, searchText, sort, limit);
        // console.log(queries)
        const files = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            queries,
        );

        console.log('Files returned: ', {files});

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
        async function getFileDocument(fileId:string){
            const fileDocument = await databases.getDocument(
                appwriteConfig.databaseId,
                appwriteConfig.filesCollectionId,
                fileId);

                return fileDocument;
        }


        async function createCompany(){
            console.log('Working...')
            // if the company exists in metadata
            console.log('This is company name: ', companyName)
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
                  return  checkIfAddressExists(cId, companyAddress, fileId).then(exists => { // fileId is passed in case address exists, still to update it
                        if (exists) {
                            console.log("Address already exists, do not insert again.");
                            //update existing address with fileStorage id;
                            console.log('This is exists: ');
                            console.log(exists);
                           return updateCompanyAddress(fileId, exists.documents[0]).then(companyAddId=>{
                            console.log('This is fileId: ', fileId);
                            if (fileId){
                                return  getFileDocument(fileId).then(fileDocument=>{
                                    return  updateFile(fileId,fileDocument,companyAddId, exists).then(fileDocument=>{
                                          console.log('This is the document...')
                                          console.log(fileDocument)
                                          return parseStringify(fileDocument);
                                          
                                      })
  
                                  })
                            }else{
                                return null;
                            }
                            });
                            //update File with CompanyAddressId
                            // return 0;
                        } else {
                            console.log("No entry found, you can add this address.");
                           return createCompanyAddress(cId, fileId);
                            //update File with CompanyAddressId
                            
                        }
                    });
                }else { //create new company
                    console.log('Company Does not Exists...');
                   return createNewCompany().then(id=>{
                        if (id){
                           return createCompanyAddress(id, fileId)
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
        
        // const newCompanyAddress = await databases.createDocument(
        return databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.companiesAddressCollectionId,
            ID.unique(),
            companiesAddressDocument,
        )
        .catch(async (error:unknown)=>{
            handleError(error, "Failed to create CompaniesAddress document");
        }).then( (newCompanyAdd)=>{
            console.log('This is the new address-now')
            console.log(newCompanyAdd)

           return updateCompanyAddress(fileId, newCompanyAdd).then(companyAddId=>{
            console.log('Thisis companyAddId ', companyAddId)
                  return getFileDocument(fileId).then(fileDocument=>{
                       return updateFile(fileId,fileDocument,companyAddId, newCompanyAdd)
                    })
            });
            
        })
    }

       return (async () => {
            const response = await createCompany(); // Create company and get ID
                // await createCompanyAddress(companyId); // Link Address to Company
            return response;
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
                    
                    console.log('Not contains file')
                    console.log('oldCompanyAdd',oldCompanyAdd)
                    oldCompanyAdd.FileIds.push(fileId);
                    let updatedFileIds = oldCompanyAdd.FileIds;
                    
                    console.log('Yup')
                    return await databases.updateDocument(
                        appwriteConfig.databaseId,
                        appwriteConfig.companiesAddressCollectionId,
                        oldCompanyAdd.$id,
                        {FileIds:updatedFileIds}).catch(async (error:unknown)=>{
                                handleError(error, "Yup 2");
                            }).then(updatedFile=>{
                            console.log('Updated File: ', updatedFile)
                            return updatedFile.$id
                        })
                
                    }

        // return oldCompanyAdd.$id
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
        
        async function updateFile(fileId:string, fileDocument:any, companyAddId:string, newCompanyAdd:any){
                    if (fileDocument.CompanyAddressIds.includes(companyAddId)){
                        //do nothing
                        console.log('Already contains file')
                        return parseStringify(fileDocument);
                    } else { //push the fileId in storage to the address database
                        console.log('This is newCompanyAdd', newCompanyAdd)
                        fileDocument.CompanyAddressIds.push(companyAddId)//company Address Id;
                        fileDocument.CompanyAddress.push(newCompanyAdd.Location)//company Address Id;
                        let updatedCoyAddIds = fileDocument.CompanyAddressIds;
                        let updatedCoyAdds = fileDocument.CompanyAddress;
                        
                        // const updatedFile = await databases.updateDocument(
                      return databases.updateDocument(
                            appwriteConfig.databaseId,
                            appwriteConfig.filesCollectionId,
                            fileId,
                            {CompanyAddressIds:updatedCoyAddIds, CompanyAddress:updatedCoyAdds})
                            .catch(async (error:unknown)=>{
                                handleError(error, "Failed to update file");
                            }).then( (updatedFile)=>{
                                console.log('This is updated file: ', updatedFile);
                                return parseStringify(updatedFile);
                            })
                            // return parseStringify(updatedFile);
                        }

        }
    }
export const updateFileMetadata2 = async ({
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
        path,
        owner:ownerId,
        accountId
}:{
    fileId:string;
    companyName:string;
        companyAddress:string;
        state:string;
        companyEmail:string;
        phoneNo:string;
        latitude:number;
        longitude:number;
        inspectionType:string;
        inspectedProductLine:string;
        gmpStatus:string;
        inspectors:string;
        path:string;
        owner:string;
        accountId:string;
}) => {
    const { databases } = await createAdminClient();
    console.log('AccountID within updateFileMetadata2:', accountId);
    try {
        console.log()
        async function getFileDocument(fileId:string){
            console.log('Inside getFileDoc');
            return databases.getDocument(
                appwriteConfig.databaseId,
                appwriteConfig.filesCollectionId,
                fileId).catch(async (error:unknown)=>{
                    console.log('Trapped here...', fileId)
                     handleError(error, "Failed to create file document");
                }).then(fileDocument=>{
                    return fileDocument;
                })

        }


        async function createCompany(){
            console.log('Working...')
            // if the company exists in metadata
            console.log('This is company name: ', companyName)
            const document = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.companiesCollectionId,
                [Query.equal("CompanyName", companyName)])
                console.log('This is documen: ', document);
                let cId:string;
                if (document.total > 0){ //if company exists
                    // cId = document.documents[0].FileIds;
                    updateCompany(fileId,document.documents[0]);
    // async function updateCompanyAddress(fileId:string, oldCompanyAdd:any){

                    cId = document.documents[0].$id;
                    // console.log('This is cId: ',cId);
                    console.log('This is companyAddress: ',companyAddress);
                  return  checkIfAddressExists(cId, companyAddress, fileId).then(exists => { // fileId is passed in case address exists, still to update it
                        if (exists) {
                            console.log("Address already exists, do not insert again2.");
                            //update existing address with fileStorage id;
                            console.log('This is exists: ');
                            console.log(exists);
                           return updateCompanyAddress(fileId, exists.documents[0]).then(companyAddId=>{
                            // if (fileId === 'ToBeLinked'){
                            //     //create a file
                            //         // return {fileId:'ToBeLinked'}; //placeholder fileDocument
                            //        return CreateFile(exists.documents[0], companyAddress, companyAddId)
                            // }else {
                                    //return proper fileDocument
                                    return  getFileDocument(fileId).then(fileDocument=>{
                                        console.log('This is the document...')
                                        console.log('This is the fileId...', fileId)
                                        // return  updateFile(fileId,fileDocument,companyAddId, exists).then(fileDocument=>{
                                        return  CreateFile(companyAddress, fileId).then(fileDocument=>{
                                            // console.log(fileDocument)
                                            return parseStringify(fileDocument);
                                            
                                        })
                                        
                                    })
                                // }
                            });
                            //update File with CompanyAddressId
                            // return 0;
                        } else {
                            console.log("No entry found, you can add this address.");
                           return createCompanyAddress(cId, fileId);
                            //update File with CompanyAddressId
                            
                        }
                    });
                }else { //create new company
                    console.log('Company Does not Exists...');
                   return createNewCompany().then(id=>{
                        if (id){
                           return createCompanyAddress(id, fileId)
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
                    // console.log(response)

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
                                    console.log('Company Created...')
                return newCompany.$id;
            }
            

    async function createCompanyAddress(companyId:string, fileId:string) { 
        console.log('Entered createCompanyAddress...')
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
        console.log(companiesAddressDocument);
        // const newCompanyAddress = await databases.createDocument(
        return databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.companiesAddressCollectionId,
            ID.unique(),
            companiesAddressDocument,
        )
        .catch(async (error:unknown)=>{
            handleError(error, "Failed to create CompaniesAddress document");
        }).then( (newCompanyAdd)=>{
            console.log('This is the new address')
            console.log(newCompanyAdd)

           return updateCompanyAddress(fileId, newCompanyAdd).then(companyAddId=>{
                console.log('This is fileId inside: ', fileId)
                  return getFileDocument(fileId).then(fileDocument=>{
                    //    return updateFile(fileId,fileDocument,companyAddId, newCompanyAdd)
                       return CreateFile(newCompanyAdd, fileId)
                    })
            });
            
        })
    }

       return (async () => {
            const response = await createCompany(); // Create company and get ID
                // await createCompanyAddress(companyId); // Link Address to Company
            return response;
        })();
        
    } catch(error:unknown){
        handleError(error, "Failed to create file document");
    }finally{
        console.log('This is path: ', path);
        revalidatePath(path)
        
    }

    async function updateCompanyAddress(fileId:string, oldCompanyAdd:any){
    oldCompanyAdd.FileIds = oldCompanyAdd.FileIds || [];

    if (oldCompanyAdd.FileIds.includes(fileId)){
        console.log('Already contains file')
    } else {
        console.log('Not contains file');
        oldCompanyAdd.FileIds.push(fileId);
        let updatedFileIds = oldCompanyAdd.FileIds;

        return await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.companiesAddressCollectionId,
            oldCompanyAdd.$id,
            { FileIds: updatedFileIds }
        )
        .catch(async (error:unknown)=>{
            handleError(error, "Yup 2");
        }).then(updatedFile => {
            console.log('Updated File: ', updatedFile);
            return updatedFile.$id;
        });
    }
}

    
    async function updateCompany(fileId:string, oldCompany:any){
        if (oldCompany.FileIds.includes(fileId)){
            //do nothing
            console.log('Already contains file')
        } else { //push the fileId in storage to the address database
            console.log('Does not contain file...')
            
            // oldCompany.FileIds.push(fileId);
            let updatedFileIds = [ ...oldCompany.FileIds, fileId];
            
            const updatedFile = await databases.updateDocument(
                appwriteConfig.databaseId,
                appwriteConfig.companiesCollectionId,
                oldCompany.$id,
                {FileIds:updatedFileIds})

                // return updatedFile;
            }
        }
        
        async function updateFile(fileId:string, fileDocument:any, companyAddId:string, newCompanyAdd:any){
            fileDocument.CompanyAddressIds = fileDocument.CompanyAddressIds || [];
            fileDocument.CompanyAddress = fileDocument.CompanyAddress || [];

            if (fileDocument.CompanyAddressIds.includes(companyAddId)){
                console.log('Already contains file');
                return parseStringify(fileDocument);
            } else {
                console.log('Does not contains file2');
                fileDocument.CompanyAddressIds.push(companyAddId);
                fileDocument.CompanyAddress.push(newCompanyAdd.Location);
                
                let updatedCoyAddIds = fileDocument.CompanyAddressIds;
                let updatedCoyAdds = fileDocument.CompanyAddress;

                return databases.updateDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.filesCollectionId,
                    fileId,
                    {
                        CompanyAddressIds: updatedCoyAddIds,
                        CompanyAddress: updatedCoyAdds,
                        InspectionType: inspectionType,
                        InspectedProductLine: inspectedProductLine,
                        GMPStatus: gmpStatus,
                        Inspectors: inspectors
                    }
                )
                .catch(async (error: unknown) => {
                    handleError(error, "Failed to update file");
                }).then(updatedFile => {
                    return parseStringify(updatedFile);
                });
            }
        }

        //Another copy of CreateFile, to keep it in scope
        async function CreateFile(companyAddress:string, fileId:string){
            console.log('Within scope, this is fileId: ', fileId)
            console.log('Within scope, this is companyAddress: ', companyAddress)
            const {storage, databases} = await createAdminClient();
              databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.companiesAddressCollectionId,
                    [Query.equal('Location',companyAddress)]).catch(async (error:unknown)=>{
                    handleError(error, "Failed to List Entry")
                    })
                    .then(async listedDocuments=>{
                        console.log('Listed Docs:', listedDocuments)
                        const fileInfo={
                           files:fileId,//fileId?fileId:'To Be Linked',
                           CompanyAddressIds:listedDocuments.documents[0].$id,
                           CompanyAddress:companyAddress,
                           InspectionType:inspectionType,
                           InspectedProductLine:inspectedProductLine,
                           GMPStatus:gmpStatus,
                           Inspectors:inspectors
                       };
                       return databases.createDocument(
                               appwriteConfig.databaseId,
                               appwriteConfig.fileSummaryCollectionId,
                               ID.unique(),
                               fileInfo
                           ).catch(async (error:unknown)=>{
                               handleError(error, "Failed to file Summary Entry");
                           }).then((newFileDocument)=>{
                               console.log('New doc: ', newFileDocument)
                               console.log(newFileDocument);
                               return newFileDocument
                           })
                                  

                    })
                    

        }          
    
        async function CreateFileDocument(companyAddId:string){

            const fileInfo={
                FilesId:'To Be Linked',
                CompanyAddressIds:[companyAddId],
                CompanyAddress:[companyAddress],
                InspectionType:inspectionType,
                InspectedProductLine:inspectedProductLine,
                GMPStatus:gmpStatus,
                Inspectors:inspectors
            };
            return databases.createDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.fileSummaryCollectionId,
                    ID.unique(),
                    fileInfo
                ).catch(async (error:unknown)=>{
                    handleError(error, "Failed to file Summary Entry");
                }).then((newFileDocument)=>{
                    console.log('New doc: ', newFileDocument)
                    console.log(newFileDocument);
                    return newFileDocument
                })
                                            
        }
}

        

    export const updateFileMetadata3 = async ({
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
        path,owner:ownerId,
        accountId
}:{
    fileId:string;
    companyName:string;
        companyAddress:string;
        state:string;
        companyEmail:string;
        phoneNo:string;
        latitude:number;
        longitude:number;
        inspectionType:string;
        inspectedProductLine:string;
        gmpStatus:string;
        inspectors:string;
        path:string;
        owner:string;
        accountId:string;
}) => {
    const { databases } = await createAdminClient();

        async function CreateFile(companyAddress:string){
            const {storage, databases} = await createAdminClient();
             return databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.companiesAddressCollectionId,
                    [Query.equal('Location',companyAddress)]).catch(async (error:unknown)=>{
                    handleError(error, "Failed to List Entry")
                    })
                    .then(async listedDocuments=>{
                        console.log('Listed Docs:', listedDocuments)
                        const fileInfo={
                           files:'To Be Linked',
                           CompanyAddressIds:listedDocuments.documents[0].$id,
                           CompanyAddress:companyAddress,
                           InspectionType:inspectionType,
                           InspectedProductLine:inspectedProductLine,
                           GMPStatus:gmpStatus,
                           Inspectors:inspectors
                       };
                       return databases.createDocument(
                               appwriteConfig.databaseId,
                               appwriteConfig.fileSummaryCollectionId,
                               ID.unique(),
                               fileInfo
                           ).catch(async (error:unknown)=>{
                               handleError(error, "Failed to file Summary Entry");
                           }).then((newFileDocument)=>{
                               console.log('New doc: ', newFileDocument)
                               console.log(newFileDocument);
                               return newFileDocument
                           })
                                  

                    })
                    

        }          
    
        async function CreateFileDocument(companyAddId:string){

            const fileInfo={
                FilesId:'To Be Linked',
                CompanyAddressIds:[companyAddId],
                CompanyAddress:[companyAddress],
                InspectionType:inspectionType,
                InspectedProductLine:inspectedProductLine,
                GMPStatus:gmpStatus,
                Inspectors:inspectors
            };
            return databases.createDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.fileSummaryCollectionId,
                    ID.unique(),
                    fileInfo
                ).catch(async (error:unknown)=>{
                    handleError(error, "Failed to file Summary Entry");
                }).then((newFileDocument)=>{
                    console.log('New doc: ', newFileDocument)
                    console.log(newFileDocument);
                    return newFileDocument
                })
                                            
        }
    

     return (async () => {
            const response = await CreateFile(companyAddress); // Create company and get ID
                // await createCompanyAddress(companyId); // Link Address to Company
                console.log('Response returned: ', response)
            return response;
        })();
    }


    async function updateMetadataWithFileId(metadataId: string, fileId: string) {
        const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
        const collectionId = process.env.NEXT_PUBLIC_APPWRITE_METADATA_COLLECTION_ID!;
        const {storage, databases} = await createAdminClient();

        try {
            const response = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.fileSummaryCollectionId,
            metadataId,
            {
                files: fileId, // or push into array if multiple files allowed
            }
            );
            console.log('Metadata updated with fileId:', response);
            return response;
        } catch (error) {
            console.error('Error linking file to metadata:', error);
            throw error;
        }
}


//     async function updateCompanyAddress(fileId:string, oldCompanyAdd:any){
//     oldCompanyAdd.FileIds = oldCompanyAdd.FileIds || [];

//     if (oldCompanyAdd.FileIds.includes(fileId)){
//         console.log('Already contains file')
//     } else {
//         console.log('Not contains file');
//         oldCompanyAdd.FileIds.push(fileId);
//         let updatedFileIds = oldCompanyAdd.FileIds;

//         return await databases.updateDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.companiesAddressCollectionId,
//             oldCompanyAdd.$id,
//             { FileIds: updatedFileIds }
//         )
//         .catch(async (error:unknown)=>{
//             handleError(error, "Yup 2");
//         }).then(updatedFile => {
//             console.log('Updated File: ', updatedFile);
//             return updatedFile.$id;
//         });
//     }
// }

    
//     async function updateCompany(fileId:string, oldCompany:any){
//         if (oldCompany.FileIds.includes(fileId)){
//             //do nothing
//             console.log('Already contains file')
//         } else { //push the fileId in storage to the address database
//             console.log('Does not contain file...')
            
//             // oldCompany.FileIds.push(fileId);
//             let updatedFileIds = [ ...oldCompany.FileIds, fileId];
            
//             const updatedFile = await databases.updateDocument(
//                 appwriteConfig.databaseId,
//                 appwriteConfig.companiesCollectionId,
//                 oldCompany.$id,
//                 {FileIds:updatedFileIds})

//                 // return updatedFile;
//             }
//         }
        
//         async function updateFile(fileId:string, fileDocument:any, companyAddId:string, newCompanyAdd:any){
//             fileDocument.CompanyAddressIds = fileDocument.CompanyAddressIds || [];
//             fileDocument.CompanyAddress = fileDocument.CompanyAddress || [];

//             if (fileDocument.CompanyAddressIds.includes(companyAddId)){
//                 console.log('Already contains file');
//                 return parseStringify(fileDocument);
//             } else {
//                 console.log('Does not contains file2');
//                 fileDocument.CompanyAddressIds.push(companyAddId);
//                 fileDocument.CompanyAddress.push(newCompanyAdd.Location);
                
//                 let updatedCoyAddIds = fileDocument.CompanyAddressIds;
//                 let updatedCoyAdds = fileDocument.CompanyAddress;

//                 return databases.updateDocument(
//                     appwriteConfig.databaseId,
//                     appwriteConfig.filesCollectionId,
//                     fileId,
//                     {
//                         CompanyAddressIds: updatedCoyAddIds,
//                         CompanyAddress: updatedCoyAdds,
//                         InspectionType: inspectionType,
//                         InspectedProductLine: inspectedProductLine,
//                         GMPStatus: gmpStatus,
//                         Inspectors: inspectors
//                     }
//                 )
//                 .catch(async (error: unknown) => {
//                     handleError(error, "Failed to update file");
//                 }).then(updatedFile => {
//                     return parseStringify(updatedFile);
//                 });
//             }
//         }
    // }

    //     async function CreateFile(companyAddress:string, companyAddId:string){
    //         const {storage, databases} = await createAdminClient();

    //         const fileDocument={
    //                     type:'document',//getFileType(bucketFile.name).type,
    //                     name:'name', //bucket
    //                     url:constructFileUrl('123'),//bucket
    //                     extension:'.nothing',//bucket
    //                     size:23,//bucket
    //                     owner:ownerId,
    //                     accountId:accountId,
    //                     users:[],
    //                     bucketFileId:'125',// bucketFile.$id,
    //                     CompanyAddressIds:[companyAddId],
    //                     CompanyAddress:[companyAddress],
    //                     InspectionType:inspectionType,
    //                     InspectedProductLine:inspectedProductLine,
    //                     GMPStatus:gmpStatus,
    //                     Inspectors:inspectors
    //                 };
    //         return databases.createDocument(
    //                                         appwriteConfig.databaseId,
    //                                         appwriteConfig.filesCollectionId,
    //                                         ID.unique(),
    //                                         fileDocument
    //                                     ).catch(async (error:unknown)=>{
    //                                             handleError(error, "Failed to create Companies document");
    //                                     }).then((newFileDocument)=>{
    //                                         console.log('New doc: ', newFileDocument)
    //                                         return newFileDocument
    //                                     })

    //     }

    // }



//     export const updateFileMetadataUpdate = async ({
//     fileId,
//     companyName,
//         companyAddress,
//         state,
//         companyEmail,
//         phoneNo,
//         latitude,
//         longitude,
//         inspectionType,
//         inspectedProductLine,
//         gmpStatus,
//         inspectors,
//         path
// }:{
//     fileId:string;
//     companyName:string;
//         companyAddress:string;
//         state:string;
//         companyEmail:string;
//         phoneNo:string;
//         latitude:unknown;
//         longitude:unknown;
//         inspectionType:string;
//         inspectedProductLine:string;
//         gmpStatus:string;
//         inspectors:string;
//         path:string;
// }) => {
//     const { databases } = await createAdminClient();

//     try {
//         console.log('We are updating...')
//         async function getFileDocument(fileId:string){
//             const fileDocument = await databases.getDocument(
//                 appwriteConfig.databaseId,
//                 appwriteConfig.filesCollectionId,
//                 fileId);

//                 return fileDocument;
//         }


//         async function createCompany(){
//             console.log('Working...')
//             // if the company exists in metadata
//             console.log('This is company name: ', companyName)
//             const document = await databases.listDocuments(
//                 appwriteConfig.databaseId,
//                 appwriteConfig.companiesCollectionId,
//                 [Query.equal("CompanyName", companyName)]);
//                 let cId:string;
//                 if (document.total > 0){ //if company exists
//                     // cId = document.documents[0].FileIds;
//                     updateCompany(fileId,document.documents[0]);
//     // async function updateCompanyAddress(fileId:string, oldCompanyAdd:any){

//                     cId = document.documents[0].$id;
//                     console.log('This is cId: ',cId);
//                     console.log('This is companyAddress: ',companyAddress);
//                   return  checkIfAddressExists(cId, companyAddress, fileId).then(exists => { // fileId is passed in case address exists, still to update it
//                         if (exists) {
//                             console.log("Address already exists, do not insert again.");
//                             //update existing address with fileStorage id;
//                             console.log('This is exists: ');
//                             console.log(exists);
//                            return updateCompanyAddress(fileId, exists.documents[0]).then(companyAddId=>{
//                               return  getFileDocument(fileId).then(fileDocument=>{
//                                   return  updateFile(fileId,fileDocument,companyAddId, exists).then(fileDocument=>{
//                                         console.log('This is the document...')
//                                         console.log(fileDocument)
//                                         return parseStringify(fileDocument);
                                        
//                                     })

//                                 })
//                             });
//                             //update File with CompanyAddressId
//                             // return 0;
//                         } else {
//                             console.log("No entry found, you can add this address.");
//                            return createCompanyAddress(cId, fileId);
//                             //update File with CompanyAddressId
                            
//                         }
//                     });
//                 }else { //create new company
//                     console.log('Company Does not Exists...');
//                    return createNewCompany().then(id=>{
//                         if (id){
//                            return createCompanyAddress(id, fileId)
//                         }
//                     })
//                 }
//             }
                
//             async function checkIfAddressExists(companyId:string, address:string, fileId:string) {
//                 try {
//                     const response = await databases.listDocuments(
//                         appwriteConfig.databaseId,
//                         appwriteConfig.companiesAddressCollectionId,
//                         [
//                             Query.equal('CompanyId', companyId),
//                             Query.equal('Location', address) // Assuming address field exists
//                     ]);
//                     console.log('Company address exists, here it is: ')
//                     console.log(response)

//                     //update address with storage fileIds -inspection file reports
//                     // response.documents[0]?.FileIds.push(fileId)
//                     // return response; // Returns true if entry exists, false otherwise
//                     return response.total > 0 && response; // Returns entire response if entry exists, false otherwise
//                 } catch (error) {
//                     console.error(error);
//                     return false;
//                 }
//             }

//             async function createNewCompany(){
//                 console.log('Creating new company ...');
//                 let updatedFileIds:string[] = [];
//                 updatedFileIds.push(fileId);
//                 const companiesDocument={
//                                 CompanyName:companyName,
//                                 FileIds:updatedFileIds
//                             };
                    
//                             const newCompany = await databases.createDocument(
//                                     appwriteConfig.databaseId,
//                                     appwriteConfig.companiesCollectionId,
//                                     ID.unique(),
//                                     companiesDocument,
//                                 ).catch(async (error:unknown)=>{
//                                         handleError(error, "Failed to create Companies document");
//                                     })
//                 return newCompany.$id;
//             }
            

//     async function createCompanyAddress(companyId:string, fileId:string) { 
//         const companiesAddressDocument={
//             Location:companyAddress,
//             State:state,
//             Email:companyEmail,
//             PhoneNo:phoneNo,
//             Lat:latitude,
//             Lng:longitude,
//             CompanyId:companyId,
//             FileIds:[]
//         };
        
//         // const newCompanyAddress = await databases.createDocument(
//         return databases.createDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.companiesAddressCollectionId,
//             ID.unique(),
//             companiesAddressDocument,
//         )
//         .catch(async (error:unknown)=>{
//             handleError(error, "Failed to create CompaniesAddress document");
//         }).then( (newCompanyAdd)=>{
//             console.log('This is the new address')
//             console.log(newCompanyAdd)

//            return updateCompanyAddress(fileId, newCompanyAdd).then(companyAddId=>{
//                   return getFileDocument(fileId).then(fileDocument=>{
//                        return updateFile(fileId,fileDocument,companyAddId, newCompanyAdd)
//                     })
//             });
            
//         })
//     }

//        return (async () => {
//             const response = await createCompany(); // Create company and get ID
//                 // await createCompanyAddress(companyId); // Link Address to Company
//             return response;
//         })();
        
//     } catch(error:unknown){
//         handleError(error, "Failed to create file document");
//     }finally{
//         revalidatePath(path)
        
//     }

//     async function updateCompanyAddress(fileId:string, oldCompanyAdd:any){
//                 if (oldCompanyAdd.FileIds.includes(fileId)){
//                     //do nothing
//                     console.log('Already contains file')
//                 } else { //push the fileId in storage to the address database
                    
//                     console.log('Not contains file')
//                     oldCompanyAdd.FileIds.push(fileId);
//                     let updatedFileIds = oldCompanyAdd.FileIds;
                    
//                     const updatedFile = await databases.updateDocument(
//                         appwriteConfig.databaseId,
//                         appwriteConfig.companiesAddressCollectionId,
//                         oldCompanyAdd.$id,
//                         {FileIds:updatedFileIds})
                
//                         return updatedFile.$id
//                     }

//         // return oldCompanyAdd.$id
//     }
    
//     async function updateCompany(fileId:string, oldCompany:any){
//         if (oldCompany.FileIds.includes(fileId)){
//             //do nothing
//             console.log('Already contains file')
//         } else { //push the fileId in storage to the address database
            
//             // oldCompany.FileIds.push(fileId);
//             let updatedFileIds = [ ...oldCompany.FileIds, fileId];
            
//             const updatedFile = await databases.updateDocument(
//                 appwriteConfig.databaseId,
//                 appwriteConfig.companiesCollectionId,
//                 oldCompany.$id,
//                 {FileIds:updatedFileIds})
//             }
//         }
        
//         async function updateFile(fileId:string, fileDocument:any, companyAddId:string, newCompanyAdd:any){
//                     if (fileDocument.CompanyAddressIds.includes(companyAddId)){
//                         //do nothing
//                         console.log('Already contains file')
//                         return parseStringify(fileDocument);
//                     } else { //push the fileId in storage to the address database
//                         console.log('This is newCompanyAdd', newCompanyAdd)
//                         fileDocument.CompanyAddressIds.push(companyAddId)//company Address Id;
//                         fileDocument.CompanyAddress.push(newCompanyAdd.Location)//company Address Id;
//                         let updatedCoyAddIds = fileDocument.CompanyAddressIds;
//                         let updatedCoyAdds = fileDocument.CompanyAddress;
                        
//                         // const updatedFile = await databases.updateDocument(
//                       return databases.updateDocument(
//                             appwriteConfig.databaseId,
//                             appwriteConfig.filesCollectionId,
//                             fileId,
//                             {CompanyAddressIds:updatedCoyAddIds, CompanyAddress:updatedCoyAdds})
//                             .catch(async (error:unknown)=>{
//                                 handleError(error, "Failed to update file");
//                             }).then( (updatedFile)=>{
//                                 console.log('This is updated file: ', updatedFile);
//                                 return parseStringify(updatedFile);
//                             })
//                             // return parseStringify(updatedFile);
//                         }

//         }
//     }

// export const updateFileMetadataUpdate = async ({
//     fileId,
//     companyName,
//     companyAddress,
//     state,
//     companyEmail,
//     phoneNo,
//     latitude,
//     longitude,
//     inspectionType,
//     inspectedProductLine,
//     gmpStatus,
//     inspectors,
//     path
// }: {
//     fileId: string;
//     companyName: string;
//     companyAddress: string;
//     state: string;
//     companyEmail: string;
//     phoneNo: string;
//     latitude: number | string;
//     longitude: number | string;
//     inspectionType: string;
//     inspectedProductLine: string;
//     gmpStatus: string;
//     inspectors: string;
//     path: string;
// }) => {
//     const { databases } = await createAdminClient();

//     try {
//         const fileDoc = await getFileDocument(fileId);

//         const existingCompany = await findCompanyByName(companyName);

//         let companyId: string;

//         if (existingCompany) {
//             await updateCompanyFileIds(existingCompany, fileId);
//             companyId = existingCompany.$id;

//             const existingAddress = await checkIfAddressExists(companyId, companyAddress);

//             if (existingAddress) {
//                 await updateCompanyAddressFileIds(existingAddress, fileId);
//                 await updateFileWithAddress(fileId, fileDoc, existingAddress.$id, existingAddress);
//             } else {
//                 const newAddress = await createCompanyAddress(companyId, fileId);
//                 await updateFileWithAddress(fileId, fileDoc, newAddress.$id, newAddress);
//             }
//         } else {
//             const newCompany = await createNewCompany(companyName, fileId);
//             companyId = newCompany.$id;
//             const newAddress = await createCompanyAddress(companyId, fileId);
//             await updateFileWithAddress(fileId, fileDoc, newAddress.$id, newAddress);
//         }
//     } catch (error) {
//         handleError(error, "Failed to update file metadata");
//     } finally {
//         revalidatePath(path);
//     }

//     // --- Helper Functions ---

//     async function getFileDocument(fileId: string) {
//         return await databases.getDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.filesCollectionId,
//             fileId
//         );
//     }

//     async function findCompanyByName(name: string) {
//         const result = await databases.listDocuments(
//             appwriteConfig.databaseId,
//             appwriteConfig.companiesCollectionId,
//             [Query.equal("CompanyName", name)]
//         );
//         return result.total > 0 ? result.documents[0] : null;
//     }

//     async function checkIfAddressExists(companyId: string, address: string) {
//         const result = await databases.listDocuments(
//             appwriteConfig.databaseId,
//             appwriteConfig.companiesAddressCollectionId,
//             [
//                 Query.equal("CompanyId", companyId),
//                 Query.equal("Location", address)
//             ]
//         );
//         return result.total > 0 ? result.documents[0] : null;
//     }

//     async function createNewCompany(name: string, fileId: string) {
//         const data = {
//             CompanyName: name,
//             FileIds: [fileId]
//         };
//         return await databases.createDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.companiesCollectionId,
//             ID.unique(),
//             data
//         );
//     }

//     async function updateCompanyFileIds(company: any, fileId: string) {
//         if (!company.FileIds.includes(fileId)) {
//             const updated = [...company.FileIds, fileId];
//             await databases.updateDocument(
//                 appwriteConfig.databaseId,
//                 appwriteConfig.companiesCollectionId,
//                 company.$id,
//                 { FileIds: updated }
//             );
//         }
//     }

//     async function createCompanyAddress(companyId: string, fileId: string) {
//         const data = {
//             Location: companyAddress,
//             State: state,
//             Email: companyEmail,
//             PhoneNo: phoneNo,
//             Lat: latitude,
//             Lng: longitude,
//             CompanyId: companyId,
//             FileIds: [fileId]
//         };

//         const newAddress = await databases.createDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.companiesAddressCollectionId,
//             ID.unique(),
//             data
//         );

//         return newAddress;
//     }

//     async function updateCompanyAddressFileIds(address: any, fileId: string) {
//         if (!address.FileIds.includes(fileId)) {
//             const updated = [...address.FileIds, fileId];
//             await databases.updateDocument(
//                 appwriteConfig.databaseId,
//                 appwriteConfig.companiesAddressCollectionId,
//                 address.$id,
//                 { FileIds: updated }
//             );
//         }
//     }

//     async function updateFileWithAddress(fileId: string, fileDoc: any, addressId: string, addressDoc: any) {
//         const updatedIds = fileDoc.CompanyAddressIds || [];
//         const updatedNames = fileDoc.CompanyAddress || [];

//         if (!updatedIds.includes(addressId)) {
//             updatedIds.push(addressId);
//             updatedNames.push(addressDoc.Location);

//             await databases.updateDocument(
//                 appwriteConfig.databaseId,
//                 appwriteConfig.filesCollectionId,
//                 fileId,
//                 {
//                     CompanyAddressIds: updatedIds,
//                     CompanyAddress: updatedNames
//                 }
//             );
//         }
//     }
// };


// export const updateFileMetadataUpdate = async ({
//   fileId,
//   companyName,
//   companyAddress,
//   state,
//   companyEmail,
//   phoneNo,
//   latitude,
//   longitude,
//   inspectionType,
//   inspectedProductLine,
//   gmpStatus,
//   inspectors,
//   path
// }: {
//   fileId: string;
//   companyName: string;
//   companyAddress: string;
//   state: string;
//   companyEmail: string;
//   phoneNo: string;
//   latitude: number | string;
//   longitude: number | string;
//   inspectionType: string;
//   inspectedProductLine: string;
//   gmpStatus: string;
//   inspectors: string;
//   path: string;
// }) => {
//   const { databases } = await createAdminClient();

//   try {
//     const fileDoc = await getFile(fileId);
//     let company = await getCompany(companyName);

//     if (company) {
//       await updateCompanyIfChanged(company, fileId);
//     } else {
//       company = await createCompany(companyName, fileId);
//     }

//     let address = await getCompanyAddress(company.$id, companyAddress);

//     if (address) {
//       await updateCompanyAddressIfChanged(address, {
//         State: state,
//         Email: companyEmail,
//         PhoneNo: phoneNo,
//         Lat: latitude,
//         Lng: longitude,
//         FileIds: [...new Set([...(address.FileIds || []), fileId])]
//       });
//     } else {
//       address = await createCompanyAddress(company.$id, {
//         Location: companyAddress,
//         State: state,
//         Email: companyEmail,
//         PhoneNo: phoneNo,
//         Lat: latitude,
//         Lng: longitude,
//         FileIds: [fileId]
//       });
//     }

//     await updateFileIfNeeded(fileDoc, fileId, address);
//   } catch (error) {
//     handleError(error, "Update failed");
//   } finally {
//     revalidatePath(path);
//   }

//   // --- Helper Functions ---
//   async function getFile(fileId: string) {
//     return await databases.getDocument(appwriteConfig.databaseId, appwriteConfig.filesCollectionId, fileId);
//   }

//   async function getCompany(name: string) {
//     const res = await databases.listDocuments(
//       appwriteConfig.databaseId,
//       appwriteConfig.companiesCollectionId,
//       [Query.equal("CompanyName", name)]
//     );
//     return res.total > 0 ? res.documents[0] : null;
//   }

//   async function getCompanyAddress(companyId: string, location: string) {
//     const res = await databases.listDocuments(
//       appwriteConfig.databaseId,
//       appwriteConfig.companiesAddressCollectionId,
//       [Query.equal("CompanyId", companyId), Query.equal("Location", location)]
//     );
//     return res.total > 0 ? res.documents[0] : null;
//   }

//   async function createCompany(name: string, fileId: string) {
//     return await databases.createDocument(
//       appwriteConfig.databaseId,
//       appwriteConfig.companiesCollectionId,
//       ID.unique(),
//       { CompanyName: name, FileIds: [fileId] }
//     );
//   }

//   async function updateCompanyIfChanged(company: any, fileId: string) {
//     const updates: any = {};
//     if (!company.FileIds.includes(fileId)) {
//       updates.FileIds = [...company.FileIds, fileId];
//     }
//     if (Object.keys(updates).length > 0) {
//       await databases.updateDocument(appwriteConfig.databaseId, appwriteConfig.companiesCollectionId, company.$id, updates);
//     }
//   }

//   async function createCompanyAddress(companyId: string, data: any) {
//     return await databases.createDocument(
//       appwriteConfig.databaseId,
//       appwriteConfig.companiesAddressCollectionId,
//       ID.unique(),
//       { ...data, CompanyId: companyId }
//     );
//   }

//   async function updateCompanyAddressIfChanged(address: any, newData: any) {
//     const updates: any = {};
//     for (const key of ["State", "Email", "PhoneNo", "Lat", "Lng"]) {
//       if (address[key] !== newData[key]) {
//         updates[key] = newData[key];
//       }
//     }

//     if (!address.FileIds.includes(newData.FileIds[0])) {
//       updates.FileIds = [...new Set([...address.FileIds, newData.FileIds[0]])];
//     }

//     if (Object.keys(updates).length > 0) {
//       await databases.updateDocument(appwriteConfig.databaseId, appwriteConfig.companiesAddressCollectionId, address.$id, updates);
//     }
//   }

//   async function updateFileIfNeeded(fileDoc: any, fileId: string, address: any) {
//     const updates: any = {};

//     if (!fileDoc.CompanyAddressIds.includes(address.$id)) {
//       updates.CompanyAddressIds = [...fileDoc.CompanyAddressIds, address.$id];
//       updates.CompanyAddress = [...fileDoc.CompanyAddress, address.Location];
//     }

//     if (Object.keys(updates).length > 0) {
//       await databases.updateDocument(appwriteConfig.databaseId, appwriteConfig.filesCollectionId, fileId, updates);
//     }
//   }
// };

export const upsertCompanyAndFileMetadata = async ({
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
}: {
  fileId: string;
  companyName: string;
  companyAddress: string;
  state: string;
  companyEmail: string;
  phoneNo: string;
  latitude: number | string;
  longitude: number | string;
  inspectionType: string;
  inspectedProductLine: string;
  gmpStatus: string;
  inspectors: string;
  path: string;
}) => {
  const { databases } = await createAdminClient();

  try {
    let fileDoc: any = null;
    try {
      fileDoc = await databases.getDocument(appwriteConfig.databaseId, appwriteConfig.filesCollectionId, fileId);
    } catch {
      fileDoc = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.filesCollectionId,
        fileId,
        {
          CompanyAddressIds: [],
          CompanyAddress: [],
          InspectionType: inspectionType,
          InspectedProductLine: inspectedProductLine,
          GMPStatus: gmpStatus,
          Inspectors: inspectors
        }
      );
    }

    // -- Handle Company
    const company = await getOrCreateCompany(companyName, fileId);

    // -- Handle Company Address
    const address = await getOrCreateCompanyAddress(company.$id, {
      Location: companyAddress,
      State: state,
      Email: companyEmail,
      PhoneNo: phoneNo,
      Lat: latitude,
      Lng: longitude,
      FileIds: [fileId]
    });

    // -- Update File with address relationship
    await updateFileAddressRelation(fileDoc, fileId, address.$id, address.Location);
  } catch (error) {
    handleError(error, "Error during upsert");
  } finally {
    revalidatePath(path);
  }

  // ========== Helpers ==========

  async function getOrCreateCompany(name: string, fileId: string) {
    const res = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.companiesCollectionId,
      [Query.equal("CompanyName", name)]
    );

    if (res.total > 0) {
      const company = res.documents[0];
      if (!company.FileIds.includes(fileId)) {
        await databases.updateDocument(appwriteConfig.databaseId, appwriteConfig.companiesCollectionId, company.$id, {
          FileIds: [...company.FileIds, fileId]
        });
      }
      return company;
    }

    return await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.companiesCollectionId,
      ID.unique(),
      { CompanyName: name, FileIds: [fileId] }
    );
  }

  async function getOrCreateCompanyAddress(companyId: string, data: any) {
    const res = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.companiesAddressCollectionId,
      [Query.equal("CompanyId", companyId), Query.equal("Location", data.Location)]
    );

    if (res.total > 0) {
      const address = res.documents[0];
      const updates: any = {};
      for (const key of ["State", "Email", "PhoneNo", "Lat", "Lng"]) {
        if (address[key] !== data[key]) {
          updates[key] = data[key];
        }
      }
      if (!address.FileIds.includes(data.FileIds[0])) {
        updates.FileIds = [...address.FileIds, data.FileIds[0]];
      }
      if (Object.keys(updates).length > 0) {
        await databases.updateDocument(appwriteConfig.databaseId, appwriteConfig.companiesAddressCollectionId, address.$id, updates);
      }
      return address;
    }

    return await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.companiesAddressCollectionId,
      ID.unique(),
      { ...data, CompanyId: companyId }
    );
  }

  async function updateFileAddressRelation(fileDoc: any, fileId: string, addressId: string, addressName: string) {
    const updates: any = {};
    if (!fileDoc.CompanyAddressIds.includes(addressId)) {
      updates.CompanyAddressIds = [...fileDoc.CompanyAddressIds, addressId];
      updates.CompanyAddress = [...fileDoc.CompanyAddress, addressName];
    }

    if (Object.keys(updates).length > 0) {
      await databases.updateDocument(appwriteConfig.databaseId, appwriteConfig.filesCollectionId, fileId, updates);
    }
  }
};

// export const updateFileMetadata2 = async ({
//   fileId,
//   companyName,
//   companyAddress,
//   state,
//   companyEmail,
//   phoneNo,
//   latitude,
//   longitude,
//   inspectionType,
//   inspectedProductLine,
//   gmpStatus,
//   inspectors,
//   path
// }: {
//   fileId: string;
//   companyName: string;
//   companyAddress: string;
//   state: string;
//   companyEmail: string;
//   phoneNo: string;
//   latitude: number | string;
//   longitude: number | string;
//   inspectionType?: string;
//   inspectedProductLine?: string;
//   gmpStatus?: string;
//   inspectors?: string;
//   path?: string;
// }) => {
//   const { databases } = await createAdminClient();

//   try {
//     // 1. Get the file document
//     const fileDoc = await databases.getDocument(
//       appwriteConfig.databaseId,
//       appwriteConfig.filesCollectionId,
//       fileId
//     );

//     if (!fileDoc?.CompanyAddressIds?.length) {
//       throw new Error("No CompanyAddressIds found in File document.");
//     }

//     const addressId = fileDoc.CompanyAddressIds[0];

//     // 2. Get and update Company Address
//     const addressDoc = await databases.getDocument(
//       appwriteConfig.databaseId,
//       appwriteConfig.companiesAddressCollectionId,
//       addressId
//     );

//     const addressUpdateData: any = {
//       Location: companyAddress,
//       State: state,
//       Email: companyEmail,
//       PhoneNo: phoneNo,
//       Lat: latitude,
//       Lng: longitude
//     };

//     await databases.updateDocument(
//       appwriteConfig.databaseId,
//       appwriteConfig.companiesAddressCollectionId,
//       addressId,
//       addressUpdateData
//     );

//     // 3. Get and update Company
//     const companyId = addressDoc.CompanyId;

//     const companyUpdateData: any = {
//       CompanyName: companyName
//     };

//     await databases.updateDocument(
//       appwriteConfig.databaseId,
//       appwriteConfig.companiesCollectionId,
//       companyId,
//       companyUpdateData
//     );

//     // 4. Optionally update file fields
//     const fileUpdateData: any = {};

//     if (inspectionType) fileUpdateData.InspectionType = inspectionType;
//     if (inspectedProductLine) fileUpdateData.InspectedProductLine = inspectedProductLine;
//     if (gmpStatus) fileUpdateData.GMPStatus = gmpStatus;
//     if (inspectors) fileUpdateData.Inspectors = inspectors;

//     if (Object.keys(fileUpdateData).length > 0) {
//       await databases.updateDocument(
//         appwriteConfig.databaseId,
//         appwriteConfig.filesCollectionId,
//         fileId,
//         fileUpdateData
//       );
//     }
//   } catch (err) {
//     handleError(err, "Failed to update file metadata");
//   } finally {
//     if (path) revalidatePath(path);
//   }
// };

export const updateExistingFileMetadata = async ({ fileId, companyName, companyAddress, state, companyEmail, phoneNo, latitude, longitude, inspectionType, inspectedProductLine, gmpStatus, inspectors, path }: { fileId: string; companyName: string; companyAddress: string; state: string; companyEmail: string; phoneNo: string; latitude: number | string; longitude: number | string; inspectionType: string; inspectedProductLine: string; gmpStatus: string; inspectors: string; path: string; }) => {
    const { databases } = await createAdminClient();



try { // 1. Get the file 
        const fileDoc = await databases.getDocument( appwriteConfig.databaseId, appwriteConfig.filesCollectionId, fileId );

        if (!fileDoc) throw new Error("File not found");

    // 2. Get CompanyAddress from first ID
    const addressId = fileDoc.CompanyAddressIds?.[0];
        console.log('This is addressId:', addressId)
    if (!addressId) throw new Error("CompanyAddress not linked to file");

    const companyAddressDoc = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.companiesAddressCollectionId,
    addressId
    );

    if (!companyAddressDoc) throw new Error("CompanyAddress document not found");

    // 3. Update CompanyAddress
    await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.companiesAddressCollectionId,
    addressId,
    {
        Location: companyAddress,
        State: state,
        Email: companyEmail,
        PhoneNo: phoneNo,
        Lat: latitude,
        Lng: longitude
    }
    );

    // 4. Get and update the Company
    const companyId = companyAddressDoc.CompanyId;
        console.log('This is companyId:', companyId)

    const companyDoc = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.companiesCollectionId,
    companyId.$id
    );
        console.log('This is companyDoc:', companyDoc)


    if (!companyDoc) throw new Error("Company document not found");

    await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.companiesCollectionId,
    companyId.$id,
    {
        CompanyName: companyName
    }
    );

    // 5. Update the File document itself
    await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.filesCollectionId,
    fileId,
    {
        InspectionType: inspectionType,
        InspectedProductLine: inspectedProductLine,
        GMPStatus: gmpStatus,
        Inspectors: inspectors
    }
    );

    console.log("Update complete");

    
    
    
} catch (error) { handleError(error, "Failed to update existing metadata"); } finally { revalidatePath(path); } };


