import { forwardRef, useEffect, useState } from 'react';
import { Subscription } from '../db/subscription';
import TextInput from './TextInput';

type SubscriptionDialogProps = {
  onClose: (values?: Subscription) => Promise<void> | void;
  sub: Subscription;
};

const SubscriptionDialog = forwardRef<HTMLDialogElement, SubscriptionDialogProps>(
  function SubscriptionDialog(props, ref) {
    const { onClose, sub } = props;
    const [values, setValues] = useState(sub);

    useEffect(() => {
      setValues(sub);
    }, [sub]);

    return (
      <dialog className="modal" ref={ref}>
        <div className="modal-box">
          <h3 className="font-bold text-lg">Subscription</h3>
          <form
            autoComplete="off"
            autoSave="off"
            className="flex flex-col"
            method="dialog"
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
                {sub.id > 0 ? 'Save' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    );
  },
);

export default SubscriptionDialog;
