import { EventEmitter } from "node:events";
import type { RunEvent } from "@/lib/execute";

class RunEventBus {
  private emitter = new EventEmitter();
  /** Buffer events per runId so late subscribers can replay them */
  private buffers = new Map<string, RunEvent[]>();

  constructor() {
    this.emitter.setMaxListeners(0);
  }

  emit(runId: string, evt: RunEvent) {
    // Buffer the event
    let buf = this.buffers.get(runId);
    if (!buf) {
      buf = [];
      this.buffers.set(runId, buf);
    }
    buf.push(evt);

    // Also emit live for any current subscribers
    this.emitter.emit(runId, evt);

    // Clean up the buffer after run-finish (with a short retention)
    if (evt.type === "run-finish") {
      setTimeout(() => {
        this.buffers.delete(runId);
      }, 30_000);
    }
  }

  /**
   * Subscribe to live events for a run.
   * Returns a cleanup function AND the array of any buffered events
   * that were emitted before this subscription was created.
   */
  subscribe(
    runId: string,
    handler: (evt: RunEvent) => void
  ): { unsubscribe: () => void; buffered: RunEvent[] } {
    this.emitter.on(runId, handler);
    const buffered = this.buffers.get(runId) ?? [];
    return {
      unsubscribe: () => this.emitter.off(runId, handler),
      buffered: [...buffered], // snapshot
    };
  }
}

const globalForBus = globalThis as unknown as { runEventBus?: RunEventBus };
export const runEventBus = globalForBus.runEventBus ?? new RunEventBus();
if (process.env.NODE_ENV !== "production") globalForBus.runEventBus = runEventBus;
