// app/api/webrtc/ice-candidate/route.ts
import db from "@/database";
import { iceCandidatesTable, InsertIceCandidate } from "@/database/schema";
import { NextRequest, NextResponse } from "next/server";

let iceCandidates: { [roomId: string]: RTCIceCandidateInit[] } = {};

export async function POST(req: NextRequest) {
  const { candidate, roomId } = await req.json();

  // Save candidate to the in-memory object
  if (!iceCandidates[roomId]) {
    iceCandidates[roomId] = [];
  }
  iceCandidates[roomId].push(candidate);

  // Prepare candidate data for the database
  const candidateData: InsertIceCandidate = {
    roomId,
    candidate: JSON.stringify(candidate), // Store the candidate as a string
  };

  // Insert candidate into the database
  try {
    await db.insert(iceCandidatesTable).values(candidateData);
  } catch (error) {
    console.error("Error saving ICE candidate to database:", error);
    return NextResponse.json(
      { error: "Failed to save ICE candidate" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
