import { Injectable } from '@nestjs/common';
import { context, trace } from '@opentelemetry/api';
import { TraceContext } from '../interfaces/observability.interface';

// ============================================================================
// ARCHITECTURAL NOTE:
// This service provides a simple, high-level API for interacting with the
// active OpenTelemetry trace context.
//
// The complex setup and initialization of the OpenTelemetry SDK is handled
// separately and automatically by the `TracingModule`. This service assumes
// that tracing has already been initialized if it is enabled.
// ============================================================================

@Injectable()
export class TracingService {
  /**
   * Retrieves the current active trace context.
   * This is the essential method for linking logs and events together in a
   * distributed trace.
   *
   * @returns The current TraceContext, or null if no active trace is found.
   */
  getContext(): TraceContext | null {
    // We use the official OpenTelemetry API to get the current span context.
    const spanContext = trace.getSpanContext(context.active());

    // If there's no active span, we're not in a traced request.
    if (!spanContext) {
      return null;
    }

    return {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
    };
  }

  /**
   * You can add other high-level tracing functions here as needed, for example:
   * - A method to add a custom event to the current span.
   * - A method to set a custom attribute on the current span.
   */
}