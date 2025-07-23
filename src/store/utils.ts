export const setActionError = (
  error: unknown,
  fallback: string,
  setter: (msg: string) => void
): string => {
  const message = error instanceof Error ? error.message : fallback
  setter(message)
  return message
}
