'use strict';

window.ga =
    window.ga ||
    function () {
        (ga.q = ga.q || []).push(arguments);
    };
ga("create", "UA-33848682-1", "auto");
ga("set", "transport", "beacon");
ga("send", "pageview");

function linkdea_wm_decoder(decode_handler){
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
            freqBands.push_back(3500);
            for(let i=0; i<12; i++) freqBands.push_back(200);
            var segmentDecoder = new Module.SegmentDecoder(sampleRate, 3, 50, 0, freqBands, 11, 10, 100)
            console.log('ddd');
        
            function update() {
                analyser.getFloatTimeDomainData(dataArray);
                for (let i=sampleBuilder.buffer_tail_index(dataArray[0], dataArray[1], dataArray[2]); i<dataArray.length; i++){
                    sampleBuilder.push_sample(dataArray[i]);
                    if(segmentDecoder.decode_sample(dataArray[i])){
                        var decoded = segmentDecoder.decoded();
                        if (decoded.length > 0) {
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