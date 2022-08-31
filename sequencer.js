////// AUDIO CONTEXT ///////////////////
const audioCtx = new AudioContext();

// Before we do anything more, let's grab our checkboxes from the interface. 
//We want to keep them in the groups they are in as each row represents a different sound or _voice_

const pads = document.querySelectorAll('.pads'); 


/////////// SWEEP SOUND/////////////
/* 
Using the oscillator to create unique waveform using the PERIODICWAVE interface 
Can use the PeriodicWave() constructor to use this custom wave with an oscillator 
*/

///// Creating the periodic wave ///////////////
const wave = new PeriodicWave(audioCtx, {
    real: wavetable.real,
    imag: wavetable.imag
});

////// create an OscillatorNode and set it's wave to the wave created above ///////////
const sweepLength = 2;

function playSweep(time) {
    const osc = new OscillatorNode(audioCtx, {
        frequency: 380,
        type: "custom",
        periodicWave: wave
    });

    const sweepEnv = new GainNode(audioCtx);
    sweepEnv.gain.cancelScheduledValues(time);
    sweepEnv.gain.setValueAtTime(0, time);
    sweepEnv.gain.linearRampToValueAtTime(1, time + attackTime);
    sweepEnv.gain.linearRampToValueAtTime(
        0,
        time + sweepLength - releaseTime
    );


    osc.connect(sweepEnv).connect(audioCtx.destination);
    osc.start(time);
    osc.stop(time + sweepLength);
};

/////// AMPLITUDE ENVELOPE //////////////////
let attackTime = 0.2;
const attackControl = document.querySelector('#attack');

attackControl.addEventListener('input', function (e) {
    attackTime = parseInt(e.target.value, 10);
}, false);

let releaseTime = 0.5;
const releaseControl = document.querySelector('#release');

releaseControl.addEventListener(
    'input', (e) => {
        releaseTime = parseInt(e.target.value, 10);
    }, false
);
////////////////////////////////////////////////////////////////////////////////////////
///////// PULSE / LFO modulation ////////////////////////////
const pulseTime = 1;

function playPulse(time) {
    const osc = new OscillatorNode(audioCtx, {
        type: "sine",
        frequency: pulseHz,
    });
    // creating a GainNode as the gain will be controlled by LFO
    const amp = new GainNode(audioCtx, {
        value: 1,
    });

    //// Square wave oscillator to modulate the Sine Wave /////////////
    const lfo = new OscillatorNode(audioCtx, {
        type: "square",
        frequency: 30,
    });

    /// Connecting the graph : connect the graph correctly and start both oscillators 
    lfo.connect(amp.gain);
    osc.connect(amp).connect(audioCtx.destination);
    lfo.start();
    osc.start(time);
    osc.stop(time + pulseTime);
}

//// Event handlers for pulse/lfo /////////
let pulseHz = 880;
const hzControl = document.querySelector('#hz');

hzControl.addEventListener('input', (e) => {
    pulseHz = parseInt(ev.target.value, 10);
}, false);

let lfoHz = 30;
const lfoControl = document.querySelector('#lfo');

lfoControl.addEventListener('input', (e) => {
    lfoHz = parseInt(ev.target.value, 10);
}, false);

/////////////////////////////////////////////////////////////////////////////////////////
////// NOISE ///////////////////
function playNoise(time) {
    /// First create an empty AudioBuffer object and fill with data 
    const bufferSize = audioCtx.sampleRate * noiseDuration; // set the time of the note 

    // create the empty buffer 
    const noiseBuffer = new AudioBuffer({
        length: bufferSize,
        sampleRate: audioCtx.sampleRate
    });

    // Fill the buffer with noise 
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    // Create a buffer source for our created data 
    const noise = new AudioBufferSourceNode(audioCtx, {
        buffer: noiseBuffer
    });

    // connect through the audio graph and play it 
    noise.connect(audioCtx.destination);
    noise.start();

    /////// ROUTING THE NOISE THROUGH A FILTER ////////////////
    //The Web Audio API comes with two types of filter nodes: BiquadFilterNode and IIRFilterNode. 
    /// Using a BiquadFilterNode here. Contains: lowpass, hipass and bandpass////////////

    // Filter the output
    const bandpass = new BiquadFilterNode(audioCtx, {
        type: "bandpass",
        frequency: bandHz
    });

    // connect our graph 
    noise.connect(bandpass).connect(audioCtx.destination);
}

/// User Controls ///////////////////////////////////
let noiseDuration = 1;
const durControl = document.querySelector('#duration');

durControl.addEventListener('input', (e) => {
    noiseDuration = parseInt(e.target.value, 10);
}, false
);

let bandHz = 1000;
const bandControl = document.querySelector('#band');

bandControl.addEventListener('input', (e) => {
    bandH = parseInt(e.target.value, 10);
}, false
);

////////////// DIAL-UP NOISE //////////////////////////////
// Loading the sample using an async function 
async function getFile(audioContext, filepath) {
    const response = await fetch(filepath);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await
        audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
}

