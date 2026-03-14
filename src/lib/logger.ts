/**
 * magB Logging Infrastructure
 * 
 * Provides structured logging with levels, context, and file output.
 * Supports development and production environments.
 */

import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  source?: string;
}

export class Logger {
  private level: LogLevel;
  private logFile?: string;
  private useColors: boolean;

  constructor(
    level: LogLevel = LogLevel.INFO,
    logFile?: string,
    useColors = true
  ) {
    this.level = level;
    this.logFile = logFile;
    this.useColors = useColors;

    // Ensure log directory exists
    if (logFile) {
      const dir = path.dirname(logFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  private formatLevel(level: LogLevel): string {
    const levels = {
      [LogLevel.DEBUG]: 'DEBUG',
      [LogLevel.INFO]: 'INFO',
      [LogLevel.WARN]: 'WARN',
      [LogLevel.ERROR]: 'ERROR',
    };

    if (!this.useColors) return levels[level];

    const colors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
    };

    return `${colors[level]}${levels[level]}\x1b[0m`;
  }

  private formatContext(context?: LogContext): string {
    if (!context || Object.keys(context).length === 0) return '';
    return ` ${JSON.stringify(context)}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext, source?: string) {
    if (level < this.level) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      source,
    };

    const logLine = `[${entry.timestamp}] [${this.formatLevel(level)}]${source ? ` [${source}]` : ''} ${message}${this.formatContext(context)}`;

    // Console output
    console.log(logLine);

    // File output
    if (this.logFile) {
      const fileLine = `[${entry.timestamp}] [${LogLevel[level]}]${source ? ` [${source}]` : ''} ${message}${this.formatContext(context)}\n`;
      fs.appendFileSync(this.logFile, fileLine);
    }
  }

  debug(message: string, context?: LogContext, source?: string) {
    this.log(LogLevel.DEBUG, message, context, source);
  }

  info(message: string, context?: LogContext, source?: string) {
    this.log(LogLevel.INFO, message, context, source);
  }

  warn(message: string, context?: LogContext, source?: string) {
    this.log(LogLevel.WARN, message, context, source);
  }

  error(message: string, context?: LogContext, source?: string) {
    this.log(LogLevel.ERROR, message, context, source);
  }

  // Specialized logging for pipeline phases
  pipeline(taskId: string, phase: string, message: string, context?: LogContext) {
    this.info(message, { ...context, taskId, phase }, 'pipeline');
  }

  // API call logging
  apiCall(endpoint: string, method: string, duration: number, status?: number) {
    this.info(`API ${method} ${endpoint}`, { duration: `${duration}ms`, status }, 'api');
  }

  // Database operation logging
  dbOperation(operation: string, model: string, duration: number) {
    this.debug(`DB ${operation} ${model}`, { duration: `${duration}ms` }, 'database');
  }

  // Error with stack trace
  errorWithStack(message: string, error: Error, context?: LogContext) {
    this.log(LogLevel.ERROR, `${message}: ${error.message}`, {
      ...context,
      stack: error.stack,
      name: error.name,
    }, 'error');
  }
}

// Default logger instance
export const logger = new Logger(
  process.env.LOG_LEVEL ? LogLevel[process.env.LOG_LEVEL as keyof typeof LogLevel] : LogLevel.INFO,
  process.env.LOG_FILE
);

// Performance timing helper
export class PerformanceTimer {
  private startTime: number;
  private label: string;
  private context?: LogContext;

  constructor(label: string, context?: LogContext) {
    this.label = label;
    this.context = context;
    this.startTime = Date.now();
    logger.debug(`Starting: ${label}`, context, 'perf');
  }

  end(message?: string) {
    const duration = Date.now() - this.startTime;
    logger.info(message || `Completed: ${this.label}`, {
      ...this.context,
      duration: `${duration}ms`,
    }, 'perf');
    return duration;
  }
}

export function startTimer(label: string, context?: LogContext) {
  return new PerformanceTimer(label, context);
}
