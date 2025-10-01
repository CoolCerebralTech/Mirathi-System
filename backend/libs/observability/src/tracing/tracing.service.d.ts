import { TraceContext } from '../interfaces/observability.interface';
export declare class TracingService {
    /**
     * Retrieves the current active trace context.
     * This is the essential method for linking logs and events together in a
     * distributed trace.
     *
     * @returns The current TraceContext, or null if no active trace is found.
     */
    getContext(): TraceContext | null;
}
//# sourceMappingURL=tracing.service.d.ts.map