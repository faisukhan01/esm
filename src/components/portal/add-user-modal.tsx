'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function AddUserModal({ open, onClose, role, instituteId, branchId, onCreated }: any) {
  const [form, setForm] = useState({ name: '', email: '', subjects: '', classes: '', class: 'Grade 8', section: 'A' });
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<any>(null);

  const submit = async () => {
    if (!form.name || !form.email) { toast({ title: 'Name and email required', variant: 'destructive' }); return; }
    setCreating(true);
    try {
      const body: any = { name: form.name, email: form.email, role, instituteId, branchId };
      if (role === 'teacher') { body.subjects = form.subjects.split(',').map((s:string)=>s.trim()).filter(Boolean); body.classes = form.classes.split(',').map((s:string)=>s.trim()).filter(Boolean); }
      if (role === 'student') { body.class = form.class; body.section = form.section; }
      const res = await api.createPlatformUser(body);
      setCreated(res);
      onCreated();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setCreating(false); }
  };

  if (!open) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50" onClick={() => { onClose(); setCreated(null); }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-md">
        <Card className="p-6">
          {created ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-emerald-500/15 grid place-items-center"><CheckCircle2 className="h-6 w-6 text-emerald-600" /></div>
                <div><h3 className="font-display font-bold text-lg">{role === 'teacher' ? 'Teacher' : 'Student'} added!</h3><p className="text-sm text-muted-foreground">{created.user.name}</p></div>
              </div>
              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4 space-y-2 text-sm">
                <div className="font-semibold text-emerald-700 dark:text-emerald-300">Login credentials</div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Email</span><span className="font-mono text-xs">{created.user.email}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Password</span><span className="font-mono">{created.defaultPassword}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Portal</span><span className="font-medium capitalize">{role.replace('-',' ')}</span></div>
              </div>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white w-full mt-5" onClick={() => { onClose(); setCreated(null); }}>Done</Button>
            </>
          ) : (
            <>
              <h3 className="font-display font-bold text-lg mb-1">Add {role === 'teacher' ? 'Teacher' : 'Student'}</h3>
              <p className="text-sm text-muted-foreground mb-5">A login will be auto-created (password <span className="font-mono">esm123</span>)</p>
              <div className="space-y-3">
                <div><Label>Full name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={role === 'teacher' ? 'Ms. Olivia Davis' : 'Aiden Carter'} className="mt-1" /></div>
                <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder={role === 'teacher' ? 'teacher.davis@school.edu' : 'aiden@student.school.edu'} className="mt-1" /></div>
                {role === 'teacher' ? (
                  <>
                    <div><Label>Subjects (comma-separated)</Label><Input value={form.subjects} onChange={e => setForm({ ...form, subjects: e.target.value })} placeholder="Mathematics, Physics" className="mt-1" /></div>
                    <div><Label>Classes (comma-separated)</Label><Input value={form.classes} onChange={e => setForm({ ...form, classes: e.target.value })} placeholder="Grade 8, Grade 9" className="mt-1" /></div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Class</Label><Input value={form.class} onChange={e => setForm({ ...form, class: e.target.value })} className="mt-1" /></div>
                    <div><Label>Section</Label><Input value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} className="mt-1" /></div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-5">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1" disabled={creating} onClick={submit}>{creating ? 'Adding…' : 'Add ' + (role === 'teacher' ? 'Teacher' : 'Student')}</Button>
                <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
