import type { InputHTMLAttributes } from 'react';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export default function TextField(props: TextFieldProps) {
  const { label, ...rest } = props;

  return (
    <div className="form-control w-full">
      {label && (
        <label className="label">
          <span className="label-text">{label}</span>
        </label>
      )}
      <input className="input input-bordered w-full" {...rest} />
    </div>
  );
}
