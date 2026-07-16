import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skull, Clock, AlertCircle, ArrowLeft, Eye, X, Flame, Pin, Heart, Smile } from "lucide-react";
import { MotivationStore, BitterMemory } from "@/lib/store";
import { getGregorianToday, dayDiff, toPersianDigits } from "@/lib/shamsi";

interface Props {
  onClose: () => void;
}

export default function IntroStressOverlay({ onClose }: Props) {
  const [step, setStep] = useState(1);
  const [nextEnabled, setNextEnabled] = useState(false);
  const [showDaralPopup, setShowDaralPopup] = useState(false);
  const [daralCloseEnabled, setDaralCloseEnabled] = useState(false);

  // Load dates and memories
  const [konkurDate, setKonkurDate] = useState("");
  const [finalExamsDate, setFinalExamsDate] = useState("");
  const [memories, setMemories] = useState<BitterMemory[]>([]);

  const today = getGregorianToday();

  useEffect(() => {
    setKonkurDate(MotivationStore.getKonkurDate());
    setFinalExamsDate(MotivationStore.getFinalExamsDate());
    setMemories(MotivationStore.getMemories());
  }, []);

  const konkurRemaining = dayDiff(today, konkurDate);
  const finalRemaining = dayDiff(today, finalExamsDate);

  // Ticking Clock Sound synthesis using Web Audio API
  useEffect(() => {
    if (step !== 2) return;

    let isTick = true;
    let audioCtx: AudioContext | null = null;

    const playTickingSound = () => {
      try {
        if (!audioCtx) {
          audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = "sine";
        // Alternating frequencies for tick and tock
        const freq = isTick ? 850 : 550;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        
        // Short, sharp click
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
        
        isTick = !isTick;
      } catch (err) {
        console.log("Audio Context play blocked or failed", err);
      }
    };

    // Play once immediately
    playTickingSound();

    const interval = setInterval(playTickingSound, 1000);
    return () => {
      clearInterval(interval);
      if (audioCtx) {
        audioCtx.close();
      }
    };
  }, [step]);

  // Handle Delays for Next Buttons on each step
  useEffect(() => {
    setNextEnabled(false);
    let timer: any;
    if (step === 1) {
      timer = setTimeout(() => setNextEnabled(true), 1000); // Step 1: 1 second
    } else if (step === 2) {
      timer = setTimeout(() => setNextEnabled(true), 2000); // Step 2: 2 seconds
    } else if (step === 3) {
      timer = setTimeout(() => setNextEnabled(true), 1000); // Step 3: 1 second
    } else if (step === 4) {
      timer = setTimeout(() => setNextEnabled(true), 2000); // Step 4: 2 seconds
    } else if (step === 5) {
      timer = setTimeout(() => setNextEnabled(true), 2000); // Step 5: 2 seconds
    } else if (step === 6) {
      timer = setTimeout(() => setNextEnabled(true), 1500); // Step 6: 1.5 seconds
    }
    return () => clearTimeout(timer);
  }, [step]);

  // Handle Close Button Delay for Daral Popup
  useEffect(() => {
    if (showDaralPopup) {
      setDaralCloseEnabled(false);
      const timer = setTimeout(() => setDaralCloseEnabled(true), 3000); // 3 seconds penalty/lock
      return () => clearTimeout(timer);
    }
  }, [showDaralPopup]);

  const handleNext = () => {
    if (!nextEnabled) return;
    if (step < 6) {
      setStep((prev) => prev + 1);
    } else {
      // Completed, record timestamp
      localStorage.setItem("focusflow_last_intro_time", Date.now().toString());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 text-white select-none overflow-hidden font-sans" dir="rtl">
      
      {/* Heartbeat/Breathing Pulsing Background */}
      <motion.div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        animate={
          step === 6
            ? {
                background: [
                  "radial-gradient(circle, rgba(2, 20, 10, 1) 0%, rgba(0, 0, 0, 1) 100%)",
                  "radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(0, 0, 0, 1) 100%)",
                  "radial-gradient(circle, rgba(2, 20, 10, 1) 0%, rgba(0, 0, 0, 1) 100%)"
                ],
                boxShadow: [
                  "inset 0 0 50px rgba(0,0,0,1)",
                  "inset 0 0 100px rgba(16,185,129,0.15)",
                  "inset 0 0 50px rgba(0,0,0,1)"
                ]
              }
            : step === 4
            ? {
                background: [
                  "radial-gradient(circle, rgba(25, 4, 15, 1) 0%, rgba(0, 0, 0, 1) 100%)",
                  "radial-gradient(circle, rgba(219, 39, 119, 0.2) 0%, rgba(0, 0, 0, 1) 100%)",
                  "radial-gradient(circle, rgba(25, 4, 15, 1) 0%, rgba(0, 0, 0, 1) 100%)"
                ],
                boxShadow: [
                  "inset 0 0 50px rgba(0,0,0,1)",
                  "inset 0 0 100px rgba(219,39,119,0.15)",
                  "inset 0 0 50px rgba(0,0,0,1)"
                ]
              }
            : { 
                background: [
                  "radial-gradient(circle, rgba(20, 2, 2, 1) 0%, rgba(0, 0, 0, 1) 100%)",
                  "radial-gradient(circle, rgba(120, 10, 10, 0.45) 0%, rgba(0, 0, 0, 1) 100%)",
                  "radial-gradient(circle, rgba(20, 2, 2, 1) 0%, rgba(0, 0, 0, 1) 100%)"
                ],
                boxShadow: [
                  "inset 0 0 50px rgba(0,0,0,1)",
                  "inset 0 0 100px rgba(239,68,68,0.25)",
                  "inset 0 0 50px rgba(0,0,0,1)"
                ]
              }
        }
        transition={{
          repeat: Infinity,
          duration: step === 6 ? 2.5 : step === 4 ? 2.0 : 1.4,
          ease: "easeInOut"
        }}
      />

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center justify-center h-full">
        
        <AnimatePresence mode="wait">
          
          {/* STEP 1: Are you okay? */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, y: -15 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center text-center space-y-6"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                className="text-4xl md:text-5xl font-extrabold tracking-tight text-rose-500 flex items-center gap-4 select-none"
              >
                حالت خوبه؟ <Skull className="h-12 w-12 text-rose-500 animate-pulse" />
              </motion.div>
              <p className="text-sm md:text-base text-zinc-400 font-medium leading-relaxed max-w-sm">
                آیا واقعاً از روندی که پیش گرفتی راضی هستی؟ زمان داره با سرعت باد می‌گذره...
              </p>
            </motion.div>
          )}

          {/* STEP 2: Time passing / countdown */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, y: -15 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center text-center space-y-8 w-full"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  className="w-16 h-16 border-4 border-dashed border-rose-500 rounded-full flex items-center justify-center"
                >
                  <Clock className="h-8 w-8 text-rose-500" />
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center text-xs text-rose-400 animate-pulse font-mono font-bold">
                  تیک‌تاک
                </div>
              </div>

              <div className="space-y-4 w-full">
                <h2 className="text-xl font-bold text-zinc-300">ضرب‌الاجل‌های مرگبار</h2>
                
                <div className="grid gap-3 w-full">
                  {/* Konkur box */}
                  <div className="bg-zinc-950/80 border border-red-950/50 rounded-2xl p-4 flex justify-between items-center shadow-lg">
                    <div className="text-right">
                      <div className="text-xs text-zinc-500">روز شمار</div>
                      <div className="text-sm font-bold text-rose-400 flex items-center gap-1.5 mt-0.5">
                        <Flame className="h-4 w-4 animate-pulse" />
                        کنکور سراسری
                      </div>
                    </div>
                    <div className="text-left font-bold text-2xl text-rose-500">
                      {konkurRemaining >= 0 ? `${toPersianDigits(konkurRemaining)} روز` : "برگزار شده"}
                    </div>
                  </div>

                  {/* Finals box */}
                  <div className="bg-zinc-950/80 border border-yellow-950/50 rounded-2xl p-4 flex justify-between items-center shadow-lg">
                    <div className="text-right">
                      <div className="text-xs text-zinc-500">روز شمار</div>
                      <div className="text-sm font-bold text-amber-400 flex items-center gap-1.5 mt-0.5">
                        <Clock className="h-4 w-4" />
                        امتحانات نهایی
                      </div>
                    </div>
                    <div className="text-left font-bold text-2xl text-amber-500">
                      {finalRemaining >= 0 ? `${toPersianDigits(finalRemaining)} روز` : "برگزار شده"}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-zinc-500 italic max-w-xs leading-relaxed">
                صدای گذر ثانیه‌ها رو می‌شنوی؟ این‌ها ضربان عمر تو هستن که دیگه هیچ‌وقت برنمی‌گردن.
              </p>
            </motion.div>
          )}

          {/* STEP 3: Daral */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, y: -15 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center text-center space-y-6"
            >
              <Skull className="h-16 w-16 text-rose-600 animate-bounce" />
              
              <button
                type="button"
                onClick={() => setShowDaralPopup(true)}
                className="group relative px-8 py-5 rounded-3xl bg-red-950/40 border border-red-500/30 text-center hover:bg-red-900/20 transition-all cursor-pointer shadow-2xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-red-600/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                <h2 className="text-4xl font-extrabold text-rose-500 tracking-wider">دارال</h2>
                <div className="text-xs text-rose-400 font-medium mt-2 flex items-center justify-center gap-1">
                  <Eye className="h-4 w-4" />
                  دیدن خاطرات و اتفاقات تلخ گذشته
                </div>
              </button>

              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
                کلیک کن تا یادت بیاد چرا داری این سختی‌ها رو تحمل می‌کنی و برای چه کسانی و چه اهدافی داری می‌جنگی.
              </p>
            </motion.div>
          )}

          {/* STEP 4: Family happiness page */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, y: -15 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center text-center space-y-8 animate-fade-in"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  filter: ["drop-shadow(0 0 5px rgba(219,39,119,0.2))", "drop-shadow(0 0 20px rgba(219,39,119,0.6))", "drop-shadow(0 0 5px rgba(219,39,119,0.2))"]
                }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                className="text-7xl text-pink-500"
              >
                <Heart className="h-20 w-20 text-pink-500 fill-pink-500/20" />
              </motion.div>

              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-black text-pink-400 tracking-tight leading-relaxed">
                  حق خونوادت اینه خوشحال بشن مامان بابات و زهرا
                </h2>
                <p className="text-sm text-zinc-300 leading-relaxed max-w-md font-medium">
                  برای لبخند رضایت و اشک‌های شوق مادری که هر روز دعات می‌کنه، برای پدری که با تموم خستگی‌هاش بهت تکیه کرده، و برای زهرا... نباید کم بیاری. اون‌ها منتظر پیروزیِ تو هستن!
                </p>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Will you be satisfied? */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, y: -15 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center text-center space-y-8"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.08, 1],
                  filter: ["drop-shadow(0 0 5px rgba(239,68,68,0.2))", "drop-shadow(0 0 20px rgba(239,68,68,0.6))", "drop-shadow(0 0 5px rgba(239,68,68,0.2))"]
                }}
                transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                className="flex justify-center"
              >
                <div className="relative flex flex-col items-center justify-end w-28 h-36 border-4 border-rose-500/40 bg-zinc-950/80 rounded-t-full shadow-2xl p-4">
                  <Skull className="h-12 w-12 text-rose-500 animate-pulse absolute top-8" />
                  <span className="text-[10px] font-mono tracking-widest text-rose-500/40 font-bold mb-1">عمر رفته</span>
                </div>
              </motion.div>

              <div className="space-y-4">
                <h2 className="text-4xl font-black text-rose-500 tracking-tight leading-none">
                  راضی خواهی بود!!؟؟
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed max-w-sm font-medium">
                  در لحظه مرگ یا زمان اعلام نتایج کنکور، وقتی به پشت سرت نگاه کنی، از این ساعت‌هایی که الان می‌گذرونی راضی خواهی بود؟ یا غرق در حسرت می‌شی؟
                </p>
              </div>
            </motion.div>
          )}

          {/* STEP 6: Calming smile page */}
          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, y: -15 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center text-center space-y-8"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  filter: [
                    "drop-shadow(0 0 5px rgba(16,185,129,0.2))", 
                    "drop-shadow(0 0 15px rgba(16,185,129,0.5))", 
                    "drop-shadow(0 0 5px rgba(16,185,129,0.2))"
                  ]
                }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="flex items-center justify-center bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full p-6"
              >
                <Smile className="h-16 w-16 text-emerald-400" />
              </motion.div>

              <div className="space-y-4">
                <h2 className="text-4xl font-extrabold text-emerald-400 tracking-tight leading-none">
                  اوقات خوبی داشته باشی
                </h2>
                <p className="text-sm text-zinc-300 leading-relaxed max-w-sm font-medium">
                  نفس عمیق بکش... استرس و ترس یه محرکه برای به خود اومدن، ولی الان وقتشه با تمرکز بالا و ذهن آروم کارتو شروع کنی. تو می‌تونی!
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Footer Navigation Button (Next) */}
        <div className="mt-12 w-full flex justify-center">
          <AnimatePresence>
            {nextEnabled && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={handleNext}
                className="w-full sm:w-48 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-bold text-sm text-white py-4 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{step === 6 ? "شروع پرقدرت تلاش (هوم‌پیج)" : "مرحله بعد"}</span>
                <ArrowLeft className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* MODERN BITTER MEMORIES POPUP (DARAL POPUP) */}
      <AnimatePresence>
        {showDaralPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => daralCloseEnabled && setShowDaralPopup(false)}
            />

            {/* Popup Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="relative w-full max-w-md bg-zinc-900 border border-rose-950/80 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[80vh]"
            >
              {/* Close Button with 3 seconds lock */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Skull className="h-5 w-5 text-rose-500 animate-pulse" />
                  <span className="font-extrabold text-rose-500 text-lg">اتاق عهد و حسرت (دارال)</span>
                </div>
                <button
                  onClick={() => daralCloseEnabled && setShowDaralPopup(false)}
                  disabled={!daralCloseEnabled}
                  className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${
                    daralCloseEnabled 
                      ? "border-zinc-700 hover:bg-white/5 text-zinc-400 cursor-pointer" 
                      : "border-zinc-800 text-zinc-600 cursor-not-allowed"
                  }`}
                  title={daralCloseEnabled ? "بستن" : "لطفاً خاطرات را مرور کنید"}
                >
                  {daralCloseEnabled ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <span className="text-[10px] font-bold px-1 text-rose-500 animate-pulse">۳ثانیه...</span>
                  )}
                </button>
              </div>

              {/* Scrollable list of memories */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {memories.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 text-xs leading-relaxed">
                    <AlertCircle className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                    هیچ خاطره یا محرکی ثبت نشده است.<br />
                    در منوی کناری بخش <span className="text-rose-500 font-semibold">«انگیزه و اهداف»</span> بروید و خاطرات تلخ گذشته خود را بنویسید تا محرک حرکتتان شوند.
                  </div>
                ) : (
                  memories.map((m) => (
                    <div 
                      key={m.id} 
                      className={`p-4 rounded-2xl border transition-all ${
                        m.is_pinned 
                          ? "bg-rose-950/20 border-rose-500/40" 
                          : "bg-zinc-950/50 border-zinc-800"
                      }`}
                    >
                      <h4 className="font-extrabold text-sm text-rose-400 mb-1 flex items-center gap-1.5">
                        {m.is_pinned && <Pin className="h-3.5 w-3.5 text-rose-500" />}
                        {m.title}
                      </h4>
                      {m.description && (
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          {m.description}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-zinc-800 text-[10px] text-zinc-500 text-center leading-relaxed">
                این خاطرات یادآور لحظاتیه که بهت ظلم شد یا ضعیف بودی. بجنگ تا دوباره تکرار نشن.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
