/** Explain network and filesystem failures without exposing request URLs. */
export function describeError(error: unknown): string {
  if (!(error instanceof Error)) return "Неизвестная ошибка";

  const cause = error.cause as { code?: string; errors?: Array<{ code?: string }> } | undefined;
  const code = cause?.code ?? cause?.errors?.[0]?.code ?? (error as NodeJS.ErrnoException).code;

  switch (code) {
    case "ENOTFOUND": case "EAI_AGAIN": return "Не удалось определить адрес сервера (DNS)";
    case "ECONNRESET": case "UND_ERR_SOCKET": case "EPIPE": return "Сервер разорвал соединение";
    case "ETIMEDOUT": case "UND_ERR_CONNECT_TIMEOUT": case "UND_ERR_HEADERS_TIMEOUT": case "UND_ERR_BODY_TIMEOUT":
      return "Превышено время ожидания ответа сервера";
    case "ECONNREFUSED": return "Сервер отклонил соединение";
    case "CERT_HAS_EXPIRED": case "UNABLE_TO_VERIFY_LEAF_SIGNATURE": case "DEPTH_ZERO_SELF_SIGNED_CERT":
      return "Не удалось проверить сертификат сервера";
    case "EACCES": case "EPERM": return "Нет доступа к файлу или каталогу";
    case "ENOSPC": return "Недостаточно места на диске";
    case "ERR_INVALID_URL": return "Некорректная ссылка на отчёт";
    case "ERR_PARSE_ARGS_UNKNOWN_OPTION": case "ERR_PARSE_ARGS_INVALID_OPTION_VALUE":
      return "Неверные параметры команды. Справка: npm run download -- --help";
  }

  if (error.name === "TimeoutError" || error.name === "AbortError") return "Превышено время ожидания загрузки";
  if (error instanceof SyntaxError) return "Сервис вернул некорректные данные";
  if (error.message === "terminated") return "Загрузка прервана сервером";
  if (error.message === "fetch failed") return "Не удалось подключиться к серверу" + (code ? ` (${code})` : "");
  return error.message;
}
