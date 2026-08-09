"use client";

/** Short vibration on supported devices. Silently absent on iOS Safari. */
export function haptic(pattern: number | number[] = 8) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}

export const tap = () => haptic(8);
export const success = () => haptic([10, 40, 14]);
export const error = () => haptic([26, 60, 26]);

let voices: SpeechSynthesisVoice[] = [];

function hebrewVoice(): SpeechSynthesisVoice | undefined {
  if (!voices.length) voices = window.speechSynthesis?.getVoices() ?? [];
  return voices.find((v) => v.lang?.toLowerCase().startsWith("he"));
}

/** Speak a Hebrew string. No-ops when the platform has no Hebrew voice. */
export function speak(text: string) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = hebrewVoice();
    if (v) u.voice = v;
    u.lang = "he-IL";
    u.rate = 0.85;
    synth.speak(u);
  } catch {
    /* unsupported */
  }
}

export function canSpeak(): boolean {
  try {
    return !!window.speechSynthesis && !!hebrewVoice();
  } catch {
    return false;
  }
}
