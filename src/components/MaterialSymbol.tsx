import { MaterialSymbol as Symbol } from 'material-symbols';

type MaterialSymbolProps = {
  symbol: Symbol;
};

export default function MaterialSymbol({ symbol }: MaterialSymbolProps) {
  return <span className="material-symbols-outlined">{symbol}</span>;
}
