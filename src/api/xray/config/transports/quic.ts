import { HeaderObject } from './mkcp';

/** 基于 QUIC 的传输方式。 */
export default interface QuicObject {
  /** 加密方式。默认值为不加密。 */
  security?: 'none' | 'aes-128-gcm' | 'chacha20-poly1305';
  /** 加密时所用的密钥。 */
  key?: string;
  /** 数据包头部伪装设置 */
  header?: HeaderObject;
}
