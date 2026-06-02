import { useState, useRef } from 'react'
import useAppStore from '@/store/useAppStore'
import useTaskStore from '@/store/useTaskStore'
import { showToast } from '@/components/ui/Toast'
import Slider from '@/components/ui/Slider'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Chip from '@/components/ui/Chip'
import { stylePresets, aspectRatios, resolutions, samplers, cameraMotions } from '@/utils/mockData'
import { Sparkles, ChevronDown, ChevronUp, Upload, X, Zap } from 'lucide-react'

const NEGATIVE_CHIPS = ['模糊', '变形', '低质量', '水印']
const MAX_PROMPT = 1000

const toOptions = (arr: string[]) => arr.map((v) => ({ value: v, label: v }))

export default function ControlPanel() {
  const currentMode = useAppStore((s) => s.currentMode)
  const createTask = useTaskStore((s) => s.createTask)
  const isVideo = currentMode === 'text-to-video'

  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [negOpen, setNegOpen] = useState(false)
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [resolution, setResolution] = useState('1024x1024')
  const [count, setCount] = useState('1')
  const [duration, setDuration] = useState('4')
  const [fps, setFps] = useState('24')
  const [selectedStyle, setSelectedStyle] = useState('')
  const [creativity, setCreativity] = useState(7)
  const [detail, setDetail] = useState(7)
  const [advOpen, setAdvOpen] = useState(false)
  const [seed, setSeed] = useState(-1)
  const [cfgScale, setCfgScale] = useState(7)
  const [steps, setSteps] = useState(30)
  const [sampler, setSampler] = useState('Euler')
  const [hdFix, setHdFix] = useState(false)
  const [motionIntensity, setMotionIntensity] = useState(5)
  const [cameraMotion, setCameraMotion] = useState('无')
  const [refImages, setRefImages] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleAddNegChip = (word: string) => {
    setNegativePrompt((prev) => {
      const parts = prev.split(',').map((s) => s.trim()).filter(Boolean)
      if (parts.includes(word)) return prev
      return prev ? `${prev}, ${word}` : word
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    Array.from(e.target.files).forEach((f) => {
      const reader = new FileReader()
      reader.onload = (ev) => { if (ev.target?.result) setRefImages((p) => [...p, ev.target!.result as string]) }
      reader.readAsDataURL(f)
    })
    e.target.value = ''
  }

  const removeRefImage = (idx: number) => {
    setRefImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleGenerate = () => {
    if (!prompt.trim()) {
      showToast('warning', '请输入提示词')
      return
    }
    setGenerating(true)

    const taskId = createTask({
      type: isVideo ? 'video' : 'image',
      prompt,
      negativePrompt,
      params: {
        aspectRatio, resolution, count: Number(count), duration: Number(duration), fps: Number(fps),
        style: selectedStyle, creativity, detail,
        seed, cfgScale, steps, sampler, hdFix,
        motionIntensity, cameraMotion,
        refImages: refImages.length,
      },
    })

    setTimeout(() => {
      useTaskStore.getState().updateTaskStatus(taskId, 'running', 0)
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          const urls = Array.from({ length: Math.min(Number(count), 4) }, (_, i) =>
            `https://picsum.photos/seed/${taskId}-${i}/1024/1024`)
          useTaskStore.getState().completeTask(taskId, urls)
          setGenerating(false)
          showToast('success', '生成完成！')
        } else {
          useTaskStore.getState().updateTaskProgress(taskId, progress)
        }
      }, 600)
    }, 800)
  }

  return (
    <aside className="w-80 bg-agnes-bg-secondary border-r border-agnes-border overflow-y-auto flex flex-col">
      <div className="flex-1 p-4 space-y-4">
        <section>
          <label className="block text-agnes-text-secondary text-xs mb-1.5">正向提示词</label>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, MAX_PROMPT))}
              placeholder="描述你想要生成的画面..."
              rows={4}
              className="w-full bg-agnes-bg border border-agnes-border rounded-input p-3 text-agnes-text-primary text-sm resize-none focus:outline-none focus:border-agnes-purple/50 placeholder:text-agnes-text-muted"
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-agnes-text-muted font-mono">{prompt.length}/{MAX_PROMPT}</span>
              <button className="flex items-center gap-1 text-xs text-agnes-cyan hover:text-agnes-purple transition-colors">
                <Sparkles size={14} /> AI 优化
              </button>
            </div>
          </div>
        </section>

        <div className="border-t border-agnes-border" />

        <section>
          <button
            onClick={() => setNegOpen(!negOpen)}
            className="flex items-center justify-between w-full text-xs text-agnes-text-secondary hover:text-agnes-text-primary transition-colors"
          >
            <span>负面提示词</span>
            {negOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <div className={`overflow-hidden transition-all duration-300 ${negOpen ? 'max-h-60 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
            <textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="不希望出现的元素..."
              rows={2}
              className="w-full bg-agnes-bg border border-agnes-border rounded-input p-3 text-agnes-text-primary text-sm resize-none focus:outline-none focus:border-agnes-purple/50 placeholder:text-agnes-text-muted"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {NEGATIVE_CHIPS.map((word) => (
                <Chip key={word} onClick={() => handleAddNegChip(word)}>{word}</Chip>
              ))}
            </div>
          </div>
        </section>

        <div className="border-t border-agnes-border" />

        <section>
          <h3 className="text-xs text-agnes-text-secondary mb-2">基础设置</h3>
          <div className="grid grid-cols-2 gap-3">
            <Select label="画幅比例" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} options={toOptions(aspectRatios)} />
            <Select label="分辨率" value={resolution} onChange={(e) => setResolution(e.target.value)} options={toOptions(resolutions)} />
            <Select label="生成数量" value={count} onChange={(e) => setCount(e.target.value)} options={['1','2','3','4'].map((v) => ({ value: v, label: v }))} />
            {isVideo && <Select label="视频时长" value={duration} onChange={(e) => setDuration(e.target.value)} options={['4','8','16'].map((v) => ({ value: v, label: `${v}s` }))} />}
            {isVideo && <Select label="帧率" value={fps} onChange={(e) => setFps(e.target.value)} options={['24','30','60'].map((v) => ({ value: v, label: `${v}fps` }))} />}
          </div>
        </section>

        <div className="border-t border-agnes-border" />

        <section>
          <h3 className="text-xs text-agnes-text-secondary mb-2">风格设置</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {stylePresets.map((sp) => (
              <button
                key={sp.id}
                onClick={() => setSelectedStyle(sp.id)}
                className={`flex-shrink-0 w-16 h-16 rounded-card border-2 transition-all flex flex-col items-center justify-center ${
                  selectedStyle === sp.id ? 'border-agnes-purple glow-purple' : 'border-agnes-border hover:border-agnes-border-hover'
                }`}
              >
                <span className="text-lg">{sp.icon}</span>
                <span className="block text-[10px] text-agnes-text-secondary mt-0.5 truncate text-center">{sp.name}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            <Slider label="创意强度" value={creativity} onChange={setCreativity} min={1} max={10} />
            <Slider label="细节强度" value={detail} onChange={setDetail} min={1} max={10} />
          </div>
        </section>

        <div className="border-t border-agnes-border" />

        <section>
          <button
            onClick={() => setAdvOpen(!advOpen)}
            className="flex items-center justify-between w-full text-xs text-agnes-text-secondary hover:text-agnes-text-primary transition-colors"
          >
            <span>高级设置</span>
            {advOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <div className={`overflow-hidden transition-all duration-300 ${advOpen ? 'max-h-[600px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-agnes-text-muted mb-1">Seed</label>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(Number(e.target.value))}
                  className="w-full bg-agnes-bg border border-agnes-border rounded-input px-3 py-1.5 text-agnes-text-primary text-sm font-mono focus:outline-none focus:border-agnes-purple/50"
                />
              </div>
              <Slider label="CFG Scale" value={cfgScale} onChange={setCfgScale} min={1} max={20} />
              <Slider label="Steps" value={steps} onChange={setSteps} min={10} max={50} />
              <Select label="采样器" value={sampler} onChange={(e) => setSampler(e.target.value)} options={toOptions(samplers)} />
              <div className="flex items-center justify-between">
                <span className="text-xs text-agnes-text-muted">高清修复</span>
                <button
                  onClick={() => setHdFix(!hdFix)}
                  className={`w-10 h-5 rounded-full transition-colors ${hdFix ? 'bg-agnes-purple' : 'bg-agnes-border'}`}
                >
                  <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${hdFix ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {isVideo && (
                <>
                  <Slider label="运动强度" value={motionIntensity} onChange={setMotionIntensity} min={1} max={10} />
                  <Select label="镜头运动" value={cameraMotion} onChange={(e) => setCameraMotion(e.target.value)} options={toOptions(cameraMotions)} />
                </>
              )}
            </div>
          </div>
        </section>

        <div className="border-t border-agnes-border" />

        <section>
          <h3 className="text-xs text-agnes-text-secondary mb-2">参考图</h3>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const files = e.dataTransfer.files
              Array.from(files).forEach((f) => {
                const reader = new FileReader()
                reader.onload = (ev) => {
                  if (ev.target?.result) setRefImages((prev) => [...prev, ev.target!.result as string])
                }
                reader.readAsDataURL(f)
              })
            }}
            className="border-2 border-dashed border-agnes-border rounded-card p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-agnes-purple/50 transition-colors"
          >
            <Upload size={20} className="text-agnes-text-muted" />
            <span className="text-xs text-agnes-text-muted">拖拽或点击上传</span>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
          {refImages.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {refImages.map((src, i) => (
                <div key={i} className="relative w-14 h-14 rounded-card overflow-hidden group">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeRefImage(i)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-agnes-bg/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} className="text-agnes-text-primary" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="sticky bottom-0 p-4 bg-agnes-bg-secondary border-t border-agnes-border">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-3 rounded-btn gradient-primary text-white font-medium flex items-center justify-center gap-2 hover:shadow-[0_0_24px_rgba(124,92,255,0.4)] transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {generating ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              生成中…
            </span>
          ) : (
            <>
              <Zap size={16} /> 生成
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
