"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const prom_client_1 = require("prom-client");
let MetricsService = class MetricsService {
    registry;
    // The central registry is created in the module and injected here.
    constructor(registry) {
        this.registry = registry;
    }
    /**
     * Creates and registers a new Counter metric.
     * @param definition The metric's name, help text, and labels.
     * @returns The created Counter instance.
     */
    createCounter(definition) {
        const counter = new prom_client_1.Counter({
            name: definition.name,
            help: definition.help,
            labelNames: definition.labelNames,
            registers: [this.registry],
        });
        return counter;
    }
    /**
     * Creates and registers a new Gauge metric.
     * @param definition The metric's name, help text, and labels.
     * @returns The created Gauge instance.
     */
    createGauge(definition) {
        const gauge = new prom_client_1.Gauge({
            name: definition.name,
            help: definition.help,
            labelNames: definition.labelNames,
            registers: [this.registry],
        });
        return gauge;
    }
    /**
     * Creates and registers a new Histogram metric.
     * @param definition The metric's name, help text, and labels.
     * @param buckets Optional histogram buckets.
     * @returns The created Histogram instance.
     */
    createHistogram(definition, buckets) {
        const histogram = new prom_client_1.Histogram({
            name: definition.name,
            help: definition.help,
            labelNames: definition.labelNames,
            buckets,
            registers: [this.registry],
        });
        return histogram;
    }
    /**
     * Returns the full metrics payload for the /metrics endpoint.
     */
    async getMetrics() {
        return this.registry.metrics();
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prom_client_1.Registry])
], MetricsService);
//# sourceMappingURL=metrics.service.js.map