const HERO_VIDEO_ID = 'hUOfC2ilXak';

let heroPlayer;

function loadYouTubeApi() {
  if (window.YT?.Player) {
    createHeroPlayer();
    return;
  }

  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
}

function createHeroPlayer() {
  heroPlayer = new YT.Player('hero-player', {
    width: '100%',
    height: '100%',
    videoId: HERO_VIDEO_ID,
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      loop: 1,
      modestbranding: 1,
      mute: 1,
      playlist: HERO_VIDEO_ID,
      playsinline: 1,
      rel: 0
    },
    events: {
      onReady: event => {
        event.target.mute();
        event.target.playVideo();
      },
      onStateChange: event => {
        if (event.data === YT.PlayerState.ENDED) {
          event.target.seekTo(0);
          event.target.playVideo();
        }
      }
    }
  });
}

window.onYouTubeIframeAPIReady = createHeroPlayer;
loadYouTubeApi();
