export const toyboxBrand = {
  amber: '#FFBF47',
  coral: '#FF626B',
  sky: '#45B9FF',
  violet: '#8664EF',
  mint: '#43D9AD',
  cream: '#FFF2DF',
} as const;

export type ToyboxPalette = Readonly<{
  background: string;
  ground: string;
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  ink: string;
  muted: string;
  haze: string;
}>;

export const toyboxPalettes = {
  base: {
    background: '#D7E8ED', ground: '#D6BFA8', primary: toyboxBrand.amber,
    secondary: toyboxBrand.sky, accent: toyboxBrand.coral, neutral: toyboxBrand.cream,
    ink: '#252341', muted: '#748E9D', haze: '#D7E8ED',
  },
  city: {
    background: '#B6DCE2', ground: '#BB9F85', primary: '#FCB84B',
    secondary: '#4A9EAB', accent: '#F06B62', neutral: '#F7DEC5',
    ink: '#293747', muted: '#638091', haze: '#C2D3D4',
  },
  nature: {
    background: '#C6DECD', ground: '#A2B58A', primary: '#568C60',
    secondary: '#DBAD62', accent: '#EB7555', neutral: '#F0DEB9',
    ink: '#293E38', muted: '#779087', haze: '#D8E0C3',
  },
  interior: {
    background: '#D0A095', ground: '#A96F62', primary: '#BE6055',
    secondary: '#508B87', accent: '#FFCA68', neutral: '#F6DBC0',
    ink: '#3E2B3D', muted: '#927675', haze: '#DBA797',
  },
  night: {
    background: '#171C37', ground: '#353F5E', primary: '#5677B8',
    secondary: '#796C9B', accent: '#FFD179', neutral: '#D7D7E7',
    ink: '#13192B', muted: '#4E5E7C', haze: '#282B49',
  },
  space: {
    background: '#1D2244', ground: '#56527A', primary: '#9379DA',
    secondary: '#5DA6B5', accent: '#F8B960', neutral: '#E4DAEE',
    ink: '#191A34', muted: '#595F83', haze: '#2E3155',
  },
  laboratory: {
    background: '#CADDD7', ground: '#A6BCBD', primary: '#4CB291',
    secondary: '#5986B1', accent: '#F5B64C', neutral: '#EEF2DB',
    ink: '#274052', muted: '#738F9E', haze: '#D7E6DA',
  },
  technology: {
    background: '#293650', ground: '#47536E', primary: '#579CC3',
    secondary: '#7974BA', accent: '#63E2C0', neutral: '#DFE9ED',
    ink: '#1B2436', muted: '#637E98', haze: '#394460',
  },
  comedy: {
    background: '#E8BEB3', ground: '#C89681', primary: '#EA7260',
    secondary: '#5CA9A8', accent: '#FFD15E', neutral: '#FFF0D5',
    ink: '#383051', muted: '#9D8A98', haze: '#E9C5B7',
  },
  tension: {
    background: '#273940', ground: '#4B5759', primary: '#527A78',
    secondary: '#73728D', accent: '#E97866', neutral: '#DADECE',
    ink: '#1D262E', muted: '#5D7278', haze: '#35474D',
  },
  climax: {
    background: '#5F4D7E', ground: '#7B637D', primary: '#A984CB',
    secondary: '#59AAA0', accent: '#FFC675', neutral: '#F3D8BD',
    ink: '#30273B', muted: '#806682', haze: '#786182',
  },
} as const satisfies Record<string, ToyboxPalette>;

export const toyboxQuality = {
  preview: {pixelRatio: 0.38, bevelSegments: 1, roundSegments: 12, shadowMap: 0, microTextures: false, reflection: false, extras: 0, particles: 10},
  balanced: {pixelRatio: 0.55, bevelSegments: 2, roundSegments: 20, shadowMap: 512, microTextures: true, reflection: true, extras: 1, particles: 24},
  final: {pixelRatio: 1, bevelSegments: 3, roundSegments: 28, shadowMap: 1024, microTextures: true, reflection: true, extras: 2, particles: 38},
} as const;

export type ToyboxQuality = keyof typeof toyboxQuality;
export type ToyboxPaletteName = keyof typeof toyboxPalettes;

export type ToyLightingPreset =
  | 'sunnyToyCity'
  | 'cozyInterior'
  | 'softStudio'
  | 'cinematicNight'
  | 'neonTechnology'
  | 'spaceAdventure'
  | 'colorfulLaboratory'
  | 'dramaticClimax'
  | 'goldenHour';

export const toyboxDirections = {
  city: {name: 'Toybox City', palette: 'city', lighting: 'sunnyToyCity'},
  science: {name: 'Toybox Science', palette: 'laboratory', lighting: 'colorfulLaboratory'},
  space: {name: 'Toybox Space', palette: 'space', lighting: 'spaceAdventure'},
  gaming: {name: 'Toybox Gaming', palette: 'technology', lighting: 'neonTechnology'},
  comedy: {name: 'Toybox Comedy', palette: 'comedy', lighting: 'goldenHour'},
  dark: {name: 'Toybox Dark', palette: 'tension', lighting: 'cinematicNight'},
  product: {name: 'Toybox Product', palette: 'interior', lighting: 'cozyInterior'},
  infographics: {name: 'Toybox Infographics', palette: 'base', lighting: 'softStudio'},
} as const satisfies Record<string, {name: string; palette: ToyboxPaletteName; lighting: ToyLightingPreset}>;

export type ToyboxDirection = keyof typeof toyboxDirections;
export type ToyboxTheme = {
  readonly direction: ToyboxDirection;
  readonly name: string;
  readonly palette: ToyboxPalette;
  readonly lighting: ToyLightingPreset;
  readonly quality: ToyboxQuality;
  readonly budget: (typeof toyboxQuality)[ToyboxQuality];
};

export function getToyboxTheme(
  direction: ToyboxDirection = 'city',
  quality: ToyboxQuality = 'balanced',
  overrides: {
    palette?: ToyboxPaletteName | Partial<ToyboxPalette>;
    lighting?: ToyLightingPreset;
  } = {},
): ToyboxTheme {
  const {palette, lighting, name} = toyboxDirections[direction];
  const selected = typeof overrides.palette === 'string'
    ? toyboxPalettes[overrides.palette]
    : {...toyboxPalettes[palette], ...overrides.palette};

  return {
    direction,
    name,
    palette: selected,
    lighting: overrides.lighting ?? lighting,
    quality,
    budget: toyboxQuality[quality],
  };
}
