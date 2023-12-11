import { decode } from 'js-base64';
import { URIComponents } from 'uri-js';
import Endpoint from '../../../db/endpoint';
import getPortNumber from '../../getPortNumber';
import randomid from '../../randomid';

const parse = (uri: URIComponents): Endpoint | null => {
  const { host = '', userinfo = '', fragment = '' } = uri;
  const port = getPortNumber(uri.port);
  const userInfoParts = userinfo.includes(':') ? userinfo : decode(userinfo);
  const pos = userInfoParts.indexOf(':');
  const method = userInfoParts.substring(0, pos);
  const password = userInfoParts.substring(pos + 1);

  return {
    id: randomid(),
    name: decodeURIComponent(fragment),
    host,
    port,
    outbound: {
      protocol: 'shadowsocks',
      settings: {
        servers: [
          {
            method,
            address: host,
            port,
            password,
          },
        ],
      },
    },
  };
};

export default parse;
