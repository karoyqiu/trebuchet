import { URIComponents } from 'uri-js';
import Endpoint from '../../../db/endpoint';
import getPortNumber from '../../getPortNumber';
import randomid from '../../randomid';
import { getStreamSettings } from './trojan';

const parse = (uri: URIComponents): Endpoint | null => {
  const host = uri.host ?? '';
  const port = getPortNumber(uri.port);
  const params = new URLSearchParams(uri.query);

  return {
    id: randomid(),
    name: decodeURIComponent(uri.fragment ?? ''),
    host,
    port,
    outbound: {
      protocol: 'vless',
      settings: {
        vnext: [
          {
            address: host,
            port,
            users: [
              {
                id: uri.userinfo ?? '',
                encryption: 'none',
                flow: params.get('flow') ?? '',
              },
            ],
          },
        ],
      },
      streamSettings: getStreamSettings(uri),
    },
  };
};

export default parse;
