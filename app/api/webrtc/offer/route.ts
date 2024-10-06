// app/api/webrtc/offer/route.ts
import db from "@/database";
import { InsertOffer, offersTable } from "@/database/schema";
import { NextRequest, NextResponse } from "next/server";

let offers: { [roomId: string]: RTCSessionDescriptionInit } = {};

export async function POST(req: NextRequest) {
  const { offer, roomId } = await req.json();

  // Save offer to the in-memory object
  offers[roomId] = offer;

  // Prepare offer data for the database
  const offerData: InsertOffer = {
    roomId,
    offer: JSON.stringify(offer), // Store the offer as a string
  };

  // Insert offer into the database
  try {
    await db.insert(offersTable).values(offerData);
  } catch (error) {
    console.error("Error saving offer to database:", error);
    return NextResponse.json(
      { error: "Failed to save offer" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
