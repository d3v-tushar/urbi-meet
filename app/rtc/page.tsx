import { Suspense } from "react";
import dynamic from "next/dynamic";

const VideoRTC = dynamic(
  () => import("./video-call").then((module) => module.VideoRTC),
  { ssr: false }
);

export default function VideoCallPage() {
  return (
    <Suspense>
      <VideoRTC />
    </Suspense>
  );
}
