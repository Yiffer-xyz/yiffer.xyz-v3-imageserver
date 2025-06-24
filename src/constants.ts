export const BASE_THUMB_WIDTH = 160;
export const BASE_THUMB_HEIGHT = 226;
export const MULTIPLIERS_TO_MAKE_THUMBNAILS = [2, 3];
export const MAX_PAGE_WIDTH = 1800;
export const COMIC_CARD_MAX_WIDTH = BASE_THUMB_WIDTH * 3;
export const COMIC_CARD_MAX_HEIGHT = BASE_THUMB_HEIGHT * 3;

export type AdType = 'card' | 'banner' | 'topSmall';

export const PROFILE_PIC_SIZE = 400;

export const R2_TEMP_FOLDER = 'temp';
export const R2_PROFILE_PHOTOS_FOLDER = 'profile-photos';
export const R2_COMICS_FOLDER = 'comics';

export type AdvertisementInfo = {
  name: AdType;
  title: string;
  description: string;
  freeTrialOffered: boolean;
  hasTexts: boolean;
  minDimensions: {
    width: number;
    height: number;
  };
  idealDimensions?: {
    width: number;
    height: number;
  };
  pricesForMonts: {
    1: number;
    4: number;
    12: number;
  };
};

export const ADVERTISEMENTS: AdvertisementInfo[] = [
  {
    name: 'card',
    title: 'Comic card',
    description: 'Shows up in the list of comics on the main browse page.',
    freeTrialOffered: true,
    hasTexts: true,
    minDimensions: {
      width: COMIC_CARD_MAX_WIDTH,
      height: COMIC_CARD_MAX_HEIGHT,
    },
    pricesForMonts: {
      1: 14,
      4: 48, // 12 per month
      12: 120, // 10 per month
    },
  },
  {
    name: 'banner',
    title: 'Banner above comics',
    description: 'Wide banner at the top when viewing a comic.',
    freeTrialOffered: true,
    hasTexts: false,
    minDimensions: {
      width: 728,
      height: 90,
    },
    idealDimensions: {
      width: 728 * 2,
      height: 90 * 2,
    },
    pricesForMonts: {
      1: 18,
      4: 64, // 16 per month
      12: 168, // 14 per month
    },
  },
  {
    name: 'topSmall',
    title: 'Browse top banner',
    description: 'Semi-wide banner at the top of the main browse page',
    freeTrialOffered: true,
    hasTexts: false,
    minDimensions: {
      width: 300,
      height: 90,
    },
    idealDimensions: {
      width: 300 * 2,
      height: 90 * 2,
    },
    pricesForMonts: {
      1: 20,
      4: 68, // 17 per month
      12: 168, // 14 per month
    },
  },
];

export function isAdType(adTypeString: string): adTypeString is AdType {
  return ADVERTISEMENTS.some(ad => ad.name === adTypeString);
}
