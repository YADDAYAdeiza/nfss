"use client"

import { useEffect, useState, useCallback } from "react"
import { debounce } from "lodash"
import { FormItem, FormMessage } from "./ui/form"
import { Command, CommandInput, CommandItem, CommandEmpty, CommandGroup } from "@/components/ui/command"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"
import { Client, Account, Query, ID, Databases } from "appwrite"
import { createAdminClient, createSessionClient } from "@/lib/appwrite"
import { appwriteConfig } from "@/lib/appwrite/config"
// import { Query, ID, Databases } from "node-appwrite"


const client = new Client()
        .setEndpoint(appwriteConfig.endpointURL)
        .setProject(appwriteConfig.projectId)
        // .setKey(appwriteConfig.secretKey)

const account = new Account(client);


// const client = new Client()
//   .setEndpoint("https://[APPWRITE-ENDPOINT]")
//   .setProject("[PROJECT_ID]")
// const {databases} = await createAdminClient();
const databases = new Databases(client)

// const databaseId = "[DATABASE_ID]"
// const companyCollectionId = "[COMPANY_COLLECTION_ID]"
// const companyAddressCollectionId = "[ADDRESS_COLLECTION_ID]"

interface CompanyMetadataComboboxProps {
  companyName: string
  companyAddress: string
  onCompanyChange: (val: string, companyId: string) => void
  onAddressChange: (
    val: string,
    addressMetadata: {
      state: string
      latitude: number
      longitude: number
    }
  ) => void
}

const CompanyNameCombobox = ({
  value,
  onChange,
}: {
  value: string
  onChange: (val: string, companyId: string) => void
}) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])


  useEffect(() => {
    async function loadSessionAndGetUser() {
      try {
        // 1. Fetch the session secret from the API route
        const res = await fetch('/api/session');
        const data = await res.json();

        if (!data.sessionSecret) {
          throw new Error('No session found');
        }

        // 2. Set the session on the Appwrite client
        client.setSession(data.sessionSecret);

        // 3. Now you can call account.get()
        const user = await account.get();
        console.log('Logged-in user:', user);
      } catch (err) {
        console.error('Error getting user:', err);
      }
    }

    loadSessionAndGetUser();
  }, []);


  const fetchCompanies = useCallback(
    debounce(async (term: string) => {
      console.log('This is term:', term);
      console.log('This is term2:', term);

      // client.setSession(sessionSecret);
      // Get current user
      account.get()
      .then(response => {
        console.log('Logged in user now :', response);
      })
      .catch(error => {
        console.error('Error fetching user:', error);
      });
      console.log('This is term3:', term);
      
        
      try {
        const res = await databases.listDocuments(appwriteConfig.databaseId, appwriteConfig.companiesCollectionId, [
          Query.search("CompanyName", term),
        ])
        setCompanies(res.documents.map((doc) => ({
          id: doc.$id,
          name: doc.CompanyName, // <- change this!
        })));

        console.log('Fetching it...', res.documents);
      } catch (err) {
        console.error("Error fetching companies:", err)
      }
    }, 400),
    []
  )

  useEffect(() => {
    if (search.length > 1) {
      fetchCompanies(search)
    }
  }, [search, fetchCompanies])

  const handleSelect = async (name: string) => {
    const existing = companies.find((c) => c.name === name)

    if (existing) {
      onChange(existing.name, existing.id)
    } else {
      const newDoc = await databases.createDocument(appwriteConfig.databaseId, appwriteConfig.companiesCollectionId, ID.unique(), {
        name,
      })
      onChange(newDoc.name, newDoc.$id)
    }

    setOpen(false)
  }

  return (
    <FormItem>
      <label className="shad-form-label block mb-1">Company Name</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full shad-input justify-between")}>
            {value || "Select or type company"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search or create company…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandEmpty>
              <Button variant="ghost" className="w-full justify-start" onClick={() => handleSelect(search)}>
                Create “{search}”
              </Button>
            </CommandEmpty>
            <CommandGroup>
              {companies.map((company) => {
                {console.log(company)}
               return <CommandItem key={company.id} onSelect={() => handleSelect(company.name)}>
                  {company.name}
                </CommandItem>
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )
}

const CompanyAddressCombobox = ({
  value,
  companyId,
  onChange,
}: {
  value: string
  companyId: string
  onChange: (val: string, meta: { state: string; latitude: number; longitude: number }) => void
}) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [addresses, setAddresses] = useState<any[]>([])

  const fetchAddresses = useCallback(
    debounce(async () => {
      try {
        const res = await databases.listDocuments(appwriteConfig.databaseId, appwriteConfig.companiesAddressCollectionId, [
          Query.equal("companyId", companyId),
        ])
        setAddresses(res.documents)
      } catch (err) {
        console.error("Error fetching addresses:", err)
      }
    }, 300),
    [companyId]
  )

  useEffect(() => {
    if (companyId) {
      fetchAddresses()
    }
  }, [companyId, fetchAddresses])

  const handleSelect = async (addressVal: string) => {
    const existing = addresses.find((addr) => addr.address === addressVal)

    if (existing) {
      onChange(existing.address, {
        state: existing.state,
        latitude: existing.latitude,
        longitude: existing.longitude,
      })
    } else {
      const newDoc = await databases.createDocument(appwriteConfig.databaseId, appwriteConfig.companiesAddressCollectionId, ID.unique(), {
        companyId,
        address: addressVal,
        state: "",
        latitude: 0,
        longitude: 0,
      })

      onChange(newDoc.address, {
        state: "",
        latitude: 0,
        longitude: 0,
      })
    }

    setOpen(false)
  }

  return (
    <FormItem>
      <label className="shad-form-label block mb-1">Company Address</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full shad-input justify-between")}>
            {value || "Select or type address"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search or add address…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandEmpty>
              <Button variant="ghost" className="w-full justify-start" onClick={() => handleSelect(search)}>
                Create “{search}”
              </Button>
            </CommandEmpty>
            <CommandGroup>
              {addresses.map((addr) => (
                <CommandItem key={addr.$id} onSelect={() => handleSelect(addr.address)}>
                  {addr.address}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )
}

export const CompanyAndAddressMetadataCombobox = ({
  companyName,
  companyAddress,
  onCompanyChange,
  onAddressChange,
}: CompanyMetadataComboboxProps) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState("")

  const handleCompanyChange = (name: string, companyId: string) => {
    setSelectedCompanyId(companyId)
    onCompanyChange(name, companyId)
  }

  return (
    <>
      <CompanyNameCombobox value={companyName} onChange={handleCompanyChange} />
      {selectedCompanyId && (
        <CompanyAddressCombobox
          value={companyAddress}
          companyId={selectedCompanyId}
          onChange={onAddressChange}
        />
      )}
    </>
  )
}
