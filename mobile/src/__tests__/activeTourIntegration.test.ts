// src/__tests__/activeTourIntegration.test.ts
// =============================================================================
// Active Tour Integration — Unit / Integration Tests (M5.4)
// =============================================================================
// Verifies the end-to-end integration between:
//   - M1 Tour & Stop & Attraction & Story seed data
//   - M5.1 TourSession / tourEngine
//   - M5.2 SimulatedLocationProvider & distance calculations
//   - M5.3 TourLocationController
//   - M5.4 Active Tour state & lifecycle management
//
// No React Native UI components are rendered directly in Node, but the full
// orchestration logic and unmount cleanup are verified deterministically.
// =============================================================================

import { tours, attractions, stories } from '@data/index';
import { TourLocationController } from '../engine/TourLocationController';
import { SimulatedLocationProvider } from '../engine/location/SimulatedLocationProvider';
import { getCurrentStop, getProgress } from '../engine/tourEngine';
import { offsetPoint } from '../engine/distance';
import { resolveImageSource } from '../utils/images';

describe('Active Tour Integration (M5.4)', () => {
  const heritageTour = tours.find((t) => t.id === 'mangalore-heritage-walk')!;

  test('starting a tour displays the first stop and M1 attraction data', () => {
    expect(heritageTour).toBeDefined();
    expect(heritageTour.stops.length).toBe(4);

    const firstStop = heritageTour.stops[0];
    const firstAttraction = attractions.find((a) => a.id === firstStop.attractionId)!;
    const firstStory = stories.find((s) => s.id === firstStop.storyId)!;

    expect(firstAttraction.name).toBe('Kadri Manjunatha Temple');
    expect(firstStory.title).toBe('A Thousand Years at Kadri Hill');

    // Initialize provider and controller as the ActiveTourScreen does
    const provider = new SimulatedLocationProvider(firstAttraction.coordinates);
    const controller = TourLocationController.create(heritageTour, provider, attractions);

    const session = controller.getSession();
    expect(session.hasStarted).toBe(true);
    expect(session.currentStopIndex).toBe(0);
    expect(session.isCurrentStopReached).toBe(false);
    expect(session.isComplete).toBe(false);

    const currentStop = getCurrentStop(session);
    expect(currentStop?.id).toBe(firstStop.id);

    controller.destroy();
  });

  test('simulated location outside radius does not mark the stop reached', () => {
    const firstStop = heritageTour.stops[0];
    const firstAttraction = attractions.find((a) => a.id === firstStop.attractionId)!;

    const provider = new SimulatedLocationProvider(firstAttraction.coordinates);
    const controller = TourLocationController.create(heritageTour, provider, attractions);

    // Initial position is 120m north (trigger radius is 50m)
    const dist = controller.getDistanceToCurrentStop();
    expect(dist).toBeGreaterThan(firstStop.triggerRadiusMeters);
    expect(controller.getSession().isCurrentStopReached).toBe(false);

    // Step 40% closer (120m -> ~72m, still > 50m)
    provider.moveToward(firstAttraction.coordinates);
    expect(controller.getSession().isCurrentStopReached).toBe(false);

    controller.destroy();
  });

  test('simulated location inside radius updates the active tour to reached', () => {
    const firstStop = heritageTour.stops[0];
    const firstAttraction = attractions.find((a) => a.id === firstStop.attractionId)!;

    const provider = new SimulatedLocationProvider(firstAttraction.coordinates);
    const controller = TourLocationController.create(heritageTour, provider, attractions);

    const sessionListener = jest.fn();
    controller.subscribe(sessionListener);

    // Teleport inside trigger radius
    provider.arriveAt(firstAttraction.coordinates, firstStop.triggerRadiusMeters);

    expect(controller.getSession().isCurrentStopReached).toBe(true);
    expect(sessionListener).toHaveBeenCalled();

    // Verify distance is within trigger radius
    const dist = controller.getDistanceToCurrentStop();
    expect(dist).toBeLessThanOrEqual(firstStop.triggerRadiusMeters);

    controller.destroy();
  });

  test('progress updates correctly across stops', () => {
    const firstAttraction = attractions.find((a) => a.id === heritageTour.stops[0].attractionId)!;
    const provider = new SimulatedLocationProvider(firstAttraction.coordinates);
    const controller = TourLocationController.create(heritageTour, provider, attractions);

    expect(getProgress(controller.getSession())).toBe(0);

    // Complete Stop 1
    provider.arriveAt(firstAttraction.coordinates, heritageTour.stops[0].triggerRadiusMeters);
    controller.moveToNextStop();
    expect(getProgress(controller.getSession())).toBe(1 / 4);

    // Complete Stop 2
    const stop2Attraction = attractions.find((a) => a.id === heritageTour.stops[1].attractionId)!;
    provider.arriveAt(stop2Attraction.coordinates, heritageTour.stops[1].triggerRadiusMeters);
    controller.moveToNextStop();
    expect(getProgress(controller.getSession())).toBe(2 / 4);

    controller.destroy();
  });

  test('next stop becomes active with new attraction and story content', () => {
    const stop1Attraction = attractions.find((a) => a.id === heritageTour.stops[0].attractionId)!;
    const stop2Attraction = attractions.find((a) => a.id === heritageTour.stops[1].attractionId)!;
    const stop2Story = stories.find((s) => s.id === heritageTour.stops[1].storyId)!;

    const provider = new SimulatedLocationProvider(stop1Attraction.coordinates);
    const controller = TourLocationController.create(heritageTour, provider, attractions);

    // Arrive at stop 1 and continue
    provider.arriveAt(stop1Attraction.coordinates, heritageTour.stops[0].triggerRadiusMeters);
    controller.moveToNextStop();

    // Now at stop 2
    expect(controller.getSession().currentStopIndex).toBe(1);
    expect(controller.getSession().isCurrentStopReached).toBe(false);

    const currentStop = getCurrentStop(controller.getSession());
    expect(currentStop?.id).toBe(heritageTour.stops[1].id);
    expect(currentStop?.attractionId).toBe(stop2Attraction.id);
    expect(currentStop?.storyId).toBe(stop2Story.id);

    // Story 2 is Aloysius Chapel
    expect(stop2Attraction.name).toBe('St. Aloysius Chapel');
    expect(stop2Story.title).toBe('The Chapel of a Thousand Frescoes');

    controller.destroy();
  });

  test('final stop produces completion state when finished', () => {
    const firstAttraction = attractions.find((a) => a.id === heritageTour.stops[0].attractionId)!;
    const provider = new SimulatedLocationProvider(firstAttraction.coordinates);
    const controller = TourLocationController.create(heritageTour, provider, attractions);

    // Complete stops 1, 2, 3, 4
    for (let i = 0; i < heritageTour.stops.length; i++) {
      const stop = heritageTour.stops[i];
      const attr = attractions.find((a) => a.id === stop.attractionId)!;
      provider.arriveAt(attr.coordinates, stop.triggerRadiusMeters);
      controller.moveToNextStop();
    }

    const finalSession = controller.getSession();
    expect(finalSession.isComplete).toBe(true);
    expect(finalSession.completedStopIndices.length).toBe(4);
    expect(getProgress(finalSession)).toBe(1.0);
    expect(controller.getCurrentStopCoords()).toBeNull();

    controller.destroy();
  });

  test('reset returns to the initial stop and unreached state', () => {
    const firstAttraction = attractions.find((a) => a.id === heritageTour.stops[0].attractionId)!;
    const provider = new SimulatedLocationProvider(firstAttraction.coordinates);
    const controller = TourLocationController.create(heritageTour, provider, attractions);

    // Advance 2 stops
    provider.arriveAt(firstAttraction.coordinates, 50);
    controller.moveToNextStop();
    expect(controller.getSession().currentStopIndex).toBe(1);

    // Reset
    controller.reset();
    const resetSession = controller.getSession();
    expect(resetSession.currentStopIndex).toBe(0);
    expect(resetSession.completedStopIndices.length).toBe(0);
    expect(resetSession.isCurrentStopReached).toBe(false);
    expect(resetSession.isComplete).toBe(false);

    // Provider reset to 120m away from first stop
    const dist = controller.getDistanceToCurrentStop();
    expect(dist).toBeGreaterThan(50);

    controller.destroy();
  });

  test('unmount/cleanup does not leave active location subscriptions', () => {
    const firstAttraction = attractions.find((a) => a.id === heritageTour.stops[0].attractionId)!;
    const provider = new SimulatedLocationProvider(firstAttraction.coordinates);
    const controller = TourLocationController.create(heritageTour, provider, attractions);

    // While controller is active, provider has 1 listener
    expect(provider.listenerCount).toBe(1);
    expect(controller.isListening).toBe(true);

    // Simulate screen unmount
    controller.destroy();

    // After unmount cleanup, provider has 0 listeners
    expect(provider.listenerCount).toBe(0);
    expect(controller.isListening).toBe(false);

    // Subsequent provider updates do not trigger controller
    provider.setLocation(firstAttraction.coordinates);
    expect(controller.getSession().isCurrentStopReached).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // M5.4-C1: Image Support & Current-Attraction Image Selection
  // ---------------------------------------------------------------------------

  test('all Mangalore attractions have valid image references in M1 data', () => {
    expect(attractions.length).toBeGreaterThan(0);
    for (const attr of attractions) {
      expect(attr.image).toBeDefined();
      expect(typeof attr.image.assetKey).toBe('string');
      expect(attr.image.assetKey.length).toBeGreaterThan(0);
      expect(typeof attr.image.altText).toBe('string');
      expect(attr.image.altText.length).toBeGreaterThan(0);
      expect(attr.image.isPlaceholder).toBe(true);

      // Verify asset resolves through registry
      const resolved = resolveImageSource(attr.image.assetKey);
      expect(resolved).toBeDefined();
    }
  });

  test('heritage walk tour has a valid hero image reference', () => {
    expect(heritageTour.heroImage).toBeDefined();
    expect(typeof heritageTour.heroImage?.assetKey).toBe('string');
    expect(heritageTour.heroImage?.isPlaceholder).toBe(true);

    const resolved = resolveImageSource(heritageTour.heroImage?.assetKey);
    expect(resolved).toBeDefined();
  });

  test('displayed attraction image changes automatically when advancing stops', () => {
    const provider = new SimulatedLocationProvider(attractions[0].coordinates);
    const controller = TourLocationController.create(heritageTour, provider, attractions);

    // Initial stop: Stop 1 (Kadri Temple)
    const stop1 = getCurrentStop(controller.getSession())!;
    const attr1 = attractions.find((a) => a.id === stop1.attractionId)!;
    const img1 = resolveImageSource(attr1.image.assetKey);

    expect(attr1.name).toBe('Kadri Manjunatha Temple');
    expect(attr1.image.assetKey).toBe('placeholder-kadri-manjunatha-temple');
    expect(img1).toBeDefined();

    // Advance to Stop 2
    provider.arriveAt(attr1.coordinates, stop1.triggerRadiusMeters);
    controller.moveToNextStop();

    // Stop 2 (St. Aloysius Chapel)
    const stop2 = getCurrentStop(controller.getSession())!;
    const attr2 = attractions.find((a) => a.id === stop2.attractionId)!;
    const img2 = resolveImageSource(attr2.image.assetKey);

    expect(attr2.name).toBe('St. Aloysius Chapel');
    expect(attr2.image.assetKey).toBe('placeholder-st-aloysius-chapel');
    expect(img2).toBeDefined();

    // Images must be distinct between stop 1 and stop 2
    expect(attr2.image.assetKey).not.toBe(attr1.image.assetKey);
    expect(img2).not.toBe(img1);

    controller.destroy();
  });
});
