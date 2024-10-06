"use client";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [offerSignal, setOfferSignal] = useState("");
  const [answerSignal, setAnswerSignal] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    initializePeerConnection();
  }, []);

  const initializePeerConnection = () => {
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

    peerConnection.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("New ICE candidate:", event.candidate);
      }
    };

    peerConnection.current.onconnectionstatechange = () => {
      setConnectionStatus(peerConnection.current?.connectionState || "");
    };
  };

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus(""), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);

      stream.getTracks().forEach((track) => {
        if (peerConnection.current) {
          peerConnection.current.addTrack(track, stream);
        }
      });

      setIsHost(true);
      const offer = await peerConnection.current?.createOffer();
      await peerConnection.current?.setLocalDescription(offer);
      setOfferSignal(JSON.stringify(offer));
    } catch (error) {
      console.error("Error starting call:", error);
    }
  };

  const joinCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);

      stream.getTracks().forEach((track) => {
        if (peerConnection.current) {
          peerConnection.current.addTrack(track, stream);
        }
      });

      setIsHost(false);
    } catch (error) {
      console.error("Error joining call:", error);
    }
  };

  const handleProcessOffer = async (offerStr: string) => {
    try {
      const offer = JSON.parse(offerStr);
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        setAnswerSignal(JSON.stringify(answer));
      }
    } catch (error) {
      console.error("Error processing offer:", error);
      alert("Invalid offer format. Please check the offer and try again.");
    }
  };

  const handleProcessAnswer = async (answerStr: string) => {
    try {
      const answer = JSON.parse(answerStr);
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    } catch (error) {
      console.error("Error processing answer:", error);
      alert("Invalid answer format. Please check the answer and try again.");
    }
  };

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
            <div className="flex gap-4">
              <button
                onClick={startCall}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Start New Call (as Host)
              </button>
              <button
                onClick={joinCall}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                Join Existing Call
              </button>
            </div>
          )}

          {isHost && offerSignal && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border">
                <h3 className="font-semibold text-lg mb-2">
                  Step 1: Share this offer with the other person
                </h3>
                <div className="relative">
                  <textarea
                    readOnly
                    value={offerSignal}
                    className="w-full p-2 border rounded bg-white font-mono text-sm"
                    rows={3}
                  />
                  <button
                    onClick={() => copyToClipboard(offerSignal)}
                    className="absolute top-2 right-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
                  >
                    {copyStatus || "Copy"}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border">
                <h3 className="font-semibold text-lg mb-2">
                  Step 2: Paste their answer here
                </h3>
                <div className="space-y-2">
                  <textarea
                    value={answerSignal}
                    onChange={(e) => setAnswerSignal(e.target.value)}
                    placeholder="Paste the answer you received here..."
                    className="w-full p-2 border rounded font-mono text-sm"
                    rows={3}
                  />
                  <button
                    onClick={() => handleProcessAnswer(answerSignal)}
                    className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
                    disabled={!answerSignal}
                  >
                    Complete Connection
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isHost && localStream && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border">
                <h3 className="font-semibold text-lg mb-2">
                  Step 1: Paste the offer from the host
                </h3>
                <div className="space-y-2">
                  <textarea
                    value={offerSignal}
                    onChange={(e) => setOfferSignal(e.target.value)}
                    placeholder="Paste the offer here..."
                    className="w-full p-2 border rounded font-mono text-sm"
                    rows={3}
                  />
                  <button
                    onClick={() => handleProcessOffer(offerSignal)}
                    className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
                    disabled={!offerSignal}
                  >
                    Process Offer
                  </button>
                </div>
              </div>

              {answerSignal && (
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <h3 className="font-semibold text-lg mb-2">
                    Step 2: Share this answer with the host
                  </h3>
                  <div className="relative">
                    <textarea
                      readOnly
                      value={answerSignal}
                      className="w-full p-2 border rounded bg-white font-mono text-sm"
                      rows={3}
                    />
                    <button
                      onClick={() => copyToClipboard(answerSignal)}
                      className="absolute top-2 right-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
                    >
                      {copyStatus || "Copy"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {connectionStatus && (
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
          )}
        </div>
      </div>
    </main>
  );
}
