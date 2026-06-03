import { useState, useRef } from 'react'
import { Scissors, Eraser, Droplet as DropletIcon, Paintbrush, Maximize, Sparkles, Palette, Grid, Smile, Shirt, CreditCard, Expand, Plus, Image, Wand2, Sun, Type, ImagePlus, Layers, ShoppingBag, Clock, Crop, Upload, ZoomIn, ZoomOut, RotateCcw, RotateCw, Video, Download, X, Check, FileImage, Droplet } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import Slider from '@/components/ui/Slider'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Chip from '@/components/ui/Chip'
import { showToast } from '@/components/ui/Toast'
import { cn } from '@/utils/helpers'
import api from '@/utils/api'

const TOOL_GROUPS = [
  { label: '基础编辑', tools: [
    { id: 'cutout', name: 'AI 智能抠图', icon: Scissors },
    { id: 'inpaint', name: '局部重绘消除杂物', icon: Eraser },
    { id: 'watermark', name: '去除水印', icon: DropletIcon },
    { id: 'add-watermark', name: '添加/批量添加水印', icon: Droplet },
    { id: 'repair', name: '画面破损修补', icon: Paintbrush },
  ]},
  { label: '图像增强', tools: [
    { id: 'upscale', name: '图片超分辨率放大', icon: Maximize },
    { id: 'denoise', name: '降噪锐化', icon: Sparkles },
    { id: 'color', name: '智能调色', icon: Palette },
    { id: 'perspective', name: '透视矫正', icon: Grid },
  ]},
  { label: '人像处理', tools: [
    { id: 'beauty', name: 'AI 人像美颜塑形', icon: Smile },
    { id: 'outfit', name: '人像换装', icon: Shirt },
    { id: 'idphoto', name: '证件照智能生成换底色', icon: CreditCard },
  ]},
  { label: '创意变换', tools: [
    { id: 'outpaint', name: '图片外延扩图', icon: Expand },
    { id: 'add-element', name: '画面元素添加', icon: Plus },
    { id: 'bg-replace', name: '一键更换背景', icon: Image },
    { id: 'style', name: '图像风格转化', icon: Wand2 },
    { id: 'weather', name: '天气光影更改', icon: Sun },
  ]},
  { label: '生成', tools: [
    { id: 'txt2img', name: '文生图', icon: Type },
    { id: 'img2img', name: '图生图', icon: ImagePlus },
  ]},
  { label: '批量', tools: [
    { id: 'batch', name: '批量修图', icon: Layers },
    { id: 'product', name: '商品图智能精修', icon: ShoppingBag },
  ]},
  { label: '修复', tools: [
    { id: 'restore', name: '老照片修复翻新', icon: Clock },
    { id: 'compose', name: 'AI 一键构图优化', icon: Crop },
  ]},
]

const ALL_TOOLS = TOOL_GROUPS.flatMap((g) => g.tools)

const STYLE_OPTIONS = [
  { id: 'oil', name: '油画' },
  { id: 'watercolor', name: '水彩' },
  { id: 'anime', name: '动漫' },
  { id: 'sketch', name: '素描' },
  { id: 'cyber', name: '赛博朋克' },
  { id: 'pixel', name: '像素风' },
]

const WATERMARK_POSITIONS = [
  { id: 'top-left', label: '左上' },
  { id: 'top-right', label: '右上' },
  { id: 'bottom-left', label: '左下' },
  { id: 'bottom-right', label: '右下' },
  { id: 'center', label: '居中' },
  { id: 'tile', label: '平铺' },
]

const PRESET_COLORS = [
  { value: '#FFFFFF', label: '白' },
  { value: '#000000', label: '黑' },
  { value: '#EF4444', label: '红' },
  { value: '#3B82F6', label: '蓝' },
]

