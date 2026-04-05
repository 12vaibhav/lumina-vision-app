
import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Upload,
  Download,
  Sun,
  Moon,
  Info,
  Menu,
  X,
  CheckCircle2,
  Play,
  ArrowUpRight,
  ExternalLink,
  Clock,
  MessageSquare,
  Zap,
  Shield,
  Globe,
  History,
  LogIn,
  User as UserIcon,
  LogOut,
  Mail,
  Lock,
  Github,
  Chrome,
  Trash2,
  Calendar,
  Layers,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InteriorStyle, RoomType, LightingMode, GenerationConfig, User, HistoryItem } from './types';
import { FEATURES, TESTIMONIALS, FAQS, HOW_IT_WORKS, PRICING_PLANS, BLOG_POSTS } from './constants';
import { BeforeAfterSlider } from './components/BeforeAfterSlider';
import { GenerationProgress } from './components/GenerationProgress';
import { generateInteriorPreview } from './services/geminiService';
import { supabase } from './services/supabaseClient';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [config, setConfig] = useState<GenerationConfig>({
    style: InteriorStyle.Modern,
    roomType: RoomType.LivingRoom,
    lighting: LightingMode.Day,
    image: null
  });

  const [loading, setLoading] = useState(false);
  const [loadingVariations, setLoadingVariations] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [variations, setVariations] = useState<string[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const toolRef = useRef<HTMLDivElement>(null);

  // Scroll Reveal Logic
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [loading, resultImage, showHistory]);

  // Auth state listener
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load history from Supabase on user changes
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        setHistory([]);
        return;
      }

      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        const mappedHistory: HistoryItem[] = data.map(item => ({
          id: item.id,
          originalImage: item.original_image_url,
          resultImage: item.result_image_url,
          config: {
            style: item.style as InteriorStyle,
            roomType: item.room_type as RoomType,
            lighting: item.lighting as LightingMode,
            image: item.original_image_url
          },
          timestamp: new Date(item.created_at).getTime()
        }));
        setHistory(mappedHistory);
      }
    };

    fetchHistory();
  }, [user]);

  // Removed localStorage sync effect as we save on generation now

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig(prev => ({ ...prev, image: reader.result as string }));
        setResultImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!config.image) {
      setError("Please upload an image first.");
      return;
    }
    setLoading(true);
    setError(null);
    setStatusMessage("Preparing your design...");
    try {
      const result = await generateInteriorPreview(config, undefined, 0, (msg) => {
        setStatusMessage(msg);
      });
      setStatusMessage(null);
      setResultImage(result.imageUrl);

      // Save to Supabase (if logged in and supabase is initialized)
      if (user && supabase) {
        const { data: insertedData, error: insertError } = await supabase
          .from('generations')
          .insert([
            {
              user_id: user.id,
              original_image_url: config.image!,
              result_image_url: result.imageUrl,
              style: config.style,
              room_type: config.roomType,
              lighting: config.lighting,
              prompt: "Generated via Gemini 2.5 Flash Image"
            }
          ])
          .select()
          .single();

        if (!insertError && insertedData) {
          const newHistoryItem: HistoryItem = {
            id: insertedData.id,
            originalImage: insertedData.original_image_url,
            resultImage: insertedData.result_image_url,
            config: {
              style: insertedData.style as InteriorStyle,
              roomType: insertedData.room_type as RoomType,
              lighting: insertedData.lighting as LightingMode,
              image: insertedData.original_image_url
            },
            timestamp: new Date(insertedData.created_at).getTime()
          };
          setHistory(prev => [newHistoryItem, ...prev]);
        } else if (insertError) {
          console.error("Supabase insert error:", insertError);
        }
      }

      setVariations([]); // Clear variations when single generation is done

      setTimeout(() => {
        window.scrollTo({ top: toolRef.current?.offsetTop || 0, behavior: 'smooth' });
      }, 500);
    } catch (err: any) {
      console.error("Generation Error:", err);
      const errorMsg = err?.message || "Unknown error";
      setError(errorMsg);
      setStatusMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVariations = async () => {
    if (!config.image) {
      setError("Please upload an image first.");
      return;
    }

    setLoadingVariations(true);
    setError(null);
    setStatusMessage("Generating variation 1 of 3...");
    setVariations([]); // Clear previous variations
    setResultImage(null); // Clear single result

    const results: any[] = [];

    try {
      // Sequential calls with incremental state updates
      for (let i = 0; i < 3; i++) {
        try {
          setStatusMessage(`Generating variation ${i + 1} of 3...`);
          const result = await generateInteriorPreview(config, i, 0, (msg) => {
            setStatusMessage(`Variation ${i + 1}/3: ${msg}`);
          });
          results.push(result);

          // Update variations state as they come in
          setVariations(prev => [...prev, result.imageUrl]);

          // Add to history individually
          const newHistoryItem: HistoryItem = {
            id: Math.random().toString(36).substr(2, 9),
            originalImage: config.image!,
            resultImage: result.imageUrl,
            config: { ...config },
            timestamp: Date.now()
          };
          setHistory(prev => [newHistoryItem, ...prev]);

          // Increased delay between requests to avoid rate limiting
          if (i < 2) {
            setStatusMessage(`Variation ${i + 1} complete! Waiting before next request...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        } catch (singleErr: any) {
          console.error(`Variation ${i + 1} failed:`, singleErr);
          const isRateLimit = singleErr?.message?.includes('rate limit') || singleErr?.message?.includes('quota');
          if (isRateLimit) {
            setError("AI rate limit reached. We've generated partial results for you.");
          }
          // Continue to next variation if one fails
        }
      }

      setStatusMessage(null);

      if (results.length === 0) {
        throw new Error("All variations failed. Please wait a minute and try again.");
      }

      setTimeout(() => {
        window.scrollTo({ top: toolRef.current?.offsetTop || 0, behavior: 'smooth' });
      }, 500);
    } catch (err: any) {
      console.error("Variations Error:", err);
      setError(err?.message || "Variations generation failed. Please try again in a moment.");
      setStatusMessage(null);
    } finally {
      setLoadingVariations(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!supabase) throw new Error("Database service is currently unavailable. Please check environment variables.");

      if (authMode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
      } else {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: email.split('@')[0],
            }
          }
        });
        if (authError) throw authError;
        alert('Verification email sent! Please check your inbox.');
      }
      setIsAuthModalOpen(false);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const scrollToTool = () => {
    toolRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Animated Aurora Background */}
      <div className="aurora-bg">
        <div className="aurora-container">
          <div className="aurora-item aurora-1"></div>
          <div className="aurora-item aurora-2"></div>
          <div className="aurora-item aurora-3"></div>
          <div className="aurora-item aurora-4"></div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 overflow-hidden">
              <img src="/favicon.png" alt="Lumina Vision Logo" className="w-10 h-10 object-contain brightness-110" />
            </div>
            <span className="text-xl md:text-2xl font-bold tracking-tight text-white font-['Outfit']">Lumina <span className="text-indigo-400">Vision</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Home', 'Features', 'How it works', 'Reviews'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s/g, '-')}`} className="text-sm font-medium text-gray-400 hover:text-white transition-all hover:scale-105">{item}</a>
            ))}
            {user && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`text-sm font-medium transition-all hover:scale-105 flex items-center gap-2 ${showHistory ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
              >
                <History className="w-4 h-4" /> History
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 px-4 py-2 rounded-full glass border-white/10">
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-indigo-500/30" />
                  <span className="text-sm font-bold text-white hidden lg:block">{user.name}</span>
                  <button onClick={handleLogout} className="text-gray-400 hover:text-white transition-colors ml-2">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="px-6 py-2.5 bg-white text-gray-900 rounded-full text-sm font-bold hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all active:scale-95 flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" /> <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
            <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-3xl md:hidden pt-24 px-6">
          <div className="flex flex-col gap-8">
            {['Home', 'Features', 'How it works', 'Reviews', 'FAQs'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s/g, '-')}`} className="text-3xl font-bold text-white" onClick={() => setIsMenuOpen(false)}>{item}</a>
            ))}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 md:pt-48 md:pb-32 px-6">
        <div className="max-w-6xl mx-auto text-center space-y-10 reveal active">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-white/10 text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            The Future of Real Estate Design
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-9xl font-bold tracking-tight text-white leading-[1.1] md:leading-[1] font-['Outfit']">
            Design <span className="text-gradient italic">Without</span> <br className="hidden md:block" /> Boundaries
          </h1>

          <p className="max-w-3xl mx-auto text-lg md:text-2xl text-gray-400 leading-relaxed font-light px-4 md:px-0">
            Instantly stage empty properties with AI. Transform old rooms into modern masterpieces with 4K photorealistic rendering.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-6">
            <button
              onClick={scrollToTool}
              className="w-full sm:w-auto px-8 py-4 md:px-10 md:py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] text-lg md:text-xl font-bold transition-all shadow-[0_20px_40px_rgba(79,70,229,0.3)] flex items-center justify-center gap-3 group"
            >
              Reimagine Space
              <ArrowUpRight className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 md:px-10 md:py-5 glass text-white rounded-[2rem] text-lg md:text-xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-3">
              <Play className="w-5 h-5 fill-current" /> Watch Showreel
            </button>
          </div>

          {/* AI Message Box - Inspiration from Hero Section */}
          <div className="max-w-xl mx-auto mt-20 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative glass-card rounded-[2rem] p-8 border border-white/10 flex items-start gap-6 text-left">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <MessageSquare className="text-white w-6 h-6" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Lumina AI Assistant</span>
                  <span className="text-[10px] text-gray-500 font-mono">Active Now</span>
                </div>
                <p className="text-white text-lg font-medium leading-relaxed">
                  "Ask Lumina AI to create with you! The more details you share, the better it will deliver. Or, pick a pre-made prompt below."
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-2 py-1 md:px-3 md:py-1 rounded-full bg-white/5 border border-white/10 text-[9px] md:text-[10px] text-gray-400 font-bold hover:bg-white/10 cursor-pointer transition-colors">Modern Penthouse</span>
                  <span className="px-2 py-1 md:px-3 md:py-1 rounded-full bg-white/5 border border-white/10 text-[9px] md:text-[10px] text-gray-400 font-bold hover:bg-white/10 cursor-pointer transition-colors">Rustic Cabin</span>
                  <span className="px-2 py-1 md:px-3 md:py-1 rounded-full bg-white/5 border border-white/10 text-[9px] md:text-[10px] text-gray-400 font-bold hover:bg-white/10 cursor-pointer transition-colors">Industrial Loft</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Marquee */}
      <section className="py-10 md:py-20 border-y border-white/5 bg-slate-950/50 overflow-hidden">
        <div className="marquee-wrapper">
          <div className="marquee-content">
            {['Architectural Digest', 'Vogue Living', 'Dwell', 'Dezeen', 'Elle Decor', 'Design Milk', 'Wallpaper*', 'Hypebeast Home'].map((partner, i) => (
              <div key={i} className="flex items-center gap-4 px-8">
                <img src="/favicon.png" alt="Logo" className="w-5 h-5 object-contain grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all" />
                <span className="text-lg md:text-2xl font-bold text-white/30 hover:text-indigo-400 transition-colors cursor-default font-['Outfit'] uppercase tracking-widest whitespace-nowrap">
                  {partner}
                </span>
              </div>
            ))}
          </div>
          {/* Duplicate for seamless loop */}
          <div className="marquee-content" aria-hidden="true">
            {['Architectural Digest', 'Vogue Living', 'Dwell', 'Dezeen', 'Elle Decor', 'Design Milk', 'Wallpaper*', 'Hypebeast Home'].map((partner, i) => (
              <div key={i} className="flex items-center gap-4 px-8">
                <img src="/favicon.png" alt="Logo" className="w-5 h-5 object-contain grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all" />
                <span className="text-lg md:text-2xl font-bold text-white/30 hover:text-indigo-400 transition-colors cursor-default font-['Outfit'] uppercase tracking-widest whitespace-nowrap">
                  {partner}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* History Section */}
      {/* History Section - Inspiration from "How it works" or "Blog" */}
      {showHistory && user && (
        <section id="history" className="py-20 md:py-32 px-6 bg-indigo-600/5 reveal">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="flex items-center justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                  Your Creations
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-white font-['Outfit']">Design History</h2>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="p-4 rounded-full glass border-white/10 text-gray-400 hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-20 glass-card rounded-[3rem] border border-white/5 space-y-6">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  <History className="w-10 h-10 text-gray-600" />
                </div>
                <p className="text-gray-400 text-xl font-light">No generations yet. Start reimagining your space!</p>
                <button onClick={scrollToTool} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 transition-all">
                  Create First Design
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {history.map((item) => (
                  <div key={item.id} className="group glass-card rounded-[2.5rem] overflow-hidden border border-white/5 flex flex-col">
                    <div className="relative aspect-video overflow-hidden">
                      <img src={item.resultImage} alt="Result" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button
                          onClick={() => {
                            setConfig(item.config);
                            setResultImage(item.resultImage);
                            scrollToTool();
                          }}
                          className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform"
                        >
                          <Play className="w-5 h-5 fill-current" />
                        </button>
                        <button
                          onClick={() => deleteHistoryItem(item.id)}
                          className="p-3 bg-red-500 text-white rounded-full hover:scale-110 transition-transform"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="p-8 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{item.config.style}</span>
                        <span className="text-[10px] text-gray-500 flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3" /> {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white font-['Outfit']">{item.config.roomType}</h3>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[8px] text-gray-400 font-bold uppercase tracking-widest">{item.config.lighting}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Main Tool Section */}
      <section id="showcase" ref={toolRef} className="py-10 md:py-24 px-6 relative reveal">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-start">

            {/* Control Panel - Redesigned to match Main Tool Section in image */}
            <div className="lg:col-span-5 space-y-8 sticky top-28">
              <div className="glass-card rounded-[2rem] md:rounded-[3rem] p-5 md:p-10 space-y-6 md:space-y-10 border border-white/10 shadow-2xl">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em]">AI Design Lab v4.0</span>
                  </div>
                  <h2 className="text-2xl md:text-4xl font-bold text-white font-['Outfit']">Reimagine Space</h2>
                  <p className="text-gray-400 font-light text-sm md:text-lg">Describe your vision or use our precision controls.</p>
                </div>

                {/* Selections - Dropdown style from image */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 min-w-0">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Room Type</label>
                    <div className="relative group w-full">
                      <select
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl md:rounded-2xl pl-4 pr-10 py-3 md:pl-5 md:pr-12 md:py-4 text-sm truncate focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none text-white font-medium cursor-pointer transition-all group-hover:bg-white/[0.06]"
                        value={config.roomType}
                        onChange={(e) => setConfig(prev => ({ ...prev, roomType: e.target.value as RoomType }))}
                      >
                        {Object.values(RoomType).map(type => <option key={type} value={type} className="bg-slate-900 truncate">{type}</option>)}
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 rotate-90 pointer-events-none group-hover:text-white transition-colors" />
                    </div>
                  </div>
                  <div className="space-y-2 min-w-0">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Interior Style</label>
                    <div className="relative group w-full">
                      <select
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl md:rounded-2xl pl-4 pr-10 py-3 md:pl-5 md:pr-12 md:py-4 text-sm truncate focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none text-white font-medium cursor-pointer transition-all group-hover:bg-white/[0.06]"
                        value={config.style}
                        onChange={(e) => setConfig(prev => ({ ...prev, style: e.target.value as InteriorStyle }))}
                      >
                        {Object.values(InteriorStyle).map(style => <option key={style} value={style} className="bg-slate-900 truncate">{style}</option>)}
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 rotate-90 pointer-events-none group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>

                {/* Prompt Input - Styled like the text area in image */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Design Prompt (Optional)</label>
                  <div className="relative">
                    <textarea
                      placeholder="Describe specific details like 'velvet textures', 'oak flooring', or 'minimalist art'..."
                      className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] md:rounded-[2rem] px-5 py-4 md:px-6 md:py-5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white font-light min-h-[80px] md:min-h-[120px] resize-none placeholder:text-gray-600"
                    />
                    <div className="absolute bottom-4 right-4 flex gap-2">
                      <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Upload Area */}
                <div className="space-y-4">
                  <label className="relative group block">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <div className="w-full h-40 md:h-48 border-2 border-dashed border-white/10 rounded-[2rem] md:rounded-[2.5rem] flex flex-col items-center justify-center gap-4 group-hover:border-indigo-500/50 transition-all bg-white/[0.02] overflow-hidden group-hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                      {config.image ? (
                        <div className="relative w-full h-full group">
                          <img src={config.image} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          {(loading || loadingVariations) && (
                            <motion.div
                              className="absolute inset-0 bg-indigo-500/20 z-10"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <motion.div
                                className="absolute top-0 left-0 right-0 h-1 bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.8)]"
                                animate={{ top: ["0%", "100%", "0%"] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                              />
                            </motion.div>
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Upload className="w-10 h-10 text-white" />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-all duration-500 border border-indigo-500/20">
                            <Upload className="w-6 h-6" />
                          </div>
                          <div className="text-center">
                            <span className="text-white text-sm font-bold block">Upload Base Photo</span>
                            <span className="text-gray-500 text-[10px] uppercase tracking-widest">Empty or outdated room</span>
                          </div>
                        </>
                      )}
                    </div>
                  </label>
                </div>

                {/* Lighting Selection */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, lighting: LightingMode.Day }))}
                      className={`flex items-center justify-center gap-2 py-3 md:py-4 rounded-xl md:rounded-2xl border transition-all duration-300 text-sm md:text-base ${config.lighting === LightingMode.Day ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_10px_20px_rgba(79,70,229,0.3)]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                    >
                      <Sun className="w-5 h-5" /> Daylight
                    </button>
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, lighting: LightingMode.Night }))}
                      className={`flex items-center justify-center gap-2 py-3 md:py-4 rounded-xl md:rounded-2xl border transition-all duration-300 text-sm md:text-base ${config.lighting === LightingMode.Night ? 'bg-purple-600 border-purple-500 text-white shadow-[0_10px_20px_rgba(147,51,234,0.3)]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                    >
                      <Moon className="w-5 h-5" /> Warm Night
                    </button>
                  </div>
                </div>

                {error && (
                  <div className={`p-4 rounded-2xl text-sm font-medium flex items-center gap-3 ${error.includes('rate limit') || error.includes('quota') || error.includes('wait')
                    ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}>
                    <Info className="w-5 h-5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {statusMessage && (loading || loadingVariations) && (
                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium flex items-center gap-3 animate-pulse">
                    <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" />
                    {statusMessage}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    onClick={handleGenerate}
                    disabled={loading || loadingVariations || !config.image}
                    className={`flex-1 py-3.5 md:py-6 rounded-2xl text-base md:text-xl font-bold transition-all flex items-center justify-center gap-3 relative overflow-hidden group ${loading || loadingVariations || !config.image ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-95'}`}
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                        Rendering...
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        />
                      </div>
                    ) : (
                      <>
                        <Sparkles className={`w-6 h-6 ${!config.image ? 'text-gray-600' : 'text-indigo-600 animate-pulse'}`} />
                        Generate
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleGenerateVariations}
                    disabled={loading || loadingVariations || !config.image}
                    className={`flex-1 py-3.5 md:py-6 rounded-2xl text-base md:text-xl font-bold transition-all flex items-center justify-center gap-3 relative overflow-hidden group ${loading || loadingVariations || !config.image ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:shadow-[0_0_40px_rgba(79,70,229,0.3)] active:scale-95'}`}
                  >
                    {loadingVariations ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                        3 Visions...
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        />
                      </div>
                    ) : (
                      <>
                        <Layers className={`w-6 h-6 ${!config.image ? 'text-gray-400' : 'text-white animate-pulse'}`} />
                        3 Options
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Output */}
            <div className="lg:col-span-7 space-y-10">
              <div className="glass rounded-[2.5rem] md:rounded-[4rem] p-4 md:p-8 lg:p-12 border border-white/10 aspect-[4/5] sm:aspect-auto sm:min-h-[600px] flex flex-col items-center justify-center relative overflow-hidden text-center">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] pointer-events-none"></div>

                {loading || loadingVariations ? (
                  <div className="w-full space-y-12">
                    <GenerationProgress
                      isLoading={loading || loadingVariations}
                      isVariations={loadingVariations}
                      style={config.style}
                    />
                    {variations.length > 0 && (
                      <div className="space-y-8 animate-in fade-in duration-700">
                        <div className="h-px bg-white/10 w-full" />
                        <h4 className="text-center text-indigo-400 font-bold uppercase tracking-widest text-xs">Partial Results ({variations.length}/3)</h4>
                        <div className="grid grid-cols-1 gap-8 opacity-50">
                          {variations.map((v, i) => (
                            <BeforeAfterSlider key={i} before={config.image!} after={v} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (resultImage || variations.length > 0) && config.image ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full space-y-10"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4 bg-emerald-500/10 px-6 py-3 rounded-2xl border border-emerald-500/20">
                        <CheckCircle2 className="text-emerald-400 w-6 h-6" />
                        <span className="text-emerald-400 font-bold">
                          {variations.length > 0 ? `${variations.length} Variations Ready` : '4K Masterpiece Generated'}
                        </span>
                      </div>
                      {resultImage && (
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = resultImage;
                            link.download = `lumina-vision-${config.style.toLowerCase()}.png`;
                            link.click();
                          }}
                          className="flex items-center gap-3 px-8 py-4 bg-white hover:bg-gray-100 text-gray-900 rounded-[1.5rem] text-sm font-bold transition-all shadow-xl"
                        >
                          <Download className="w-5 h-5" /> Download Asset
                        </button>
                      )}
                    </div>

                    {resultImage ? (
                      <BeforeAfterSlider before={config.image} after={resultImage} />
                    ) : (
                      <div className="grid grid-cols-1 gap-8">
                        {variations.map((v, i) => (
                          <div key={i} className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Option 0{i + 1}</span>
                              <button
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = v;
                                  link.download = `lumina-variation-${i + 1}.png`;
                                  link.click();
                                }}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                            <BeforeAfterSlider before={config.image!} after={v} />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                      {[
                        { label: 'Theme', value: config.style },
                        { label: 'Category', value: config.roomType },
                        { label: 'Luminance', value: config.lighting }
                      ].map((stat, i) => (
                        <div key={i} className="glass-card p-5 md:p-8 rounded-[2rem] border border-white/5 group text-left">
                          <span className="text-[10px] uppercase tracking-[0.3em] text-indigo-400 font-black mb-1 block">Property {stat.label}</span>
                          <p className="text-white text-lg md:text-xl font-bold font-['Outfit'] group-hover:text-indigo-300 transition-colors uppercase tracking-tight">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : error ? (
                  <div className="text-center space-y-8 py-20 animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                      <Info className="w-10 h-10 text-red-500" />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-3xl font-bold text-white font-['Outfit']">Generation Failed</h3>
                      <p className="text-gray-400 max-w-sm mx-auto text-lg font-light leading-relaxed">
                        {error}
                      </p>
                      <button
                        onClick={loadingVariations ? handleGenerateVariations : handleGenerate}
                        className="px-8 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-10 py-20">
                    <div className="w-32 h-32 bg-white/[0.03] rounded-[2.5rem] flex items-center justify-center mx-auto border border-white/10 shadow-inner group">
                      <Sparkles className="w-12 h-12 text-gray-600 group-hover:text-indigo-400 transition-colors duration-500" />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-2xl md:text-4xl font-bold text-white font-['Outfit'] px-2">Awaiting Your Input</h3>
                      <p className="text-gray-400 max-w-sm mx-auto text-base md:text-lg font-light px-4">Complete the configuration on the left to witness an AI-driven transformation of your room.</p>
                    </div>
                    <div className="flex gap-4 justify-center">
                      <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500/50 w-1/3 animate-[loading_2s_infinite]"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white/[0.03] p-5 md:p-10 rounded-[2rem] border border-white/5 flex flex-col sm:flex-row items-start gap-4 md:gap-6">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 flex-shrink-0 border border-indigo-500/20">
                  <Info className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg md:text-xl font-bold text-white tracking-tight">Maximizing Accuracy</h4>
                  <p className="text-gray-400 leading-relaxed font-light text-sm md:text-base">
                    AI models perform best on high-resolution images with clear depth. For optimal mapping, take the photo from the corner of the room looking diagonally across.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 md:py-32 px-6 relative reveal">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
              The Process
            </div>
            <h2 className="text-4xl md:text-7xl font-bold text-white font-['Outfit'] leading-tight">Simple. Seamless. <br /> <span className="text-gradient italic">Fast.</span></h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-xl font-light leading-relaxed">The standard workflow for architectural-grade staging.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((item, idx) => (
              <div key={idx} className="glass-card p-8 md:p-10 space-y-8 relative group border-white/5 hover:border-indigo-500/30 rounded-[2.5rem] md:rounded-[3rem]">
                <div className="absolute top-2 right-6 text-6xl md:text-7xl font-bold text-white/[0.02] select-none group-hover:text-white/[0.05] transition-colors z-0 font-['Outfit']">
                  {item.step}
                </div>
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center shadow-inner border border-white/5 group-hover:scale-110 group-hover:bg-indigo-600 transition-all duration-500 relative z-10">
                  {React.cloneElement(item.icon as React.ReactElement<any>, { className: "w-7 h-7 text-indigo-400 group-hover:text-white transition-colors" })}
                </div>
                <div className="space-y-4 relative z-10">
                  <h3 className="text-2xl font-bold text-white font-['Outfit']">{item.title}</h3>
                  <p className="text-gray-400 leading-relaxed font-light text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Bento Grid Style */}
      <section id="features" className="py-20 md:py-32 px-6 reveal">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold uppercase tracking-widest text-purple-400">
                Capabilities
              </div>
              <h2 className="text-4xl md:text-7xl font-bold text-white tracking-tight leading-tight font-['Outfit']">Premium <br /> Intelligence</h2>
              <p className="text-gray-400 max-w-md text-xl font-light">Engineered for real estate agents, architects, and luxury property owners.</p>
            </div>
            <button className="px-8 py-4 glass text-white rounded-2xl font-bold hover:bg-white/5 transition-all flex items-center gap-3 group">
              Full Feature List <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((feature, idx) => (
              <div key={idx} className={`group p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] glass-card border border-white/5 flex flex-col justify-between ${idx === 0 || idx === 5 ? 'md:col-span-2' : ''}`}>
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center group-hover:bg-indigo-600 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                      {React.cloneElement(feature.icon as React.ReactElement<any>, { className: 'w-6 h-6 text-indigo-400 group-hover:text-white transition-colors' })}
                    </div>
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{(feature as any).tag}</span>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-white font-['Outfit']">{feature.title}</h3>
                    <p className="text-gray-400 leading-relaxed font-light">{feature.description}</p>
                  </div>
                </div>
                <div className="pt-8 flex items-center gap-2 text-xs font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn More <ArrowUpRight className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 px-6 reveal">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold uppercase tracking-widest text-purple-400">
              Pricing Plans
            </div>
            <h2 className="text-4xl md:text-7xl font-bold text-white font-['Outfit']">Simple, scalable pricing</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-xl font-light">Choose the plan that fits your architectural vision.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {PRICING_PLANS.map((plan, idx) => (
              <div key={idx} className={`relative p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] glass-card border flex flex-col ${plan.highlight ? 'border-indigo-500/50 bg-indigo-500/[0.03] sm:scale-105 z-10' : 'border-white/5'}`}>
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full uppercase tracking-widest shadow-lg">
                    Most Popular
                  </div>
                )}
                <div className="space-y-6 mb-10">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white font-['Outfit']">{plan.name}</h3>
                    <p className="text-gray-500 text-sm font-light">{plan.description}</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white font-['Outfit']">{plan.price}</span>
                    {plan.price !== 'Custom' && <span className="text-gray-500 text-sm font-medium">/ month</span>}
                  </div>
                </div>
                <div className="space-y-4 flex-grow mb-10">
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-3 text-sm text-gray-400">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
                <button className={`w-full py-4 rounded-2xl font-bold transition-all ${plan.highlight ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-500/20' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}>
                  {plan.buttonText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="reviews" className="py-32 px-6 reveal">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-24 relative overflow-hidden border border-white/5">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[150px] -z-10"></div>
            <div className="grid lg:grid-cols-2 gap-24 items-center">
              <div className="space-y-12">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                    Testimonials
                  </div>
                  <h2 className="text-4xl md:text-7xl font-bold text-white leading-tight font-['Outfit']">Trusted by <br /> <span className="text-gradient">Industry Icons</span></h2>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Sparkles key={i} className="w-6 h-6 text-indigo-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-xl md:text-3xl text-gray-300 font-light italic leading-relaxed">
                  "Lumina Vision has effectively cut our property staging costs by 95% while increasing buyer engagement by 300%. It is the gold standard of AI design."
                </blockquote>
                <div className="flex items-center gap-6">
                  <div className="p-1 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-xl">
                    <img src="https://picsum.photos/seed/ceo/100/100" alt="Avatar" className="w-20 h-20 rounded-full border-4 border-slate-900" />
                  </div>
                  <div>
                    <p className="text-white text-2xl font-bold font-['Outfit']">Jonathan Vance</p>
                    <p className="text-indigo-400 font-bold tracking-widest text-[10px] uppercase">Founder, Prime Estates Group</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-8">
                {TESTIMONIALS.map((t, i) => (
                  <div key={i} className="p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] glass border border-white/5 space-y-6 md:space-y-8 hover:bg-white/[0.02] transition-all group">
                    <p className="text-gray-400 font-light text-lg italic leading-relaxed">"{t.content}"</p>
                    <div className="flex items-center gap-5">
                      <img src={t.avatar} alt={t.name} className="w-14 h-14 rounded-2xl border border-white/10 object-cover" />
                      <div>
                        <p className="text-white font-bold font-['Outfit']">{t.name}</p>
                        <p className="text-gray-500 text-[10px] font-bold tracking-widest uppercase">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faqs" className="py-20 md:py-32 px-6 reveal">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-start">
            <div className="space-y-12 sticky top-32">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                  Intel
                </div>
                <h2 className="text-4xl md:text-7xl font-bold text-white leading-tight font-['Outfit']">Frequently Asked Questions</h2>
                <p className="text-gray-400 text-xl font-light leading-relaxed">Deep dive into the Lumina Vision intelligence. Can't find what you're looking for?</p>
              </div>

              <div className="relative group overflow-hidden rounded-[3rem] aspect-square lg:aspect-video shadow-2xl border border-white/5">
                <img
                  src="https://picsum.photos/seed/support/800/600"
                  alt="Support Team"
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-60"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex flex-col justify-end p-10">
                  <div className="glass backdrop-blur-2xl p-8 rounded-[2rem] border border-white/10 space-y-6">
                    <div className="space-y-2">
                      <p className="text-white font-bold text-xl font-['Outfit']">Need direct assistance?</p>
                      <p className="text-gray-400 text-sm font-light">Our concierge team usually replies within 5 minutes.</p>
                    </div>
                    <button className="w-full py-4 bg-white text-slate-950 hover:bg-indigo-50 rounded-2xl font-bold transition-all shadow-xl">
                      Contact Concierge
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {FAQS.map((faq, idx) => (
                <div
                  key={idx}
                  className={`glass-card border transition-all duration-500 overflow-hidden rounded-[1.5rem] md:rounded-[2rem] ${activeFaq === idx ? 'border-indigo-500/30' : 'border-white/5'}`}
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full px-10 py-8 flex items-center justify-between text-left group"
                  >
                    <span className={`text-lg md:text-xl font-bold font-['Outfit'] transition-colors duration-300 ${activeFaq === idx ? 'text-indigo-400' : 'text-white group-hover:text-indigo-400'}`}>{faq.question}</span>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${activeFaq === idx ? 'bg-indigo-600 text-white rotate-45' : 'bg-white/5 text-gray-500'}`}>
                      <Plus className="w-5 h-5" />
                    </div>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${activeFaq === idx ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <div className="px-10 pb-10 text-gray-400 text-lg font-light leading-relaxed border-t border-white/5 pt-6">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Related Articles Section */}
      <section id="blog" className="py-20 md:py-32 px-6 reveal">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                Insights
              </div>
              <h2 className="text-4xl md:text-7xl font-bold text-white leading-tight font-['Outfit']">Journal & <br /> Intelligence.</h2>
            </div>
            <button className="px-8 py-4 glass text-white rounded-2xl font-bold hover:bg-white/5 transition-all flex items-center gap-3 w-fit group">
              View all blogs <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {BLOG_POSTS.map((post, idx) => (
              <div key={idx} className="group cursor-pointer space-y-8">
                <div className="relative aspect-video rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-6 left-6 px-4 py-2 rounded-full glass backdrop-blur-2xl text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">
                    {post.category}
                  </div>
                </div>
                <div className="space-y-4 px-4">
                  <div className="flex items-center gap-4 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {post.readTime}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20"></span>
                    <span className="text-gray-500">{post.date}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors leading-tight font-['Outfit']">
                    {post.title}
                  </h3>
                  <p className="text-gray-400 font-light line-clamp-2 text-base leading-relaxed">
                    Explore the intersection of artificial intelligence and high-end architectural design in our latest deep dive.
                  </p>
                  <div className="pt-4 flex items-center gap-3 text-xs font-bold text-white group-hover:gap-5 transition-all">
                    Read Intelligence <ArrowRight className="w-4 h-4 text-indigo-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-20 md:pt-32 pb-16 px-6 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <div className="max-w-7xl mx-auto space-y-32">
          <div className="grid md:grid-cols-12 gap-20">
            <div className="md:col-span-12 lg:col-span-5 space-y-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 flex items-center justify-center overflow-hidden">
                  <img src="/favicon.png" alt="Lumina Vision Logo" className="w-12 h-12 object-contain brightness-110" />
                </div>
                <span className="text-3xl font-bold text-white tracking-tight font-['Outfit']">Lumina <span className="text-indigo-400">Vision</span></span>
              </div>
              <p className="text-gray-400 text-xl leading-relaxed font-light max-w-md">
                Setting the global standard for AI-driven real estate visualization and architectural storytelling.
              </p>
              <div className="flex gap-5">
                {[
                  { icon: <Globe className="w-6 h-6" />, label: 'Web' },
                  { icon: <Zap className="w-6 h-6" />, label: 'X' },
                  { icon: <Shield className="w-6 h-6" />, label: 'Security' }
                ].map((social, idx) => (
                  <a key={idx} href="#" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-600 transition-all group">
                    {React.cloneElement(social.icon, { className: 'w-5 h-5 group-hover:scale-110 transition-transform' })}
                  </a>
                ))}
              </div>
            </div>

            <div className="md:col-span-4 lg:col-span-2 space-y-8">
              <h4 className="text-white text-lg font-bold font-['Outfit']">Ecosystem</h4>
              <ul className="space-y-4">
                {['Showcase', 'Features', 'The Process', 'Pricing'].map(link => (
                  <li key={link}><a href={`#${link.toLowerCase().replace(/\s/g, '-')}`} className="text-gray-500 hover:text-indigo-400 transition-colors text-sm uppercase tracking-widest font-bold">{link}</a></li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-4 lg:col-span-2 space-y-8">
              <h4 className="text-white text-lg font-bold font-['Outfit']">Support</h4>
              <ul className="space-y-4">
                {['Documentation', 'API Reference', 'Status', 'Concierge'].map(link => (
                  <li key={link}><a href="#" className="text-gray-500 hover:text-indigo-400 transition-colors text-sm uppercase tracking-widest font-bold">{link}</a></li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-4 lg:col-span-3 space-y-10">
              <div className="glass p-8 rounded-[2rem] border border-white/10 space-y-6">
                <p className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Newsletter</p>
                <div className="space-y-4">
                  <input
                    type="email"
                    placeholder="concierge@lumina.ai"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                  <button className="w-full py-4 bg-white text-black rounded-xl font-bold hover:shadow-2xl transition-all">Subscribe</button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-gray-600 text-sm font-medium">© 2024 Lumina Vision AI. All architectural rights reserved.</p>
            <div className="flex gap-10 text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-white">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl"
              onClick={() => setIsAuthModalOpen(false)}
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl glass-card rounded-[2.5rem] md:rounded-[4rem] overflow-hidden border border-white/10 shadow-2xl"
            >
              <div className="grid md:grid-cols-2">
                {/* Left Side - Visual */}
                <div className="hidden md:block relative overflow-hidden">
                  <img src="https://picsum.photos/seed/auth/800/1200" alt="Auth" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-950 via-indigo-950/40 to-transparent flex flex-col justify-end p-12 space-y-6">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden border border-white/20">
                      <img src="/favicon.png" alt="Lumina Vision Logo" className="w-10 h-10 object-contain brightness-125 saturate-150 shadow-xl" />
                    </div>
                    <h3 className="text-4xl font-bold text-white font-['Outfit'] leading-tight">Join the future of <br /> interior design.</h3>
                    <p className="text-indigo-200 font-light font-['Outfit']">Save your generations, access premium styles, and export in 4K.</p>
                  </div>
                </div>

                {/* Right Side - Form */}
                <div className="p-8 md:p-16 space-y-10">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <h2 className="text-2xl md:text-3xl font-bold text-white font-['Outfit']">
                        {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                      </h2>
                      <p className="text-gray-500 font-light">
                        {authMode === 'login' ? 'Enter your details to continue' : 'Start your design journey today'}
                      </p>
                    </div>
                    <button onClick={() => setIsAuthModalOpen(false)} className="w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-all">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleAuth} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                        <div className="relative group">
                          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
                          <input
                            type="email"
                            required
                            placeholder="concierge@lumina.ai"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Password</label>
                        <div className="relative group">
                          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
                          <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <button type="submit" className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-lg font-bold transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 active:scale-[0.98]">
                      {authMode === 'login' ? 'Sign In' : 'Create Account'}
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </form>

                  <div className="space-y-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                      <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-slate-900 px-4 text-gray-600 font-bold">Or continue with</span></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        className="flex items-center justify-center gap-3 py-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white font-bold transition-all"
                      >
                        <Chrome className="w-5 h-5" /> Google
                      </button>
                      <button
                        type="button"
                        className="flex items-center justify-center gap-3 py-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white font-bold transition-all"
                      >
                        <Github className="w-5 h-5" /> GitHub
                      </button>
                    </div>
                  </div>

                  <p className="text-center text-gray-500 text-sm font-light">
                    {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
                    <button
                      type="button"
                      onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                      className="text-indigo-400 font-bold ml-2 hover:underline"
                    >
                      {authMode === 'login' ? 'Sign Up' : 'Sign In'}
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
