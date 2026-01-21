import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, { status: 200, ...init });
}

export function created<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, { status: 201, ...init });
}

export function badRequest(error: string, init?: ResponseInit) {
  return NextResponse.json({ error }, { status: 400, ...init });
}

export function unauthorized(error = "Unauthorized", init?: ResponseInit) {
  return NextResponse.json({ error }, { status: 401, ...init });
}

export function forbidden(error = "Forbidden", init?: ResponseInit) {
  return NextResponse.json({ error }, { status: 403, ...init });
}

export function notFound(error = "Not found", init?: ResponseInit) {
  return NextResponse.json({ error }, { status: 404, ...init });
}

export function serverError(error = "Server error", init?: ResponseInit) {
  return NextResponse.json({ error }, { status: 500, ...init });
}

export function tooManyRequests(error = "Too many requests", init?: ResponseInit) {
  return NextResponse.json({ error }, { status: 429, ...init });
}

// Generic response helper
export function createResponse<T>(data: T, init?: ResponseInit) {
  const status = init?.status || 200;
  if (status >= 400) {
    return NextResponse.json(data, { status, ...init });
  }
  return NextResponse.json({ data }, { status, ...init });
}
