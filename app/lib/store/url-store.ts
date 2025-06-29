import { atom } from "jotai";
import type { UrlState } from "../schemas/url-schema";

/**
 * URL入力フォームの状態を管理するAtom
 */
export const urlFormAtom = atom<UrlState>({
  url: "",
  isValid: false,
  error: undefined,
  isSubmitting: false,
});

/**
 * URL入力値を更新するAtom
 */
export const updateUrlAtom = atom(null, (get, set, url: string) => {
  const currentState = get(urlFormAtom);
  set(urlFormAtom, {
    ...currentState,
    url,
    error: undefined, // 入力時にエラーをクリア
  });
});

/**
 * バリデーションエラーを設定するAtom
 */
export const setUrlErrorAtom = atom(null, (get, set, error: string | undefined) => {
  const currentState = get(urlFormAtom);
  set(urlFormAtom, {
    ...currentState,
    error,
    isValid: !error,
  });
});

/**
 * 送信状態を管理するAtom
 */
export const setSubmittingAtom = atom(null, (get, set, isSubmitting: boolean) => {
  const currentState = get(urlFormAtom);
  set(urlFormAtom, {
    ...currentState,
    isSubmitting,
  });
});
