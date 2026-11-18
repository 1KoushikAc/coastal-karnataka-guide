// src/navigation/types.ts
// Central definition of the navigation stack and its route params.
// Extend this file as new screens are added in later milestones.

export type RootStackParamList = {
  Welcome: undefined;
  TripBuilder: {
    destinationId?: string;
  } | undefined;
  PersonalizedTourPreview: {
    planId: string;
  };
  ChooseInterest: undefined;
  ChooseTour: {
    /** The category selected on the ChooseInterest screen */
    category: string;
  };
  TourPreview: {
    /** The ID of the tour to preview — resolved against M1 data or custom registry */
    tourId: string;
  };
  ActiveTour: {
    /** The ID of the tour being walked — resolved against M1 or personalized data */
    tourId: string;
  };
  StopStory: {
    /**
     * The ID of the tour being walked.
     * Used to resolve stop order and tour name for context.
     */
    tourId: string;
    /**
     * 0-based index of the stop whose story is being shown.
     * The screen resolves attraction + story from M1 data.
     */
    stopIndex: number;
  };
  DevLocationDiagnostic: undefined;
  QuickHelp: {
    source?: 'welcome' | 'active_tour' | 'destination';
  } | undefined;
};
