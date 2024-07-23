import { useLiveQuery } from 'dexie-react-hooks';
import { omit } from 'radash';
import React from 'react';
import db from '../db';
import { Website } from '../db/website';
import WebsiteDialog from './WebsiteDialog';

type WebsiteSelectDialogProps = {
  url: string;
  onClose: (url?: string) => Promise<void> | void;
};

const WebsiteSelectDialog = React.forwardRef<HTMLDialogElement, WebsiteSelectDialogProps>(
  function WebsiteSelectDialog(props, ref) {
    const { url, onClose } = props;
    const websites = useLiveQuery(() => db.websites.toArray(), []) ?? [];
    const [website, setWebsite] = React.useState<Website>({ name: '', url: '' });
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
                setWebsite({ name: '', url: '' });
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
                  await db.websites.delete(current.id);
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
              await db.websites.add(omit(value, ['id']));
            }
          }}
        />
      </dialog>
    );
  },
);

export default WebsiteSelectDialog;
