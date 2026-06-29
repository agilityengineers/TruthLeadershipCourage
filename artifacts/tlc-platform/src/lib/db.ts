/**
 * Minimal in-memory Prisma-compatible client over `@/data/store`.
 *
 * Supports the read/write surface the migrated app uses:
 *   findMany / findFirst / findUnique / count / aggregate
 *   create / createMany / update / updateMany / delete / deleteMany / upsert
 * Query features: where (scalar eq + { in, not, lt, lte, gt, gte, contains,
 * startsWith }, AND/OR/NOT, relation filters via belongsTo/hasMany some|every|none),
 * include (nested, with where/orderBy/take), select, orderBy (single or array),
 * take, skip, and _count.
 *
 * This is NOT a general ORM — it implements only what the app needs, but it
 * lets every existing `db.model.query(...)` call site work unchanged.
 */
import { store } from "@/data/store";

type Row = Record<string, any>;
type Rel = ["belongsTo" | "hasOne" | "hasMany", string, string];

/** model -> relationName -> [kind, targetModel, key]
 *  belongsTo: this row's `key` === target.id
 *  hasOne/hasMany: target's `key` === this row's id
 */
const RELATIONS: Record<string, Record<string, Rel>> = {
  company: {
    users: ["hasMany", "user", "companyId"],
    memberships: ["hasMany", "membership", "companyId"],
    seats: ["hasMany", "seat", "companyId"],
    enrollments: ["hasMany", "enrollment", "companyId"],
    payments: ["hasMany", "payment", "companyId"],
    cohorts: ["hasMany", "cohort", "companyId"],
  },
  user: {
    company: ["belongsTo", "company", "companyId"],
    memberships: ["hasMany", "membership", "userId"],
    enrollments: ["hasMany", "enrollment", "userId"],
    trainerCohorts: ["hasMany", "cohort", "trainerId"],
    assessmentResponses: ["hasMany", "assessmentResponse", "userId"],
    sentMessages: ["hasMany", "message", "senderId"],
    threadMemberships: ["hasMany", "threadMember", "userId"],
    notifications: ["hasMany", "notification", "userId"],
    uploadedResources: ["hasMany", "resource", "uploadedById"],
    bookingsAsTrainer: ["hasMany", "coachingBooking", "trainerId"],
    consents: ["hasMany", "consentRecord", "userId"],
    auditLogs: ["hasMany", "auditLog", "actorId"],
    accounts: ["hasMany", "account", "userId"],
    sessions: ["hasMany", "session", "userId"],
  },
  membership: {
    user: ["belongsTo", "user", "userId"],
    company: ["belongsTo", "company", "companyId"],
  },
  program: {
    cohorts: ["hasMany", "cohort", "programId"],
    modules: ["hasMany", "module", "programId"],
    assessment: ["hasOne", "assessment", "programId"],
    resources: ["hasMany", "resource", "programId"],
  },
  cohort: {
    program: ["belongsTo", "program", "programId"],
    trainer: ["belongsTo", "user", "trainerId"],
    company: ["belongsTo", "company", "companyId"],
    enrollments: ["hasMany", "enrollment", "cohortId"],
    events: ["hasMany", "event", "cohortId"],
    seats: ["hasMany", "seat", "cohortId"],
    resources: ["hasMany", "resource", "cohortId"],
    threads: ["hasMany", "thread", "cohortId"],
    waitlist: ["hasMany", "waitlistEntry", "cohortId"],
    campaigns: ["hasMany", "emailCampaign", "cohortId"],
  },
  module: {
    program: ["belongsTo", "program", "programId"],
    resources: ["hasMany", "resource", "moduleId"],
    events: ["hasMany", "event", "moduleId"],
    progress: ["hasMany", "moduleProgress", "moduleId"],
  },
  event: {
    cohort: ["belongsTo", "cohort", "cohortId"],
    module: ["belongsTo", "module", "moduleId"],
    bookings: ["hasMany", "coachingBooking", "eventId"],
  },
  resource: {
    program: ["belongsTo", "program", "programId"],
    cohort: ["belongsTo", "cohort", "cohortId"],
    module: ["belongsTo", "module", "moduleId"],
    uploadedBy: ["belongsTo", "user", "uploadedById"],
  },
  assessment: {
    program: ["belongsTo", "program", "programId"],
    questions: ["hasMany", "question", "assessmentId"],
    responses: ["hasMany", "assessmentResponse", "assessmentId"],
  },
  question: {
    assessment: ["belongsTo", "assessment", "assessmentId"],
    answers: ["hasMany", "answerItem", "questionId"],
  },
  assessmentResponse: {
    assessment: ["belongsTo", "assessment", "assessmentId"],
    user: ["belongsTo", "user", "userId"],
    answers: ["hasMany", "answerItem", "responseId"],
  },
  answerItem: {
    response: ["belongsTo", "assessmentResponse", "responseId"],
    question: ["belongsTo", "question", "questionId"],
  },
  seat: {
    cohort: ["belongsTo", "cohort", "cohortId"],
    company: ["belongsTo", "company", "companyId"],
    enrollment: ["hasOne", "enrollment", "seatId"],
  },
  enrollment: {
    user: ["belongsTo", "user", "userId"],
    cohort: ["belongsTo", "cohort", "cohortId"],
    company: ["belongsTo", "company", "companyId"],
    seat: ["belongsTo", "seat", "seatId"],
    payment: ["hasOne", "payment", "enrollmentId"],
    shipment: ["hasOne", "shipment", "enrollmentId"],
    certificate: ["hasOne", "certificate", "enrollmentId"],
    moduleProgress: ["hasMany", "moduleProgress", "enrollmentId"],
    bookings: ["hasMany", "coachingBooking", "enrollmentId"],
  },
  payment: {
    enrollment: ["belongsTo", "enrollment", "enrollmentId"],
    company: ["belongsTo", "company", "companyId"],
    coupon: ["belongsTo", "coupon", "couponId"],
    refunds: ["hasMany", "refund", "paymentId"],
  },
  coupon: {
    payments: ["hasMany", "payment", "couponId"],
  },
  refund: {
    payment: ["belongsTo", "payment", "paymentId"],
  },
  shipment: {
    enrollment: ["belongsTo", "enrollment", "enrollmentId"],
  },
  moduleProgress: {
    enrollment: ["belongsTo", "enrollment", "enrollmentId"],
    module: ["belongsTo", "module", "moduleId"],
  },
  coachingBooking: {
    enrollment: ["belongsTo", "enrollment", "enrollmentId"],
    trainer: ["belongsTo", "user", "trainerId"],
    event: ["belongsTo", "event", "eventId"],
  },
  certificate: {
    enrollment: ["belongsTo", "enrollment", "enrollmentId"],
  },
  thread: {
    cohort: ["belongsTo", "cohort", "cohortId"],
    members: ["hasMany", "threadMember", "threadId"],
    messages: ["hasMany", "message", "threadId"],
  },
  threadMember: {
    thread: ["belongsTo", "thread", "threadId"],
    user: ["belongsTo", "user", "userId"],
  },
  message: {
    thread: ["belongsTo", "thread", "threadId"],
    sender: ["belongsTo", "user", "senderId"],
  },
  emailTemplate: {
    campaigns: ["hasMany", "emailCampaign", "templateId"],
  },
  emailCampaign: {
    template: ["belongsTo", "emailTemplate", "templateId"],
    cohort: ["belongsTo", "cohort", "cohortId"],
  },
  notification: {
    user: ["belongsTo", "user", "userId"],
  },
  waitlistEntry: {
    cohort: ["belongsTo", "cohort", "cohortId"],
  },
  consentRecord: {
    user: ["belongsTo", "user", "userId"],
  },
  auditLog: {
    actor: ["belongsTo", "user", "actorId"],
  },
  account: { user: ["belongsTo", "user", "userId"] },
  session: { user: ["belongsTo", "user", "userId"] },
  verificationToken: {},
};

