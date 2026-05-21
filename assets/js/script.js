        function openModal(element) {
            const modal = document.getElementById('imageModal');
            const modalImg = document.getElementById('modalTargetImg');
            const titleText = document.getElementById('modalTitle');
            const descText = document.getElementById('modalDescription');
            const targetImg = element.querySelector('img');

            modalImg.src = targetImg.src;
            modalImg.alt = targetImg.alt;
            titleText.innerText = targetImg.getAttribute('data-summary');
            descText.innerHTML = targetImg.getAttribute('data-desc');

            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            const modal = document.getElementById('imageModal');
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeModal();
            }
        });

document.addEventListener("DOMContentLoaded", () => {
    const music = document.getElementById("bg-music");
    const playBtn = document.getElementById("action-play");
    const prevBtn = document.getElementById("action-prev");
    const nextBtn = document.getElementById("action-next");
    const iconPlay = playBtn.querySelector(".icon-play");
    const iconPause = playBtn.querySelector(".icon-pause");
    
    const timeline = document.getElementById("track-timeline");
    const volumeControl = document.getElementById("volume-control");
    const timeCurrent = document.getElementById("time-current");
    const timeRemaining = document.getElementById("time-remaining");

    const playerTrigger = document.querySelector(".top-right-player-trigger");
    const miniPlayer = document.querySelector(".spotify-row.mini-player");
    const rowTitle = document.querySelector(".row-title");
    const rowArtist = document.querySelector(".row-artist");
    const rowLeft = document.querySelector(".row-left");

    const savedVolume = localStorage.getItem("music_volume");
    if (savedVolume !== null) {
        music.volume = parseFloat(savedVolume);
        volumeControl.value = savedVolume;
    } else {
        music.volume = 0.4;
        volumeControl.value = 0.4;
    }

    const savedTime = localStorage.getItem("music_timestamp");
    if (savedTime !== null) {
        music.currentTime = parseFloat(savedTime);
    }

    const formatTime = (secs) => {
        if (isNaN(secs) || secs < 0) return "0:00";
        const minutes = Math.floor(secs / 60);
        const seconds = Math.floor(secs % 60);
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };

    const updateUIState = () => {
        if (music.paused) {
            iconPlay.style.display = "block";
            iconPause.style.display = "none";
        } else {
            iconPlay.style.display = "none";
            iconPause.style.display = "block";
        }
    };

    const updateTimelineData = () => {
        if (!timeline.matches(":active")) {
            timeline.value = music.currentTime;
        }
        timeCurrent.textContent = formatTime(music.currentTime);
        
        if (!isNaN(music.duration)) {
            const remaining = music.duration - music.currentTime;
            timeRemaining.textContent = `-${formatTime(remaining)}`;
        }
    };

    const calculateExpandedWidth = () => {
        const textWrapper = document.createElement("div");
        textWrapper.style.position = "absolute";
        textWrapper.style.visibility = "hidden";
        textWrapper.style.display = "flex";
        textWrapper.style.flexDirection = "column";
        textWrapper.style.fontFamily = window.getComputedStyle(rowTitle).fontFamily;
        
        const titleClone = rowTitle.cloneNode(true);
        titleClone.style.whiteSpace = "nowrap";
        titleClone.style.display = "inline";
        titleClone.style.width = "auto";
        titleClone.style.overflow = "visible";
        
        const artistClone = rowArtist.cloneNode(true);
        artistClone.style.whiteSpace = "nowrap";
        artistClone.style.display = "inline";
        artistClone.style.width = "auto";
        artistClone.style.overflow = "visible";
        
        textWrapper.appendChild(titleClone);
        textWrapper.appendChild(artistClone);
        document.body.appendChild(textWrapper);
        
        const maxTextWidth = Math.max(titleClone.getBoundingClientRect().width, artistClone.getBoundingClientRect().width);
        document.body.removeChild(textWrapper);

        const artworkWidth = 48;
        const layoutGap = 12;
        const calculatedLeftWidth = maxTextWidth + artworkWidth + layoutGap + 4; 

        const controlsWidth = 120; 
        const containerPadding = 40; 
        const totalGap = 16; 

        return Math.max(340, calculatedLeftWidth + controlsWidth + containerPadding + totalGap);
    };

    playerTrigger.addEventListener("mouseenter", () => {
        const targetWidth = calculateExpandedWidth();
        miniPlayer.style.width = `${targetWidth}px`;
        rowLeft.style.width = "auto";
    });

    playerTrigger.addEventListener("mouseleave", () => {
        miniPlayer.style.width = "340px";
        rowLeft.style.width = "170px";
    });

    music.addEventListener("loadedmetadata", () => {
        timeline.max = music.duration;
        updateTimelineData();
    });

    music.addEventListener("timeupdate", () => {
        updateTimelineData();
        localStorage.setItem("music_timestamp", music.currentTime);
    });

    timeline.addEventListener("input", () => {
        music.currentTime = timeline.value;
        timeCurrent.textContent = formatTime(timeline.value);
        if (!isNaN(music.duration)) {
            timeRemaining.textContent = `-${formatTime(music.duration - timeline.value)}`;
        }
    });

    volumeControl.addEventListener("input", () => {
        music.volume = volumeControl.value;
        localStorage.setItem("music_volume", volumeControl.value);
    });

    playBtn.addEventListener("click", () => {
        if (music.paused) {
            music.play().catch(() => {});
        } else {
            music.pause();
        }
    });

    const restartTrack = () => {
        music.currentTime = 0;
        timeline.value = 0;
        if (!music.paused) {
            music.play().catch(() => {});
        } else {
            updateTimelineData();
        }
    };

    prevBtn.addEventListener("click", restartTrack);
    nextBtn.addEventListener("click", restartTrack);

    music.addEventListener("play", () => {
        updateUIState();
        localStorage.setItem("music_state", "playing");
    });
    
    music.addEventListener("pause", () => {
        updateUIState();
        localStorage.setItem("music_state", "paused");
    });

    if (music.duration) {
        timeline.max = music.duration;
        updateTimelineData();
    }

    updateUIState();

    const musicState = localStorage.getItem("music_state");
    if (musicState === null || musicState === "playing") {
        const forcePlayAudio = () => {
            const playPromise = music.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    updateUIState();
                }).catch(() => {
                    const fallbackPlay = () => {
                        music.play().then(() => {
                            updateUIState();
                        }).catch(() => {});
                        document.removeEventListener("click", fallbackPlay);
                        document.removeEventListener("keydown", fallbackPlay);
                        document.removeEventListener("mousemove", fallbackPlay);
                    };
                    document.addEventListener("click", fallbackPlay);
                    document.addEventListener("keydown", fallbackPlay);
                    document.addEventListener("mousemove", fallbackPlay);
                });
            }
        };

        if (document.readyState === "complete") {
            forcePlayAudio();
        } else {
            window.addEventListener("load", forcePlayAudio);
        }
    }
});