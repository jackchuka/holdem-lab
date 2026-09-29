import type { WorkerRequest } from './protocol';
import { createWorkerHandler } from './worker-core';

const handle = createWorkerHandler((m) => self.postMessage(m));
self.onmessage = (e: MessageEvent<WorkerRequest>) => handle(e.data);
