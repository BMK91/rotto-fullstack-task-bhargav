import {
  createSearchRequestSchema,
  searchFiltersSchema,
  searchPaginationSchema,
} from "./search.validator.js";

const tests = [
  {
    name: "accepts a valid search brief",
    result: createSearchRequestSchema.safeParse({
      brief: "Senior backend engineers with Node.js",
    }).success,
    expected: true,
  },
  {
    name: "rejects an empty search brief",
    result: createSearchRequestSchema.safeParse({ brief: "" }).success,
    expected: false,
  },
  {
    name: "rejects an unexpected request property",
    result: createSearchRequestSchema.safeParse({
      brief: "Backend developers",
      companyId: "acme",
    }).success,
    expected: false,
  },
  {
    name: "accepts valid structured filters",
    result: searchFiltersSchema.safeParse({
      skills: ["Node.js", "PostgreSQL"],
      seniority: ["senior"],
      minYearsExperience: 5,
      maxYearsExperience: 10,
    }).success,
    expected: true,
  },
  {
    name: "rejects an invalid experience range",
    result: searchFiltersSchema.safeParse({
      minYearsExperience: 10,
      maxYearsExperience: 5,
    }).success,
    expected: false,
  },
  {
    name: "rejects an unsupported seniority",
    result: searchFiltersSchema.safeParse({
      seniority: ["expert"],
    }).success,
    expected: false,
  },
  {
    name: "coerces a valid page query string",
    result: searchPaginationSchema.safeParse({ page: "2" }).success,
    expected: true,
  },
  {
    name: "rejects page zero",
    result: searchPaginationSchema.safeParse({ page: "0" }).success,
    expected: false,
  },
];

let failed = 0;

for (const test of tests) {
  const passed = test.result === test.expected;

  console.log(`${passed ? "PASS" : "FAIL"}: ${test.name}`);

  if (!passed) {
    failed += 1;
  }
}

if (failed > 0) {
  throw new Error(`${failed} schema validation test(s) failed.`);
}

console.log(`All ${tests.length} schema validation tests passed.`);
