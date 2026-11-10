import { eq, sql } from "drizzle-orm";
import type { Server } from "node:http";

import app from "@/app.js";
import { db } from "@/db/client.js";
import {
  shortlistCandidates,
  shortlists,
} from "@/db/schema/index.js";

interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    recruiter: {
      id: string;
      email: string;
      companyId: string;
      companyName: string;
    };
  };
}

let server: Server;
let baseUrl: string;
let acmeToken: string;
let globexToken: string;
let acmeCompanyId: string;
let globexCompanyId: string;
let acmeRecruiterId: string;
let globexRecruiterId: string;

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    failedCount++;
    throw new Error(message);
  } else {
    console.log(`  PASS: ${message}`);
    passedCount++;
  }
}

async function request(
  path: string,
  options: {
    method?: string;
    token?: string;
    body?: unknown;
  } = {},
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const fetchOptions: RequestInit = {
    method: options.method || "GET",
    headers,
  };

  if (options.body !== undefined) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${baseUrl}${path}`, fetchOptions);

  let json: any = null;
  const text = await response.text();
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  return {
    status: response.status,
    body: json,
  };
}

async function loginUser(email: string): Promise<LoginResponse> {
  const res = await request("/api/v1/auth/login", {
    method: "POST",
    body: {
      email,
      password: "rotto-assessment",
    },
  });

  if (res.status !== 200 || !res.body?.data?.accessToken) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  }

  return res.body;
}

async function runTests() {
  console.log("=== STARTING SHORTLIST TEST SUITE ===");

  // 1. Setup server
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 4000;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`Test server running at ${baseUrl}`);
      resolve();
    });
  });

  try {
    // 2. Authentication setup
    console.log("\n--- Authenticating ACME and GLOBEX recruiters ---");
    const acmeAuth = await loginUser("recruiter@acme.test");
    acmeToken = acmeAuth.data.accessToken;
    acmeCompanyId = acmeAuth.data.recruiter.companyId;
    acmeRecruiterId = acmeAuth.data.recruiter.id;

    const globexAuth = await loginUser("recruiter@globex.test");
    globexToken = globexAuth.data.accessToken;
    globexCompanyId = globexAuth.data.recruiter.companyId;
    globexRecruiterId = globexAuth.data.recruiter.id;

    assert(Boolean(acmeToken), "Acme recruiter authenticated successfully");
    assert(Boolean(globexToken), "Globex recruiter authenticated successfully");
    assert(acmeCompanyId !== globexCompanyId, "Acme and Globex have different company IDs");

    // Clean up any old test shortlists for these companies
    await db.delete(shortlists).where(eq(shortlists.companyId, acmeCompanyId));
    await db.delete(shortlists).where(eq(shortlists.companyId, globexCompanyId));

    // 3. Validation Tests
    console.log("\n--- Validation Tests ---");
    {
      const res = await request("/api/v1/shortlists", {
        method: "POST",
        token: acmeToken,
        body: { name: "" },
      });
      assert(res.status === 400, "Reject empty shortlist name (400)");
      assert(res.body.code === "VALIDATION_ERROR", "Error code is VALIDATION_ERROR");
    }

    {
      const res = await request("/api/v1/shortlists", {
        method: "POST",
        token: acmeToken,
        body: { name: "    " },
      });
      assert(res.status === 400, "Reject whitespace-only shortlist name (400)");
    }

    {
      const res = await request("/api/v1/shortlists", {
        method: "POST",
        token: acmeToken,
        body: { name: "a".repeat(101) },
      });
      assert(res.status === 400, "Reject shortlist name exceeding 100 characters (400)");
    }

    {
      const res = await request("/api/v1/shortlists", {
        method: "POST",
        token: acmeToken,
        body: { name: "Valid Name", companyId: globexCompanyId },
      });
      assert(res.status === 400, "Reject attempt to inject companyId into body (400)");
    }

    {
      const res = await request("/api/v1/shortlists/not-a-valid-uuid", {
        method: "GET",
        token: acmeToken,
      });
      assert(res.status === 400, "Reject invalid shortlist UUID (400)");
    }

    {
      const res = await request("/api/v1/shortlists/00000000-0000-0000-0000-000000000000", {
        method: "GET",
        token: acmeToken,
      });
      assert(res.status === 404, "Return 404 for non-existent shortlist");
      assert(res.body.code === "SHORTLIST_NOT_FOUND", "Error code is SHORTLIST_NOT_FOUND");
    }

    // 4. Functional Tests
    console.log("\n--- Functional Tests ---");
    let acmeShortlistId: string;
    {
      const res = await request("/api/v1/shortlists", {
        method: "POST",
        token: acmeToken,
        body: { name: "Senior Backend Developers" },
      });
      assert(res.status === 201, "Create shortlist returns 201");
      assert(res.body.success === true, "Response has success: true");
      assert(res.body.data.name === "Senior Backend Developers", "Created shortlist has correct name");
      assert(res.body.data.companyId === acmeCompanyId, "Created shortlist companyId matches authenticated recruiter");
      assert(res.body.data.recruiterId === acmeRecruiterId, "Created shortlist recruiterId matches authenticated recruiter");
      acmeShortlistId = res.body.data.id;
    }

    // Capitalize words test
    {
      const res = await request("/api/v1/shortlists", {
        method: "POST",
        token: acmeToken,
        body: { name: "junior python engineers" },
      });
      assert(res.status === 201, "Create lowercase shortlist name returns 201");
      assert(res.body.data.name === "Junior Python Engineers", "Shortlist name is capitalized word by word");
    }

    // Case-insensitive duplicate rejection test
    {
      const res = await request("/api/v1/shortlists", {
        method: "POST",
        token: acmeToken,
        body: { name: "JUNIOR PYTHON ENGINEERS" },
      });
      assert(res.status === 409, "Reject duplicate shortlist name with different casing (409)");
      assert(res.body.code === "DUPLICATE_SHORTLIST", "Error code is DUPLICATE_SHORTLIST");
    }

    // Test alias prefix /api/shortlists works too!
    {
      const res = await request("/api/shortlists", {
        method: "GET",
        token: acmeToken,
      });
      assert(res.status === 200, "GET /api/shortlists (without /v1) works cleanly");
      assert(Array.isArray(res.body.data), "Returns array of shortlists");
      assert(res.body.data.length === 2, "Returns 2 shortlists");
      assert(res.body.data[0].candidateCount === 0, "Initial candidateCount is 0");
      assert(res.body.data[0].name === "Junior Python Engineers", "First shortlist sorted alphabetically by name");
      assert(res.body.data[1].name === "Senior Backend Developers", "Second shortlist sorted alphabetically by name");
    }

    {
      const res = await request(`/api/v1/shortlists/${acmeShortlistId}`, {
        method: "GET",
        token: acmeToken,
      });
      assert(res.status === 200, "GET shortlist details returns 200");
      assert(res.body.data.id === acmeShortlistId, "Shortlist ID matches");
      assert(res.body.data.candidateCount === 0, "Details candidateCount is 0");
      assert(Array.isArray(res.body.data.candidates), "Details candidates is an array");
      assert(res.body.data.candidates.length === 0, "Details candidates is empty");
      assert(res.body.data.pagination.total === 0, "Pagination total is 0");
    }

    // Candidate validation on add
    {
      const res = await request(`/api/v1/shortlists/${acmeShortlistId}/candidates`, {
        method: "POST",
        token: acmeToken,
        body: { candidateId: "" },
      });
      assert(res.status === 400, "Reject empty candidateId (400)");
    }

    {
      const res = await request(`/api/v1/shortlists/${acmeShortlistId}/candidates`, {
        method: "POST",
        token: acmeToken,
        body: { candidateId: "invalid-id-xyz" },
      });
      assert(res.status === 400, "Reject malformed candidate ID / UUID (400)");
    }

    {
      const res = await request(`/api/v1/shortlists/${acmeShortlistId}/candidates`, {
        method: "POST",
        token: acmeToken,
        body: { candidateId: "cand_999999" },
      });
      assert(res.status === 404, "Return 404 for non-existent candidate ID");
      assert(res.body.code === "CANDIDATE_NOT_FOUND", "Error code is CANDIDATE_NOT_FOUND");
    }

    // Add candidate 1
    {
      const res = await request(`/api/v1/shortlists/${acmeShortlistId}/candidates`, {
        method: "POST",
        token: acmeToken,
        body: { candidateId: "cand_0001" },
      });
      assert(res.status === 201, "Add candidate cand_0001 returns 201");
      assert(res.body.data.shortlistId === acmeShortlistId, "Association has correct shortlistId");
      assert(res.body.data.candidateId === "cand_0001", "Association has correct candidateId");
    }

    // Duplicate candidate addition test
    {
      const res = await request(`/api/v1/shortlists/${acmeShortlistId}/candidates`, {
        method: "POST",
        token: acmeToken,
        body: { candidateId: "cand_0001" },
      });
      assert(res.status === 409, "Reject duplicate candidate addition with 409 Conflict");
      assert(res.body.code === "DUPLICATE_CANDIDATE", "Duplicate error code is DUPLICATE_CANDIDATE");
    }

    // Add candidate 2
    {
      const res = await request(`/api/v1/shortlists/${acmeShortlistId}/candidates`, {
        method: "POST",
        token: acmeToken,
        body: { candidateId: "cand_0002" },
      });
      assert(res.status === 201, "Add candidate cand_0002 returns 201");
    }

    // Verify candidate details and aggregation
    {
      const res = await request(`/api/v1/shortlists/${acmeShortlistId}`, {
        method: "GET",
        token: acmeToken,
      });
      assert(res.status === 200, "Fetch details after additions returns 200");
      assert(res.body.data.candidateCount === 2, "Candidate count is 2 in details");
      assert(res.body.data.candidates.length === 2, "Returned candidates array length is 2");
      assert(Boolean(res.body.data.candidates[0].fullName), "Candidate contains fullName");
      assert(Boolean(res.body.data.candidates[0].role), "Candidate contains role");
      assert(Array.isArray(res.body.data.candidates[0].skills), "Candidate contains skills array");
      assert(Boolean(res.body.data.candidates[0].addedAt), "Candidate contains addedAt timestamp");
    }

    {
      const res = await request("/api/v1/shortlists", {
        method: "GET",
        token: acmeToken,
      });
      assert(res.status === 200, "Get all shortlists returns 200");
      const acmeShortlist = res.body.data.find((s: any) => s.id === acmeShortlistId);
      assert(acmeShortlist?.candidateCount === 2, "Candidate count in summary aggregation is 2");
    }

    // Test candidateId filter for hasCandidate boolean
    {
      const res = await request(`/api/v1/shortlists?candidateId=cand_0001`, {
        method: "GET",
        token: acmeToken,
      });
      assert(res.status === 200, "Get shortlists with candidateId query returns 200");
      const matched = res.body.data.find((s: any) => s.id === acmeShortlistId);
      assert(matched?.hasCandidate === true, "Shortlist correctly reports hasCandidate: true");

      const res2 = await request(`/api/v1/shortlists?candidateId=cand_9999`, {
        method: "GET",
        token: acmeToken,
      });
      const unmatched = res2.body.data.find((s: any) => s.id === acmeShortlistId);
      assert(unmatched?.hasCandidate === false, "Shortlist correctly reports hasCandidate: false when candidate not in shortlist");
    }

    // Remove candidate
    {
      const res = await request(`/api/v1/shortlists/${acmeShortlistId}/candidates/cand_0001`, {
        method: "DELETE",
        token: acmeToken,
      });
      assert(res.status === 200, "Remove candidate cand_0001 returns 200");
    }

    // Remove already removed candidate
    {
      const res = await request(`/api/v1/shortlists/${acmeShortlistId}/candidates/cand_0001`, {
        method: "DELETE",
        token: acmeToken,
      });
      assert(res.status === 404, "Removing already removed candidate returns 404");
      assert(res.body.code === "CANDIDATE_NOT_IN_SHORTLIST", "Code is CANDIDATE_NOT_IN_SHORTLIST");
    }

    // Verify candidate count after remove
    {
      const res = await request(`/api/v1/shortlists/${acmeShortlistId}`, {
        method: "GET",
        token: acmeToken,
      });
      assert(res.body.data.candidateCount === 1, "Candidate count is now 1 after deletion");
      assert(res.body.data.candidates[0].id === "cand_0002", "Remaining candidate is cand_0002");
    }

    // 5. Security & Isolation Tests
    console.log("\n--- Security & Multi-tenant Isolation Tests ---");
    // Unauthenticated access
    {
      const endpoints = [
        { method: "GET", path: "/api/v1/shortlists" },
        { method: "POST", path: "/api/v1/shortlists", body: { name: "Test" } },
        { method: "GET", path: `/api/v1/shortlists/${acmeShortlistId}` },
        { method: "POST", path: `/api/v1/shortlists/${acmeShortlistId}/candidates`, body: { candidateId: "cand_0003" } },
        { method: "DELETE", path: `/api/v1/shortlists/${acmeShortlistId}/candidates/cand_0002` },
        { method: "DELETE", path: `/api/v1/shortlists/${acmeShortlistId}` },
      ];

      for (const ep of endpoints) {
        const res = await request(ep.path, { method: ep.method, body: ep.body });
        assert(res.status === 401, `Unauthenticated ${ep.method} ${ep.path} rejected with 401`);
        assert(res.body.code === "UNAUTHORIZED", "Error code is UNAUTHORIZED");
      }
    }

    // Create GLOBEX shortlist
    let globexShortlistId: string;
    {
      const res = await request("/api/v1/shortlists", {
        method: "POST",
        token: globexToken,
        body: { name: "Globex Frontend Team" },
      });
      assert(res.status === 201, "Globex creates shortlist successfully");
      globexShortlistId = res.body.data.id;
    }

    // ACME viewing all shortlists: must NOT see Globex shortlist
    {
      const res = await request("/api/v1/shortlists", {
        method: "GET",
        token: acmeToken,
      });
      assert(res.status === 200, "Acme retrieves shortlists");
      const ids = res.body.data.map((s: any) => s.id);
      assert(ids.includes(acmeShortlistId), "Acme list contains Acme shortlist");
      assert(!ids.includes(globexShortlistId), "Acme list DOES NOT contain Globex shortlist");
    }

    // GLOBEX viewing all shortlists: must NOT see Acme shortlist
    {
      const res = await request("/api/v1/shortlists", {
        method: "GET",
        token: globexToken,
      });
      assert(res.status === 200, "Globex retrieves shortlists");
      const ids = res.body.data.map((s: any) => s.id);
      assert(ids.includes(globexShortlistId), "Globex list contains Globex shortlist");
      assert(!ids.includes(acmeShortlistId), "Globex list DOES NOT contain Acme shortlist");
    }

    // ACME accessing GLOBEX shortlist details -> 404
    {
      const res = await request(`/api/v1/shortlists/${globexShortlistId}`, {
        method: "GET",
        token: acmeToken,
      });
      assert(res.status === 404, "ACME cannot access GLOBEX shortlist details (404)");
    }

    // GLOBEX accessing ACME shortlist details -> 404
    {
      const res = await request(`/api/v1/shortlists/${acmeShortlistId}`, {
        method: "GET",
        token: globexToken,
      });
      assert(res.status === 404, "GLOBEX cannot access ACME shortlist details (404)");
    }

    // ACME adding candidate to GLOBEX shortlist -> 404
    {
      const res = await request(`/api/v1/shortlists/${globexShortlistId}/candidates`, {
        method: "POST",
        token: acmeToken,
        body: { candidateId: "cand_0003" },
      });
      assert(res.status === 404, "ACME cannot add candidate to GLOBEX shortlist (404)");
    }

    // First let Globex add cand_0003 to Globex shortlist
    {
      const res = await request(`/api/v1/shortlists/${globexShortlistId}/candidates`, {
        method: "POST",
        token: globexToken,
        body: { candidateId: "cand_0003" },
      });
      assert(res.status === 201, "Globex adds cand_0003 to Globex shortlist");
    }

    // ACME removing candidate from GLOBEX shortlist -> 404
    {
      const res = await request(`/api/v1/shortlists/${globexShortlistId}/candidates/cand_0003`, {
        method: "DELETE",
        token: acmeToken,
      });
      assert(res.status === 404, "ACME cannot remove candidate from GLOBEX shortlist (404)");
    }

    // ACME deleting GLOBEX shortlist -> 404
    {
      const res = await request(`/api/v1/shortlists/${globexShortlistId}`, {
        method: "DELETE",
        token: acmeToken,
      });
      assert(res.status === 404, "ACME cannot delete GLOBEX shortlist (404)");
    }

    // Verify Globex shortlist still exists and still has candidate
    {
      const res = await request(`/api/v1/shortlists/${globexShortlistId}`, {
        method: "GET",
        token: globexToken,
      });
      assert(res.status === 200, "Globex shortlist still intact");
      assert(res.body.data.candidateCount === 1, "Globex candidateCount still 1");
    }

    // 6. Concurrency and Integrity Tests
    console.log("\n--- Concurrency & Database Integrity Tests ---");
    // Concurrent duplicate candidate additions
    {
      console.log("  Executing 5 concurrent requests to add candidate cand_0004...");
      const promises = [1, 2, 3, 4, 5].map(() =>
        request(`/api/v1/shortlists/${acmeShortlistId}/candidates`, {
          method: "POST",
          token: acmeToken,
          body: { candidateId: "cand_0004" },
        }),
      );

      const results = await Promise.all(promises);
      const successes = results.filter((r) => r.status === 201);
      const conflicts = results.filter((r) => r.status === 409);

      assert(successes.length === 1, `Exactly 1 concurrent addition succeeded (got ${successes.length})`);
      assert(conflicts.length === 4, `Other 4 concurrent additions received 409 Conflict (got ${conflicts.length})`);
    }

    // Unique constraint in database
    {
      const rows = await db
        .select()
        .from(shortlistCandidates)
        .where(
          sql`${shortlistCandidates.shortlistId} = ${acmeShortlistId} AND ${shortlistCandidates.candidateId} = 'cand_0004'`,
        );
      assert(rows.length === 1, "Database contains exactly one association for cand_0004");
    }

    // Foreign-key integrity: attempting to directly insert non-existent candidate ID into shortlist_candidates in DB
    {
      let caughtFkError = false;
      try {
        await db.insert(shortlistCandidates).values({
          shortlistId: acmeShortlistId,
          candidateId: "non_existent_cand_xyz",
        });
      } catch (err: any) {
        caughtFkError = true;
        const code = err?.code ?? err?.cause?.code;
        assert(code === "23503", "Foreign key constraint 23503 enforced on candidate_id");
      }
      assert(caughtFkError, "Database rejected non-existent foreign key candidate_id");
    }

    // Foreign-key cascade deletion test
    {
      // Add another candidate cand_0005 to acmeShortlistId
      await request(`/api/v1/shortlists/${acmeShortlistId}/candidates`, {
        method: "POST",
        token: acmeToken,
        body: { candidateId: "cand_0005" },
      });

      // Confirm shortlist has candidates in database
      const associationsBefore = await db
        .select()
        .from(shortlistCandidates)
        .where(eq(shortlistCandidates.shortlistId, acmeShortlistId));
      assert(associationsBefore.length >= 2, `Shortlist has ${associationsBefore.length} candidates before deletion`);

      // Delete the shortlist
      const deleteRes = await request(`/api/v1/shortlists/${acmeShortlistId}`, {
        method: "DELETE",
        token: acmeToken,
      });
      assert(deleteRes.status === 200, "Delete shortlist returned 200 OK");

      // Verify associated records are deleted through foreign-key cascade
      const associationsAfter = await db
        .select()
        .from(shortlistCandidates)
        .where(eq(shortlistCandidates.shortlistId, acmeShortlistId));
      assert(associationsAfter.length === 0, "All candidate associations deleted via CASCADE");

      // Verify shortlist itself is deleted
      const checkShortlist = await request(`/api/v1/shortlists/${acmeShortlistId}`, {
        method: "GET",
        token: acmeToken,
      });
      assert(checkShortlist.status === 404, "Deleted shortlist returns 404");
    }

    // Cleanup Globex shortlist
    await request(`/api/v1/shortlists/${globexShortlistId}`, {
      method: "DELETE",
      token: globexToken,
    });

    console.log(`\n========================================`);
    console.log(`TOTAL PASSED: ${passedCount}`);
    console.log(`TOTAL FAILED: ${failedCount}`);
    console.log(`========================================`);

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution error:", error);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    process.exit(0);
  }
}

runTests();
