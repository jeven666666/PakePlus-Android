export interface Asset {
  id: string
  type: 'image' | 'video'
  url: string
  thumbnailUrl: string
  taskId: string
  createdAt: number
  favorited: boolean
  tags: string[]
}

export interface Template {
  id: string
  name: string
  type: 'prompt' | 'params' | 'style'
  description: string
  content: Record<string, unknown>
  createdAt: number
}

const imagePrompts = [
  'Cyberpunk cityscape at night, neon lights reflecting on wet streets',
  'Serene Japanese garden with cherry blossoms, morning mist',
  'Futuristic space station orbiting Earth, cinematic lighting',
  'Portrait of a warrior queen, fantasy art style, detailed armor',
  'Underwater coral reef with bioluminescent creatures',
  'Steampunk airship flying over Victorian London',
  'Minimalist architectural interior, concrete and glass',
  'Magical forest with glowing mushrooms and fireflies',
]

const videoPrompts = [
  'Camera slowly panning across a mountain landscape at golden hour',
  'Waves crashing on a rocky shore, dramatic slow motion',
  'Time-lapse of a flower blooming in a dark room',
  'Aerial drone shot of a misty forest at dawn',
]

export const mockAssets: Asset[] = Array.from({ length: 12 }, (_, i) => ({
  id: `asset_${i + 1}`,
  type: i < 8 ? 'image' : 'video',
  url: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(imagePrompts[i % imagePrompts.length])}&image_size=landscape_16_9`,
  thumbnailUrl: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(imagePrompts[i % imagePrompts.length])}&image_size=square_hd`,
  taskId: `task_mock_${i + 1}`,
  createdAt: Date.now() - (i + 1) * 3600000,
  favorited: i < 3,
  tags: i < 3 ? ['收藏'] : i < 6 ? ['最近'] : ['素材'],
}))

export const mockTemplates: Template[] = [
  {
    id: 'tpl_1',
    name: '赛博朋克城市',
    type: 'style',
    description: '霓虹灯光、暗色调、未来感城市风格',
    content: { style: 'cyberpunk', creativity: 75, detail: 85 },
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'tpl_2',
    name: '人像摄影',
    type: 'prompt',
    description: '专业人像摄影提示词模板',
    content: { prompt: 'Professional portrait photography, studio lighting, shallow depth of field', negativePrompt: 'blurry, deformed, low quality' },
    createdAt: Date.now() - 172800000,
  },
  {
    id: 'tpl_3',
    name: '电影级风景',
    type: 'params',
    description: '电影级画面参数配置',
    content: { aspectRatio: '16:9', resolution: '1920x1080', steps: 50, cfgScale: 7.5, hdFix: true },
    createdAt: Date.now() - 259200000,
  },
  {
    id: 'tpl_4',
    name: '日系动漫',
    type: 'style',
    description: '日式动漫插画风格',
    content: { style: 'anime', creativity: 80, detail: 70 },
    createdAt: Date.now() - 345600000,
  },
  {
    id: 'tpl_5',
    name: '产品展示',
    type: 'prompt',
    description: '电商产品白底图提示词',
    content: { prompt: 'Product photography, white background, studio lighting, high detail, professional', negativePrompt: 'shadow, reflection, watermark' },
    createdAt: Date.now() - 432000000,
  },
]

export const stylePresets = [
  { id: 'none', name: '无风格', icon: '✦' },
  { id: 'cyberpunk', name: '赛博朋克', icon: '🌃' },
  { id: 'anime', name: '动漫', icon: '🎨' },
  { id: 'photography', name: '摄影', icon: '📷' },
  { id: 'oil_painting', name: '油画', icon: '🖼' },
  { id: 'watercolor', name: '水彩', icon: '💧' },
  { id: '3d_render', name: '3D 渲染', icon: '🔮' },
  { id: 'pixel_art', name: '像素风', icon: '👾' },
  { id: 'minimalist', name: '极简', icon: '◻' },
  { id: 'fantasy', name: '奇幻', icon: '🐉' },
]

export const aspectRatios = ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9']
export const resolutions = ['512x512', '768x768', '1024x1024', '1280x720', '1920x1080']
export const samplers = ['Euler', 'Euler a', 'DPM++ 2M', 'DPM++ SDE', 'DDIM', 'UniPC']
export const cameraMotions = ['无', '左移', '右移', '上移', '下移', '推进', '拉远', '旋转']
