export const IconBase = ({ d, className = "", style = {} }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ width: '1em', height: '1em', ...style }}>
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

export const Icons = {
  Dashboard: (props) => <IconBase d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" {...props} />,
  Department: (props) => <IconBase d="M3 21h18 M9 8h1m5 0h1M9 12h1m5 0h1M9 16h1m5 0h1M5 21V7a2 2 0 012-2h10a2 2 0 012 2v14" {...props} />,
  Course: (props) => <IconBase d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" {...props} />,
  Semester: (props) => <IconBase d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" {...props} />,
  Subject: (props) => <IconBase d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" {...props} />,
  Staff: (props) => <IconBase d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" {...props} />,
  Student: (props) => <IconBase d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" {...props} />,
  Report: (props) => <IconBase d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" {...props} />,
  Marks: (props) => <IconBase d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" {...props} />,
  Attendance: (props) => <IconBase d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" {...props} />,
  Logout: (props) => <IconBase d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" {...props} />,
  Edit: (props) => <IconBase d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" {...props} />,
  Delete: (props) => <IconBase d="M3 6h18 M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2 M10 11v6 M14 11v6" {...props} />,
  Plus: (props) => <IconBase d="M12 4v16 M4 12h16" {...props} />,
  Save: (props) => <IconBase d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z M17 21v-8H7v8 M7 3v5h8V3" {...props} />,
  Download: (props) => <IconBase d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3" {...props} />,
  Warning: (props) => <IconBase d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01" {...props} />,
  Check: (props) => <IconBase d="M20 6L9 17l-5-5" {...props} />,
  X: (props) => <IconBase d="M18 6L6 18 M6 6l12 12" {...props} />,
  PieChart: (props) => <IconBase d="M21.21 15.89A10 10 0 118 2.83 M22 12A10 10 0 0012 2v10z" {...props} />,
  BarChart: (props) => <IconBase d="M18 20V10 M12 20V4 M6 20v-6" {...props} />,
  User: (props) => <IconBase d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z" {...props} />,
  Users: (props) => <IconBase d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75" {...props} />,
  Book: (props) => <IconBase d="M4 19.5A2.5 2.5 0 016.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" {...props} />,
  Inbox: (props) => <IconBase d="M22 12h-6l-2 3h-4l-2-3H2 M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" {...props} />,
  ArrowRight: (props) => <IconBase d="M5 12h14 M12 5l7 7-7 7" {...props} />,
  ArrowLeft: (props) => <IconBase d="M19 12H5 M12 19l-7-7 7-7" {...props} />,
  Flask: (props) => <IconBase d="M10 2v7.31L2.03 18.23A2 2 0 003.73 21h16.54a2 2 0 001.7-2.77L14 9.31V2 M8.5 2h7 M14 9l3.4 5.3 M4.6 14.3L8 9" {...props} />,
  Search: (props) => <IconBase d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" {...props} />,
  Award:   (props) => <IconBase d="M12 15l-3 4 1-5-3-3 5-.5L12 2l1.5 3.5 5 .5-3 3 1 5-3-4z M12 22l-2-2m4 0l-2 2" {...props} />,
  Refresh: (props) => <IconBase d="M1 4v6h6 M23 20v-6h-6 M20.49 9A9 9 0 005.64 5.64L1 10 M23 14l-4.64 4.36A9 9 0 013.51 15" {...props} />,
  Sliders: (props) => <IconBase d="M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6" {...props} />,
  Copy:    (props) => <IconBase d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2 M16 8h2a2 2 0 012 2v8a2 2 0 01-2 2h-8a2 2 0 01-2-2v-2" {...props} />,
};
