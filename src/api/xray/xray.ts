import { BaseDirectory, removeFile, writeTextFile } from '@tauri-apps/api/fs';
import { appConfigDir, appDataDir, join } from '@tauri-apps/api/path';
import { Child, Command } from '@tauri-apps/api/shell';
import { invoke } from '@tauri-apps/api/tauri';
import { info, warn } from 'tauri-plugin-log-api';
import db from '../../db';
import type Endpoint from '../../db/endpoint';
import settings from '../settings';
import type ConfigObject from './config';
import type InboundObject from './config/inbound';
import type OutboundObject from './config/outbound';
import type { RuleObject } from './config/routing';

export type RuleType = 'default' | 'test' | 'all';

let configDir = '';
let dataDir = '';

const redirectLog = async (line: string) => {
  if (!line.includes('api -> api')) {
    const id = await db.logEntries.add({ log: line });
    await db.logEntries
      .where('id')
      .below(id - 1024)
      .delete();
  }
};

/**
 * 获取入站配置。
 * @param forTest 是否生成用于测速的入站配置
 * @returns 入站配置与 API 侦听端口
 */
const getInbounds = async (forTest: boolean) => {
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
      },
    );
  }

  return { inbounds, apiPort: port };
};

/** Xray 控制类 */
export default class Xray {
  private child: Child | null = null;
  private filename = '';
  private aport = 0;
  private epid = '';

  /** API 监听端口。 */
  public get apiPort() {
    return this.aport;
  }

  /** 节点 ID */
  public get endpointId() {
    return this.epid;
  }

  /**
   * 运行 xray。
   *
   * @param endpoint 外部节点
   */
  public async start(endpoint: Endpoint, ruleType: RuleType = 'default') {
    if (this.child) {
      await warn('Xray already started.');
      return;
    }

    // 入站配置
    const { inbounds, apiPort } = await getInbounds(ruleType === 'test');
    this.aport = apiPort;
    this.epid = endpoint.id;

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
    outbounds.push({
      ...endpoint.outbound,
      tag: 'proxy',
    });

    // 路由规则
    const rules: RuleObject[] = [];

    // 如果只为了测试，就不加下面的规则
    if (ruleType !== 'test') {
      rules.push({
        type: 'field',
        inboundTag: ['api'],
        outboundTag: 'api',
      });

      if (ruleType === 'default') {
        // 默认路由规则
        rules.push(
          {
            type: 'field',
            outboundTag: 'block',
            domain: ['activity.meteor.com', 'geosite:category-ads-all'],
          },
          {
            type: 'field',
            outboundTag: 'direct',
            domain: [
              'domain:cypress.io',
              'geosite:cn',
              'geosite:private',
              'geosite:apple-cn',
              'geosite:google-cn',
              'geosite:tld-cn',
              'geosite:category-games@cn',
            ],
          },
          {
            type: 'field',
            outboundTag: 'direct',
            ip: [
              '8.8.8.8/32',
              '223.5.5.5/32',
              '119.29.29.29/32',
              '180.76.76.76/32',
              '114.114.114.114/32',
              'geoip:private',
              'geoip:cn',
            ],
          },
        );
      } else if (ruleType === 'all') {
        // 代理全部数据
        rules.push(
          {
            type: 'field',
            outboundTag: 'direct',
            domain: ['domain:cypress.io', 'geosite:private'],
          },
          {
            type: 'field',
            outboundTag: 'direct',
            ip: [
              '8.8.8.8/32',
              '223.5.5.5/32',
              '119.29.29.29/32',
              '180.76.76.76/32',
              '114.114.114.114/32',
              'geoip:private',
            ],
          },
        );
      }
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
        hosts: {
          'dns.google': '8.8.8.8',
          'dns.pub': '119.29.29.29',
          'dns.alidns.com': '223.5.5.5',
          'geosite:category-ads-all': '127.0.0.1',
        },
        servers: [
          {
            address: 'https://1.1.1.1/dns-query',
            domains: ['geosite:geolocation-!cn'],
            expectIPs: ['geoip:!cn'],
          },
          '8.8.8.8',
          {
            address: '223.5.5.5',
            port: 53,
            domains: ['geosite:cn', 'geosite:category-games@cn'],
            expectIPs: ['geoip:cn'],
            skipFallback: true,
          },
          {
            address: 'localhost',
            skipFallback: true,
          },
        ],
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
        rules,
      },
      stats: {},
      inbounds,
      outbounds,
    };

    if (!configDir) {
      [configDir, dataDir] = await Promise.all([appConfigDir(), appDataDir()]);
      configDir = await join(configDir, 'config');
    }

    this.filename = await join(configDir, `${endpoint.id}.json`);
    await writeTextFile(this.filename, JSON.stringify(config, undefined, 2));

    // 启动 xray
    const cmd = Command.sidecar('xray/xray', ['-config', this.filename], {
      env: {
        XRAY_LOCATION_ASSET: dataDir,
      },
      encoding: 'utf-8',
    });
    cmd.stdout.on('data', redirectLog);
    cmd.stderr.on('data', redirectLog);

    const waitForStarted = new Promise<void>((resolve, reject) => {
      const watchForStarted = (line: string) => {
        if (line.includes('Xray') && line.includes('started')) {
          cmd.stdout.off('data', watchForStarted);
          resolve();
        } else if (line.includes('Failed to start')) {
          cmd.stdout.off('data', watchForStarted);
          reject(line);
        }
      };

      cmd.stdout.on('data', watchForStarted);
    });

    this.child = await cmd.spawn();
    await waitForStarted;
    await info(`Xray started with PID ${this.child.pid} on port ${this.aport}`);
  }

  /** 停止 xray。 */
  public async stop() {
    if (this.child) {
      await Promise.allSettled([
        info(`Stopping on port ${this.aport}`),
        this.child.kill(),
        removeFile(this.filename, { dir: BaseDirectory.Temp }),
      ]);

      this.child = null;
      this.aport = 0;
      this.filename = '';
    }
  }
}