export default function ImageEditor() {
  const [selectedTool, setSelectedTool] = useState('cutout')
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [compareMode, setCompareMode] = useState(false)
  const [cutoutMode, setCutoutMode] = useState<'auto' | 'manual'>('auto')
  const [edgeFeather, setEdgeFeather] = useState(3)
  const [cutoutFormat, setCutoutFormat] = useState('transparent')
  const [upscaleFactor, setUpscaleFactor] = useState(2)
  const [upscaleMode, setUpscaleMode] = useState('general')
  const [upscaleDenoise, setUpscaleDenoise] = useState(3)
  const [brushSize, setBrushSize] = useState(20)
  const [brushType, setBrushType] = useState<'smear' | 'heal'>('smear')
  const [inpaintPrompt, setInpaintPrompt] = useState('')
  const [styleChoice, setStyleChoice] = useState('oil')
  const [styleStrength, setStyleStrength] = useState(70)
  const [idBgColor, setIdBgColor] = useState('blue')
  const [idSize, setIdSize] = useState('one-inch')
  const [idBeauty, setIdBeauty] = useState(true)
  const [bgType, setBgType] = useState<'solid' | 'gradient' | 'image'>('solid')
  const [bgColor, setBgColor] = useState('#7C5CFF')
  const [genericStrength, setGenericStrength] = useState(50)
  const [genericQuality, setGenericQuality] = useState('standard')

  const [wmType, setWmType] = useState<'text' | 'image' | 'logo'>('text')
  const [wmText, setWmText] = useState('')
  const [wmFontSize, setWmFontSize] = useState(24)
  const [wmTextColor, setWmTextColor] = useState('#FFFFFF')
  const [wmTextOpacity, setWmTextOpacity] = useState(60)
  const [wmPosition, setWmPosition] = useState('bottom-right')
  const [wmAngle, setWmAngle] = useState(0)
  const [wmImageScale, setWmImageScale] = useState(100)
  const [wmImageOpacity, setWmImageOpacity] = useState(60)
  const [wmBatchApply, setWmBatchApply] = useState(false)
  const wmFileRef = useRef<HTMLInputElement>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const setCurrentMode = useAppStore((s) => s.setCurrentMode)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) loadImage(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadImage(file)
  }

  const loadImage = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => setImageSrc(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleExport = () => {
    if (!imageSrc) { showToast('warning', '没有可导出的图片'); return }
    try {
      const link = document.createElement('a')
      link.href = imageSrc
      link.download = `agnes-export-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      showToast('success', '导出成功')
    } catch {
      showToast('error', '导出失败')
    }
  }

  const handleProcess = async () => {
    if (!imageSrc) { showToast('warning', '请先上传图片'); return }
    setProcessing(true)
    setProgress(0)

    try {
      const res = await api.processEditor({
        imageId: 'current',
        tool: selectedTool,
        prompt: inpaintPrompt,
        params: { strength: genericStrength, brushSize, watermarkText: wmText, watermarkPosition: wmPosition },
      })

      if (res.error) {
        showToast('error', res.error)
        setProcessing(false)
        return
      }

      // Simulate progress while polling
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 5, 90))
      }, 200)

      const poll = setInterval(async () => {
        const taskRes = await api.getTask(res.data.id)
        if (taskRes.data?.status === 'success') {
          clearInterval(poll)
          clearInterval(progressInterval)
          setProgress(100)
          setTimeout(() => { setProcessing(false); setProgress(0) }, 500)
          showToast('success', '处理完成')
        } else if (taskRes.data?.status === 'failed') {
          clearInterval(poll)
          clearInterval(progressInterval)
          setProcessing(false)
          setProgress(0)
          showToast('error', '处理失败')
        }
      }, 2000)
    } catch {
      setProcessing(false)
      setProgress(0)
      showToast('error', '网络错误')
    }
  }

  const renderToolPanel = () => (
    <div className="w-[280px] shrink-0 border-r border-agnes-border bg-agnes-bg-secondary overflow-y-auto min-h-0 hidden md:block">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-agnes-text-primary flex items-center gap-2 mb-4">
          <Paintbrush className="w-4 h-4 text-agnes-purple" />
          AI 图片编辑
        </h2>
        <div className="space-y-4">
          {TOOL_GROUPS.map((group) => (
            <div key={group.label}>
              <h3 className="text-[10px] font-semibold text-agnes-text-muted uppercase tracking-wider mb-1.5">{group.label}</h3>
              <div className="space-y-0.5">
                {group.tools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setSelectedTool(tool.id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-200 text-xs',
                      selectedTool === tool.id
                        ? 'bg-agnes-purple/15 text-agnes-purple border-l-2 border-agnes-purple'
                        : 'text-agnes-text-secondary hover:bg-white/[0.04] hover:text-agnes-text-primary border-l-2 border-transparent'
                    )}
                  >
                    <tool.icon className="w-3.5 h-3.5 shrink-0" />
                    {tool.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderCanvas = () => (
    <div className="flex-1 flex flex-col min-w-0 bg-agnes-bg">
      {imageSrc ? (
        <>
          <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-agnes-border bg-agnes-bg-secondary flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => setZoom((z) => Math.min(z + 25, 400))}><ZoomIn className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="sm" onClick={() => setZoom((z) => Math.max(z - 25, 25))}><ZoomOut className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="sm" onClick={() => setZoom(100)}>适应</Button>
            <div className="text-xs text-agnes-text-muted font-mono">{zoom}%</div>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" className={cn(compareMode && 'text-agnes-cyan')} onClick={() => setCompareMode(!compareMode)}>对比</Button>
            <Button variant="ghost" size="sm"><RotateCcw className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="sm"><RotateCw className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="sm" onClick={() => setImageSrc(null)}><X className="w-3.5 h-3.5" /></Button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto relative">
            <img
              src={imageSrc}
              alt="编辑图片"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform"
              style={{ transform: `scale(${zoom / 100})` }}
            />
            {processing && (
              <div className="absolute inset-0 bg-agnes-bg/60 flex flex-col items-center justify-center gap-3 rounded-lg">
                <div className="w-48 h-2 bg-agnes-card rounded-full overflow-hidden">
                  <div className="h-full gradient-primary rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs text-agnes-text-muted">处理中 {progress}%</span>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className="w-full max-w-lg border-2 border-dashed border-agnes-border rounded-card p-12 flex flex-col items-center gap-4 hover:border-agnes-purple/40 transition-colors cursor-pointer"
          >
            <Upload className="w-12 h-12 text-agnes-text-muted" />
            <p className="text-sm text-agnes-text-secondary">拖拽或点击上传图片开始编辑</p>
            <p className="text-[10px] text-agnes-text-muted">支持 JPG / PNG / WebP / BMP</p>
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  )

  const renderParamPanel = () => {
    const tool = ALL_TOOLS.find((t) => t.id === selectedTool)
    const ToolIcon = tool?.icon

    const renderCutoutParams = () => (
      <>
        <div className="space-y-1.5">
          <label className="text-xs text-agnes-text-secondary">抠图模式</label>
          <div className="flex gap-1.5">
            <Chip variant="purple" active={cutoutMode === 'auto'} onClick={() => setCutoutMode('auto')}>自动</Chip>
            <Chip variant="purple" active={cutoutMode === 'manual'} onClick={() => setCutoutMode('manual')}>手动</Chip>
          </div>
        </div>
        <Slider label="边缘羽化" value={edgeFeather} onChange={setEdgeFeather} min={0} max={10} />
        <Select label="输出格式" value={cutoutFormat} onChange={(e) => setCutoutFormat(e.target.value)} options={[
          { value: 'transparent', label: '透明PNG' },
          { value: 'white', label: '白底' },
          { value: 'custom', label: '自定义色' },
        ]} />
      </>
    )

    const renderUpscaleParams = () => (
      <>
        <div className="space-y-1.5">
          <label className="text-xs text-agnes-text-secondary">放大倍数</label>
          <div className="flex gap-1.5">
            {[2, 4, 8].map((f) => (
              <Chip key={f} variant="purple" active={upscaleFactor === f} onClick={() => setUpscaleFactor(f)}>{f}x</Chip>
            ))}
          </div>
        </div>
        <Select label="增强模式" value={upscaleMode} onChange={(e) => setUpscaleMode(e.target.value)} options={[
          { value: 'general', label: '通用' },
          { value: 'portrait', label: '人像' },
          { value: 'text', label: '文字' },
        ]} />
        <Slider label="降噪级别" value={upscaleDenoise} onChange={setUpscaleDenoise} min={0} max={10} />
      </>
    )

    const renderInpaintParams = () => (
      <>
        <Slider label="画笔大小" value={brushSize} onChange={setBrushSize} min={1} max={100} />
        <div className="space-y-1.5">
          <label className="text-xs text-agnes-text-secondary">画笔类型</label>
          <div className="flex gap-1.5">
            <Chip variant="purple" active={brushType === 'smear'} onClick={() => setBrushType('smear')}>涂抹</Chip>
            <Chip variant="purple" active={brushType === 'heal'} onClick={() => setBrushType('heal')}>修复</Chip>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-agnes-text-secondary">提示词</label>
          <textarea
            value={inpaintPrompt}
            onChange={(e) => setInpaintPrompt(e.target.value)}
            placeholder="描述 AI 填充内容..."
            rows={3}
            className="w-full bg-agnes-card border border-agnes-border rounded-input px-3 py-2 text-xs text-agnes-text-primary placeholder:text-agnes-text-muted resize-none focus:outline-none focus:border-agnes-purple/50"
          />
        </div>
      </>
    )

    const renderWatermarkParams = () => (
      <>
        <div className="space-y-1.5">
          <label className="text-xs text-agnes-text-secondary">水印类型</label>
          <div className="flex gap-1.5">
            <Chip variant="purple" active={wmType === 'text'} onClick={() => setWmType('text')}>
              <Type className="w-3 h-3 mr-1" />文字
            </Chip>
            <Chip variant="purple" active={wmType === 'image'} onClick={() => setWmType('image')}>
              <Image className="w-3 h-3 mr-1" />图片
            </Chip>
            <Chip variant="purple" active={wmType === 'logo'} onClick={() => setWmType('logo')}>
              <FileImage className="w-3 h-3 mr-1" />Logo
            </Chip>
          </div>
        </div>

        {wmType === 'text' && (
          <>
            <div className="space-y-1.5">
              <label className="text-xs text-agnes-text-secondary">水印文字</label>
              <input
                type="text"
                value={wmText}
                onChange={(e) => setWmText(e.target.value)}
                placeholder="输入水印文字..."
                className="w-full bg-agnes-card border border-agnes-border rounded-input px-3 py-1.5 text-xs text-agnes-text-primary placeholder:text-agnes-text-muted focus:outline-none focus:border-agnes-purple/50"
              />
            </div>
            <Slider label="字体大小" value={wmFontSize} onChange={setWmFontSize} min={8} max={72} />
            <div className="space-y-1.5">
              <label className="text-xs text-agnes-text-secondary">颜色</label>
              <div className="flex gap-1.5 items-center">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setWmTextColor(c.value)}
                    className={cn(
                      'w-7 h-7 rounded-md border-2 transition-all',
                      wmTextColor === c.value ? 'border-agnes-purple scale-110' : 'border-agnes-border'
                    )}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
                <input
                  type="color"
                  value={wmTextColor}
                  onChange={(e) => setWmTextColor(e.target.value)}
                  className="w-7 h-7 rounded-md cursor-pointer border border-agnes-border"
                />
              </div>
            </div>
            <Slider label="透明度" value={wmTextOpacity} onChange={setWmTextOpacity} min={10} max={90} unit="%" />
          </>
        )}

        {(wmType === 'image' || wmType === 'logo') && (
          <>
            <div className="space-y-1.5">
              <label className="text-xs text-agnes-text-secondary">上传水印图片</label>
              <div
                onClick={() => wmFileRef.current?.click()}
                className="w-full border-2 border-dashed border-agnes-border rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-agnes-purple/40 transition-colors"
              >
                <Upload className="w-6 h-6 text-agnes-text-muted" />
                <span className="text-[11px] text-agnes-text-muted">点击上传图片</span>
              </div>
              <input ref={wmFileRef} type="file" accept="image/*" className="hidden" />
            </div>
            <Slider label="缩放" value={wmImageScale} onChange={setWmImageScale} min={10} max={200} unit="%" />
            <Slider label="透明度" value={wmImageOpacity} onChange={setWmImageOpacity} min={10} max={90} unit="%" />
          </>
        )}

        <div className="space-y-1.5">
          <label className="text-xs text-agnes-text-secondary">位置</label>
          <div className="grid grid-cols-3 gap-1.5">
            {WATERMARK_POSITIONS.map((pos) => (
              <button
                key={pos.id}
                onClick={() => setWmPosition(pos.id)}
                className={cn(
                  'px-2 py-1.5 text-[10px] rounded-lg border transition-all shrink-0',
                  wmPosition === pos.id
                    ? 'bg-agnes-purple/15 border-agnes-purple/50 text-agnes-purple'
                    : 'bg-agnes-card border-agnes-border text-agnes-text-secondary hover:border-agnes-border-hover'
                )}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>

        {wmType === 'text' && (
          <Slider label="角度" value={wmAngle} onChange={setWmAngle} min={0} max={360} unit="°" />
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-agnes-text-secondary">应用到全部结果</span>
          <button onClick={() => setWmBatchApply(!wmBatchApply)} className={cn('w-10 h-5 rounded-full transition-all duration-200 relative', wmBatchApply ? 'bg-agnes-purple' : 'bg-agnes-border')}>
            <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200', wmBatchApply ? 'left-[22px]' : 'left-0.5')} />
          </button>
        </div>
      </>
    )

    const renderStyleParams = () => (
      <>
        <div className="space-y-1.5">
          <label className="text-xs text-agnes-text-secondary">风格选择</label>
          <div className="grid grid-cols-3 gap-1.5">
            {STYLE_OPTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyleChoice(s.id)}
                className={cn(
                  'px-2 py-1.5 text-[10px] rounded-lg border transition-all',
                  styleChoice === s.id
                    ? 'bg-agnes-purple/15 border-agnes-purple/50 text-agnes-purple'
                    : 'bg-agnes-card border-agnes-border text-agnes-text-secondary hover:border-agnes-border-hover'
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
        <Slider label="风格强度" value={styleStrength} onChange={setStyleStrength} min={0} max={100} />
      </>
    )

    const renderIdPhotoParams = () => (
      <>
        <div className="space-y-1.5">
          <label className="text-xs text-agnes-text-secondary">背景色</label>
          <div className="flex gap-1.5">
            {[
              { id: 'blue', color: '#2563EB', label: '蓝' },
              { id: 'red', color: '#DC2626', label: '红' },
              { id: 'white', color: '#FFFFFF', label: '白' },
              { id: 'custom', color: bgColor, label: '自定' },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setIdBgColor(c.id)}
                className={cn(
                  'w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center',
                  idBgColor === c.id ? 'border-agnes-purple scale-110' : 'border-agnes-border'
                )}
                style={{ backgroundColor: c.color }}
              >
                {idBgColor === c.id && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
              </button>
            ))}
          </div>
        </div>
        <Select label="尺寸" value={idSize} onChange={(e) => setIdSize(e.target.value)} options={[
          { value: 'one-inch', label: '一寸' },
          { value: 'two-inch', label: '二寸' },
          { value: 'passport', label: '护照' },
        ]} />
        <div className="flex items-center justify-between">
          <span className="text-xs text-agnes-text-secondary">美颜</span>
          <button onClick={() => setIdBeauty(!idBeauty)} className={cn('w-10 h-5 rounded-full transition-all duration-200 relative', idBeauty ? 'bg-agnes-purple' : 'bg-agnes-border')}>
            <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200', idBeauty ? 'left-[22px]' : 'left-0.5')} />
          </button>
        </div>
      </>
    )

    const renderBgReplaceParams = () => (
      <>
        <div className="space-y-1.5">
          <label className="text-xs text-agnes-text-secondary">背景类型</label>
          <div className="flex gap-1.5">
            <Chip variant="purple" active={bgType === 'solid'} onClick={() => setBgType('solid')}>纯色</Chip>
            <Chip variant="purple" active={bgType === 'gradient'} onClick={() => setBgType('gradient')}>渐变</Chip>
            <Chip variant="purple" active={bgType === 'image'} onClick={() => setBgType('image')}>图片</Chip>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-agnes-text-secondary">颜色选择</label>
          <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-full h-8 rounded-input bg-agnes-card border border-agnes-border cursor-pointer" />
        </div>
        {bgType === 'image' && (
          <Button variant="secondary" size="sm" className="w-full gap-1.5">
            <Upload className="w-3.5 h-3.5" />上传背景图
          </Button>
        )}
      </>
    )

    const renderGenericParams = () => (
      <>
        <Slider label="强度" value={genericStrength} onChange={setGenericStrength} min={0} max={100} />
        <Select label="质量" value={genericQuality} onChange={(e) => setGenericQuality(e.target.value)} options={[
          { value: 'standard', label: '标准' },
          { value: 'hd', label: '高清' },
        ]} />
      </>
    )

    const getParamContent = () => {
      switch (selectedTool) {
        case 'cutout': return renderCutoutParams()
        case 'upscale': return renderUpscaleParams()
        case 'inpaint': case 'watermark': return renderInpaintParams()
        case 'add-watermark': return renderWatermarkParams()
        case 'style': return renderStyleParams()
        case 'idphoto': return renderIdPhotoParams()
        case 'bg-replace': return renderBgReplaceParams()
        default: return renderGenericParams()
      }
    }

    return (
      <div className="w-[300px] shrink-0 border-l border-agnes-border bg-agnes-bg-secondary overflow-y-auto hidden lg:block">
        <div className="p-4 space-y-4">
          <h3 className="text-sm font-semibold text-agnes-text-primary flex items-center gap-2">
            {ToolIcon && <ToolIcon className="w-4 h-4 text-agnes-purple" />}
            {tool?.name}
          </h3>
          {getParamContent()}
        </div>
        <div className="p-4 border-t border-agnes-border space-y-2">
          {selectedTool === 'add-watermark' ? (
            <Button variant="primary" size="md" loading={processing} onClick={handleProcess} className="w-full gap-2">
              <Droplet className="w-4 h-4" />应用水印
            </Button>
          ) : (
            <Button variant="primary" size="md" loading={processing} onClick={handleProcess} className="w-full gap-2">
              <Sparkles className="w-4 h-4" />开始处理
            </Button>
          )}
          <Button variant="secondary" size="sm" className="w-full gap-1.5" onClick={handleExport}>
            <Download className="w-3.5 h-3.5" />导出结果
          </Button>
          <Button variant="ghost" size="sm" className="w-full gap-1.5" onClick={() => setCurrentMode('text-to-video')}>
            <Video className="w-3.5 h-3.5" />转视频
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      {renderToolPanel()}
      {renderCanvas()}
      {renderParamPanel()}
    </div>
  )
}
