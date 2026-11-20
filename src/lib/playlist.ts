// Convierte un enlace de playlist (Spotify o YouTube) en su versión para incrustar.
export function playlistEmbed(url: string | null): string | null {
  if (!url) return null;
  const spotify = url.match(/open\.spotify\.com\/playlist\/([A-Za-z0-9]+)/);
  if (spotify) return `https://open.spotify.com/embed/playlist/${spotify[1]}`;
  const yt = url.match(/[?&]list=([\w-]+)/);
  if (yt) return `https://www.youtube-nocookie.com/embed/videoseries?list=${yt[1]}`;
  return null;
}
