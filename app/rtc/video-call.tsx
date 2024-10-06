"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function VideoRTC() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallStarted, setIsCallStarted] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (roomId) {
      checkForRemoteDescription();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const setupPeerConnection = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setLocalStream(stream);

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    peerConnectionRef.current = peerConnection;

    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });

    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setRemoteStream(remoteStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendIceCandidate(event.candidate);
      }
    };
  };

  const startCall = async () => {
    await setupPeerConnection();
    if (peerConnectionRef.current) {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      await sendOffer(offer);
      setIsCallStarted(true);
    }
  };

  const sendOffer = async (offer: RTCSessionDescriptionInit) => {
    try {
      await fetch("/api/webrtc/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer, roomId }),
      });
    } catch (error) {
      console.error("Error sending offer:", error);
    }
  };

  const sendAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      await fetch("/api/webrtc/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer, roomId }),
      });
    } catch (error) {
      console.error("Error sending answer:", error);
    }
  };

  const sendIceCandidate = async (candidate: RTCIceCandidate) => {
    try {
      await fetch("/api/webrtc/ice-candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate, roomId }),
      });
    } catch (error) {
      console.error("Error sending ICE candidate:", error);
    }
  };

  const checkForRemoteDescription = async () => {
    try {
      const response = await fetch(`/api/webrtc/description?roomId=${roomId}`);
      const data = await response.json();
      if (data.description) {
        if (data.description.type === "offer") {
          await handleOffer(data.description);
        } else if (data.description.type === "answer") {
          await handleAnswer(data.description);
        }
      }
    } catch (error) {
      console.error("Error checking for remote description:", error);
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) {
      await setupPeerConnection();
    }
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      await sendAnswer(answer);
      setIsCallStarted(true);
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    }
  };

  const endCall = async () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    // Cleanup the room's data on the server
    await fetch("/api/webrtc/cleanup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId }),
    });

    setLocalStream(null);
    setRemoteStream(null);
    setIsCallStarted(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Video Call</h1>
      <p className="mb-4">Room ID: {roomId}</p>
      <div className="space-y-4">
        <div className="flex space-x-4">
          <video ref={localVideoRef} autoPlay muted className="w-1/2 h-auto" />
          <video ref={remoteVideoRef} autoPlay className="w-1/2 h-auto" />
        </div>
        {!isCallStarted ? (
          <Button onClick={startCall}>Start Call</Button>
        ) : (
          <Button onClick={endCall} variant="destructive">
            End Call
          </Button>
        )}
      </div>
    </div>
  );
}
