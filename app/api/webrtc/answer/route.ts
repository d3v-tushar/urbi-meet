import db from "@/database";
import { answersTable, InsertAnswer } from "@/database/schema";
import { NextRequest, NextResponse } from "next/server";

let answers: { [roomId: string]: RTCSessionDescriptionInit } = {};

export async function POST(req: NextRequest) {
  const { answer, roomId } = await req.json();

  // Save answer to the in-memory object
  answers[roomId] = answer;

  // Prepare answer data for the database
  const answerData: InsertAnswer = {
    roomId,
    answer: JSON.stringify(answer), // Store the answer as a string
  };

  // Insert answer into the database
  try {
    await db.insert(answersTable).values(answerData);
  } catch (error) {
    console.error("Error saving answer to database:", error);
    return NextResponse.json(
      { error: "Failed to save answer" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
