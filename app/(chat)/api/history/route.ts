import { auth } from "@/app/(auth)/auth";

export async function GET() {
  const session = await auth();

  if (!session || !session.user) {
    return Response.json("Unauthorized!", { status: 401 });
  }

  // Database operations are no longer supported. Use backend API instead.
  return Response.json([], { status: 200 });
}
