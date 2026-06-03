import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Image, Video, Bot, User, MessageSquare, Zap, ArrowRight, Lightbulb, Wand2, Settings2, FileImage, ChevronDown, ChevronUp } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import useTaskStore from '@/store/useTaskStore'
import Chip from '@/components/ui/Chip'
import Button from '@/components/ui/Button'
import { showToast } from '@/components/ui/Toast'
import { cn } from '@/utils/helpers'
import api from '@/utils/api'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  suggestions?: string[]
  taskAction?: { type: 'image' | 'video'; prompt: string }
  timestamp: number
}

const initialMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'user',
    content: '帮我生成一张赛博朋克风格的城市夜景',
    timestamp: Date.now() - 120000,
  },
  {
    id: '2',
    role: 'assistant',
    content: '我来帮你优化这个提示词。赛博朋克风格的城市夜景可以更具体化：\n\n**优化后的提示词：**\nCyberpunk cityscape at night, neon lights reflecting on wet streets, towering holographic advertisements, flying vehicles, dense urban architecture, cinematic lighting, volumetric fog\n\n**建议参数：**\n- 画幅：21:9 宽屏\n- 风格：赛博朋克\n- 创意强度：8\n- 细节强度：9\n\n你可以直接点击下方按钮转为生图任务。',
    suggestions: ['增加雨夜效果', '加入飞行汽车', '调整色调为蓝紫'],
    taskAction: { type: 'image', prompt: 'Cyberpunk cityscape at night, neon lights reflecting on wet streets, towering holographic advertisements, flying vehicles, dense urban architecture, cinematic lighting, volumetric fog' },
    timestamp: Date.now() - 90000,
  },
]

const aiTemplates = [
  {
    content: '好的，我来帮你优化这个提示词。让我从构图、光影和风格三个维度来增强：\n\n**优化结果：**\nEthereal dreamlike scene, soft pastel color palette, flowing silk textures, golden hour lighting, bokeh background, ultra detailed\n\n**风格建议：**\n- 尝试梦幻风格，柔和色调\n- 使用黄金时刻光照\n- 加入丝绸质感纹理',
    suggestions: ['调整色温', '更换构图', '修改风格'],
    taskAction: { type: 'image' as const, prompt: 'Ethereal dreamlike scene, soft pastel color palette, flowing silk textures, golden hour lighting, bokeh background, ultra detailed' },
  },
  {
    content: '根据你的需求，我推荐以下参数配置：\n\n**推荐参数：**\n- 采样器：DPM++ 2M Karras\n- 步数：30-40\n- CFG Scale：7-9\n- 画幅：根据内容选择\n\n**小贴士：**\n高 CFG 值能让画面更贴合提示词，但过高可能导致色彩过饱和。建议从 7 开始微调。',
    suggestions: ['降低创意强度', '提高细节', '换用其他采样器'],
  },
  {
    content: '这是一个很有创意的想法！让我从视觉叙事的角度给出一些建议：\n\n**风格分析：**\n- 画面主体应突出视觉焦点\n- 背景层次感可以通过景深实现\n- 色彩对比能增强视觉冲击力\n\n**推荐组合：**\n电影感构图 + 高对比度光影 + 精细纹理细节',
    suggestions: ['尝试极简风格', '增加叙事元素', '调整色彩方案'],
    taskAction: { type: 'video' as const, prompt: 'Cinematic composition, high contrast lighting, detailed textures, visual storytelling, dynamic camera movement' },
  },
]

const capabilities = [
  { icon: Wand2, label: '提示词优化' },
  { icon: Lightbulb, label: '风格建议' },
  { icon: Settings2, label: '参数建议' },
  { icon: ArrowRight, label: '任务转化' },
]

const quickPrompts = [
  '帮我写一个赛博朋克风格的提示词',
  '推荐适合人像的参数',
  '分析这张图片的风格',
  '如何让画面更有电影感',
]

