(() => {
  const root = globalThis;
  const VSC = root.__VSC__ || (root.__VSC__ = {});
  const { CONFIG, ContentState, Storage } = VSC;

  function findAllVideos() {
    return document.querySelectorAll('video');
  }

  function findActiveVideo() {
    const videos = Array.from(findAllVideos());
    if (videos.length === 0) return null;
    if (videos.length === 1) return videos[0];

    const focusedVideo = videos.find((video) => (
      document.activeElement === video || video.contains(document.activeElement)
    ));
    if (focusedVideo) return focusedVideo;

    const playingVideo = videos.find((video) => !video.paused);
    if (playingVideo) return playingVideo;

    return videos[0];
  }

  function setSpeed(video, speed) {
    if (!video) return null;

    const clampedSpeed = Storage.clamp(
      speed,
      CONFIG.MIN_PLAYBACK_SPEED,
      CONFIG.MAX_PLAYBACK_SPEED
    );

    video.playbackRate = clampedSpeed;
    ContentState.lastRateByVideo.set(video, clampedSpeed);
    return clampedSpeed;
  }

  function changeSpeed(video, delta) {
    if (!video) return null;
    return setSpeed(video, video.playbackRate + delta);
  }

  function togglePreferredSpeed(video) {
    if (!video) return null;

    const currentSpeed = video.playbackRate;
    const preferredSpeed = ContentState.preferredSpeed;

    if (Math.abs(currentSpeed - preferredSpeed) < CONFIG.TOGGLE_EPSILON) {
      return setSpeed(video, CONFIG.NORMAL_SPEED);
    }

    return setSpeed(video, preferredSpeed);
  }

  function restoreSpeed(video) {
    if (!video) return;

    const lastRate = ContentState.lastRateByVideo.get(video);
    if (typeof lastRate === 'number' && video.playbackRate !== lastRate) {
      video.playbackRate = lastRate;
    }
  }

  VSC.VideoController = {
    findAllVideos,
    findActiveVideo,
    setSpeed,
    changeSpeed,
    togglePreferredSpeed,
    restoreSpeed
  };
})();
