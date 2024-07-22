import React from 'react';
import { InputBoxContext } from '../components/InputBoxProvider';

type TextInputBox = {
  numeric?: false;
  value?: string;
};

type IntegerInputBox = {
  numeric: true;
  value?: number;
};

export type InputBox = {
  label?: string;
};

const useInputBox = () => {
  const { prompt } = React.useContext(InputBoxContext);

  function doInput(values: InputBox & IntegerInputBox): Promise<number | undefined>;
  function doInput(values: InputBox & TextInputBox): Promise<string | undefined>;
  function doInput(values: InputBox & (IntegerInputBox | TextInputBox)) {
    return new Promise<number | string | undefined>((resolve) => {
      prompt({ ...values, onClose: resolve });
    });
  }

  return doInput;
};

export default useInputBox;
