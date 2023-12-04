import { customAlphabet } from 'nanoid';
import { alphanumeric } from 'nanoid-dictionary';

const randomid = customAlphabet(alphanumeric);

export default randomid;