function table(model: string): Row[] {
  if (!store[model]) store[model] = [];
  return store[model];
}

function resolveRelation(model: string, row: Row, rel: Rel): Row | Row[] | null {
  const [kind, target, key] = rel;
  const targetRows = table(target);
  if (kind === "belongsTo") {
    const fk = row[key];
    if (fk == null) return null;
    return targetRows.find((r) => r.id === fk) ?? null;
  }
  if (kind === "hasOne") {
    return targetRows.find((r) => r[key] === row.id) ?? null;
  }
  // hasMany
  return targetRows.filter((r) => r[key] === row.id);
}

function matchScalar(value: any, cond: any): boolean {
  if (cond === null) return value === null || value === undefined;
  if (typeof cond === "object" && cond !== null && !(cond instanceof Date)) {
    for (const [op, operand] of Object.entries(cond)) {
      switch (op) {
        case "equals":
          if (!eq(value, operand)) return false;
          break;
        case "in":
          if (!(Array.isArray(operand) && operand.some((o) => eq(value, o)))) return false;
          break;
        case "notIn":
          if (Array.isArray(operand) && operand.some((o) => eq(value, o))) return false;
          break;
        case "not":
          if (operand && typeof operand === "object" && !(operand instanceof Date)) {
            if (matchScalar(value, operand)) return false;
          } else if (eq(value, operand)) return false;
          break;
        case "lt":
          if (!(cmp(value, operand) < 0)) return false;
          break;
        case "lte":
          if (!(cmp(value, operand) <= 0)) return false;
          break;
        case "gt":
          if (!(cmp(value, operand) > 0)) return false;
          break;
        case "gte":
          if (!(cmp(value, operand) >= 0)) return false;
          break;
        case "contains":
          if (!String(value ?? "").toLowerCase().includes(String(operand).toLowerCase())) return false;
          break;
        case "startsWith":
          if (!String(value ?? "").toLowerCase().startsWith(String(operand).toLowerCase())) return false;
          break;
        case "endsWith":
          if (!String(value ?? "").toLowerCase().endsWith(String(operand).toLowerCase())) return false;
          break;
        default:
          return false;
      }
    }
    return true;
  }
  return eq(value, cond);
}

