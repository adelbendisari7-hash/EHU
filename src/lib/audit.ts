import { prisma } from "@/lib/prisma"

export async function writeAudit(opts: {
  userId?: string | null
  action: string
  entity: string
  entityId?: string | null
  details?: unknown
  ip?: string | null
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: opts.userId ?? null,
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId ?? null,
        details: opts.details ? (opts.details as import("@prisma/client").Prisma.InputJsonValue) : undefined,
        ip: opts.ip ?? null,
      },
    })
  } catch {
    // Never crash the main request because of a log failure
  }
}

export function getIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return null
}
