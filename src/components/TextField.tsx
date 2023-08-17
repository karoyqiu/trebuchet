import { Field, Input } from '@fluentui/react-components';
import { FieldAttributes, FieldProps, Field as FormikField } from 'formik';

type TextFieldProps = FieldAttributes<unknown> & {
  label?: string;
};

export default function TextField(props: TextFieldProps) {
  const { label, ...rest } = props;

  return (
    <FormikField {...rest}>
      {({ field, meta }: FieldProps) => (
        <Field label={label} required={rest.required} validationMessage={meta.error}>
          <Input required={rest.required} {...field} />
        </Field>
      )}
    </FormikField>
  );
}
