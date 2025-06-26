import { useState, useEffect, useRef } from "react";

/**
 * @param text 要打的完整字串
 * @param speed 每個字母平均間隔（毫秒）
 */
export function useTypewriter(text: string, speed = 50) {
  const [displayed, setDisplayed] = useState("");
  const startRef = useRef<number>(0);

  useEffect(() => {
    let animationFrame: number;

    // 初始化
    setDisplayed("");
    startRef.current = performance.now();

    const tick = () => {
      const elapsed = performance.now() - startRef.current;
      // 計算到目前應該顯示幾個字
      const count = Math.min(text.length, Math.floor(elapsed / speed));
      setDisplayed(text.slice(0, count));

      if (count < text.length) {
        animationFrame = requestAnimationFrame(tick);
      }
    };

    // 啟動一次即可，剩下都由 requestAnimationFrame loop
    animationFrame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationFrame);
  }, [text, speed]);

  return displayed;
}
