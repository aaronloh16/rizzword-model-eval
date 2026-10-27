import { redirect } from "next/navigation";
import { latestPuzzle } from "@/lib/data";

export default function PlayToday() {
  redirect(`/play/${latestPuzzle().id}`);
}
