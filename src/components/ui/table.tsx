import * as React from "react"
export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(({ ...props }, ref) => (
  <table ref={ref} className="w-full caption-bottom text-sm" {...props} />
))
Table.displayName = "Table"
export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ ...props }, ref) => (
  <thead ref={ref} {...props} />
))
TableHeader.displayName = "TableHeader"
export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ ...props }, ref) => (
  <tbody ref={ref} {...props} />
))
TableBody.displayName = "TableBody"
export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(({ ...props }, ref) => (
  <tr ref={ref} {...props} />
))
TableRow.displayName = "TableRow"
export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(({ ...props }, ref) => (
  <th ref={ref} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground" {...props} />
))
TableHead.displayName = "TableHead"
export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(({ ...props }, ref) => (
  <td ref={ref} className="p-4 align-middle" {...props} />
))
TableCell.displayName = "TableCell"
