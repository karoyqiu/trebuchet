import React from 'react';
import { dbInsertWebsite, dbRemoveWebsite } from '../api/bindings';
import { Website, websites as db } from '../db/website';
import WebsiteDialog from './WebsiteDialog';

type WebsiteSelectDialogProps = {
  url: string;
  onClose: (url?: string) => Promise<void> | void;
};

const WebsiteSelectDialog = React.forwardRef<HTMLDialogElement, WebsiteSelectDialogProps>(
  function WebsiteSelectDialog(props, ref) {
    const { url, onClose } = props;
    const websites = db.use() ?? [];
    const [website, setWebsite] = React.useState<Website>({ id: 0, name: '', url: '' });
    const selectRef = React.useRef<HTMLSelectElement>(null);
    const addRef = React.useRef<HTMLDialogElement>(null);

    return (
      <dialog ref={ref} className="modal">
        <form className="modal-box" method="dialog" autoComplete="off">
          <p className="py-4">Latency test website</p>
          <select ref={selectRef} className="select select-bordered w-full" defaultValue={url}>
            {websites.map((w) => (
              <option key={w.id} value={w.url}>
                {w.name}
              </option>
            ))}
          </select>
          <div className="modal-action">
            <button
              className="btn"
              type="button"
              onClick={() => {
                setWebsite({ id: 0, name: '', url: '' });
                addRef.current?.showModal();
              }}
            >
              Add
            </button>
            <button
              className="btn btn-error"
              type="button"
              onClick={async () => {
                const current = websites.find((w) => w.url === selectRef.current?.value);

                if (current?.id) {
                  await dbRemoveWebsite(current.id);
                }
              }}
            >
              Remove
            </button>
            <button className="btn !ml-auto" onClick={() => onClose()}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={() => onClose(selectRef.current?.value)}>
              OK
            </button>
          </div>
        </form>
        <WebsiteDialog
          ref={addRef}
          title="Add website"
          website={website}
          onClose={async (value) => {
            addRef.current?.close();

            if (value) {
              await dbInsertWebsite(value);
            }
          }}
        />
      </dialog>
    );
  },
);

export default WebsiteSelectDialog;
