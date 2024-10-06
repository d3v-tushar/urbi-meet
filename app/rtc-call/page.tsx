"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import io from "socket.io-client";

export default function Home() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [roomId, setRoomId] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("");

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Handle receiving tracks
  const handleTrack = useCallback((event: RTCTrackEvent) => {
    setRemoteStream(event.streams[0]);
  }, []);

  // Handle ICE candidate events
  const handleICECandidate = useCallback(
    (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", {
          roomId,
          candidate: event.candidate,
        });
      }
    },
    [roomId]
  );

  // Handle connection state changes
  const handleConnectionStateChange = useCallback(() => {
    setConnectionStatus(peerConnection.current?.connectionState || "");
  }, []);

  // Initialize peer connection
  const initializePeerConnection = useCallback(() => {
    if (peerConnection.current) {
      peerConnection.current.close();
    }

    peerConnection.current = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
          ],
        },
      ],
    });

    peerConnection.current.ontrack = handleTrack;
    peerConnection.current.onicecandidate = handleICECandidate;
    peerConnection.current.onconnectionstatechange =
      handleConnectionStateChange;

    // Add local stream if it exists
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        if (peerConnection.current && localStream) {
          peerConnection.current.addTrack(track, localStream);
        }
      });
    }
  }, [
    localStream,
    handleTrack,
    handleICECandidate,
    handleConnectionStateChange,
  ]);

  // Handle receiving offer
  const handleReceiveOffer = useCallback(
    async (offer: RTCSessionDescriptionInit) => {
      try {
        if (!peerConnection.current) {
          initializePeerConnection();
        }
        await peerConnection.current?.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        const answer = await peerConnection.current?.createAnswer();
        await peerConnection.current?.setLocalDescription(answer);
        if (socketRef.current) {
          socketRef.current.emit("answer", { roomId, answer });
        }
      } catch (error) {
        console.error("Error handling offer:", error);
      }
    },
    [roomId, initializePeerConnection]
  );

  // Handle receiving answer
  const handleReceiveAnswer = useCallback(
    async (answer: RTCSessionDescriptionInit) => {
      try {
        if (peerConnection.current) {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
        }
      } catch (error) {
        console.error("Error handling answer:", error);
      }
    },
    []
  );

  // Handle receiving ICE candidate
  const handleNewICECandidate = useCallback(
    async (candidate: RTCIceCandidateInit) => {
      try {
        if (peerConnection.current) {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        }
      } catch (error) {
        console.error("Error handling ICE candidate:", error);
      }
    },
    []
  );

  // Initialize socket connection and event listeners
  useEffect(() => {
    const socket = io({
      path: "/api/socket",
    });

    socketRef.current = socket;

    socket.on("offer", handleReceiveOffer);
    socket.on("answer", handleReceiveAnswer);
    socket.on("ice-candidate", handleNewICECandidate);

    return () => {
      socket.off("offer", handleReceiveOffer);
      socket.off("answer", handleReceiveAnswer);
      socket.off("ice-candidate", handleNewICECandidate);
      socket.disconnect();
    };
  }, [handleReceiveOffer, handleReceiveAnswer, handleNewICECandidate]);

  // Handle local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Handle remote video stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Start call function
  const startCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);

      const newRoomId = Math.random().toString(36).substring(7);
      setRoomId(newRoomId);
      setIsHost(true);

      initializePeerConnection();

      if (socketRef.current) {
        socketRef.current.emit("join-room", newRoomId);

        // Create and send offer
        const offer = await peerConnection.current?.createOffer();
        await peerConnection.current?.setLocalDescription(offer);
        socketRef.current.emit("offer", { roomId: newRoomId, offer });
      }
    } catch (error) {
      console.error("Error starting call:", error);
    }
  }, [initializePeerConnection]);

  // Join call function
  const joinCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      setIsHost(false);

      initializePeerConnection();

      if (socketRef.current) {
        socketRef.current.emit("join-room", roomId);
      }
    } catch (error) {
      console.error("Error joining call:", error);
    }
  }, [roomId, initializePeerConnection]);

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Video Calling App</h1>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="relative">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-[300px] bg-gray-800 rounded-lg object-cover"
            />
            <p className="absolute bottom-2 left-2 text-white bg-black/50 px-2 rounded">
              You
            </p>
          </div>
          <div className="relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-[300px] bg-gray-800 rounded-lg object-cover"
            />
            <p className="absolute bottom-2 left-2 text-white bg-black/50 px-2 rounded">
              Remote
            </p>
          </div>
        </div>

        <div className="space-y-6 bg-white p-6 rounded-lg shadow">
          {!localStream && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={startCall}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  Start New Call
                </button>
              </div>
              <form
                onSubmit={() => joinCall()}
                className="flex flex-wrap gap-4"
              >
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter Room ID"
                  className="flex-1 px-4 py-2 border rounded"
                />
                <button
                  type="submit"
                  //   onClick={joinCall}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                  disabled={!roomId}
                >
                  Join Call
                </button>
              </form>
            </div>
          )}

          {isHost && roomId && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h3 className="font-semibold">Share this Room ID with others:</h3>
              <div className="flex gap-2 items-center mt-2">
                <input
                  type="text"
                  value={roomId}
                  readOnly
                  className="flex-1 px-4 py-2 bg-white border rounded"
                />
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(roomId)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          {connectionStatus ? (
            <div className="mt-4 p-2 bg-gray-100 rounded">
              <p>
                Connection Status:
                <span
                  className={`font-semibold ${
                    connectionStatus === "connected"
                      ? "text-green-600"
                      : connectionStatus === "connecting"
                      ? "text-yellow-600"
                      : connectionStatus === "disconnected"
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {" "}
                  {connectionStatus}
                </span>
              </p>
            </div>
          ) : (
            <p>Connection Seems Failed</p>
          )}
        </div>
      </div>
    </main>
  );
}
