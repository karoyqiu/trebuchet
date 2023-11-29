import { Child, Command } from '@tauri-apps/api/shell';
import Endpoint from '../../db/endpoint';
import { settings } from '../settings';
import ConfigObject from './config';
import OutboundObject from './config/outbound';
import { vmessToOutbound } from './protocols/vmess';

const endpoiontToOutbound = (ep: Endpoint): OutboundObject | null => {
  switch (ep.protocol) {
    case 'vmess':
      return vmessToOutbound(ep.params);
  }

  return null;
};

/** Xray 控制类 */
class Xray {
  private cmd: Command;
  private child: Child | null;

  /** API 监听端口。 */
  public apiPort: number;

  /**
   * 构建 xray。
   */
  constructor() {
    this.child = null;
    this.apiPort = 1099;
    this.cmd = Command.sidecar('xray/xray', ['-config', 'stdin:'], { encoding: 'utf-8' });
    this.cmd.stdout.on('data', (line) => console.log(`--> ${line}`));
    this.cmd.stderr.on('data', (line) => console.warn(`--> ${line}`));
  }

  /**
   * 运行 xray。
   *
   * @param endpoint 外部节点
   */
  public async start(endpoint: Endpoint) {
    if (this.child) {
      console.warn('Xray already started.');
      return;
    }

    // 用户配置
    const us = settings.get();

    // 出站配置
    const outbounds: OutboundObject[] = [
      {
        tag: 'direct',
        protocol: 'freedom',
        settings: {},
      },
      {
        tag: 'block',
        protocol: 'blackhole',
        settings: {
          response: {
            type: 'http',
          },
        },
      },
    ];

    // 出站代理
    const proxy = endpoiontToOutbound(endpoint);

    if (proxy) {
      proxy.tag = 'proxy';
      outbounds.push(proxy);
    }

    // 写入配置文件
    const config: ConfigObject = {
      api: {
        tag: 'api',
        services: ['StatsService'],
      },
      dns: {
        servers: ['8.8.8.8', 'localhost'],
      },
      log: {
        access: '',
        error: '',
        loglevel: 'warning',
      },
      policy: {
        system: {
          statsOutboundDownlink: true,
          statsOutboundUplink: true,
        },
      },
      routing: {
        domainStrategy: 'AsIs',
        rules: [
          {
            type: 'field',
            inboundTag: ['api'],
            outboundTag: 'api',
          },
          {
            type: 'field',
            outboundTag: 'block',
            domain: ['activity.meteor.com'],
          },
          {
            type: 'field',
            outboundTag: 'direct',
            domain: ['domain:cypress.io'],
          },
          {
            type: 'field',
            outboundTag: 'block',
            domain: ['geosite:category-ads-all'],
          },
          {
            type: 'field',
            outboundTag: 'direct',
            domain: ['geosite:cn'],
          },
          {
            type: 'field',
            outboundTag: 'direct',
            ip: ['geoip:private', 'geoip:cn'],
          },
          {
            type: 'field',
            port: '0-65535',
            outboundTag: 'proxy',
          },
        ],
      },
      stats: {},
      inbounds: [
        {
          tag: 'socks',
          port: us.socksPort,
          listen: us.allowLan ? '0.0.0.0' : '127.0.0.1',
          protocol: 'socks',
          sniffing: {
            enabled: true,
            destOverride: ['http', 'tls'],
            routeOnly: false,
          },
          settings: {
            auth: 'noauth',
            udp: true,
          },
        },
        {
          tag: 'http',
          port: us.httpPort,
          listen: us.allowLan ? '0.0.0.0' : '127.0.0.1',
          protocol: 'http',
          sniffing: {
            enabled: true,
            destOverride: ['http', 'tls'],
            routeOnly: false,
          },
          settings: {
            allowTransparent: false,
          },
        },
        {
          tag: 'api',
          port: 9090,
          listen: '127.0.0.1',
          protocol: 'dokodemo-door',
          settings: {
            address: '127.0.0.1',
          },
        },
      ],
      outbounds,
    };

    console.debug('Xray config', config);

    // 启动 xray
    const child = await this.cmd.spawn();
    console.info(`Xray started with PID ${child.pid}`);

    await child.write(JSON.stringify(config));

    this.child = child;
  }

  /** 停止 xray。 */
  public async stop() {
    if (this.child) {
      await this.child.kill();
      this.child = null;
    }
  }
}

const xray = new Xray();
export default xray;
