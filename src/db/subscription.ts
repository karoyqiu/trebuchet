import { object, string } from 'yup';

/** 订阅分组 */
export interface Subscription {
  id?: number;
  /** 名称 */
  name: string;
  /** 地址 */
  url: string;
}

export const subscriptionSchema = object({
  name: string().required(),
  url: string().required(),
});
