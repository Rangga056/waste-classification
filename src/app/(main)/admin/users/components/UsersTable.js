// src/app/(main)/admin/dashboard/components/UserstTable.jsx
"use client"; // Ini adalah Client Component

import { DataTable } from "@/components/shared/DataTable";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Definisi kolom untuk tabel submissions terbaru
// Didefinisikan di Client Component karena mengandung fungsi 'cell'
// Definisi kolom untuk tabel pengguna
const columns = [
  {
    accessorKey: "name",
    header: "Nama Pengguna",
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.name}
        <p className="text-muted-foreground text-sm">{row.original.email}</p>
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: "Peran",
  },
  {
    accessorKey: "submissionCount",
    header: "Jumlah Pengiriman",
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => (
      <Link href={`/admin/users/${row.original.id}`}>
        <Button variant="outline" size="sm" className="cursor-pointer">
          Lihat Pengiriman
        </Button>
      </Link>
    ),
  },
];

export function UsersTable({ data }) {
  return <DataTable columns={columns} data={data} />;
}
