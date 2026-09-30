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
  "Too many requests — slow down and try again shortly.": "请求较频繁，请稍后再试。",
  // auth
  "invalid request": "请求无效。",
  "invalid or expired reset link": "重置链接无效或已过期。",
  "not allowed": "当前操作未获授权。",
  "current password is incorrect": "当前密码不正确。",
  "invalid username/code or password": "用户名、账户代码或密码不正确。",
  "we couldn't verify that account and email combination": "账户信息与邮箱不匹配，请核对后重试。",
  "password required": "请输入密码。",
  "password is incorrect": "密码不正确。",
  "account already claimed": "该账户已被认领。",
  "username taken": "该用户名已被使用。",
  "email already in use": "该邮箱已被使用。",
  // claim form validation, one sentence per field
  "username: 2–30 characters — letters, numbers, and . _ - only, and not an email address":
    "用户名需为 2–30 个字符，仅可包含字母、数字及 . _ -，不能使用邮箱地址。",
  "password: at least 6 characters": "密码至少需要 6 个字符。",
  "email: that doesn't look like an email address": "邮箱格式不正确，请核对。",
  // community, questions, outfits, follows, reports
  "not found": "未找到相关内容。",
  "bad request": "请求无效。",
  "only the asker can accept an answer": "只有提问者可以采纳回答。",
  "no such answer": "未找到该回答。",
  "Claim an account to ask the community.": "认领账户后，即可向社区提问。",
  "unknown post kind": "无法识别这类帖子。",
  "that item isn't in your closet": "这件衣物不在你的衣橱中。",
  "Claim an account to answer.": "认领账户后，即可回答问题。",
  "id required": "缺少内容编号。",
  "you can't vote for your own answer": "无法为自己的回答投票。",
  "Claim an account to follow people.": "认领账户后，即可关注他人。",
  "cannot follow yourself": "无法关注自己。",
  "read-only — password required to edit": "当前为只读状态，输入密码后即可编辑。",
  "you can't like your own look": "无法为自己的搭配点赞。",
  "read-only — password required": "当前为只读状态，请输入密码。",
  "unknown kind or reason": "无法识别内容类型或举报理由。",
  "that's your own content — delete it instead": "这是你发布的内容，可直接删除。",
  "Claim an account to block people.": "认领账户后，即可屏蔽他人。",
  "you can't block yourself": "无法屏蔽自己。",
};

/** The sentence in the requester's language (English when there is no Chinese for it). */
export function say(req: Request, english: string): string {
  return localeFromRequest(req) === "zh" ? API_ZH[english] ?? english : english;
}
