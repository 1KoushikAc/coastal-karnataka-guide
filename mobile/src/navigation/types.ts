// src/navigation/types.ts
// Central definition of the navigation stack and its route params.
// Extend this file as new screens are added in later milestones.

export type RootStackParamList = {
  Welcome: undefined;
  ChooseInterest: undefined;
  ChooseTour: {
    /** The category selected on the ChooseInterest screen */
    category: string;
  };
  TourPreview: {
    /** The ID of the tour to preview — resolved against M1 data */
    tourId: string;
  };
  ActiveTour: {
    /** The ID of the tour being walked — resolved against M1 data */
    tourId: string;
  };
  DevLocationDiagnostic: undefined;
};
