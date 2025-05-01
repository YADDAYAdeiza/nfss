"use client"

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getAllMetadata } from "@/lib/actions/metadata.actions";

interface Metadata {
  $id: string
  CompanyAddress: string
  InspectionType: string
  InspectedProductLine: string
  GMPStatus: string
  createdAt:string
}

interface MetadataTableSelectorProps {
  onSelect: (metadataId: string) => void
}

const MetadataTableSelector: React.FC<MetadataTableSelectorProps> = ({ onSelect }) => {
  const [metadataList, setMetadataList] = useState<Metadata[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetadata = async () => {
      const result = await getAllMetadata()
      console.log('This is result for Linked: ',result);
      if (result) setMetadataList(result)
    }
    fetchMetadata()
  }, [])

  const handleSelect = (id: string) => {
    setSelectedId(id)
    onSelect(id)
  }

  return (
    <div className="overflow-auto max-h-[300px] border rounded-xl shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 font-semibold">CompanyAddress</th>
            <th className="p-2 font-semibold">InspectionType</th>
            <th className="p-2 font-semibold">InspectedProductLine</th>
            <th className="p-2 font-semibold">GMPStatus</th>
            <th className="p-2 font-semibold">Date</th>
            <th className="p-2 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {metadataList.map((meta) => (
            <tr key={meta.$id} className={selectedId === meta.$id ? "bg-blue-50" : "hover:bg-gray-50"}>
              <td className="p-2 whitespace-nowrap">{meta.CompanyAddress}</td>
              <td className="p-2 whitespace-nowrap">{meta.InspectionType}</td>
              <td className="p-2 whitespace-nowrap">{meta.InspectedProductLine}</td>
              <td className="p-2 whitespace-nowrap">{meta.GMPStatus}</td>
              <td className="p-2 whitespace-nowrap">{meta.createdAt}</td>
              <td className="p-2">
                <Button size="sm" onClick={() => handleSelect(meta.$id)}>
                  Select
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default MetadataTableSelector
