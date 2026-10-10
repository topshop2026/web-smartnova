import { useEffect, useState, type FormEvent } from 'react';
import { Check, Plus, Save, Trash2, X } from 'lucide-react';
import { supabase, type PortfolioProject } from '@/lib/supabase';
import { getSafeExternalUrl } from '@/lib/business';

type Lead = {
  id: string;
  name: string;
  contact: string;
  project_type: string;
  service_package: string | null;
  budget: string | null;
  target_timeline: string | null;
  summary: string;
  status: 'new' | 'contacted' | 'qualified' | 'closed';
  created_at: string;
};

const emptyProject = {
  title: '',
  summary: '',
  role: '',
  technologies: '',
  outcomes: '',
  image_url: '',
  demo_url: '',
  published: false,
  is_concept: false,
};

const leadStatuses: Lead['status'][] = ['new', 'contacted', 'qualified', 'closed'];

type AdminBusinessPanelProps = {
  section: 'portfolio' | 'leads';
};

export function AdminBusinessPanel({ section }: AdminBusinessPanelProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [leadsError, setLeadsError] = useState('');
  const [projectsError, setProjectsError] = useState('');

  const loadContent = async () => {
    setLoading(true);
    setLeadsError('');
    setProjectsError('');
    const [leadResult, projectResult] = await Promise.all([
      supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('portfolio_projects').select('*').order('created_at', { ascending: false }),
    ]);
    if (leadResult.error) setLeadsError(leadResult.error.message);
    else setLeads((leadResult.data as Lead[] | null) ?? []);
    if (projectResult.error) setProjectsError(projectResult.error.message);
    else setProjects((projectResult.data as PortfolioProject[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => { void loadContent(); }, []);

  const saveLeadStatus = async (lead: Lead, status: Lead['status']) => {
    const { error } = await supabase.from('leads').update({ status }).eq('id', lead.id);
    if (error) {
      setMessage(`Status prospek gagal diperbarui: ${error.message}`);
      return;
    }
    setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, status } : item));
    setMessage('Status prospek diperbarui.');
  };

  const editProject = (project: PortfolioProject) => {
    setEditingId(project.id);
    setShowProjectForm(true);
    setProjectForm({
      title: project.title,
      summary: project.summary,
      role: project.role,
      technologies: project.technologies.join(', '),
      outcomes: project.outcomes.join('\n'),
      image_url: project.image_url ?? '',
      demo_url: project.demo_url ?? '',
      published: project.published,
      is_concept: project.is_concept,
    });
  };

  const resetProjectForm = () => {
    setEditingId(null);
    setProjectForm(emptyProject);
    setShowProjectForm(false);
  };

  const saveProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    const imageUrl = projectForm.image_url.trim();
    const demoUrl = projectForm.demo_url.trim();
    for (const [label, value] of [['Gambar', imageUrl], ['Demo', demoUrl]]) {
      if (!value) continue;
      try {
        const parsedUrl = new URL(value);
        if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') throw new Error('Invalid protocol');
      } catch {
        setMessage(`URL ${label.toLowerCase()} harus berupa alamat HTTP atau HTTPS yang valid.`);
        return;
      }
    }

    setSaving(true);
    const project = {
      title: projectForm.title.trim(),
      summary: projectForm.summary.trim(),
      role: projectForm.role.trim(),
      technologies: projectForm.technologies.split(',').map((item) => item.trim()).filter(Boolean),
      outcomes: projectForm.outcomes.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
      image_url: imageUrl || null,
      demo_url: demoUrl || null,
      published: projectForm.published,
      is_concept: projectForm.is_concept,
    };
    const result = editingId
      ? await supabase.from('portfolio_projects').update(project).eq('id', editingId).select('*').single()
      : await supabase.from('portfolio_projects').insert(project).select('*').single();
    setSaving(false);
    if (result.error) {
      setMessage(`Proyek gagal disimpan: ${result.error.message}`);
      return;
    }
    const saved = result.data as PortfolioProject;
    setProjects((current) => editingId
      ? current.map((item) => item.id === editingId ? saved : item)
      : [saved, ...current]);
    resetProjectForm();
    setMessage('Proyek portofolio berhasil disimpan.');
  };

  const deleteProject = async (project: PortfolioProject) => {
    if (!window.confirm(`Hapus proyek "${project.title}"?`)) return;
    const { error } = await supabase.from('portfolio_projects').delete().eq('id', project.id);
    if (error) {
      setMessage(`Proyek gagal dihapus: ${error.message}`);
      return;
    }
    setProjects((current) => current.filter((item) => item.id !== project.id));
    if (editingId === project.id) resetProjectForm();
    setMessage('Proyek portofolio dihapus.');
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{section === 'portfolio' ? 'Portfolio projects' : 'Service inquiries'}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {section === 'portfolio' ? 'Kelola studi kasus dan proyek yang ditampilkan di portofolio.' : 'Tinjau permintaan konsultasi dan perbarui status prospek.'}
          </p>
        </div>
        <div className="flex gap-2">
          {section === 'portfolio' && (
            <button type="button" onClick={() => { resetProjectForm(); setShowProjectForm(true); }} className="flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800">
              <Plus size={15} /> Tambah proyek
            </button>
          )}
          <button type="button" onClick={() => void loadContent()} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">Muat ulang</button>
        </div>
      </div>
      {message && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900" role="status">{message}</p>}
      {loading ? <p className="text-sm text-slate-500">Memuat data bisnis...</p> : (
        <>
          {section === 'leads' && <div className="overflow-x-auto">
            <h3 className="mb-3 text-base font-semibold text-slate-900">Kotak masuk konsultasi</h3>
            {leadsError ? (
              <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Kotak masuk konsultasi tidak dapat dimuat. Pastikan migrasi database terbaru sudah diterapkan: {leadsError}
              </p>
            ) : leads.length ? (
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead><tr className="border-b border-slate-200 text-slate-500"><th className="p-2">Tanggal</th><th className="p-2">Prospek</th><th className="p-2">Kebutuhan</th><th className="p-2">Ringkasan</th><th className="p-2">Status</th></tr></thead>
                <tbody>{leads.map((lead) => (
                  <tr className="border-b border-slate-100 align-top" key={lead.id}>
                    <td className="whitespace-nowrap p-2 text-slate-500">{new Date(lead.created_at).toLocaleDateString()}</td>
                    <td className="p-2"><strong className="text-slate-800">{lead.name}</strong><span className="mt-1 block text-cyan-800">{lead.contact}</span></td>
                    <td className="p-2 text-slate-600">{lead.service_package || lead.project_type}{lead.budget && <span className="mt-1 block">Anggaran: {lead.budget}</span>}{lead.target_timeline && <span className="block">Target: {lead.target_timeline}</span>}</td>
                    <td className="max-w-xs whitespace-pre-wrap p-2 text-slate-600">{lead.summary}</td>
                    <td className="p-2"><select aria-label={`Status ${lead.name}`} value={lead.status} onChange={(event) => void saveLeadStatus(lead, event.target.value as Lead['status'])} className="rounded border border-slate-300 bg-white p-1.5">{leadStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></td>
                  </tr>
                ))}</tbody>
              </table>
            ) : <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Belum ada permintaan konsultasi.</p>}
          </div>}

          {section === 'portfolio' && <div>
            <div>
              <h3 className="mb-3 text-base font-semibold text-slate-900">Daftar proyek</h3>
              {projectsError ? (
                <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Proyek portofolio tidak dapat dimuat. Pastikan migrasi database terbaru sudah diterapkan: {projectsError}
                </p>
              ) : projects.length ? <div className="grid gap-3 sm:grid-cols-2">{projects.map((project) => (
                <article className="rounded-lg border border-slate-200 p-3" key={project.id}>
                  <div className="flex items-start justify-between gap-3"><div><h4 className="font-semibold text-slate-800">{project.title}</h4><p className="mt-1 text-xs text-slate-500">{project.is_concept ? 'Demo konsep — bukan proyek klien' : project.published ? 'Dipublikasikan' : 'Draf'}</p></div><div className="flex gap-1"><button type="button" onClick={() => editProject(project)} className="rounded border border-slate-300 px-2 py-1 text-xs">Edit</button><button type="button" aria-label={`Hapus ${project.title}`} onClick={() => void deleteProject(project)} className="rounded border border-rose-200 p-1 text-rose-700"><Trash2 size={14} /></button></div></div>
                  <p className="mt-2 line-clamp-3 text-xs text-slate-600">{project.summary}</p>
                  {getSafeExternalUrl(project.demo_url) && <a href={getSafeExternalUrl(project.demo_url) ?? undefined} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-xs font-semibold text-cyan-800">Buka demo ↗</a>}
                </article>
              ))}</div> : <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Belum ada proyek. Tambahkan studi kasus dengan informasi yang sudah diverifikasi.</p>}
            </div>
          </div>}
          {section === 'portfolio' && showProjectForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <form className="grid max-h-[90vh] w-full max-w-2xl content-start gap-3 overflow-y-auto rounded-xl bg-white p-5 shadow-xl" onSubmit={saveProject}>
              <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold text-slate-900">{editingId ? <Save size={16} /> : <Plus size={17} />}{editingId ? 'Edit proyek' : 'Tambah proyek'}</h3>
              <button type="button" onClick={resetProjectForm} aria-label="Tutup formulir" className="rounded p-1 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
              </div>
              <label className="grid gap-1 text-xs font-medium text-slate-600">Judul<input required maxLength={160} value={projectForm.title} onChange={(event) => setProjectForm({ ...projectForm, title: event.target.value })} className="rounded border border-slate-300 bg-white p-2 text-sm" /></label>
              <label className="grid gap-1 text-xs font-medium text-slate-600">Ringkasan<textarea required minLength={10} maxLength={1200} rows={3} value={projectForm.summary} onChange={(event) => setProjectForm({ ...projectForm, summary: event.target.value })} className="rounded border border-slate-300 bg-white p-2 text-sm" /></label>
              <label className="grid gap-1 text-xs font-medium text-slate-600">Peran SmartNova<input required maxLength={160} value={projectForm.role} onChange={(event) => setProjectForm({ ...projectForm, role: event.target.value })} className="rounded border border-slate-300 bg-white p-2 text-sm" /></label>
              <label className="grid gap-1 text-xs font-medium text-slate-600">Teknologi (pisahkan dengan koma)<input value={projectForm.technologies} onChange={(event) => setProjectForm({ ...projectForm, technologies: event.target.value })} className="rounded border border-slate-300 bg-white p-2 text-sm" /></label>
              <label className="grid gap-1 text-xs font-medium text-slate-600">Hasil terverifikasi (satu per baris)<textarea rows={3} value={projectForm.outcomes} onChange={(event) => setProjectForm({ ...projectForm, outcomes: event.target.value })} className="rounded border border-slate-300 bg-white p-2 text-sm" /></label>
              <label className="grid gap-1 text-xs font-medium text-slate-600">URL gambar (opsional)<input type="url" value={projectForm.image_url} onChange={(event) => setProjectForm({ ...projectForm, image_url: event.target.value })} className="rounded border border-slate-300 bg-white p-2 text-sm" /></label>
              <label className="grid gap-1 text-xs font-medium text-slate-600">URL website atau demo (opsional)<input type="url" placeholder="https://..." value={projectForm.demo_url} onChange={(event) => setProjectForm({ ...projectForm, demo_url: event.target.value })} className="rounded border border-slate-300 bg-white p-2 text-sm" /></label>
              <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={projectForm.is_concept} onChange={(event) => setProjectForm({ ...projectForm, is_concept: event.target.checked })} />Tandai sebagai demo konsep, bukan proyek klien.</label>
              <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={projectForm.published} onChange={(event) => setProjectForm({ ...projectForm, published: event.target.checked })} />Saya sudah memastikan informasi ini boleh dipublikasikan.</label>
              <div className="flex flex-wrap gap-2"><button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"><Check size={14} />{saving ? 'Menyimpan...' : 'Simpan proyek'}</button>{editingId && <button type="button" onClick={resetProjectForm} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">Batal</button>}</div>
            </form>
            </div>
          )}
        </>
      )}
    </section>
  );
}
