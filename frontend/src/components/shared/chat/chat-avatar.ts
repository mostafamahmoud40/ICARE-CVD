/** Returns the stored profile photo URL, or empty string when none is set. */
export function resolveChatAvatarUrl(
  avatarUrl: string | null | undefined,
): string {
  return avatarUrl?.trim() ?? ""
}
