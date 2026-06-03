const HERO_VIDEO_ID = 'hUOfC2ilXak';

let heroPlayer;
let loopWatcher;

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
        startLoopWatcher(event.target);
      },
      onStateChange: event => {
        if (event.data === YT.PlayerState.ENDED) {
          restartHeroVideo(event.target);
        }
      }
    }
  });
}

function restartHeroVideo(player) {
  player.seekTo(0, true);
  player.playVideo();
}

function startLoopWatcher(player) {
  clearInterval(loopWatcher);

  loopWatcher = setInterval(() => {
    const duration = player.getDuration?.() || 0;
    const currentTime = player.getCurrentTime?.() || 0;

    if (duration > 0 && currentTime >= duration - 0.4) {
      restartHeroVideo(player);
    }
  }, 500);
}

window.onYouTubeIframeAPIReady = createHeroPlayer;
loadYouTubeApi();
