import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createOrderNumber } from "../packages/domain/src/index.ts";

describe("createOrderNumber", () => {
  it("includes a timestamp part and a random suffix", () => {
    assert.equal(createOrderNumber(1_700_000_000_000, () => "abc123xyz"), "HCLOYW3VABC123");
  });

  it("sanitizes and pads a weak random suffix", () => {
    assert.equal(createOrderNumber(1_700_000_000_000, () => "!"), "HCLOYW3V000000");
  });
});
