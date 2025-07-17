"use client";

import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function CategoryClassificationTable({ category, data }) {
  // Define table columns
  const columns = [
    {
      accessorKey: "imageUrl",
      header: "Gambar",
      cell: ({ row }) => (
        <div className="w-16 h-16 relative">
          <Image
            src={row.getValue("imageUrl")}
            alt={`Klasifikasi ${row.original.id}`}
            fill
            className="object-cover rounded"
          />
        </div>
      ),
    },
    {
      accessorKey: "username",
      header: "Pengirim",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("username")}</div>
      ),
    },
    {
      accessorKey: "confidence",
      header: "Kepercayaan",
      cell: ({ row }) => {
        const confidence = row.getValue("confidence");
        return (
          <div className="text-sm">
            {confidence ? `${confidence * 100}%` : "Undefined"}
          </div>
        );
      },
    },
    {
      accessorKey: "wasteCount",
      header: "Jumlah Sampah",
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue("wasteCount") || "–"}</div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Tanggal",
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.getValue("createdAt")).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <Link href={`/submissions/${row.original.submissionId}`}>
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            Detail
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">
        {category} ({data.length})
      </h2>
      {data.length === 0 ? (
        <p className="text-muted-foreground">
          Tidak ada pengiriman untuk kategori ini.
        </p>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}
