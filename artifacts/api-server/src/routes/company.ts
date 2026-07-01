import { Router, type IRouter } from "express";
import { db, schema, eq, and, asc, desc } from "../lib/db";
import { asyncHandler } from "../lib/http";
import { requireRole } from "../lib/principal";
import { enrollmentScope, userScope } from "../lib/scope";

const router: IRouter = Router();

router.get(
  "/company/overview",
  asyncHandler(async (req, res) => {
    const p = await requireRole(req, "COMPANY_VIEWER", "ADMIN");
    const enrollments = await db.query.enrollment.findMany({
      where: enrollmentScope(p),
      orderBy: [desc(schema.enrollment.createdAt)],
      with: {
        user: { columns: { id: true, name: true, email: true } },
        cohort: { columns: { id: true, name: true } },
        moduleProgress: { columns: { status: true, completedAt: true } },
      },
    });
    const company = p.companyId
      ? await db.query.company.findFirst({ where: eq(schema.company.id, p.companyId), columns: { id: true, name: true } })
      : null;
    res.json({
      company: company ?? null,
      enrollments: enrollments.map((e) => ({
        id: e.id,
        userName: e.user?.name ?? null,
        userEmail: e.user?.email ?? "",
        cohortName: e.cohort?.name ?? "",
        completedCount: e.moduleProgress.filter((m) => m.status === "COMPLETED").length,
        status: e.status,
      })),
    });
  }),
);

router.get(
  "/company/people",
  asyncHandler(async (req, res) => {
    const p = await requireRole(req, "COMPANY_VIEWER", "ADMIN");
    const scope = userScope(p);
    const people = await db.query.user.findMany({
      where: scope ? and(scope, eq(schema.user.role, "PARTICIPANT")) : eq(schema.user.role, "PARTICIPANT"),
      orderBy: [asc(schema.user.name)],
      with: {
        enrollments: { with: { cohort: { columns: { name: true } }, moduleProgress: { columns: { status: true } } } },
      },
    });
    res.json(
      people.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        enrollments: u.enrollments.map((e) => ({
          cohortName: e.cohort?.name ?? "",
          completedCount: e.moduleProgress.filter((m) => m.status === "COMPLETED").length,
          status: e.status,
        })),
      })),
    );
  }),
);

export default router;
