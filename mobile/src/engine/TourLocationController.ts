// src/engine/TourLocationController.ts
// =============================================================================
// TourLocationController — Location-Aware Tour Progression
// =============================================================================
// Coordinates three independent systems:
//
//   TourSession        ← pure tour state (M5.1, engine/tourEngine.ts)
//   LocationProvider   ← current position source (M5.2, engine/location/types.ts)
//   distance utilities ← haversine calculation (M5.2, engine/distance.ts)
//
// Responsibilities:
//   - Obtain the current position from the LocationProvider.
//   - Look up the current stop's coordinates.
//   - Compute the distance between them (using computeDistanceMeters — never duplicated).
//   - Decide whether the traveler is inside the stop's triggerRadiusMeters.
//   - If so, mark the stop as reached via the tour engine.
//
// What this class does NOT do:
//   - It does not auto-advance to the next stop.
//     That is a separate user action: call moveToNextStop().
//   - It does not contain UI logic.
//   - It does not import SimulatedLocationProvider.
//     It depends only on the LocationProvider interface.
// =============================================================================

import type { Tour } from '@shared-types/index';
import {
  startTour,
  getCurrentStop,
  markCurrentStopReached,
  moveToNextStop,
  resetTour,
} from './tourEngine';
import type { TourSession } from './types';
import type { LocationProvider } from './location/types';
import { computeDistanceMeters, type GeoPoint } from './distance';

// ---------------------------------------------------------------------------
// StopCoordinateLookup
// A structural type — accepts any object with id + coordinates.
// Compatible with M1 Attraction[] but does not import from @shared-types.
// ---------------------------------------------------------------------------

export interface StopCoordinateLookup {
  readonly id: string;
  readonly coordinates: { readonly latitude: number; readonly longitude: number };
}

// ---------------------------------------------------------------------------
// TourLocationController
// ---------------------------------------------------------------------------

export class TourLocationController {
  private _session: TourSession;
  private readonly _provider: LocationProvider;
  private readonly _coordsByAttractionId: ReadonlyMap<string, GeoPoint>;

  // ---------------------------------------------------------------------------
  // Private constructor — use TourLocationController.create() externally
  // ---------------------------------------------------------------------------

  private constructor(
    session: TourSession,
    provider: LocationProvider,
    coordsByAttractionId: ReadonlyMap<string, GeoPoint>,
  ) {
    this._session = session;
    this._provider = provider;
    this._coordsByAttractionId = coordsByAttractionId;
  }

  // ---------------------------------------------------------------------------
  // Factory method
  // ---------------------------------------------------------------------------

  /**
   * Creates a TourLocationController for the given tour.
   *
   * @param tour        The tour to walk.
   * @param provider    Any LocationProvider implementation (simulated or real).
   * @param attractions Objects with `id` and `coordinates` — compatible with M1 Attraction[].
   *
   * @example
   * // With M1 data:
   * TourLocationController.create(tour, provider, mangaloreAttractions);
   *
   * // With test fixtures (structural typing — no import needed):
   * TourLocationController.create(tour, provider, [
   *   { id: 'attr-1', coordinates: { latitude: 0, longitude: 0 } },
   * ]);
   */
  static create(
    tour: Tour,
    provider: LocationProvider,
    attractions: readonly StopCoordinateLookup[],
  ): TourLocationController {
    const map = new Map<string, GeoPoint>(
      attractions.map((a) => [
        a.id,
        { latitude: a.coordinates.latitude, longitude: a.coordinates.longitude },
      ]),
    );
    return new TourLocationController(startTour(tour), provider, map);
  }

  // ---------------------------------------------------------------------------
  // Accessors
  // ---------------------------------------------------------------------------

  /** The current tour session state. Immutable snapshot. */
  getSession(): TourSession {
    return this._session;
  }

  /**
   * The coordinates of the current stop's attraction, or null if:
   *   - The tour is complete.
   *   - The attraction ID is not found in the lookup.
   */
  getCurrentStopCoords(): GeoPoint | null {
    const stop = getCurrentStop(this._session);
    if (!stop) return null;
    return this._coordsByAttractionId.get(stop.attractionId) ?? null;
  }

  /**
   * Distance in meters from the current simulated/real position
   * to the current stop's attraction.
   *
   * Returns null when:
   *   - The tour is complete (no current stop).
   *   - The stop's attraction coordinates are not in the lookup.
   */
  getDistanceToCurrentStop(): number | null {
    const stopCoords = this.getCurrentStopCoords();
    if (!stopCoords) return null;
    const currentPos = this._provider.getCurrentLocation();
    return computeDistanceMeters(currentPos, stopCoords);
  }

  // ---------------------------------------------------------------------------
  // Core operation: process a location update
  // ---------------------------------------------------------------------------

  /**
   * Reads the current position from the LocationProvider, computes the
   * distance to the current stop, and — if within triggerRadiusMeters —
   * marks the stop as reached.
   *
   * Behavior:
   *   - If the stop was already reached: no-op (idempotent).
   *   - If the tour is complete: no-op.
   *   - If the attraction lookup fails: no-op (safe degradation).
   *   - Does NOT advance to the next stop.
   *     Call moveToNextStop() separately (explicit user action).
   *
   * @returns The updated TourSession.
   */
  checkLocation(): TourSession {
    // Early exits
    if (this._session.isComplete) return this._session;
    if (this._session.isCurrentStopReached) return this._session; // idempotent

    const stop = getCurrentStop(this._session);
    const stopCoords = this.getCurrentStopCoords();
    if (!stop || !stopCoords) return this._session;

    const distance = computeDistanceMeters(
      this._provider.getCurrentLocation(),
      stopCoords,
    );

    if (distance <= stop.triggerRadiusMeters) {
      this._session = markCurrentStopReached(this._session);
    }

    return this._session;
  }

  // ---------------------------------------------------------------------------
  // Progression
  // ---------------------------------------------------------------------------

  /**
   * Advances to the next stop (or marks the tour complete on the final stop).
   *
   * Requirements (inherited from engine/tourEngine.ts):
   *   - The current stop must be reached first (checkLocation() inside radius).
   *   - Returns the session unchanged if the stop was not yet reached.
   *   - No-op if the tour is already complete.
   *
   * @returns The updated TourSession.
   */
  moveToNextStop(): TourSession {
    this._session = moveToNextStop(this._session);
    return this._session;
  }

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------

  /**
   * Resets the tour session to its initial state AND resets the
   * LocationProvider to the first stop's coordinates.
   *
   * @param overrideStartCoords  Optional — if provided, the provider resets
   *                             to these coordinates instead of the first stop.
   * @returns The fresh TourSession.
   */
  reset(overrideStartCoords?: GeoPoint): TourSession {
    this._session = resetTour(this._session);

    // Reset the provider to the first stop's attraction, or the override.
    const firstStop = this._session.tour.stops[0];
    const resetTarget: GeoPoint =
      overrideStartCoords ??
      (firstStop
        ? (this._coordsByAttractionId.get(firstStop.attractionId) ?? { latitude: 0, longitude: 0 })
        : { latitude: 0, longitude: 0 });

    this._provider.reset(resetTarget);
    return this._session;
  }
}
