import type { RideState } from '@herway/shared';

export interface DemoRide {
  rideId: string;
  riderId: string;
  state: RideState;
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };
  rideCategory: 'standard' | 'premium' | 'accessible';
  createdAt: string;
  updatedAt: string;
}

export interface DemoSOSCase {
  sosId: string;
  rideId: string;
  riderId: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'ESCALATED' | 'RESOLVED';
  createdAt: string;
}

export interface DemoAuditEvent {
  eventId: string;
  action: string;
  targetType: 'ride' | 'sos';
  targetId: string;
  riderId: string;
  idempotencyKey: string;
  outcome: 'success' | 'failure';
  occurredAt: string;
}

export class DemoRepository {
  private readonly rides = new Map<string, DemoRide>();
  private readonly sosCases = new Map<string, DemoSOSCase>();
  private readonly audit = new Map<string, DemoAuditEvent>();
  private sequence = 0;

  createRide(input: Omit<DemoRide, 'rideId' | 'state' | 'createdAt' | 'updatedAt'>): DemoRide {
    this.sequence += 1;
    const now = new Date().toISOString();
    const ride: DemoRide = {
      ...input,
      rideId: `demo-ride-${this.sequence.toString().padStart(6, '0')}`,
      state: 'SEARCHING',
      createdAt: now,
      updatedAt: now
    };
    this.rides.set(ride.rideId, ride);
    return ride;
  }

  getRide(rideId: string): DemoRide | undefined {
    return this.rides.get(rideId);
  }

  cancelRide(rideId: string): DemoRide | undefined {
    const ride = this.rides.get(rideId);
    if (!ride || ride.state === 'COMPLETED' || ride.state === 'CANCELLED') return ride;
    const updated: DemoRide = { ...ride, state: 'CANCELLED', updatedAt: new Date().toISOString() };
    this.rides.set(rideId, updated);
    return updated;
  }

  recordAudit(event: Omit<DemoAuditEvent, 'eventId' | 'occurredAt'>): void {
    this.sequence += 1;
    const auditEvent: DemoAuditEvent = {
      ...event,
      eventId: `demo-audit-${this.sequence.toString().padStart(6, '0')}`,
      occurredAt: new Date().toISOString()
    };
    this.audit.set(auditEvent.eventId, auditEvent);
  }

  createSOS(input: Omit<DemoSOSCase, 'sosId' | 'status' | 'createdAt'>): DemoSOSCase {
    this.sequence += 1;
    const sos: DemoSOSCase = {
      ...input,
      sosId: `demo-sos-${this.sequence.toString().padStart(6, '0')}`,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };
    this.sosCases.set(sos.sosId, sos);
    return sos;
  }
}

export const demoRepository = new DemoRepository();
