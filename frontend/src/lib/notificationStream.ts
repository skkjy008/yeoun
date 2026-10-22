import { tokenStore } from '../api/client';
import type { NotificationItem } from '../api/types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

interface Handlers {
  onConnected?: (unreadCount: number) => void;
  onNotification: (item: NotificationItem) => void;
}

/**
 * 실시간 알림 구독 (Server-Sent Events).
 * EventSource는 Authorization 헤더를 보낼 수 없어 fetch 스트림으로 직접 읽습니다.
 * 연결이 끊기면 점점 간격을 늘려 다시 연결합니다. 반환 함수를 부르면 구독을 끝냅니다.
 */
export function subscribeNotifications({ onConnected, onNotification }: Handlers): () => void {
  let stopped = false;
  let controller: AbortController | null = null;
  let retry = 2000;
  let timer: number | undefined;

  const dispatch = (block: string) => {
    let event = 'message';
    const data: string[] = [];
    block.split('\n').forEach((line) => {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
    });
    if (data.length === 0) return;
    try {
      const payload = JSON.parse(data.join('\n'));
      if (event === 'connected') onConnected?.(payload.unreadCount ?? 0);
      if (event === 'notification') onNotification(payload as NotificationItem);
    } catch {
      /* 형식이 맞지 않는 이벤트는 무시합니다. */
    }
  };

  const connect = async () => {
    const token = tokenStore.get();
    if (stopped || !token) return;
    controller = new AbortController();
    try {
      const response = await fetch(`${BASE_URL}/api/notifications/stream`, {
        headers: { Accept: 'text/event-stream', Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      if (!response.ok || !response.body) throw new Error(String(response.status));
      retry = 2000;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
        let index = buffer.indexOf('\n\n');
        while (index >= 0) {
          dispatch(buffer.slice(0, index));
          buffer = buffer.slice(index + 2);
          index = buffer.indexOf('\n\n');
        }
      }
    } catch {
      /* 아래에서 재연결 */
    }
    if (!stopped) {
      timer = window.setTimeout(connect, retry);
      retry = Math.min(retry * 2, 60_000);
    }
  };

  void connect();
  return () => {
    stopped = true;
    window.clearTimeout(timer);
    controller?.abort();
  };
}
