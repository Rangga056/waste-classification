"use client";

import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ExternalLink, ArrowUpDown } from "lucide-react";

export function AdminSubmissionsTable({ data }) {
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState([]);

  const columns = [
    {
      accessorKey: "username",
      header: "Nama Pengguna",
      cell: ({ row }) => (
        <div className="font-medium text-slate-800">
          {row.original.username}
          {row.original.user?.email && (
            <p className="text-muted-foreground text-xs">{row.original.user.email}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "uploadedAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4 h-8 data-[state=open]:bg-accent"
          >
            Tanggal Unggah
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
         <div className="text-slate-600">
            {new Date(row.original.uploadedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
         </div>
      ),
    },
    {
      accessorKey: "classificationResult",
      header: "Hasil Klasifikasi",
      cell: ({ row }) => {
         const val = row.original.classificationResult;
         if (!val) return <span className="text-slate-400 italic">Processing</span>;
         return <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-md text-xs uppercase tracking-wider">{val}</span>;
      },
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <Link href={`/submissions/${row.original.id}`}>
          <Button variant="outline" size="sm" className="w-fit text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors">
            Lihat Detail
            <ExternalLink className="ml-2 w-4 h-4" />
          </Button>
        </Link>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      globalFilter,
      columnFilters,
    },
  });

  return (
    <div className="space-y-4">
      {/* FILTERING CONTROLS */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
        <Input
          placeholder="Cari pengguna atau status..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(String(event.target.value))}
          className="max-w-sm border-slate-200 h-10 shadow-sm"
        />
        
        <select
          value={table.getColumn("classificationResult")?.getFilterValue() ?? ""}
          onChange={(event) =>
            table.getColumn("classificationResult")?.setFilterValue(event.target.value)
          }
          className="h-10 border border-slate-200 rounded-md px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 bg-white min-w-[200px]"
        >
          <option value="">Semua Kategori</option>
          <option value="Organik">Organik</option>
          <option value="Plastik">Plastik Daur Ulang</option>
          <option value="Kertas">Kertas Daur Ulang</option>
          <option value="Kaca">Kaca Daur Ulang</option>
          <option value="Logam">Logam Daur Ulang</option>
          <option value="Sampah Lainnya">Sampah Lainnya</option>
          <option value="Tidak Ada Sampah">Tidak Ada Sampah</option>
        </select>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/80">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-slate-100">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-slate-600 font-bold py-3">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-slate-500">
                  Tidak ada data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between px-2 pt-2">
         <div className="text-sm text-slate-500">
            Menampilkan {table.getRowModel().rows.length} iterasi dari total data.
         </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="border-slate-200"
          >
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="border-slate-200"
          >
            Selanjutnya
          </Button>
        </div>
      </div>
    </div>
  );
}
