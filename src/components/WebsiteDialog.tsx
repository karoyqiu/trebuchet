import { Form, Formik } from 'formik';
import React from 'react';
import { websiteSchema, type Website } from '../db/website';
import TextField from './TextField';

type WebsiteDialogProps = {
  title: string;
  website: Website;
  onClose: (website?: Website) => Promise<void> | void;
};

const WebsiteDialog = React.forwardRef<HTMLDialogElement, WebsiteDialogProps>(
  function WebsiteDialog(props, ref) {
    const { title, website, onClose } = props;

    return (
      <dialog className="modal" ref={ref}>
        <div className="modal-box">
          <h3 className="font-bold text-lg">{title}</h3>
          <Formik
            initialValues={website}
            enableReinitialize
            validationSchema={websiteSchema}
            validateOnChange={false}
            validateOnBlur={false}
            onSubmit={onClose}
          >
            <Form autoComplete="off" autoSave="off" className="flex flex-col" method="dialog">
              <TextField name="name" label="Name" required />
              <TextField name="url" label="URL" required />
              <div className="modal-action">
                <button className="btn" type="button" onClick={() => onClose()}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  {website.id ? 'Save' : 'Add'}
                </button>
              </div>
            </Form>
          </Formik>
        </div>
      </dialog>
    );
  },
);

export default WebsiteDialog;
