import db from "@/database";
import { answersTable, offersTable } from "@/database/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");

  if (!roomId) {
    return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
  }

  // Fetch the offer from the database
  const offerResult = await db
    .select()
    .from(offersTable)
    .where(eq(offersTable.roomId, roomId))
    .execute();

  // Fetch the answer from the database
  const answerResult = await db
    .select()
    .from(answersTable)
    .where(eq(answersTable.roomId, roomId))
    .execute();

  // Check if an offer was found
  if (offerResult.length > 0) {
    const offer = offerResult[0].offer; // Assuming offer is stored as a string
    return NextResponse.json({ description: JSON.parse(offer) });
  }

  // Check if an answer was found
  if (answerResult.length > 0) {
    const answer = answerResult[0].answer; // Assuming answer is stored as a string
    return NextResponse.json({ description: JSON.parse(answer) });
  }

  // If neither offer nor answer is found
  return NextResponse.json({ description: null });
}
