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

document.addEventListener('DOMContentLoaded', () => {
    const termInput = document.getElementById('term-input');
    const termOutput = document.getElementById('term-output');

    if (!termInput || !termOutput) return;

    let currentDir = 'home';
    let gameActive = false;
    let targetNumber = 0;
    let guessAttempts = 0;

    const filesystem = {
        'home': {
            'dirs': ['games', 'secret_files'],
            'files': ['about_me.txt']
        },
        'games': {
            'dirs': [],
            'files': ['ultrakill.cfg', 'undertale.sav']
        },
        'secret_files': {
            'dirs': [],
            'files': ['passwords.hash']
        }
    };

    const commands = {
        'help': () => [
            'Available commands:',
            '  <span class="term-highlight">ls</span>         - List files and folders',
            '  <span class="term-highlight">cd &lt;dir&gt;</span>   - Change directory (e.g., cd games, cd ..)',
            '  <span class="term-highlight">cat &lt;file&gt;</span> - Read a file text content',
            '  <span class="term-highlight">guess</span>      - Play a number guessing game',
            '  <span class="term-highlight">clear</span>      - Clear terminal window logs',
            '  <span class="term-highlight">ultrakill</span>  - Execute system protocol 1229490',
            '  <span class="term-highlight">undertale</span>  - Check soul status parameters'
        ].join('<br>'),

        'ls': () => {
            const dirData = filesystem[currentDir];
            const styledDirs = dirData.dirs.map(d => `<span class="term-highlight">${d}/</span>`);
            const allItems = [...styledDirs, ...dirData.files];
            return allItems.length > 0 ? allItems.join('   ') : 'Directory is empty.';
        },

        'cat': (filename) => {
            if (!filename) return '<span class="term-error">Usage: cat &lt;filename&gt;</span>';
            
            const fileContentMap = {
                'about_me.txt': 'Hey there! I am a developer from the Netherlands building dynamic web spaces, Discord bots, and small interactive games.',
                'ultrakill.cfg': 'bind m1 +attack<br>bind space +jump<br>screen_shake=false<br>blood_splatter=max',
                'undertale.sav': 'LV: 01<br>GOLD: 9999<br>SAVEPOINT: The Judgment Hall',
                'passwords.hash': '$2b$12$eImiTXuWVxfM37uY4JANjOqZzH1F1sD2bU01B.fXmR8Y4bCgGzG7q [ENCRYPTED UNTIL ROOT ACCESS]'
            };

            if (filesystem[currentDir].files.includes(filename)) {
                return fileContentMap[filename] || 'Empty file.';
            }
            return `<span class="term-error">cat: ${filename}: No such file found in this directory.</span>`;
        },

        'guess': () => {
            gameActive = true;
            targetNumber = Math.floor(Math.random() * 100) + 1;
            guessAttempts = 0;
            return '<span class="term-highlight">Guessing Game Activated!</span><br>I chose a number between 1 and 100. Type your guess directly into the prompt (e.g. 50).';
        },

        'clear': () => {
            termOutput.innerHTML = '';
            return '';
        },

        'ultrakill': () => 'MANKIND IS DEAD. BLOOD IS FUEL. HELL IS FULL.',
        'undertale': () => '❤ Stay determined.'
    };

    termInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            if (gameActive) return;
            
            const currentInputValue = termInput.value.trim();
            if (!currentInputValue) return;

            const inputParts = currentInputValue.split(/\s+/);
            const primaryToken = inputParts[0].toLowerCase();
            const targetedArg = inputParts[1] || '';

            const availableCommandsList = Object.keys(commands).concat(['cd']);

            if (inputParts.length === 1) {
                const commandMatches = availableCommandsList.filter(c => c.startsWith(primaryToken));
                if (commandMatches.length === 1) {
                    termInput.value = commandMatches[0] + ' ';
                } else if (commandMatches.length > 1) {
                    termOutput.innerHTML += `<div>${commandMatches.join('    ')}</div>`;
                    termOutput.scrollTop = termOutput.scrollHeight;
                }
            } else if (inputParts.length === 2 && (primaryToken === 'cd' || primaryToken === 'cat')) {
                const currentDirectoryStructure = filesystem[currentDir];
                let structuralSuggestions = [];

                if (primaryToken === 'cd') {
                    structuralSuggestions = currentDirectoryStructure.dirs;
                } else if (primaryToken === 'cat') {
                    structuralSuggestions = currentDirectoryStructure.files;
                }

                const argumentMatches = structuralSuggestions.filter(item => item.startsWith(targetedArg));
                if (argumentMatches.length === 1) {
                    termInput.value = `${primaryToken} ${argumentMatches[0]}`;
                } else if (argumentMatches.length > 1) {
                    termOutput.innerHTML += `<div>${argumentMatches.join('    ')}</div>`;
                    termOutput.scrollTop = termOutput.scrollHeight;
                }
            }
        }

        if (e.key === 'Enter') {
            const rawInput = termInput.value.trim();
            termInput.value = '';

            if (rawInput === '') return;

            const promptSymbol = gameActive ? '?' : (currentDir === 'home' ? '~$' : `/${currentDir}$`);
            termOutput.innerHTML += `<div><span style="color: #89b4fa">guest@tolek-page:${promptSymbol}</span> ${rawInput}</div>`;

            if (gameActive) {
                const guessInt = parseInt(rawInput, 10);
                if (isNaN(guessInt)) {
                    termOutput.innerHTML += '<div><span class="term-error">Error: Enter a valid number integer.</span></div>';
                } else {
                    guessAttempts++;
                    if (guessInt === targetNumber) {
                        termOutput.innerHTML += `<div><span class="term-highlight">YOU WIN!</span> Target cracked: ${targetNumber} in ${guessAttempts} attempts!</div>`;
                        gameActive = false;
                    } else if (guessInt < targetNumber) {
                        termOutput.innerHTML += '<div>Higher! Value target parameter matches are <span class="term-highlight">HIGHER</span>.</div>';
                    } else {
                        termOutput.innerHTML += '<div>Lower! Value target parameter matches are <span class="term-highlight">LOWER</span>.</div>';
                    }
                }
                termOutput.scrollTop = termOutput.scrollHeight;
                return;
            }

            const parts = rawInput.split(/\s+/);
            const cmd = parts[0].toLowerCase();
            const arg = parts[1];

            let response = '';

            if (cmd === 'cd') {
                if (!arg || arg === '~' || (arg === '..' && currentDir !== 'home')) {
                    currentDir = 'home';
                    response = 'Moved back to home directory.';
                } else if (filesystem[currentDir] && filesystem[currentDir].dirs.includes(arg)) {
                    currentDir = arg;
                    response = `Moved to /${arg}.`;
                } else if (arg === '..') {
                    currentDir = 'home';
                    response = 'Moved back to home directory.';
                } else {
                    response = `<span class="term-error">cd: no such directory structure layout exists: ${arg}</span>`;
                }
            } else if (cmd === 'cat') {
                response = commands.cat(arg);
            } else if (commands[cmd]) {
                response = commands[cmd]();
            } else {
                response = `<span class="term-error">Command not found: ${cmd}. Type "help" for items list.</span>`;
            }

            if (response) {
                termOutput.innerHTML += `<div>${response}</div>`;
            }

            termOutput.scrollTop = termOutput.scrollHeight;
        }
    });

    document.querySelector('.terminal-body').addEventListener('click', () => {
        termInput.focus();
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('sidebar-canvas');
    const clearBtn = document.getElementById('canvas-clear');
    const weightSlider = document.getElementById('canvas-weight');
    const colorPickers = document.querySelectorAll('.color-picker');

    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let strokeColor = '#40a02b'; 
    let pixelSize = 4; 

    function resizeCanvas() {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = 200; 
        
        ctx.imageSmoothingEnabled = false;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
        
        const rawX = clientX - rect.left;
        const rawY = clientY - rect.top;
        
        return {
            x: Math.floor(rawX / pixelSize) * pixelSize,
            y: Math.floor(rawY / pixelSize) * pixelSize
        };
    }

    function colorPixel(pos) {
        ctx.fillStyle = strokeColor;
        ctx.fillRect(pos.x, pos.y, pixelSize, pixelSize);
    }

    function startDrawing(e) {
        isDrawing = true;
        const pos = getMousePos(e);
        colorPixel(pos);
    }

    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault(); 

        const pos = getMousePos(e);
        colorPixel(pos);
    }

    function stopDrawing() {
        isDrawing = false;
    }

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDrawing);

    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    window.addEventListener('touchend', stopDrawing);

    clearBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    weightSlider.addEventListener('input', (e) => {
        pixelSize = parseInt(e.target.value, 10);
    });

    colorPickers.forEach(picker => {
        picker.addEventListener('click', () => {
            colorPickers.forEach(p => p.style.borderColor = 'transparent');
            picker.style.borderColor = '#4c4f69';
            strokeColor = picker.getAttribute('data-color');
        });
    });
});