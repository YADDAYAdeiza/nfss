"use client"

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getAllMetadata } from "@/lib/actions/metadata.actions";

interface Metadata {
  $id: string;
  CompanyAddress: string;
  InspectionType: string;
  InspectedProductLine: string;
  GMPStatus: string;
  createdAt: string;
}

interface MetadataTableSelectorProps {
  onSelect: (metadataId: string) => void;
}

const MetadataTableSelector: React.FC<MetadataTableSelectorProps> = ({ onSelect }) => {
  const [metadataList, setMetadataList] = useState<Metadata[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchMetadata = async (cursor?: string, isNext = true) => {
    setLoading(true);
    const result = await getAllMetadata(5, cursor); // limit 5 per page
    if (result) {
      setMetadataList(result.documents);
      if (isNext && cursor) {
        setCursorStack((prev) => [...prev, cursor]);
      } else if (!isNext && cursorStack.length > 1) {
        setCursorStack((prev) => prev.slice(0, -1));
      }
      setCurrentCursor(cursor || null);
      setNextCursor(result.nextCursor || null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    onSelect(id);
  };

  const handleNext = () => {
    if (nextCursor) {
      fetchMetadata(nextCursor, true);
    }
  };

  const handlePrevious = () => {
    if (cursorStack.length >= 2) {
      const prevCursor = cursorStack[cursorStack.length - 2];
      fetchMetadata(prevCursor, false);
    }
  };

  return (
    <div className="space-y-4">
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
              <tr key={meta.$id} className={selectedId === meta.$id ? "bg-yellow-100" : "hover:bg-gray-50"}>
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
      <div className="flex justify-end space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handlePrevious}
          disabled={cursorStack.length < 2 || loading}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleNext}
          disabled={!nextCursor || loading}
        >
          {loading ? "Loading..." : "Next"}
        </Button>
      </div>
    </div>
  );
};

export default MetadataTableSelector;
