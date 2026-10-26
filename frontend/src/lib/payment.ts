import { useEffect, useRef, useState } from 'react';
import { paymentApi } from '../api/endpoints';
import type { PaymentConfig, PaymentRequest, PaymentResult } from '../api/types';

/**
 * 토스페이먼츠 결제위젯 v2 (https://docs.tosspayments.com)
 * - 키가 없으면 서버가 MOCK을 내려 주고, 결제창 없이 바로 모의 승인합니다.
 * - TOSS면 위젯으로 결제수단·약관을 그리고, requestPayment가 결제창 → successUrl/failUrl 로 이동합니다.
 */
const SDK_URL = 'https://js.tosspayments.com/v2/standard';

interface TossWidgets {
  setAmount(amount: { currency: 'KRW'; value: number }): Promise<void>;
  renderPaymentMethods(options: { selector: string; variantKey?: string }): Promise<unknown>;
  renderAgreement(options: { selector: string; variantKey?: string }): Promise<unknown>;
  requestPayment(options: {
    orderId: string;
    orderName: string;
    successUrl: string;
    failUrl: string;
    customerEmail?: string;
    customerName?: string;
  }): Promise<void>;
}

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => { widgets(options: { customerKey: string }): TossWidgets };
  }
}

let sdkLoading: Promise<void> | null = null;

function loadSdk() {
  if (window.TossPayments) return Promise.resolve();
  if (!sdkLoading) {
    sdkLoading = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SDK_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        sdkLoading = null;
        reject(new Error('토스페이먼츠 SDK를 불러오지 못했어요.'));
      };
      document.head.appendChild(script);
    });
  }
  return sdkLoading;
}

/** 결제위젯을 지정한 영역에 그립니다. amount가 바뀌면 위젯 금액도 맞춰 바꿉니다. */
export function useTossWidget(config: PaymentConfig | null, amount: number, methodsId: string, agreementId: string) {
  const widgetsRef = useRef<TossWidgets | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enabled = config?.provider === 'TOSS' && Boolean(config.clientKey) && Boolean(config.customerKey);

  useEffect(() => {
    if (!enabled || !config || amount <= 0 || widgetsRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        await loadSdk();
        const widgets = window.TossPayments!(config.clientKey!).widgets({ customerKey: config.customerKey! });
        await widgets.setAmount({ currency: 'KRW', value: amount });
        await Promise.all([
          widgets.renderPaymentMethods({ selector: `#${methodsId}`, variantKey: 'DEFAULT' }),
          widgets.renderAgreement({ selector: `#${agreementId}`, variantKey: 'AGREEMENT' }),
        ]);
        if (!cancelled) {
          widgetsRef.current = widgets;
          setReady(true);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '결제위젯을 불러오지 못했어요.');
      }
    })();
    return () => {
      cancelled = true;
    };
    // 위젯은 한 번만 그리고, 금액 변경은 아래 effect에서 처리합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, config, amount > 0]);

  useEffect(() => {
    if (ready && widgetsRef.current && amount > 0) void widgetsRef.current.setAmount({ currency: 'KRW', value: amount });
  }, [ready, amount]);

  return { enabled, ready, error, widgets: widgetsRef };
}

/**
 * 서버가 만든 결제(READY)를 진행합니다.
 * MOCK: 바로 승인 결과를 돌려줍니다. / TOSS: 결제창으로 이동하므로 돌아오지 않습니다(null).
 */
export async function proceedPayment(payment: PaymentRequest, widgets: TossWidgets | null): Promise<PaymentResult | null> {
  if (payment.provider === 'MOCK') {
    return paymentApi.confirm(`MOCK-${payment.orderKey}`, payment.orderKey, payment.amount);
  }
  if (!widgets) throw new Error('결제위젯이 아직 준비되지 않았어요.');
  await widgets.setAmount({ currency: 'KRW', value: payment.amount });
  const origin = window.location.origin;
  await widgets.requestPayment({
    orderId: payment.orderKey,
    orderName: payment.orderName,
    successUrl: `${origin}/payments/success`,
    failUrl: `${origin}/payments/fail`,
    customerEmail: payment.customerEmail,
    customerName: payment.customerName,
  });
  return null;
}

/** 결제 결과 → 이동할 화면 */
export function resultPath(result: PaymentResult) {
  return result.targetType === 'ORDER' ? `/orders/${result.targetId}/complete` : `/custom/${result.targetId}`;
}
