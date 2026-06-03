import { useState, useRef, useEffect } from 'react'
import { Mic, Play, Pause, Download, Upload, X, Sparkles, Volume2, ChevronDown, ChevronUp, Wand2, Music, User, FileAudio, Zap, Type, Clapperboard } from 'lucide-react'
import Chip from '@/components/ui/Chip'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { showToast } from '@/components/ui/Toast'
import { cn } from '@/utils/helpers'

type TTSModel = 'mimo-v2.5-tts' | 'mimo-v2.5-tts-voicedesign' | 'mimo-v2.5-tts-voiceclone'
type StyleMode = 'natural' | 'tag'

const MODEL_TABS: { key: TTSModel; label: string; sub: string }[] = [
  { key: 'mimo-v2.5-tts', label: '预置音色', sub: 'mimo-v2.5-tts' },
  { key: 'mimo-v2.5-tts-voicedesign', label: '音色设计', sub: 'mimo-v2.5-tts-voicedesign' },
  { key: 'mimo-v2.5-tts-voiceclone', label: '音色复刻', sub: 'mimo-v2.5-tts-voiceclone' },
]

const PRESET_VOICES = [
  { id: 'mimo_default', name: '冰糖', tag: '中文女性' },
  { id: 'mimo_moli', name: '茉莉', tag: '中文女性' },
  { id: 'mimo_suda', name: '苏打', tag: '中文男性' },
  { id: 'mimo_baihua', name: '白桦', tag: '中文男性' },
  { id: 'mimo_mia', name: 'Mia', tag: '英文女性' },
  { id: 'mimo_chloe', name: 'Chloe', tag: '英文女性' },
  { id: 'mimo_milo', name: 'Milo', tag: '英文男性' },
  { id: 'mimo_dean', name: 'Dean', tag: '英文男性' },
]

const STYLE_CHIPS = ['开心', '悲伤', '愤怒', '温柔', '慵懒', '磁性', '东北话', '粤语', '唱歌']
const TAG_STYLES = ['开心', '慵懒', '磁性', '东北话', '粤语', '唱歌']
const TAG_AUDIOS = ['吸气', '叹气', '笑', '哭', '颤抖', '停顿', '咳嗽']

const STYLE_PLACEHOLDERS: Record<TTSModel, string> = {
  'mimo-v2.5-tts': '用轻快上扬的语调，语速稍快...',
  'mimo-v2.5-tts-voicedesign': 'Young female, warm and confident...',
  'mimo-v2.5-tts-voiceclone': '可选：输入风格指令...',
}

