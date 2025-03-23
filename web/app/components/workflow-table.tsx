import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@remix-run/react";

const data: Workflows[] = [
  {
    id: "m5gr84i9",
    name: "Escalate incident to the collect team if required",
    status: "AVAILABLE",
    lastTriggered: {
      at: "2021-09-01T12:00:00Z",
      status: "SUCCESS",
    },
  },
  {
    id: "3u1reuv4",
    name: "Send a follow-up email to the customer",
    status: "DRAFT",
  },
  {
    id: "derv1ws0",
    name: "Notify the customer of the resolution",
    status: "AVAILABLE",
    lastTriggered: {
      at: "2021-08-31T12:00:00Z",
      status: "FAILURE",
    },
  },
  {
    id: "5kma53ae",
    name: "Create a ticket in the CRM",
    status: "DISABLED",
  },
  {
    id: "bhqecj4p",
    name: "Send a survey to the customer",
    status: "AVAILABLE",
    lastTriggered: {
      at: "2021-08-30T12:00:00Z",
      status: "SUCCESS",
    },
  },
];

type LastTriggered = {
  at: string;
  status: "SUCCESS" | "FAILURE";
};

export type Workflows = {
  id: string;
  name: string;
  status: "AVAILABLE" | "DRAFT" | "DISABLED";
  lastTriggered?: LastTriggered;
};

export const columns: ColumnDef<Workflows>[] = [
  {
    accessorKey: "name",
    header: () => <div>ワークフロー</div>,
    cell: ({ row }) => (
      <Link to={`/app/workflows/${row.id}`}>
        <div>{row.getValue("name")}</div>
      </Link>
    ),
  },
  {
    accessorKey: "status",
    header: () => {
      return <div>ステータス</div>;
    },
    cell: ({ row }) => <div>{row.getValue("status")}</div>,
  },
  {
    accessorKey: "lastTriggered",
    header: () => <div>Last Triggered</div>,
    cell: ({ row }) => {
      const lastTriggered = row.getValue<LastTriggered | undefined>(
        "lastTriggered",
      );
      return lastTriggered ? (
        <div>
          {lastTriggered.at} - {lastTriggered.status}
        </div>
      ) : null;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View payment details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default function WorkflowTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="検索"
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="rounded-sm border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
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
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
