import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
} from '@fluentui/react-components';
import { AddFilled } from '@fluentui/react-icons';
import { Form, Formik } from 'formik';
import { Subscription, subscriptionSchema } from '../db/subscription';
import Stack from './Stack';
import TextField from './TextField';

type SubscriptionDialogProps = {
  open: boolean;
  onClose: (values?: Subscription) => void;
  sub: Subscription;
};

export default function SubscriptionDialog(props: SubscriptionDialogProps) {
  const { open, onClose, sub } = props;

  return (
    <Dialog
      open={open}
      onOpenChange={(_event, data) => {
        if (!data.open) {
          onClose();
        }
      }}
    >
      <DialogSurface>
        <Formik
          initialValues={sub}
          enableReinitialize
          validationSchema={subscriptionSchema}
          validateOnChange={false}
          validateOnBlur={false}
          onSubmit={onClose}
        >
          <Form autoComplete="off" autoSave="off">
            <DialogBody>
              <DialogTitle>Subscribe</DialogTitle>
              <DialogContent>
                <Stack>
                  <TextField name="name" label="Name" required />
                  <TextField name="url" label="URL" required />
                </Stack>
              </DialogContent>
              <DialogActions>
                <DialogTrigger>
                  <Button>Cancel</Button>
                </DialogTrigger>
                <Button type="submit" appearance="primary" icon={<AddFilled />}>
                  Add
                </Button>
              </DialogActions>
            </DialogBody>
          </Form>
        </Formik>
      </DialogSurface>
    </Dialog>
  );
}