/// 2nd async function to setup the sample 
async function setupSample() {
    const filePath = 'dtmf.mp3';
    const sample = await getFile(audioCtx, filePath);
    return sample
}
/*
You can easily modify the above function to take an array of files and loop over them to load more than one sample. 
This technique would be convenient for more complex instruments or gaming.
*/

setupSample().then((sample) => {
    // sample is our buffered file 
});

// When the sample is ready to play, the program sets up the UI, so it is ready to go.

function playSample(audioContext, audioBuffer, time) {
    // create an AudioBufferSourceNode 
    const sampleSource = new AudioBufferSourceNode(audioCtx, {
        buffer: audioBuffer,
        playbackRate,
    });

    sampleSource.connect(audioContext.destination);
    sampleSource.start(time);
    return sampleSource;
    // insert the buffer data being fetched and decoded above 
}
// Don't need to call stop() because the sample will stop automatically 

///// DIAL UP USER CONTROLS ///////////////////////////////////
//////////////////////////////////////////////////////////////
let playbackRate = 1;
const rateControl = document.querySelector('#rate');

rateControl.addEventListener('input', (e) => {
    playbackRate = parseInt(e.target.value, 10);
}, false
);

//////// MASTER TEMPO CONTROLS ///////////////////
////////////////////////////////////////////////////////////////
let tempo = 60.0;
const bpmControl = document.querySelector('#bpm');

bpmControl.addEventListener('input', (e)=> {
    tempo = parseInt(e.target.value, 10);
}, false
);

////// variables to define how far ahead we want to look 
//and how far ahead we want to schedule

const lookahead = 25.0; // How frequently to call scheduling function (in milliseconds)
const scheduleAheadTime = 0.1; // How far ahead to schedule audio (seconds)

// function that moves the note forwards by one beat and loops back 
// when it reaches the 4th (4/4 time)

let currentNote = 0; 
let nextNoteTime = 0.0; // when the next note is due

function nextNote() {
    const secondsPerBeat = 60.0 / tempo; 

    nextNoteTime += secondsPerBeat; // add beat length to last beat time 

    // Advance the beat number, wrap to zero when reaching 4
    currentNote = (currentNote+1) % 4;
}

// create a reference queue for the notes that are to be played
// and the functionality to play them using the functions we've previously created:

const notesInQueue = [];

function scheduleNote(beatNumber, time) {
    // Push the note on the queue even if not playing 
    notesInQueue.push({note: beatNumber, time});

    if (pads[0].querySelectorAll('input')[beatNumber].checked) {
        playSweep(time);
    }
    if (pads[1].querySelectorAll('input')[beatNumber].checked) {
        playPulse(time);
    }
    if (pads[2].querySelectorAll('input')[beatNumber].checked) {
        playNoise(time);
    }
    if (pads[3].querySelectorAll('input')[beatNumber].checked) {
        playSample(time);
    }
};

///////////////////////////////////////////////////////////
//  look at the current time and compare it to the time for the following note; 
// when the two match, it will call the previous two functions.

/*
AudioContext object instances have a currentTime property, 
which allows us to retrieve the number of seconds after we first created the context. 
We will use it for timing within our step sequencer. 
It's extremely accurate, returning a float value accurate to about 15 decimal places.
*/

let timeID;

function scheduler() {
    // While there are notes that will need to play before the next interval,
    // schedule them and advance the pointer 
    while (nextNoteTime < audioCtx.currentTime + scheduleAheadTime) {
        scheduleNote(currentNote, nextNoteTime);
        nextNote();
    }
    timeID = setTimeout(scheduler, lookahead);
}

///// draw() function to update the UI, so we can see when the beat progresses ///////////////
let lastNoteDrawn = 3;

function draw() {
    let drawNote = lastNoteDrawn;
    const currentTime = audioCtx.currentTime;

    while (notesInQueue.length && notesInQueue[0].time < currentTime) {
        drawNote = notesInQueue[0].note;
        notesInQueue.shift(); // remove note from queue
    }

    // Only needs to draw if the note has moved 
    if (lastNoteDrawn !== drawNote) {
        pads.forEach((pad) => {
            pad.children[lastNoteDrawn*2].style.borderColor = 'var(--black)';
            pad.children[drawNote*2].style.borderColor = 'var(--yellow)';
        });

        lastNoteDrawn = drawNote;
    }
    // Set up to draw again
    requestAnimationFrame(draw);
}

//////// Loading function to wait for sample to load. ////////
// when loaded allow play ///////

const loadingEl = document.querySelector('.loading');
const playButton = document.querySelector('#playBtn');
let isPlaying = false;

setupSample().then((sample) => {
    loadingEl.style.display = "none";

    dtmf = sample; // to be used in the  playSample function

    playButton.addEventListener("click", (e) => {
        isPlaying = !isPlaying;

        if (isPlaying) {
            // Start playing 

            // Check if context is in suspended state (autoplay policy)
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            currentNote = 0;
            nextNoteTime = audioCtx.currentTime;
            scheduler(); // kick off scheduling 
            requestAnimationFrame(draw); // start the drawing loop
            e.target.dataset.playing = "true";
        } else {
            clearTimeout(timerID); 
            e.target.dataset.playing = "false";
        }
    });
});