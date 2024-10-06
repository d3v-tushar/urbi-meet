import { answers, iceCandidates, offers } from "@/lib/state";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { roomId } = await req.json();

  // Remove the room's data from memory
  delete offers[roomId];
  delete answers[roomId];
  delete iceCandidates[roomId];

  return NextResponse.json({ success: true });
}
