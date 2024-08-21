import { forwardRef, useEffect, useState } from 'react';
import { type Website } from '../db/website';
import TextInput from './TextInput';

type WebsiteDialogProps = {
  title: string;
  website: Website;
  onClose: (website?: Website) => Promise<void> | void;
};

const WebsiteDialog = forwardRef<HTMLDialogElement, WebsiteDialogProps>(
  function WebsiteDialog(props, ref) {
    const { title, website, onClose } = props;
    const [values, setValues] = useState(website);

    useEffect(() => {
      setValues(website);
    }, [website]);

    return (
      <dialog className="modal" ref={ref}>
        <div className="modal-box">
          <h3 className="font-bold text-lg">{title}</h3>
          <form
            className="flex flex-col"
            method="dialog"
            autoComplete="off"
            autoSave="off"
            onSubmit={() => onClose(values)}
          >
            <TextInput
              name="name"
              label="Name"
              required
              value={values.name}
              onChange={(event) => setValues({ ...values, name: event.target.value })}
            />
            <TextInput
              name="url"
              type="url"
              label="URL"
              required
              value={values.url}
              onChange={(event) => setValues({ ...values, url: event.target.value })}
            />
            <div className="modal-action">
              <button className="btn" type="button" onClick={() => onClose()}>
                Cancel
              </button>
              <button className="btn btn-primary" type="submit">
                {website.id ? 'Save' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    );
  },
);

export default WebsiteDialog;
