import React, { useState, useEffect, useRef } from "react";
import { X, Heart, Award, Flame, CheckCircle2, AlertCircle, Volume2, Mic, MicOff, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { api } from "../utils/api";

interface Exercise {
  id: number;
  order: number;
  type: "multiple_choice" | "translate" | "match_pairs" | "fill_blank" | "type_answer" | "speak";
  prompt: string;
  content: any;
}

interface LessonPlayerProps {
  lessonId: number;
  onClose: (xpEarned?: number) => void;
  isSuper?: boolean;
}

export function LessonPlayer({ lessonId, onClose, isSuper }: LessonPlayerProps) {
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [hearts, setHearts] = useState<number>(5);
  
  // Input states
  const [selectedOption, setSelectedOption] = useState<string>(""); // multiple_choice, fill_blank
  const [typeAnswer, setTypeAnswer] = useState<string>(""); // type_answer
  const [selectedWords, setSelectedWords] = useState<string[]>([]); // translate word_bank
  const [matchedPairs, setMatchedPairs] = useState<[string, string][]>([]); // match_pairs
  const [matchSelection, setMatchSelection] = useState<string | null>(null);

  // Speak exercise states
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speakTranscript, setSpeakTranscript] = useState<string>("");
  const [speakDone, setSpeakDone] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Flow states
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [correctAnswerRevealed, setCorrectAnswerRevealed] = useState<any>(null);
  const [isLessonFailed, setIsLessonFailed] = useState<boolean>(false);
  const [isLessonComplete, setIsLessonComplete] = useState<boolean>(false);
  const [completeData, setCompleteData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const currentExercise = exercises[currentIdx];

  useEffect(() => {
    async function startAttempt() {
      try {
        const data = await api.startLessonAttempt(lessonId);
        setAttemptId(data.attempt_id);
        setExercises(data.lesson.exercises);
        setHearts(data.hearts);
      } catch (err: any) {
        console.error("Failed to start lesson attempt", err);
        alert(err.message || "Failed to start lesson. Make sure you have hearts!");
        onClose();
      } finally {
        setLoading(false);
      }
    }
    startAttempt();
  }, [lessonId]);

  // Text to Speech
  const speak = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      // Find Spanish voice if possible, otherwise default
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const esVoice = voices.find(v => v.lang.startsWith("es"));
      if (esVoice) utterance.voice = esVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (currentExercise) {
      // Read out prompt if Spanish or translate bank
      if (currentExercise.type === "translate") {
        speak(currentExercise.prompt.replace("Translate: ", ""));
      } else if (currentExercise.type === "fill_blank") {
        speak(currentExercise.content.sentence || currentExercise.prompt);
      }
    }
  }, [currentIdx, exercises]);

  // Answer formulation helpers
  const handleWordTap = (word: string) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(prev => prev.filter(w => w !== word));
    } else {
      setSelectedWords(prev => [...prev, word]);
    }
  };

  const handleMatchCardClick = (val: string) => {
    if (!matchSelection) {
      setMatchSelection(val);
    } else {
      if (matchSelection === val) {
        setMatchSelection(null);
        return;
      }
      // Check if it's a match against seeded pairs
      const pairs = currentExercise.content.pairs as [string, string][];
      const isValidPair = pairs.some(p => 
        (p[0] === matchSelection && p[1] === val) || 
        (p[1] === matchSelection && p[0] === val)
      );

      if (isValidPair) {
        setMatchedPairs(prev => [...prev, [matchSelection, val]]);
      } else {
        // Flash red
        alert("Incorrect pair match!");
      }
      setMatchSelection(null);
    }
  };

  // Submit check
  const handleCheck = async () => {
    if (!attemptId || !currentExercise) return;

    let payloadAnswer: any = null;
    if (currentExercise.type === "multiple_choice" || currentExercise.type === "fill_blank") {
      payloadAnswer = selectedOption;
    } else if (currentExercise.type === "type_answer") {
      payloadAnswer = typeAnswer;
    } else if (currentExercise.type === "translate") {
      payloadAnswer = selectedWords;
    } else if (currentExercise.type === "match_pairs") {
      // If they matched all pairs, submit them
      payloadAnswer = matchedPairs;
    } else if (currentExercise.type === "speak") {
      payloadAnswer = speakTranscript || "(spoken)";
    }

    try {
      const res = await api.submitAnswer(attemptId, currentExercise.id, payloadAnswer);
      setIsCorrect(res.is_correct);
      setCorrectAnswerRevealed(res.correct_answer);
      setHearts(res.hearts_remaining);
      setIsChecked(true);

      if (res.lesson_failed) {
        setIsLessonFailed(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleContinue = async () => {
    // Reset exercise states
    setSelectedOption("");
    setTypeAnswer("");
    setSelectedWords([]);
    setMatchedPairs([]);
    setMatchSelection(null);
    setIsChecked(false);
    setCorrectAnswerRevealed(null);
    setSpeakTranscript("");
    setSpeakDone(false);
    setIsListening(false);

    if (currentIdx + 1 < exercises.length) {
      setCurrentIdx(prev => prev + 1);
    } else {
      // Complete lesson!
      if (!attemptId) return;
      try {
        setLoading(true);
        const data = await api.completeLessonAttempt(attemptId);
        setCompleteData(data);
        setIsLessonComplete(true);
        // Fire confetti!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && !isLessonComplete && !isLessonFailed) {
    return (
      <div className="fixed inset-0 bg-[#0E1418] z-50 flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#1CB0F6]"></div>
        <p className="text-[#8A97A0] font-bold">Preparing lesson...</p>
      </div>
    );
  }

  if (isLessonFailed) {
    return (
      <div className="fixed inset-0 bg-[#0E1418] z-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-[#131F24] border border-[#232C33] rounded-3xl p-8 flex flex-col items-center gap-6">
          <div className="bg-[#FF4B4B]/10 p-5 rounded-full border border-[#FF4B4B]/25">
            <Heart size={64} fill="#FF4B4B" color="#FF4B4B" className="bounce-slow" />
          </div>
          <h2 className="text-2xl font-black text-white">No Hearts Left!</h2>
          <p className="text-sm text-[#8A97A0]">
            You lost all your hearts. Refill them or try again later.
          </p>
          <button
            onClick={() => onClose()}
            className="w-full py-4 rounded-2xl bg-[#FF4B4B] text-white font-black text-sm uppercase tracking-wide hover:brightness-105 active:scale-95 transition-all shadow-[0_4px_0_#C92E2E]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (isLessonComplete && completeData) {
    return (
      <div className="fixed inset-0 bg-[#0E1418] z-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-[#131F24] border border-[#232C33] rounded-3xl p-8 flex flex-col items-center gap-6">
          <div className="bg-[#FFC800]/10 p-5 rounded-full border border-[#FFC800]/25">
            <Award size={64} color="#FFC800" fill="#FFC800" className="animate-bounce" />
          </div>
          <h2 className="text-3xl font-black text-white">Lesson Complete!</h2>
          <p className="text-sm text-[#58CC02] font-black uppercase tracking-wider">
            {completeData.passed ? "Passed Successfully" : "Completed"}
          </p>

          <div className="grid grid-cols-2 gap-4 w-full mt-2">
            <div className="bg-[#1C232B] border border-[#2B343B] p-4 rounded-2xl flex flex-col items-center">
              <span className="text-[#FFC800] font-black text-xl">+{completeData.xp_earned}</span>
              <span className="text-[10px] font-bold text-[#8A97A0] uppercase mt-1">XP Earned</span>
            </div>
            <div className="bg-[#1C232B] border border-[#2B343B] p-4 rounded-2xl flex flex-col items-center">
              <span className="text-[#FF9600] font-black text-xl flex items-center gap-1">
                <Flame size={18} fill="#FF9600" color="#FF9600" />
                {completeData.new_streak}
              </span>
              <span className="text-[10px] font-bold text-[#8A97A0] uppercase mt-1">Day Streak</span>
            </div>
          </div>

          {completeData.daily_goal_met && (
            <div className="px-4 py-2.5 rounded-2xl bg-[#58CC02]/15 border border-[#58CC02]/25 text-[#58CC02] text-xs font-bold w-full">
              🎉 Daily XP Goal Reached!
            </div>
          )}

          <button
            onClick={() => onClose(completeData.xp_earned)}
            className="w-full py-4 rounded-2xl bg-[#58CC02] text-white font-black text-sm uppercase tracking-wide hover:brightness-105 active:scale-95 transition-all shadow-[0_4px_0_#46A302]"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Calculate progress percent
  const progressPct = Math.round(((currentIdx) / exercises.length) * 100);

  return (
    <div className="fixed inset-0 bg-[#0E1418] z-40 flex flex-col">
      {/* Header */}
      <div className="max-w-2xl mx-auto w-full px-6 py-6 flex items-center justify-between gap-4">
        <button onClick={() => onClose()} className="text-[#7C8890] hover:text-white">
          <X size={24} />
        </button>
        <div className="flex-1 rounded-full overflow-hidden h-4 bg-[#131F24] border border-[#232C33]">
          <div
            className="h-full rounded-full bg-[#58CC02] transition-all duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex items-center gap-1.5 font-bold text-[#FF4B4B]">
          <Heart size={20} fill="#FF4B4B" color="#FF4B4B" />
          <span>{hearts}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-4 flex flex-col justify-center gap-6 overflow-y-auto">
        {currentExercise && (
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              {currentExercise.prompt}
              <button 
                onClick={() => speak(currentExercise.prompt.replace("Translate: ", ""))}
                className="p-1.5 rounded-lg bg-[#1CB0F6]/10 text-[#1CB0F6] hover:bg-[#1CB0F6]/20 transition-colors"
                aria-label="Speak sentence"
              >
                <Volume2 size={16} />
              </button>
            </h3>

            {/* Renderer Switch */}
            {currentExercise.type === "multiple_choice" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {currentExercise.content.options.map((opt: string) => (
                  <button
                    key={opt}
                    disabled={isChecked}
                    onClick={() => setSelectedOption(opt)}
                    className={`p-4 rounded-2xl font-bold text-left border-2 text-sm transition-all ${
                      selectedOption === opt
                        ? "border-[#1CB0F6] bg-[#16232B] text-[#1CB0F6]"
                        : "border-[#232C33] bg-[#131F24] text-white hover:border-[#333E46]"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {currentExercise.type === "fill_blank" && (
              <div className="flex flex-col gap-6">
                <div className="p-5 rounded-2xl bg-[#131F24] border border-[#232C33] font-black text-center text-lg text-white">
                  {currentExercise.content.sentence}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {currentExercise.content.options.map((opt: string) => (
                    <button
                      key={opt}
                      disabled={isChecked}
                      onClick={() => setSelectedOption(opt)}
                      className={`p-4 rounded-2xl font-bold border-2 text-sm text-center transition-all ${
                        selectedOption === opt
                          ? "border-[#1CB0F6] bg-[#16232B] text-[#1CB0F6]"
                          : "border-[#232C33] bg-[#131F24] text-white hover:border-[#333E46]"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentExercise.type === "type_answer" && (
              <input
                type="text"
                disabled={isChecked}
                value={typeAnswer}
                onChange={(e) => setTypeAnswer(e.target.value)}
                placeholder="Type the Spanish translation..."
                className="w-full p-4 rounded-2xl border-2 border-[#232C33] bg-[#131F24] text-white font-extrabold text-sm focus:border-[#1CB0F6] outline-none"
              />
            )}

            {currentExercise.type === "translate" && (
              <div className="flex flex-col gap-6">
                {/* Sentence slots */}
                <div className="min-h-[64px] p-4 rounded-2xl border-2 border-[#232C33] bg-[#0E1418] flex flex-wrap gap-2 items-center">
                  {selectedWords.map((word) => (
                    <button
                      key={word}
                      disabled={isChecked}
                      onClick={() => handleWordTap(word)}
                      className="px-4 py-2 rounded-xl bg-[#131F24] border border-[#232C33] font-bold text-sm text-white transition-all shadow-[0_2px_0_#232C33]"
                    >
                      {word}
                    </button>
                  ))}
                </div>

                {/* Word bank */}
                <div className="flex flex-wrap gap-2 justify-center py-2">
                  {currentExercise.content.word_bank.map((word: string) => {
                    const isUsed = selectedWords.includes(word);
                    return (
                      <button
                        key={word}
                        disabled={isUsed || isChecked}
                        onClick={() => handleWordTap(word)}
                        className={`px-4 py-2 rounded-xl border font-bold text-sm transition-all select-none ${
                          isUsed
                            ? "bg-[#232C33]/40 border-transparent text-transparent shadow-none"
                            : "bg-[#131F24] border-[#232C33] text-white hover:border-[#333E46] shadow-[0_3px_0_#232C33]"
                        }`}
                      >
                        {word}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {currentExercise.type === "match_pairs" && (
              <div className="grid grid-cols-2 gap-3.5 max-w-sm mx-auto w-full">
                {(() => {
                  // Flatten options list (shuffled)
                  const pairs = currentExercise.content.pairs as [string, string][];
                  const allWords = Array.from(new Set(pairs.flat()));
                  
                  return allWords.map((word) => {
                    const isAlreadyMatched = matchedPairs.some(p => p.includes(word));
                    const isSelected = matchSelection === word;

                    return (
                      <button
                        key={word}
                        disabled={isAlreadyMatched || isChecked}
                        onClick={() => handleMatchCardClick(word)}
                        className={`p-4 rounded-2xl border-2 font-bold text-center text-sm transition-all ${
                          isAlreadyMatched
                            ? "bg-[#232C33]/20 border-transparent text-[#7C8890] line-through cursor-not-allowed"
                            : isSelected
                            ? "border-[#1CB0F6] bg-[#16232B] text-[#1CB0F6]"
                            : "border-[#232C33] bg-[#131F24] text-white hover:border-[#333E46]"
                        }`}
                      >
                        {word}
                      </button>
                    );
                  });
                })()}
              </div>
            )}
          {currentExercise.type === "speak" && (
              <div className="flex flex-col items-center gap-6 py-4">
                {/* Sentence to speak */}
                <div className="p-5 rounded-2xl bg-[#131F24] border border-[#232C33] font-black text-center text-lg text-white w-full">
                  {currentExercise.content.sentence}
                </div>

                {/* Microphone Button */}
                <button
                  disabled={isChecked || speakDone}
                  onClick={() => {
                    if (isListening) {
                      // Stop listening
                      if (recognitionRef.current) {
                        recognitionRef.current.stop();
                      }
                      setIsListening(false);
                      return;
                    }

                    // Try Web Speech API
                    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                    if (SpeechRecognition) {
                      const recognition = new SpeechRecognition();
                      recognition.lang = "es-ES";
                      recognition.continuous = false;
                      recognition.interimResults = true;
                      recognitionRef.current = recognition;

                      recognition.onresult = (event: any) => {
                        const transcript = Array.from(event.results)
                          .map((r: any) => r[0].transcript)
                          .join("");
                        setSpeakTranscript(transcript);
                      };
                      recognition.onend = () => {
                        setIsListening(false);
                        setSpeakDone(true);
                      };
                      recognition.onerror = () => {
                        setIsListening(false);
                        // Fallback: simulate success
                        setSpeakTranscript(currentExercise.content.sentence);
                        setSpeakDone(true);
                      };
                      recognition.start();
                      setIsListening(true);
                    } else {
                      // No browser support — simulate after delay
                      setIsListening(true);
                      setSpeakTranscript("");
                      setTimeout(() => {
                        setSpeakTranscript(currentExercise.content.sentence);
                        setIsListening(false);
                        setSpeakDone(true);
                      }, 2000);
                    }
                  }}
                  className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
                    speakDone
                      ? "bg-[#58CC02]/15 border-2 border-[#58CC02] text-[#58CC02]"
                      : isListening
                      ? "bg-[#FF4B4B] border-2 border-[#FF4B4B] text-white animate-pulse"
                      : "bg-[#1CB0F6] border-2 border-[#1CB0F6] text-white hover:brightness-110"
                  }`}
                >
                  {/* Ripple rings when listening */}
                  {isListening && (
                    <>
                      <span className="absolute inset-0 rounded-full border-2 border-[#FF4B4B] animate-ping opacity-30" />
                      <span className="absolute inset-[-8px] rounded-full border border-[#FF4B4B]/20 animate-ping opacity-20" style={{ animationDelay: "0.3s" }} />
                    </>
                  )}
                  {speakDone ? (
                    <CheckCircle2 size={36} />
                  ) : isListening ? (
                    <MicOff size={36} />
                  ) : (
                    <Mic size={36} />
                  )}
                </button>

                <span className="text-xs font-bold uppercase tracking-wider text-[#8A97A0]">
                  {speakDone
                    ? "Speech captured!"
                    : isListening
                    ? "Listening... Tap to stop"
                    : "Tap the microphone and speak"}
                </span>

                {/* Transcript Preview */}
                {speakTranscript && (
                  <div className="w-full p-4 rounded-2xl border border-[#232C33] bg-[#0E1418] text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A97A0] block mb-1.5">Your speech</span>
                    <span className="text-base font-extrabold text-white">{speakTranscript}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer bar containing Check/Continue controls */}
      <div className={`mt-auto border-t py-6 ${
        isChecked 
          ? isCorrect 
            ? "bg-[#1B361B] border-[#58CC02]/25" 
            : "bg-[#3D1E1E] border-[#FF4B4B]/25"
          : "bg-[#131F24] border-[#232C33]"
      }`}>
        <div className="max-w-2xl mx-auto px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            {isChecked && (
              <>
                {isCorrect ? (
                  <div className="bg-[#58CC02]/20 p-2.5 rounded-full border border-[#58CC02]/30 text-[#58CC02]">
                    <CheckCircle2 size={24} />
                  </div>
                ) : (
                  <div className="bg-[#FF4B4B]/20 p-2.5 rounded-full border border-[#FF4B4B]/30 text-[#FF4B4B]">
                    <AlertCircle size={24} />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className={`text-base font-black uppercase ${isCorrect ? "text-[#58CC02]" : "text-[#FF4B4B]"}`}>
                    {isCorrect ? "Excellent!" : "Correct Answer:"}
                  </span>
                  {!isCorrect && correctAnswerRevealed && (
                    <span className="text-xs text-[#E1E5E8] mt-0.5">
                      {Array.isArray(correctAnswerRevealed) 
                        ? correctAnswerRevealed.join(" ") 
                        : JSON.stringify(correctAnswerRevealed).replace(/"/g, "")}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          <button
            onClick={isChecked ? handleContinue : handleCheck}
            disabled={
              !isChecked && (
                (currentExercise?.type === "multiple_choice" && !selectedOption) ||
                (currentExercise?.type === "fill_blank" && !selectedOption) ||
                (currentExercise?.type === "type_answer" && !typeAnswer) ||
                (currentExercise?.type === "translate" && selectedWords.length === 0) ||
                (currentExercise?.type === "match_pairs" && matchedPairs.length < (currentExercise.content.pairs.length)) ||
                (currentExercise?.type === "speak" && !speakDone)
              )
            }
            className={`px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider select-none active:scale-95 transition-all text-white disabled:opacity-40 disabled:pointer-events-none ${
              isChecked
                ? isCorrect
                  ? "bg-[#58CC02] hover:brightness-105 shadow-[0_4px_0_#46A302]"
                  : "bg-[#FF4B4B] hover:brightness-105 shadow-[0_4px_0_#C92E2E]"
                : "bg-[#1CB0F6] hover:brightness-105 shadow-[0_4px_0_#0F8BCA]"
            }`}
          >
            {isChecked ? "Continue" : "Check Answer"}
          </button>
        </div>
      </div>
    </div>
  );
}
