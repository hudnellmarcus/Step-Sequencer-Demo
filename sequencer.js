const audioCtx = new AudioContext();

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


////// NOISE ///////////////////
/// First create an empty AudioBuffer object and fill with data 
const bufferSize = audioCtx.sampleRate * noiseDuration;
// create the empty buffer 
const noiseBuffer = new AudioBuffer({
    length: bufferSize,
    sampleRate: audioCtx.sampleRate
});

// Fill the buffer with noise 
const data = noiseBuffer.getChannelData(0);
for (let i = 0; i < bufferSize; i++){
    data[i] = Math.random() * 2 - 1;
}

// Create a buffer source for our created data 
const noise = new AudioBufferSourceNode(audioCtx, {
    buffer: noiseBuffer
});

// connect through the audio graph and play it 
noise.connect(audioCtx.destination);
noise.start();