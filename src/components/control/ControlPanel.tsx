import { useState, useRef, useEffect } from 'react'
import useAppStore from '@/store/useAppStore'
import useTaskStore from '@/store/useTaskStore'
import { showToast } from '@/components/ui/Toast'
import Slider from '@/components/ui/Slider'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Chip from '@/components/ui/Chip'
import { stylePresets, aspectRatios, resolutions, samplers, cameraMotions } from '@/utils/mockData'
import { Sparkles, ChevronDown, ChevronUp, Upload, X, Zap, ImagePlus, Film, Layers, Plus, Minus, GripVertical, Wand2 } from 'lucide-react'

const NEG_CHIPS = ['模糊', '变形', '低质量', '水印']
const MAX_PROMPT = 1000
const toOpts = (a: string[]) => a.map((v) => ({ value: v, label: v }))
const cntOpts = ['1','2','3','4'].map((v) => ({ value: v, label: v }))

export default function ControlPanel() {
  const mode = useAppStore((s) => s.currentMode)
  const createTask = useTaskStore((s) => s.createTask)
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [negOpen, setNegOpen] = useState(false)
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [resolution, setResolution] = useState('1024x1024')
  const [count, setCount] = useState('1')
  const [selectedStyle, setSelectedStyle] = useState('')
  const [creativity, setCreativity] = useState(7)
  const [detail, setDetail] = useState(7)
  const [advOpen, setAdvOpen] = useState(false)
  const [seed, setSeed] = useState(-1)
  const [cfgScale, setCfgScale] = useState(7)
  const [steps, setSteps] = useState(30)
  const [sampler, setSampler] = useState('Euler')
  const [hdFix, setHdFix] = useState(false)
  const [refImages, setRefImages] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [imageWeight, setImageWeight] = useState(70)
  const [influenceMode, setInfluenceMode] = useState('风格参考')
  const [videoInputMode, setVideoInputMode] = useState('文生视频')
  const [duration, setDuration] = useState('4')
  const [fps, setFps] = useState('24')
  const [motionIntensity, setMotionIntensity] = useState(5)
  const [cameraMotion, setCameraMotion] = useState('无')
  const [rhythm, setRhythm] = useState('匀速')
  const [frameOpen, setFrameOpen] = useState(false)
  const [firstFrame, setFirstFrame] = useState<string[]>([])
  const [lastFrame, setLastFrame] = useState<string[]>([])
  const [styleConsistency, setStyleConsistency] = useState(5)
  const [batchPrompts, setBatchPrompts] = useState('')
  const firstFrameRef = useRef<HTMLInputElement>(null)
  const lastFrameRef = useRef<HTMLInputElement>(null)
  const [videoSubMode, setVideoSubMode] = useState<'standard' | 'all-reference' | 'smart-multi-frame'>('standard')
  const [refFusion, setRefFusion] = useState('加权融合')
  const [globalRefStrength, setGlobalRefStrength] = useState(70)
  const [multiRefItems, setMultiRefItems] = useState<{id: number; image: string; weight: number}[]>([])
  const [frameEntries, setFrameEntries] = useState<{id: number; prompt: string; image: string; duration: number}[]>([
    { id: 1, prompt: '', image: '', duration: 2 },
    { id: 2, prompt: '', image: '', duration: 2 },
  ])
  const [autoInterpolate, setAutoInterpolate] = useState(true)
  const [interpMethod, setInterpMethod] = useState('风格保持')
  const [optimizing, setOptimizing] = useState(false)

  const appliedTemplate = useAppStore((s) => s.appliedTemplate)

  useEffect(() => {
    if (!appliedTemplate) return
    if (appliedTemplate.prompt !== undefined) setPrompt(appliedTemplate.prompt)
    if (appliedTemplate.negativePrompt !== undefined) setNegativePrompt(appliedTemplate.negativePrompt)
    if (appliedTemplate.style !== undefined) setSelectedStyle(appliedTemplate.style)
    if (appliedTemplate.params) {
      const p = appliedTemplate.params
      if (p.aspectRatio !== undefined) setAspectRatio(p.aspectRatio)
      if (p.resolution !== undefined) setResolution(p.resolution)
      if (p.steps !== undefined) setSteps(p.steps)
      if (p.cfgScale !== undefined) setCfgScale(p.cfgScale)
      if (p.hdFix !== undefined) setHdFix(p.hdFix)
      if (p.creativity !== undefined) setCreativity(p.creativity)
      if (p.detail !== undefined) setDetail(p.detail)
    }
    useAppStore.getState().applyTemplate(null)
  }, [appliedTemplate])

  if (mode === 'chat' || mode === 'tts') return null

  const addNegChip = (w: string) => setNegativePrompt((p) => {
    const parts = p.split(',').map((s) => s.trim()).filter(Boolean)
    return parts.includes(w) ? p : p ? `${p}, ${w}` : w
  })
  const readFiles = (files: FileList | File[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    Array.from(files).forEach((f) => {
      const r = new FileReader()
      r.onload = (ev) => { if (ev.target?.result) setter((p) => [...p, ev.target!.result as string]) }
      r.readAsDataURL(f)
    })
  }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) { readFiles(e.target.files, setRefImages); e.target.value = '' } }
  const removeRef = (i: number) => setRefImages((p) => p.filter((_, j) => j !== i))
  const handleFrameFile = (e: React.ChangeEvent<HTMLInputElement>, s: React.Dispatch<React.SetStateAction<string[]>>) => { if (e.target.files) { readFiles(e.target.files, s); e.target.value = '' } }

  const handleGenerate = async () => {
    const isBatch = mode === 'batch'
    if (!isBatch && !prompt.trim()) { showToast('warning', '请输入提示词'); return }
    if (isBatch && !batchPrompts.trim()) { showToast('warning', '请输入提示词'); return }
    setGenerating(true)

    try {
      const apiClient = (await import('@/utils/api')).default
      const taskType = mode === 'text-to-video' ? 'video' : 'image'
      const apiFn = taskType === 'video' ? apiClient.generateVideo.bind(apiClient) : apiClient.generateImage.bind(apiClient)

      const res = await apiFn({
        prompt: isBatch ? batchPrompts : prompt,
        negativePrompt,
        params: { mode, aspectRatio, resolution, count: +count, style: selectedStyle, creativity, detail, seed, cfgScale, steps, sampler, hdFix, imageWeight, influenceMode, videoInputMode, duration: +duration, fps: +fps, motionIntensity, cameraMotion, rhythm, styleConsistency },
      })

      if (res.error) {
        showToast('error', res.error)
        setGenerating(false)
        return
      }

      // Create local task for tracking
      const taskId = createTask({
        type: taskType,
        prompt: isBatch ? batchPrompts : prompt,
        negativePrompt,
        params: { mode, aspectRatio, resolution, count: +count, style: selectedStyle, creativity, detail, seed, cfgScale, steps, sampler, hdFix, imageWeight, influenceMode, videoInputMode, duration: +duration, fps: +fps, motionIntensity, cameraMotion, rhythm, styleConsistency },
      })

      // Poll for task status from backend
      const pollInterval = setInterval(async () => {
        const taskRes = await apiClient.getTask(res.data.id)
        if (taskRes.data) {
          const t = taskRes.data
          useTaskStore.getState().updateTaskProgress(taskId, t.progress || 0)
          if (t.status === 'success') {
            clearInterval(pollInterval)
            useTaskStore.getState().completeTask(taskId, t.resultUrls || [])
            setGenerating(false)
            showToast('success', '生成完成！')
          } else if (t.status === 'failed') {
            clearInterval(pollInterval)
            useTaskStore.getState().failTask(taskId, t.errorMessage || '生成失败')
            setGenerating(false)
            showToast('error', '生成失败')
          }
        }
      }, 2000)
    } catch (err: any) {
      showToast('error', err.message || '生成失败')
      setGenerating(false)
    }
  }

  const D = () => <div className="border-t border-agnes-border" />
  const taCls = "w-full bg-agnes-bg border border-agnes-border rounded-input p-3 text-agnes-text-primary text-sm resize-none focus:outline-none focus:border-agnes-purple/50 placeholder:text-agnes-text-muted"
  const seedInput = <div><label className="block text-xs text-agnes-text-muted mb-1">Seed</label><input type="number" value={seed} onChange={(e) => setSeed(+e.target.value)} className="w-full bg-agnes-bg border border-agnes-border rounded-input px-3 py-1.5 text-agnes-text-primary text-sm font-mono focus:outline-none focus:border-agnes-purple/50" /></div>
  const hdToggle = <div className="flex items-center justify-between"><span className="text-xs text-agnes-text-muted">高清修复</span><button onClick={() => setHdFix(!hdFix)} className={`w-10 h-5 rounded-full transition-colors ${hdFix ? 'bg-agnes-purple' : 'bg-agnes-border'}`}><span className={`block w-4 h-4 rounded-full bg-white transition-transform ${hdFix ? 'translate-x-5' : 'translate-x-0.5'}`} /></button></div>

  const NegSec = () => (
    <section>
      <button onClick={() => setNegOpen(!negOpen)} className="flex items-center justify-between w-full text-xs text-agnes-text-secondary hover:text-agnes-text-primary transition-colors"><span>负面提示词</span>{negOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
      <div className={`overflow-hidden transition-all duration-300 ${negOpen ? 'max-h-60 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
        <textarea value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} placeholder="不希望出现的元素..." rows={2} className={taCls} />
        <div className="flex flex-wrap gap-1.5 mt-2">{NEG_CHIPS.map((w) => <Chip key={w} onClick={() => addNegChip(w)}>{w}</Chip>)}</div>
      </div>
    </section>
  )

  const StyleSec = () => (
    <section>
      <h3 className="text-xs text-agnes-text-secondary mb-2">风格设置</h3>
      <div className="flex gap-2 overflow-x-auto pb-2">{stylePresets.map((sp) => (
        <button key={sp.id} onClick={() => setSelectedStyle(sp.id)} className={`flex-shrink-0 w-16 h-16 rounded-card border-2 transition-all flex flex-col items-center justify-center ${selectedStyle === sp.id ? 'border-agnes-purple glow-purple' : 'border-agnes-border hover:border-agnes-border-hover'}`}>
          <span className="text-lg">{sp.icon}</span><span className="block text-[10px] text-agnes-text-secondary mt-0.5 truncate text-center">{sp.name}</span>
        </button>))}</div>
      <div className="mt-3 space-y-2"><Slider label="创意强度" value={creativity} onChange={setCreativity} min={1} max={10} /><Slider label="细节强度" value={detail} onChange={setDetail} min={1} max={10} /></div>
    </section>
  )

  const BasicSec = ({ countLabel = '生成数量' }: { countLabel?: string }) => (
    <section><h3 className="text-xs text-agnes-text-secondary mb-2">基础设置</h3>
      <div className="grid grid-cols-2 gap-3">
        <Select label="画幅比例" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} options={toOpts(aspectRatios)} />
        <Select label="分辨率" value={resolution} onChange={(e) => setResolution(e.target.value)} options={toOpts(resolutions)} />
        <Select label={countLabel} value={count} onChange={(e) => setCount(e.target.value)} options={cntOpts} />
      </div>
    </section>
  )

  const AdvSec = ({ showHd = true, showSampler = true }: { showHd?: boolean; showSampler?: boolean }) => (
    <section>
      <button onClick={() => setAdvOpen(!advOpen)} className="flex items-center justify-between w-full text-xs text-agnes-text-secondary hover:text-agnes-text-primary transition-colors"><span>高级设置</span>{advOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
      <div className={`overflow-hidden transition-all duration-300 ${advOpen ? 'max-h-[600px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
        <div className="space-y-3">{seedInput}<Slider label="CFG Scale" value={cfgScale} onChange={setCfgScale} min={1} max={20} /><Slider label="Steps" value={steps} onChange={setSteps} min={10} max={50} />{showSampler && <Select label="采样器" value={sampler} onChange={(e) => setSampler(e.target.value)} options={toOpts(samplers)} />}{showHd && hdToggle}</div>
      </div>
    </section>
  )

  const RefSec = ({ accept = 'image/*', label = '参考图', size = 14 }: { accept?: string; label?: string; size?: number }) => (
    <section>
      <h3 className="text-xs text-agnes-text-secondary mb-2">{label}</h3>
      <div onClick={() => fileRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); readFiles(e.dataTransfer.files, setRefImages) }} className="border-2 border-dashed border-agnes-border rounded-card p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-agnes-purple/50 transition-colors">
        <Upload size={20} className="text-agnes-text-muted" /><span className="text-xs text-agnes-text-muted">拖拽或点击上传</span>
      </div>
      <input ref={fileRef} type="file" accept={accept} multiple className="hidden" onChange={handleFileChange} />
      {refImages.length > 0 && <div className="flex gap-2 mt-2 flex-wrap">{refImages.map((src, i) => (
        <div key={i} className={`relative w-${size} h-${size} rounded-card overflow-hidden group`}><img src={src} alt="" className="w-full h-full object-cover" />
          <button onClick={() => removeRef(i)} className="absolute top-0.5 right-0.5 w-4 h-4 bg-agnes-bg/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} className="text-agnes-text-primary" /></button></div>))}</div>}
    </section>
  )

  const PromptSec = ({ ph, rows = 4, showOptimize = true }: { ph: string; rows?: number; showOptimize?: boolean }) => {
    const handleOptimize = async () => {
      if (!prompt.trim()) { showToast('warning', '请先输入提示词'); return }
      setOptimizing(true)
      try {
        const apiClient = (await import('@/utils/api')).default
        const res = await apiClient.optimizePrompt(prompt)
        if (res.error) {
          showToast('error', res.error)
        } else if (res.data?.optimizedPrompt) {
          setPrompt(res.data.optimizedPrompt.slice(0, MAX_PROMPT))
          showToast('success', '提示词优化完成')
        }
      } catch (err: any) {
        showToast('error', err.message || '优化失败')
      } finally {
        setOptimizing(false)
      }
    }
    return (
    <section><label className="block text-agnes-text-secondary text-xs mb-1.5">正向提示词</label>
      <div className="relative"><textarea value={prompt} onChange={(e) => setPrompt(e.target.value.slice(0, MAX_PROMPT))} placeholder={ph} rows={rows} className={taCls} />
        <div className="flex items-center justify-between mt-1.5"><span className="text-xs text-agnes-text-muted font-mono">{prompt.length}/{MAX_PROMPT}</span>
          {showOptimize && <button onClick={handleOptimize} disabled={optimizing} className="flex items-center gap-1 text-xs text-agnes-cyan hover:text-agnes-purple transition-colors disabled:opacity-60 disabled:cursor-not-allowed">{optimizing ? <><span className="w-3.5 h-3.5 border-2 border-agnes-cyan/30 border-t-agnes-cyan rounded-full animate-spin" />优化中…</> : <><Sparkles size={14} /> AI 优化</>}</button>}</div></div>
    </section>
    )
  }

  const FrameUpload = ({ label, frame, setter, ref }: { label: string; frame: string[]; setter: React.Dispatch<React.SetStateAction<string[]>>; ref: React.RefObject<HTMLInputElement | null> }) => (
    <div><span className="text-xs text-agnes-text-muted mb-1 block">{label}</span>
      <div onClick={() => ref.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); readFiles(e.dataTransfer.files, setter) }} className="border-2 border-dashed border-agnes-border rounded-card p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-agnes-purple/50 transition-colors">
        {frame.length > 0 ? <img src={frame[0]} alt="" className="w-full h-16 object-cover rounded" /> : <><Upload size={16} className="text-agnes-text-muted" /><span className="text-[10px] text-agnes-text-muted">上传{label}</span></>}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => handleFrameFile(e, setter)} /></div>
  )

  const videoSubModeTabs = [
    { key: 'standard' as const, label: '标准模式' },
    { key: 'all-reference' as const, label: '全能参考' },
    { key: 'smart-multi-frame' as const, label: '智能多帧' },
  ]

  const VideoSubModeSelector = () => (
    <div className="flex rounded-input overflow-hidden border border-agnes-border">
      {videoSubModeTabs.map((t) => (
        <button key={t.key} onClick={() => setVideoSubMode(t.key)} className={`flex-1 py-1.5 text-xs transition-colors ${videoSubMode === t.key ? 'bg-agnes-purple text-white' : 'bg-agnes-bg text-agnes-text-secondary hover:text-agnes-text-primary'}`}>{t.label}</button>
      ))}
    </div>
  )

  const AllRefSec = () => (
    <section className="space-y-3">
      <p className="text-[10px] text-agnes-text-muted">上传参考图/视频，AI 综合所有参考素材生成视频</p>
      <div className="space-y-2">
        {multiRefItems.map((item, i) => (
          <div key={item.id} className="flex items-center gap-2 p-2 bg-agnes-bg rounded-card border border-agnes-border">
            <GripVertical size={12} className="text-agnes-text-muted flex-shrink-0" />
            <div className="w-10 h-10 rounded border border-agnes-border flex items-center justify-center overflow-hidden flex-shrink-0">
              {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <Upload size={12} className="text-agnes-text-muted" />}
            </div>
            <Slider label="" value={item.weight} onChange={(v) => setMultiRefItems((p) => p.map((r, j) => j === i ? { ...r, weight: v } : r))} min={0} max={100} />
            <button onClick={() => setMultiRefItems((p) => p.filter((_, j) => j !== i))} className="flex-shrink-0"><Minus size={14} className="text-agnes-text-muted hover:text-agnes-text-primary" /></button>
          </div>
        ))}
        {multiRefItems.length < 4 && (
          <button onClick={() => setMultiRefItems((p) => [...p, { id: Date.now(), image: '', weight: 50 }])} className="flex items-center gap-1 text-xs text-agnes-cyan hover:text-agnes-purple transition-colors"><Plus size={14} />添加参考</button>
        )}
      </div>
      <Select label="融合策略" value={refFusion} onChange={(e) => setRefFusion(e.target.value)} options={toOpts(['加权融合','顺序拼接','风格迁移'])} />
      <Slider label="全局参考强度" value={globalRefStrength} onChange={setGlobalRefStrength} min={0} max={100} />
    </section>
  )

  const SmartFrameSec = () => (
    <section className="space-y-3">
      <p className="text-[10px] text-agnes-text-muted">为每个关键帧单独设定画面描述，AI 自动补全过渡帧</p>
      <div className="space-y-2">
        {frameEntries.map((entry, i) => (
          <div key={entry.id} className="p-2 bg-agnes-bg rounded-card border border-agnes-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-agnes-text-secondary font-medium">帧 {i + 1}</span>
              {frameEntries.length > 2 && <button onClick={() => setFrameEntries((p) => p.filter((_, j) => j !== i))}><Minus size={12} className="text-agnes-text-muted hover:text-agnes-text-primary" /></button>}
            </div>
            <input value={entry.prompt} onChange={(e) => setFrameEntries((p) => p.map((f, j) => j === i ? { ...f, prompt: e.target.value } : f))} placeholder="画面描述..." className="w-full bg-agnes-bg-secondary border border-agnes-border rounded-input px-2 py-1 text-xs text-agnes-text-primary focus:outline-none focus:border-agnes-purple/50 placeholder:text-agnes-text-muted" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded border border-agnes-border flex items-center justify-center flex-shrink-0">
                {entry.image ? <img src={entry.image} alt="" className="w-full h-full object-cover rounded" /> : <ImagePlus size={12} className="text-agnes-text-muted" />}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-agnes-text-muted">时长</span>
                <input type="number" value={entry.duration} onChange={(e) => setFrameEntries((p) => p.map((f, j) => j === i ? { ...f, duration: +e.target.value } : f))} min={0.5} step={0.5} className="w-14 bg-agnes-bg-secondary border border-agnes-border rounded-input px-2 py-0.5 text-xs text-agnes-text-primary text-center focus:outline-none focus:border-agnes-purple/50" />
                <span className="text-[10px] text-agnes-text-muted">s</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setFrameEntries((p) => [...p, { id: Date.now(), prompt: '', image: '', duration: 2 }])} className="flex items-center gap-1 text-xs text-agnes-cyan hover:text-agnes-purple transition-colors"><Plus size={14} />添加帧</button>
      <div className="flex items-center justify-between">
        <span className="text-xs text-agnes-text-muted">自动补帧</span>
        <button onClick={() => setAutoInterpolate(!autoInterpolate)} className={`w-10 h-5 rounded-full transition-colors ${autoInterpolate ? 'bg-agnes-purple' : 'bg-agnes-border'}`}><span className={`block w-4 h-4 rounded-full bg-white transition-transform ${autoInterpolate ? 'translate-x-5' : 'translate-x-0.5'}`} /></button>
      </div>
      {autoInterpolate && <Select label="插值方式" value={interpMethod} onChange={(e) => setInterpMethod(e.target.value)} options={toOpts(['线性插值','风格保持','场景渐变'])} />}
    </section>
  )

  const VideoSettingsSec = () => (
    <section>
      <div className="flex items-center gap-1.5 mb-2"><Film size={14} className="text-agnes-cyan" /><h3 className="text-xs text-agnes-text-secondary">视频设置</h3></div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="输入方式" value={videoInputMode} onChange={(e) => setVideoInputMode(e.target.value)} options={toOpts(['文生视频','图生视频','续帧'])} />
        <Select label="视频时长" value={duration} onChange={(e) => setDuration(e.target.value)} options={['4','8','16'].map((v) => ({ value: v, label: `${v}s` }))} />
        <Select label="帧率" value={fps} onChange={(e) => setFps(e.target.value)} options={['24','30','60'].map((v) => ({ value: v, label: `${v}fps` }))} />
        <Select label="画幅比例" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} options={toOpts(aspectRatios)} />
        <Select label="分辨率" value={resolution} onChange={(e) => setResolution(e.target.value)} options={toOpts(resolutions)} />
      </div>
    </section>
  )

  const MotionSec = () => (
    <section><h3 className="text-xs text-agnes-text-secondary mb-2">运动与镜头</h3><div className="space-y-2">
      <Slider label="运动强度" value={motionIntensity} onChange={setMotionIntensity} min={1} max={10} />
      <Select label="镜头运动" value={cameraMotion} onChange={(e) => setCameraMotion(e.target.value)} options={toOpts(cameraMotions)} />
      <Select label="节奏控制" value={rhythm} onChange={(e) => setRhythm(e.target.value)} options={toOpts(['匀速','渐快','渐慢','快慢快'])} />
    </div></section>
  )

  const FrameCtrlSec = () => (
    <section>
      <button onClick={() => setFrameOpen(!frameOpen)} className="flex items-center justify-between w-full text-xs text-agnes-text-secondary hover:text-agnes-text-primary transition-colors"><span>帧控制</span>{frameOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
      <div className={`overflow-hidden transition-all duration-300 ${frameOpen ? 'max-h-[400px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
        <div className="space-y-3"><FrameUpload label="首帧" frame={firstFrame} setter={setFirstFrame} ref={firstFrameRef} /><FrameUpload label="尾帧" frame={lastFrame} setter={setLastFrame} ref={lastFrameRef} /><Slider label="风格一致性" value={styleConsistency} onChange={setStyleConsistency} min={1} max={10} /></div>
      </div>
    </section>
  )

  const modes: Record<string, () => React.ReactNode> = {
    'text-to-image': () => (<>
      <PromptSec ph="描述你想要生成的画面..." /><D /><NegSec /><D /><BasicSec /><D /><StyleSec /><D /><AdvSec /><D /><RefSec />
    </>),
    'image-to-image': () => (<>
      <section>
        <div className="flex items-center gap-1.5 mb-2"><ImagePlus size={14} className="text-agnes-cyan" /><h3 className="text-xs text-agnes-text-secondary">参考图</h3></div>
        <div onClick={() => fileRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); readFiles(e.dataTransfer.files, setRefImages) }} className="border-2 border-dashed border-agnes-border rounded-card p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-agnes-cyan/50 transition-colors">
          <Upload size={24} className="text-agnes-text-muted" /><span className="text-xs text-agnes-text-muted">拖拽或点击上传参考图</span>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
        {refImages.length > 0 && <div className="flex gap-2 mt-2 flex-wrap">{refImages.map((src, i) => (
          <div key={i} className="relative w-20 h-20 rounded-card overflow-hidden group"><img src={src} alt="" className="w-full h-full object-cover" />
            <button onClick={() => removeRef(i)} className="absolute top-0.5 right-0.5 w-5 h-5 bg-agnes-bg/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"><X size={12} className="text-agnes-text-primary" /></button></div>))}</div>}
        <div className="mt-3 space-y-2"><Slider label="图片权重" value={imageWeight} onChange={setImageWeight} min={0} max={100} /><Select label="影响模式" value={influenceMode} onChange={(e) => setInfluenceMode(e.target.value)} options={toOpts(['风格参考','构图参考','色彩参考','完整参考'])} /></div>
      </section><D />
      <section><label className="block text-agnes-text-secondary text-xs mb-1.5">提示词</label><textarea value={prompt} onChange={(e) => setPrompt(e.target.value.slice(0, MAX_PROMPT))} placeholder="描述你想要的调整..." rows={3} className={taCls} /></section>
      <D /><NegSec /><D /><BasicSec /><D /><StyleSec /><D /><AdvSec />
    </>),
    'text-to-video': () => (<>
      <PromptSec ph="描述你想要生成的视频画面..." /><D /><NegSec /><D />
      <VideoSubModeSelector />
      {videoSubMode === 'all-reference' && <><D /><AllRefSec /></>}
      {videoSubMode === 'smart-multi-frame' && <><D /><SmartFrameSec /></>}
      <D /><VideoSettingsSec /><D /><MotionSec /><D /><FrameCtrlSec /><D /><AdvSec showHd={false} showSampler={false} /><D /><RefSec accept="image/*,video/*" label="参考视频/图片" />
    </>),
    'batch': () => (<>
      <section>
        <div className="flex items-center gap-1.5 mb-2"><Layers size={14} className="text-agnes-cyan" /><h3 className="text-xs text-agnes-text-secondary">批量提示词</h3></div>
        <textarea value={batchPrompts} onChange={(e) => setBatchPrompts(e.target.value)} placeholder="每行一个提示词，批量生成..." rows={8} className={taCls} />
        <div className="mt-1.5"><span className="text-xs text-agnes-text-muted font-mono">{batchPrompts.split('\n').filter((l) => l.trim()).length} 行</span></div>
      </section><D /><BasicSec countLabel="每条数量" /><D /><StyleSec />
    </>),
    'tts': () => null,
  }

  const btnLabel: Record<string, string> = { 'text-to-image': '生成', 'image-to-image': '图生图', 'text-to-video': '生成视频', 'batch': '批量生成', 'tts': '语音合成' }

  return (
    <aside className="w-80 bg-agnes-bg-secondary border-r border-agnes-border overflow-y-auto flex flex-col">
      <div className="flex-1 p-4 space-y-4">{modes[mode]?.()}</div>
      <div className="sticky bottom-0 p-4 bg-agnes-bg-secondary border-t border-agnes-border">
        <button onClick={handleGenerate} disabled={generating} className="w-full py-3 rounded-btn gradient-primary text-white font-medium flex items-center justify-center gap-2 hover:shadow-[0_0_24px_rgba(124,92,255,0.4)] transition-shadow disabled:opacity-60 disabled:cursor-not-allowed">
          {generating ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />生成中…</span> : <><Zap size={16} />{btnLabel[mode] ?? '生成'}</>}
        </button>
      </div>
    </aside>
  )
}
