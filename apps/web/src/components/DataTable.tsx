import type { ReactNode } from 'react';

type Column<T> = {
  header: string;
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  rows: T[];
  columns: Column<T>[];
  emptyText?: string;
};

export function DataTable<T>({ rows, columns, emptyText = 'No records found.' }: DataTableProps<T>) {
  return (
    <div className="surface table-card">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.header}>{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>{emptyText}</td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index}>
                  {columns.map((column) => (
                    <td key={column.header}>{column.render(row)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
