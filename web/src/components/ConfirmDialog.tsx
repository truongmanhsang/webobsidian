import { useState } from 'react';
import { useStore } from '../lib/store';

/** Shared replacement for native browser confirm dialogs. */
export default function ConfirmDialog() {
  const request = useStore((s) => s.confirmRequest);
  const close = useStore((s) => s.closeConfirm);
  const [busy, setBusy] = useState(false);

  if (!request) return null;

  const runConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await request.onConfirm();
      close();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-bg confirm-modal-bg" onClick={busy ? undefined : close}>
      <div className="modal confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="confirm-title">{request.title}</h2>
        <p>{request.message}</p>
        <div className="confirm-actions">
          <button className="btn secondary" disabled={busy} onClick={close}>Cancel</button>
          <button className={`btn ${request.danger ? 'danger' : ''}`} autoFocus disabled={busy} onClick={() => void runConfirm()}>
            {busy ? 'Working…' : request.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
