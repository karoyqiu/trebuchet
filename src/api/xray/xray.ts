import { getName } from '@tauri-apps/api/app';
import { BaseDirectory, removeFile, writeTextFile } from '@tauri-apps/api/fs';
import { tempdir } from '@tauri-apps/api/os';
import { appDataDir, join } from '@tauri-apps/api/path';
import { Child, Command } from '@tauri-apps/api/shell';
import { invoke } from '@tauri-apps/api/tauri';
import Endpoint from '../../db/endpoint';
import randomid from '../randomid';
import settings from '../settings';
import ConfigObject from './config';
import InboundObject from './config/inbound';
import OutboundObject from './config/outbound';
import { RuleObject } from './config/routing';
import { trojanToOutbound } from './protocols/trojan';
import { vmessToOutbound } from './protocols/vmess';

let subDir = '';
let dataDir = '';

const redirectLog = (line: string) => console.log(`--> ${line}`);

/**
 * 获取入站配置。
 * @param forTest 是否生成用于测速的入站配置
 * @returns 入站配置与 API 侦听端口
 */
const getInbounds = async (forTest?: boolean) => {
  const inbounds: InboundObject[] = [];
  const port = await invoke<number>('get_available_port');

  if (forTest) {
    // 测试用，只有 socks 入站
    inbounds.push({
      tag: 'socks',
      port,
      listen: '127.0.0.1',
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
    });
  } else {
    // 正常用，生成 socks、http 和 API 入站
    // 用户配置
    const us = settings.get();
    inbounds.push(
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
        port,
        listen: '127.0.0.1',
        protocol: 'dokodemo-door',
        settings: {
          address: '127.0.0.1',
        },
      }
    );
  }

  return { inbounds, apiPort: port };
};

const endpoiontToOutbound = (ep: Endpoint): OutboundObject | null => {
  switch (ep.protocol) {
    case 'vmess':
      return vmessToOutbound(ep.params);
    case 'trojan':
      return trojanToOutbound(ep.params);
  }

  return null;
};

/** Xray 控制类 */
export class Xray {
  private child: Child | null;
  private filename;
  private aport;

  /**
   * 构建 xray。
   */
  constructor() {
    this.child = null;
    this.filename = '';
    this.aport = 0;
  }

  /** API 监听端口。 */
  public get apiPort() {
    return this.aport;
  }

  /**
   * 运行 xray。
   *
   * @param endpoint 外部节点
   */
  public async start(endpoint: Endpoint, forTest?: boolean) {
    if (this.child) {
      console.warn('Xray already started.');
      return;
    }

    // 入站配置
    const { inbounds, apiPort } = await getInbounds(forTest);
    this.aport = apiPort;

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

    // 路由规则
    const rules: RuleObject[] = [];

    // 如果只为了测试，就不加下面的规则
    if (!forTest) {
      rules.push(
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
        }
      );
    }

    rules.push({
      type: 'field',
      port: '0-65535',
      outboundTag: 'proxy',
    });

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
        rules,
      },
      stats: {},
      inbounds,
      outbounds,
    };

    if (!subDir) {
      [subDir, dataDir] = await Promise.all([getName(), appDataDir()]);
    }

    const filename = `${randomid()}.json`;
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

    this.child = await cmd.spawn();
    console.info(`Xray started with PID ${this.child.pid}`);
  }

  /** 停止 xray。 */
  public async stop() {
    if (this.child) {
      await Promise.all([
        this.child.kill(),
        removeFile(this.filename, { dir: BaseDirectory.Temp }),
      ]);

      this.child = null;
      this.aport = 0;
      this.filename = '';
    }
  }
}

const xray = new Xray();
export default xray;
