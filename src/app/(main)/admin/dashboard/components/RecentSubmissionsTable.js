// src/app/(main)/admin/dashboard/components/RecentSubmissionsTable.jsx
"use client"; // Ini adalah Client Component

import { DataTable } from "@/components/shared/DataTable";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

// Definisi kolom untuk tabel submissions terbaru
// Didefinisikan di Client Component karena mengandung fungsi 'cell'
const columns = [
  {
    accessorKey: "username",
    header: "Nama Pengguna",
    cell: ({ row }) => {
      const user = row.original.user;
      return (
        <div className="font-medium">
          {row.original.username}
          {user ? (
            <p className="text-muted-foreground text-sm">({user.email})</p>
          ) : null}
        </div>
      );
    },
  },
  {
    accessorKey: "uploadedAt",
    header: "Tanggal Unggah",
    cell: ({ row }) => new Date(row.original.uploadedAt).toLocaleString(),
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => (
      <Link href={`/submissions/${row.original.id}`}>
        <Button variant="outline" size="lg" className="w-fit cursor-pointer">
          Lihat Detail
          <ExternalLink className="w-10 h-10" />
        </Button>
      </Link>
    ),
  },
];

export function RecentSubmissionsTable({ data }) {
  return <DataTable columns={columns} data={data} />;
}
