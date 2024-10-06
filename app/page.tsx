"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  const [roomId, setRoomId] = useState("");

  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 7);
    setRoomId(id);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <h1 className="text-4xl font-bold mb-8 text-foreground">
        WebRTC Voice and Video Call App
      </h1>

      <Card className="w-full max-w-md mb-8">
        <CardHeader>
          <CardTitle>How to Make a Call</CardTitle>
          <CardDescription>
            Follow these steps to connect with others
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Click &apos;Generate Room ID&apos; or enter a custom Room ID
            </li>
            <li>Share the Room ID with the person you want to call</li>
            <li>Both users should enter the same Room ID</li>
            <li>Choose either Voice Call or Video Call to connect</li>
          </ol>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center space-y-4 w-full max-w-md">
        <Input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="w-full"
        />
        <Button onClick={generateRoomId} className="w-full">
          Generate Room ID
        </Button>
        <div className="flex space-x-4 w-full">
          <Button asChild className="w-1/2" disabled={!roomId}>
            <Link href={`/voice-call?roomId=${roomId}`}>Start Voice Call</Link>
          </Button>
          {/* <Button asChild className="w-1/2" disabled={!roomId}>
            <Link href={`/video-call?roomId=${roomId}`}>Start Video Call</Link>
          </Button> */}
          <Button asChild className="w-1/2" disabled={!roomId}>
            <Link href={`/rtc?roomId=${roomId}`}>Start Video RTC</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
