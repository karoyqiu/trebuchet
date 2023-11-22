import { decode } from 'js-base64';
import { Endpoint } from '../../db/endpoint';

interface VMessQRCode {
  v: string;
  ps: string;
  add: string;
  port: string;
  type: string;
  id: string;
  aid: string;
  net?: string;
  path: string;
  host: string;
  tls: string;
  scy?: string;
}

export const parse = (url: URL): Endpoint => {
  if (url.search) {
    // TODO: 标准 vmess 协议格式
    throw new Error('Unsupported vmess url');
  }

  const json = decode(url.pathname.substring(2));
  const qrcode = JSON.parse(json) as VMessQRCode;

  return {
    protocol: 'vmess',
    name: qrcode.ps,
    host: qrcode.add,
    port: parseInt(qrcode.port, 10),
    cipher: qrcode.scy || 'auto',
    transport: qrcode.net || 'tcp',
  };
};
