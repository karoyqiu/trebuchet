import clsx from 'clsx';
import { MaterialSymbol as MSymbol } from 'material-symbols';

type MaterialSymbolProps = {
  symbol: MSymbol;
  className?: string;
};

export default function MaterialSymbol(props: MaterialSymbolProps) {
  const { symbol, className } = props;
  return <span className={clsx('material-symbols-outlined', className)}>{symbol}</span>;
}
