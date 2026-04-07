import { useState, useEffect, useCallback } from "react";

export function useSpeech() {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!supported) return;
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = "en-US";
      utt.rate = 0.85;
      window.speechSynthesis.speak(utt);
    },
    [supported]
  );

  return { supported, speak };
}