function eq(a: any, b: any): boolean {
  if (a instanceof Date || b instanceof Date) {
    const at = a instanceof Date ? a.getTime() : new Date(a).getTime();
    const bt = b instanceof Date ? b.getTime() : new Date(b).getTime();
    return at === bt;
  }
  return a === b;
}

function cmp(a: any, b: any): number {
  const av = a instanceof Date ? a.getTime() : a;
  const bv = b instanceof Date ? b.getTime() : b;
  if (av < bv) return -1;
  if (av > bv) return 1;
  return 0;
}

function matchWhere(model: string, row: Row, where: any): boolean {
  if (!where) return true;
  const rels = RELATIONS[model] ?? {};
  for (const [field, cond] of Object.entries(where)) {
    if (field === "AND") {
      const arr = Array.isArray(cond) ? cond : [cond];
      if (!arr.every((c) => matchWhere(model, row, c))) return false;
      continue;
    }
    if (field === "OR") {
      const arr = (cond as any[]) ?? [];
      if (arr.length && !arr.some((c) => matchWhere(model, row, c))) return false;
      continue;
    }
    if (field === "NOT") {
      const arr = Array.isArray(cond) ? cond : [cond];
      if (arr.some((c) => matchWhere(model, row, c))) return false;
      continue;
    }
    const rel = rels[field];
    // Compound unique key shorthand, e.g. { threadId_userId: { threadId, userId } }
    if (!rel && cond && typeof cond === "object" && !Array.isArray(cond) && !(cond instanceof Date)) {
      const keys = Object.keys(cond);
      if (keys.length > 1 && keys.join("_") === field) {
        if (!matchWhere(model, row, cond)) return false;
        continue;
      }
    }
    if (rel) {
      const [kind, target] = rel;
      const resolved = resolveRelation(model, row, rel);
      if (kind === "hasMany") {
        const list = (resolved as Row[]) ?? [];
        const c = cond as any;
        if (c.some !== undefined && !list.some((r) => matchWhere(target, r, c.some))) return false;
        if (c.every !== undefined && !list.every((r) => matchWhere(target, r, c.every))) return false;
        if (c.none !== undefined && list.some((r) => matchWhere(target, r, c.none))) return false;
      } else {
        // belongsTo / hasOne — nested where (optionally wrapped in `is`/`isNot`)
        const c = cond as any;
        if (c && typeof c === "object" && ("is" in c || "isNot" in c)) {
          if ("is" in c) {
            if (c.is === null) {
              if (resolved) return false;
            } else if (!resolved || !matchWhere(target, resolved as Row, c.is)) return false;
          }
          if ("isNot" in c) {
            if (resolved && matchWhere(target, resolved as Row, c.isNot)) return false;
          }
        } else if (cond === null) {
          if (resolved) return false;
        } else {
          if (!resolved || !matchWhere(target, resolved as Row, cond)) return false;
        }
      }
      continue;
    }
    // scalar field
    if (!matchScalar(row[field], cond)) return false;
  }
  return true;
}

