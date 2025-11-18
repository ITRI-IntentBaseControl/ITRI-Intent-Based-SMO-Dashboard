import { auth } from "@/app/(auth)/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Database operations are no longer supported. Use backend API instead.
  return new Response(
    "Database operations are no longer supported. Use backend API instead.",
    { status: 501 }
  );
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const {
    content,
    title,
    kind,
  }: { content: string; title: string; kind: string } = await request.json();

  if (session.user?.id) {
    // Database operations are no longer supported. Use backend API instead.
    return new Response(
      "Database operations are no longer supported. Use backend API instead.",
      { status: 501 }
    );
  }
  return new Response("Unauthorized", { status: 401 });
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  const { timestamp }: { timestamp: string } = await request.json();

  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Database operations are no longer supported. Use backend API instead.
  return new Response(
    "Database operations are no longer supported. Use backend API instead.",
    { status: 501 }
  );
}
