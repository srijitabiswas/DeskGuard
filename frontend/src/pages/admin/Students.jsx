import React, { useState, useMemo } from 'react';
import { Search, Plus, Upload, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card, Badge, Button, Input, Modal, Select, Avatar, EmptyState, SectionHeader } from '../../components/ui/index';
import { DEPARTMENTS } from '../../data/mockData';
import { getTrustTier, generateId } from '../../utils/helpers';
import { studentsAPI } from '../../utils/api';

const INIT = { name: '', email: '', id: '', dept: '', year: '1' };

export default function AdminStudents() {
  const { state, dispatch, toast, apiMode } = useApp();
  const [q, setQ]             = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm]       = useState(INIT);
  const [errors, setErrors]   = useState({});
  const [expandId, setExpandId] = useState(null);

  const students = state.students;

  const filtered = useMemo(() => {
    return students.filter(s => {
      const matchQ = !q.trim() || s.name.toLowerCase().includes(q.toLowerCase()) || s.id.toLowerCase().includes(q.toLowerCase()) || s.email.toLowerCase().includes(q.toLowerCase());
      const matchDept = !filterDept || s.dept === filterDept;
      const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? s.activated : !s.activated);
      return matchQ && matchDept && matchStatus;
    });
  }, [students, q, filterDept, filterStatus]);

  function validate() {
    const e = {};
    if (!form.name.trim())  e.name  = 'Name is required';
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'Valid email required';
    if (!form.id.trim())    e.id    = 'Student ID required';
    if (!form.dept)         e.dept  = 'Department required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleAdd() {
    if (!validate()) return;
    if (students.find(s => s.id === form.id)) { setErrors({ id: 'Student ID already exists' }); return; }

    if (apiMode) {
      try {
        const res = await studentsAPI.create({ studentId: form.id, name: form.name, email: form.email, dept: form.dept, year: parseInt(form.year) });
        const s = res.data;
        dispatch({ type: 'ADD_STUDENT', student: {
          ...s, id: s.studentId, avatar: s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        }});
        toast(`${form.name} added successfully.`, 'success');
        setForm(INIT);
        setAddOpen(false);
      } catch (err) {
        toast(err.message || 'Could not add student.', 'error');
      }
      return;
    }

    const newStu = {
      ...form,
      year: parseInt(form.year),
      avatar: form.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
      trustScore: 60,
      activated: false,
      password: null,
    };
    dispatch({ type: 'ADD_STUDENT', student: newStu });
    toast(`${form.name} added successfully.`, 'success');
    setForm(INIT);
    setAddOpen(false);
  }

  function handleImport() {
    toast('CSV import: In production this opens a file picker and parses the spreadsheet.', 'info');
  }

  const field = (key) => ({
    value: form[key],
    onChange: e => setForm(f => ({ ...f, [key]: e.target.value })),
    error: errors[key],
  });

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-t1">Students</h1>
          <p className="text-sm text-t3 mt-0.5">{students.length} total · {students.filter(s => s.activated).length} activated</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<Upload size={14} />} onClick={handleImport}>Import</Button>
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>Add Student</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Input placeholder="Search name, ID, email…" value={q} onChange={e => setQ(e.target.value)} icon={<Search size={15} />} className="flex-1" />
        <select
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="h-10 rounded-xl border border-border px-3 text-sm text-t2 bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="all">All</option>
          <option value="active">Activated</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {filterDept && (
        <div className="flex items-center gap-2">
          <Badge variant="blue">{filterDept}</Badge>
          <button onClick={() => setFilterDept('')} className="text-xs text-t3 hover:text-t1">✕ Clear</button>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total', val: students.length },
          { label: 'Activated', val: students.filter(s => s.activated).length },
          { label: 'Pending', val: students.filter(s => !s.activated).length },
        ].map(({ label, val }) => (
          <Card key={label} padding="sm" className="text-center">
            <p className="text-xl font-bold text-t1">{val}</p>
            <p className="text-xs text-t3">{label}</p>
          </Card>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState icon="🎓" title="No students found" body="Try adjusting your search filters." />
      ) : (
        <div className="space-y-2">
          {filtered.map(stu => {
            const tier = getTrustTier(stu.trustScore);
            const expanded = expandId === stu.id;
            return (
              <Card key={stu.id} padding="md" hover onClick={() => setExpandId(expanded ? null : stu.id)}>
                <div className="flex items-center gap-3">
                  <Avatar name={stu.name} initials={stu.avatar} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-t1 text-sm truncate">{stu.name}</p>
                      <Badge variant={stu.activated ? 'green' : 'yellow'} size="xs">
                        {stu.activated ? 'Active' : 'Pending'}
                      </Badge>
                    </div>
                    <p className="text-xs text-t3 truncate">{stu.id} · {stu.dept} · Y{stu.year}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-t1">{stu.trustScore}</p>
                      <p className="text-2xs" style={{ color: tier.color }}>{tier.label}</p>
                    </div>
                    <ChevronDown size={16} className={`text-t3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                {expanded && (
                  <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2 text-xs" onClick={e => e.stopPropagation()}>
                    <div><p className="text-t3">Email</p><p className="font-medium text-t1 truncate">{stu.email}</p></div>
                    <div><p className="text-t3">Trust Score</p><p className="font-medium" style={{ color: tier.color }}>{stu.trustScore} — {tier.label}</p></div>
                    <div><p className="text-t3">Department</p><p className="font-medium text-t1">{stu.dept}</p></div>
                    <div><p className="text-t3">Year</p><p className="font-medium text-t1">Year {stu.year}</p></div>
                    <div className="col-span-2">
                      <button
                        onClick={() => setFilterDept(stu.dept)}
                        className="text-accent hover:underline"
                      >Filter by {stu.dept}</button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Student Modal */}
      <Modal open={addOpen} onClose={() => { setAddOpen(false); setForm(INIT); setErrors({}); }} title="Add New Student" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Full Name" placeholder="e.g. Priya Sharma" {...field('name')} className="col-span-2" />
            <Input label="Student ID" placeholder="e.g. STU2024013" {...field('id')} />
            <Select label="Year" value={form.year} onChange={v => setForm(f => ({ ...f, year: v }))}
              options={[1,2,3,4,5].map(y => ({ value: String(y), label: `Year ${y}` }))} />
            <Input label="Email" type="email" placeholder="student@uni.edu" {...field('email')} className="col-span-2" />
            <Select label="Department" placeholder="Select department" value={form.dept}
              onChange={v => setForm(f => ({ ...f, dept: v }))}
              options={DEPARTMENTS.map(d => ({ value: d, label: d }))}
              error={errors.dept} className="col-span-2" />
          </div>
          <p className="text-xs text-t3 bg-s2 px-3 py-2.5 rounded-xl">
            📧 The student will receive an email with their Student ID and instructions to activate their account.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { setAddOpen(false); setForm(INIT); setErrors({}); }} className="flex-1">Cancel</Button>
            <Button onClick={handleAdd} className="flex-1">Add Student</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
