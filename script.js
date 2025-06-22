// script.js

document.addEventListener('DOMContentLoaded', () => {
    // Audio element for timer completion sound
    const timerAudio = document.getElementById('timer-audio');

    // DOM references for screens and shared controls
    const setupScreen = document.getElementById('setup-screen');
    const screensContainer = document.getElementById('screens-container'); // Parent container for all dynamic screens

    const durationSelect = document.getElementById('duration-select');
    const setTimerButton = document.getElementById('set-timer-btn');

    // Back buttons on timer screens
    const backToSetupFocusBtn = document.getElementById('back-to-setup-focus');
    const backToSetupShortBreakBtn = document.getElementById('back-to-setup-short-break');
    const backToSetupLongBreakBtn = document.getElementById('back-to-setup-long-break');

    // Global state variables
    let activeTimerRunningMode = null; // Which timer is currently running (null if none)
    let currentIntervalId = null; // Stores the active timer's setInterval ID

    // Object to hold the state and DOM references for each timer mode
    const timers = {
        focus: {
            configuredDuration: 20 * 60, // Default duration, will be overwritten by selection
            timeLeft: 20 * 60,
            isPaused: true,
            displayMinElement: document.getElementById('focus-minutes'),
            displaySecElement: document.getElementById('focus-seconds'),
            playBtn: document.getElementById('focus-play-btn'),
            pauseBtn: document.getElementById('focus-pause-btn'),
            resetBtn: document.getElementById('focus-reset-btn'),
            screenElement: document.getElementById('focus-screen')
        },
        shortBreak: {
            configuredDuration: 5 * 60, // Default duration
            timeLeft: 5 * 60,
            isPaused: true,
            displayMinElement: document.getElementById('short-break-minutes'),
            displaySecElement: document.getElementById('short-break-seconds'),
            playBtn: document.getElementById('short-break-play-btn'),
            pauseBtn: document.getElementById('short-break-pause-btn'),
            resetBtn: document.getElementById('short-break-reset-btn'),
            screenElement: document.getElementById('short-break-screen')
        },
        longBreak: {
            configuredDuration: 45 * 60, // Default duration
            timeLeft: 45 * 60,
            isPaused: true,
            displayMinElement: document.getElementById('long-break-minutes'),
            displaySecElement: document.getElementById('long-break-seconds'),
            playBtn: document.getElementById('long-break-play-btn'),
            pauseBtn: document.getElementById('long-break-pause-btn'),
            resetBtn: document.getElementById('long-break-reset-btn'),
            screenElement: document.getElementById('long-break-screen')
        }
    };

    /**
     * Populates the duration dropdown with options from 1 to 60 minutes.
     */
    function populateDurationDropdown() {
        for (let i = 1; i <= 60; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${i} minutes`;
            durationSelect.appendChild(option);
        }
        // Set a default selected value, e.g., 25 minutes
        durationSelect.value = '25';
    }

    /**
     * Shows a specific screen by adding/removing CSS classes for visibility and opacity.
     * @param {HTMLElement} screenToShow - The DOM element of the screen to display.
     */
    function showScreen(screenToShow) {
        // Hide all screens first
        [setupScreen, timers.focus.screenElement, timers.shortBreak.screenElement, timers.longBreak.screenElement].forEach(screen => {
            screen.classList.add('opacity-0', 'hidden');
            screen.classList.remove('opacity-100');
        });

        // Show the requested screen
        screenToShow.classList.remove('opacity-0', 'hidden');
        screenToShow.classList.add('opacity-100');
    }

    /**
     * Updates the display for a specific timer mode.
     * @param {string} mode - The mode to update ('focus', 'shortBreak', 'longBreak').
     */
    function updateDisplay(mode) {
        const timer = timers[mode];
        if (!timer) return;

        const minutes = Math.floor(timer.timeLeft / 60);
        const seconds = timer.timeLeft % 60;

        timer.displayMinElement.textContent = String(minutes).padStart(2, '0');
        timer.displaySecElement.textContent = String(seconds).padStart(2, '0');
    }

    /**
     * Plays the audio.
     * It attempts to play, catching and logging any errors, especially autoplay blocks.
     */
    function playAudio() {
        if (timerAudio) {
            timerAudio.play().catch(e => {
                console.error("Error playing audio:", e);
                if (e.name === "NotAllowedError" || e.name === "AbortError") {
                    console.warn("Autoplay blocked by browser. User interaction is required for audio playback.");
                }
            });
        }
    }

    /**
     * Pauses the audio.
     */
    function pauseAudio() {
        if (timerAudio) {
            timerAudio.pause();
        }
    }

    /**
     * Stops and resets the audio to the beginning.
     */
    function stopAudio() {
        if (timerAudio) {
            timerAudio.pause();
            timerAudio.currentTime = 0;
        }
    }


    /**
     * Starts the timer for the activeTimerRunningMode.
     * @param {string} mode - The mode to start ('focus', 'shortBreak', 'longBreak').
     */
    function startTimer(mode) {
        const timer = timers[mode];
        if (!timer || !timer.isPaused) return;

        // Pause any currently running timer if one exists
        if (currentIntervalId) {
            clearInterval(currentIntervalId);
            currentIntervalId = null;
            if (activeTimerRunningMode && timers[activeTimerRunningMode]) {
                 timers[activeTimerRunningMode].isPaused = true;
            }
        }

        activeTimerRunningMode = mode; // Set the new active running timer
        timer.isPaused = false; // Set timer to running state

        playAudio(); // Play audio when the timer starts or resumes

        currentIntervalId = setInterval(() => {
            if (timer.timeLeft > 0) {
                timer.timeLeft--;
                updateDisplay(mode);
            } else {
                clearInterval(currentIntervalId);
                currentIntervalId = null;
                timer.isPaused = true;
                stopAudio(); // Stop audio when timer finishes
                // When timer finishes, return to setup screen
                activeTimerRunningMode = null; // No timer is running now
                showScreen(setupScreen);
                setTimerButton.disabled = false; // Re-enable button on setup screen
                durationSelect.disabled = false; // Re-enable dropdown on setup screen
            }
        }, 1000); // 1000 milliseconds = 1 second

        // Disable setup screen controls while a timer is running
        setTimerButton.disabled = true;
        durationSelect.disabled = true;
    }

    /**
     * Pauses the timer for a specific mode.
     * @param {string} mode - The mode to pause ('focus', 'shortBreak', 'longBreak').
     */
    function pauseTimer(mode) {
        const timer = timers[mode];
        if (!timer || timer.isPaused) return;

        clearInterval(currentIntervalId);
        currentIntervalId = null;
        timer.isPaused = true;

        pauseAudio(); // Pause audio when the timer is paused

        // Re-enable setup screen controls when paused
        setTimerButton.disabled = false;
        durationSelect.disabled = false;
    }

    /**
     * Resets the timer for a specific mode to its configured duration.
     * @param {string} mode - The mode to reset ('focus', 'shortBreak', 'longBreak').
     */
    function resetTimer(mode) {
        const timer = timers[mode];
        if (!timer) return;

        pauseTimer(mode); // Pause first to clear interval and audio
        timer.timeLeft = timer.configuredDuration; // Reset time based on current 'configuredDuration'
        updateDisplay(mode);

        stopAudio(); // Stop and reset audio completely on reset

        // Reset active running mode as timer is no longer running
        activeTimerRunningMode = null;
        // After reset, go back to setup screen
        showScreen(setupScreen);
        setTimerButton.disabled = false; // Re-enable button on setup screen
        durationSelect.disabled = false; // Re-enable dropdown on setup screen
    }

    // --- Event Listeners ---

    // Set Timer button on setup screen
    setTimerButton.addEventListener('click', () => {
        const selectedMinutes = parseInt(durationSelect.value);
        let modeToRun;

        if (selectedMinutes < 20) {
            modeToRun = 'shortBreak';
        } else if (selectedMinutes === 20) {
            modeToRun = 'focus';
        } else { // selectedMinutes > 20
            modeToRun = 'longBreak';
        }

        const timer = timers[modeToRun];
        timer.configuredDuration = selectedMinutes * 60; // Set configured duration
        timer.timeLeft = timer.configuredDuration; // Set countdown from configured duration
        updateDisplay(modeToRun); // Update timer display immediately

        showScreen(timer.screenElement); // Show the selected timer screen
        startTimer(modeToRun); // Start the timer, which will also play audio
    });

    // Individual timer control buttons (play, pause, reset)
    for (const mode in timers) {
        if (timers.hasOwnProperty(mode)) {
            const timer = timers[mode];
            timer.playBtn.addEventListener('click', () => startTimer(mode)); // Play will now also start audio
            timer.pauseBtn.addEventListener('click', () => pauseTimer(mode)); // Pause will also pause audio
            timer.resetBtn.addEventListener('click', () => resetTimer(mode)); // Reset will also stop audio
        }
    }

    // Back to setup buttons
    backToSetupFocusBtn.addEventListener('click', () => {
        if (activeTimerRunningMode) pauseTimer(activeTimerRunningMode); // Pause if running and audio
        showScreen(setupScreen);
        activeTimerRunningMode = null; // No timer is running
        setTimerButton.disabled = false; // Re-enable button on setup screen
        durationSelect.disabled = false; // Re-enable dropdown on setup screen
    });
    backToSetupShortBreakBtn.addEventListener('click', () => {
        if (activeTimerRunningMode) pauseTimer(activeTimerRunningMode);
        showScreen(setupScreen);
        activeTimerRunningMode = null;
        setTimerButton.disabled = false;
        durationSelect.disabled = false;
    });
    backToSetupLongBreakBtn.addEventListener('click', () => {
        if (activeTimerRunningMode) pauseTimer(activeTimerRunningMode);
        showScreen(setupScreen);
        activeTimerRunningMode = null;
        setTimerButton.disabled = false;
        durationSelect.disabled = false;
    });

    // Initial setup: Populate dropdown and show the setup screen
    populateDurationDropdown();
    showScreen(setupScreen);
});
