import { Form, Formik } from 'formik';
import React from 'react';
import { Subscription, subscriptionSchema } from '../db/subscription';
import TextField from './TextField';

type SubscriptionDialogProps = {
  onClose: (values?: Subscription) => Promise<void> | void;
  sub: Subscription;
};

const SubscriptionDialog = React.forwardRef<HTMLDialogElement, SubscriptionDialogProps>(
  function SubscriptionDialog(props, ref) {
    const { onClose, sub } = props;

    return (
      <dialog className="modal" ref={ref}>
        <div className="modal-box">
          <h3 className="font-bold text-lg">Subscription</h3>
          <Formik
            initialValues={sub}
            enableReinitialize
            validationSchema={subscriptionSchema}
            validateOnChange={false}
            validateOnBlur={false}
            onReset={() => onClose()}
            onSubmit={onClose}
          >
            <Form autoComplete="off" autoSave="off" className="flex flex-col" method="dialog">
              <TextField name="name" label="Name" required />
              <TextField name="url" label="URL" required />
              <div className="modal-action">
                <button className="btn" type="reset">
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  {sub.id ? 'Save' : 'Add'}
                </button>
              </div>
            </Form>
          </Formik>
        </div>
      </dialog>
    );
  }
);

export default SubscriptionDialog;
