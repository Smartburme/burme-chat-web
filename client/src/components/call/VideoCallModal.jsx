import { useState, useEffect, useRef } from 'react';
import { Modal, Button, message } from 'antd';
import { PhoneOutlined, CloseOutlined } from '@ant-design/icons';
import socket from '../../services/socketService';
import { useTranslation } from 'react-i18next';

const VideoCallModal = ({ callId, onEndCall }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState('connecting');
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const pcRef = useRef();
  const { t } = useTranslation();

  useEffect(() => {
    const setupCall = async () => {
      try {
        // 1. Get local media stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setLocalStream(stream);
        localVideoRef.current.srcObject = stream;

        // 2. Create peer connection
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        });
        pcRef.current = pc;

        // 3. Add local stream to connection
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        // 4. Handle remote stream
        pc.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
          remoteVideoRef.current.srcObject = event.streams[0];
          setCallStatus('active');
        };

        // 5. Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('call-signal', {
              callId,
              type: 'candidate',
              data: event.candidate
            });
          }
        };

        // 6. Listen for signals
        socket.on('call-signal', handleSignal);

      } catch (err) {
        message.error(t('call_setup_failed'));
        onEndCall();
      }
    };

    if (callId) setupCall();

    return () => {
      if (pcRef.current) pcRef.current.close();
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      socket.off('call-signal', handleSignal);
    };
  }, [callId]);

  const handleSignal = async ({ type, data }) => {
    const pc = pcRef.current;
    try {
      if (type === 'offer') {
        await pc.setRemoteDescription(data);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socket.emit('call-signal', {
          callId,
          type: 'answer',
          data: answer
        });
      } 
      else if (type === 'answer') {
        await pc.setRemoteDescription(data);
      } 
      else if (type === 'candidate') {
        await pc.addIceCandidate(data);
      }
    } catch (err) {
      console.error('Signal handling error:', err);
    }
  };

  const endCall = () => {
    socket.emit('end-call', { callId });
    onEndCall();
  };

  return (
    <Modal
      visible={!!callId}
      footer={null}
      closable={false}
      width={800}
      centered
      className="video-call-modal"
    >
      <div className="video-container">
        <div className="remote-video">
          <video ref={remoteVideoRef} autoPlay playsInline />
          {callStatus === 'connecting' && (
            <div className="call-status">{t('waiting_for_answer')}</div>
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
            className="end-call-btn"
          />
        </div>
      </div>
    </Modal>
  );
};

export default VideoCallModal;
