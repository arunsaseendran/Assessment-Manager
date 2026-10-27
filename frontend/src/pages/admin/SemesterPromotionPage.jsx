import { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

export default function SemesterPromotionPage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [previewModal, setPreviewModal] = useState(false);
  const [resultModal, setResultModal] = useState(false);
  const [result, setResult] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    api.get('/api/courses/')
      .then(r => { setCourses(r.data); if (r.data.length > 0) setSelectedCourse(String(r.data[0].id)); })
      .finally(() => setLoadingCourses(false));
  }, []);

  const handlePreview = async () => {
    if (!selectedCourse) return;
    setPreviewing(true);
    setPreview(null);
    try {
      const res = await api.get(`/api/promote-semester/preview/?course_id=${selectedCourse}`);
      setPreview(res.data);
      setPreviewModal(true);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to load preview');
    } finally {
      setPreviewing(false);
    }
  };

  const handlePromote = async () => {
    setPromoting(true);
    try {
      const res = await api.post('/api/promote-semester/', { course_id: parseInt(selectedCourse) });
      setResult(res.data);
      setPreviewModal(false);
      setPreview(null);
      setResultModal(true);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Promotion failed');
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div className="page-title">
          <div className="breadcrumb">
            <span>Admin</span>
            <span className="sep">›</span>
            <span className="current">Semester Promotion</span>
          </div>
          <h1>Semester Promotion</h1>
          <p>Cascade-promote all students in a course to their next semester in one click</p>
        </div>
      </div>

      {/* Info card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(108,99,255,0.12), rgba(108,99,255,0.04))',
        border: '1px solid rgba(108,99,255,0.3)',
        borderRadius: 14,
        padding: '20px 24px',
        marginBottom: 24,
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
      }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28, color: 'var(--accent)', flexShrink: 0 }}>
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        </svg>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>How Semester Promotion Works</div>
          <ul style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.8, margin: 0, paddingLeft: 18 }}>
            <li>All active students in <strong>every semester</strong> of the selected course move up by one simultaneously</li>
            <li>Students in the <strong>final semester</strong> are automatically marked as <strong>Graduated</strong> — their data is preserved, not deleted</li>
            <li>All historical marks &amp; attendance records are <strong>never deleted</strong></li>
            <li>Semester 1 will be left empty, ready for new student admissions</li>
            <li>A full preview is shown <strong>before</strong> any changes are made</li>
          </ul>
        </div>
      </div>

      {/* Action card */}
      <div className="card" style={{ padding: '28px 32px', maxWidth: 540 }}>
        <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 18, color: 'var(--text-primary)' }}>
          Select Course to Promote
        </div>
        <div className="form-group" style={{ marginBottom: 24 }}>
          <label className="form-label">Course</label>
          {loadingCourses ? (
            <div className="spinner" style={{ width: 20, height: 20 }} />
          ) : courses.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No courses found. Add a course first.</div>
          ) : (
            <select className="form-select" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          )}
        </div>
        <button
          className="btn btn-primary"
          onClick={handlePreview}
          disabled={!selectedCourse || previewing}
          style={{ width: '100%', justifyContent: 'center', gap: 10, fontSize: 15, padding: '12px 0' }}
        >
          {previewing
            ? <><div className="spinner" style={{ width: 18, height: 18, borderTopColor: '#fff' }} /> Loading Preview...</>
            : <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                Preview Promotion
              </>
          }
        </button>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 10, textAlign: 'center' }}>
          A detailed preview will be shown before any changes are committed.
        </p>
      </div>

      {/* Preview Modal */}
      <Modal isOpen={previewModal} onClose={() => setPreviewModal(false)} title={`Promotion Preview — ${preview?.course_name || ''}`}>
        {preview && (
          <div>
            {/* Summary */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <div style={{ flex: 1, background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>{preview.total_promoting}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Students Promoting</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#10b981' }}>{preview.total_graduating}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Students Graduating</div>
              </div>
            </div>

            {/* Movement list */}
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13, marginBottom: 10 }}>SEMESTER MOVEMENTS</div>
            {preview.movements.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '12px 0 20px' }}>No active students found in any semester.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {preview.movements.map((m, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: m.action === 'graduate' ? 'rgba(16,185,129,0.06)' : 'rgba(108,99,255,0.06)',
                    borderRadius: 8, padding: '10px 14px',
                    border: m.action === 'graduate' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(108,99,255,0.15)',
                  }}>
                    <span style={{
                      background: m.action === 'graduate' ? '#10b981' : 'var(--accent)',
                      color: '#fff', fontWeight: 700, borderRadius: 6, padding: '3px 10px', fontSize: 13, minWidth: 60, textAlign: 'center',
                    }}>Sem {m.from_semester}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>→</span>
                    {m.action === 'graduate' ? (
                      <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 700, borderRadius: 6, padding: '3px 10px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                          <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 2.7 3 6 3s6-1 6-3v-5" />
                        </svg>
                        Graduate
                      </span>
                    ) : (
                      <span style={{ background: 'rgba(108,99,255,0.15)', color: 'var(--accent)', fontWeight: 700, borderRadius: 6, padding: '3px 10px', fontSize: 13 }}>Sem {m.to_semester}</span>
                    )}
                    <span style={{ marginLeft: 'auto', fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>
                      {m.count} student{m.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Graduating students list */}
            {preview.graduating.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13, marginBottom: 10 }}>GRADUATING STUDENTS</div>
                <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, maxHeight: 200, overflowY: 'auto' }}>
                  {preview.graduating.map((s, i) => (
                    <div key={s.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px',
                      borderBottom: i < preview.graduating.length - 1 ? '1px solid rgba(16,185,129,0.12)' : 'none',
                    }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, color: '#10b981' }}>
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 2.7 3 6 3s6-1 6-3v-5" />
                      </svg>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{s.full_name}</span>
                      <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 600 }}>{s.roll_number}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warning */}
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '11px 14px', marginBottom: 20, fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" style={{ width: 16, height: 16, flexShrink: 0 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01" />
              </svg>
              <span><strong style={{ color: '#f59e0b' }}>This action cannot be undone.</strong> All historical marks and attendance data are preserved.</span>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPreviewModal(false)} disabled={promoting}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handlePromote}
                disabled={promoting || (preview.total_promoting === 0 && preview.total_graduating === 0)}
                style={{ minWidth: 160, justifyContent: 'center' }}
              >
                {promoting
                  ? <><div className="spinner" style={{ width: 16, height: 16, borderTopColor: '#fff' }} /> Promoting...</>
                  : <>Confirm Promotion</>
                }
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Result Modal */}
      <Modal isOpen={resultModal} onClose={() => setResultModal(false)} title="Promotion Complete">
        {result && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 56, height: 56, margin: '0 auto 16px', display: 'block' }}>
              <circle cx="12" cy="8" r="7" />
              <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
            </svg>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Promotion Successful!</div>
            <div style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 15 }}>{result.message}</div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 28 }}>
              <div style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 12, padding: '16px 28px' }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--accent)' }}>{result.promoted}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Promoted</div>
              </div>
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: '16px 28px' }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: '#10b981' }}>{result.graduated}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Graduated</div>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => setResultModal(false)} style={{ minWidth: 140 }}>Done</button>
          </div>
        )}
      </Modal>
    </div>
  );
}


