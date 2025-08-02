import { useState, useEffect, useRef } from 'react';
import { Button, Modal, message } from 'antd';
import { PhoneOutlined, CloseOutlined } from '@ant-design/icons';
import socket from '../../services/socketService';

const VideoCall = ({ callId, onEndCall }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnection = useRef();

  useEffect(() => {
    if (!callId) return;

    const setupWebRTC = async () => {
      try {
        // Get local stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        localVideoRef.current.srcObject = stream;

        // Create peer connection
        peerConnection.current = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        // Add local stream to connection
        stream.getTracks().forEach(track => {
          peerConnection.current.addTrack(track, stream);
        });

        // Handle remote stream
        peerConnection.current.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
          remoteVideoRef.current.srcObject = event.streams[0];
          setIsCallActive(true);
        };

        // Handle ICE candidates
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('call-signal', {
              callId,
              type: 'candidate',
              data: event.candidate
            });
          }
        };

        // Listen for signals
        socket.on('call-signal', handleSignal);

      } catch (err) {
        message.error('Failed to start call: ' + err.message);
        onEndCall();
      }
    };

    setupWebRTC();

    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      socket.off('call-signal', handleSignal);
    };
  }, [callId]);

  const handleSignal = async ({ type, data }) => {
    try {
      if (type === 'offer') {
        await peerConnection.current.setRemoteDescription(data);
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        
        socket.emit('call-signal', {
          callId,
          type: 'answer',
          data: answer
        });
      } 
      else if (type === 'answer') {
        await peerConnection.current.setRemoteDescription(data);
      } 
      else if (type === 'candidate') {
        await peerConnection.current.addIceCandidate(data);
      }
    } catch (err) {
      console.error('Signal handling error:', err);
    }
  };

  const endCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    onEndCall();
  };

  return (
    <Modal
      visible={!!callId}
      footer={null}
      closable={false}
      width={800}
      centered
    >
      <div className="video-call-container">
        <div className="remote-video">
          {remoteStream ? (
            <video ref={remoteVideoRef} autoPlay playsInline />
          ) : (
            <div className="waiting-message">Connecting...</div>
          )}
        </div>
        
        <div className="local-video">
          <video ref={localVideoRef} autoPlay playsInline muted />
        </div>

        <div className="call-controls">
          <Button 
            type="primary" 
            danger 
            icon={<CloseOutlined />}
            onClick={endCall}
            size="large"
          />
        </div>
      </div>
    </Modal>
  );
};

export default VideoCall;
