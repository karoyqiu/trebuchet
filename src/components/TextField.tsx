import clsx from 'clsx';
import { FieldAttributes, FieldProps, Field as FormikField } from 'formik';

type TextFieldProps = FieldAttributes<unknown> & {
  label?: string;
};

export default function TextField(props: TextFieldProps) {
  const { label, ...rest } = props;

  return (
    <FormikField {...rest}>
      {({ field, meta }: FieldProps) => (
        <div className="form-control w-full">
          {label && (
            <label className="label">
              <span className="label-text">{label}</span>
            </label>
          )}
          <input
            type="text"
            className={clsx('input input-bordered w-full', meta.error && 'input-error')}
            {...field}
          />
          {meta.error && (
            <label className="label">
              <span className="label-text-alt text-error">{meta.error}</span>
            </label>
          )}
        </div>
      )}
    </FormikField>
  );
}
