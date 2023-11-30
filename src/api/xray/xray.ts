import { getName } from '@tauri-apps/api/app';
import { BaseDirectory, removeFile, writeTextFile } from '@tauri-apps/api/fs';
import { tempdir } from '@tauri-apps/api/os';
import { appDataDir, join } from '@tauri-apps/api/path';
import { Child, Command } from '@tauri-apps/api/shell';
import { nanoid } from 'nanoid';
import Endpoint from '../../db/endpoint';
import { settings } from '../settings';
import ConfigObject from './config';
import OutboundObject from './config/outbound';
import { vmessToOutbound } from './protocols/vmess';

let subDir = '';
let dataDir = '';

const redirectLog = (line: string) => console.log(`--> ${line}`);

const endpoiontToOutbound = (ep: Endpoint): OutboundObject | null => {
  switch (ep.protocol) {
    case 'vmess':
      return vmessToOutbound(ep.params);
  }

  return null;
};

/** Xray 控制类 */
class Xray {
  private child: Child | null;
  private filename;

  /** API 监听端口。 */
  public apiPort: number;

  /**
   * 构建 xray。
   */
  constructor() {
    this.child = null;
    this.filename = '';
    this.apiPort = 1099;
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
        loglevel: 'debug',
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
          port: this.apiPort,
          listen: '127.0.0.1',
          protocol: 'dokodemo-door',
          settings: {
            address: '127.0.0.1',
          },
        },
      ],
      outbounds,
    };

    if (!subDir) {
      [subDir, dataDir] = await Promise.all([getName(), appDataDir()]);
    }

    const filename = `${nanoid()}.json`;
    this.filename = `${subDir}/${filename}`;
    const temp = await tempdir();
    const [fullName] = await Promise.all([
      join(temp, this.filename),
      writeTextFile(this.filename, JSON.stringify(config, undefined, 2), {
        dir: BaseDirectory.Temp,
      }),
    ]);

    // 启动 xray
    const cmd = Command.sidecar('xray/xray', ['-config', fullName], {
      env: {
        XRAY_LOCATION_ASSET: dataDir,
      },
      encoding: 'utf-8',
    });
    cmd.stdout.on('data', redirectLog);
    cmd.stderr.on('data', redirectLog);

    const child = await cmd.spawn();
    console.info(`Xray started with PID ${child.pid}`);

    this.child = child;
  }

  /** 停止 xray。 */
  public async stop() {
    if (this.child) {
      await Promise.all([
        this.child.kill(),
        removeFile(this.filename, { dir: BaseDirectory.Temp }),
      ]);

      this.child = null;
      this.filename = '';
    }
  }
}

const xray = new Xray();
export default xray;
