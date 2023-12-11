import { URIComponents } from 'uri-js';
import Endpoint from '../../../db/endpoint';
import getPortNumber from '../../getPortNumber';
import randomid from '../../randomid';
import { NetworkType, StreamSettingsObject } from '../config/transports';

const getAlpn = (params: URLSearchParams) => {
  const alpn = params.get('alpn');

  if (alpn) {
    return [alpn];
  }

  return undefined;
};

const getNetwork = (params: URLSearchParams) => {
  const sso: StreamSettingsObject = {
    network: (params.get('type') ?? 'tcp') as NetworkType,
  };
  const headerType = params.get('headerType') ?? 'none';
  const host = params.get('host') ?? '';

  switch (sso.network) {
    case 'tcp':
      if (headerType === 'http') {
        sso.tcpSettings = {
          header: {
            type: 'http',
            request: { headers: { host: [host] } },
            response: {},
          },
        };
      } else {
        sso.tcpSettings = {
          header: {
            type: 'none',
          },
        };
      }
      break;

    case 'kcp':
      sso.kcpSettings = {
        // @ts-expect-error: 强制转换
        header: { type: headerType },
        seed: params.get('seed') ?? '',
      };
      break;

    case 'ws':
      sso.wsSettings = {
        headers: { host },
        path: params.get('path') ?? '/',
      };
      break;

    case 'http':
    case 'h2':
      sso.httpSettings = {
        host: [host],
        path: params.get('path') ?? '/',
      };
      break;

    case 'quic':
      sso.quicSettings = {
        // @ts-expect-error: 强制转换
        security: params.get('quicSecurity') ?? 'none',
        // @ts-expect-error: 强制转换
        header: { type: headerType },
        key: params.get('key') ?? '',
      };
      break;

    case 'grpc':
      sso.grpcSettings = {
        serviceName: params.get('serviceName') ?? '',
      };
      break;
  }

  return sso;
};

export const getStreamSettings = (uri: URIComponents): StreamSettingsObject => {
  const params = new URLSearchParams(uri.query);
  const network = getNetwork(params);
  const security = params.get('security');

  switch (security) {
    case 'tls':
      return {
        ...network,
        security: 'tls',
        tlsSettings: {
          serverName: params.get('sni') ?? uri.host,
          alpn: getAlpn(params),
          fingerprint: params.get('fp') ?? undefined,
        },
      };

    case 'reality':
      return {
        ...network,
        security: 'reality',
        realitySettings: {
          serverName: params.get('sni') ?? '',
          fingerprint: params.get('fp') ?? '',
          publicKey: params.get('pbk') ?? '',
          shortID: params.get('sid') ?? '',
          spiderX: params.get('spiderX') ?? '',
        },
      };
  }

  return {
    ...network,
    security: 'none',
  };
};

const parse = (uri: URIComponents): Endpoint | null => {
  const host = uri.host ?? '';
  const port = getPortNumber(uri.port);

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
