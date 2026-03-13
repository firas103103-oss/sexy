import React, { useState, useEffect, useRef } from 'react';
import { 
  auth, 
  signIn, 
  logOut, 
  db, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  limit,
  addDoc,
  serverTimestamp
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { processInteraction, generateSultanVoice } from './services/geminiService';
import { 
  Brain, 
  MessageSquare, 
  History, 
  Settings, 
  LogOut, 
  Play, 
  Pause, 
  Mic, 
  Send, 
  Baby, 
  ShieldCheck, 
  Droplets, 
  Car, 
  Heart,
  Search,
  Plus,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
      active 
        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
        : "text-slate-400 hover:bg-white/5 hover:text-white"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const MemoryCard = ({ memory }: any) => (
  <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 hover:border-emerald-500/30 transition-all group">
    <div className="flex justify-between items-start mb-2">
      <span className={cn(
        "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold",
        memory.category === 'milestone' ? "bg-indigo-500/20 text-indigo-400" :
        memory.category === 'behavior' ? "bg-emerald-500/20 text-emerald-400" :
        "bg-amber-500/20 text-amber-400"
      )}>
        {memory.category}
      </span>
      <span className="text-[10px] text-slate-500">
        {memory.timestamp?.toDate ? format(memory.timestamp.toDate(), 'MMM d, yyyy') : 'Recent'}
      </span>
    </div>
    <p className="text-sm text-slate-300 leading-relaxed">{memory.content}</p>
  </div>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'memories' | 'analysis'>('chat');
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [memories, setMemories] = useState<any[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const qInteractions = query(
      collection(db, "interactions"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc"),
      limit(20)
    );

    const qMemories = query(
      collection(db, "memories"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    );

    const unsubI = onSnapshot(qInteractions, (snap) => {
      setInteractions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubM = onSnapshot(qMemories, (snap) => {
      setMemories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubI();
      unsubM();
    };
  }, [user]);

  const handleSend = async () => {
    if (!prompt.trim() || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const result = await processInteraction(prompt);
      setPrompt('');
      
      // Auto-generate voice for Sultan's part
      if (result.sultanPart) {
        const voice = await generateSultanVoice(result.sultanPart);
        if (voice) {
          setAudioUrl(voice);
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const addMemory = async (content: string, category: string) => {
    if (!user) return;
    await addDoc(collection(db, "memories"), {
      content,
      category,
      timestamp: serverTimestamp(),
      userId: user.uid
    });
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex flex-col items-center gap-4"
        >
          <Brain className="text-emerald-500 w-12 h-12" />
          <span className="text-emerald-500 font-mono text-sm tracking-widest uppercase">Initializing Nexus Prime...</span>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-4">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="inline-block p-4 bg-emerald-500/10 rounded-3xl border border-emerald-500/20"
            >
              <Brain className="text-emerald-500 w-16 h-16" />
            </motion.div>
            <h1 className="text-4xl font-bold text-white tracking-tight">SULTAN NEXUS</h1>
            <p className="text-slate-400">Advanced Cognitive Simulator & Parenting Copilot</p>
          </div>
          
          <button
            onClick={signIn}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-3"
          >
            <ShieldCheck size={20} />
            Connect with Google
          </button>
          
          <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em]">Sovereign AI Ecosystem v2.9.0</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#020617] text-slate-200 flex overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-80 border-r border-white/5 bg-[#0a0f18] flex flex-col">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Baby className="text-black" size={24} />
            </div>
            <div>
              <h2 className="font-bold text-white leading-none">Sultan Nexus</h2>
              <span className="text-[10px] text-emerald-500 font-mono uppercase">Active Simulator</span>
            </div>
          </div>
          
          <nav className="space-y-2">
            <SidebarItem 
              icon={MessageSquare} 
              label="Cognitive Chat" 
              active={activeTab === 'chat'} 
              onClick={() => setActiveTab('chat')}
            />
            <SidebarItem 
              icon={History} 
              label="Memory Vault" 
              active={activeTab === 'memories'} 
              onClick={() => setActiveTab('memories')}
            />
            <SidebarItem 
              icon={Brain} 
              label="Parenting Insights" 
              active={activeTab === 'analysis'} 
              onClick={() => setActiveTab('analysis')}
            />
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="text-xs text-slate-500 mb-1">Age</div>
                <div className="text-sm font-bold text-white">2.9y</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="text-xs text-slate-500 mb-1">Memories</div>
                <div className="text-sm font-bold text-white">{memories.length}</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Recent Memories</h3>
            <div className="space-y-3">
              {memories.slice(0, 3).map(m => (
                <div key={m.id} className="text-xs text-slate-400 border-l-2 border-emerald-500/30 pl-3 py-1">
                  {m.content.substring(0, 40)}...
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-3 mb-4">
            <img src={user.photoURL || ''} className="w-8 h-8 rounded-full border border-white/10" alt="" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">{user.displayName}</div>
              <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
            </div>
            <button onClick={logOut} className="text-slate-500 hover:text-red-400 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#020617]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono text-emerald-500 uppercase tracking-widest">System Online</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <h1 className="text-lg font-bold text-white">
              {activeTab === 'chat' ? 'Cognitive Simulation' : activeTab === 'memories' ? 'Memory Vault' : 'Parenting Analysis'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {audioUrl && (
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full">
                <button 
                  onClick={() => {
                    if (isPlaying) audioRef.current?.pause();
                    else audioRef.current?.play();
                    setIsPlaying(!isPlaying);
                  }}
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <div className="w-24 h-1 bg-emerald-500/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: isPlaying ? '100%' : '0%' }}
                    transition={{ duration: 5, ease: "linear" }}
                    className="h-full bg-emerald-500"
                  />
                </div>
                <span className="text-[10px] font-mono text-emerald-500">SULTAN_VOICE.EXE</span>
                <audio 
                  ref={audioRef} 
                  src={audioUrl} 
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' && (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto space-y-8 pb-32"
              >
                {interactions.length === 0 && (
                  <div className="text-center py-20 space-y-6">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                      <MessageSquare className="text-slate-600" size={32} />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-white">Start a Simulation</h2>
                      <p className="text-slate-500 max-w-sm mx-auto">Input a scenario or ask Sultan a question to see how he reacts and get parenting advice.</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {['سلطان، شو بدك تاكل؟', 'بابا بدو يطلع بالسيارة', 'الماما عم تنظف المطبخ'].map(s => (
                        <button 
                          key={s}
                          onClick={() => setPrompt(s)}
                          className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs hover:bg-white/10 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {interactions.map((interaction, i) => (
                  <div key={interaction.id} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* User Prompt */}
                    <div className="flex justify-end">
                      <div className="bg-emerald-500 text-black font-medium px-6 py-3 rounded-2xl rounded-tr-none max-w-[80%]">
                        {interaction.userPrompt}
                      </div>
                    </div>

                    {/* Sultan Response */}
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-indigo-500 rounded-xl flex-shrink-0 flex items-center justify-center">
                        <Baby size={20} className="text-white" />
                      </div>
                      <div className="bg-slate-900 border border-white/5 p-6 rounded-2xl rounded-tl-none flex-1">
                        <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3">Sultan Simulation</div>
                        <div className="text-lg text-white leading-relaxed rtl">
                          {interaction.sultanResponse}
                        </div>
                      </div>
                    </div>

                    {/* Copilot Analysis */}
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex-shrink-0 flex items-center justify-center">
                        <Brain size={20} className="text-emerald-500" />
                      </div>
                      <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-2xl rounded-tl-none flex-1">
                        <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-4">Nexus Copilot Analysis</div>
                        <div className="prose prose-invert prose-sm max-w-none rtl">
                          <ReactMarkdown>{interaction.copilotAnalysis}</ReactMarkdown>
                        </div>
                        <div className="mt-6 flex gap-2">
                          <button 
                            onClick={() => addMemory(`${interaction.userPrompt} → ${interaction.sultanResponse}`, 'behavior')}
                            className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors flex items-center gap-2"
                          >
                            <Plus size={12} /> Save to Memory Vault
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'memories' && (
              <motion.div 
                key="memories"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-5xl mx-auto"
              >
                <div className="flex justify-between items-end mb-12">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-white tracking-tight">Memory Vault</h2>
                    <p className="text-slate-500">Long-term behavioral tracking and developmental milestones.</p>
                  </div>
                  <button 
                    onClick={() => {
                      const content = prompt('Enter memory content:');
                      if (content) addMemory(content, 'milestone');
                    }}
                    className="bg-emerald-500 text-black font-bold px-6 py-3 rounded-xl hover:bg-emerald-400 transition-all flex items-center gap-2"
                  >
                    <Plus size={20} /> Add Memory
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {memories.map(m => (
                    <MemoryCard key={m.id} memory={m} />
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'analysis' && (
              <motion.div 
                key="analysis"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto space-y-12"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-white tracking-tight">Parenting Strategy</h2>
                  <p className="text-slate-500">Deep analysis of Sultan's current developmental stage.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 space-y-6">
                    <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center">
                      <Droplets className="text-indigo-400" size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white">Water Obsession Strategy</h3>
                    <p className="text-slate-400 leading-relaxed">Sultan uses water as a negotiation tool. Use this to teach "Cause and Effect" and "Responsibility" by giving him small tasks like watering plants or filling his own cup.</p>
                    <div className="pt-4 border-t border-white/5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Recommended Activity</div>
                      <div className="text-sm text-indigo-400 font-medium">"The Cup Manager" - 5 mins daily</div>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 space-y-6">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                      <Car className="text-emerald-400" size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white">"The Bye" Reward Loop</h3>
                    <p className="text-slate-400 leading-relaxed">The car ride is his highest reward. Link this to "Household Supervision" tasks. If he helps Mama organize the kitchen, he earns a 10-minute "Bye" with Baba.</p>
                    <div className="pt-4 border-t border-white/5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Recommended Activity</div>
                      <div className="text-sm text-emerald-400 font-medium">"Kitchen Assistant" → "Car Ride"</div>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <Brain className="text-emerald-500" size={32} />
                    <h3 className="text-2xl font-bold text-white">Cognitive Progress Report</h3>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Independence Level</span>
                        <span className="text-emerald-500 font-bold">95%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[95%]" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Negotiation Skills</span>
                        <span className="text-indigo-500 font-bold">88%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 w-[88%]" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Vocabulary (Arabic)</span>
                        <span className="text-amber-500 font-bold">72%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 w-[72%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        {activeTab === 'chat' && (
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[#020617] via-[#020617] to-transparent">
            <div className="max-w-4xl mx-auto relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
              <div className="relative bg-[#0a0f18] border border-white/10 rounded-3xl p-2 flex items-center gap-2 shadow-2xl">
                <div className="flex items-center gap-2 px-4">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isProcessing ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                  )} />
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    {isProcessing ? 'Processing...' : 'Ready'}
                  </span>
                </div>
                <input 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask Sultan or describe a scenario..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-slate-600 py-4 px-2"
                />
                <div className="flex items-center gap-2 pr-2">
                  <button className="p-3 text-slate-500 hover:text-white transition-colors">
                    <Mic size={20} />
                  </button>
                  <button 
                    onClick={handleSend}
                    disabled={isProcessing || !prompt.trim()}
                    className="p-3 bg-emerald-500 text-black rounded-2xl hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:hover:bg-emerald-500"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
