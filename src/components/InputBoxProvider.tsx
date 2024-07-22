import clsx from 'clsx';
import React from 'react';

type TextInputBox = {
  numeric?: false;
  value?: string;
  onClose?: (value?: string) => void;
};

type IntegerInputBox = {
  numeric: true;
  value?: number;
  onClose?: (value?: number) => void;
};

export type InputBox = {
  label?: string;
} & (IntegerInputBox | TextInputBox);

type Context = {
  prompt: (values: InputBox) => void;
};

const noop = () => {};

export const InputBoxContext = React.createContext<Context>({ prompt: noop });

export default function InputBoxProvider(props: { children?: React.ReactNode }) {
  const { children } = props;
  const ref = React.useRef<HTMLDialogElement>(null);
  const [content, setContent] = React.useState<InputBox>({ label: '', numeric: true });

  const prompt = (values: InputBox) => {
    setContent(values);
    ref.current?.showModal();
  };

  const providerValue = React.useMemo(() => ({ prompt }), [ref]);

  return (
    <InputBoxContext.Provider value={providerValue}>
      {children}
      <dialog ref={ref} className="modal">
        <form className="modal-box" method="dialog" autoComplete="off">
          <p className="py-4">{content.label}</p>
          <input
            type={content.numeric ? 'number' : 'text'}
            className={clsx(
              'input input-bordered w-full font-mono',
              content.numeric && 'text-right',
            )}
            value={content.value ?? 0}
            onChange={(event) => {
              if (content.numeric) {
                const value = parseInt(event.target.value, 10);

                if (value) {
                  setContent({ ...content, value });
                }
              } else {
                setContent({ ...content, value: event.target.value });
              }
            }}
          />
          <div className="modal-action">
            <button className="btn" onClick={() => content.onClose && content.onClose()}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              // @ts-expect-error: unknown?
              onClick={() => content.onClose && content.onClose(content.value)}
            >
              OK
            </button>
          </div>
        </form>
      </dialog>
    </InputBoxContext.Provider>
  );
}
