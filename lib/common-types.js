"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ConsoleLogger {
    debug(message) {
        console.log(message);
    }
    info(message) {
        console.info(message);
    }
    warning(message) {
        console.warn(message);
    }
    error(message) {
        console.error(message);
    }
}
exports.ConsoleLogger = ConsoleLogger;
