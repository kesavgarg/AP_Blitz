/** Same-origin relative path. Rejects protocol-relative, backslash, and control characters. */
export function safeNextPath(next: string, role: string) {
  if (!next || next.length > 200) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  if (next.includes("\\") || next.includes("://") || /[\u0000-\u001F]/.test(next)) return null;
  let decoded = next;
  try {
    decoded = decodeURIComponent(next);
  } catch {
    return null;
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return null;
  if (decoded.includes("\\") || decoded.includes("://") || /[\u0000-\u001F]/.test(decoded)) return null;
  if (role === "BLITZER" && (decoded.startsWith("/workspace") || decoded.startsWith("/admin"))) return null;
  if (role !== "BLITZER" && decoded.startsWith("/student")) return null;
  return decoded;
}