export default function TTSMode() {
  const [model, setModel] = useState<TTSModel>('mimo-v2.5-tts')
  const [styleMode, setStyleMode] = useState<StyleMode>('natural')
  const [synthText, setSynthText] = useState('')
  const [styleText, setStyleText] = useState('')
  const [tagText, setTagText] = useState('')
  const [selectedVoice, setSelectedVoice] = useState('mimo_default')
  const [singMode, setSingMode] = useState(false)
  const [voiceDesc, setVoiceDesc] = useState('')
  const [optimizePreview, setOptimizePreview] = useState(false)
  const [tipsOpen, setTipsOpen] = useState(false)
  const [cloneFile, setCloneFile] = useState<string | null>(null)
  const [outputFormat, setOutputFormat] = useState('wav')
  const [apiKey, setApiKey] = useState('')
  const [directorOpen, setDirectorOpen] = useState(false)
  const [roleText, setRoleText] = useState('')
  const [sceneText, setSceneText] = useState('')
  const [directText, setDirectText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [waveHeights, setWaveHeights] = useState<number[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    if (playing) {
      const tick = () => {
        setWaveHeights(Array.from({ length: 50 }, () => 8 + Math.random() * 40))
        animRef.current = requestAnimationFrame(tick)
      }
      tick()
    } else {
      cancelAnimationFrame(animRef.current)
      if (generated) setWaveHeights(Array.from({ length: 50 }, () => 8 + Math.random() * 20))
    }
    return () => cancelAnimationFrame(animRef.current)
  }, [playing, generated])

  const handleGenerate = () => {
    if (!synthText.trim()) { showToast('warning', '请输入合成文本'); return }
    if (model === 'mimo-v2.5-tts-voicedesign' && !styleText.trim()) { showToast('warning', '音色设计模式需要输入风格描述'); return }
    setGenerating(true)
    setGenerated(false)
    setTimeout(() => { setGenerating(false); setGenerated(true); setWaveHeights(Array.from({ length: 50 }, () => 8 + Math.random() * 20)); showToast('success', '语音合成完成') }, 2000)
  }

  const handleFileUpload = () => fileRef.current?.click()
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) { if (f.size > 10 * 1024 * 1024) { showToast('error', '文件大小不能超过 10MB'); return }; setCloneFile(f.name) }
  }

  const insertTag = (tag: string, type: 'style' | 'audio') => {
    const insert = type === 'style' ? `(${tag})` : `[${tag}]`
    setTagText((prev) => prev + insert)
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 p-6 gap-4 overflow-y-auto">
        <div className="flex gap-2">
          {MODEL_TABS.map((tab) => (
            <button key={tab.key} onClick={() => setModel(tab.key)} className={cn('px-4 py-2 rounded-btn text-sm font-medium transition-all duration-200', model === tab.key ? 'gradient-primary text-white glow-purple' : 'glass text-agnes-text-secondary hover:text-agnes-text-primary hover:bg-white/10')}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="glass rounded-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-agnes-text-muted uppercase tracking-wider flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5 text-agnes-cyan" />合成文本</label>
            <Button variant="ghost" size="sm" className="gap-1 text-agnes-cyan" onClick={() => setSynthText('在未来的世界里，人工智能与人类和谐共处，共同创造美好的明天。')}><Sparkles className="w-3.5 h-3.5" />AI 生成文本</Button>
          </div>
          <textarea value={synthText} onChange={(e) => setSynthText(e.target.value)} placeholder="输入要合成的文本内容..." rows={4} className="w-full bg-agnes-bg/60 border border-agnes-border rounded-input px-4 py-3 text-sm text-agnes-text-primary placeholder:text-agnes-text-muted resize-none focus:outline-none focus:border-agnes-purple/50 transition-colors" />
          <div className="text-right text-xs text-agnes-text-muted">{synthText.length} 字</div>
        </div>

        <div className="glass rounded-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-agnes-text-muted uppercase tracking-wider flex items-center gap-1.5"><Type className="w-3.5 h-3.5 text-agnes-purple" />风格控制</label>
            <div className="flex gap-1 ml-auto">
              <button onClick={() => setStyleMode('natural')} className={cn('px-3 py-1 text-xs rounded-full border transition-all', styleMode === 'natural' ? 'bg-agnes-purple/20 text-agnes-purple border-agnes-purple/40' : 'text-agnes-text-muted border-agnes-border hover:border-agnes-border-hover')}>自然语言模式</button>
              <button onClick={() => setStyleMode('tag')} className={cn('px-3 py-1 text-xs rounded-full border transition-all', styleMode === 'tag' ? 'bg-agnes-purple/20 text-agnes-purple border-agnes-purple/40' : 'text-agnes-text-muted border-agnes-border hover:border-agnes-border-hover')}>音频标签模式</button>
            </div>
          </div>

          {styleMode === 'natural' ? (
            <>
              <textarea value={styleText} onChange={(e) => setStyleText(e.target.value)} placeholder={STYLE_PLACEHOLDERS[model]} rows={3} className="w-full bg-agnes-bg/60 border border-agnes-border rounded-input px-4 py-3 text-sm text-agnes-text-primary placeholder:text-agnes-text-muted resize-none focus:outline-none focus:border-agnes-purple/50 transition-colors" />
              <div className="flex flex-wrap gap-1.5">
                {STYLE_CHIPS.map((s) => <Chip key={s} variant="purple" onClick={() => setStyleText((p) => p + (p ? '，' : '') + s)}>{s}</Chip>)}
              </div>
              <div>
                <button onClick={() => setDirectorOpen(!directorOpen)} className="flex items-center gap-1.5 text-xs text-agnes-cyan hover:text-agnes-cyan/80 transition-colors">
                  <Clapperboard className="w-3.5 h-3.5" />导演模式 {directorOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {directorOpen && (
                  <div className="mt-2 space-y-2 animate-fade-in">
                    <div className="flex gap-2 items-start"><span className="text-xs text-agnes-text-muted mt-2 shrink-0 w-12">【角色】</span><textarea value={roleText} onChange={(e) => setRoleText(e.target.value)} rows={2} className="flex-1 bg-agnes-bg/60 border border-agnes-border rounded-input px-3 py-2 text-xs text-agnes-text-primary placeholder:text-agnes-text-muted resize-none focus:outline-none focus:border-agnes-purple/50" /></div>
                    <div className="flex gap-2 items-start"><span className="text-xs text-agnes-text-muted mt-2 shrink-0 w-12">【场景】</span><textarea value={sceneText} onChange={(e) => setSceneText(e.target.value)} rows={2} className="flex-1 bg-agnes-bg/60 border border-agnes-border rounded-input px-3 py-2 text-xs text-agnes-text-primary placeholder:text-agnes-text-muted resize-none focus:outline-none focus:border-agnes-purple/50" /></div>
                    <div className="flex gap-2 items-start"><span className="text-xs text-agnes-text-muted mt-2 shrink-0 w-12">【指导】</span><textarea value={directText} onChange={(e) => setDirectText(e.target.value)} rows={2} className="flex-1 bg-agnes-bg/60 border border-agnes-border rounded-input px-3 py-2 text-xs text-agnes-text-primary placeholder:text-agnes-text-muted resize-none focus:outline-none focus:border-agnes-purple/50" /></div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <textarea value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="(风格)文本内容[音频标签]更多内容" rows={3} className="w-full bg-agnes-bg/60 border border-agnes-border rounded-input px-4 py-3 text-sm text-agnes-text-primary placeholder:text-agnes-text-muted resize-none focus:outline-none focus:border-agnes-purple/50 font-mono" />
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap"><span className="text-[10px] text-agnes-text-muted mr-1">风格</span>{TAG_STYLES.map((s) => <Chip key={s} variant="purple" onClick={() => insertTag(s, 'style')}>{s}</Chip>)}</div>
                <div className="flex items-center gap-1.5 flex-wrap"><span className="text-[10px] text-agnes-text-muted mr-1">音频</span>{TAG_AUDIOS.map((a) => <Chip key={a} variant="cyan" onClick={() => insertTag(a, 'audio')}>{a}</Chip>)}</div>
              </div>
              {tagText && <div className="bg-agnes-bg/60 rounded-input p-3 text-xs text-agnes-text-secondary border border-agnes-border">{tagText.replace(/\(([^)]+)\)/g, '<span class="text-agnes-purple font-medium">$1</span>').replace(/\[([^\]]+)\]/g, '<span class="text-agnes-cyan font-medium">[$1]</span>')}</div>}
            </>
          )}
        </div>

        <Button variant="primary" size="lg" loading={generating} onClick={handleGenerate} className="w-full gap-2">
          <Mic className="w-4 h-4" />合成语音
        </Button>

        {generating && (
          <div className="glass rounded-card p-4 space-y-2 animate-fade-in">
            <div className="text-xs text-agnes-text-muted">正在合成语音...</div>
            <div className="w-full h-1.5 bg-agnes-card rounded-full overflow-hidden"><div className="h-full gradient-primary rounded-full animate-shimmer" style={{ width: '60%' }} /></div>
          </div>
        )}

        {generated && (
          <div className="glass rounded-card p-4 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-agnes-text-muted uppercase tracking-wider">合成结果</span>
              <span className="text-xs text-agnes-text-muted">0:12</span>
            </div>
            <div className="flex items-end gap-[2px] h-14 justify-center">
              {waveHeights.map((h, i) => <div key={i} className={cn('w-1 rounded-full transition-all duration-100', playing ? 'bg-agnes-cyan' : 'bg-agnes-purple/60')} style={{ height: `${h}px` }} />)}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setPlaying(!playing)} className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center hover:shadow-[0_0_20px_rgba(124,92,255,0.4)] transition-all">
                {playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
              </button>
              <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => showToast('info', '下载功能开发中')}><Download className="w-3.5 h-3.5" />WAV</Button>
            </div>
          </div>
        )}
      </div>

      <div className="w-[320px] shrink-0 border-l border-agnes-border bg-agnes-bg-secondary overflow-y-auto">
        <div className="p-4 space-y-5">
          {model === 'mimo-v2.5-tts' && (
            <div>
              <h3 className="text-xs font-semibold text-agnes-text-muted uppercase tracking-wider mb-3 flex items-center gap-2"><User className="w-3.5 h-3.5 text-agnes-cyan" />预置音色</h3>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_VOICES.map((v) => (
                  <button key={v.id} onClick={() => setSelectedVoice(v.id)} className={cn('p-3 rounded-card border text-left transition-all duration-200', selectedVoice === v.id ? 'bg-agnes-purple/15 border-agnes-purple/50 glow-purple' : 'bg-agnes-card border-agnes-border hover:border-agnes-border-hover')}>
                    <div className="text-sm font-medium text-agnes-text-primary">{v.name}</div>
                    <div className="text-[10px] text-agnes-text-muted mt-0.5">{v.tag}</div>
                  </button>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-agnes-text-secondary flex items-center gap-1.5"><Music className="w-3.5 h-3.5 text-agnes-purple" />唱歌模式</span>
                <button onClick={() => setSingMode(!singMode)} className={cn('w-10 h-5 rounded-full transition-all duration-200 relative', singMode ? 'bg-agnes-purple' : 'bg-agnes-border')}>
                  <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200', singMode ? 'left-[22px]' : 'left-0.5')} />
                </button>
              </div>
            </div>
          )}

          {model === 'mimo-v2.5-tts-voicedesign' && (
            <div>
              <h3 className="text-xs font-semibold text-agnes-text-muted uppercase tracking-wider mb-3 flex items-center gap-2"><Wand2 className="w-3.5 h-3.5 text-agnes-cyan" />音色描述</h3>
              <textarea value={voiceDesc} onChange={(e) => setVoiceDesc(e.target.value)} placeholder="描述你想要的音色..." rows={4} className="w-full bg-agnes-card border border-agnes-border rounded-input px-3 py-2 text-xs text-agnes-text-primary placeholder:text-agnes-text-muted resize-none focus:outline-none focus:border-agnes-purple/50" />
              <div className="mt-3">
                <button onClick={() => setTipsOpen(!tipsOpen)} className="flex items-center gap-1 text-xs text-agnes-cyan hover:text-agnes-cyan/80 transition-colors">
                  <Sparkles className="w-3 h-3" />示例提示 {tipsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {tipsOpen && (
                  <div className="mt-2 space-y-2 text-[11px] text-agnes-text-secondary animate-fade-in">
                    <div className="bg-agnes-card rounded-input p-2 border border-agnes-border"><span className="text-agnes-purple font-medium">简洁描述型：</span>Heavy Russian accent, gruff middle-aged male...</div>
                    <div className="bg-agnes-card rounded-input p-2 border border-agnes-border"><span className="text-agnes-purple font-medium">专业描述型：</span>Young female, extreme close-up ASMR feel...</div>
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-agnes-text-secondary">optimize_text_preview</span>
                <button onClick={() => setOptimizePreview(!optimizePreview)} className={cn('w-10 h-5 rounded-full transition-all duration-200 relative', optimizePreview ? 'bg-agnes-purple' : 'bg-agnes-border')}>
                  <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200', optimizePreview ? 'left-[22px]' : 'left-0.5')} />
                </button>
              </div>
              <Button variant="secondary" size="sm" className="w-full mt-3 gap-1.5" onClick={() => showToast('info', '文本适配功能开发中')}><Zap className="w-3.5 h-3.5" />生成适配文本</Button>
            </div>
          )}

          {model === 'mimo-v2.5-tts-voiceclone' && (
            <div>
              <h3 className="text-xs font-semibold text-agnes-text-muted uppercase tracking-wider mb-3 flex items-center gap-2"><FileAudio className="w-3.5 h-3.5 text-agnes-cyan" />音频样本</h3>
              <input ref={fileRef} type="file" accept=".mp3,.wav" className="hidden" onChange={handleFileChange} />
              {cloneFile ? (
                <div className="flex items-center gap-2 bg-agnes-card border border-agnes-border rounded-input p-3">
                  <FileAudio className="w-4 h-4 text-agnes-purple shrink-0" />
                  <span className="text-xs text-agnes-text-primary truncate flex-1">{cloneFile}</span>
                  <button onClick={() => setCloneFile(null)} className="p-0.5 hover:bg-white/10 rounded"><X className="w-3.5 h-3.5 text-agnes-text-muted" /></button>
                </div>
              ) : (
                <button onClick={handleFileUpload} className="w-full border-2 border-dashed border-agnes-border rounded-card p-6 flex flex-col items-center gap-2 hover:border-agnes-purple/40 transition-colors">
                  <Upload className="w-8 h-8 text-agnes-text-muted" />
                  <span className="text-xs text-agnes-text-muted">拖拽或点击上传音频</span>
                  <span className="text-[10px] text-agnes-text-muted">mp3 / wav, 最大 10MB</span>
                </button>
              )}
              <p className="mt-3 text-[11px] text-agnes-text-muted">上传音频样本，AI 将精准复刻该音色</p>
            </div>
          )}

          <div className="border-t border-agnes-border pt-4 space-y-3">
            <Select label="输出格式" options={[{ value: 'wav', label: 'WAV' }, { value: 'mp3', label: 'MP3' }]} value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} />
            <div className="space-y-1.5">
              <label className="text-xs text-agnes-text-secondary">API Key</label>
              <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="输入 API Key..." className="w-full h-9 px-3 text-sm rounded-input bg-agnes-card border border-agnes-border text-agnes-text-primary placeholder:text-agnes-text-muted focus:outline-none focus:border-agnes-purple/50 transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
