import { useCallback } from 'react';
import { entity } from 'simpler-state';

/** 正在更新的订阅 */
export const updatingSubs = entity<Set<number>>(new Set<number>());

const updateSubUpdating = (subs: Set<number>, subId: number, updating: boolean) => {
  const set = new Set(subs);

  if (updating) {
    set.add(subId);
  } else {
    set.delete(subId);
  }

  return set;
};

/**
 * 设置订阅是否正在更新
 * @param subId 订阅 ID
 * @param updating 是否正在更新
 */
export const setSubUpdating = (subId: number, updating: boolean) =>
  updatingSubs.set(updateSubUpdating, subId, updating);

/** 订阅是否正在更新 */
const useSubscriptionUpdating = (subId: number) => {
  const isSubUpdating = useCallback((subs: Set<number>) => subs.has(subId), [subId]);
  return updatingSubs.use(isSubUpdating);
};

export default useSubscriptionUpdating;
