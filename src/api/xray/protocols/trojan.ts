import Endpoint from '../../../db/endpoint';
import randomid from '../../randomid';
import OutboundObject from '../config/outbound';
import { NetworkType, StreamSettingsObject } from '../config/transports';

interface TrojanParams {
  password: string;
  host: string;
  port: number;
  security?: string | null;
  sni?: string | null;
  type?: NetworkType | null;
  headerType?: string | null;
}

export interface TrojanEndpoint {
  protocol: 'trojan';
  params: TrojanParams;
}

const pathRegexp = /\/\/([a-zA-Z0-9-]+)@([^:]+):([0-9]+)/;

export const parseTrojan = (url: URL): Endpoint | null => {
  const match = pathRegexp.exec(url.pathname);

  if (!match) {
    return null;
  }

  return {
    id: randomid(),
    name: decodeURIComponent(url.hash.substring(1)),
    host: match[2],
    port: parseInt(match[3], 10),
    protocol: 'trojan',
    params: {
      password: match[1],
      host: match[2],
      port: parseInt(match[3], 10),
      security: url.searchParams.get('security'),
      sni: url.searchParams.get('sni'),
      type: url.searchParams.get('type') as NetworkType,
      headerType: url.searchParams.get('headerType'),
    },
  };
};

const trojanSecurity = (params: TrojanParams): StreamSettingsObject => {
  if (params.security === 'tls') {
    return {
      security: 'tls',
      tlsSettings: {
        serverName: params.sni ?? params.host,
      },
    };
  }

  return {
    security: 'none',
  };
};

export const trojanToOutbound = (params: TrojanParams): OutboundObject => {
  const streamSettings = trojanSecurity(params);
  streamSettings.network = params.type ?? 'tcp';

  return {
    protocol: 'trojan',
    settings: {
      servers: [
        {
          address: params.host,
          port: params.port,
          password: params.password,
        },
      ],
    },
    streamSettings,
  };
};