function applyOrderBy(rows: Row[], orderBy: any): Row[] {
  if (!orderBy) return rows;
  const specs = Array.isArray(orderBy) ? orderBy : [orderBy];
  const out = [...rows];
  out.sort((a, b) => {
    for (const spec of specs) {
      for (const [field, dir] of Object.entries(spec)) {
        const c = cmp(a[field], b[field]);
        if (c !== 0) return dir === "desc" ? -c : c;
      }
    }
    return 0;
  });
  return out;
}

function project(model: string, row: Row, args: any): Row {
  if (!row) return row;
  const rels = RELATIONS[model] ?? {};
  // select takes precedence over include
  if (args?.select) {
    const out: Row = {};
    for (const [field, sel] of Object.entries(args.select)) {
      if (!sel) continue;
      if (field === "_count") {
        out._count = countRelations(model, row, (sel as any).select);
        continue;
      }
      const rel = rels[field];
      if (rel) {
        out[field] = includeRelation(model, row, rel, sel === true ? {} : sel);
      } else {
        out[field] = row[field];
      }
    }
    return out;
  }
  const out: Row = { ...row };
  if (args?.include) {
    for (const [field, sel] of Object.entries(args.include)) {
      if (!sel) continue;
      if (field === "_count") {
        out._count = countRelations(model, row, (sel as any).select);
        continue;
      }
      const rel = rels[field];
      if (rel) {
        out[field] = includeRelation(model, row, rel, sel === true ? {} : sel);
      }
    }
  }
  return out;
}

function countRelations(model: string, row: Row, sel: any): Row {
  const rels = RELATIONS[model] ?? {};
  const out: Row = {};
  for (const [field, on] of Object.entries(sel ?? {})) {
    if (!on) continue;
    const rel = rels[field];
    if (rel && rel[0] === "hasMany") {
      out[field] = (resolveRelation(model, row, rel) as Row[]).length;
    }
  }
  return out;
}

function includeRelation(model: string, row: Row, rel: Rel, subArgs: any): any {
  const [kind, target] = rel;
  const resolved = resolveRelation(model, row, rel);
  if (kind === "hasMany") {
    let list = (resolved as Row[]) ?? [];
    if (subArgs.where) list = list.filter((r) => matchWhere(target, r, subArgs.where));
    if (subArgs.orderBy) list = applyOrderBy(list, subArgs.orderBy);
    if (subArgs.skip) list = list.slice(subArgs.skip);
    if (subArgs.take != null) list = list.slice(0, subArgs.take);
    return list.map((r) => project(target, r, subArgs));
  }
  if (!resolved) return null;
  return project(target, resolved as Row, subArgs);
}

function findManyRows(model: string, args: any = {}): Row[] {
  let rows = table(model).filter((r) => matchWhere(model, r, args.where));
  if (args.orderBy) rows = applyOrderBy(rows, args.orderBy);
  if (args.skip) rows = rows.slice(args.skip);
  if (args.take != null) rows = rows.slice(0, args.take);
  return rows.map((r) => project(model, r, args));
}

