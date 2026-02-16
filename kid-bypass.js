// ═══════════════════════════════════════════════════════
// k-ID Bypass — by kibty.town & Dziurwa14 & TheUnrealZaka
// Modified by: Sofinco
// Enhanced: Natural behavior simulation
// ═══════════════════════════════════════════════════════

var KIDBypass = (function(){
  'use strict';

  function randomInt(min,max){return Math.floor(Math.random()*(max-min+1))+min}
  function randomFloat(min,max){return Math.random()*(max-min)+min}
  function gaussianRandom(mean,std){var u=1-Math.random(),v=Math.random();return mean+std*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}

  // ─── HKDF-SHA256 Key Derivation ───
  async function deriveKey(nonce, timestamp, transactionId){
    var ikm = new TextEncoder().encode(nonce + timestamp + transactionId);
    var salt = new Uint8Array(32);
    var key = await crypto.subtle.importKey('raw', ikm, {name: 'HKDF'}, false, ['deriveBits']);
    var bits = await crypto.subtle.deriveBits(
      {name: 'HKDF', hash: 'SHA-256', salt: salt, info: new Uint8Array()},
      key, 256
    );
    return new Uint8Array(bits);
  }

  // ─── AES-GCM Encryption ───
  async function encryptPayload(payload, nonce, timestamp, transactionId){
    var key = await deriveKey(nonce, timestamp, transactionId);
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var cryptoKey = await crypto.subtle.importKey('raw', key, {name: 'AES-GCM'}, false, ['encrypt']);
    var encrypted = await crypto.subtle.encrypt(
      {name: 'AES-GCM', iv: iv, tagLength: 128},
      cryptoKey,
      new TextEncoder().encode(JSON.stringify(payload))
    );
    var ciphertext = new Uint8Array(encrypted.slice(0, -16));
    var authTag = new Uint8Array(encrypted.slice(-16));
    return {
      encrypted_payload: btoa(String.fromCharCode(...ciphertext)),
      auth_tag: btoa(String.fromCharCode(...authTag)),
      iv: btoa(String.fromCharCode(...iv)),
      timestamp: timestamp
    };
  }

  // ─── Z-Score Filter ───
  function zFilter(arr, threshold){
    if(arr.length < 2) return arr;
    var mean = arr.reduce((a,b)=>a+b,0) / arr.length;
    var std = Math.sqrt(arr.reduce((a,b)=>a+Math.pow(b-mean,2),0) / arr.length);
    if(std === 0) return arr;
    return arr.filter(x => Math.abs((x - mean) / std) <= threshold);
  }

  // ─── Age Predictions (Natural variance) ───
  function generatePredictions(targetAge){
    var raws = [];
    var baseAge = targetAge + gaussianRandom(0, 1.5);
    for(var i = 0; i < randomInt(10, 14); i++){
      var noise = gaussianRandom(0, 2.5);
      var drift = Math.sin(i * 0.5) * 1.2;
      raws.push(Math.max(18, Math.min(99, baseAge + noise + drift)));
    }
    var outputs = zFilter(raws, 2.0);
    var primary = zFilter(outputs, 2.0);
    var final = zFilter(primary, 2.0);
    
    return {
      raws: raws,
      outputs: outputs,
      primaryOutputs: primary,
      finalOutputs: final,
      xScaledShiftAmt: [0.02, -0.02][Math.random() < 0.5 ? 0 : 1],
      yScaledShiftAmt: [0.015, -0.015][Math.random() < 0.5 ? 0 : 1]
    };
  }

  // ─── Timeline Generation (Natural timing) ───
  function generateTimeline(maxTime){
    var entries = [];
    var lastTime = randomInt(1200, 2800);
    var numEvents = randomInt(2, 4);
    for(var i = 0; i < numEvents; i++){
      var duration = randomInt(400, 1200);
      var end = lastTime + duration;
      if(end < maxTime){
        entries.push([lastTime, end]);
        var gap = randomInt(1200, 2500) + Math.floor(gaussianRandom(0, 300));
        lastTime = end + Math.max(800, gap);
      }
    }
    return entries;
  }

  // ─── State Completion Times ───
  function calculateStateCompletionTimes(stateTimelines){
    var times = {};
    for(var key in stateTimelines){
      var timeline = stateTimelines[key];
      if(timeline.length < 1) continue;
      var totalDuration = 0;
      for(var i = 0; i < timeline.length; i++){
        totalDuration += timeline[i][1] - timeline[i][0];
      }
      times[key] = totalDuration;
    }
    return times;
  }

  // ─── Mouth Tracking (Natural behavior) ───
  function generateOpennessData(){
    var streak = [], speeds = [], failedReadings = [], failedSpeeds = [], failedIntervals = [];
    var lastTimestamp = Date.now() - randomInt(4500, 5500), isOpen = false, openStart = 0;
    var numEvents = randomInt(6, 10);
    
    for(var i = 0; i < numEvents; i++){
      var delay = randomInt(250, 550) + Math.floor(gaussianRandom(0, 100));
      var timestamp = lastTimestamp + delay;
      var threshold = 0.55 + gaussianRandom(0, 0.1);
      var value = Math.random();
      
      if(value > threshold && !isOpen){
        isOpen = true; openStart = timestamp;
        streak.push({start: timestamp, duration: 0});
      } else if(value < (threshold - 0.2) && isOpen){
        isOpen = false;
        var duration = timestamp - openStart;
        if(duration > 100){
          streak[streak.length - 1].duration = duration;
          speeds.push(duration > 0 ? 1000 / duration : 0);
        } else {
          streak.pop();
        }
      }
      
      if(value < 0.35){
        failedReadings.push({timestamp: timestamp, reason: 'insufficient_openness'});
        if(failedReadings.length > 1){
          var interval = timestamp - failedReadings[failedReadings.length - 2].timestamp;
          failedIntervals.push(interval);
          failedSpeeds.push(interval > 0 ? 1000 / interval : 0);
        }
      }
      lastTimestamp = timestamp;
    }
    
    return {
      recordedOpennessStreak: streak,
      recordedSpeeds: speeds,
      failedOpennessReadings: failedReadings,
      failedOpennessSpeeds: failedSpeeds,
      failedOpennessIntervals: failedIntervals
    };
  }

  // ─── Device List (Natural variation) ───
  function generateDevices(){
    var cameraPool = [
      'HD Webcam', 'Integrated Camera', 'USB Camera', 'FaceTime HD Camera',
      'Logitech Webcam', 'HP TrueVision HD', 'Lenovo EasyCamera', 'Dell Webcam'
    ];
    var numDevices = randomInt(2, 4);
    var cameras = [];
    var usedNames = new Set();
    
    for(var i = 0; i < numDevices; i++){
      var name = cameraPool[randomInt(0, cameraPool.length - 1)];
      while(usedNames.has(name)){
        name = cameraPool[randomInt(0, cameraPool.length - 1)];
      }
      usedNames.add(name);
      cameras.push(name);
    }
    
    var selected = cameras[randomInt(0, cameras.length - 1)];
    return {
      devices: cameras.map(function(label, i){
        return {
          deviceId: 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9),
          label: label,
          kind: 'videoinput'
        };
      }),
      selectedCamera: selected
    };
  }

  // ─── Main Payload Generator (Natural timing) ───
  function generatePayload(targetAge){
    var currentTime = Date.now() / 1000;
    var initialAdjustmentTime = randomInt(250, 750) + Math.floor(gaussianRandom(0, 100));
    var completionTime = randomInt(9000, 14000) + Math.floor(gaussianRandom(0, 1500));
    
    var nonce = Math.random().toString(36).substr(2, 16) + Math.random().toString(36).substr(2, 4);
    var timestamp = Date.now();
    var transactionId = 'txn_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 12);
    
    var predictions = generatePredictions(targetAge);
    var mouthTracking = generateOpennessData();
    var deviceInfo = generateDevices();
    
    var stateTimelines = {
      init: generateTimeline(completionTime),
      camera_ready: generateTimeline(completionTime),
      face_detected: generateTimeline(completionTime),
      mouth_tracking: generateTimeline(completionTime),
      predictions_start: generateTimeline(completionTime)
    };
    
    var stateCompletionTimes = calculateStateCompletionTimes(stateTimelines);
    
    var jitter = gaussianRandom(0, 500);
    var startOffset = completionTime + initialAdjustmentTime + randomInt(2200, 4800) + jitter;
    
    return {
      nonce: nonce,
      timestamp: timestamp,
      transactionId: transactionId,
      predictions: predictions,
      mouthTracking: mouthTracking,
      stateTimelines: stateTimelines,
      stateCompletionTimes: stateCompletionTimes,
      devices: deviceInfo.devices,
      selectedCamera: deviceInfo.selectedCamera,
      metadata: {
        sdk_path: './face-capture-v1.10.22.js',
        model_version: 'v.2025.0',
        cropper_version: 'v.0.0.3',
        start_time_stamp: currentTime - startOffset / 1000,
        end_time_stamp: currentTime + randomFloat(0.15, 0.45),
        txMode: 'experiment',
        timestamp: Date.now() - startOffset,
        isCameraPermissionGranted: true,
        completionTime: completionTime,
        deferredComputationStartedAt: currentTime - randomFloat(0.6, 1.8),
        instructionCompletionTime: completionTime + initialAdjustmentTime + randomInt(80, 180),
        initialAdjustmentTime: initialAdjustmentTime,
        completionState: 'COMPLETE'
      }
    };
  }

  // ─── Public API ───
  return {
    intercept: async function(targetAge){
      targetAge = targetAge || 25;
      var payload = generatePayload(targetAge);
      var encrypted = await encryptPayload(payload, payload.nonce, payload.timestamp, payload.transactionId);
      return {encrypted: encrypted, raw: payload};
    },
    test: function(targetAge){
      targetAge = targetAge || 25;
      return generatePayload(targetAge);
    }
  };
})();
