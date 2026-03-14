import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Logger, LogLevel, startTimer } from './logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger = new Logger(LogLevel.DEBUG, undefined, false);
  });

  it('should log debug messages', () => {
    logger.debug('Debug message');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Debug message'));
  });

  it('should log info messages', () => {
    logger.info('Info message');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[INFO]'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Info message'));
  });

  it('should log warn messages', () => {
    logger.warn('Warning message');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[WARN]'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Warning message'));
  });

  it('should log error messages', () => {
    logger.error('Error message');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error message'));
  });

  it('should include context in log messages', () => {
    logger.info('Message with context', { key: 'value', count: 42 });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('{"key":"value","count":42}'));
  });

  it('should include source in log messages', () => {
    logger.info('Source message', undefined, 'test-source');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[test-source]'));
  });

  it('should respect log level filtering', () => {
    const warnLogger = new Logger(LogLevel.WARN, undefined, false);
    warnLogger.debug('Should not appear');
    warnLogger.info('Should not appear');
    warnLogger.warn('Should appear');
    warnLogger.error('Should appear');
    
    const calls = consoleSpy.mock.calls;
    const lastTwoCalls = calls.slice(-2);
    expect(lastTwoCalls[0][0]).toContain('[WARN]');
    expect(lastTwoCalls[1][0]).toContain('[ERROR]');
  });

  it('should log pipeline events', () => {
    logger.pipeline('task-1', 'LAYER_1', 'Processing task');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[pipeline]'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('task-1'));
  });

  it('should log API calls', () => {
    logger.apiCall('/api/test', 'POST', 150, 200);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[api]'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('API POST /api/test'));
  });

  it('should log database operations', () => {
    logger.dbOperation('findMany', 'Target', 25);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[database]'));
  });

  it('should log errors with stack traces', () => {
    const error = new Error('Test error');
    logger.errorWithStack('Something failed', error, { extra: 'context' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[error]'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test error'));
  });
});

describe('PerformanceTimer', () => {
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should measure elapsed time', async () => {
    const timer = startTimer('Test operation');
    await new Promise(resolve => setTimeout(resolve, 50));
    const duration = timer.end();
    expect(duration).toBeGreaterThanOrEqual(50);
  });

  it('should log start and end messages', () => {
    const timer = startTimer('Test operation');
    timer.end('Completed successfully');
    // Note: debug logs may not appear if LOG_LEVEL is above DEBUG
    // We test that at least the end message is logged
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0]).toContain('Completed successfully');
  });
});
