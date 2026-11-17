// Màn hình Ghi chú: ghi nhanh ý tưởng, tìm lại, ghim, sửa, và biến một ghi chú thành việc lẻ của hôm nay.
import { useRef, useState, type KeyboardEvent } from 'react';
import GG from '../lib/logic';
import type { Note } from '../lib/logic';
import { useApp } from '../app-context';
import { useDialogs } from '../dialogs';
import { Icon } from '../ui';
import { fold } from '../WorkPicker';

const MAX = 4000;

function when(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => (n < 10 ? '0' + n : '' + n);
  return p(d.getDate()) + '/' + p(d.getMonth() + 1) + ' · ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

function Editor({ note, onSave }: { note: Note; onSave: (text: string) => void }) {
  const [text, setText] = useState(note.text);
  const save = () => { if (text.trim()) onSave(text); };
  return (
    <div className="ga-stack ga-stack--tight">
      <textarea className="gg-input mk-note__area" id="note-edit" aria-label="Nội dung ghi chú" rows={8} maxLength={MAX} value={text} onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); save(); } }} />
      <div className="ga-dialog__actions"><button className="gg-btn" id="note-save" type="button" onClick={save}>Lưu</button></div>
    </div>
  );
}

export default function Notes() {
  const { state: st, today, apply } = useApp();
  const dialogs = useDialogs();
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const area = useRef<HTMLTextAreaElement>(null);
  const now = () => new Date().toISOString();

  const all = GG.sortNotes(st), q = fold(query);
  const shown = q ? all.filter((n) => fold(n.text).includes(q)) : all;

  const add = () => {
    if (!draft.trim()) { area.current?.focus(); return; }
    apply((s) => GG.addNote(s, draft, now()));
    setDraft(''); area.current?.focus();
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.nativeEvent.isComposing) { e.preventDefault(); add(); } };
  const edit = (n: Note) => dialogs.sheet('Sửa ghi chú', <Editor note={n} onSave={(text) => { dialogs.close(); apply((s) => GG.updateNote(s, n.id, text, now())); }} />);
  const remove = (n: Note) => {
    void dialogs.confirm({ title: 'Xóa ghi chú này?', body: n.text.length > 120 ? n.text.slice(0, 120) + '…' : n.text, yes: 'Xóa ghi chú', danger: true }).then((ok) => {
      if (ok) { apply((s) => GG.deleteNote(s, n.id)); dialogs.toast('Đã xóa ghi chú'); }
    });
  };
  // dòng đầu của ghi chú thành một việc lẻ của hôm nay; ghi chú vẫn giữ lại
  const toTodo = (n: Note) => {
    const first = n.text.split('\n').map((l) => l.trim()).find(Boolean) || n.text;
    apply((s) => GG.addTodo(s, { workId: '', text: first.slice(0, 300), date: today }));
    dialogs.toast('Đã thêm vào việc hôm nay');
  };

  return (
    <>
      <section className="mk-sec">
        <p className="mk-h1">Ghi chú</p>
        <p className="gg-muted">Chợt nghĩ ra gì thì ghi lại ở đây, khỏi quên. Ghi chú không tính vào việc của ngày.</p>
        <textarea className="gg-input mk-note__area" id="note-new" ref={area} rows={3} maxLength={MAX} placeholder="Ý tưởng vừa nảy ra là…" aria-label="Ghi chú mới"
          value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKey} />
        <div className="mk-row">
          <p className="gg-muted mk-grow">Nhấn Ctrl hoặc ⌘ + Enter để lưu nhanh.</p>
          <button className="gg-btn" id="note-add" type="button" onClick={add}>Lưu ghi chú</button>
        </div>
      </section>

      <section className="mk-sec">
        <div className="mk-row">
          <p className="mk-group mk-grow">Đã ghi <span>· {all.length}</span></p>
          {all.length > 3 && <input className="gg-input mk-note__search" id="note-search" type="search" placeholder="Tìm trong ghi chú" aria-label="Tìm trong ghi chú" value={query} onChange={(e) => setQuery(e.target.value)} />}
        </div>
        {!all.length && <p className="mk-empty">Chưa có ghi chú nào. Viết ý tưởng đầu tiên ở ô phía trên nha.</p>}
        {all.length > 0 && !shown.length && <p className="mk-empty">Không có ghi chú nào khớp “{query.trim()}”.</p>}
        <div className="mk-notes">
          {shown.map((n) => (
            <article className={'mk-note' + (n.pinned ? ' is-pinned' : '')} key={n.id}>
              <button className="mk-note__text" id={'note-' + n.id} type="button" aria-label="Sửa ghi chú" onClick={() => edit(n)}>{n.text}</button>
              <div className="mk-note__foot">
                <span className="mk-note__when">{n.pinned ? 'Đã ghim · ' : ''}{when(n.updatedAt)}</span>
                <button className="mk-tool" id={'note-pin-' + n.id} type="button" aria-pressed={!!n.pinned} title={n.pinned ? 'Bỏ ghim' : 'Ghim lên đầu'} aria-label={n.pinned ? 'Bỏ ghim' : 'Ghim lên đầu'} onClick={() => apply((s) => GG.pinNote(s, n.id))}><Icon name="pin" /></button>
                <button className="mk-tool" id={'note-todo-' + n.id} type="button" title="Thêm thành việc hôm nay" aria-label="Thêm thành việc hôm nay" onClick={() => toTodo(n)}><Icon name="today" /></button>
                <button className="mk-tool mk-tool--danger" id={'note-del-' + n.id} type="button" title="Xóa ghi chú" aria-label="Xóa ghi chú" onClick={() => remove(n)}><Icon name="trash" /></button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
