import { decode } from 'js-base64';
import Endpoint from '../../../db/endpoint';
import randomid from '../../randomid';
import { VMessSecurity } from '../config/outbounds/vmess';
import { NetworkType, StreamSettingsObject } from '../config/transports';

interface VMessParams {
  v: string;
  ps: string;
  add: string;
  port: string;
  type: string;
  id: string;
  aid: string;
  net?: NetworkType;
  path: string;
  host: string;
  tls: string;
  sni?: string;
  alpn?: string;
  fp?: string;
  scy?: VMessSecurity;
}

const getSecurity = (params: VMessParams): StreamSettingsObject => {
  if (params.tls) {
    return {
      security: 'tls',
      tlsSettings: {
        serverName: params.sni,
        alpn: params.alpn ? [params.alpn] : undefined,
        fingerprint: params.fp,
      },
    };
  }

  return {
    security: 'none',
  };
};

const getStreamSettings = (params: VMessParams): StreamSettingsObject => {
  const streamSettings = getSecurity(params);
  streamSettings.network = params.net;

  switch (params.net) {
    case 'http':
      streamSettings.httpSettings = {
        host: [params.host],
        path: params.path,
      };
      break;

    case 'ws':
      streamSettings.wsSettings = {
        headers: {
          host: params.host,
        },
        path: params.path,
      };
      break;
  }

  return streamSettings;
};

const parse = (url: string): Endpoint => {
  const json = decode(url.substring(8));
  const params = JSON.parse(json) as VMessParams;

  return {
    id: randomid(),
    name: params.ps,
    host: params.add,
    port: parseInt(params.port, 10),
    cipher: params.scy || 'auto',
    transport: params.net,
    outbound: {
      protocol: 'vmess',
      settings: {
        vnext: [
          {
            address: params.add,
            port: parseInt(params.port, 10),
            users: [
              {
                id: params.id,
                security: params.scy,
              },
            ],
          },
        ],
      },
      streamSettings: getStreamSettings(params),
    },
  };
};

export default parse;
