// Local images bundled with the app (served from /images/)
// Copied from Pexels (free for commercial use) so they work offline/on any device

export const IMAGES = {
  // Tanzanian Women Farmers
  tanzaniaWoman1: '/images/african-woman.jpg',
  tanzaniaWoman2: '/images/farmer-tablet.jpg',
  africanWomanFarmer: '/images/african-woman.jpg',

  // Maize / Corn
  maizeField: '/images/maize-field.jpg',
  maizeCloseup: '/images/maize-closeup.jpg',
  maizeLeaves: '/images/maize-leaves.jpg',
  maizeSunlit: '/images/maize-sunlit.jpg',

  // Beans
  beanVines: '/images/bean-vines.jpg',
  beanLeaves: '/images/bean-leaves.jpg',

  // General Agriculture
  farmerField: '/images/farmer-field.jpg',
  farmerTablet: '/images/farmer-tablet.jpg',
  fertilizerHands: '/images/fertilizer-hands.jpg',
  greenField: '/images/green-field.jpg',
  fertilizerTractor: '/images/fertilizer-tractor.jpg',
  cornField: '/images/corn-field.jpg',
} as const;

// Page-specific image assignments for variety
export const PAGE_IMAGES = {
  splash: [IMAGES.maizeSunlit, IMAGES.beanVines],
  onboarding: [
    { ...IMAGES, key: 'maizeCloseup' as const },
    { ...IMAGES, key: 'beanLeaves' as const },
    { ...IMAGES, key: 'fertilizerHands' as const },
    { ...IMAGES, key: 'greenField' as const },
  ],
  login: [IMAGES.africanWomanFarmer, IMAGES.tanzaniaWoman1],
  register: [IMAGES.tanzaniaWoman2, IMAGES.farmerTablet],
  home: IMAGES.maizeField,
  scan: IMAGES.beanVines,
  profile: IMAGES.tanzaniaWoman1,
};

export type ImageKey = keyof typeof IMAGES;
