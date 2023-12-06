import { URIComponents } from 'uri-js';
import Endpoint from '../../../db/endpoint';
import randomid from '../../randomid';
import { NetworkType, StreamSettingsObject } from '../config/transports';

const getPort = (port?: number | string) => {
  if (typeof port === 'number') {
    return port;
  }

  if (port) {
    return parseInt(port, 10);
  }

  return 0;
};

const getStreamSettings = (uri: URIComponents): StreamSettingsObject => {
  const params = new URLSearchParams(uri.query);
  const network = (params.get('type') ?? 'tcp') as NetworkType;

  if (params.get('security') === 'tls') {
    return {
      network,
      security: 'tls',
      tlsSettings: {
        serverName: params.get('sni') ?? uri.host,
      },
    };
  }

  return {
    network,
    security: 'none',
  };
};

const parse = (uri: URIComponents): Endpoint | null => {
  const host = uri.host ?? '';
  const port = getPort(uri.port);

  return {
    id: randomid(),
    name: decodeURIComponent(uri.fragment ?? ''),
    host,
    port,
    outbound: {
      protocol: 'trojan',
      settings: {
        servers: [
          {
            address: host,
            port,
            password: uri.userinfo ?? '',
          },
        ],
      },
      streamSettings: getStreamSettings(uri),
    },
  };
};

export default parse;
