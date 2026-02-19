
export enum InteriorStyle {
  Modern = 'Modern',
  Summer = 'Summer',
  Professional = 'Professional',
  Tropical = 'Tropical',
  Coastal = 'Coastal',
  Vintage = 'Vintage',
  Industrial = 'Industrial',
  Neoclassic = 'Neoclassic',
  Tribal = 'Tribal',
  SmartTech = 'Smart & Hidden Tech',
  Minimalist = 'Minimalist',
  Bohemian = 'Bohemian',
  ArtDeco = 'Art Deco',
  Scandinavian = 'Scandinavian',
  Japandi = 'Japandi'
}

export enum RoomType {
  LivingRoom = 'Living Room',
  Kitchen = 'Kitchen',
  Bedroom = 'Bedroom',
  Bathroom = 'Bathroom',
  GamingRoom = 'Gaming Room',
  Basement = 'Basement',
  DiningRoom = 'Dining Room',
  WorkRoom = 'Work Room',
  OutdoorArea = 'Outdoor Area'
}

export enum LightingMode {
  Day = 'Daylight',
  Night = 'Night/Warm'
}

export interface GenerationConfig {
  style: InteriorStyle;
  roomType: RoomType;
  lighting: LightingMode;
  image: string | null;
}

export interface HistoryItem {
  id: string;
  originalImage: string;
  resultImage: string;
  config: GenerationConfig;
  timestamp: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}
