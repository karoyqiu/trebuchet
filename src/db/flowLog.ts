import { entity } from 'simpler-state';
import { dbQueryFlows } from '../api/bindings';

export type { Flow as FlowLog } from '../api/bindings';

export const flowLogs = entity(dbQueryFlows());

export const reloadFlowLogs = async () => {
  const items = await dbQueryFlows();
  flowLogs.set(items);
};
