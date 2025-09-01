import React from 'react';

function VideoCallArea({ localVideoRef, remoteVideoRef, remoteAudioRef, isRemoteVideoOff, isVideoOff, remoteAudioTrack, outputCanvasRef, outputCKCanvasRef, containerRef }) {
  return (
    <div className="main-video-area">
      {remoteAudioTrack && <audio ref={remoteAudioRef} autoPlay />}
      <div className="main-video-container">
        <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
        {isRemoteVideoOff && (
          <div className="video-overlay-text">
            <i className="bi bi-camera-video-off-fill" style={{ fontSize: '3em' }}></i>
            <p>사용자 카메라 꺼짐</p>
          </div>
        )}
      </div>

      <div className="pip-video-container" ref={containerRef}>
        <video ref={localVideoRef} autoPlay playsInline muted />
        <canvas ref={outputCanvasRef} className="local-video" />
        <canvas ref={outputCKCanvasRef} className="local-video" />
        {isVideoOff && (
          <div className="text-center video-overlay-text">
            <i className="bi bi-camera-video-off-fill" style={{ fontSize: '1.5em' }}></i>
            <p>내 카메라 꺼짐</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VideoCallArea;
