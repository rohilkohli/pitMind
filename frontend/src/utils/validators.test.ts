import { describe, expect, it } from 'vitest';
import { isAuditLogEntry } from './validators';
import type { AuditLogEntry } from '../types/api';

describe('isAuditLogEntry', () => {
  it('should return true for a valid AuditLogEntry', () => {
    const validEntry: AuditLogEntry = {
      id: 'log-123',
      timestamp: '2023-10-27T10:00:00Z',
      session_id: 'session-456',
      driver: 'VER',
      lap: 42,
      strategy_type: 'pit_stop',
      confidence: 0.85,
      reasoning: 'Tire degradation is high.'
    };

    expect(isAuditLogEntry(validEntry)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isAuditLogEntry(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isAuditLogEntry(undefined)).toBe(false);
  });

  it('should return false for primitive values', () => {
    expect(isAuditLogEntry('string')).toBe(false);
    expect(isAuditLogEntry(123)).toBe(false);
    expect(isAuditLogEntry(true)).toBe(false);
  });

  it('should return false if missing required properties', () => {
    const missingId = {
      timestamp: '2023-10-27T10:00:00Z',
      session_id: 'session-456',
      driver: 'VER',
      lap: 42,
      strategy_type: 'pit_stop',
      confidence: 0.85,
      reasoning: 'Tire degradation is high.'
    };
    expect(isAuditLogEntry(missingId)).toBe(false);

    const missingReasoning = {
      id: 'log-123',
      timestamp: '2023-10-27T10:00:00Z',
      session_id: 'session-456',
      driver: 'VER',
      lap: 42,
      strategy_type: 'pit_stop',
      confidence: 0.85
    };
    expect(isAuditLogEntry(missingReasoning)).toBe(false);
  });

  it('should return false if properties have incorrect types', () => {
    const wrongIdType = {
      id: 123, // Should be string
      timestamp: '2023-10-27T10:00:00Z',
      session_id: 'session-456',
      driver: 'VER',
      lap: 42,
      strategy_type: 'pit_stop',
      confidence: 0.85,
      reasoning: 'Tire degradation is high.'
    };
    expect(isAuditLogEntry(wrongIdType)).toBe(false);

    const wrongLapType = {
      id: 'log-123',
      timestamp: '2023-10-27T10:00:00Z',
      session_id: 'session-456',
      driver: 'VER',
      lap: '42', // Should be number
      strategy_type: 'pit_stop',
      confidence: 0.85,
      reasoning: 'Tire degradation is high.'
    };
    expect(isAuditLogEntry(wrongLapType)).toBe(false);
  });

  it('should return true even if there are extra properties', () => {
    const extraProps = {
      id: 'log-123',
      timestamp: '2023-10-27T10:00:00Z',
      session_id: 'session-456',
      driver: 'VER',
      lap: 42,
      strategy_type: 'pit_stop',
      confidence: 0.85,
      reasoning: 'Tire degradation is high.',
      extra_prop: 'some value'
    };
    expect(isAuditLogEntry(extraProps)).toBe(true);
  });
});
