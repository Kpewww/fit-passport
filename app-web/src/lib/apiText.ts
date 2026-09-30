// Sentences the API sends back for a page to show — in the requester's language.
//
// Route handlers write their English as before and pass it through `say(req, …)`;
// a Chinese request gets the Chinese from the table below. The English stays the
// source (and what logs and tests see), so a route reads naturally in code.
//
// apiText.test.ts scans every route for `say(req, "…")` and fails if a sentence has
// no Chinese here — a new message cannot ship in one language only.

import { localeFromRequest } from "@/i18n/request";

export const API_ZH: Record<string, string> = {
  // rate limiting (rateLimit.ts)
  "Too many requests — slow down and try again shortly.": "请求太频繁了——稍等一会儿再试。",
  // auth
  "invalid request": "请求无效。",
  "invalid or expired reset link": "重置链接无效或已过期。",
  "not allowed": "没有权限。",
  "current password is incorrect": "当前密码不对。",
  "invalid username/code or password": "用户名、账号代码或密码不对。",
  "we couldn't verify that account and email combination": "无法核实这个账号和邮箱的组合。",
  "password required": "需要输入密码。",
  "password is incorrect": "密码不对。",
  "account already claimed": "这个账号已经注册过了。",
  "username taken": "这个用户名已经有人用了。",
  "email already in use": "这个邮箱已经被使用。",
  // claim form validation, one sentence per field
  "username: 2–30 characters — letters, numbers, and . _ - only, and not an email address":
    "用户名：2–30 个字符，只能用字母、数字和 . _ -，也不能是邮箱地址。",
  "password: at least 6 characters": "密码：至少 6 个字符。",
  "email: that doesn't look like an email address": "邮箱：格式看起来不对。",
};

/** The sentence in the requester's language (English when there is no Chinese for it). */
export function say(req: Request, english: string): string {
  return localeFromRequest(req) === "zh" ? API_ZH[english] ?? english : english;
}