const recentChats = [
  { title: '赛博朋克城市夜景', time: '2分钟前' },
  { title: '人像摄影参数调优', time: '1小时前' },
  { title: '水彩风格提示词', time: '3小时前' },
  { title: '产品图背景生成', time: '昨天' },
]

export default function ChatMode() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showModelSel, setShowModelSel] = useState(false)
  const [selectedImageModel, setSelectedImageModel] = useState('agnes-image-2.1')
  const [selectedVideoModel, setSelectedVideoModel] = useState('agnes-video-v2.0')
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const createTask = useTaskStore((s) => s.createTask)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content) return

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const res = await api.chatCompletion([
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: input },
      ])

      const aiContent = res.data?.choices?.[0]?.message?.content || '抱歉，我暂时无法回复，请稍后再试。'
      const aiMsg: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: 'assistant',
        content: aiContent,
        suggestions: ['生成图片', '生成视频', '优化提示词', '调整参数'],
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      const aiMsg: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: 'assistant',
        content: '网络错误，请检查后端服务是否正常运行。',
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, aiMsg])
    }
    setIsTyping(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleConvertTask = async (type: 'image' | 'video', prompt: string) => {
    try {
      const apiFn = type === 'video' ? api.generateVideo.bind(api) : api.generateImage.bind(api)
      const res = await apiFn({ prompt })
      if (res.error) {
        showToast('error', res.error)
      } else {
        createTask({ type, prompt, negativePrompt: '', params: {} })
        showToast('success', type === 'image' ? '已创建生图任务' : '已创建视频任务')
      }
    } catch {
      createTask({ type, prompt, negativePrompt: '', params: {} })
      showToast('success', type === 'image' ? '已创建生图任务' : '已创建视频任务')
    }
  }

  const handleDirectGenerate = (type: 'image' | 'video', prompt: string) => {
    createTask({ type, prompt, negativePrompt: '', params: {} })
    if (type === 'image') {
      useAppStore.getState().setCurrentMode('text-to-image')
      showToast('success', '已创建图片生成任务并切换到文生图模式')
    } else {
      useAppStore.getState().setCurrentMode('text-to-video')
      showToast('success', '已创建视频生成任务并切换到文生视频模式')
    }
  }

  const handleConvertToMaterial = () => {
    useAppStore.getState().setCurrentMode('image-to-image')
    showToast('success', '已切换到图生图模式，可作为参考素材')
  }

  const handleOptimize = () => {
    if (!input.trim()) return
    sendMessage(`请优化这个提示词：${input}`)
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {messages.map((msg) => (
            <div key={msg.id} className={cn('flex gap-3 animate-slide-up', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'assistant' && (
                <div className="shrink-0 w-8 h-8 rounded-full gradient-primary flex items-center justify-center mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={cn('max-w-[85%] sm:max-w-[70%] space-y-2', msg.role === 'user' ? 'items-end' : 'items-start')}>
                <div
                  className={cn(
                    'rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-agnes-purple to-agnes-purple-dim text-white rounded-br-md'
                      : 'glass text-agnes-text-primary rounded-bl-md'
                  )}
                >
                  {msg.content.split('\n').map((line, i) => (
                    <span key={i}>
                      {line.startsWith('**') && line.endsWith('**') ? (
                        <strong className="text-agnes-cyan font-semibold">{line.replace(/\*\*/g, '')}</strong>
                      ) : (
                        line
                      )}
                      {i < msg.content.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
                {msg.role === 'assistant' && msg.suggestions && (
                  <div className="flex flex-wrap gap-1.5">
                    {msg.suggestions.map((s) => (
                      <Chip key={s} variant="cyan" onClick={() => sendMessage(s)}>
                        {s}
                      </Chip>
                    ))}
                  </div>
                )}
                {msg.role === 'assistant' && msg.taskAction && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleConvertTask(msg.taskAction!.type, msg.taskAction!.prompt)}
                      className="gap-1.5"
                    >
                      {msg.taskAction.type === 'image' ? <Image className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                      转为{msg.taskAction.type === 'image' ? '生图' : '视频'}任务
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDirectGenerate('image', msg.taskAction?.prompt || msg.content)}
                      className="gap-1 text-xs bg-gradient-to-r from-agnes-purple/20 to-agnes-cyan/20 hover:from-agnes-purple/30 hover:to-agnes-cyan/30 border border-agnes-purple/20"
                    >
                      <Image className="w-3.5 h-3.5" />
                      生成图片
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDirectGenerate('video', msg.taskAction?.prompt || msg.content)}
                      className="gap-1 text-xs bg-gradient-to-r from-agnes-cyan/20 to-agnes-purple/20 hover:from-agnes-cyan/30 hover:to-agnes-purple/30 border border-agnes-cyan/20"
                    >
                      <Video className="w-3.5 h-3.5" />
                      生成视频
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleConvertToMaterial}
                      className="gap-1 text-xs bg-white/[0.06] hover:bg-white/[0.12] border border-agnes-border"
                    >
                      <FileImage className="w-3.5 h-3.5" />
                      转为素材
                    </Button>
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="shrink-0 w-8 h-8 rounded-full bg-agnes-card border border-agnes-border flex items-center justify-center mt-1">
                  <User className="w-4 h-4 text-agnes-text-muted" />
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3 animate-fade-in">
              <div className="shrink-0 w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="glass rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-agnes-purple animate-pulse" />
                  <span className="w-2 h-2 rounded-full bg-agnes-purple animate-pulse [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-agnes-purple animate-pulse [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-agnes-border bg-agnes-bg-secondary p-4 relative">
          <div className="max-w-3xl mx-auto">
            <div className="glass rounded-input focus-within:border-agnes-purple/40 transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="和 Agnes AI 对话，获取创作建议..."
                rows={2}
                className="w-full bg-transparent px-4 py-3 text-sm text-agnes-text-primary placeholder:text-agnes-text-muted resize-none focus:outline-none"
              />
              <div className="flex items-center justify-between gap-2 px-3 pb-3">
                <div className="flex gap-2 overflow-x-auto flex-nowrap scrollbar-hide min-w-0">
                  <button onClick={() => setShowModelSel(!showModelSel)} className="flex items-center gap-1 h-7 px-2 text-xs rounded-md text-agnes-text-secondary hover:text-agnes-text-primary hover:bg-white/5 transition-colors border border-agnes-border shrink-0">
                    <Sparkles className="w-3 h-3" />
                    生成模型选择
                    {showModelSel ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  </button>
                    {showModelSel && (
                      <div className="absolute bottom-full left-0 mb-2 w-64 sm:w-72 rounded-xl bg-[#101523] border border-agnes-border shadow-2xl shadow-black/60 p-3 z-50">
                        <div className="text-[10px] text-agnes-text-muted uppercase tracking-wider mb-2">图像模型</div>
                        <div className="grid grid-cols-2 gap-1.5 mb-3">
                          {[
                            { id: 'gpt-image-2', name: 'GPT-Image-2' },
                            { id: 'nano-banana-pro', name: 'Nano Banana Pro' },
                            { id: 'nano-banana-2', name: 'Nano Banana 2' },
                            { id: 'agnes-image-2.0', name: 'Agnes Image 2.0 Flash' },
                            { id: 'agnes-image-2.1', name: 'Agnes Image 2.1 Flash' },
                          ].map((m) => (
                            <button key={m.id}
                              onClick={() => { setSelectedImageModel(m.id); showToast('success', `已选择 ${m.name}`) }}
                              className={`text-left px-2 py-1.5 rounded-md text-xs transition-all ${
                                selectedImageModel === m.id
                                  ? 'bg-agnes-purple/20 text-agnes-purple border border-agnes-purple/40'
                                  : 'bg-agnes-card border border-agnes-border text-agnes-text-secondary hover:text-agnes-text-primary'
                              }`}
                            >
                              {m.name}
                              {m.id === 'agnes-image-2.1' && <span className="ml-1 text-[9px] text-agnes-cyan">默认</span>}
                            </button>
                          ))}
                        </div>
                        <div className="text-[10px] text-agnes-text-muted uppercase tracking-wider mb-2">视频模型</div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { id: 'agnes-video-v2.0', name: 'Agnes Video V2.0' },
                            { id: 'seedance-2.0', name: 'Seedance 2.0' },
                          ].map((m) => (
                            <button key={m.id}
                              onClick={() => {
                                if (m.id === 'seedance-2.0') {
                                  showToast('warning', '该模型接入中，敬请期待')
                                } else {
                                  setSelectedVideoModel(m.id)
                                  showToast('success', `已选择 ${m.name}`)
                                }
                              }}
                              disabled={m.id === 'seedance-2.0'}
                              className={`text-left px-2 py-1.5 rounded-md text-xs transition-all ${
                                m.id === 'seedance-2.0'
                                  ? 'bg-agnes-card/50 border border-agnes-border text-agnes-text-muted cursor-not-allowed opacity-60'
                                  : selectedVideoModel === m.id
                                    ? 'bg-agnes-cyan/20 text-agnes-cyan border border-agnes-cyan/40'
                                    : 'bg-agnes-card border border-agnes-border text-agnes-text-secondary hover:text-agnes-text-primary'
                              }`}
                            >
                              {m.name}
                              {m.id === 'agnes-video-v2.0' && <span className="ml-1 text-[9px] text-agnes-cyan">默认</span>}
                              {m.id === 'seedance-2.0' && <span className="ml-1 text-[9px] text-agnes-warning">接入中</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  <Button variant="ghost" size="sm" onClick={handleOptimize} className="gap-1 text-agnes-cyan">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI 优化提示词
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => input.trim() && handleConvertTask('image', input)} className="gap-1">
                    <Image className="w-3.5 h-3.5" />
                    转为生图
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => input.trim() && handleConvertTask('video', input)} className="gap-1">
                    <Video className="w-3.5 h-3.5" />
                    转为视频
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { if (input.trim()) handleConvertToMaterial() }} className="gap-1">
                    <FileImage className="w-3.5 h-3.5" />
                    转素材
                  </Button>
                </div>
                <Button variant="primary" size="sm" onClick={() => sendMessage()} disabled={!input.trim() || isTyping} className="gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  发送
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block w-[280px] shrink-0 border-l border-agnes-border bg-agnes-bg-secondary overflow-y-auto">
        <div className="p-4 space-y-5">
          <div>
            <h3 className="text-xs font-semibold text-agnes-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-agnes-cyan" />
              对话能力
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {capabilities.map((cap) => (
                <Chip key={cap.label} variant="purple">
                  <cap.icon className="w-3 h-3 mr-1" />
                  {cap.label}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-agnes-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-agnes-warning" />
              快捷提问
            </h3>
            <div className="space-y-1.5">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="w-full text-left px-3 py-2 text-xs text-agnes-text-secondary rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-transparent hover:border-agnes-border transition-all duration-200 flex items-center gap-2 group"
                >
                  <ArrowRight className="w-3 h-3 text-agnes-purple opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="line-clamp-2">{prompt}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-agnes-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-agnes-purple" />
              对话历史
            </h3>
            <div className="space-y-1">
              {recentChats.map((chat) => (
                <button
                  key={chat.title}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors group"
                >
                  <p className="text-xs text-agnes-text-secondary group-hover:text-agnes-text-primary transition-colors truncate">{chat.title}</p>
                  <p className="text-[10px] text-agnes-text-muted mt-0.5">{chat.time}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
