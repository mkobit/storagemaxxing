/* eslint-disable functional/no-expression-statements, functional/immutable-data, functional/no-try-statements */
import { checkFeasibility } from "../feasibility.js";
import type { WorkerRequest, WorkerResponse } from "../index.js";

const handleMessage = async (e: MessageEvent<WorkerRequest>): Promise<void> => {
  const request = e.data;
  if (request.type === "check_feasibility") {
      const result = await checkFeasibility(request.data).catch(() => ({
            feasible: false,
            conflicts: ["Worker error"],
            suggestedCounts: {}
      }));
      const response: WorkerResponse = {
        type: "feasibility_result",
        result
      };
      self.postMessage(response);
  }
};

self.onmessage = handleMessage;
