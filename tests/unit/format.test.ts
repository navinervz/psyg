import test, { describe } from "node:test";
import assert from "node:assert/strict";

import {
  formatPercent,
  formatPrice,
  formatRank,
  priceDelta,
  timeAgo,
  toFaDigits,
} from "@/lib/format";

describe("toFaDigits", () => {
  test("ارقام لاتین را فارسی می‌کند", () => {
    assert.equal(toFaDigits("0123456789"), "۰۱۲۳۴۵۶۷۸۹");
  });

  test("حروف غیرعددی را دست نمی‌زند", () => {
    assert.equal(toFaDigits("A1-B2"), "A۱-B۲");
  });
});

describe("formatPrice", () => {
  test("جداکننده هزارگان می‌گذارد و فارسی می‌کند", () => {
    assert.equal(formatPrice(9190000), "۹,۱۹۰,۰۰۰");
  });

  test("صفر را درست نمایش می‌دهد", () => {
    assert.equal(formatPrice(0), "۰");
  });
});

describe("priceDelta", () => {
  test("کاهش قیمت منفی است", () => {
    assert.ok(priceDelta(100, 80) < 0);
    assert.equal(priceDelta(100, 80), -20);
  });

  test("افزایش قیمت مثبت است", () => {
    assert.equal(priceDelta(100, 120), 20);
  });

  test("قیمت قبلی صفر باعث تقسیم بر صفر نمی‌شود", () => {
    assert.equal(priceDelta(0, 500), 0);
  });
});

describe("formatPercent", () => {
  test("همیشه قدرمطلق را با علامت درصد فارسی می‌دهد", () => {
    assert.equal(formatPercent(-26), "۲۶٪");
    assert.equal(formatPercent(9), "۹٪");
  });
});

describe("formatRank", () => {
  test("از صفر شروع می‌شود و دو رقمی است", () => {
    assert.equal(formatRank(0), "۰۱");
    assert.equal(formatRank(5), "۰۶");
    assert.equal(formatRank(11), "۱۲");
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-07-27T12:00:00.000Z");

  test("کمتر از یک دقیقه", () => {
    assert.equal(timeAgo("2026-07-27T11:59:40.000Z", now), "همین الان");
  });

  test("دقیقه", () => {
    assert.equal(timeAgo("2026-07-27T11:45:00.000Z", now), "۱۵ دقیقه پیش");
  });

  test("ساعت", () => {
    assert.equal(timeAgo("2026-07-27T09:00:00.000Z", now), "۳ ساعت پیش");
  });

  test("روز", () => {
    assert.equal(timeAgo("2026-07-24T12:00:00.000Z", now), "۳ روز پیش");
  });
});
