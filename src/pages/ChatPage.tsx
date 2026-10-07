import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowLeft, ArrowUpRight, Camera, FileText, Image as ImageIcon, MessageCircle, Plus, Send, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';

type Conversation = {
  id: string;
  customer_id: string;
  customer_email: string;
  product_id: string;
  product_name: string;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
};

type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  attachments: ChatAttachment[];
  created_at: string;
};

type ChatAttachment = {
  path: string;
  name: string;
  contentType: string;
  size: number;
  signedUrl?: string;
};

type ChatPageProps = {
  productId?: string;
  onBack: () => void;
  onSignIn: () => void;
  onProductOpen: (productId: string) => void;
};

const ATTACHMENT_BUCKET = 'support-chat-attachments';
const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/heic', 'image/heif',
  'application/pdf', 'text/plain', 'text/csv', 'application/rtf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

export function ChatPage({ productId, onBack, onSignIn, onProductOpen }: ChatPageProps) {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const isAdmin = user?.app_metadata.role === 'admin';
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    let active = true;
    const loadConversations = async () => {
      let query = supabase
        .from('support_conversations')
        .select('id, customer_id, customer_email, product_id, product_name, status, created_at, updated_at')
        .order('updated_at', { ascending: false });
      if (!isAdmin) query = query.eq('customer_id', user.id);
      const { data, error: queryError } = await query;
      if (!active) return;
      if (queryError) setError('Percakapan tidak dapat dimuat. Pastikan migration chat sudah diterapkan.');
      const nextConversations = (data as Conversation[] | null) ?? [];
      setConversations(nextConversations);
      setActiveConversationId((current) => current
        ?? nextConversations.find((conversation) => conversation.product_id === productId)?.id
        ?? nextConversations[0]?.id
        ?? null
      );
      setLoading(false);
    };

    void loadConversations();
    const intervalId = window.setInterval(() => void loadConversations(), 5000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [user, isAdmin, productId]);

  useEffect(() => {
    if (!user || !activeConversationId) {
      setMessages([]);
      return;
    }

    let active = true;
    let previousMessageIds: string | null = null;
    const loadMessages = async () => {
      const { data, error: queryError } = await supabase
        .from('support_messages')
        .select('id, conversation_id, sender_id, body, attachments, created_at')
        .eq('conversation_id', activeConversationId)
        .order('created_at', { ascending: true });
      if (!active) return;
      if (queryError) setError('Pesan tidak dapat dimuat.');
      else {
        const nextMessages = (data as ChatMessage[] | null) ?? [];
        const messageIds = nextMessages.map((message) => message.id).join(',');
        if (messageIds === previousMessageIds) return;
        previousMessageIds = messageIds;
        const messagesWithLinks = await Promise.all(nextMessages.map(async (message) => {
          const attachments = await Promise.all((message.attachments ?? []).map(async (attachment) => {
            const { data: link } = await supabase.storage
              .from(ATTACHMENT_BUCKET)
              .createSignedUrl(attachment.path, 86400);
            return { ...attachment, signedUrl: link?.signedUrl };
          }));
          return { ...message, attachments };
        }));
        if (active) setMessages(messagesWithLinks);
      }
    };

    void loadMessages();
    const intervalId = window.setInterval(() => void loadMessages(), 3000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [user, activeConversationId]);

  const startConversation = async () => {
    if (!user || !productId) return;
    setError('');
    const { data, error: insertError } = await supabase
      .from('support_conversations')
      .insert({
        customer_id: user.id,
        customer_email: user.email,
        product_id: productId,
      })
      .select('id, customer_id, customer_email, product_id, product_name, status, created_at, updated_at')
      .single();
    if (insertError || !data) {
      setError('Chat tidak dapat dimulai. Silakan coba lagi.');
      return;
    }
    const conversation = data as Conversation;
    setConversations((current) => [conversation, ...current]);
    setActiveConversationId(conversation.id);
  };

  const addFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = '';
    setAttachmentMenuOpen(false);
    setError('');

    const validFiles: File[] = [];
    for (const file of selectedFiles) {
      if (!ALLOWED_FILE_TYPES.has(file.type)) {
        setError(`${file.name}: jenis file ini belum didukung.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name}: ukuran maksimal file adalah 10 MB.`);
        continue;
      }
      validFiles.push(file);
    }

    const availableSlots = Math.max(MAX_ATTACHMENTS - pendingAttachments.length, 0);
    if (validFiles.length > availableSlots) {
      setError(`Maksimal ${MAX_ATTACHMENTS} lampiran dalam satu pesan.`);
    }
    setPendingAttachments((current) => [
      ...current,
      ...validFiles.slice(0, Math.max(MAX_ATTACHMENTS - current.length, 0)),
    ]);
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!user || !activeConversationId || (!body && pendingAttachments.length === 0) || sending) return;
    setSending(true);
    setError('');
    const uploadedPaths: string[] = [];
    try {
      const uploadedAttachments: Omit<ChatAttachment, 'signedUrl'>[] = [];
      for (const file of pendingAttachments) {
        const safeFileName = file.name.replace(/[^\w.-]/g, '_').slice(-120) || 'attachment';
        const path = `${activeConversationId}/${crypto.randomUUID()}-${safeFileName}`;
        const { error: uploadError } = await supabase.storage
          .from(ATTACHMENT_BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
        uploadedAttachments.push({
          path,
          name: file.name,
          contentType: file.type,
          size: file.size,
        });
      }

      const { error: insertError } = await supabase.from('support_messages').insert({
        conversation_id: activeConversationId,
        sender_id: user.id,
        body,
        attachments: uploadedAttachments,
      });
      if (insertError) throw insertError;

      setDraft('');
      setPendingAttachments([]);
    } catch {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from(ATTACHMENT_BUCKET).remove(uploadedPaths);
      }
      setError('Pesan atau lampiran gagal dikirim. Periksa ukuran file dan koneksi, lalu coba lagi.');
    } finally {
      setSending(false);
    }
  };

  if (authLoading) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-slate-500">{t('Memeriksa akun...')}</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <MessageCircle size={36} className="mx-auto text-slate-400" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">{t('Chat Admin')}</h1>
        <p className="mt-2 text-sm text-slate-500">{t('Masuk ke akun untuk bertanya tentang produk dan melihat balasan admin.')}</p>
        <button onClick={onSignIn} className="mt-6 rounded-lg bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800">
          {t('Masuk')} ke akun
        </button>
      </div>
    );
  }

  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId) ?? null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <button onClick={onBack} className="mb-5 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} /> Kembali ke toko
      </button>
      <div className="mb-5 flex items-center gap-3 border-b border-slate-200 pb-4">
        <MessageCircle size={23} className="text-emerald-700" />
        <div>
          <h1 className="text-xl font-bold text-slate-900">{isAdmin ? 'Inbox Chat' : 'Chat Admin'}</h1>
          <p className="text-sm text-slate-500">{isAdmin ? 'Balas pertanyaan pelanggan tentang produk.' : 'Tanyakan detail produk langsung kepada admin.'}</p>
        </div>
      </div>

      {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="grid min-h-[min(70vh,620px)] overflow-hidden rounded-xl border border-slate-200 bg-white md:grid-cols-[280px_1fr]">
        <aside className="border-b border-slate-200 md:border-b-0 md:border-r">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">{t('Percakapan')}</h2>
          <div className="max-h-56 overflow-y-auto md:max-h-[560px]">
            {loading ? (
              <p className="p-4 text-sm text-slate-500">{t('Memuat chat...')}</p>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">{t('Belum ada percakapan.')}</p>
            ) : conversations.map((conversation) => (
              <div key={conversation.id} className={`flex items-center border-b border-slate-100 pr-2 ${activeConversationId === conversation.id ? 'bg-emerald-50' : ''}`}>
                <button
                  onClick={() => setActiveConversationId(conversation.id)}
                  className="min-w-0 flex-1 px-4 py-3 text-left transition hover:bg-slate-50"
                >
                  <span className="block truncate text-sm font-semibold text-slate-800">{conversation.product_name}</span>
                  <span className="mt-1 block truncate text-xs text-slate-500">
                    {isAdmin ? conversation.customer_email : 'Pertanyaan produk'}
                  </span>
                  <span className="mt-1 block text-[11px] text-slate-400">
                    {new Date(conversation.updated_at).toLocaleDateString('id-ID')}
                  </span>
                </button>
                <button
                  onClick={() => onProductOpen(conversation.product_id)}
                  aria-label={`Lihat produk ${conversation.product_name}`}
                  title={`Lihat produk ${conversation.product_name}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-blue-700"
                >
                  <ArrowUpRight size={17} />
                </button>
              </div>
            ))}
          </div>
        </aside>

        <section className="flex min-h-[420px] flex-col">
          {activeConversation ? (
            <>
              <header className="border-b border-slate-100 px-4 py-3">
                <button
                  onClick={() => onProductOpen(activeConversation.product_id)}
                  className="inline-flex items-center gap-1 font-semibold text-slate-900 hover:text-blue-700"
                >
                  {activeConversation.product_name}
                  <ArrowUpRight size={15} />
                </button>
                {isAdmin && <p className="mt-0.5 text-xs text-slate-500">{activeConversation.customer_email}</p>}
              </header>
              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-4">
                {messages.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-500">{t('Kirim pesan pertama untuk memulai percakapan.')}</p>
                ) : messages.map((message) => {
                  const isOwnMessage = message.sender_id === user.id;
                  return (
                    <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-xl px-3 py-2 ${isOwnMessage ? 'bg-emerald-700 text-white' : 'border border-slate-200 bg-white text-slate-800'}`}>
                        {message.body && <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>}
                        {(message.attachments ?? []).map((attachment) => (
                          <a
                            key={attachment.path}
                            href={attachment.signedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={`mt-2 flex max-w-64 items-center gap-2 overflow-hidden rounded-lg p-2 text-xs ${isOwnMessage ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700'}`}
                          >
                            {attachment.contentType.startsWith('image/') && attachment.signedUrl ? (
                              <img src={attachment.signedUrl} alt={attachment.name} className="max-h-40 max-w-full rounded object-contain" />
                            ) : (
                              <>
                                <FileText size={18} className="shrink-0" />
                                <span className="truncate">{attachment.name}</span>
                              </>
                            )}
                          </a>
                        ))}
                        <time className={`mt-1 block text-right text-[10px] ${isOwnMessage ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {new Date(message.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </time>
                      </div>
                    </div>
                  );
                })}
              </div>
              {activeConversation.status === 'open' ? (
                <form onSubmit={sendMessage} className="border-t border-slate-200 p-3">
                  {pendingAttachments.length > 0 && (
                    <ul className="mb-3 flex flex-wrap gap-2">
                      {pendingAttachments.map((file, index) => (
                        <li key={`${file.name}-${file.lastModified}`} className="flex max-w-full items-center gap-2 rounded-lg bg-slate-100 py-1 pl-2 pr-1 text-xs text-slate-700">
                          <FileText size={14} className="shrink-0" />
                          <span className="max-w-40 truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removePendingAttachment(index)}
                            aria-label={`Hapus lampiran ${file.name}`}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-500 hover:bg-slate-200"
                          >
                            <X size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex items-end gap-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setAttachmentMenuOpen((open) => !open)}
                        disabled={pendingAttachments.length >= MAX_ATTACHMENTS || sending}
                        aria-label={t('Tambah lampiran')}
                        title="Tambah lampiran"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                      >
                        <Plus size={19} />
                      </button>
                      {attachmentMenuOpen && (
                        <div className="absolute bottom-14 left-0 z-10 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                          <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                            <ImageIcon size={16} /> Galeri
                            <input type="file" accept="image/*" multiple className="sr-only" onChange={addFiles} />
                          </label>
                          <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                            <Camera size={16} /> Kamera
                            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={addFiles} />
                          </label>
                          <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                            <FileText size={16} /> Dokumen
                            <input type="file" accept=".pdf,.txt,.csv,.rtf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" multiple className="sr-only" onChange={addFiles} />
                          </label>
                        </div>
                      )}
                    </div>
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      maxLength={4000}
                      rows={2}
                      placeholder={t('Tulis pesan...')}
                      className="min-h-11 flex-1 resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={(!draft.trim() && pendingAttachments.length === 0) || sending}
                      aria-label={t('Kirim pesan')}
                      title="Kirim pesan"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50"
                    >
                      <Send size={17} />
                    </button>
                  </div>
                </form>
              ) : (
                <p className="border-t border-slate-200 p-4 text-center text-sm text-slate-500">{t('Percakapan ini sudah ditutup.')}</p>
              )}
            </>
          ) : productId && !isAdmin ? (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
              <MessageCircle size={34} className="text-emerald-700" />
              <h2 className="mt-3 text-lg font-semibold text-slate-900">{t('Tanya admin tentang produk ini')}</h2>
              <p className="mt-2 max-w-sm text-sm text-slate-500">{t('Percakapan tersimpan di akun Anda, jadi Anda dapat kembali melihat balasan kapan saja.')}</p>
              <button onClick={() => void startConversation()} className="mt-5 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
                Mulai chat
              </button>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-slate-500">
              Pilih percakapan untuk melihat pesan.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}