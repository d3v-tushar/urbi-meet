"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { io, Socket } from "socket.io-client";

export default function VoiceCall() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallStarted, setIsCallStarted] = useState(false);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io("http://localhost:3001");

    socketRef.current.on("connect", () => {
      console.log("Connected to signaling server");
      if (roomId) {
        socketRef.current!.emit("join-room", roomId);
      }
    });

    socketRef.current.on("offer", async (offer: RTCSessionDescriptionInit) => {
      if (!peerConnectionRef.current) {
        await setupPeerConnection();
      }
      await peerConnectionRef.current!.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      const answer = await peerConnectionRef.current!.createAnswer();
      await peerConnectionRef.current!.setLocalDescription(answer);
      socketRef.current!.emit("answer", answer, roomId);
    });

    socketRef.current.on(
      "answer",
      async (answer: RTCSessionDescriptionInit) => {
        await peerConnectionRef.current!.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    );

    socketRef.current.on(
      "ice-candidate",
      async (candidate: RTCIceCandidateInit) => {
        await peerConnectionRef.current!.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    );

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const setupPeerConnection = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setLocalStream(stream);
    if (localAudioRef.current) {
      localAudioRef.current.srcObject = stream;
    }

    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    stream.getTracks().forEach((track) => {
      peerConnectionRef.current!.addTrack(track, stream);
    });

    peerConnectionRef.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current!.emit("ice-candidate", event.candidate, roomId);
      }
    };
  };

  const startCall = async () => {
    await setupPeerConnection();
    const offer = await peerConnectionRef.current!.createOffer();
    await peerConnectionRef.current!.setLocalDescription(offer);
    socketRef.current!.emit("offer", offer, roomId);
    setIsCallStarted(true);
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsCallStarted(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Voice Call</h1>
      <p className="mb-4">Room ID: {roomId}</p>
      <div className="space-y-4">
        <audio ref={localAudioRef} autoPlay muted />
        <audio ref={remoteAudioRef} autoPlay />
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
