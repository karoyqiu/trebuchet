import React from 'react';
import { InputBox, InputBoxContext } from '../components/InputBoxProvider';

const useInputBox = () => {
  const { prompt } = React.useContext(InputBoxContext);

  return (values: Omit<InputBox, 'onClose'>) =>
    new Promise<number | undefined>((resolve) => {
      prompt({ ...values, onClose: resolve });
    });
};

export default useInputBox;
