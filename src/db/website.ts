import { object, string } from 'yup';

/** 站点 */
export interface Website {
  id?: number;
  /** 名称 */
  name: string;
  /** 地址 */
  url: string;
}

export const websiteSchema = object({
  name: string().required(),
  url: string().required(),
});
