import { decode } from 'js-base64';
import { nanoid } from 'nanoid';
import Endpoint from '../../../db/endpoint';
import OutboundObject from '../config/outbound';
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

export interface VMessEndpoint {
  protocol: 'vmess';
  params: VMessParams;
}

export const parseVMess = (url: URL): Endpoint => {
  if (url.search) {
    // TODO: 标准 vmess 协议格式
    throw new Error('Unsupported vmess url');
  }

  const json = decode(url.pathname.substring(2));
  const qrcode = JSON.parse(json) as VMessParams;

  return {
    id: nanoid(),
    protocol: 'vmess',
    params: qrcode,
    name: qrcode.ps,
    host: qrcode.add,
    port: parseInt(qrcode.port, 10),
    cipher: qrcode.scy || 'auto',
    transport: qrcode.net,
  };
};

const vmessSecurity = (params: VMessParams): StreamSettingsObject => {
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

export const vmessToOutbound = (params: VMessParams): OutboundObject => {
  const streamSettings = vmessSecurity(params);
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

  return {
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
    streamSettings,
  };
};