let idCounter = 1;
function genId(model: string): string {
  return `${model}_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;
}

function createRow(model: string, args: any): Row {
  const data = { ...args.data };
  const now = new Date();
  const row: Row = { id: data.id ?? genId(model), ...data };
  if (!("createdAt" in row)) row.createdAt = now;
  if (RELATIONS[model] && !("updatedAt" in row)) {
    // only set updatedAt for models that have it; harmless extra field otherwise
  }
  table(model).push(row);
  return project(model, row, args);
}

function makeModel(model: string) {
  return {
    findMany: (args: any = {}) => findManyRows(model, args),
    findFirst: (args: any = {}) => {
      const rows = findManyRows(model, { ...args, take: undefined });
      return rows[0] ?? null;
    },
    findUnique: (args: any = {}) => {
      const rows = table(model).filter((r) => matchWhere(model, r, args.where));
      return rows[0] ? project(model, rows[0], args) : null;
    },
    findUniqueOrThrow: (args: any = {}) => {
      const rows = table(model).filter((r) => matchWhere(model, r, args.where));
      if (!rows[0]) throw new Error(`${model} not found`);
      return project(model, rows[0], args);
    },
    count: (args: any = {}) => table(model).filter((r) => matchWhere(model, r, args.where)).length,
    aggregate: (args: any = {}) => {
      const rows = table(model).filter((r) => matchWhere(model, r, args.where));
      const result: Row = {};
      if (args._count) result._count = rows.length;
      for (const op of ["_sum", "_avg", "_min", "_max"] as const) {
        if (!args[op]) continue;
        result[op] = {};
        for (const field of Object.keys(args[op])) {
          const vals = rows.map((r) => r[field]).filter((v) => typeof v === "number");
          if (op === "_sum") result[op][field] = vals.reduce((a, b) => a + b, 0);
          if (op === "_avg") result[op][field] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
          if (op === "_min") result[op][field] = vals.length ? Math.min(...vals) : null;
          if (op === "_max") result[op][field] = vals.length ? Math.max(...vals) : null;
        }
      }
      return result;
    },
    create: (args: any) => createRow(model, args),
    createMany: (args: any) => {
      const list = Array.isArray(args.data) ? args.data : [args.data];
      for (const data of list) createRow(model, { data });
      return { count: list.length };
    },
    update: (args: any) => {
      const row = table(model).find((r) => matchWhere(model, r, args.where));
      if (!row) throw new Error(`${model} not found`);
      Object.assign(row, args.data, { updatedAt: new Date() });
      return project(model, row, args);
    },
    updateMany: (args: any) => {
      const rows = table(model).filter((r) => matchWhere(model, r, args.where));
      for (const row of rows) Object.assign(row, args.data, { updatedAt: new Date() });
      return { count: rows.length };
    },
    upsert: (args: any) => {
      const row = table(model).find((r) => matchWhere(model, r, args.where));
      if (row) {
        Object.assign(row, args.update, { updatedAt: new Date() });
        return project(model, row, args);
      }
      return createRow(model, { data: { ...args.where, ...args.create }, include: args.include, select: args.select });
    },
    delete: (args: any) => {
      const arr = table(model);
      const idx = arr.findIndex((r) => matchWhere(model, r, args.where));
      if (idx < 0) throw new Error(`${model} not found`);
      const [row] = arr.splice(idx, 1);
      return project(model, row, args);
    },
    deleteMany: (args: any = {}) => {
      const arr = table(model);
      const keep = arr.filter((r) => !matchWhere(model, r, args.where));
      const removed = arr.length - keep.length;
      store[model] = keep;
      return { count: removed };
    },
  };
}

type ModelClient = ReturnType<typeof makeModel>;

const handler: ProxyHandler<Record<string, ModelClient>> = {
  get(targetObj, prop: string) {
    if (prop === "$transaction") {
      return (arg: any) => (Array.isArray(arg) ? arg : arg(db));
    }
    if (prop === "$connect" || prop === "$disconnect") return () => {};
    if (!targetObj[prop]) targetObj[prop] = makeModel(prop);
    return targetObj[prop];
  },
};

export const db = new Proxy({} as Record<string, ModelClient>, handler) as any;
export default db;
