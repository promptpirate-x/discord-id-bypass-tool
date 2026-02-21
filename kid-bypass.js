// ═══════════════════════════════════════════════════════
// k-ID Bypass — Working Implementation
// Based on: kibty.town & Dziurwa14
// Full verification via QR code scanning
// ═══════════════════════════════════════════════════════

var KIDBypass = (function(){
  'use strict';

  var API_ENDPOINT = 'https://age-verifier.kibty.town/api/verify';
  var verificationInProgress = false;
  var useStandaloneMode = false; // Toggle between API and Standalone

  // ─── QR Code Scanner (jsQR integration) ───
  async function decodeQRFromImage(file){
    if(typeof jsQR === 'undefined'){
      throw new Error('QR scanner library not loaded');
    }
    
    try {
      // Modern approach using createImageBitmap (same as k-id-age-verifier)
      var bitmap = await createImageBitmap(file);
      var canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      var ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);
      var imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
      var result = jsQR(imageData.data, imageData.width, imageData.height);
      
      if(result){
        return result.data;
      } else {
        throw new Error('No QR code found in image');
      }
    } catch(err) {
      // Fallback for older browsers
      return new Promise(function(resolve, reject){
        var reader = new FileReader();
        reader.onload = function(e){
          var img = new Image();
          img.onload = function(){
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var result = jsQR(imageData.data, imageData.width, imageData.height);
            if(result){
              resolve(result.data);
            } else {
              reject(new Error('No QR code found in image'));
            }
          };
          img.onerror = function(){reject(new Error('Failed to load image'))};
          img.src = e.target.result;
        };
        reader.onerror = function(){reject(new Error('Failed to read file'))};
        reader.readAsDataURL(file);
      });
    }
  }

  // ─── Verify via API or Standalone ───
  async function verifyWithQRCode(qrCodeUrl, onProgress){
    if(verificationInProgress){
      throw new Error('Verification already in progress');
    }
    
    verificationInProgress = true;
    
    try{
      if(useStandaloneMode){
        // Use standalone full implementation
        if(typeof KIDBypassStandalone === 'undefined'){
          throw new Error('Standalone mode not loaded. Please refresh the page.');
        }
        var result = await KIDBypassStandalone.verify(qrCodeUrl, onProgress);
        verificationInProgress = false;
        return result;
      } else {
        // Use API endpoint
        var response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'qr_link',
            identifier: qrCodeUrl
          })
        });
        
        if(!response.ok){
          var errorText = await response.text();
          throw new Error('Verification failed: ' + errorText);
        }
        
        var result = await response.json();
        verificationInProgress = false;
        return result;
      }
    } catch(err){
      verificationInProgress = false;
      throw err;
    }
  }

  // ─── Public API ───
  return {
    // Verify using QR code URL
    verify: async function(qrCodeUrl, onProgress){
      if(!qrCodeUrl || typeof qrCodeUrl !== 'string'){
        throw new Error('Invalid QR code URL');
      }
      return await verifyWithQRCode(qrCodeUrl, onProgress);
    },
    
    // Verify using QR code image file
    verifyFromImage: async function(imageFile){
      if(!imageFile || !(imageFile instanceof File)){
        throw new Error('Invalid image file');
      }
      var qrCodeUrl = await decodeQRFromImage(imageFile);
      return await verifyWithQRCode(qrCodeUrl);
    },
    
    // Check if verification is in progress
    isVerifying: function(){
      return verificationInProgress;
    },
    
    // Get API endpoint (for debugging)
    getEndpoint: function(){
      return API_ENDPOINT;
    },
    
    // Set verification mode
    setMode: function(mode){
      if(mode === 'standalone'){
        useStandaloneMode = true;
      } else if(mode === 'api'){
        useStandaloneMode = false;
      }
      return useStandaloneMode ? 'standalone' : 'api';
    },
    
    // Get current mode
    getMode: function(){
      return useStandaloneMode ? 'standalone' : 'api';
    }
  };
})();
