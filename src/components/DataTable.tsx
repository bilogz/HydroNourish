import React from 'react';

interface DataTableProps {
  headers: string[];
  children: React.ReactNode;
  emptyText?: string;
  isEmpty?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  headers,
  children,
  emptyText = 'No records found.',
  isEmpty = false
}) => {
  return (
    <div className="clinic-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              {headers.map((header, idx) => (
                <th key={idx} className="px-5 py-3.5 whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isEmpty ? (
              <tr>
                <td colSpan={(headers ?? []).length} className="px-5 py-8 text-center text-slate-400 text-sm">
                  {emptyText}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
