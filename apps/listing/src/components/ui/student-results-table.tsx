"use client"

import * as React from "react"
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export type Student = {
  id: string
  name: string
  email: string
  enrollmentDate: string
}

export type StudentResult = {
  id: string
  name: string
  email: string
  enrollmentDate: string
  subjects: {
    name: string
    score: number
    grade: string
  }[]
  totalScore: number
  percentage: number
  gpa: number
  status: "Pass" | "Fail"
}

// Sample student data
const studentsData: Student[] = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@example.com",
    enrollmentDate: "2024-01-15",
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob@example.com",
    enrollmentDate: "2024-01-15",
  },
  {
    id: "3",
    name: "Carol Williams",
    email: "carol@example.com",
    enrollmentDate: "2024-01-15",
  },
  {
    id: "4",
    name: "David Brown",
    email: "david@example.com",
    enrollmentDate: "2024-01-15",
  },
  {
    id: "5",
    name: "Emma Davis",
    email: "emma@example.com",
    enrollmentDate: "2024-01-15",
  },
]

// Sample results data - matching student IDs
const resultsData: Record<string, StudentResult> = {
  "1": {
    id: "1",
    name: "Alice Johnson",
    email: "alice@example.com",
    enrollmentDate: "2024-01-15",
    subjects: [
      { name: "Mathematics", score: 95, grade: "A+" },
      { name: "Physics", score: 88, grade: "A" },
      { name: "Chemistry", score: 92, grade: "A" },
      { name: "English", score: 86, grade: "B+" },
    ],
    totalScore: 361,
    percentage: 90.25,
    gpa: 3.95,
    status: "Pass",
  },
  "2": {
    id: "2",
    name: "Bob Smith",
    email: "bob@example.com",
    enrollmentDate: "2024-01-15",
    subjects: [
      { name: "Mathematics", score: 78, grade: "B" },
      { name: "Physics", score: 82, grade: "B+" },
      { name: "Chemistry", score: 75, grade: "B" },
      { name: "English", score: 80, grade: "B" },
    ],
    totalScore: 315,
    percentage: 78.75,
    gpa: 3.0,
    status: "Pass",
  },
  "3": {
    id: "3",
    name: "Carol Williams",
    email: "carol@example.com",
    enrollmentDate: "2024-01-15",
    subjects: [
      { name: "Mathematics", score: 92, grade: "A" },
      { name: "Physics", score: 90, grade: "A" },
      { name: "Chemistry", score: 94, grade: "A+" },
      { name: "English", score: 88, grade: "A" },
    ],
    totalScore: 364,
    percentage: 91.0,
    gpa: 4.0,
    status: "Pass",
  },
  "4": {
    id: "4",
    name: "David Brown",
    email: "david@example.com",
    enrollmentDate: "2024-01-15",
    subjects: [
      { name: "Mathematics", score: 65, grade: "C" },
      { name: "Physics", score: 58, grade: "C" },
      { name: "Chemistry", score: 62, grade: "C" },
      { name: "English", score: 60, grade: "C" },
    ],
    totalScore: 245,
    percentage: 61.25,
    gpa: 2.0,
    status: "Fail",
  },
  "5": {
    id: "5",
    name: "Emma Davis",
    email: "emma@example.com",
    enrollmentDate: "2024-01-15",
    subjects: [
      { name: "Mathematics", score: 88, grade: "A" },
      { name: "Physics", score: 85, grade: "B+" },
      { name: "Chemistry", score: 89, grade: "A" },
      { name: "English", score: 87, grade: "A" },
    ],
    totalScore: 349,
    percentage: 87.25,
    gpa: 3.75,
    status: "Pass",
  },
}

const columns: ColumnDef<Student>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("email")}</div>,
  },
  {
    accessorKey: "enrollmentDate",
    header: "Enrollment Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("enrollmentDate") as string)
      return <div>{date.toLocaleDateString()}</div>
    },
  },
]

export function StudentResultsTable() {
  const table = useReactTable({
    data: studentsData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const handleRowClick = (studentId: string) => {
    // TODO: Implement row click handler
    console.log("Student clicked:", studentId)
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => handleRowClick(row.original.id)}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
