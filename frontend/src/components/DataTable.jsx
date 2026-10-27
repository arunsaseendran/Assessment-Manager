import { useState } from 'react';
import { Icons } from './Icons';

export default function DataTable({ title, subtitle, columns, data, actions, onSearch, extraActions }) {
  const [search, setSearch] = useState('');

  const filtered = onSearch
    ? data
    : data.filter((row) =>
        columns.some((col) =>
          String(col.render ? col.render(row) : row[col.key] ?? '').toLowerCase().includes(search.toLowerCase())
        )
      );

  const handleSearch = (v) => {
    setSearch(v);
    if (onSearch) onSearch(v);
  };

  return (
    <div className="table-container">
      <div className="table-toolbar">
        <div className="table-toolbar-left">
          <div className="table-title">{title}</div>
          {subtitle && <div className="table-subtitle">{subtitle}</div>}
        </div>
        <div className="table-toolbar-right">
          <div className="search-wrap">
            <span className="search-icon"><Icons.Search /></span>
            <input
              className="table-search"
              placeholder="Search..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          {extraActions}
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
              {actions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)}>
                  <div className="empty-state">
                    <div className="empty-icon"><Icons.Inbox /></div>
                    <h3>No records found</h3>
                    <p>Try a different search or add new data</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr key={row.id || i}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                  {actions && <td><div className="td-actions">{actions(row)}</div></td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
