"use client"

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getAllMetadata } from "@/lib/actions/metadata.actions";

interface Metadata {
  $id: string
  companyName: string
  companyAddress: string
  inspectionType: string
  gmpStatus: string
  inspectedProductLine: string
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
            <th className="p-2 font-semibold">Company</th>
            <th className="p-2 font-semibold">Address</th>
            <th className="p-2 font-semibold">Type</th>
            <th className="p-2 font-semibold">Product Line</th>
            <th className="p-2 font-semibold">GMP</th>
            <th className="p-2 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {metadataList.map((meta) => (
            <tr key={meta.$id} className={selectedId === meta.$id ? "bg-blue-50" : "hover:bg-gray-50"}>
              <td className="p-2 whitespace-nowrap">{meta.companyName}</td>
              <td className="p-2 whitespace-nowrap">{meta.companyAddress}</td>
              <td className="p-2 whitespace-nowrap">{meta.inspectionType}</td>
              <td className="p-2 whitespace-nowrap">{meta.inspectedProductLine}</td>
              <td className="p-2 whitespace-nowrap">{meta.gmpStatus}</td>
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
