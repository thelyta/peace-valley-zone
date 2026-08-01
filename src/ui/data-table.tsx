"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { EmptyState, Skeleton } from "./feedback";
import { Icon } from "./icon";

export type ServerTableProps<T> = {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  total: number;
  loading?: boolean;
  empty: string;
  error?: string;
  onRetry?: () => void;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  getRowId: (row: T) => string;
  mobileCard?: (row: T) => ReactNode;
};

export function ServerDataTable<T>({
  columns,
  data,
  total,
  loading,
  empty,
  error,
  onRetry,
  pagination,
  onPaginationChange,
  sorting = [],
  onSortingChange,
  getRowId,
  mobileCard,
}: ServerTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    rowCount: total,
    state: { pagination, sorting },
    onPaginationChange,
    onSortingChange,
    manualPagination: true,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => getRowId(row),
  });

  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize));
  const from = total === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const to = Math.min(total, (pagination.pageIndex + 1) * pagination.pageSize);

  if (loading) {
    return <Skeleton className="h-56 w-full" />;
  }
  if (error) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-destructive/25 bg-destructive/10 p-4 text-destructive"
      >
        {error}
        {onRetry ? (
          <button type="button" className="ml-3 underline" onClick={onRetry}>
            Try again
          </button>
        ) : null}
      </div>
    );
  }
  if (!data.length) {
    return <EmptyState title={empty} />;
  }

  return (
    <div className="space-y-3">
      {mobileCard ? (
        <div className="space-y-3 md:hidden">
          {data.map((row) => (
            <div key={getRowId(row)}>{mobileCard(row)}</div>
          ))}
        </div>
      ) : null}
      <div
        className={cn(
          "overflow-x-auto rounded-lg border border-border bg-card",
          mobileCard ? "hidden md:block" : "",
        )}
      >
        <table className="w-full text-left text-sm">
          <thead className="bg-primary text-primary-foreground">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      className="px-4 py-3 text-base font-semibold text-primary-foreground"
                      key={header.id}
                      scope="col"
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          className="inline-flex min-h-11 items-center gap-1.5 text-primary-foreground"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <Icon
                            icon={
                              sorted === "asc"
                                ? ChevronUp
                                : sorted === "desc"
                                  ? ChevronDown
                                  : ChevronsUpDown
                            }
                            size={16}
                            className="text-primary-foreground/80"
                          />
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr className="border-t border-border" key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td className="px-4 py-3 align-top text-foreground" key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <p aria-live="polite">
          Showing {from}–{to} of {total}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            Previous
          </Button>
          <span>
            Page {pagination.pageIndex + 1} of {pageCount}
          </span>
          <Button
            variant="outline"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Simple non-paginated table for small lists. */
export function DataTable({
  headings,
  rows,
  loading,
  empty,
}: {
  headings: string[];
  rows: Array<{ key: string; cells: ReactNode[] }>;
  loading?: boolean;
  empty: string;
}) {
  if (loading) {
    return <Skeleton className="h-56 w-full" />;
  }
  if (!rows.length) {
    return <EmptyState title={empty} />;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead className="bg-primary text-primary-foreground">
          <tr>
            {headings.map((heading) => (
              <th
                className="px-4 py-3 text-base font-semibold text-primary-foreground"
                key={heading}
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="border-t border-border" key={row.key}>
              {row.cells.map((cell, cellIndex) => (
                <td className="px-4 py-3" key={`${row.key}-${headings[cellIndex] ?? cellIndex}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
