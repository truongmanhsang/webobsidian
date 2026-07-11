import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';

/** Shared replacement for native browser prompt dialogs. */
export default function PromptDialog() {
  const request = useStore((s) => s.promptRequest);
  const close = useStore((s) => s.closePrompt);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setValue(request?.initialValue ?? '');
    setBusy(false);
  }, [request]);

  if (!request) return null;

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await request.onConfirm(value);
      close();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-bg prompt-modal-bg" onClick={busy ? undefined : close}>
      <div className="modal prompt-dialog" role="dialog" aria-modal="true" aria-labelledby="prompt-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="prompt-title">{request.title}</h2>
        <p>{request.message}</p>
        <input
          className="text-input"
          type={request.inputType ?? 'text'}
          value={value}
          placeholder={request.placeholder}
          autoFocus
          disabled={busy}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); void submit(); }
            if (e.key === 'Escape' && !busy) close();
          }}
        />
        <div className="prompt-actions">
          <button className="btn secondary" disabled={busy} onClick={close}>Cancel</button>
          <button className="btn" disabled={busy} onClick={() => void submit()}>
            {busy ? 'Working…' : request.confirmLabel ?? 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
