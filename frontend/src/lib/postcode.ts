/** 우편번호 검색 (카카오 우편번호 서비스). 스크립트를 처음 쓸 때만 불러옵니다. */
const SCRIPT_URL = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

interface PostcodeData {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  buildingName: string;
}

declare global {
  interface Window {
    daum?: { Postcode: new (options: { oncomplete: (data: PostcodeData) => void; onclose?: (state: string) => void }) => { open: () => void } };
  }
}

let loading: Promise<void> | null = null;

function loadScript() {
  if (window.daum?.Postcode) return Promise.resolve();
  if (!loading) {
    loading = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        loading = null;
        reject(new Error('postcode script failed'));
      };
      document.head.appendChild(script);
    });
  }
  return loading;
}

export async function openPostcode(): Promise<{ zipCode: string; address: string } | null> {
  await loadScript();
  return new Promise((resolve) => {
    new window.daum!.Postcode({
      oncomplete: (data) => {
        const address = data.roadAddress || data.jibunAddress;
        resolve({ zipCode: data.zonecode, address: data.buildingName ? `${address} (${data.buildingName})` : address });
      },
      onclose: (state) => {
        if (state === 'FORCE_CLOSE') resolve(null);
      },
    }).open();
  });
}
