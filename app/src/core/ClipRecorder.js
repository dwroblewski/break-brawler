export class ClipRecorder {
  constructor(audioEngine) {
    this.audioEngine = audioEngine;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.clipDuration = 20000; // 20 seconds
    this.recordingStartTime = null;
    
    // Setup audio capture
    this.setupAudioCapture();
  }
  
  async setupAudioCapture() {
    try {
      // Create a MediaStreamDestination to capture audio
      this.destination = this.audioEngine.audioContext.createMediaStreamDestination();
      
      // Connect our master gain to the destination
      this.audioEngine.masterGain.connect(this.destination);
      
      // Create MediaRecorder with the stream
      const options = {
        mimeType: this.getSupportedMimeType(),
        audioBitsPerSecond: 128000
      };
      
      this.mediaRecorder = new MediaRecorder(this.destination.stream, options);
      
      // Setup event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = () => {
        this.processRecording();
      };
      
      console.log('Clip recorder initialized');
      
    } catch (error) {
      console.error('Failed to setup clip recorder:', error);
    }
  }
  
  getSupportedMimeType() {
    // Try different formats in order of preference
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/wav'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('Using audio format:', type);
        return type;
      }
    }
    
    console.warn('No preferred audio format supported, using default');
    return '';
  }
  
  startRecording() {
    if (!this.mediaRecorder || this.isRecording) {
      return false;
    }
    
    try {
      // Clear previous recording
      this.recordedChunks = [];
      this.recordingStartTime = Date.now();
      
      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms
      this.isRecording = true;
      
      console.log(`Started recording clip (${this.clipDuration/1000}s)`);
      
      // Auto-stop after clip duration
      setTimeout(() => {
        if (this.isRecording) {
          this.stopRecording();
        }
      }, this.clipDuration);
      
      // Emit recording started event
      window.dispatchEvent(new CustomEvent('recordingStarted', {
        detail: { duration: this.clipDuration }
      }));
      
      return true;
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      return false;
    }
  }
  
  stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) {
      return;
    }
    
    try {
      this.mediaRecorder.stop();
      this.isRecording = false;
      
      const duration = Date.now() - this.recordingStartTime;
      console.log(`Stopped recording after ${duration}ms`);
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }
  
  processRecording() {
    if (this.recordedChunks.length === 0) {
      console.warn('No audio data recorded');
      return;
    }
    
    // Create blob from recorded chunks
    const mimeType = this.mediaRecorder.mimeType;
    const blob = new Blob(this.recordedChunks, { type: mimeType });
    
    // Create URL for the blob
    const audioUrl = URL.createObjectURL(blob);
    
    const clipData = {
      blob,
      url: audioUrl,
      mimeType,
      duration: this.clipDuration / 1000,
      size: blob.size,
      timestamp: new Date().toISOString()
    };
    
    console.log('Clip processed:', {
      duration: clipData.duration,
      size: Math.round(clipData.size / 1024) + 'KB',
      format: mimeType
    });
    
    // Emit clip ready event
    window.dispatchEvent(new CustomEvent('clipReady', {
      detail: clipData
    }));
    
    // Store the latest clip
    this.latestClip = clipData;
  }
  
  getLatestClip() {
    return this.latestClip;
  }
  
  downloadClip(clip = null, filename = null) {
    const clipData = clip || this.latestClip;
    if (!clipData) {
      console.warn('No clip available to download');
      return false;
    }
    
    // Create filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const extension = this.getFileExtension(clipData.mimeType);
    const downloadName = filename || `break-brawler-clip-${timestamp}.${extension}`;
    
    // Create download link
    const link = document.createElement('a');
    link.href = clipData.url;
    link.download = downloadName;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('Downloaded clip:', downloadName);
    
    // Emit download event for telemetry
    window.dispatchEvent(new CustomEvent('telemetry', {
      detail: { 
        event: 'clip_download',
        filename: downloadName,
        size: clipData.size
      }
    }));
    
    return true;
  }
  
  shareClip(clip = null) {
    const clipData = clip || this.latestClip;
    if (!clipData) {
      console.warn('No clip available to share');
      return false;
    }
    
    // Check if Web Share API is supported
    if (navigator.share && navigator.canShare) {
      const shareData = {
        title: 'Break Brawler Clip',
        text: 'Check out this break I made!',
        files: [new File([clipData.blob], 'break-clip.wav', { type: clipData.mimeType })]
      };
      
      if (navigator.canShare(shareData)) {
        navigator.share(shareData)
          .then(() => {
            console.log('Clip shared successfully');
            
            // Emit share event for telemetry
            window.dispatchEvent(new CustomEvent('telemetry', {
              detail: { 
                event: 'share',
                channel: 'native'
              }
            }));
          })
          .catch((error) => {
            console.error('Error sharing clip:', error);
            // Fallback to download
            this.downloadClip(clipData);
          });
        
        return true;
      }
    }
    
    // Fallback: copy link to clipboard
    this.copyClipUrl(clipData);
    return true;
  }
  
  copyClipUrl(clipData) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(clipData.url)
        .then(() => {
          this.showMessage('Clip URL copied to clipboard!');
          
          // Emit share event
          window.dispatchEvent(new CustomEvent('telemetry', {
            detail: { 
              event: 'share',
              channel: 'clipboard'
            }
          }));
        })
        .catch(() => {
          this.downloadClip(clipData);
        });
    } else {
      // Final fallback: just download
      this.downloadClip(clipData);
    }
  }
  
  showMessage(text) {
    const message = document.createElement('div');
    message.textContent = text;
    message.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 10px 20px;
      border-radius: 20px;
      z-index: 1000;
      animation: fade-in-out 3s ease-in-out;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fade-in-out {
        0%, 100% { opacity: 0; transform: translateX(-50%) translateY(20px); }
        15%, 85% { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
      style.remove();
    }, 3000);
  }
  
  getFileExtension(mimeType) {
    const extensions = {
      'audio/webm': 'webm',
      'audio/ogg': 'ogg',
      'audio/mp4': 'm4a',
      'audio/wav': 'wav',
      'audio/mpeg': 'mp3'
    };
    
    for (const [mime, ext] of Object.entries(extensions)) {
      if (mimeType.includes(mime)) {
        return ext;
      }
    }
    
    return 'audio';
  }
  
  isSupported() {
    return !!(window.MediaRecorder && this.audioEngine.audioContext.createMediaStreamDestination);
  }
}