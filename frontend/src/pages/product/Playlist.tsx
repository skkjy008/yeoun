import { useState } from 'react';
import { musicApi } from '../../api/endpoints';
import type { Track } from '../../api/types';
import styles from './ProductDetailPage.module.css';

const youtubeSearch = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
const spotifySearch = (q: string) => `https://open.spotify.com/search/${encodeURIComponent(q)}`;

/**
 * 음악 추천 파트. 트랙을 고르면 백엔드(/api/music/youtube)를 통해 YouTube 영상을 찾아 임베드합니다.
 * YouTube API 키가 없는 환경에서는 검색 결과 페이지로 연결합니다.
 */
export default function Playlist({ title, tracks }: { title: string; tracks: Track[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const query = (t: Track) => `${t.title} ${t.artist ?? ''}`.trim();

  const play = async (index: number) => {
    const track = tracks[index];
    if (!track) return;
    setActive(index);
    if (track.youtubeVideoId) {
      setEmbedUrl(`https://www.youtube-nocookie.com/embed/${track.youtubeVideoId}?autoplay=1`);
      return;
    }
    setLoading(true);
    try {
      const result = await musicApi.youtube(query(track));
      if (result.embedUrl) {
        setEmbedUrl(`${result.embedUrl}?autoplay=1`);
      } else {
        setEmbedUrl(null);
        window.open(result.searchUrl, '_blank', 'noopener');
      }
    } catch {
      setEmbedUrl(null);
      window.open(youtubeSearch(query(track)), '_blank', 'noopener');
    } finally {
      setLoading(false);
    }
  };

  const playlistQuery = tracks.map(query).slice(0, 2).join(' ');

  return (
    <div className={styles.playlist}>
      <div className={styles.playlistHead}>
        <div>
          <p className="latin">YEOUN LISTENING ROOM</p>
          <p className="serif">{title}</p>
        </div>
        <button className={styles.playButton} onClick={() => play(active ?? 0)} aria-label="첫 곡 미리 듣기">
          {loading ? '…' : '▷'}
        </button>
      </div>

      {embedUrl && (
        <div className={styles.player}>
          <iframe
            src={embedUrl}
            title={active !== null ? tracks[active]?.title : 'YouTube player'}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <ol className={styles.tracks}>
        {tracks.map((t, i) => (
          <li key={t.title}>
            <button className={active === i ? styles.activeTrack : ''} onClick={() => play(i)}>
              <span className={styles.trackNo}>{String(i + 1).padStart(2, '0')}</span>
              <span className={styles.trackInfo}>
                <span>{t.title}</span>
                <span>{t.artist}</span>
              </span>
              <span className={styles.trackArrow}>↗</span>
            </button>
          </li>
        ))}
      </ol>

      <div className={styles.services}>
        <a className="btn btn-ghost" href={youtubeSearch(playlistQuery)} target="_blank" rel="noreferrer">
          YouTube에서 찾기 ↗
        </a>
        <a className="btn btn-ghost" href={spotifySearch(playlistQuery)} target="_blank" rel="noreferrer">
          Spotify에서 찾기 ↗
        </a>
      </div>
      <p className="help">트랙을 누르면 YouTube 영상으로 함께 들을 수 있어요. · 큐레이션 예시</p>
    </div>
  );
}
