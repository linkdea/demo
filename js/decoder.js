'use strict';

window.ga =
    window.ga ||
    function () {
        (ga.q = ga.q || []).push(arguments);
    };
ga("create", "UA-33848682-1", "auto");
ga("set", "transport", "beacon");
ga("send", "pageview");

let base_len = 50;
let freq_base = 3500;
let freq_incr = 200;

// Assuming the URL is https://xxx.com/?num=30&count=10
let params = new URLSearchParams(window.location.search);

if(params.has('base_len') && !isNaN(params.get('base_len'))) {
    base_len = Number(params.get('base_len')); // update global variable from the URL
    console.log(`base_len loaded from URL: ${base_len}`);
} else {
    console.log('No base_len parameter found in URL or it is not a number.');
}

if(params.has('freq_base') && !isNaN(params.get('freq_base'))) {
    freq_base = Number(params.get('freq_base')); // update global variable from the URL
    console.log(`freq_base loaded from URL: ${freq_base}`);
} else {
    console.log('No freq_base parameter found in URL or it is not a number.');
}

if(params.has('freq_incr') && !isNaN(params.get('freq_incr'))) {
    freq_incr = Number(params.get('freq_incr')); // update global variable from the URL
    console.log(`freq_incr loaded from URL: ${freq_incr}`);
} else {
    console.log('No freq_incr parameter found in URL or it is not a number.');
}


function aowl_decoder(decode_handler){
    Module.onRuntimeInitialized = function() {    // Make sure EMSCRIPTEN_BINDINGS are called before we try to use them

        var audioSelect = document.querySelector('select#audioSource');
        audioSelect.onchange = getStream;

        getStream().then(getDevices).then(gotDevices);

        function getDevices() {
            // AFAICT in Safari this only gets default devices until gUM is called :/
            return navigator.mediaDevices.enumerateDevices();
        }

        function gotDevices(deviceInfos) {
            window.deviceInfos = deviceInfos; // make available to console
            console.log('Available input and output devices:', deviceInfos);
            for (const deviceInfo of deviceInfos) {
                const option = document.createElement('option');
                option.value = deviceInfo.deviceId;
                if (deviceInfo.kind === 'audioinput') {
                    option.text = deviceInfo.label || `Microphone ${audioSelect.length + 1}`;
                    audioSelect.appendChild(option);
                }
            }
        }

        function handleError(error) {
            console.error('Error: ', error);
        }

        function getStream() {
            if (window.stream) {
                window.stream.getTracks().forEach(track => {
                    track.stop();
                });
            }
            const audioSource = audioSelect.value;
            const constraints = {
                audio: {deviceId: audioSource ? {exact: audioSource} : undefined}
            };
            return navigator.mediaDevices.getUserMedia(constraints).
                then(processStream).catch(handleError);
        }

        function processStream(stream) {
            window.stream = stream; // make stream available to console
            audioSelect.selectedIndex = [...audioSelect.options].
                findIndex(option => option.text === stream.getAudioTracks()[0].label);
        
            var audioContext;
            var bufferLength = 1000;
            let sampleRate = 24000;
            var audioContext = new (window.AudioContext || window.webkitAudioContext)({sampleRate: sampleRate});
            var analyser = audioContext.createAnalyser();
            audioContext.createMediaStreamSource(stream).connect(analyser);
            var dataArray = new Float32Array(bufferLength);

            var sampleBuilder = new Module.SampleBuilder(sampleRate, bufferLength);
            var freqBands = new Module.vector_float();
            freqBands.push_back(freq_base);
            for(let i=0; i<12; i++) freqBands.push_back(freq_incr);
            var segmentDecoder = new Module.SegmentDecoder(sampleRate, 3, base_len, 0, freqBands, 11, 10, 100)

            function update() {
                analyser.getFloatTimeDomainData(dataArray);
                for (let i=sampleBuilder.buffer_tail_index(dataArray[0], dataArray[1], dataArray[2]); i<dataArray.length; i++){
                    sampleBuilder.push_sample(dataArray[i]);
                    if(segmentDecoder.decode_sample(dataArray[i])){
                        var decoded = segmentDecoder.decoded();
                        if (decoded.length > 0 && decoded != segmentDecoder.zero_codes(6)) {
                            decode_handler(decoded);
                        }
                    }
                }
                requestAnimationFrame(update);
            }
            update();
        }

    };
}
