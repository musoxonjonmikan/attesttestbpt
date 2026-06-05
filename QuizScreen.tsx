import { useState, useEffect } from "react";
import LoginScreen from "./components/LoginScreen";
import QuizScreen from "./components/QuizScreen";
import ResultsScreen from "./components/ResultsScreen";
import { Send, Eye, ShieldAlert, Check, Loader2, ExternalLink } from "lucide-react";
import { motion } from "motion/react";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
          };
        };
      };
    };
  }
}

type ScreenState = "login" | "quiz" | "results";

export default function App() {
  const [screen, setScreen] = useState<ScreenState>("login");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [resultsData, setResultsData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Telegram status flags
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null); // null = checking/checking-not-needed, false = locked, true = unlocked
  const [subscriptionChecking, setSubscriptionChecking] = useState(false);
  const [customUsername, setCustomUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
      if (tgUser) {
        setTelegramUser(tgUser);
        const fullName = tgUser.first_name + (tgUser.last_name ? " " + tgUser.last_name : "");
        setName(fullName);
        // Automatically check subscription for direct telegram users
        handleCheckSubscription(String(tgUser.id));
      } else {
        // Not launched from within Telegram (standard web browser check)
        // Automatically generate a generic browser visitor ID instead of asking
        const randomId = "mehmon_" + Math.floor(100000 + Math.random() * 900000);
        setCustomUsername(randomId);
        // Standard browsers get a bypass by default so they aren't locked out
        setIsSubscribed(true);
      }
    } else {
      // Browser preview fallback
      const randomId = "mehmon_" + Math.floor(100000 + Math.random() * 900000);
      setCustomUsername(randomId);
      setIsSubscribed(true);
    }
  }, []);

  const handleCheckSubscription = async (tgIdToCheck: string) => {
    if (!tgIdToCheck.trim()) {
      setIsSubscribed(true); // Fail-safe
      return;
    }

    setSubscriptionChecking(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/telegram/check-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: tgIdToCheck }),
      });
      const data = await response.json();

      if (data.subscribed) {
        setIsSubscribed(true);
      } else {
        setIsSubscribed(false);
        // If developer fallback warning exists because bot isn't admin yet, show it but let user unlock or suggest
        if (data.debugFallback) {
          setErrorMessage("Eslatma: Telegram bot kanalda administrator bo'lishi kerak. Developer sinovi bo'lgani uchun vaqtincha ruxsat berildi.");
        } else {
          setErrorMessage("Siz hali @milliy_sertifikat_lider kanaliga a'zo emassiz!");
        }
      }
    } catch (err) {
      console.error("Subscription verify error:", err);
      // Fail-safe fallback so users aren't locked out in case of API failure
      setIsSubscribed(true);
    } finally {
      setSubscriptionChecking(false);
    }
  };

  const handleStartTest = (userName: string, testCode: string) => {
    setName(userName);
    setCode(testCode);
    setScreen("quiz");
  };

  const handleFinishTest = async (testAnswers: Record<number, string>) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/test/${code}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          answers: testAnswers,
          telegramUserId: telegramUser?.id ? String(telegramUser.id) : (customUsername ? customUsername : undefined),
        }),
      });

      if (!response.ok) {
        throw new Error("Yuborishda xatolik yuz berdi");
      }

      const data = await response.json();
      setResultsData(data);
      setScreen("results");
    } catch (error) {
      alert("Natijalaringizni saqlashda tarmoq xatoligi yuz berdi. Iltimos, qayta urinib ko'ring.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
    setName("");
    setCode("");
    setResultsData(null);
    setScreen("login");
  };

  const [liveTime, setLiveTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Lock UI with subscription layout
  if (isSubscribed === false) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white" id="sub-lock-screen">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 relative shadow-2xl overflow-hidden"
          id="lock-panel"
        >
          <div className="absolute top-0 left-1/4 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>

          <div className="text-center mb-6" id="lock-title">
            <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mb-2">Kanalga a'zo bo'ling</h2>
            <p className="text-slate-400 text-xs text-center leading-relaxed">
              Testni boshlash uchun avval quyidagi Telegram kanalimizga obuna bo'lishingiz shart:
            </p>
          </div>

          <div className="space-y-4" id="lock-form">
            {/* CTA Channel Button */}
            <a
              href="https://t.me/milliy_sertifikat_lider"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500/10 to-indigo-600/15 border border-indigo-500/30 hover:border-indigo-500/50 rounded-2xl text-slate-100 transition-all font-semibold"
              id="goto-channel-link"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold">
                  M
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">@milliy_sertifikat_lider</p>
                  <p className="text-[10px] text-slate-400 font-normal">Sertifikatlashtirilgan ta'lim kanali</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-indigo-400" />
            </a>

            {errorMessage && (
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 text-[11px] text-amber-500 text-center leading-normal">
                {errorMessage}
              </div>
            )}

            {/* Check Subscription Button */}
            <button
              onClick={() => handleCheckSubscription(telegramUser?.id ? String(telegramUser.id) : customUsername)}
              disabled={subscriptionChecking}
              className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-xs tracking-wider uppercase shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              id="verify-sub-btn"
            >
              {subscriptionChecking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Tekshirilmoqda...</span>
                </>
              ) : (
                <>
                  <Check className="w-4.5 h-4.5 font-bold" />
                  <span>A'zolikni tekshirish</span>
                </>
              )}
            </button>

            {/* Developer Fast Bypass for Testing simplicity */}
            <div className="text-center pt-2 flex flex-col justify-center gap-3">
              <a
                href="https://t.me/attesttestbot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-all inline-flex items-center justify-center gap-1.5"
                id="lock-bot-open"
              >
                <span>Telegram Bot orqali ochish</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setIsSubscribed(true)}
                className="text-[10px] text-slate-600 hover:text-slate-400 font-semibold underline transition-colors cursor-pointer"
                id="dev-bypass-btn"
              >
                [Sinov uchun a'zoliksiz davom etish]
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 antialiased font-sans flex items-center justify-center overflow-x-hidden p-0 sm:p-4 relative" id="app-root">
      {/* Dynamic colorful decorative background glow streams for beautiful desktop look */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none hidden sm:block"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[120px] pointer-events-none hidden sm:block"></div>

      {/* Main TikTok-styled dynamic viewport wrapper card */}
      <div className="w-full sm:tiktok-container bg-slate-950 flex flex-col h-screen sm:h-[90vh] border-0 sm:border border-slate-800 sm:rounded-[36px] overflow-hidden relative shadow-2xl">
        
        {/* Dynamic Mobile Status Bar inside device simulator scale */}
        <div className="bg-slate-950 px-5 pt-3 pb-1 flex items-center justify-between text-slate-400 text-[10px] font-mono z-20 shrink-0 border-b border-slate-900" id="device-status-bar">
          <div className="font-bold text-slate-200">{liveTime || "15:22"}</div>
          
          {/* Dynamic Interactive notch simulator accent */}
          <div className="w-20 h-4 bg-slate-900 rounded-b-xl absolute left-1/2 -translate-x-1/2 top-0 flex items-center justify-center hidden sm:flex-col" id="device-island">
            <span className="w-1.5 h-1.5 bg-indigo-500/50 rounded-full"></span>
          </div>

          <div className="flex items-center gap-1.5" id="status-bar-icons">
            {/* Connection bars icons */}
            <div className="flex items-end gap-0.5 h-2">
              <span className="w-[2px] h-[3px] bg-slate-400 rounded-2xs"></span>
              <span className="w-[2px] h-[5px] bg-slate-400 rounded-2xs"></span>
              <span className="w-[2px] h-[7px] bg-indigo-500 rounded-2xs"></span>
              <span className="w-[2px] h-2.5 bg-indigo-500 rounded-2xs"></span>
            </div>
            <span className="text-[9px] font-bold text-slate-300">UzMobile 4G</span>
            {/* Battery icon */}
            <div className="w-5 h-2.5 border border-slate-500 rounded-sm p-[1px] flex items-center relative gap-[1px]">
              <span className="w-[75%] h-full bg-emerald-500 rounded-2xs"></span>
              <span className="w-[1.5px] h-[3px] bg-slate-500 rounded-r-xs absolute -right-[2.5px] top-[2px]"></span>
            </div>
          </div>
        </div>

        {/* Content View with internal touch-fluid scroll container */}
        <div className="flex-1 overflow-y-auto relative flex flex-col bg-slate-950 scroll-smooth" id="device-screen-content">
          {screen === "login" && (
            <LoginScreen onStartTest={handleStartTest} isLoading={isLoading} />
          )}
          {screen === "quiz" && (
            <QuizScreen 
              name={name} 
              code={code} 
              onFinishTest={handleFinishTest} 
              isLoading={isLoading} 
            />
          )}
          {screen === "results" && resultsData && (
            <ResultsScreen results={resultsData} onRestart={handleRestart} />
          )}
        </div>
      </div>
    </div>
  );
}
